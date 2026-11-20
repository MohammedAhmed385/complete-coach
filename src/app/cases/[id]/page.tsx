"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Calendar,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Dumbbell,
  Eye,
  FileText,
  Minus,
  MessageCircle,
  Plus,
  RotateCw,
  Ruler,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Video,
  Building,
  AlertCircle,
  TrendingUp,
  CheckSquare,
  Share2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cn,
  formatDate,
  formatDateShort,
  generateWhatsAppShareLink,
  getPhaseLabel,
  getJointLabel,
} from "@/lib/utils";

// TypeScript Interfaces for Patient Details
interface ROMMeasurementItem {
  id: string;
  patientId: string;
  date: string;
  joint: string;
  movement: string;
  injuredAngle: number;
  healthyAngle?: number | null;
  notes?: string | null;
  createdAt: string;
}

interface GirthMeasurementDetail {
  id: string;
  evaluationId: string;
  distanceCm: number;
  injuredCm: number;
  healthyCm?: number | null;
}

interface GirthEvaluationItem {
  id: string;
  patientId: string;
  date: string;
  landmark: string;
  createdAt: string;
  measurements: GirthMeasurementDetail[];
}

interface ExerciseItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  instructions?: string | null;
  region: string;
  category: string;
  isIsometric: boolean;
  isometricAngle?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

interface ProgramExerciseItem {
  id: string;
  programId: string;
  exerciseId: string;
  exercise: ExerciseItem;
  sets: number;
  reps: number;
  holdSeconds?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  orderIndex: number;
}

interface RehabProgramItem {
  id: string;
  patientId: string;
  phase: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  programExercises: ProgramExerciseItem[];
}

interface ScheduleExerciseItem {
  id: string;
  scheduleId?: string;
  exerciseId: string;
  exercise: ExerciseItem;
  targetSets: number;
  targetReps: number;
  completedSets: number;
  completedReps: number;
  orderIndex: number;
}

interface ExerciseScheduleItem {
  id: string;
  patientId: string;
  date: string;
  isRestDay: boolean;
  notes?: string | null;
  exercises: ScheduleExerciseItem[];
}

interface AppointmentDetailItem {
  id: string;
  patientId: string;
  userId: string;
  type: "IN_CLINIC" | "ONLINE";
  date: string;
  startTime: string;
  endTime: string;
  recurringDays?: string | null;
  notes?: string | null;
  status: string;
}

interface RTPCriterionItem {
  id: string;
  criterionText: string;
  passed: boolean;
  notes?: string | null;
}

interface RTPEvaluationItem {
  id: string;
  patientId: string;
  phase: string;
  protocolName?: string | null;
  readinessScore?: number | null;
  evaluatedAt: string;
  criteria: RTPCriterionItem[];
}

interface PatientDetail {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  injuryType: string;
  injuryDate: string;
  surgeryDate?: string | null;
  rehabStartDate: string;
  injuredSide: "RIGHT" | "LEFT" | "BILATERAL";
  mechanismOfInjury?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  romMeasurements: ROMMeasurementItem[];
  girthMeasurements: GirthEvaluationItem[];
  rehabPrograms: RehabProgramItem[];
  appointments: AppointmentDetailItem[];
  rtpEvaluations: RTPEvaluationItem[];
  exerciseSchedules: ExerciseScheduleItem[];
}

// Phase Transition Criteria Interface
interface PhaseCriterion {
  id: string;
  phase: string;
  textAr: string;
  textEn: string;
  met: boolean;
}

const DEFAULT_PHASE_CRITERIA: PhaseCriterion[] = [
  {
    id: "c1",
    phase: "ACUTE_TO_ROM",
    textAr: "استعادة المدى الحركي الكامل في البسط دون ألم (Full Passive Extension 0°)",
    textEn: "Full passive extension with minimal effusion",
    met: true,
  },
  {
    id: "c2",
    phase: "ACUTE_TO_ROM",
    textAr: "ثني الركبة الفعال لا يقل عن 120 درجة (Active Knee Flexion ≥ 120°)",
    textEn: "Active flexion at least 120 degrees",
    met: true,
  },
  {
    id: "c3",
    phase: "ROM_TO_STRENGTH",
    textAr: "انقباض كامل لعضلة الكواد دون أي تأخر في الرفع المستقيم (No Quad Lag in SLR)",
    textEn: "Good quad activation without extension lag",
    met: true,
  },
  {
    id: "c4",
    phase: "ROM_TO_STRENGTH",
    textAr: "نمط مشي متماثل وسليم دون عكازات أو عرج (Normal Gait Pattern without Limp)",
    textEn: "Normal symmetric gait pattern without crutches",
    met: false,
  },
  {
    id: "c5",
    phase: "STRENGTH_TO_FUNCTIONAL",
    textAr: "مستوى الألم لا يتجاوز 2 من 10 أثناء الأنشطة اليومية (VAS Pain Score ≤ 2/10)",
    textEn: "VAS score <= 2/10 in daily activities",
    met: true,
  },
  {
    id: "c6",
    phase: "STRENGTH_TO_FUNCTIONAL",
    textAr: "فارق محيط الفخذ أقل من 10% مقارنة بالجانب السليم (Thigh Girth Deficit < 10%)",
    textEn: "Limb symmetry index >= 90% for thigh girth",
    met: false,
  },
];

