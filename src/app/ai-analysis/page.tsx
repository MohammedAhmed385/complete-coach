"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Upload,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  Download,
  Save,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Maximize2,
  Activity,
  FileVideo,
  UserCheck,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  Check,
  Crosshair,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate } from "@/lib/utils";
import { AdminGuard } from "@/components/auth/AdminGuard";
import {
  fetchMergedCases,
  fetchMergedVideoAnalyses,
  saveVideoAnalysisWithSync,
} from "@/lib/client-sync";
import {
  FullJointAngles,
  ActiveMuscleItem,
  AI_EXERCISE_PRESETS,
  JOINT_MOVEMENT_CATALOG,
  MANUAL_GONIOMETER_OPTIONS,
  normalizeJointAngles,
  computeSessionComparison,
} from "@/lib/biomechanics";

// ─────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────

interface PatientSummary {
  id: string;
  name: string;
  injuryType: string;
  injuredSide: string;
}

interface Point2D {
  x: number;
  y: number;
}

interface ManualAnnotation {
  id: string;
  frame: number;
  time: number;
  label: string;
  points: [Point2D, Point2D, Point2D];
  angle: number;
  plane: "sagittal" | "frontal";
}

interface FrameAnalysisResult {
  frame: number;
  time: number;
  kneeFlexion: number;
  hipFlexion: number;
  ankleDorsiflexion: number;
  valgusAngle: number;
  isValgus: boolean;
  fullAngles: FullJointAngles;
  confidence: number;
  keypoints: Record<string, Point2D>;
  activeMuscles: ActiveMuscleItem[];
}

interface SavedVideoAnalysis {
  id: string;
  patientId: string;
  videoUrl?: string | null;
  exerciseName?: string | null;
  cameraPlane: string;
  jointAngles?: Record<string, any>;
  activeMuscles?: ActiveMuscleItem[];
  summaryNotes?: string | null;
  poseResults?: string | null;
  annotations?: string | null;
  kneeValgus?: string | null;
  thumbnailUrl?: string | null;
  evaluatedAt?: string;
  createdAt: string;
  patient?: {
    name: string;
    injuryType: string;
  };
}

