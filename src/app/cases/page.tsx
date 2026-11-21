"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Trash2,
  MessageCircle,
  Eye,
  Plus,
  Clock,
  User,
  Activity,
  AlertCircle,
  Filter,
  CheckCircle2,
  RefreshCw,
  Video,
  Building,
  UserPlus,
  ChevronRight,
  ShieldAlert,
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
} from "@/lib/utils";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { useAuth } from "@/lib/auth-context";

// TypeScript interfaces for Cases and Appointments
interface PatientItem {
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
  romMeasurements?: {
    id: string;
    joint: string;
    movement: string;
    injuredAngle: number;
    healthyAngle?: number | null;
    date: string;
  }[];
  rehabPrograms?: {
    id: string;
    phase: string;
    startDate: string;
    isActive: boolean;
  }[];
  appointments?: {
    id: string;
    type: "IN_CLINIC" | "ONLINE";
    date: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
  }[];
}

interface AppointmentItem {
  id: string;
  patientId: string;
  patient?: {
    name: string;
    injuryType: string;
  };
  type: "IN_CLINIC" | "ONLINE";
  date: string;
  startTime: string;
  endTime: string;
  recurringDays?: string | null;
  notes?: string | null;
  status: string;
}

const RECURRING_DAYS = [
  { key: "SUN", label: "أحد", en: "Sun" },
  { key: "MON", label: "اثنين", en: "Mon" },
  { key: "TUE", label: "ثلاثاء", en: "Tue" },
  { key: "WED", label: "أربعاء", en: "Wed" },
  { key: "THU", label: "خميس", en: "Thu" },
  { key: "FRI", label: "جمعة", en: "Fri" },
  { key: "SAT", label: "سبت", en: "Sat" },
];

export default function CasesPage() {
  return (
    <AdminGuard>
      <CasesContent />
    </AdminGuard>
  );
}