const RECURRING_DAYS_MAP: Record<string, string> = {
  SUN: "الأحد",
  MON: "الاثنين",
  TUE: "الثلاثاء",
  WED: "الأربعاء",
  THU: "الخميس",
  FRI: "الجمعة",
  SAT: "السبت",
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Main state
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Exercise Schedule Interactive State
  const [isRestDay, setIsRestDay] = useState(false);
  const [dailyExercises, setDailyExercises] = useState<ScheduleExerciseItem[]>([]);
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // Phase Transition Checklist State
  const [criteria, setCriteria] = useState<PhaseCriterion[]>(DEFAULT_PHASE_CRITERIA);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);
  const [advanceSuccess, setAdvanceSuccess] = useState(false);

  // ROM Filter State
  const [romSearch, setRomSearch] = useState("");
  const [romJointFilter, setRomJointFilter] = useState("ALL");

  // Quick Appointment Scheduler Dialog State
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"IN_CLINIC" | "ONLINE">("IN_CLINIC");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);

  // Delete Patient Confirmation Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Patient Details
  const fetchPatientDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("لم يتم العثور على سجل المريض المطلوب");
        }
        throw new Error("حدث خطأ أثناء تحميل بيانات المريض");
      }
      const data: PatientDetail = await res.json();
      setPatient(data);

      // Initialize daily exercises
      if (data.exerciseSchedules?.length > 0) {
        const latestSchedule = data.exerciseSchedules[0];
        setIsRestDay(latestSchedule.isRestDay);
        if (latestSchedule.exercises?.length > 0) {
          setDailyExercises(latestSchedule.exercises);
        } else {
          initExercisesFromProgram(data);
        }
      } else {
        initExercisesFromProgram(data);
      }
    } catch (err: any) {
      console.error("Error fetching patient details:", err);
      setError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const initExercisesFromProgram = (data: PatientDetail) => {
    const activeProgram = data.rehabPrograms?.[0];
    if (activeProgram?.programExercises?.length > 0) {
      const mapped: ScheduleExerciseItem[] = activeProgram.programExercises.map((pe) => ({
        id: pe.id,
        exerciseId: pe.exerciseId,
        exercise: pe.exercise,
        targetSets: pe.sets || 3,
        targetReps: pe.reps || 10,
        completedSets: 0,
        completedReps: 0,
        orderIndex: pe.orderIndex,
      }));
      setDailyExercises(mapped);
    } else {
      // Default initial exercises if none in DB
      setDailyExercises([
        {
          id: "ex-1",
          exerciseId: "sample-1",
          exercise: {
            id: "sample-1",
            nameAr: "تقوية العضلة الرباعية متساوية القياس",
            nameEn: "Quadriceps Isometric Sets",
            region: "LOWER",
            category: "Quadriceps",
            isIsometric: true,
            isometricAngle: 60,
            instructions: "الضغط بقوة نحو الأسفل لتثبيت مد الركبة لمدة 5-8 ثوانٍ.",
          },
          targetSets: 3,
          targetReps: 12,
          completedSets: 1,
          completedReps: 12,
          orderIndex: 0,
        },
        {
          id: "ex-2",
          exerciseId: "sample-2",
          exercise: {
            id: "sample-2",
            nameAr: "رفع الساق المستقيمة (SLR)",
            nameEn: "Straight Leg Raise",
            region: "LOWER",
            category: "Hip Flexors / Quad",
            isIsometric: false,
            instructions: "رفع الساق بزاوية 45 درجة مع إحكام مد الركبة بالكامل.",
          },
          targetSets: 3,
          targetReps: 10,
          completedSets: 2,
          completedReps: 10,
          orderIndex: 1,
        },
        {
          id: "ex-3",
          exerciseId: "sample-3",
          exercise: {
            id: "sample-3",
            nameAr: "تمرين الجسر لتفعيل الهامسترنج والأرداف",
            nameEn: "Glute Bridges & Pelvic Lift",
            region: "LOWER",
            category: "Hamstrings / Glutes",
            isIsometric: false,
            instructions: "رفع الحوض مع الضغط على الكعبين وتثبيت ثانيتين في القمة.",
          },
          targetSets: 4,
          targetReps: 12,
          completedSets: 0,
          completedReps: 0,
          orderIndex: 2,
        },
      ]);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  // WhatsApp Summary Message
  const handleSendWhatsApp = () => {
    if (!patient) return;
    const currentPhase = patient.rehabPrograms?.[0]?.phase || "ACUTE";
    const phaseLabel = getPhaseLabel(currentPhase).ar;
    const sideText =
      patient.injuredSide === "RIGHT"
        ? "الجانب الأيمن (Right)"
        : patient.injuredSide === "LEFT"
        ? "الجانب الأيسر (Left)"
        : "كلا الجانبين (Bilateral)";

    const messageLines = [
      `*تقرير حالة مريض — Peak Motion* 🩺`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *اسم المريض:* ${patient.name}`,
      `🏥 *التشخيص:* ${patient.injuryType}`,
      `📍 *الجهة المصابة:* ${sideText}`,
      `⚡ *المرحلة التأهيلية:* ${phaseLabel}`,
      `📅 *تاريخ الإصابة:* ${formatDate(patient.injuryDate)}`,
      `🏁 *بدء التأهيل:* ${formatDate(patient.rehabStartDate)}`,
      patient.surgeryDate ? `🔪 *تاريخ الجراحة:* ${formatDate(patient.surgeryDate)}` : null,
      `📊 *الحالة الإكلينيكية:* ${patient.status === "active" ? "نشط (Active)" : "مكتمل (Completed)"}`,
      patient.phone ? `📞 *الهاتف:* ${patient.phone}` : null,
      patient.notes ? `📝 *ملاحظات الأخصائي:* ${patient.notes}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `عيادة Peak Motion للعلاج الطبيعي والتأهيل الحركي`,
    ].filter(Boolean);

    const message = messageLines.join("\n");
    const link = generateWhatsAppShareLink(message);
    window.open(link, "_blank");
  };

  // Schedule Appointment Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsScheduling(true);
    setSchedulerError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          type: appointmentType,
          date: appointmentDate,
          startTime,
          endTime,
          recurringDays: recurringDays.length > 0 ? recurringDays : undefined,
          notes: appointmentNotes || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل حجز الموعد");
      }

      setIsSchedulerOpen(false);
      setAppointmentNotes("");
      setRecurringDays([]);
      fetchPatientDetails();
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      setSchedulerError(err.message || "حدث خطأ أثناء حجز الموعد");
    } finally {
      setIsScheduling(false);
    }
  };

  // Delete Patient Confirm
  const handleDeletePatient = async () => {
    if (!patient) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cases/${patient.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("فشل حذف ملف المريض");
      }
      router.push("/cases");
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.message || "حدث خطأ أثناء الحذف");
      setIsDeleting(false);
    }
  };

  // Exercise Counters (+1 / -1)
  const handleUpdateSets = (index: number, delta: number) => {
    setDailyExercises((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newSets = Math.max(0, item.completedSets + delta);
        return { ...item, completedSets: newSets };
      })
    );
  };

  const handleUpdateReps = (index: number, delta: number) => {
    setDailyExercises((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newReps = Math.max(0, item.completedReps + delta);
        return { ...item, completedReps: newReps };
      })
    );
  };

  // Copy Exercise Schedule to Clipboard
  const handleCopySchedule = () => {
    if (!patient) return;

    let textToCopy = "";
    if (isRestDay) {
      textToCopy = `*جدول التأهيل الحركي — Peak Motion*\nالمريض: ${patient.name}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}\n\n🧘‍♂️ اليوم مخصص للراحة النشطة والاستشفاء العضلي (Active Rest & Recovery Day).`;
    } else {
      const itemsText = dailyExercises
        .map((ex, i) => {
          return `${i + 1}. *${ex.exercise?.nameAr || "تمرين"}* (${ex.exercise?.nameEn || ""})\n   🎯 المستهدف: ${ex.targetSets} مجموعات × ${ex.targetReps} تكرار\n   ✅ المنجز: ${ex.completedSets}/${ex.targetSets} مجموعات (${ex.completedReps} تكرار)`;
        })
        .join("\n\n");

      textToCopy = `*جدول التمارين اليومي — Peak Motion* 🏋️‍♂️\nالمريض: ${patient.name}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}\n━━━━━━━━━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━━━━━━━━━\nعيادة Peak Motion للعلاج الطبيعي`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2500);
  };

  // Phase Transition Progress
  const criteriaMetCount = criteria.filter((c) => c.met).length;
  const criteriaProgressPct = Math.round((criteriaMetCount / criteria.length) * 100);

  const handleToggleCriterion = (criterionId: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === criterionId ? { ...c, met: !c.met } : c))
    );
  };

  // Advance Phase Action
  const handleAdvancePhase = async () => {
    if (!patient) return;
    setIsAdvancingPhase(true);
    try {
      const phasesOrder = [
        "ACUTE",
        "RESTORE_ROM",
        "STRENGTH",
        "NEUROMUSCULAR",
        "FUNCTIONAL",
        "RETURN_TO_SPORT",
      ];
      const currentPhase = patient.rehabPrograms?.[0]?.phase || "ACUTE";
      const currentIndex = phasesOrder.indexOf(currentPhase);
      const nextPhase =
        currentIndex >= 0 && currentIndex < phasesOrder.length - 1
          ? phasesOrder[currentIndex + 1]
          : currentPhase;

      const res = await fetch(`/api/cases/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: `${patient.notes || ""}\n[${new Date().toLocaleDateString("ar-EG")}] تم استيفاء شروط الترقية للمرحلة (${nextPhase})`,
        }),
      });

      if (!res.ok) throw new Error("فشل تحديث مرحلة المريض");

      setAdvanceSuccess(true);
      setTimeout(() => setAdvanceSuccess(false), 3000);
      fetchPatientDetails();
    } catch (err: any) {
      console.error("Advance phase error:", err);
      alert(err.message || "حدث خطأ أثناء ترقية المرحلة");
    } finally {
      setIsAdvancingPhase(false);
    }
  };

  // Filtered ROM Measurements
  const filteredRomMeasurements = useMemo(() => {
    if (!patient?.romMeasurements) return [];
    return patient.romMeasurements.filter((m) => {
      const matchesSearch =
        romSearch === "" ||
        m.joint.toLowerCase().includes(romSearch.toLowerCase()) ||
        m.movement.toLowerCase().includes(romSearch.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(romSearch.toLowerCase()));

      const matchesJoint =
        romJointFilter === "ALL" ||
        m.joint.toLowerCase() === romJointFilter.toLowerCase();

      return matchesSearch && matchesJoint;
    });
  }, [patient?.romMeasurements, romSearch, romJointFilter]);

  // Flattened Girth Measurements for Multi-Date Comparison
  const flattenedGirthRows = useMemo(() => {
    if (!patient?.girthMeasurements) return [];
    const rows: {
      evaluationId: string;
      date: string;
      landmark: string;
      distanceCm: number;
      injuredCm: number;
      healthyCm: number | null;
      deficitCm: number | null;
      lsi: number | null;
    }[] = [];

    patient.girthMeasurements.forEach((evaluation) => {
      evaluation.measurements?.forEach((m) => {
        const diff =
          m.healthyCm != null ? Number((m.healthyCm - m.injuredCm).toFixed(1)) : null;
        const lsi =
          m.healthyCm && m.healthyCm > 0
            ? Math.round((m.injuredCm / m.healthyCm) * 100)
            : null;

        rows.push({
          evaluationId: evaluation.id,
          date: evaluation.date,
          landmark: evaluation.landmark,
          distanceCm: m.distanceCm,
          injuredCm: m.injuredCm,
          healthyCm: m.healthyCm || null,
          deficitCm: diff,
          lsi,
        });
      });
    });

    return rows;
  }, [patient?.girthMeasurements]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
          <Card className="border-slate-200 animate-pulse">
            <CardContent className="p-8 space-y-4">
              <div className="h-8 w-64 bg-slate-200 rounded" />
              <div className="h-4 w-96 bg-slate-100 rounded" />
              <div className="grid grid-cols-4 gap-4 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-navy-950">
            {error || "لم يتم العثور على المريض"}
          </h2>
          <Button asChild variant="outline">
            <Link href="/cases">
              <ArrowRight className="w-4 h-4 ml-1.5" /> العودة إلى قائمة الحالات
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentProgram = patient.rehabPrograms?.[0];
  const phaseInfo = currentProgram ? getPhaseLabel(currentProgram.phase) : getPhaseLabel("ACUTE");

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumbs & Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى الحالات (Cases)</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              ملف رقم: #{patient.id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* PATIENT HEADER CARD */}
        {/* ═══════════════════════════════════════════ */}
        <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-white">
          <div className="h-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600" />
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Top Row: Avatar, Name, Status & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-emerald-600/20 shrink-0">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                      {patient.name}
                    </h1>
                    {patient.status === "active" ? (
                      <Badge variant="success" className="text-xs font-semibold">
                        نشط — Active
                      </Badge>
                    ) : patient.status === "completed" ? (
                      <Badge variant="secondary" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                        مكتمل — Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {patient.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span>{patient.phone || "بدون هاتف"}</span>
                    {patient.email && <span>• {patient.email}</span>}
                    {patient.gender && <span>• {patient.gender === "male" ? "ذكر" : "أنثى"}</span>}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <Button
                  onClick={handleSendWhatsApp}
                  variant="whatsapp"
                  size="sm"
                  className="gap-1.5 font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تقرير واتساب</span>
                </Button>

                <Button
                  onClick={() => setIsSchedulerOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>حجز موعد</span>
                </Button>

                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="p-2 h-9 w-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  title="حذف ملف المريض"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Middle Row: Diagnosis, Injured Side Badge & Current Phase Badge */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">نوع الإصابة:</span>
              <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                {patient.injuryType}
              </span>

              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-700 border-slate-200 text-xs py-1"
              >
                الجانب:{" "}
                {patient.injuredSide === "RIGHT"
                  ? "الطرف الأيمن (Right)"
                  : patient.injuredSide === "LEFT"
                  ? "الطرف الأيسر (Left)"
                  : "الطرفين (Bilateral)"}
              </Badge>

              <Badge
                variant="default"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs py-1 font-semibold"
              >
                المرحلة: {phaseInfo.ar} ({phaseInfo.en})
              </Badge>
            </div>

            {/* Bottom Row: Key Dates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">تاريخ الإصابة</span>
                <span className="font-bold text-navy-950 mt-1 block">
                  {formatDate(patient.injuryDate)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">بدء التأهيل</span>
                <span className="font-bold text-navy-950 mt-1 block">
                  {formatDate(patient.rehabStartDate)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">تاريخ الجراحة</span>
                <span className="font-bold text-navy-950 mt-1 block">
                  {patient.surgeryDate ? formatDate(patient.surgeryDate) : "علاج تحفظي (بدون جراحة)"}
                </span>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 block font-medium">جلسات التأهيل المنجزة</span>
                <span className="font-bold text-emerald-900 mt-1 block">
                  {patient.appointments?.filter((a) => a.status === "completed").length || 0} جلسة مكتملة
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════ */}
        {/* TABS CONTAINER */}
        {/* ═══════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1.5 bg-slate-200/80 rounded-xl overflow-x-auto gap-1">
            <TabsTrigger
              value="overview"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Activity className="w-4 h-4" />
              <span>نظرة عامة (Overview)</span>
            </TabsTrigger>

            <TabsTrigger
              value="rom"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>المدى الحركي (ROM)</span>
            </TabsTrigger>

            <TabsTrigger
              value="girth"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Ruler className="w-4 h-4" />
              <span>محيط العضلات (Girth)</span>
            </TabsTrigger>

            <TabsTrigger
              value="schedule"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Dumbbell className="w-4 h-4" />
              <span>جدول التمارين (Schedule)</span>
            </TabsTrigger>

            <TabsTrigger
              value="appointments"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>المواعيد ({patient.appointments?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinical Details Card */}
              <Card className="border-slate-200/90 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>الملف الإكلينيكي وآلية الإصابة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">آلية الإصابة (Mechanism of Injury):</span>
                    <p className="font-medium text-slate-800 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {patient.mechanismOfInjury || "لم تسجل تفاصيل آلية الإصابة."}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block font-medium">ملاحظات الأخصائي (Clinical Notes):</span>
                    <p className="font-medium text-slate-800 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {patient.notes || "لا توجد ملاحظات إضافية."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Rehab Program Summary */}
              <Card className="border-slate-200/90 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>البرنامج التأهيلي النشط</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800">المرحلة الحالية:</span>
                      <Badge variant="success" className="font-bold">
                        {phaseInfo.ar}
                      </Badge>
                    </div>
                    <p className="text-xs text-emerald-700">
                      تاريخ بدء المرحلة: {currentProgram ? formatDate(currentProgram.startDate) : formatDate(patient.rehabStartDate)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 block font-medium">تمارين المرحلة:</span>
                    <p className="text-xs text-slate-600">
                      يحتوي البرنامج على {currentProgram?.programExercises?.length || dailyExercises.length} تمرين مخصص لاستعادة المدى والقوة والتحكم العصبي العضلي.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PHASE TRANSITION CHECKLIST SECTION */}
            <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                      <span>معايير الانتقال للمرحلة التالية (Phase Transition Criteria)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      قائمة الفحوصات الإكلينيكية والوظيفية اللازمة لترقية الحالة بأمان
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold px-3 py-1 self-start sm:self-auto",
                      criteriaProgressPct === 100
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    )}
                  >
                    استيفاء: {criteriaMetCount} من {criteria.length} ({criteriaProgressPct}%)
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <Progress value={criteriaProgressPct} className="h-2 bg-slate-200" />
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-3">
                {criteria.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer",
                      item.met
                        ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Checkbox
                      checked={item.met}
                      onCheckedChange={() => handleToggleCriterion(item.id)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <span className="font-semibold block">{item.textAr}</span>
                      <span className="text-xs text-slate-400 block font-normal">{item.textEn}</span>
                    </div>
                  </label>
                ))}
              </CardContent>

              <CardFooter className="bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
                <span className="text-xs text-slate-500">
                  {criteriaProgressPct === 100
                    ? "✨ جميع الشروط مستوفاة! يمكنك ترقية الحالة للمرحلة التالية."
                    : "⚠️ يجب استيفاء كافة الشروط الوظيفية لتقليل احتمالية الانتكاسة."}
                </span>

                <Button
                  onClick={handleAdvancePhase}
                  disabled={isAdvancingPhase || criteriaProgressPct < 80}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAdvancingPhase ? "جارٍ التحديث..." : "ترقية الحالة للمرحلة التالية"}</span>
                </Button>
              </CardFooter>
            </Card>

            {advanceSuccess && (
              <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>تم تحديث المرحلة التأهيلية وسجل التطور بنجاح!</span>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 2: ROM HISTORY (COMPARISON TABLE) */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="rom" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <RotateCw className="w-5 h-5 text-emerald-600" />
                      <span>سجل قياسات المدى الحركي (ROM History & Deficit)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      مقارنة زوايا المفصل المصاب بالطرف السليم عبر مختلف الزيارات وحساب العجز
                    </CardDescription>
                  </div>

                  {/* Search & Joint Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-44">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="بحث بالحركة..."
                        value={romSearch}
                        onChange={(e) => setRomSearch(e.target.value)}
                        className="h-9 ps-8 text-xs"
                      />
                    </div>
                    <div className="w-36">
                      <Select value={romJointFilter} onValueChange={setRomJointFilter}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue placeholder="تصفية حسب المفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">جميع المفاصل</SelectItem>
                          <SelectItem value="Knee">الركبة (Knee)</SelectItem>
                          <SelectItem value="Hip">الورك (Hip)</SelectItem>
                          <SelectItem value="Ankle">الكاحل (Ankle)</SelectItem>
                          <SelectItem value="Shoulder">الكتف (Shoulder)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredRomMeasurements.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <RotateCw className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لا توجد قياسات مدى حركي مسجلة بعد لهذا المريض.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-start">التاريخ</TableHead>
                        <TableHead className="text-start">المفصل (Joint)</TableHead>
                        <TableHead className="text-start">الحركة (Movement)</TableHead>
                        <TableHead className="text-start">الطرف المصاب (Injured°)</TableHead>
                        <TableHead className="text-start">الطرف السليم (Healthy°)</TableHead>
                        <TableHead className="text-start">العجز الحركي (Deficit)</TableHead>
                        <TableHead className="text-start">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRomMeasurements.map((m) => {
                        const hasHealthy = m.healthyAngle != null && m.healthyAngle > 0;
                        const diffAngle = hasHealthy ? Number((m.healthyAngle! - m.injuredAngle).toFixed(1)) : null;
                        const deficitPct =
                          hasHealthy && m.healthyAngle! > 0
                            ? Math.round((Math.abs(diffAngle!) / m.healthyAngle!) * 100)
                            : null;

                        return (
                          <TableRow key={m.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-semibold text-xs text-slate-700 whitespace-nowrap">
                              {formatDateShort(m.date)}
                            </TableCell>
                            <TableCell className="font-medium text-xs text-navy-950">
                              {getJointLabel(m.joint)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">
                              {m.movement}
                            </TableCell>
                            <TableCell className="font-bold text-xs text-emerald-700">
                              {m.injuredAngle}°
                            </TableCell>
                            <TableCell className="font-semibold text-xs text-slate-600">
                              {hasHealthy ? `${m.healthyAngle}°` : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {diffAngle !== null ? (
                                diffAngle > 0 ? (
                                  <Badge variant="destructive" className="text-[11px] font-bold">
                                    -{diffAngle}° ({deficitPct}%)
                                  </Badge>
                                ) : (
                                  <Badge variant="success" className="text-[11px] font-bold">
                                    كامل (0°)
                                  </Badge>
                                )
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                              {m.notes || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 3: GIRTH HISTORY (MULTI-DATE TABLE) */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="girth" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-emerald-600" />
                  <span>سجل قياسات محيط العضلات والضمور (Girth Evaluation)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  مقارنة محيط الطرف المصاب بالطرف السليم عند معالم تشريحية مختلفة (Limb Symmetry Index LSI)
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {flattenedGirthRows.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Ruler className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لا توجد قياسات محيط أطراف مسجلة حتى الآن.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-start">التاريخ</TableHead>
                        <TableHead className="text-start">المعلم التشريحي (Landmark)</TableHead>
                        <TableHead className="text-start">المسافة (Distance)</TableHead>
                        <TableHead className="text-start">المصاب (Injured cm)</TableHead>
                        <TableHead className="text-start">السليم (Healthy cm)</TableHead>
                        <TableHead className="text-start">الضمور / الفارق</TableHead>
                        <TableHead className="text-start">مؤشر التماثل (LSI %)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenedGirthRows.map((row, idx) => (
                        <TableRow key={`${row.evaluationId}-${idx}`} className="hover:bg-slate-50/60">
                          <TableCell className="font-semibold text-xs text-slate-700 whitespace-nowrap">
                            {formatDateShort(row.date)}
                          </TableCell>
                          <TableCell className="font-medium text-xs text-navy-950">
                            {row.landmark}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {row.distanceCm} سم
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-700">
                            {row.injuredCm} سم
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-slate-600">
                            {row.healthyCm != null ? `${row.healthyCm} سم` : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.deficitCm !== null ? (
                              row.deficitCm > 0 ? (
                                <Badge variant="destructive" className="text-[11px] font-bold">
                                  ضمور: -{row.deficitCm} سم
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[11px] font-bold">
                                  متماثل ({row.deficitCm} سم)
                                </Badge>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {row.lsi ? (
                              <span
                                className={cn(
                                  row.lsi >= 90 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"
                                )}
                              >
                                {row.lsi}%
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 4: EXERCISE SCHEDULE (DAILY TRACKING) */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Toolbar: Rest Day Switch & Copy Routine */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="rest-day-toggle"
                    checked={isRestDay}
                    onCheckedChange={setIsRestDay}
                  />
                  <label
                    htmlFor="rest-day-toggle"
                    className="text-sm font-bold text-navy-950 cursor-pointer"
                  >
                    {isRestDay ? "🛌 اليوم مخصص للراحة (Rest Day)" : "🏋️ يوم تدريب نشط"}
                  </label>
                </div>

                {isRestDay && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
                    مفعل: لا توجد أحمال تدريبية لليوم
                  </Badge>
                )}
              </div>

              {/* Copy Schedule Button */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopySchedule}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  {copiedSchedule ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-600" />
                      <span>نسخ جدول التمارين</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Rest Day State */}
            {isRestDay ? (
              <Card className="border-amber-200 bg-amber-50/40">
                <CardContent className="p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
                    🧘‍♂️
                  </div>
                  <h3 className="text-xl font-bold text-amber-950">
                    اليوم مخصص للراحة والاستشفاء العضلي
                  </h3>
                  <p className="text-sm text-amber-800 max-w-lg mx-auto">
                    يُنصح بتمارين الإطالة اللطيفة، تطبيق الكمادات الباردة، وتجنب الإجهاد العالي للسماح للأنسجة بالتعافي وتقليل الالتهاب.
                  </p>
                </CardContent>
              </Card>
            ) : dailyExercises.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>لم يتم تعيين تمارين للمرحلة الحالية بعد.</p>
              </div>
            ) : (
              /* Exercise Cards Grid with Interactive +1 / -1 Buttons */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dailyExercises.map((item, index) => {
                  const targetSets = item.targetSets || 3;
                  const completedSets = item.completedSets || 0;
                  const isSetsCompleted = completedSets >= targetSets;
                  const pct = Math.min(100, Math.round((completedSets / targetSets) * 100));

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "border shadow-sm flex flex-col justify-between transition-all",
                        isSetsCompleted
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-slate-200/90 hover:border-emerald-300 bg-white"
                      )}
                    >
                      <CardHeader className="pb-3 border-b border-slate-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                                isSetsCompleted
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {isSetsCompleted ? "✓" : index + 1}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-navy-950 line-clamp-1">
                                {item.exercise?.nameAr}
                              </CardTitle>
                              <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
                                {item.exercise?.nameEn}
                              </CardDescription>
                            </div>
                          </div>

                          <Badge variant="secondary" className="text-[10px]">
                            {item.exercise?.category || "تأهيل"}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 pb-4 space-y-4">
                        {/* Target Display */}
                        <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-medium">الهدف المقرر:</span>
                          <span className="font-bold text-navy-950">
                            {item.targetSets} مجموعات × {item.targetReps} تكرار
                          </span>
                        </div>

                        {/* Interactive Counter: Sets (+1 / -1) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              المجموعات المنجزة (Sets):
                            </span>
                            <span className="font-bold text-emerald-700">
                              {completedSets} / {targetSets}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateSets(index, -1)}
                              disabled={completedSets <= 0}
                              className="h-8 w-8 rounded-md bg-white border-slate-300"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>

                            <span className="font-extrabold text-base text-navy-950">
                              {completedSets}
                            </span>

                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateSets(index, 1)}
                              className="h-8 w-8 rounded-md bg-white border-slate-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Interactive Counter: Reps (+1 / -1) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              التكرارات المنجزة (Reps):
                            </span>
                            <span className="font-bold text-slate-800">
                              {item.completedReps > 0 ? item.completedReps : item.targetReps} تكرار
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateReps(index, -1)}
                              disabled={item.completedReps <= 0}
                              className="h-8 w-8 rounded-md bg-white border-slate-300"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>

                            <span className="font-extrabold text-base text-navy-950">
                              {item.completedReps > 0 ? item.completedReps : item.targetReps}
                            </span>

                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateReps(index, 1)}
                              className="h-8 w-8 rounded-md bg-white border-slate-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>نسبة الإنجاز</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-slate-100" />
                        </div>

                        {/* Instructions */}
                        {item.exercise?.instructions && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            💡 {item.exercise.instructions}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 5: APPOINTMENTS */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="appointments" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span>جدول مواعيد وجلسات المريض</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      قائمة الجلسات التأهيلية السابقة والمستقبلية المسجلة في المركز
                    </CardDescription>
                  </div>

                  <Button
                    onClick={() => setIsSchedulerOpen(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>حجز موعد جديد</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {!patient.appointments || patient.appointments.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لا توجد مواعيد مسجلة بعد لهذا المريض.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-start">التاريخ</TableHead>
                        <TableHead className="text-start">الوقت (Time)</TableHead>
                        <TableHead className="text-start">النوع (Type)</TableHead>
                        <TableHead className="text-start">الحالة (Status)</TableHead>
                        <TableHead className="text-start">أيام التكرار</TableHead>
                        <TableHead className="text-start">ملاحظات الجلسة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patient.appointments.map((appt) => {
                        let parsedDays: string[] = [];
                        try {
                          if (appt.recurringDays) {
                            parsedDays = JSON.parse(appt.recurringDays);
                          }
                        } catch {}

                        return (
                          <TableRow key={appt.id} className="hover:bg-slate-50/60">
                            <TableCell className="font-semibold text-xs text-slate-700 whitespace-nowrap">
                              {formatDateShort(appt.date)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-800 font-bold whitespace-nowrap">
                              {appt.startTime} — {appt.endTime}
                            </TableCell>
                            <TableCell className="text-xs">
                              {appt.type === "ONLINE" ? (
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px]">
                                  أونلاين (Online)
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[11px]">
                                  في العيادة (In-Clinic)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[11px]">
                                {appt.status === "scheduled"
                                  ? "مجدول"
                                  : appt.status === "completed"
                                  ? "مكتمل"
                                  : appt.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {parsedDays.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {parsedDays.map((d) => (
                                    <span
                                      key={d}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium"
                                    >
                                      {RECURRING_DAYS_MAP[d] || d}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                "بدون تكرار"
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                              {appt.notes || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* QUICK APPOINTMENT SCHEDULER DIALOG */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>حجز موعد للمريض: {patient.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              حدد توقيت الجلسة ونوعها لحفظها في جدول مواعيد المريض
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
            {schedulerError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {schedulerError}
              </div>
            )}

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                نوع الجلسة (Appointment Type)
              </label>
              <Select
                value={appointmentType}
                onValueChange={(val: "IN_CLINIC" | "ONLINE") => setAppointmentType(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_CLINIC">
                    جلسة في العيادة (In-Clinic Session)
                  </SelectItem>
                  <SelectItem value="ONLINE">
                    استشارة أونلاين (Online Consultation)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                تاريخ الجلسة (Date)
              </label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            {/* Start & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  وقت البدء
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  وقت الانتهاء
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recurring Days */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                تكرار أسبوعي (اختياري)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {Object.entries(RECURRING_DAYS_MAP).map(([key, label]) => {
                  const isChecked = recurringDays.includes(key);
                  return (
                    <label
                      key={key}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer text-xs transition-colors",
                        isChecked
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRecurringDays([...recurringDays, key]);
                          } else {
                            setRecurringDays(recurringDays.filter((d) => d !== key));
                          }
                        }}
                        className="sr-only"
                      />
                      <span>{label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{key}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                ملاحظات الجلسة
              </label>
              <Textarea
                placeholder="ملاحظات الجلسة وأهداف التقييم..."
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSchedulerOpen(false)}
                disabled={isScheduling}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isScheduling}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isScheduling ? "جارٍ الحجز..." : "تأكيد الموعد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* DELETE PATIENT CONFIRMATION DIALOG */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>تأكيد حذف ملف المريض</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              هل أنت متأكد من رغبتك في حذف ملف المريض{" "}
              <strong className="text-navy-950 font-bold">"{patient.name}"</strong> نهائياً؟
              <span className="block text-xs text-red-500 mt-2 font-medium">
                سيتم حذف كافة البيانات والقياسات وجداول التمارين المرتبطة بهذا المريض.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