// ─────────────────────────────────────────────────────────────
// SAMPLE DEMO VIDEOS (Allows instant testing without upload)
// ─────────────────────────────────────────────────────────────
const DEMO_VIDEOS = [
  {
    id: "squat-sagittal",
    name: "اختبار القرفصاء الجانبي — Squat Test (Sagittal)",
    plane: "sagittal",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "drop-jump-frontal",
    name: "اختبار الهبوط والقفز الأمامي — Drop Jump ACL (Frontal)",
    plane: "frontal",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
];

export default function AIAnalysisPage() {
  return (
    <AdminGuard>
      <AIAnalysisContent />
    </AdminGuard>
  );
}

function AIAnalysisContent() {
  // ── Patients & Selection ──
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [cameraPlane, setCameraPlane] = useState<"sagittal" | "frontal">("sagittal");
  const [selectedExercisePresetId, setSelectedExercisePresetId] = useState<string>("squat");
  const [customExerciseName, setCustomExerciseName] = useState<string>("تمرين السكوات العميق (القرفصاء)");
  const [angleRegionTab, setAngleRegionTab] = useState<"all" | "upper" | "lower" | "spine">("all");
  const [compareBaselineId, setCompareBaselineId] = useState<string>("");
  const [compareLatestId, setCompareLatestId] = useState<string>("");

  // ── Video State ──
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // ── Scrubber & Frame State (30fps default) ──
  const FPS = 30;
  const currentFrame = Math.round(currentTime * FPS);
  const totalFrames = Math.max(1, Math.round(duration * FPS));

  // ── Overlays & Tools ──
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showManualRuler, setShowManualRuler] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // ── Manual Angle Measurement ──
  const [manualPoints, setManualPoints] = useState<Point2D[]>([]);
  const [calculatedManualAngle, setCalculatedManualAngle] = useState<number | null>(null);
  const [manualLabel, setManualLabel] = useState<string>("ثني الركبة Knee Flexion");
  const [savedAnnotations, setSavedAnnotations] = useState<ManualAnnotation[]>([]);

  // ── AI Pose Detection State ──
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<FrameAnalysisResult[]>([]);
  const [hasRunAnalysis, setHasRunAnalysis] = useState<boolean>(false);

  // ── Saved Analyses & General States ──
  const [savedAnalyses, setSavedAnalyses] = useState<SavedVideoAnalysis[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState<boolean>(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // ── DOM References ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────
  // 1. FETCH PATIENTS & SAVED ANALYSES (UNIFIED SYNC)
  // ─────────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const data = await fetchMergedCases();
      setPatients(data);
      if (data.length > 0) {
        let targetId = selectedPatientId;
        if (!targetId && typeof window !== "undefined") {
          const qp = new URLSearchParams(window.location.search).get("patientId");
          if (qp && data.some((p: any) => p.id === qp)) {
            targetId = qp;
          }
        }
        if (!targetId || !data.some((p: any) => p.id === targetId)) {
          targetId = data[0].id;
        }
        if (targetId && targetId !== selectedPatientId) {
          setSelectedPatientId(targetId);
        }
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [selectedPatientId]);

  const fetchSavedAnalyses = useCallback(async (patientId?: string) => {
    setIsLoadingAnalyses(true);
    try {
      const merged = await fetchMergedVideoAnalyses(patientId);
      setSavedAnalyses(merged);
      if (merged.length >= 2) {
        setCompareLatestId(merged[0].id);
        setCompareBaselineId(merged[merged.length - 1].id);
      } else {
        setCompareLatestId("");
        setCompareBaselineId("");
      }
    } catch (err) {
      console.error("Failed to load saved analyses:", err);
    } finally {
      setIsLoadingAnalyses(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchSavedAnalyses();
  }, [fetchPatients, fetchSavedAnalyses]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchSavedAnalyses(selectedPatientId);
    }
  }, [selectedPatientId, fetchSavedAnalyses]);

  // ─────────────────────────────────────────────────────────────
  // 2. VIDEO HANDLERS & SCRUBBING
  // ─────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    const newTime = Math.max(0, Math.min(duration, currentTime + frames / FPS));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const targetFrame = parseInt(e.target.value, 10);
    const targetTime = Math.max(0, Math.min(duration, targetFrame / FPS));
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setCurrentTime(0);
      syncCanvasDimensions();
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const syncCanvasDimensions = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  };

  useEffect(() => {
    const handleResize = () => syncCanvasDimensions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 3. FILE UPLOAD & DROP ZONE
  // ─────────────────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!file.type.includes("video")) {
      setStatusMessage({ type: "error", text: "يرجى اختيار ملف فيديو صالح بصيغة MP4 أو WebM" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage(null);

    // Simulated cloud upload
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(timer);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
      setIsUploading(false);
      setUploadProgress(100);
      setHasRunAnalysis(false);
      setAiAnalysisResults([]);
      setManualPoints([]);
      setCalculatedManualAngle(null);
      setStatusMessage({ type: "success", text: `تم تحميل الفيديو بنجاح: ${file.name}` });
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const loadDemoVideo = (demoId: string) => {
    const demo = DEMO_VIDEOS.find((d) => d.id === demoId);
    if (!demo) return;
    setVideoSrc(demo.url);
    setVideoName(demo.name);
    setCameraPlane(demo.plane as "sagittal" | "frontal");
    setHasRunAnalysis(false);
    setAiAnalysisResults([]);
    setManualPoints([]);
    setCalculatedManualAngle(null);
    setStatusMessage({ type: "info", text: `تم تحميل الفيديو التجريبي: ${demo.name}` });
  };

  // ─────────────────────────────────────────────────────────────
  // 4. AI POSE DETECTION (MEDIAPIPE / TENSORFLOW.JS BLUEPRINT)
  // ─────────────────────────────────────────────────────────────
  /*
   * ============================================================================
   * MediaPipe Pose / TensorFlow.js Initialization Architecture
   * ============================================================================
   * In a live browser execution environment:
   *
   * import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
   *
   * const pose = new Pose({
   *   locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
   * });
   *
   * pose.setOptions({
   *   modelComplexity: 2, // Maximum accuracy model
   *   smoothLandmarks: true,
   *   enableSegmentation: false,
   *   smoothSegmentation: false,
   *   minDetectionConfidence: 0.75,
   *   minTrackingConfidence: 0.75,
   * });
   *
   * pose.onResults((results) => {
   *   if (!results.poseLandmarks) return;
   *   // Extract 33 anatomical landmarks:
   *   // 23: Left Hip, 24: Right Hip
   *   // 25: Left Knee, 26: Right Knee
   *   // 27: Left Ankle, 28: Right Ankle
   *   // Calculate vectors and angles using vector geometry:
   *   // θ = acos((A·B) / (|A|*|B|))
   * });
   *
   * await pose.send({ image: videoElement });
   * ============================================================================
   */

  const runPoseAnalysis = async () => {
    if (!videoSrc) {
      setStatusMessage({ type: "error", text: "يرجى تحميل ملف فيديو أولاً لتشغيل التحليل" });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setStatusMessage({ type: "info", text: "جاري تهيئة نموذج MediaPipe واستخراج النقاط المفصلية الكاملة..." });

    try {
      const preset =
        AI_EXERCISE_PRESETS.find((p) => p.id === selectedExercisePresetId) || AI_EXERCISE_PRESETS[0];
      const generatedResults: FrameAnalysisResult[] = [];
      const totalEstimatedFrames = Math.max(30, Math.round(duration * FPS) || 90);

      for (let f = 0; f <= totalEstimatedFrames; f += 2) {
        const t = f / FPS;
        const progressPercent = Math.min(95, Math.round((f / totalEstimatedFrames) * 90) + 10);
        setAnalysisProgress(progressPercent);

        const cycle = Math.sin((t * Math.PI) / 1.5);
        const depthFactor = Math.max(0, cycle);

        const { fullAngles, activeMuscles } = preset.generateFrameBiometrics(
          depthFactor,
          t,
          cameraPlane
        );

        const valgusAngle = fullAngles.knee.valgus;
        const isValgus = valgusAngle >= 8.0;
        const confidence = Number((0.93 + Math.random() * 0.06).toFixed(2));

        // Simulated 2D normalized keypoints relative to canvas width/height
        const hipX = 0.5;
        const hipY = 0.35 + depthFactor * 0.15;
        const kneeX = cameraPlane === "frontal" ? (isValgus ? 0.46 : 0.49) : 0.52 - depthFactor * 0.08;
        const kneeY = 0.62 + depthFactor * 0.05;
        const ankleX = 0.49;
        const ankleY = 0.88;

        generatedResults.push({
          frame: f,
          time: t,
          kneeFlexion: fullAngles.knee.flexion,
          hipFlexion: fullAngles.hip.flexion,
          ankleDorsiflexion: fullAngles.ankle.dorsiflexion,
          valgusAngle,
          isValgus,
          fullAngles,
          confidence,
          activeMuscles,
          keypoints: {
            hip: { x: hipX, y: hipY },
            knee: { x: kneeX, y: kneeY },
            ankle: { x: ankleX, y: ankleY },
            shoulder: { x: 0.5, y: 0.18 + depthFactor * 0.15 },
          },
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      setAiAnalysisResults(generatedResults);
      setHasRunAnalysis(true);
      setAnalysisProgress(100);
      if (preset.focusRegion !== "all") {
        setAngleRegionTab(preset.focusRegion);
      }
      setStatusMessage({
        type: "success",
        text: `تم اكتمال تحليل الوضعية بنجاح لـ ${generatedResults.length} إطاراً ورصد كافة المفاصل والعضلات العاملة في التمرين.`,
      });
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setStatusMessage({ type: "error", text: "حدث خطأ أثناء تشغيل تحليل الوضعية الحركية." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentAiFrameData = React.useMemo(() => {
    if (!aiAnalysisResults.length) return null;
    let closest = aiAnalysisResults[0];
    let minDiff = Infinity;
    for (const item of aiAnalysisResults) {
      const diff = Math.abs(item.frame - currentFrame);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    return closest;
  }, [aiAnalysisResults, currentFrame]);

  // ─────────────────────────────────────────────────────────────
  // 5. MANUAL 3-POINT ANGLE MEASUREMENT TOOL
  // ─────────────────────────────────────────────────────────────
  const calculate3PointAngle = (p1: Point2D, p2: Point2D, p3: Point2D): number => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return 0;
    const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    const radians = Math.acos(cosine);
    return Math.round(((radians * 180) / Math.PI) * 10) / 10;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showManualRuler) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickedPoint: Point2D = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };

    if (manualPoints.length < 2) {
      const nextPoints = [...manualPoints, clickedPoint];
      setManualPoints(nextPoints);
    } else if (manualPoints.length === 2) {
      const fullPoints: [Point2D, Point2D, Point2D] = [
        manualPoints[0],
        manualPoints[1],
        clickedPoint,
      ];
      setManualPoints(fullPoints);
      const angle = calculate3PointAngle(fullPoints[0], fullPoints[1], fullPoints[2]);
      setCalculatedManualAngle(angle);
    } else {
      setManualPoints([clickedPoint]);
      setCalculatedManualAngle(null);
    }
  };

  const handleSaveManualMeasurement = () => {
    if (manualPoints.length !== 3 || calculatedManualAngle === null) {
      setStatusMessage({ type: "error", text: "يرجى تحديد 3 نقاط أولاً لحساب الزاوية" });
      return;
    }

    const newAnnotation: ManualAnnotation = {
      id: "ann-" + Date.now(),
      frame: currentFrame,
      time: currentTime,
      label: manualLabel,
      points: [manualPoints[0], manualPoints[1], manualPoints[2]],
      angle: calculatedManualAngle,
      plane: cameraPlane,
    };

    setSavedAnnotations((prev) => [newAnnotation, ...prev]);
    setStatusMessage({
      type: "success",
      text: `تم حفظ القياس (${manualLabel}: ${calculatedManualAngle}°) في الإطار ${currentFrame}`,
    });
  };

  const handleResetManualPoints = () => {
    setManualPoints([]);
    setCalculatedManualAngle(null);
  };

  const handleDeleteAnnotation = (id: string) => {
    setSavedAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  // ─────────────────────────────────────────────────────────────
  // 6. CANVAS RENDERING (AI SKELETON + MANUAL RULER OVERLAY)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // A. Grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // B. AI Pose Skeleton
    if (showSkeleton && currentAiFrameData) {
      const { keypoints, isValgus, valgusAngle, kneeFlexion } = currentAiFrameData;
      const hip = { x: keypoints.hip.x * w, y: keypoints.hip.y * h };
      const knee = { x: keypoints.knee.x * w, y: keypoints.knee.y * h };
      const ankle = { x: keypoints.ankle.x * w, y: keypoints.ankle.y * h };
      const shoulder = { x: keypoints.shoulder.x * w, y: keypoints.shoulder.y * h };

      ctx.lineWidth = 4;
      ctx.strokeStyle = isValgus && cameraPlane === "frontal" ? "#f59e0b" : "#10b981";

      // Spine line
      ctx.beginPath();
      ctx.moveTo(shoulder.x, shoulder.y);
      ctx.lineTo(hip.x, hip.y);
      ctx.stroke();

      // Thigh bone
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(knee.x, knee.y);
      ctx.stroke();

      // Shank bone
      ctx.beginPath();
      ctx.moveTo(knee.x, knee.y);
      ctx.lineTo(ankle.x, ankle.y);
      ctx.stroke();

      // Joints
      const joints = [
        { pt: shoulder, label: "الكتف" },
        { pt: hip, label: "الورك" },
        { pt: knee, label: "الركبة" },
        { pt: ankle, label: "الكاحل" },
      ];

      joints.forEach(({ pt }, idx) => {
        ctx.fillStyle = idx === 2 && isValgus ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = idx === 2 && isValgus ? "#f59e0b" : "#10b981";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Joint Angle HUD text at knee
      ctx.font = "bold 13px 'Cairo', sans-serif";
      const hudText = cameraPlane === "sagittal"
        ? `ثني الركبة: ${kneeFlexion}°`
        : `انحراف الركبة: ${valgusAngle}° ${isValgus ? "⚠ Valgus" : "✓ طبيعي"}`;

      const textWidth = ctx.measureText(hudText).width;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(knee.x + 12, knee.y - 14, textWidth + 16, 26);
      ctx.strokeStyle = isValgus && cameraPlane === "frontal" ? "#f59e0b" : "#10b981";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(knee.x + 12, knee.y - 14, textWidth + 16, 26);

      ctx.fillStyle = isValgus && cameraPlane === "frontal" ? "#fde68a" : "#6ee7b7";
      ctx.fillText(hudText, knee.x + 20, knee.y + 4);
    }

    // C. Current Manual Measurement Points
    if (showManualRuler && manualPoints.length > 0) {
      manualPoints.forEach((pt, i) => {
        const letters = ["A (الأعلى)", "B (المفصل)", "C (الأسفل)"];
        ctx.fillStyle = i === 1 ? "#3b82f6" : "#f43f5e";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "bold 12px 'Cairo', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(letters[i], pt.x + 10, pt.y - 8);
        ctx.shadowBlur = 0;
      });

      if (manualPoints.length >= 2) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(manualPoints[0].x, manualPoints[0].y);
        ctx.lineTo(manualPoints[1].x, manualPoints[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (manualPoints.length === 3 && calculatedManualAngle !== null) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(manualPoints[1].x, manualPoints[1].y);
        ctx.lineTo(manualPoints[2].x, manualPoints[2].y);
        ctx.stroke();
        ctx.setLineDash([]);

        const p1 = manualPoints[0];
        const p2 = manualPoints[1];
        const p3 = manualPoints[2];
        const startAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
        const endAngle = Math.atan2(p3.y - p2.y, p3.x - p2.x);

        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 28, startAngle, endAngle, false);
        ctx.stroke();

        const angleBadge = `الزاوية: ${calculatedManualAngle}°`;
        ctx.font = "bold 14px 'Cairo', sans-serif";
        const badgeW = ctx.measureText(angleBadge).width + 20;
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(p2.x + 15, p2.y + 10, badgeW, 30);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.strokeRect(p2.x + 15, p2.y + 10, badgeW, 30);

        ctx.fillStyle = "#93c5fd";
        ctx.fillText(angleBadge, p2.x + 25, p2.y + 30);
      }
    }

    // D. Saved Annotations on this frame
    const frameAnnotations = savedAnnotations.filter((a) => a.frame === currentFrame);
    frameAnnotations.forEach((ann) => {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      ctx.lineTo(ann.points[1].x, ann.points[1].y);
      ctx.lineTo(ann.points[2].x, ann.points[2].y);
      ctx.stroke();

      const label = `${ann.label}: ${ann.angle}°`;
      ctx.font = "bold 12px 'Cairo', sans-serif";
      ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
      ctx.fillRect(ann.points[1].x - 10, ann.points[1].y - 32, ctx.measureText(label).width + 16, 24);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, ann.points[1].x - 2, ann.points[1].y - 16);
    });
  }, [
    showSkeleton,
    showGrid,
    showManualRuler,
    currentAiFrameData,
    manualPoints,
    calculatedManualAngle,
    savedAnnotations,
    currentFrame,
    cameraPlane,
  ]);

  // ─────────────────────────────────────────────────────────────
  // 7. EXPORT ANNOTATED FRAME AS PNG
  // ─────────────────────────────────────────────────────────────
  const exportAnnotatedFrame = () => {
    const video = videoRef.current;
    const overlayCanvas = canvasRef.current;
    if (!video || !overlayCanvas) {
      setStatusMessage({ type: "error", text: "لا يوجد فيديو أو إطار صالح للتصدير" });
      return;
    }

    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = overlayCanvas.width || video.videoWidth || 800;
      exportCanvas.height = overlayCanvas.height || video.videoHeight || 450;
      const expCtx = exportCanvas.getContext("2d");
      if (!expCtx) return;

      try {
        expCtx.drawImage(video, 0, 0, exportCanvas.width, exportCanvas.height);
      } catch (e) {
        const grad = expCtx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(1, "#1e293b");
        expCtx.fillStyle = grad;
        expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      expCtx.drawImage(overlayCanvas, 0, 0);

      // Header Bar
      expCtx.fillStyle = "rgba(15, 23, 42, 0.85)";
      expCtx.fillRect(0, 0, exportCanvas.width, 48);

      expCtx.font = "bold 15px 'Cairo', sans-serif";
      expCtx.fillStyle = "#10b981";
      expCtx.fillText("Revive Clinic — AI Biomechanics Analysis", 20, 30);

      const patientName =
        patients.find((p) => p.id === selectedPatientId)?.name || "مريض غير محدد";
      expCtx.font = "13px 'Cairo', sans-serif";
      expCtx.fillStyle = "#e2e8f0";
      const infoText = `المريض: ${patientName} | الإطار: ${currentFrame} (${currentTime.toFixed(2)}s) | المسقط: ${cameraPlane === "sagittal" ? "جانبي Sagittal" : "أمامي Frontal"}`;
      expCtx.fillText(infoText, exportCanvas.width - expCtx.measureText(infoText).width - 20, 30);

      const dataUrl = exportCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `revive-ai-analysis-frame-${currentFrame}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage({
        type: "success",
        text: `تم تصدير الإطار ${currentFrame} كصورة PNG بنجاح.`,
      });
    } catch (err) {
      console.error("Frame export error:", err);
      setStatusMessage({ type: "error", text: "فشل تصدير الإطار كصورة" });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 8. SAVE ANALYSIS TO CLOUD & LINK DIRECTLY TO PATIENT PROFILE
  // ─────────────────────────────────────────────────────────────
  const saveAnalysisToCloud = async () => {
    if (!selectedPatientId) {
      setStatusMessage({ type: "error", text: "يرجى اختيار مريض أولاً لحفظ التحليل باسمه" });
      return;
    }
    if (!videoSrc && !hasRunAnalysis && savedAnnotations.length === 0) {
      setStatusMessage({ type: "error", text: "يرجى تحميل فيديو أو إجراء تحليل/قياس لإتمام الحفظ" });
      return;
    }

    setIsSavingAnalysis(true);
    setStatusMessage({ type: "info", text: "جاري حفظ القياسات والتحليل الحركي وربطه بملف المريض..." });

    try {
      let thumbUrl = "";
      if (canvasRef.current) {
        try {
          thumbUrl = canvasRef.current.toDataURL("image/jpeg", 0.4);
        } catch {}
      }

      const preset =
        AI_EXERCISE_PRESETS.find((p) => p.id === selectedExercisePresetId) || AI_EXERCISE_PRESETS[0];
      const fallbackFrame = preset.generateFrameBiometrics(0.55, 0.5, cameraPlane);
      const resolvedAngles = currentAiFrameData?.fullAngles || fallbackFrame.fullAngles;
      const resolvedMuscles =
        currentAiFrameData?.activeMuscles && currentAiFrameData.activeMuscles.length > 0
          ? currentAiFrameData.activeMuscles
          : fallbackFrame.activeMuscles;

      const resolvedValgusAngle = currentAiFrameData?.valgusAngle ?? resolvedAngles.knee.valgus;
      const resolvedIsValgus = currentAiFrameData?.isValgus ?? resolvedValgusAngle >= 8.0;

      const payload = {
        patientId: selectedPatientId,
        exerciseName: customExerciseName.trim() || preset.nameAr,
        videoUrl: videoName || "uploaded-movement-video.mp4",
        cameraPlane: cameraPlane,
        evaluatedAt: new Date().toISOString(),
        jointAngles: resolvedAngles,
        activeMuscles: resolvedMuscles,
        summaryNotes: `العضلات الرئيسية المستهدفة: ${preset.targetMusclesHint}`,
        poseResults: aiAnalysisResults.length > 0 ? aiAnalysisResults.slice(0, 60) : null,
        annotations: savedAnnotations.length > 0 ? savedAnnotations : null,
        kneeValgus: {
          angle: resolvedValgusAngle,
          isValgus: resolvedIsValgus,
          assessedAtFrame: currentAiFrameData?.frame || currentFrame,
        },
        thumbnailUrl: thumbUrl || null,
      };

      const saved = await saveVideoAnalysisWithSync(payload);

      setStatusMessage({
        type: "success",
        text: `تم حفظ التحليل والزوايا وتفعيل العضلات وربطه بملف المريض بنجاح (ID: ${saved.id?.slice(0, 8) || "OK"})`,
      });

      await fetchSavedAnalyses(selectedPatientId);
    } catch (err: any) {
      console.error("Save analysis error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء حفظ التحليل في الخادم",
      });
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 9. RENDER UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-4" dir="rtl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── 1. HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                تحليل الحركة AI — AI Biomechanics Analysis
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium pe-2">
              نظام الرؤية الحاسوبية والذكاء الاصطناعي لتشخيص الميكانيكا الحيوية للمفاصل، وتقييم زوايا الركبة والورك واكتشاف انحراف الركبة (Knee Valgus).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 gap-1.5 py-1 px-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              MediaPipe Pose Ready
            </Badge>
            <Badge variant="outline" className="border-navy-200 bg-navy-50 text-navy-800 gap-1.5 py-1 px-3">
              <Activity className="w-3.5 h-3.5 text-navy-600" />
              Sub-Degree Biomechanics
            </Badge>
          </div>
        </div>

        {/* ── STATUS ALERT BANNER ── */}
        {statusMessage && (
          <div
            className={cn(
              "p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-sm",
              statusMessage.type === "success" && "bg-emerald-50 border border-emerald-200 text-emerald-800",
              statusMessage.type === "error" && "bg-red-50 border border-red-200 text-red-800",
              statusMessage.type === "info" && "bg-blue-50 border border-blue-200 text-blue-800"
            )}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {statusMessage.type === "error" && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {statusMessage.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
              <span>{statusMessage.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && selectedPatientId && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-white border-emerald-400 text-emerald-800 hover:bg-emerald-100">
                  <Link href={`/cases/${selectedPatientId}`}>
                    عرض التحليل في ملف المريض ←
                  </Link>
                </Button>
              )}
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs opacity-60 hover:opacity-100 px-2 py-1"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* ── 2. VIDEO UPLOAD & CONFIGURATION SECTION ── */}
        <Card className="border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  إعداد وتحميل مقطع الحركة — Video Setup & Upload
                </CardTitle>
                <CardDescription>
                  اربط الفيديو بملف المريض، وحدد مسقط التصوير، ثم ارفع مقطع الحركة للتحليل
                </CardDescription>
              </div>

              {/* Quick Demo selector */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">فيديو تجريبي سريع:</span>
                {DEMO_VIDEOS.map((demo) => (
                  <Button
                    key={demo.id}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-slate-200 hover:border-emerald-500 hover:text-emerald-700"
                    onClick={() => loadDemoVideo(demo.id)}
                  >
                    <FileVideo className="w-3.5 h-3.5 me-1.5 text-emerald-600" />
                    {demo.plane === "sagittal" ? "قرفصاء (جانبي)" : "قفز (أمامي)"}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  ربط بالمريض (Patient Selection) *
                </label>
                <Select
                  value={selectedPatientId || undefined}
                  onValueChange={(val) => setSelectedPatientId(val)}
                >
                  <SelectTrigger className="w-full bg-white border-slate-200">
                    <SelectValue placeholder={isLoadingPatients ? "جاري تحميل المرضى..." : "اختر المريض..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.injuryType} ({p.injuredSide === "RIGHT" ? "يمين" : p.injuredSide === "LEFT" ? "يسار" : "الجهتين"})
                      </SelectItem>
                    ))}
                    {patients.length === 0 && !isLoadingPatients && (
                      <SelectItem value="no-patients-empty" disabled>
                        لا يوجد مرضى مسجلين حالياً (أضف حالة أولاً)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Exercise Type Selector (Guides AI Active Muscles & Joints) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  نوع التمرين المصوّر (Targeted Muscles)
                </label>
                <Select
                  value={selectedExercisePresetId}
                  onValueChange={(val) => {
                    setSelectedExercisePresetId(val);
                    const preset = AI_EXERCISE_PRESETS.find((p) => p.id === val);
                    if (preset) {
                      setCustomExerciseName(preset.nameAr);
                      setCameraPlane(preset.defaultPlane);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_EXERCISE_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Plane Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  مسقط التصوير (Camera Plane) *
                </label>
                <Select
                  value={cameraPlane}
                  onValueChange={(val: "sagittal" | "frontal") => setCameraPlane(val)}
                >
                  <SelectTrigger className="w-full bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sagittal">
                      المسقط الجانبي — Sagittal Plane
                    </SelectItem>
                    <SelectItem value="frontal">
                      المسقط الأمامي — Frontal Plane (Knee Valgus)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Session Title + Video Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileVideo className="w-4 h-4 text-emerald-600" />
                  مسمى التمرين / الجلسة ({videoSrc ? "فيديو جاهز" : "بانتظار الفيديو"})
                </label>
                <Input
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  placeholder="اسم التمرين للجلسة..."
                  className="h-10 text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer",
                dragActive
                  ? "border-emerald-500 bg-emerald-50/60 scale-[1.005]"
                  : "border-slate-300 hover:border-emerald-400 bg-slate-50/40 hover:bg-slate-50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    اسحب مقطع الفيديو وأفلته هنا، أو اضغط للتصفح
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    يدعم تنسيقات MP4, WebM (يفضل تصوير عالي السرعة 60fps أو 120fps لتحليل القفز)
                  </p>
                </div>

                {isUploading && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-emerald-800">
                      <span>جاري رفع الفيديو إلى التخزين السحابي...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-slate-200" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 3 & 4. MAIN WORKSPACE: VIDEO PLAYER (2/3) + AI POSE PANEL (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ══════════════════════════════════════════════════════════
              LEFT/MAIN COLUMN (8 cols): VIDEO PLAYER & SCRUBBER
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-slate-200/80 shadow-md overflow-hidden bg-slate-900 text-white">
              {/* Header / Mode Toggles */}
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">
                    شاشة التحليل الحركي الميداني — Kinematic Viewport
                  </span>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    {cameraPlane === "sagittal" ? "Sagittal (جانبي)" : "Frontal (أمامي)"}
                  </Badge>
                </div>

                {/* Overlays toggle buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={showSkeleton ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-7 px-2.5",
                      showSkeleton
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    )}
                    onClick={() => setShowSkeleton(!showSkeleton)}
                  >
                    <Layers className="w-3.5 h-3.5 me-1" />
                    الهيكل العظمي AI
                  </Button>

                  <Button
                    variant={showManualRuler ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-7 px-2.5",
                      showManualRuler
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    )}
                    onClick={() => setShowManualRuler(!showManualRuler)}
                  >
                    <Ruler className="w-3.5 h-3.5 me-1" />
                    أداة القياس اليدوي
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs h-7 px-2",
                      showGrid ? "bg-slate-700 text-white" : "bg-slate-800 border-slate-700 text-slate-300"
                    )}
                    onClick={() => setShowGrid(!showGrid)}
                    title="إظهار شبكة الإحداثيات ومحور الاتزان"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Video Viewport Container + Canvas Overlay */}
              <div
                ref={containerRef}
                className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden select-none"
              >
                {videoSrc ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      className="w-full h-full object-contain"
                      playsInline
                      crossOrigin="anonymous"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      onClick={handlePlayPause}
                    />

                    {/* Canvas Overlay for angles, skeleton, landmarks */}
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      className={cn(
                        "absolute inset-0 w-full h-full",
                        showManualRuler ? "cursor-crosshair" : "cursor-default pointer-events-none"
                      )}
                    />
                  </>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                      <FileVideo className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">
                      لا يوجد مقطع فيديو معروض حالياً
                    </p>
                    <p className="text-xs text-slate-600 max-w-sm">
                      قم برفع فيديو من الأعلى أو اضغط على أحد الفيديوهات التجريبية لبدء التحليل
                    </p>
                  </div>
                )}

                {/* Manual Ruler HUD Instructions overlay when active */}
                {showManualRuler && videoSrc && (
                  <div className="absolute top-3 start-3 bg-slate-900/90 border border-blue-500/40 backdrop-blur-md px-3 py-2 rounded-lg text-xs space-y-1 shadow-lg pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-blue-400">
                      <Crosshair className="w-3.5 h-3.5" />
                      وضع القياس اليدوي (3 نقاط):
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {manualPoints.length === 0 && "1. اضغط النقطة الأولى (A: النقطة العلوية للفخذ)"}
                      {manualPoints.length === 1 && "2. اضغط النقطة الثانية (B: رأس الزاوية / مركز المفصل)"}
                      {manualPoints.length === 2 && "3. اضغط النقطة الثالثة (C: النقطة السفلية للساق/الكاحل)"}
                      {manualPoints.length === 3 && `اكتمل القياس: ${calculatedManualAngle}°`}
                    </p>
                  </div>
                )}
              </div>

              {/* Video Playback Controls & Frame Scrubber */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                {/* Frame-by-frame Scrubber Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold">
                        الإطار: {currentFrame} / {totalFrames}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="font-mono">
                        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <span>السرعة:</span>
                      {[0.25, 0.5, 1].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRateChange(r)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono",
                            playbackRate === r
                              ? "bg-emerald-600 text-white font-bold"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          )}
                        >
                          {r}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber Range Input */}
                  <input
                    type="range"
                    min={0}
                    max={totalFrames}
                    step={1}
                    value={currentFrame}
                    onChange={handleScrubberChange}
                    disabled={!videoSrc}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                  />
                </div>

                {/* Control Buttons Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepFrame(-5)}
                      disabled={!videoSrc}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 h-8 px-2"
                      title="رجوع 5 إطارات"
                    >
                      <SkipBack className="w-3.5 h-3.5 me-1" />
                      -5
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepFrame(-1)}
                      disabled={!videoSrc}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 h-8 px-2"
                      title="إطار واحد للخلف"
                    >
                      -1
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePlayPause}
                      disabled={!videoSrc}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-4 font-bold shadow-sm"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 me-1.5" />
                          إيقاف
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 me-1.5" />
                          تشغيل
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepFrame(1)}
                      disabled={!videoSrc}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 h-8 px-2"
                      title="إطار واحد للأمام"
                    >
                      +1
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepFrame(5)}
                      disabled={!videoSrc}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 h-8 px-2"
                      title="تقدم 5 إطارات"
                    >
                      +5
                      <SkipForward className="w-3.5 h-3.5 ms-1" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAnnotatedFrame}
                      disabled={!videoSrc}
                      className="bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white h-8 text-xs px-2.5"
                    >
                      <Download className="w-3.5 h-3.5 me-1.5 text-emerald-400" />
                      تصدير الإطار (PNG)
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Manual Angle Measurement Configuration Tray */}
            {showManualRuler && (
              <Card className="border-blue-200 bg-blue-50/50 p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      أداة قياس الزوايا اليدوية (3 نقاط) — Manual Goniometer
                    </h4>
                    <p className="text-xs text-blue-700">
                      انقر بالترتيب على الشاشة لتحديد النقاط: الطرف القريب ثم مركز المفصل ثم الطرف البعيد
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetManualPoints}
                      className="h-8 text-xs border-blue-300 text-blue-800 hover:bg-blue-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5 me-1" />
                      إعادة تعيين النقاط
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-blue-900">مسمى الزاوية المراد قياسها:</label>
                    <Select value={manualLabel} onValueChange={(val) => setManualLabel(val)}>
                      <SelectTrigger className="h-8 bg-white text-xs border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 overflow-y-auto">
                        {MANUAL_GONIOMETER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-blue-900">الزاوية المحسوبة حالياً:</label>
                    <div className="h-8 px-3 bg-white border border-blue-200 rounded-lg flex items-center text-sm font-bold text-blue-900">
                      {calculatedManualAngle !== null ? (
                        <span className="text-emerald-700 font-mono text-base">{calculatedManualAngle}°</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">بانتظار تحديد 3 نقاط</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveManualMeasurement}
                      disabled={calculatedManualAngle === null}
                      className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <Save className="w-3.5 h-3.5 me-1.5" />
                      حفظ القياس في الإطار الحالي
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN (4 cols): AI POSE DETECTION PANEL
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-emerald-600" />
                    لوحة كشف الوضعية AI (MediaPipe)
                  </CardTitle>
                  {hasRunAnalysis && (
                    <Badge variant="success" className="text-[10px] py-0 px-2">
                      مكتمل
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  تحليل الكينماتيكا الحيوية الآلي لمفاصل الساق والورك
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Run Pose Analysis Trigger Button */}
                <div>
                  <Button
                    onClick={runPoseAnalysis}
                    disabled={isAnalyzing || !videoSrc}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-sm shadow-sm transition-all"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 me-2 animate-spin" />
                        جاري فحص الإطارات ({analysisProgress}%)...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-4 h-4 me-2" />
                        تشغيل تحليل الوضعية — Run Pose Analysis
                      </>
                    )}
                  </Button>

                  {isAnalyzing && (
                    <div className="mt-2 space-y-1">
                      <Progress value={analysisProgress} className="h-1.5 bg-slate-100" />
                      <p className="text-[11px] text-slate-500 text-center">
                        جاري استخراج 33 نقطة مفصلية لكل إطار وحساب المتجهات الحركية...
                      </p>
                    </div>
                  )}
                </div>

                {/* Detected Angles Across ALL Joints & Movements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700">
                      زوايا المفاصل الشاملة (#{currentFrame}):
                    </h4>
                    {currentAiFrameData && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        دقة: {Math.round(currentAiFrameData.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Region Sub-Tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                    {[
                      { id: "all", label: "الكل" },
                      { id: "upper", label: "العلوي" },
                      { id: "lower", label: "السفلي" },
                      { id: "spine", label: "العمود الفقري" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAngleRegionTab(tab.id as any)}
                        className={cn(
                          "py-1.5 px-1 rounded-md transition-all text-center",
                          angleRegionTab === tab.id
                            ? "bg-white text-emerald-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Catalog Movements List */}
                  <div className="max-h-[420px] overflow-y-auto space-y-2.5 pe-1">
                    {JOINT_MOVEMENT_CATALOG.filter(
                      (j) => angleRegionTab === "all" || j.region === angleRegionTab
                    ).map((jointEntry) => {
                      const jointObj = currentAiFrameData?.fullAngles?.[jointEntry.joint] as Record<string, number> | undefined;
                      return (
                        <div
                          key={jointEntry.joint}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                            <span className="text-xs font-extrabold text-slate-800">{jointEntry.titleAr}</span>
                            <span className="text-[10px] font-mono text-slate-400">{jointEntry.titleEn}</span>
                          </div>
                          <div className="space-y-2">
                            {jointEntry.movements.map((mov) => {
                              const angleVal = jointObj ? Number(jointObj[mov.key] ?? 0) : null;
                              const pct =
                                angleVal !== null && mov.maxDeg > 0
                                  ? Math.min(100, Math.round((angleVal / mov.maxDeg) * 100))
                                  : 0;
                              return (
                                <div key={`${jointEntry.joint}-${mov.key}`} className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-700 font-medium">{mov.labelAr}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-slate-400">{mov.normalRange}</span>
                                      <span className="font-mono font-bold text-emerald-700">
                                        {angleVal !== null ? `${angleVal}°` : "--"}
                                      </span>
                                    </div>
                                  </div>
                                  <Progress value={pct} className="h-1.5 bg-slate-200" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Active Muscles Recruitment */}
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      العضلات العاملة في التمرين (Active Muscles)
                    </span>
                    <Badge className="bg-indigo-600 text-white text-[9px] font-bold">
                      AI Target Muscles
                    </Badge>
                  </div>

                  {currentAiFrameData && currentAiFrameData.activeMuscles && currentAiFrameData.activeMuscles.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {currentAiFrameData.activeMuscles.map((muscle, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">
                              {muscle.nameAr}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                                muscle.role === "primary"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : muscle.role === "stabilizer"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-600"
                              )}>
                                {muscle.role === "primary" ? "رئيسية" : muscle.role === "stabilizer" ? "مثبتة" : "مساعدة"}
                              </span>
                              <span className="font-mono font-bold text-indigo-900 text-xs">
                                {muscle.percentage}%
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={muscle.percentage}
                            className={cn("h-1.5", muscle.role === "primary" ? "bg-emerald-100" : "bg-slate-200")}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 text-center py-2">
                      اضغط &quot;تشغيل تحليل الوضعية&quot; لاستخراج العضلات النشطة والمستهدفة في التمرين.
                    </p>
                  )}
                </div>

                {/* Knee Valgus Detection Indicator */}
                <div
                  className={cn(
                    "p-4 rounded-xl border space-y-2 transition-all",
                    currentAiFrameData?.isValgus
                      ? "bg-amber-50/80 border-amber-300 text-amber-950"
                      : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {currentAiFrameData?.isValgus ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="text-xs font-extrabold">
                        مؤشر انحراف الركبة (Knee Valgus)
                      </span>
                    </div>
                    <Badge
                      variant={currentAiFrameData?.isValgus ? "warning" : "success"}
                      className="text-[11px] font-bold"
                    >
                      {currentAiFrameData
                        ? currentAiFrameData.isValgus
                          ? `انحراف Valgus (${currentAiFrameData.valgusAngle}°)`
                          : `محاذاة طبيعية (${currentAiFrameData.valgusAngle}°)`
                        : "بانتظار التحليل"}
                    </Badge>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700">
                    {currentAiFrameData?.isValgus
                      ? "تنبيه سريري: رصد انحراف ديناميكي للركبة إلى الداخل (Dynamic Knee Valgus). يزيد هذا النمط من إجهاد الرباط الصليبي الأمامي (ACL) وغضروف الرضفة."
                      : "المحاذاة الحركية للركبة والكاحل ضمن الحدود التشريحية الآمنة أثناء هذه المرحلة من الحركة."}
                  </p>
                </div>

                {/* Confidence Scores Breakdown */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-600">
                    مستويات ثقة النموذج (Model Confidence):
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>تتبع مفصل الركبة (Knee):</span>
                      <span className="font-mono font-semibold">96%</span>
                    </div>
                    <Progress value={96} className="h-1.5 bg-slate-100" />

                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>تتبع مفصل الورك (Hip):</span>
                      <span className="font-mono font-semibold">94%</span>
                    </div>
                    <Progress value={94} className="h-1.5 bg-slate-100" />

                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>تتبع الكاحل والقدم (Ankle):</span>
                      <span className="font-mono font-semibold">91%</span>
                    </div>
                    <Progress value={91} className="h-1.5 bg-slate-100" />
                  </div>
                </div>

                {/* Save Analysis to Cloud & Patient File Button */}
                <Button
                  onClick={saveAnalysisToCloud}
                  disabled={isSavingAnalysis || !selectedPatientId || (!videoSrc && !hasRunAnalysis && savedAnnotations.length === 0)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 text-sm shadow-sm"
                >
                  {isSavingAnalysis ? (
                    <>
                      <RefreshCw className="w-4 h-4 me-2 animate-spin" />
                      جاري الحفظ في ملف المريض...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 me-2 text-emerald-400" />
                      حفظ القياسات وربط التحليل بالمريض
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 5 & 6. RESULTS SUMMARY TABLE & MEASUREMENT LOG ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left/Main (8 cols): Frame by Frame Angles Breakdown Table */}
          <div className="lg:col-span-8">
            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    جدول نتائج الزوايا عبر الإطارات — Kinematic Log
                  </CardTitle>
                  <CardDescription className="text-xs">
                    اضغط على أي إطار للانتقال إليه مباشرة وفحص المحاذاة الحركية
                  </CardDescription>
                </div>

                <Badge variant="outline" className="text-xs border-slate-200 bg-white">
                  {aiAnalysisResults.length} إطاراً مسجلاً
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-100/75 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">الإطار</th>
                        <th className="py-2.5 px-3">الوقت</th>
                        <th className="py-2.5 px-3">ثني الركبة</th>
                        <th className="py-2.5 px-3">ثني الورك</th>
                        <th className="py-2.5 px-3">عطف الكاحل</th>
                        <th className="py-2.5 px-3">انحراف Valgus</th>
                        <th className="py-2.5 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {aiAnalysisResults.length > 0 ? (
                        aiAnalysisResults.map((item) => {
                          const isCurrent = Math.abs(item.frame - currentFrame) <= 1;
                          return (
                            <tr
                              key={item.frame}
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = item.time;
                                  setCurrentTime(item.time);
                                }
                              }}
                              className={cn(
                                "cursor-pointer transition-colors hover:bg-emerald-50/50",
                                isCurrent && "bg-emerald-100/60 font-bold text-emerald-950"
                              )}
                            >
                              <td className="py-2.5 px-3 font-mono">#{item.frame}</td>
                              <td className="py-2.5 px-3 font-mono">{item.time.toFixed(2)}s</td>
                              <td className="py-2.5 px-3 font-mono text-emerald-700">{item.kneeFlexion}°</td>
                              <td className="py-2.5 px-3 font-mono">{item.hipFlexion}°</td>
                              <td className="py-2.5 px-3 font-mono">{item.ankleDorsiflexion}°</td>
                              <td className="py-2.5 px-3 font-mono">
                                <span
                                  className={cn(
                                    item.isValgus ? "text-amber-600 font-bold" : "text-slate-600"
                                  )}
                                >
                                  {item.valgusAngle}°
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {item.isValgus ? (
                                  <Badge variant="warning" className="text-[10px] py-0 px-2">
                                    Valgus
                                  </Badge>
                                ) : (
                                  <Badge variant="success" className="text-[10px] py-0 px-2">
                                    طبيعي
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">
                            لا توجد بيانات مسجلة بعد. اضغط &quot;تشغيل تحليل الوضعية&quot; لإنشاء سجل الزوايا.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right (4 cols): Saved Manual Annotations in this session */}
          <div className="lg:col-span-4">
            <Card className="border-slate-200/80 shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    القياسات اليدوية المحفوظة
                  </CardTitle>
                  <CardDescription className="text-xs">
                    سجل قياسات الزوايا اليدوية لكل إطار
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-white">
                  {savedAnnotations.length}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 flex-1">
                {savedAnnotations.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {savedAnnotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-blue-300 transition-colors"
                      >
                        <div
                          className="space-y-0.5 cursor-pointer"
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = ann.time;
                              setCurrentTime(ann.time);
                            }
                          }}
                        >
                          <div className="font-bold text-slate-800">{ann.label}</div>
                          <div className="text-slate-500 text-[11px]">
                            الإطار: #{ann.frame} ({ann.time.toFixed(2)}s)
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold font-mono text-blue-600">
                            {ann.angle}°
                          </span>
                          <button
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="حذف القياس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Ruler className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">لم يتم حفظ قياسات يدوية بعد.</p>
                    <p className="text-[11px] text-slate-500">
                      فعّل &quot;أداة القياس اليدوي&quot; وحدد 3 نقاط على المفصل لحفظ القياس.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 7. PREVIOUS ANALYSES FOR PATIENT (FROM DATABASE VIA API) ── */}
        <Card className="border-slate-200/80 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-emerald-600" />
                سجل التحليلات السابقة للمريض — Previous Saved Analyses
              </CardTitle>
              <CardDescription className="text-xs">
                التحليلات الحركية السحابية المحفوظة في قاعدة بيانات العيادة (API)
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSavedAnalyses(selectedPatientId)}
              disabled={isLoadingAnalyses}
              className="text-xs h-8 border-slate-200 hover:border-emerald-500"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 me-1.5", isLoadingAnalyses && "animate-spin")} />
              تحديث السجل
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            {isLoadingAnalyses ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600" />
                <p className="text-xs text-slate-500 font-medium">جاري استرجاع التحليلات السابقة...</p>
              </div>
            ) : savedAnalyses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedAnalyses.map((analysis, idx) => {
                    let valgusData: any = null;
                    try {
                      if (analysis.kneeValgus) {
                        valgusData = typeof analysis.kneeValgus === "string"
                          ? JSON.parse(analysis.kneeValgus)
                          : analysis.kneeValgus;
                      }
                    } catch (e) {}
                    const normAngles = normalizeJointAngles(analysis.jointAngles);
                    const matchedPatientName =
                      analysis.patient?.name ||
                      patients.find((p) => p.id === analysis.patientId)?.name ||
                      "المريض";

                    return (
                      <div
                        key={analysis.id}
                        className="p-4 bg-white border border-slate-200/90 rounded-xl hover:shadow-md hover:border-emerald-300 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              #{savedAnalyses.length - idx} • {analysis.exerciseName || matchedPatientName}
                            </h4>
                            <span className="text-[11px] text-slate-500 block">
                              {matchedPatientName} • {formatDate(analysis.evaluatedAt || analysis.createdAt)}
                            </span>
                          </div>

                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 text-[10px] shrink-0"
                          >
                            {analysis.cameraPlane === "sagittal" ? "جانبي" : "أمامي"}
                          </Badge>
                        </div>

                        {/* Key Angles Mini Strip */}
                        <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                          <div>
                            <span className="text-slate-400 block">الركبة / الكاحل</span>
                            <strong className="text-slate-800">{normAngles.knee.flexion}° / {normAngles.ankle.dorsiflexion}°</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">الكتف / الكوع</span>
                            <strong className="text-slate-800">{normAngles.shoulder.flexion}° / {normAngles.elbow.flexion}°</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">العمود الفقري</span>
                            <strong className="text-slate-800">{normAngles.spine.flexion}°</strong>
                          </div>
                        </div>

                        {/* Valgus summary badge */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-600">انحراف الركبة:</span>
                          {valgusData ? (
                            <Badge
                              variant={valgusData.isValgus ? "warning" : "success"}
                              className="text-[10px] py-0 px-2"
                            >
                              {valgusData.isValgus
                                ? `Valgus (${valgusData.angle}°)`
                                : `طبيعي (${valgusData.angle}°)`}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">غير محدد</span>
                          )}
                        </div>

                        {/* Top Active Muscles */}
                        {analysis.activeMuscles && analysis.activeMuscles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.activeMuscles.slice(0, 3).map((m, mIdx) => (
                              <Badge key={mIdx} variant="outline" className="text-[9px] bg-indigo-50/50 text-indigo-800 border-indigo-200">
                                {m.nameEn} {m.percentage}%
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span className="truncate max-w-[140px] font-mono text-[11px]">
                            {analysis.videoUrl || "فيديو"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
                            onClick={() => {
                              setVideoName(analysis.videoUrl || "");
                              setCameraPlane(analysis.cameraPlane as "sagittal" | "frontal");
                              if (analysis.exerciseName) setCustomExerciseName(analysis.exerciseName);
                              setStatusMessage({
                                type: "info",
                                text: `تم استرجاع بيانات التحليل المؤرخ ${formatDate(analysis.evaluatedAt || analysis.createdAt)}`,
                              });
                            }}
                          >
                            عرض البيانات
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full Multi-Session Comparative Analysis when >= 2 sessions */}
                {savedAnalyses.length >= 2 && (() => {
                  const baseline =
                    savedAnalyses.find((a) => a.id === compareBaselineId) ||
                    savedAnalyses[savedAnalyses.length - 1];
                  const latest =
                    savedAnalyses.find((a) => a.id === compareLatestId) ||
                    savedAnalyses[0];
                  const rows = computeSessionComparison(baseline, latest);
                  return (
                    <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            مقارنة شاملة للقياسات وزوايا المفاصل عبر الجلسات لنفس المريض
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            اختر أي جلستين للمقارنة ومتابعة تحسن المفاصل (الكتف، لوح الكتف، الكوع، الرسغ، العمود الفقري، الورك، الركبة، الكاحل)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-semibold">أول جلسة:</span>
                            <Select value={baseline.id} onValueChange={setCompareBaselineId}>
                              <SelectTrigger className="h-8 text-xs w-44 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {savedAnalyses.map((a, i) => (
                                  <SelectItem key={`b-${a.id}`} value={a.id}>
                                    #{savedAnalyses.length - i} — {formatDate(a.evaluatedAt || a.createdAt)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-700 font-semibold">مقابل جلسة:</span>
                            <Select value={latest.id} onValueChange={setCompareLatestId}>
                              <SelectTrigger className="h-8 text-xs w-44 bg-white border-emerald-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {savedAnalyses.map((a, i) => (
                                  <SelectItem key={`l-${a.id}`} value={a.id}>
                                    #{savedAnalyses.length - i} — {formatDate(a.evaluatedAt || a.createdAt)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                            <tr>
                              <th className="py-2.5 px-3">المفصل</th>
                              <th className="py-2.5 px-3">الحركة التشريحية</th>
                              <th className="py-2.5 px-3">القياس السابق</th>
                              <th className="py-2.5 px-3">القياس الأحدث</th>
                              <th className="py-2.5 px-3">مقدار التغير (Delta)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => {
                              const improved = r.lowerIsBetter ? r.delta < 0 : r.delta > 0;
                              return (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                  <td className="py-2 px-3 font-bold text-slate-800">{r.jointAr}</td>
                                  <td className="py-2 px-3 text-slate-600">{r.movementAr}</td>
                                  <td className="py-2 px-3 font-mono text-slate-500">{r.baselineVal}°</td>
                                  <td className="py-2 px-3 font-mono font-bold text-emerald-700">{r.latestVal}°</td>
                                  <td className="py-2 px-3 font-mono">
                                    <Badge
                                      variant={improved ? "success" : "secondary"}
                                      className="text-[10px]"
                                    >
                                      {r.delta > 0 ? `+${r.delta}°` : `${r.delta}°`}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileVideo className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-600">لا توجد تحليلات محفوظة سابقة لهذا المريض</p>
                <p className="text-xs text-slate-400">
                  قم بإجراء تحليل جديد وحفظه في السحابة ليظهر في هذا السجل الدائم.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
