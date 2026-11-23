"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Video,
  Phone,
  Calendar,
  Clock,
  ExternalLink,
  MessageCircle,
  Monitor,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Users,
  Settings,
  AlertCircle,
  Check,
  Copy,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  RefreshCw,
  FileText,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Play,
  RotateCcw,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn, formatDate, generateWhatsAppLink } from "@/lib/utils";
import { AdminGuard } from "@/components/auth/AdminGuard";

// ── TypeScript Types ──

export interface PatientRecord {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  injuryType: string;
  injuredSide?: string | null;
  status?: string;
  rehabPrograms?: { phase: string; isActive: boolean }[];
}

export interface Consultation {
  id: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    phone?: string | null;
    injuryType: string;
  };
  userId?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: "zoom" | "whatsapp" | "webrtc";
  meetingLink?: string | null;
  notes?: string | null;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string;
}

export interface OnlineHour {
  id: string;
  dayOfWeek: number;
  dayNameAr: string;
  dayNameEn: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

// ── Real Clinic Schedule Initial Hours ──

const INITIAL_HOURS: OnlineHour[] = [
  { id: "h-0", dayOfWeek: 0, dayNameAr: "الأحد", dayNameEn: "Sunday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "h-1", dayOfWeek: 1, dayNameAr: "الاثنين", dayNameEn: "Monday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "h-2", dayOfWeek: 2, dayNameAr: "الثلاثاء", dayNameEn: "Tuesday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "h-3", dayOfWeek: 3, dayNameAr: "الأربعاء", dayNameEn: "Wednesday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "h-4", dayOfWeek: 4, dayNameAr: "الخميس", dayNameEn: "Thursday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "h-5", dayOfWeek: 5, dayNameAr: "الجمعة", dayNameEn: "Friday", startTime: "14:00", endTime: "20:00", isOpen: false },
  { id: "h-6", dayOfWeek: 6, dayNameAr: "السبت", dayNameEn: "Saturday", startTime: "11:00", endTime: "19:00", isOpen: true },
];

export default function OnlineFollowUpPage() {
  return (
    <AdminGuard>
      <OnlineFollowUpContent />
    </AdminGuard>
  );
}

function OnlineFollowUpContent() {
  // ── States ──
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [onlineHours, setOnlineHours] = useState<OnlineHour[]>(INITIAL_HOURS);

  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState<string>("12:00");
  const [duration, setDuration] = useState<number>(30);
  const [meetingType, setMeetingType] = useState<"zoom" | "whatsapp" | "webrtc">("zoom");
  const [notes, setNotes] = useState<string>("");
  const [customMeetingLink, setCustomMeetingLink] = useState<string>("");

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Dialog States
  const [webrtcRoomOpen, setWebrtcRoomOpen] = useState(false);
  const [activeWebRtcConsultation, setActiveWebRtcConsultation] = useState<Consultation | null>(null);
  const [webrtcMicMuted, setWebrtcMicMuted] = useState(false);
  const [webrtcVideoOff, setWebrtcVideoOff] = useState(false);
  const [webrtcScreenSharing, setWebrtcScreenSharing] = useState(false);
  const [webrtcElapsedSeconds, setWebrtcElapsedSeconds] = useState(0);

  const [quickWhatsAppOpen, setQuickWhatsAppOpen] = useState(false);
  const [quickZoomOpen, setQuickZoomOpen] = useState(false);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickPatientName, setQuickPatientName] = useState("");
  const [quickZoomUrl, setQuickZoomUrl] = useState("https://zoom.us/j/peakmotion");

  // Filter for history table
  const [historyFilter, setHistoryFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [historySearch, setHistorySearch] = useState("");

  // ── Data Fetching via APIs ──

  useEffect(() => {
    fetchPatients();
    fetchConsultations();
    fetchOnlineHours();
  }, []);

  // WebRTC call timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (webrtcRoomOpen) {
      setWebrtcElapsedSeconds(0);
      timer = setInterval(() => {
        setWebrtcElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [webrtcRoomOpen]);

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const res = await fetch("/api/cases");
      let remoteCases: PatientRecord[] = [];
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          remoteCases = data;
        }
      }

      // Merge with browser local store
      let localCases: PatientRecord[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("revive_cases");
          if (raw) localCases = JSON.parse(raw);
        } catch {
          // ignore
        }
      }