function CasesContent() {
  const { isAdmin } = useAuth();

  // State
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Today's appointments
  const [todayAppointments, setTodayAppointments] = useState<AppointmentItem[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Quick Appointment Scheduler Dialog State
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
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
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // Delete Confirmation Dialog State
  const [patientToDelete, setPatientToDelete] = useState<PatientItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Cases
  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cases");
      let serverData: PatientItem[] = [];
      if (res.ok) {
        const data = await res.json();
        serverData = Array.isArray(data) ? data : [];
      }

      // Merge with localStorage
      let localData: PatientItem[] = [];
      if (typeof window !== "undefined") {
        try {
          localData = JSON.parse(localStorage.getItem("revive_cases") || "[]");
        } catch {}
      }

      const map = new Map<string, PatientItem>();
      [...localData, ...serverData].forEach((item) => {
        if (item && item.id) {
          map.set(item.id, item);
        }
      });

      setPatients(Array.from(map.values()));
    } catch (err: any) {
      console.error("Error fetching cases:", err);
      // Fallback to local storage if API fails completely
      if (typeof window !== "undefined") {
        try {
          const localData = JSON.parse(localStorage.getItem("revive_cases") || "[]");
          if (localData.length > 0) {
            setPatients(localData);
            return;
          }
        } catch {}
      }
      setError(err.message || "حدث خطأ أثناء تحميل الحالات");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Today's Appointments
  const fetchTodayAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/appointments?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setTodayAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching today appointments:", err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchTodayAppointments();
  }, []);

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.injuryType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.phone && patient.phone.includes(searchQuery));

      const matchesStatus =
        statusFilter === "ALL" ||
        patient.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === "active").length;
    const completed = patients.filter((p) => p.status === "completed").length;
    return { total, active, completed };
  }, [patients]);

  // Handle WhatsApp Share
  const handleSendWhatsApp = (patient: PatientItem) => {
    const currentPhase = patient.rehabPrograms?.[0]?.phase;
    const phaseInfo = currentPhase ? getPhaseLabel(currentPhase) : null;
    const sideText =
      patient.injuredSide === "RIGHT"
        ? "الجانب الأيمن (Right Side)"
        : patient.injuredSide === "LEFT"
        ? "الجانب الأيسر (Left Side)"
        : "كلا الجانبين (Bilateral)";

    const statusText =
      patient.status === "active"
        ? "نشط — قيد التأهيل"
        : patient.status === "completed"
        ? "مكتمل — انتهى البرنامج"
        : patient.status;

    const messageLines = [
      `*ملخص حالة المريض — Peak Motion* 🩺`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *المريض:* ${patient.name}`,
      `🏥 *نوع الإصابة:* ${patient.injuryType}`,
      `📍 *الجانب المصاب:* ${sideText}`,
      phaseInfo ? `⚡ *المرحلة التأهيلية:* ${phaseInfo.ar} (${phaseInfo.en})` : null,
      `📅 *تاريخ الإصابة:* ${formatDate(patient.injuryDate)}`,
      `🏁 *بدء التأهيل:* ${formatDate(patient.rehabStartDate)}`,
      patient.surgeryDate ? `🔪 *تاريخ العملية:* ${formatDate(patient.surgeryDate)}` : null,
      `📊 *الحالة:* ${statusText}`,
      patient.notes ? `📝 *ملاحظات إكلينيكية:* ${patient.notes}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `عيادة Peak Motion للعلاج الطبيعي والتأهيل الحركي`,
    ].filter(Boolean);

    const message = messageLines.join("\n");
    const link = generateWhatsAppShareLink(message);
    window.open(link, "_blank");
  };

  // Open Quick Appointment with Patient Preselected
  const handleOpenSchedulerWithPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setScheduleError(null);
    setScheduleSuccess(false);
    setIsSchedulerOpen(true);
  };

  // Submit Quick Appointment
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setScheduleError("يرجى اختيار المريض أولاً");
      return;
    }

    setIsScheduling(true);
    setScheduleError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
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

      setScheduleSuccess(true);
      setTimeout(() => {
        setIsSchedulerOpen(false);
        setScheduleSuccess(false);
        setAppointmentNotes("");
        setRecurringDays([]);
      }, 1000);

      // Refresh appointments and cases list
      fetchTodayAppointments();
      fetchCases();
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      setScheduleError(err.message || "حدث خطأ أثناء حجز الموعد");
    } finally {
      setIsScheduling(false);
    }
  };

  // Delete Patient Confirmation
  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cases/${patientToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("فشل حذف ملف المريض");
      }

      // Remove from state & localStorage
      if (typeof window !== "undefined") {
        try {
          const localData = JSON.parse(localStorage.getItem("revive_cases") || "[]");
          const filtered = localData.filter((c: any) => c.id !== patientToDelete.id);
          localStorage.setItem("revive_cases", JSON.stringify(filtered));
        } catch {}
      }
      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id));
      setPatientToDelete(null);
      fetchTodayAppointments();
    } catch (err: any) {
      console.error("Error deleting patient:", err);
      alert(err.message || "حدث خطأ أثناء حذف الحالة");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Page Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                    حالات المرضى والبرامج التأهيلية
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Patient Cases & Rehabilitation Management System
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Quick Scheduler Button */}
              <Button
                onClick={() => {
                  setSelectedPatientId(patients[0]?.id || "");
                  setScheduleError(null);
                  setScheduleSuccess(false);
                  setIsSchedulerOpen(true);
                }}
                variant="outline"
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>حجز موعد سريع</span>
              </Button>

              {/* Add New Case Link (Admin Only) */}
              {isAdmin && (
                <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Link href="/add-case">
                    <UserPlus className="w-4 h-4" />
                    <span>إضافة حالة جديدة</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">إجمالي الحالات (Total Cases)</span>
              <span className="text-2xl font-bold text-navy-950 mt-1 block">{stats.total}</span>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
              <span className="text-xs font-medium text-emerald-700 block">حالات نشطة (Active)</span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">{stats.active}</span>
            </div>
            <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
              <span className="text-xs font-medium text-blue-700 block">حالات مكتملة (Completed)</span>
              <span className="text-2xl font-bold text-blue-800 mt-1 block">{stats.completed}</span>
            </div>
            <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100">
              <span className="text-xs font-medium text-amber-700 block">مواعيد اليوم (Today's Appts)</span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">
                {isLoadingAppointments ? "..." : todayAppointments.length}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Cases Grid (Left 8-9 cols) & Sidebar (Right 3-4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Area: Search, Filters & Patient Cards Grid */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            {/* Search & Status Filter Bar */}
            <Card className="border-slate-200/80 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="بحث بالاسم، نوع الإصابة، أو رقم الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-10 bg-slate-50 border-slate-200 focus-visible:bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        مسح
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 self-center sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setStatusFilter("ALL")}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                        statusFilter === "ALL"
                          ? "bg-navy-950 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      الكل ({patients.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("active")}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                        statusFilter === "active"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      نشط ({stats.active})
                    </button>
                    <button
                      onClick={() => setStatusFilter("completed")}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                        statusFilter === "completed"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      مكتمل ({stats.completed})
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <Card key={n} className="border-slate-200/80 animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-5 w-36 bg-slate-200 rounded-md" />
                          <div className="h-4 w-48 bg-slate-100 rounded-md" />
                        </div>
                        <div className="h-6 w-16 bg-slate-200 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                        <div className="h-6 w-24 bg-slate-200 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex gap-2">
                      <div className="h-9 flex-1 bg-slate-200 rounded-lg" />
                      <div className="h-9 w-20 bg-slate-200 rounded-lg" />
                      <div className="h-9 w-9 bg-slate-200 rounded-lg" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Error Message */}
            {!isLoading && error && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-8 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="text-base font-bold text-red-800">{error}</p>
                  <Button
                    onClick={fetchCases}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 ml-1.5" /> إعادة المحاولة
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredPatients.length === 0 && (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-navy-950">
                      لم يتم العثور على أي حالات
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== "ALL"
                        ? "لا توجد نتائج تطابق معايير البحث أو التصفية المحددة."
                        : "لم يتم تسجيل أي حالات مرضية حتى الآن. ابدأ بإضافة أول ملف مريض."}
                    </p>
                  </div>
                  {searchQuery || statusFilter !== "ALL" ? (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("ALL");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      إعادة ضبط الفلاتر
                    </Button>
                  ) : (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Link href="/add-case">
                        <Plus className="w-4 h-4 ml-1.5" /> إضافة مريض جديد
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Patient Cards Grid */}
            {!isLoading && !error && filteredPatients.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPatients.map((patient) => {
                  const currentProgram = patient.rehabPrograms?.[0];
                  const phaseObj = currentProgram ? getPhaseLabel(currentProgram.phase) : null;

                  return (
                    <Card
                      key={patient.id}
                      className="border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        {/* Card Header: Name & Status */}
                        <CardHeader className="pb-3 border-b border-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-navy-950 font-bold flex items-center justify-center text-sm group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                                {patient.name.charAt(0)}
                              </div>
                              <div>
                                <Link
                                  href={`/cases/${patient.id}`}
                                  className="text-base font-bold text-navy-950 hover:text-emerald-700 transition-colors block line-clamp-1"
                                >
                                  {patient.name}
                                </Link>
                                <span className="text-xs text-slate-500 block">
                                  {patient.phone || "بدون رقم هاتف"}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            {patient.status === "active" ? (
                              <Badge variant="success" className="text-[11px]">
                                نشط
                              </Badge>
                            ) : patient.status === "completed" ? (
                              <Badge variant="secondary" className="text-[11px] bg-blue-50 text-blue-700 border-blue-200">
                                مكتمل
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[11px]">
                                {patient.status}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        {/* Card Content: Injury, Badges, Dates */}
                        <CardContent className="pt-4 pb-3 space-y-4">
                          {/* Injury Type */}
                          <div>
                            <span className="text-xs text-slate-400 block font-medium">نوع الإصابة / التشخيص:</span>
                            <span className="text-sm font-semibold text-slate-800 block mt-0.5 line-clamp-1">
                              {patient.injuryType}
                            </span>
                          </div>

                          {/* Badges Row: Side & Phase */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Injured Side Badge */}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium border",
                                patient.injuredSide === "RIGHT"
                                  ? "bg-slate-50 text-slate-700 border-slate-200"
                                  : patient.injuredSide === "LEFT"
                                  ? "bg-slate-50 text-slate-700 border-slate-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              )}
                            >
                              الجانب:{" "}
                              {patient.injuredSide === "RIGHT"
                                ? "الأيمن (Right)"
                                : patient.injuredSide === "LEFT"
                                ? "الأيسر (Left)"
                                : "الطرفين (Bilateral)"}
                            </Badge>

                            {/* Rehab Phase Badge */}
                            {phaseObj ? (
                              <Badge
                                variant="default"
                                className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                              >
                                {phaseObj.ar}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs text-slate-500">
                                مرحلة غير محددة
                              </Badge>
                            )}
                          </div>

                          {/* Dates Section */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-400 block">تاريخ الإصابة:</span>
                              <span className="font-medium text-slate-700 block mt-0.5">
                                {formatDateShort(patient.injuryDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">بدء التأهيل:</span>
                              <span className="font-medium text-slate-700 block mt-0.5">
                                {formatDateShort(patient.rehabStartDate)}
                              </span>
                            </div>
                            {patient.surgeryDate && (
                              <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1">
                                <span className="text-slate-400 block">تاريخ العملية:</span>
                                <span className="font-medium text-slate-700 block mt-0.5">
                                  {formatDateShort(patient.surgeryDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>

                      {/* Card Footer: Action Buttons */}
                      <CardFooter className="pt-3 pb-4 border-t border-slate-100 flex items-center gap-2">
                        {/* View Details Button */}
                        <Button
                          asChild
                          size="sm"
                          variant="default"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                        >
                          <Link href={`/cases/${patient.id}`}>
                            <Eye className="w-4 h-4" />
                            <span>عرض التفاصيل</span>
                          </Link>
                        </Button>

                        {/* Send WhatsApp Summary Button */}
                        <Button
                          size="sm"
                          variant="whatsapp"
                          onClick={() => handleSendWhatsApp(patient)}
                          className="gap-1.5 px-3 font-medium"
                          title="إرسال تقرير الحالة عبر واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">واتساب</span>
                        </Button>

                        {/* Delete Button (Admin Only) */}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPatientToDelete(patient)}
                            className="p-2 h-9 w-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            title="حذف ملف المريض (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Today's Appointments Section */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6">
            <Card className="border-slate-200/90 shadow-sm sticky top-20">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <div>
                      <CardTitle className="text-base font-bold text-navy-950">
                        مواعيد اليوم
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date().toLocaleDateString("ar-EG", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {todayAppointments.length} موعد
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 max-h-[580px] overflow-y-auto">
                {isLoadingAppointments ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="p-3 bg-slate-50 rounded-xl animate-pulse space-y-2">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="h-3 w-40 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لا توجد مواعيد مجدولة لليوم
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPatientId(patients[0]?.id || "");
                        setIsSchedulerOpen(true);
                      }}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="w-3.5 h-3.5 ml-1" /> إضافة موعد جديد
                    </Button>
                  </div>
                ) : (
                  todayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-colors space-y-2.5 shadow-sm"
                    >
                      {/* Top line: Time & Type Badge */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 direction-ltr">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{appt.startTime} — {appt.endTime}</span>
                        </span>

                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            appt.type === "ONLINE"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {appt.type === "ONLINE" ? (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3" /> أونلاين
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" /> في العيادة
                            </span>
                          )}
                        </Badge>
                      </div>

                      {/* Patient Name & Injury */}
                      <div>
                        <Link
                          href={`/cases/${appt.patientId}`}
                          className="font-bold text-sm text-navy-950 hover:text-emerald-700 transition-colors block"
                        >
                          {appt.patient?.name || "مريض غير محدد"}
                        </Link>
                        {appt.patient?.injuryType && (
                          <span className="text-xs text-slate-500 block mt-0.5 line-clamp-1">
                            {appt.patient.injuryType}
                          </span>
                        )}
                      </div>

                      {/* Notes / Recurring days */}
                      {appt.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>

              <CardFooter className="pt-3 border-t border-slate-100">
                <Button
                  onClick={() => {
                    setSelectedPatientId(patients[0]?.id || "");
                    setIsSchedulerOpen(true);
                  }}
                  className="w-full bg-navy-950 hover:bg-navy-900 text-white gap-2 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>حجز موعد لمريض</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* QUICK APPOINTMENT SCHEDULER DIALOG */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>حجز موعد تأهيلي سريع</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              حدد المريض والنوع والتوقيت لإضافة جلسة علاج طبيعي جديدة
            </DialogDescription>
          </DialogHeader>

          {scheduleSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-800">
                تم حجز الموعد بنجاح!
              </h4>
              <p className="text-xs text-slate-500">
                تمت إضافة الجلسة إلى جدول مواعيد المركز
              </p>
            </div>
          ) : (
            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
              {scheduleError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {/* Patient Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  اختر المريض (Patient) <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedPatientId}
                  onValueChange={(val) => setSelectedPatientId(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر مريضاً من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ({p.injuryType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment Type */}
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
                  تاريخ الجلسة (Date) <span className="text-red-500">*</span>
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
                    وقت البدء (Start Time)
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
                    وقت الانتهاء (End Time)
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Recurring Days Checkboxes (أحد - سبت) */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  تكرار أسبوعي (Weekly Recurring Days - اختياري)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {RECURRING_DAYS.map((day) => {
                    const isChecked = recurringDays.includes(day.key);
                    return (
                      <label
                        key={day.key}
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
                              setRecurringDays([...recurringDays, day.key]);
                            } else {
                              setRecurringDays(recurringDays.filter((d) => d !== day.key));
                            }
                          }}
                          className="sr-only"
                        />
                        <span>{day.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{day.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  ملاحظات أو أهداف الجلسة (Notes)
                </label>
                <Textarea
                  placeholder="مثال: قياس المدى الحركي بعد التمارين، التركيز على تقوية عضلات الكواد..."
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer Buttons */}
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
                  disabled={isScheduling || !selectedPatientId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isScheduling ? "جارٍ الحفظ..." : "تأكيد حجز الموعد"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(patientToDelete)}
        onOpenChange={(open) => {
          if (!open) setPatientToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>تأكيد حذف ملف المريض</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              هل أنت متأكد من رغبتك في حذف ملف المريض{" "}
              <strong className="text-navy-950 font-bold">
                "{patientToDelete?.name}"
              </strong>
              ؟
              <span className="block text-xs text-red-500 mt-2 font-medium">
                تنبيه: سيتم حذف كافة القياسات الحركية (ROM)، محيط الأطراف، الجداول التمرينية، والمواعيد المسجلة لهذا المريض نهائياً دون إمكانية الاسترجاع.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPatientToDelete(null)}
              disabled={isDeleting}
            >
              إلغاء الإجراء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePatient}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف النهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