      // Deduplicate by ID
      const map = new Map<string, PatientRecord>();
      for (const c of remoteCases) {
        if (c.id) map.set(c.id, c);
      }
      for (const c of localCases) {
        if (c.id && !map.has(c.id)) {
          map.set(c.id, c);
        }
      }

      setPatients(Array.from(map.values()));
    } catch (err) {
      console.warn("Could not fetch /api/cases, checking local cases:", err);
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("revive_cases");
          if (raw) setPatients(JSON.parse(raw));
        } catch {
          setPatients([]);
        }
      } else {
        setPatients([]);
      }
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      setIsLoadingConsultations(true);
      const res = await fetch("/api/consultations");
      let remoteConsults: Consultation[] = [];
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          remoteConsults = data;
        }
      }

      // Merge with local consultations
      let localConsults: Consultation[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("revive_consultations");
          if (raw) localConsults = JSON.parse(raw);
        } catch {
          // ignore
        }
      }

      const map = new Map<string, Consultation>();
      for (const c of remoteConsults) {
        if (c.id) map.set(c.id, c);
      }
      for (const c of localConsults) {
        if (c.id && !map.has(c.id)) {
          map.set(c.id, c);
        }
      }

      setConsultations(Array.from(map.values()));
    } catch (err) {
      console.error("Failed to fetch /api/consultations:", err);
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("revive_consultations");
          if (raw) setConsultations(JSON.parse(raw));
        } catch {
          setConsultations([]);
        }
      } else {
        setConsultations([]);
      }
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  const fetchOnlineHours = async () => {
    try {
      const res = await fetch("/api/online-hours");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOnlineHours(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch /api/online-hours:", err);
    }
  };

  // ── Selected Patient Details Helper ──
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // When patient is selected, optionally auto-fill phone for quick actions
  useEffect(() => {
    if (selectedPatient) {
      setQuickPhone(selectedPatient.phone || "");
      setQuickPatientName(selectedPatient.name);
    }
  }, [selectedPatient]);

  // ── Consultations Split ──
  const activeConsultations = useMemo(() => {
    return consultations.filter((c) => c.status === "scheduled");
  }, [consultations]);

  const historyConsultations = useMemo(() => {
    return consultations
      .filter((c) => c.status === "completed" || c.status === "cancelled")
      .filter((c) => {
        if (historyFilter === "completed") return c.status === "completed";
        if (historyFilter === "cancelled") return c.status === "cancelled";
        return true;
      })
      .filter((c) => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
          c.patient.name.toLowerCase().includes(q) ||
          c.patient.injuryType.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
        );
      });
  }, [consultations, historyFilter, historySearch]);

  // ── Action Handlers ──

  const handleScheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFeedbackMessage({
        type: "error",
        text: "يرجى اختيار مريض من القائمة للمتابعة أونلاين.",
      });
      return;
    }

    try {
      setIsScheduling(true);
      setFeedbackMessage(null);

      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);

      const payload = {
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name,
        patientPhone: selectedPatient?.phone,
        injuryType: selectedPatient?.injuryType,
        scheduledAt: scheduledDateTime.toISOString(),
        durationMinutes: duration,
        meetingType,
        meetingLink: customMeetingLink || undefined,
        notes,
      };

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save consultation");
      }

      const created = await res.json();
      setConsultations((prev) => {
        const nextList = [created, ...prev.filter((c) => c.id !== created.id)];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("revive_consultations", JSON.stringify(nextList));
          } catch {
            // ignore
          }
        }
        return nextList;
      });

      setFeedbackMessage({
        type: "success",
        text: `تمت جدولة جلسة المتابعة بنجاح للمريض: ${selectedPatient?.name} عبر ${
          meetingType === "zoom" ? "Zoom" : meetingType === "whatsapp" ? "WhatsApp Video" : "WebRTC"
        }`,
      });

      // Reset form
      setNotes("");
      setCustomMeetingLink("");
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: "error",
        text: "تعذر حفظ الموعد في الوقت الحالي، يرجى إعادة المحاولة.",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "completed" | "cancelled") => {
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setConsultations((prev) => {
          const nextList = prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("revive_consultations", JSON.stringify(nextList));
            } catch {
              // ignore
            }
          }
          return nextList;
        });
        setFeedbackMessage({
          type: "success",
          text:
            newStatus === "completed"
              ? "تم تمييز الجلسة كمكتملة ونقلها إلى سجل الاستشارات."
              : "تم إلغاء موعد الجلسة وتحديث السجل بنجاح.",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث حالة الجلسة.",
      });
    }
  };

  const handleSaveHours = async () => {
    try {
      setIsSavingHours(true);
      const res = await fetch("/api/online-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: onlineHours }),
      });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: "تم حفظ إعدادات ساعات المتابعة أونلاين بنجاح.",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ ساعات العمل.",
      });
    } finally {
      setIsSavingHours(false);
    }
  };

  const toggleDayOpen = (dayIndex: number) => {
    setOnlineHours((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const updateDayTimes = (dayIndex: number, field: "startTime" | "endTime", val: string) => {
    setOnlineHours((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, [field]: val } : item
      )
    );
  };

  // Quick Action: Launch WhatsApp Video
  const triggerWhatsAppCall = (phone?: string | null, patientName?: string) => {
    const targetPhone = phone || quickPhone || "201012345678";
    const cleaned = targetPhone.replace(/\D/g, "");
    const msg = `مرحباً ${patientName || "عزيزي المريض"}، تحياتنا من عيادة Revive للعلاج الطبيعي والتأهيل الحركي. يرجى الاستعداد لبدء جلسة المتابعة التأهيلية أونلاين عبر مكالمة الفيديو.`;
    const url = generateWhatsAppLink(cleaned, msg);
    window.open(url, "_blank");
  };

  // Quick Action: Launch Zoom
  const triggerZoomLaunch = (link?: string | null) => {
    const target = link || quickZoomUrl || "https://zoom.us/join";
    window.open(target, "_blank");
  };

  // Launch WebRTC Room
  const triggerWebRtcRoom = (consultation?: Consultation) => {
    setActiveWebRtcConsultation(consultation || null);
    setWebrtcRoomOpen(true);
  };

  // Format seconds into MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      {/* ── 1. Page Header ── */}
      <section className="bg-gradient-to-l from-navy-950 via-navy-900 to-slate-900 text-white border-b border-white/10 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Tele-Rehabilitation Platform
                </span>
                <span className="text-xs text-slate-400">
                  عيادة العلاج الطبيعي والتأهيل الافتراضية
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Video className="w-8 h-8 text-emerald-400 shrink-0" />
                <span>المتابعة أونلاين — Online Follow-Up</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                إدارة وجدولة جلسات التأهيل الحركي عن بُعد، ومتابعة استجابة المرضى، وتقييم المدى الحركي (ROM) عبر مكالمات الفيديو المشفرة.
              </p>
            </div>

            {/* Quick KPI Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xs text-slate-400 block mb-1">جلسات قادمة</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {activeConsultations.length}
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xs text-slate-400 block mb-1">مكتملة</span>
                <span className="text-2xl font-bold text-slate-200">
                  {consultations.filter((c) => c.status === "completed").length}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="text-xs text-slate-400 block mb-1">حالة العيادة</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  متاحة أونلاين
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div
            className={cn(
              "p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-sm transition-all animate-fade-in",
              feedbackMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-red-50 border border-red-200 text-red-900"
            )}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* ── 6. Quick Actions Section (Placed prominently for immediate clinic workflows) ── */}
        <section>
          <Card className="border-slate-200/80 shadow-sm bg-gradient-to-r from-emerald-900/5 via-white to-slate-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    الإجراءات السريعة — Quick Actions
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    بدء مكالمة مباشرة أو فتح غرفة الاستشارة بضغطة زر دون الحاجة للجدولة المسبقة
                  </CardDescription>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex text-[11px] bg-white">
                  اتصال فوري مباشر
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Quick WhatsApp Video */}
                <Button
                  onClick={() => setQuickWhatsAppOpen(true)}
                  className="bg-[#25D366] hover:bg-[#1fa951] text-white font-bold h-12 flex items-center justify-center gap-2 shadow-sm rounded-xl transition-transform active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>بدء مكالمة فيديو واتساب</span>
                </Button>

                {/* 2. Quick Zoom */}
                <Button
                  onClick={() => setQuickZoomOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 flex items-center justify-center gap-2 shadow-sm rounded-xl transition-transform active:scale-[0.98]"
                >
                  <Video className="w-5 h-5" />
                  <span>فتح رابط Zoom</span>
                </Button>

                {/* 3. Instant WebRTC Room */}
                <Button
                  onClick={() => triggerWebRtcRoom()}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-bold h-12 flex items-center justify-center gap-2 shadow-sm rounded-xl transition-transform active:scale-[0.98]"
                >
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  <span>غرفة WebRTC الفورية</span>
                </Button>

                {/* 4. Quick Refresh Data */}
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchPatients();
                    fetchConsultations();
                    fetchOnlineHours();
                  }}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 h-12 flex items-center justify-center gap-2 rounded-xl"
                >
                  <RefreshCw className={cn("w-4 h-4", (isLoadingPatients || isLoadingConsultations) && "animate-spin")} />
                  <span>تحديث البيانات المباشرة</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Grid: Scheduler (Left in RTL = Primary) & Online Hours (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── 2 & 3. Patient Selector & Consultation Scheduler (7 cols) ── */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200/90 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-emerald-600 w-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    جدولة استشارة أونلاين جديدة — Consultation Scheduler
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-slate-500">
                  قم باختيار المريض وتحديد موعد الجلسة، والمدة الزمنية، ونوع منصة الاتصال.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleScheduleConsultation} className="space-y-6">
                  {/* ── 2. Patient Selector Dropdown ── */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        المريض المطلوب متابعته (Patient Selector) *
                      </span>
                      {isLoadingPatients && (
                        <span className="text-xs text-slate-400 animate-pulse">جاري جلب الحالات...</span>
                      )}
                    </label>

                    <Select
                      value={selectedPatientId}
                      onValueChange={(val) => setSelectedPatientId(val)}
                    >
                      <SelectTrigger className="w-full h-11 text-start">
                        <SelectValue placeholder="اختر مريضاً من ملفات العيادة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.length === 0 ? (
                          <SelectItem value="no-patient" disabled>
                            <span className="text-slate-400 text-xs">
                              لا توجد حالات مسجلة حالياً — قم بإضافة حالة أولاً من صفحة إضافة حالة
                            </span>
                          </SelectItem>
                        ) : (
                          patients.map((pat) => (
                            <SelectItem key={pat.id} value={pat.id}>
                              <div className="flex items-center justify-between gap-4 py-0.5">
                                <span className="font-semibold text-slate-900">{pat.name}</span>
                                <span className="text-xs text-slate-500">
                                  ({pat.injuryType})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Patient Context Card if Selected */}
                    {selectedPatient && (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-emerald-950 animate-fade-in">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-sm text-emerald-900">
                              {selectedPatient.name}
                            </span>
                            {selectedPatient.injuredSide && (
                              <Badge variant="outline" className="text-[10px] bg-white border-emerald-300">
                                الطرف: {selectedPatient.injuredSide}
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 pe-2">
                            التشخيص: {selectedPatient.injuryType}
                          </p>
                          {selectedPatient.phone && (
                            <p className="text-slate-600 font-mono dir-ltr inline-block">
                              هاتف: {selectedPatient.phone}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedPatient.phone && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => triggerWhatsAppCall(selectedPatient.phone, selectedPatient.name)}
                              className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              واتساب سريع
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Time Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        تاريخ الاستشارة (Date) *
                      </label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        وقت البدء (Start Time) *
                      </label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        مدة الاستشارة (Duration) *
                      </span>
                      <span className="text-xs text-slate-400">
                        {duration === 15 && "متابعة سريعة (Follow-up Check)"}
                        {duration === 30 && "جلسة قياسية (Standard Session)"}
                        {duration === 45 && "تقييم حركي مفصل (Detailed Eval)"}
                        {duration === 60 && "جلسة كاملة شاملة (Full Rehab)"}
                      </span>
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDuration(mins)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center flex flex-col items-center justify-center gap-0.5",
                            duration === mins
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          <span>{mins} دقيقة</span>
                          <span className={cn("text-[10px]", duration === mins ? "text-emerald-100" : "text-slate-400")}>
                            {mins} min
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Type Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-slate-500" />
                      منصة / نوع المقابلة (Meeting Type) *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Zoom */}
                      <div
                        onClick={() => setMeetingType("zoom")}
                        className={cn(
                          "cursor-pointer p-3 rounded-xl border transition-all flex items-center gap-3",
                          meetingType === "zoom"
                            ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", meetingType === "zoom" ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-600")}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm">Zoom Meeting</p>
                          <p className="text-[11px] text-slate-500">اجتماع زووم</p>
                        </div>
                      </div>

                      {/* WhatsApp Video */}
                      <div
                        onClick={() => setMeetingType("whatsapp")}
                        className={cn(
                          "cursor-pointer p-3 rounded-xl border transition-all flex items-center gap-3",
                          meetingType === "whatsapp"
                            ? "bg-emerald-50/80 border-[#25D366] text-emerald-950 ring-2 ring-[#25D366]/20"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", meetingType === "whatsapp" ? "bg-[#25D366] text-white" : "bg-slate-100 text-emerald-600")}>
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm">WhatsApp Video</p>
                          <p className="text-[11px] text-slate-500">فيديو واتساب</p>
                        </div>
                      </div>

                      {/* WebRTC */}
                      <div
                        onClick={() => setMeetingType("webrtc")}
                        className={cn(
                          "cursor-pointer p-3 rounded-xl border transition-all flex items-center gap-3",
                          meetingType === "webrtc"
                            ? "bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", meetingType === "webrtc" ? "bg-indigo-600 text-white" : "bg-slate-100 text-indigo-600")}>
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm">WebRTC Room</p>
                          <p className="text-[11px] text-slate-500">غرفة مشفرة مباشرة</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Custom Link (e.g. for Zoom) */}
                  {meetingType === "zoom" && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        رابط غرفة Zoom المخصصة (اختياري / يولد تلقائياً):
                      </label>
                      <Input
                        type="url"
                        placeholder="https://zoom.us/j/1234567890"
                        value={customMeetingLink}
                        onChange={(e) => setCustomMeetingLink(e.target.value)}
                        className="text-xs font-mono dir-ltr"
                      />
                    </div>
                  )}

                  {/* Notes Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      ملاحظات الجلسة وأهداف المتابعة السريرية (Clinical Notes)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="مثال: مراجعة تمرين Wall Sit، تقييم زاوية تمديد الركبة 0°، قياس مستوى الألم NRS (0-10)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  {/* Schedule Button */}
                  <Button
                    type="submit"
                    disabled={isScheduling || !selectedPatientId}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl text-base shadow-sm transition-all"
                  >
                    {isScheduling ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        جاري الحفظ والجدولة...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        تأكيد وجدولة المتابعة — Schedule Consultation
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── 4. Online Hours Manager (5 cols) ── */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <div className="h-1.5 bg-navy-900 w-full" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-navy-800" />
                    مدير ساعات المتابعة — Online Hours Manager
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  تحديد وتفعيل أوقات استقبال الاستشارات وجلسات التأهيل الافتراضية لكل يوم في الأسبوع.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="divide-y divide-slate-100">
                  {onlineHours.map((hour, idx) => (
                    <div
                      key={hour.dayOfWeek}
                      className={cn(
                        "py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                        !hour.isOpen && "opacity-60 bg-slate-50/50"
                      )}
                    >
                      {/* Day Label & Toggle */}
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={hour.isOpen}
                          onCheckedChange={() => toggleDayOpen(idx)}
                          aria-label={`تفعيل ${hour.dayNameAr}`}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {hour.dayNameAr}
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({hour.dayNameEn})
                            </span>
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold inline-block px-1.5 py-0.2 rounded",
                              hour.isOpen
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-slate-500 bg-slate-100"
                            )}
                          >
                            {hour.isOpen ? "متاح أونلاين" : "مغلق"}
                          </span>
                        </div>
                      </div>

                      {/* Start & End Time Inputs */}
                      {hour.isOpen ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="time"
                            value={hour.startTime}
                            onChange={(e) => updateDayTimes(idx, "startTime", e.target.value)}
                            className="h-8 w-24 text-xs font-mono text-center p-1"
                          />
                          <span className="text-xs text-slate-400">—</span>
                          <Input
                            type="time"
                            value={hour.endTime}
                            onChange={(e) => updateDayTimes(idx, "endTime", e.target.value)}
                            className="h-8 w-24 text-xs font-mono text-center p-1"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          لا توجد استشارات
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSaveHours}
                    disabled={isSavingHours}
                    className="w-full bg-navy-900 hover:bg-navy-950 text-white font-semibold h-10 rounded-lg text-sm transition-all"
                  >
                    {isSavingHours ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري حفظ الساعات...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        حفظ ساعات المتابعة — Save Hours
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Clinic Tele-Rehab Guidelines Box */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                معايير الأمان والجودة في الاستشارات عن بُعد
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>يجب التأكد من وضوح إضاءة غرفة المريض لفحص نطاق الحركة (ROM).</li>
                <li>يتم فتح روابط Zoom أو WebRTC عبر اتصال مشفر ومحمي.</li>
                <li>في حالات الألم المفاجئ الحاد (Red Flags)، يُوجَّه المريض للفحص الحضوري.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── 5. Active Consultations Section ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" />
                الاستشارات النشطة والقادمة — Active & Upcoming Consultations
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                قائمة الجلسات المجدولة حالياً مع أزرار الإطلاق المباشر ومتابعة الجلسة
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-white text-emerald-800 border-emerald-300 w-fit">
              {activeConsultations.length} جلسة مجدولة
            </Badge>
          </div>

          {isLoadingConsultations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeConsultations.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 bg-white/50">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">لا توجد استشارات مجدولة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">
                استخدم نموذج الجدولة أعلاه لحجز استشارة أونلاين جديدة لمريض
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeConsultations.map((c) => {
                const dateObj = new Date(c.scheduledAt);
                const isToday =
                  new Date().toDateString() === dateObj.toDateString();

                return (
                  <Card
                    key={c.id}
                    className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Top Bar with Platform Badge */}
                      <div className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {c.meetingType === "zoom" && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Zoom
                            </Badge>
                          )}
                          {c.meetingType === "whatsapp" && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-[#25D366]" />
                              WhatsApp Video
                            </Badge>
                          )}
                          {c.meetingType === "webrtc" && (
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-indigo-600" />
                              WebRTC
                            </Badge>
                          )}
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {c.durationMinutes} دقيقة
                          </span>
                        </div>

                        {isToday ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                            اليوم Today
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            مجدول
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 leading-tight">
                            {c.patient.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.patient.injuryType}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(c.scheduledAt)}
                          </span>
                          <span className="font-bold font-mono text-emerald-800 dir-ltr">
                            {dateObj.toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Notes Preview */}
                        {c.notes && (
                          <div className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2 leading-relaxed">
                            <span className="font-semibold text-slate-700 block mb-0.5">ملاحظات:</span>
                            {c.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {/* 1. Launch Platform Button */}
                        {c.meetingType === "zoom" && (
                          <Button
                            size="sm"
                            onClick={() => triggerZoomLaunch(c.meetingLink)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
                          >
                            <Video className="w-4 h-4" />
                            <span>إطلاق زووم (Launch Zoom)</span>
                            <ExternalLink className="w-3.5 h-3.5 ms-1 opacity-70" />
                          </Button>
                        )}

                        {c.meetingType === "whatsapp" && (
                          <Button
                            size="sm"
                            onClick={() => triggerWhatsAppCall(c.patient.phone, c.patient.name)}
                            className="w-full bg-[#25D366] hover:bg-[#1fa951] text-white font-bold h-9 flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>مكالمة واتساب (WhatsApp Video)</span>
                          </Button>
                        )}

                        {c.meetingType === "webrtc" && (
                          <Button
                            size="sm"
                            onClick={() => triggerWebRtcRoom(c)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
                          >
                            <Monitor className="w-4 h-4" />
                            <span>دخول غرفة WebRTC</span>
                          </Button>
                        )}
                      </div>

                      {/* Status Buttons: Complete & Cancel */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(c.id, "completed")}
                          className="flex-1 h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 me-1" />
                          إكمال الجلسة
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(c.id, "cancelled")}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5 me-1" />
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 7. Consultation History Table ── */}
        <section className="space-y-4">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    سجل الاستشارات والمتابعات — Consultation History
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-500">
                    أرشيف الجلسات المكتملة والملغاة وتوثيق الملاحظات والتوصيات العلاجية
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute start-2.5 top-2.5" />
                    <Input
                      type="text"
                      placeholder="بحث بالمريض أو الإصابة..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="h-9 text-xs ps-8"
                    />
                  </div>

                  <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
                    <button
                      onClick={() => setHistoryFilter("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-colors",
                        historyFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setHistoryFilter("completed")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-colors",
                        historyFilter === "completed" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      المكتملة
                    </button>
                    <button
                      onClick={() => setHistoryFilter("cancelled")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-semibold transition-colors",
                        historyFilter === "cancelled" ? "bg-white text-red-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      الملغاة
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {historyConsultations.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-sm">لا توجد سجلات مطابقة لمعايير البحث</p>
                  <p className="text-xs text-slate-400 mt-1">تظهر هنا جميع الاستشارات بعد إكمالها أو إلغائها</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-bold text-slate-800">المريض والتشخيص</TableHead>
                      <TableHead className="font-bold text-slate-800">موعد الاستشارة</TableHead>
                      <TableHead className="font-bold text-slate-800">المنصة</TableHead>
                      <TableHead className="font-bold text-slate-800">المدة</TableHead>
                      <TableHead className="font-bold text-slate-800">الحالة</TableHead>
                      <TableHead className="font-bold text-slate-800">الملاحظات السريرية</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyConsultations.map((item) => {
                      const itemDate = new Date(item.scheduledAt);
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/60">
                          {/* Patient */}
                          <TableCell className="font-medium">
                            <span className="font-bold text-slate-900 block">
                              {item.patient.name}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              {item.patient.injuryType}
                            </span>
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell>
                            <span className="text-xs text-slate-700 block">
                              {formatDate(item.scheduledAt)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dir-ltr block">
                              {itemDate.toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>

                          {/* Meeting Type */}
                          <TableCell>
                            {item.meetingType === "zoom" && (
                              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                                Zoom
                              </span>
                            )}
                            {item.meetingType === "whatsapp" && (
                              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                                WhatsApp
                              </span>
                            )}
                            {item.meetingType === "webrtc" && (
                              <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                                WebRTC
                              </span>
                            )}
                          </TableCell>

                          {/* Duration */}
                          <TableCell className="text-xs text-slate-600">
                            {item.durationMinutes} دقيقة
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {item.status === "completed" ? (
                              <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                                مكتملة Completed
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 font-bold">
                                ملغاة Cancelled
                              </Badge>
                            )}
                          </TableCell>

                          {/* Notes */}
                          <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={item.notes || ""}>
                            {item.notes || "—"}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center">
                            {item.patient.phone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => triggerWhatsAppCall(item.patient.phone, item.patient.name)}
                                className="h-7 px-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="مراسلة المريض عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* ── Dialog: WebRTC Simulated Virtual Room ── */}
      <Dialog open={webrtcRoomOpen} onOpenChange={setWebrtcRoomOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
          <div className="relative flex flex-col h-[650px] bg-slate-950">
            {/* Header / Room Info */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    غرفة التأهيل الافتراضي المباشر — Revive WebRTC Room
                  </h3>
                  <p className="text-xs text-slate-400">
                    المريض: {activeWebRtcConsultation?.patient.name || "مريض تجريبي"} (
                    {activeWebRtcConsultation?.patient.injuryType || "تقييم سريري عام"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  ⏱ {formatTimer(webrtcElapsedSeconds)}
                </span>
                <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                  E2E Encrypted WebRTC
                </Badge>
              </div>
            </div>

            {/* Video Main Stage Area */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center p-6">
              {/* Simulated Patient Video Stream */}
              <div className="w-full h-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                {/* Background Grid Simulation */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {/* Patient Camera Stream Placeholder */}
                <div className="text-center z-10 space-y-4">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
                      <Users className="w-10 h-10" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-lg text-white">
                      {activeWebRtcConsultation?.patient.name || "أحمد محمود المنصوري"}
                    </p>
                    <p className="text-xs text-emerald-400 font-medium">
                      بث فيديو مباشر للمريض بدقة HD 1080p (Simulated Stream)
                    </p>
                  </div>

                  {/* AI Motion & ROM Tracker Placeholder Simulation */}
                  <div className="inline-flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>تتبع المدى الحركي ROM التلقائي:</span>
                    </div>
                    <span className="font-mono text-white font-bold bg-slate-800 px-2 py-0.5 rounded">
                      ثني الركبة: 115°
                    </span>
                    <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                      تمديد: 0°
                    </span>
                  </div>

                  {/* Coming Soon Notice as specified in prompt */}
                  <div className="mt-2 text-[11px] text-slate-400 max-w-md mx-auto">
                    *(ميزة الربط المباشر WebRTC P2P قيد التفعيل التجريبي — WebRTC Room Simulation & Tele-Rehab Engine)*
                  </div>
                </div>

                {/* Clinician PiP (Picture-in-Picture) Preview */}
                <div className="absolute bottom-4 end-4 w-40 h-28 bg-slate-800 border-2 border-emerald-500/60 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between p-2 z-20">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span>كاميرا المعالج</span>
                    {webrtcVideoOff && <VideoOff className="w-3 h-3 text-red-400" />}
                  </div>
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                    {webrtcVideoOff ? "الكاميرا مغلقة" : "كادر المعالج الطبيعي"}
                  </div>
                  <div className="text-[9px] text-emerald-400 text-end">Revive Pro</div>
                </div>
              </div>
            </div>

            {/* In-Call Controls Toolbar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWebrtcMicMuted(!webrtcMicMuted)}
                  className={cn(
                    "border-slate-700 text-white hover:bg-slate-800",
                    webrtcMicMuted && "bg-red-950/80 border-red-700 text-red-300"
                  )}
                >
                  {webrtcMicMuted ? <MicOff className="w-4 h-4 me-1.5" /> : <Mic className="w-4 h-4 me-1.5" />}
                  {webrtcMicMuted ? "كتم الصوت (Muted)" : "الميكروفون (Mic On)"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWebrtcVideoOff(!webrtcVideoOff)}
                  className={cn(
                    "border-slate-700 text-white hover:bg-slate-800",
                    webrtcVideoOff && "bg-red-950/80 border-red-700 text-red-300"
                  )}
                >
                  {webrtcVideoOff ? <VideoOff className="w-4 h-4 me-1.5" /> : <Video className="w-4 h-4 me-1.5" />}
                  {webrtcVideoOff ? "الكاميرا معطلة" : "الكاميرا (Cam On)"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWebrtcScreenSharing(!webrtcScreenSharing)}
                  className={cn(
                    "border-slate-700 text-white hover:bg-slate-800 hidden sm:inline-flex",
                    webrtcScreenSharing && "bg-blue-950/80 border-blue-700 text-blue-300"
                  )}
                >
                  <Share2 className="w-4 h-4 me-1.5" />
                  مشاركة الشاشة
                </Button>
              </div>

              <Button
                variant="destructive"
                onClick={() => setWebrtcRoomOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-xl"
              >
                إنهاء المكالمة — End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Quick WhatsApp Launch ── */}
      <Dialog open={quickWhatsAppOpen} onOpenChange={setQuickWhatsAppOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              بدء مكالمة فيديو واتساب سريعة
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              إرسال رابط البدء المباشر لمكالمة الفيديو عبر تطبيق WhatsApp للمريض.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">اسم المريض:</label>
              <Input
                placeholder="اسم المريض..."
                value={quickPatientName}
                onChange={(e) => setQuickPatientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">رقم الهاتف الدولي (مع كود الدولة):</label>
              <Input
                type="tel"
                placeholder="+201012345678"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                className="font-mono dir-ltr"
              />
              <span className="text-[11px] text-slate-400">
                مثال: +201012345678 أو 201012345678
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold block mb-1">نص الرسالة التي ستُرسل للمريض:</span>
              &ldquo;مرحباً {quickPatientName || "عزيزي المريض"}، تحياتنا من عيادة Revive للعلاج الطبيعي. يرجى الاستعداد لبدء جلسة المتابعة التأهيلية أونلاين عبر مكالمة الفيديو.&rdquo;
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                إلغاء
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                triggerWhatsAppCall(quickPhone, quickPatientName);
                setQuickWhatsAppOpen(false);
              }}
              disabled={!quickPhone.trim()}
              className="bg-[#25D366] hover:bg-[#1fa951] text-white font-bold w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 me-1.5" />
              فتح واتساب الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Quick Zoom Launch ── */}
      <Dialog open={quickZoomOpen} onOpenChange={setQuickZoomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Video className="w-5 h-5 text-blue-600" />
              فتح رابط Zoom السريع
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              قم بلصق أو تأكيد رابط غرفة Zoom للانضمام الفوري لجلسة المتابعة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">رابط اجتماع Zoom:</label>
              <Input
                type="url"
                value={quickZoomUrl}
                onChange={(e) => setQuickZoomUrl(e.target.value)}
                placeholder="https://zoom.us/j/1234567890"
                className="font-mono text-xs dir-ltr"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
              سيتم فتح الاجتماع في نافذة جديدة مباشرة عبر تطبيق Zoom أو متصفح الويب.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                إلغاء
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                triggerZoomLaunch(quickZoomUrl);
                setQuickZoomOpen(false);
              }}
              disabled={!quickZoomUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4 me-1.5" />
              فتح الاجتماع الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
