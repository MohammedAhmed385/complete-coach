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
  Pencil,
  Target,
  ClipboardList,
  Layers,
  ArrowUpDown,
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
import { AdminGuard } from "@/components/auth/AdminGuard";
import {
  fetchMergedCaseById,
  patchCaseWithSync,
  removeLocalCase,
  upsertLocalCase,
  getDeletedExerciseIds,
} from "@/lib/client-sync";
import {
  REHAB_PHASES,
  detectInjuryCategory,
  getDynamicPhaseCriteria,
} from "@/lib/rehab-criteria";
import { normalizeJointAngles, computeSessionComparison } from "@/lib/biomechanics";

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
  completionPercentage: number;
  holdSeconds?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  orderIndex: number;
}

interface SessionExerciseFormItem {
  id: string;
  exerciseId?: string;
  nameAr: string;
  nameEn?: string;
  category?: string;
  sets: number;
  reps: number;
  completionPercentage: number;
  notes?: string | null;
}

interface PatientSessionItem {
  id: string;
  sessionNumber: number;
  date: string;
  title: string;
  phase?: string;
  durationMinutes?: number | null;
  painLevel?: number | null;
  overallCompletion?: number;
  exercises: SessionExerciseFormItem[];
  notes?: string | null;
  extraDetails?: string | null;
  createdAt: string;
  updatedAt?: string;
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
  isRestDay?: boolean;
  phaseCriteriaStatus?: Record<string, Record<string, boolean>>;
  romMeasurements: ROMMeasurementItem[];
  girthMeasurements: GirthEvaluationItem[];
  girthEvaluations?: GirthEvaluationItem[];
  rehabPrograms: RehabProgramItem[];
  assignedExercises?: ScheduleExerciseItem[];
  sessions?: PatientSessionItem[];
  appointments: AppointmentDetailItem[];
  rtpEvaluations: RTPEvaluationItem[];
  exerciseSchedules: ExerciseScheduleItem[];
  videoAnalyses?: any[];
}

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
  return (
    <AdminGuard>
      <PatientDetailPageContent />
    </AdminGuard>
  );
}

function PatientDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Main state
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab state & toast banner
  const [activeTab, setActiveTab] = useState("overview");
  const [toastBanner, setToastBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastBanner({ type, text });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Exercise Schedule Interactive State
  const [isRestDay, setIsRestDay] = useState(false);
  const [dailyExercises, setDailyExercises] = useState<ScheduleExerciseItem[]>([]);
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // Add Multi-Exercise Picker Modal State
  const [isAddExercisesModalOpen, setIsAddExercisesModalOpen] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<ExerciseItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryRegion, setLibraryRegion] = useState("ALL");
  const [selectedLibraryMap, setSelectedLibraryMap] = useState<
    Record<string, { selected: boolean; sets: number; reps: number; completionPercentage: number; notes: string; exercise: ExerciseItem }>
  >({});
  const [customExNameAr, setCustomExNameAr] = useState("");
  const [customExNameEn, setCustomExNameEn] = useState("");
  const [customExCategory, setCustomExCategory] = useState("تأهيل مخصص");
  const [isSavingExercises, setIsSavingExercises] = useState(false);

  // Full Cumulative Sessions Log State
  const [sessionSortOrder, setSessionSortOrder] = useState<"asc" | "desc">("asc");
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionPhase, setSessionPhase] = useState("ACUTE");
  const [sessionDuration, setSessionDuration] = useState("45");
  const [sessionPainLevel, setSessionPainLevel] = useState("2");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionExtraDetails, setSessionExtraDetails] = useState("");
  const [sessionExercisesForm, setSessionExercisesForm] = useState<SessionExerciseFormItem[]>([]);
  const [sessionExPickerId, setSessionExPickerId] = useState("");
  const [sessionCustomExName, setSessionCustomExName] = useState("");
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Add New Girth Measurement Modal State
  const [isAddGirthOpen, setIsAddGirthOpen] = useState(false);
  const [girthLandmark, setGirthLandmark] = useState("أعلى الرضفة — عضلة الفخذ (Above Patella / Thigh)");
  const [girthDateInput, setGirthDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [girthRowsInput, setGirthRowsInput] = useState<
    Array<{ distanceCm: number; injuredCm: string; healthyCm: string }>
  >([
    { distanceCm: 0, injuredCm: "", healthyCm: "" },
    { distanceCm: 15, injuredCm: "", healthyCm: "" },
    { distanceCm: 30, injuredCm: "", healthyCm: "" },
  ]);
  const [isSavingGirth, setIsSavingGirth] = useState(false);

  // Phase Transition State
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

  // Full Rehab Phase Selection Modal State
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [selectedNewPhase, setSelectedNewPhase] = useState<string>("ACUTE");
  const [phaseTransitionNotes, setPhaseTransitionNotes] = useState<string>("");
  const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);

  // Full Patient Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "male",
    status: "active",
    injuryType: "",
    injuredSide: "RIGHT",
    injuryDate: "",
    surgeryDate: "",
    rehabStartDate: "",
    mechanismOfInjury: "",
    notes: "",
  });

  // Sync edit form data when patient loads
  useEffect(() => {
    if (patient) {
      setEditFormData({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
        gender: patient.gender || "male",
        status: patient.status || "active",
        injuryType: patient.injuryType || "",
        injuredSide: patient.injuredSide || "RIGHT",
        injuryDate: patient.injuryDate ? patient.injuryDate.split("T")[0] : "",
        surgeryDate: patient.surgeryDate ? patient.surgeryDate.split("T")[0] : "",
        rehabStartDate: patient.rehabStartDate ? patient.rehabStartDate.split("T")[0] : "",
        mechanismOfInjury: patient.mechanismOfInjury || "",
        notes: patient.notes || "",
      });
      const activePhaseKey = patient.rehabPrograms?.[0]?.phase || "ACUTE";
      setSelectedNewPhase(activePhaseKey);
    }
  }, [patient]);

  // Helper: Resolve exercises ONLY from patient record (starts completely empty until doctor adds)
  const initExercisesFromProgram = (data: PatientDetail) => {
    if (Array.isArray(data.assignedExercises)) {
      setDailyExercises(
        data.assignedExercises.map((ex, idx) => ({
          ...ex,
          targetSets: Number(ex.targetSets) || 3,
          targetReps: Number(ex.targetReps) || 10,
          completedSets: Number(ex.completedSets) || 0,
          completedReps: Number(ex.completedReps) || 0,
          completionPercentage:
            ex.completionPercentage !== undefined
              ? Number(ex.completionPercentage)
              : Number(ex.targetSets) > 0 && Number(ex.completedSets) > 0
              ? Math.min(100, Math.round((Number(ex.completedSets) / Number(ex.targetSets)) * 100))
              : 0,
          orderIndex: ex.orderIndex ?? idx,
        }))
      );
      return;
    }

    const activeProgram = data.rehabPrograms?.[0];
    if (activeProgram?.programExercises && activeProgram.programExercises.length > 0) {
      const mapped: ScheduleExerciseItem[] = activeProgram.programExercises.map((pe) => ({
        id: pe.id,
        exerciseId: pe.exerciseId,
        exercise: pe.exercise,
        targetSets: pe.sets || 3,
        targetReps: pe.reps || 10,
        completedSets: 0,
        completedReps: 0,
        completionPercentage: 0,
        holdSeconds: pe.holdSeconds ?? null,
        restSeconds: pe.restSeconds ?? null,
        notes: pe.notes ?? null,
        orderIndex: pe.orderIndex,
      }));
      setDailyExercises(mapped);
      return;
    }

    if (data.exerciseSchedules && data.exerciseSchedules[0]?.exercises?.length > 0) {
      setDailyExercises(
        data.exerciseSchedules[0].exercises.map((item, idx) => ({
          ...item,
          completionPercentage:
            item.completionPercentage ??
            (item.targetSets > 0 ? Math.min(100, Math.round((item.completedSets / item.targetSets) * 100)) : 0),
          orderIndex: item.orderIndex ?? idx,
        }))
      );
      return;
    }

    setDailyExercises([]);
  };

  // Fetch Patient Details (Unified Server + Local Sync)
  const fetchPatientDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const mergedPatient = await fetchMergedCaseById(id);
      if (!mergedPatient) {
        throw new Error("لم يتم العثور على سجل المريض المطلوب");
      }
      setPatient(mergedPatient);
      setIsRestDay(
        mergedPatient.isRestDay !== undefined
          ? Boolean(mergedPatient.isRestDay)
          : Boolean(mergedPatient.exerciseSchedules?.[0]?.isRestDay)
      );
      initExercisesFromProgram(mergedPatient);
    } catch (err: any) {
      console.error("Error fetching patient details:", err);
      setError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Exercise Library for Picker Modals
  const loadExerciseLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const res = await fetch("/api/exercises").catch(() => null);
      const data = res && res.ok ? await res.json().catch(() => []) : [];
      const serverList: ExerciseItem[] = Array.isArray(data) ? data : data.exercises || [];
      let localCustom: ExerciseItem[] = [];
      if (typeof window !== "undefined") {
        try {
          localCustom = JSON.parse(localStorage.getItem("revive_custom_exercises") || "[]");
        } catch {}
      }
      const deletedSet = new Set(getDeletedExerciseIds());
      const map = new Map<string, ExerciseItem>();
      [...localCustom, ...serverList].forEach((ex) => {
        if (ex && ex.id && !deletedSet.has(ex.id)) {
          map.set(ex.id, ex);
        }
      });
      setLibraryExercises(Array.from(map.values()));
    } catch (err) {
      console.warn("Library load skipped:", err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  // Dynamic Criteria Calculation (adapts to Active Phase & Injury Type)
  const currentPhaseKey = patient?.rehabPrograms?.[0]?.phase || "ACUTE";
  const injuryCategoryMeta = useMemo(
    () => detectInjuryCategory(patient?.injuryType),
    [patient?.injuryType]
  );

  const dynamicCriteria = useMemo(() => {
    const raw = getDynamicPhaseCriteria(currentPhaseKey, patient?.injuryType);
    const savedMap = patient?.phaseCriteriaStatus?.[currentPhaseKey] || {};
    return raw.map((c) => ({
      ...c,
      met: Boolean(savedMap[c.id]),
    }));
  }, [currentPhaseKey, patient?.injuryType, patient?.phaseCriteriaStatus]);

  const previewModalCriteria = useMemo(() => {
    return getDynamicPhaseCriteria(selectedNewPhase, patient?.injuryType);
  }, [selectedNewPhase, patient?.injuryType]);

  const criteriaMetCount = dynamicCriteria.filter((c) => c.met).length;
  const criteriaProgressPct =
    dynamicCriteria.length > 0 ? Math.round((criteriaMetCount / dynamicCriteria.length) * 100) : 0;

  const handleToggleCriterion = async (criterionId: string) => {
    if (!patient) return;
    const prevPhaseMap = patient.phaseCriteriaStatus?.[currentPhaseKey] || {};
    const nextPhaseCriteriaStatus = {
      ...(patient.phaseCriteriaStatus || {}),
      [currentPhaseKey]: {
        ...prevPhaseMap,
        [criterionId]: !prevPhaseMap[criterionId],
      },
    };
    const updated = await patchCaseWithSync(patient, { phaseCriteriaStatus: nextPhaseCriteriaStatus });
    setPatient(updated);
  };

  // WhatsApp Summary Message (عيادة Revive)
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
      `*تقرير حالة مريض — عيادة Revive* 🩺`,
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
      `عيادة Revive للعلاج الطبيعي والتأهيل الحركي`,
    ].filter(Boolean);

    const message = messageLines.join("\n");
    const link = generateWhatsAppShareLink(message);
    window.open(link, "_blank");
  };

  // WhatsApp Exercises Share (عيادة Revive)
  const handleShareExercisesWhatsApp = () => {
    if (!patient) return;
    let message = "";
    if (isRestDay) {
      message = `*جدول التأهيل الحركي — عيادة Revive*\n👤 المريض: ${patient.name}\n📅 التاريخ: ${new Date().toLocaleDateString("ar-EG")}\n\n🧘‍♂️ اليوم مخصص للراحة النشطة والاستشفاء العضلي.\n━━━━━━━━━━━━━━━━━━━━\nعيادة Revive للعلاج الطبيعي والتأهيل الحركي`;
    } else if (dailyExercises.length === 0) {
      showToast("error", "لا توجد تمارين مضافة لمشاركتها بعد.");
      return;
    } else {
      const itemsText = dailyExercises
        .map((ex, i) => {
          const pct = ex.completionPercentage ?? 0;
          return `${i + 1}. *${ex.exercise?.nameAr || "تمرين"}*${ex.exercise?.nameEn ? ` (${ex.exercise.nameEn})` : ""}\n   🎯 الجرعة: ${ex.targetSets} مجموعات × ${ex.targetReps} تكرار\n   📊 نسبة الإنجاز: ${pct}% (${ex.completedSets}/${ex.targetSets} مجموعات)${ex.notes ? `\n   📝 ملاحظة: ${ex.notes}` : ""}`;
        })
        .join("\n\n");
      message = `*برنامج التمارين التأهيلية — عيادة Revive* 🏋️‍♂️\n👤 *المريض:* ${patient.name}\n🏥 *التشخيص:* ${patient.injuryType}\n━━━━━━━━━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━━━━━━━━━\nعيادة Revive للعلاج الطبيعي والتأهيل الحركي`;
    }
    window.open(generateWhatsAppShareLink(message), "_blank");
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
      showToast("success", "تم حجز الموعد وإضافته لملف المريض بنجاح.");
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
      await fetch(`/api/cases/${patient.id}`, { method: "DELETE" }).catch(() => null);
      removeLocalCase(patient.id);
      router.push("/cases");
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast("error", err.message || "حدث خطأ أثناء الحذف");
      setIsDeleting(false);
    }
  };

  // Rest Day Switch Handler
  const handleToggleRestDay = async (checked: boolean) => {
    setIsRestDay(checked);
    if (!patient) return;
    const updated = await patchCaseWithSync(patient, { isRestDay: checked });
    setPatient(updated);
  };

  // Persist Single Exercise Update
  const syncExerciseItemUpdate = async (
    nextList: ScheduleExerciseItem[],
    itemId: string,
    updates: Partial<ScheduleExerciseItem>
  ) => {
    setDailyExercises(nextList);
    if (!patient) return;
    const nextPatient = { ...patient, assignedExercises: nextList, updatedAt: new Date().toISOString() };
    setPatient(nextPatient);
    upsertLocalCase(nextPatient);
    try {
      await fetch(`/api/cases/${patient.id}/exercises`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseItemId: itemId,
          updates,
          assignedExercises: nextList,
          _baseSnapshot: nextPatient,
        }),
      });
    } catch (err) {
      console.warn("Exercise update sync skipped:", err);
    }
  };

  // Exercise Counters (+1 / -1) & Completion %
  const handleUpdateSets = (index: number, delta: number) => {
    const targetItem = dailyExercises[index];
    if (!targetItem) return;
    const newSets = Math.max(0, targetItem.completedSets + delta);
    const pct =
      targetItem.targetSets > 0
        ? Math.min(100, Math.round((newSets / targetItem.targetSets) * 100))
        : targetItem.completionPercentage;
    const nextList = dailyExercises.map((item, idx) =>
      idx === index ? { ...item, completedSets: newSets, completionPercentage: pct } : item
    );
    syncExerciseItemUpdate(nextList, targetItem.id, { completedSets: newSets, completionPercentage: pct });
  };

  const handleUpdateReps = (index: number, delta: number) => {
    const targetItem = dailyExercises[index];
    if (!targetItem) return;
    const newReps = Math.max(0, targetItem.completedReps + delta);
    const nextList = dailyExercises.map((item, idx) =>
      idx === index ? { ...item, completedReps: newReps } : item
    );
    syncExerciseItemUpdate(nextList, targetItem.id, { completedReps: newReps });
  };

  const handleUpdateTargetDosage = (index: number, field: "targetSets" | "targetReps", value: number) => {
    const targetItem = dailyExercises[index];
    if (!targetItem) return;
    const clamped = Math.max(1, value || 1);
    const nextList = dailyExercises.map((item, idx) =>
      idx === index ? { ...item, [field]: clamped } : item
    );
    syncExerciseItemUpdate(nextList, targetItem.id, { [field]: clamped });
  };

  const handleUpdateCompletionPct = (index: number, pctValue: number) => {
    const targetItem = dailyExercises[index];
    if (!targetItem) return;
    const clamped = Math.min(100, Math.max(0, Math.round(pctValue)));
    const nextList = dailyExercises.map((item, idx) =>
      idx === index ? { ...item, completionPercentage: clamped } : item
    );
    syncExerciseItemUpdate(nextList, targetItem.id, { completionPercentage: clamped });
  };

  // Delete Assigned Exercise from Patient Schedule
  const handleDeleteAssignedExercise = async (exerciseItemId: string) => {
    if (!patient) return;
    const nextList = dailyExercises.filter((item) => item.id !== exerciseItemId);
    setDailyExercises(nextList);
    const nextPatient = {
      ...patient,
      assignedExercises: nextList,
      updatedAt: new Date().toISOString(),
    };
    setPatient(nextPatient);
    upsertLocalCase(nextPatient);
    showToast("success", "تم حذف التمرين من برنامج المريض وتحديث الملف.");

    try {
      await fetch(
        `/api/cases/${patient.id}/exercises?exerciseItemId=${encodeURIComponent(exerciseItemId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseItemId, _baseSnapshot: nextPatient }),
        }
      );
    } catch (err) {
      console.warn("Delete exercise server sync skipped:", err);
    }
  };

  // Open Multi-Exercise Picker Modal
  const handleOpenAddExercisesModal = () => {
    setSelectedLibraryMap({});
    setLibrarySearch("");
    setLibraryRegion("ALL");
    setCustomExNameAr("");
    setCustomExNameEn("");
    setIsAddExercisesModalOpen(true);
    loadExerciseLibrary();
  };

  const handleToggleLibraryPick = (ex: ExerciseItem) => {
    setSelectedLibraryMap((prev) => {
      const existing = prev[ex.id];
      if (existing?.selected) {
        const copy = { ...prev };
        delete copy[ex.id];
        return copy;
      }
      return {
        ...prev,
        [ex.id]: {
          selected: true,
          sets: 3,
          reps: 10,
          completionPercentage: 0,
          notes: "",
          exercise: ex,
        },
      };
    });
  };

  const handleAddCustomExerciseToSelection = () => {
    if (!customExNameAr.trim()) return;
    const customId = `custom-ex-${Date.now()}`;
    const newEx: ExerciseItem = {
      id: customId,
      nameAr: customExNameAr.trim(),
      nameEn: customExNameEn.trim() || customExNameAr.trim(),
      region: "LOWER",
      category: customExCategory.trim() || "تأهيل مخصص",
      isIsometric: false,
    };
    setLibraryExercises((prev) => [newEx, ...prev]);
    setSelectedLibraryMap((prev) => ({
      ...prev,
      [customId]: {
        selected: true,
        sets: 3,
        reps: 12,
        completionPercentage: 0,
        notes: "",
        exercise: newEx,
      },
    }));
    setCustomExNameAr("");
    setCustomExNameEn("");
  };

  const handleSaveSelectedExercises = async () => {
    if (!patient) return;
    const chosen = Object.values(selectedLibraryMap).filter((item) => item.selected);
    if (chosen.length === 0) {
      showToast("error", "يرجى تحديد تمرين واحد على الأقل للإضافة.");
      return;
    }
    setIsSavingExercises(true);
    try {
      const payloadItems = chosen.map((item, idx) => ({
        id: `pex-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        exerciseId: item.exercise.id,
        exercise: item.exercise,
        targetSets: Math.max(1, Number(item.sets) || 3),
        targetReps: Math.max(1, Number(item.reps) || 10),
        completedSets: 0,
        completedReps: 0,
        completionPercentage: Math.min(100, Math.max(0, Number(item.completionPercentage) || 0)),
        notes: item.notes?.trim() || null,
        orderIndex: dailyExercises.length + idx,
      }));

      let updatedExercisesList = [...dailyExercises, ...payloadItems];
      try {
        const res = await fetch(`/api/cases/${patient.id}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercises: payloadItems, _baseSnapshot: patient }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data?.exercises)) {
            updatedExercisesList = data.exercises;
          }
        }
      } catch (err) {
        console.warn("Add exercises server sync fallback:", err);
      }

      setDailyExercises(updatedExercisesList);
      const nextPatient = {
        ...patient,
        assignedExercises: updatedExercisesList,
        updatedAt: new Date().toISOString(),
      };
      setPatient(nextPatient);
      upsertLocalCase(nextPatient);
      setIsAddExercisesModalOpen(false);
      showToast("success", `تمت إضافة ${chosen.length} تمرين إلى جدول المريض بنجاح!`);
    } finally {
      setIsSavingExercises(false);
    }
  };

  // Copy Exercise Schedule to Clipboard (عيادة Revive)
  const handleCopySchedule = () => {
    if (!patient) return;

    let textToCopy = "";
    if (isRestDay) {
      textToCopy = `*جدول التأهيل الحركي — عيادة Revive*\nالمريض: ${patient.name}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}\n\n🧘‍♂️ اليوم مخصص للراحة النشطة والاستشفاء العضلي (Active Rest & Recovery Day).`;
    } else {
      const itemsText = dailyExercises
        .map((ex, i) => {
          return `${i + 1}. *${ex.exercise?.nameAr || "تمرين"}* (${ex.exercise?.nameEn || ""})\n   🎯 المستهدف: ${ex.targetSets} مجموعات × ${ex.targetReps} تكرار\n   ✅ المنجز: ${ex.completedSets}/${ex.targetSets} مجموعات (${ex.completionPercentage ?? 0}% إنجاز)`;
        })
        .join("\n\n");

      textToCopy = `*جدول التمارين — عيادة Revive* 🏋️‍♂️\nالمريض: ${patient.name}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}\n━━━━━━━━━━━━━━━━━━━━\n${itemsText}\n━━━━━━━━━━━━━━━━━━━━\nعيادة Revive للعلاج الطبيعي والتأهيل الحركي`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2500);
  };

  // Sessions Log Handlers
  const orderedSessions = useMemo(() => {
    const list = [...(patient?.sessions || [])];
    list.sort((a, b) =>
      sessionSortOrder === "asc"
        ? (a.sessionNumber || 0) - (b.sessionNumber || 0)
        : (b.sessionNumber || 0) - (a.sessionNumber || 0)
    );
    return list;
  }, [patient?.sessions, sessionSortOrder]);

  const openNewSessionModal = () => {
    if (!patient) return;
    loadExerciseLibrary();
    const nextNum = (patient.sessions || []).reduce((m, s) => Math.max(m, s.sessionNumber || 0), 0) + 1;
    setEditingSessionId(null);
    setSessionDate(new Date().toISOString().split("T")[0]);
    setSessionTitle(`جلسة تأهيل #${nextNum}`);
    setSessionPhase(patient.rehabPrograms?.[0]?.phase || "ACUTE");
    setSessionDuration("45");
    setSessionPainLevel("2");
    setSessionNotes("");
    setSessionExtraDetails("");
    setSessionExPickerId("");
    setSessionCustomExName("");
    setSessionExercisesForm(
      dailyExercises.map((ex, idx) => ({
        id: `sex-${Date.now()}-${idx}`,
        exerciseId: ex.exerciseId,
        nameAr: ex.exercise?.nameAr || "تمرين",
        nameEn: ex.exercise?.nameEn || "",
        category: ex.exercise?.category || "تأهيل",
        sets: ex.targetSets || 3,
        reps: ex.targetReps || 10,
        completionPercentage: ex.completionPercentage ?? 100,
        notes: ex.notes || "",
      }))
    );
    setIsSessionModalOpen(true);
  };

  const openEditSessionModal = (sess: PatientSessionItem) => {
    loadExerciseLibrary();
    setEditingSessionId(sess.id);
    setSessionDate(sess.date ? sess.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setSessionTitle(sess.title || `جلسة تأهيل #${sess.sessionNumber}`);
    setSessionPhase(sess.phase || patient?.rehabPrograms?.[0]?.phase || "ACUTE");
    setSessionDuration(sess.durationMinutes ? String(sess.durationMinutes) : "45");
    setSessionPainLevel(sess.painLevel !== null && sess.painLevel !== undefined ? String(sess.painLevel) : "2");
    setSessionNotes(sess.notes || "");
    setSessionExtraDetails(sess.extraDetails || "");
    setSessionExPickerId("");
    setSessionCustomExName("");
    setSessionExercisesForm((sess.exercises || []).map((ex) => ({ ...ex })));
    setIsSessionModalOpen(true);
  };

  const handleImportScheduleToSession = () => {
    const imported: SessionExerciseFormItem[] = dailyExercises.map((ex, idx) => ({
      id: `sex-imp-${Date.now()}-${idx}`,
      exerciseId: ex.exerciseId,
      nameAr: ex.exercise?.nameAr || "تمرين",
      nameEn: ex.exercise?.nameEn || "",
      category: ex.exercise?.category || "تأهيل",
      sets: ex.targetSets || 3,
      reps: ex.targetReps || 10,
      completionPercentage: ex.completionPercentage ?? 100,
      notes: ex.notes || "",
    }));
    setSessionExercisesForm((prev) => [...prev, ...imported]);
  };

  const handleAddLibraryExerciseToSession = (exId: string) => {
    if (!exId) return;
    const found = libraryExercises.find((e) => e.id === exId);
    if (!found) return;
    setSessionExercisesForm((prev) => [
      ...prev,
      {
        id: `sex-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        exerciseId: found.id,
        nameAr: found.nameAr,
        nameEn: found.nameEn,
        category: found.category,
        sets: 3,
        reps: 10,
        completionPercentage: 100,
        notes: "",
      },
    ]);
    setSessionExPickerId("");
  };

  const handleAddCustomExerciseToSession = () => {
    if (!sessionCustomExName.trim()) return;
    setSessionExercisesForm((prev) => [
      ...prev,
      {
        id: `sex-c-${Date.now()}`,
        nameAr: sessionCustomExName.trim(),
        nameEn: "",
        category: "تمرين مخصص",
        sets: 3,
        reps: 12,
        completionPercentage: 100,
        notes: "",
      },
    ]);
    setSessionCustomExName("");
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setIsSavingSession(true);
    try {
      const existingList = patient.sessions || [];
      const existingTarget = editingSessionId
        ? existingList.find((s) => s.id === editingSessionId)
        : null;
      const nextNum =
        existingTarget?.sessionNumber ||
        existingList.reduce((m, s) => Math.max(m, s.sessionNumber || 0), 0) + 1;

      const avgCompletion =
        sessionExercisesForm.length > 0
          ? Math.round(
              sessionExercisesForm.reduce((acc, ex) => acc + (Number(ex.completionPercentage) || 0), 0) /
                sessionExercisesForm.length
            )
          : 100;

      const sessionObj: PatientSessionItem = {
        id: editingSessionId || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sessionNumber: nextNum,
        date: sessionDate,
        title: sessionTitle.trim() || `جلسة تأهيل #${nextNum}`,
        phase: sessionPhase,
        durationMinutes: parseInt(sessionDuration, 10) || 45,
        painLevel: sessionPainLevel !== "" ? parseInt(sessionPainLevel, 10) : null,
        overallCompletion: avgCompletion,
        exercises: sessionExercisesForm,
        notes: sessionNotes.trim() || null,
        extraDetails: sessionExtraDetails.trim() || null,
        createdAt: existingTarget?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let nextSessions = editingSessionId
        ? existingList.map((s) => (s.id === editingSessionId ? sessionObj : s))
        : [...existingList, sessionObj];
      nextSessions.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

      try {
        const res = await fetch(`/api/cases/${patient.id}/sessions`, {
          method: editingSessionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: sessionObj, _baseSnapshot: patient }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data?.sessions)) nextSessions = data.sessions;
        }
      } catch (err) {
        console.warn("Session server sync fallback:", err);
      }

      const nextPatient = {
        ...patient,
        sessions: nextSessions,
        updatedAt: new Date().toISOString(),
      };
      setPatient(nextPatient);
      upsertLocalCase(nextPatient);
      setIsSessionModalOpen(false);
      showToast(
        "success",
        editingSessionId
          ? `تم تحديث الجلسة #${sessionObj.sessionNumber} في سجل المريض.`
          : `تم تسجيل الجلسة #${sessionObj.sessionNumber} وحفظها بنجاح!`
      );
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!patient) return;
    const nextSessions = (patient.sessions || []).filter((s) => s.id !== sessionId);
    const nextPatient = { ...patient, sessions: nextSessions, updatedAt: new Date().toISOString() };
    setPatient(nextPatient);
    upsertLocalCase(nextPatient);
    showToast("success", "تم حذف الجلسة من السجل.");

    try {
      await fetch(`/api/cases/${patient.id}/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, _baseSnapshot: nextPatient }),
      });
    } catch {}
  };

  const handleShareSessionWhatsApp = (sess: PatientSessionItem) => {
    if (!patient) return;
    const exLines = (sess.exercises || [])
      .map(
        (ex, i) =>
          `${i + 1}. *${ex.nameAr}* — ${ex.sets} مجموعات × ${ex.reps} تكرار (إنجاز ${ex.completionPercentage}%)`
      )
      .join("\n");
    const msg = [
      `*ملخص جلسة تأهيل #${sess.sessionNumber} — عيادة Revive* 🩺`,
      `👤 *المريض:* ${patient.name}`,
      `📅 *التاريخ:* ${formatDate(sess.date)}`,
      `⚡ *المرحلة:* ${getPhaseLabel(sess.phase || "ACUTE").ar}`,
      sess.painLevel !== null && sess.painLevel !== undefined ? `📊 *مؤشر الألم:* ${sess.painLevel}/10` : null,
      exLines ? `\n🏋️‍♂️ *تمارين الجلسة:*\n${exLines}` : null,
      sess.notes ? `\n📝 *ملاحظات الطبيب:* ${sess.notes}` : null,
      sess.extraDetails ? `📋 *تفاصيل إضافية:* ${sess.extraDetails}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `عيادة Revive للعلاج الطبيعي والتأهيل الحركي`,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(generateWhatsAppShareLink(msg), "_blank");
  };

  // Add New Girth Measurement Handler
  const handleAddGirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const validRows = girthRowsInput
      .filter((r) => r.injuredCm.trim() !== "")
      .map((r) => ({
        distanceCm: Number(r.distanceCm) || 0,
        injuredCm: parseFloat(r.injuredCm),
        healthyCm: r.healthyCm.trim() ? parseFloat(r.healthyCm) : null,
      }));
    if (validRows.length === 0) {
      showToast("error", "يرجى إدخال قياس واحد على الأقل للطرف المصاب بالسنتيمتر.");
      return;
    }
    setIsSavingGirth(true);
    try {
      const existingGirth =
        (patient.girthEvaluations && patient.girthEvaluations.length > 0
          ? patient.girthEvaluations
          : patient.girthMeasurements) || [];
      const newEval: GirthEvaluationItem = {
        id: `girth-${Date.now()}`,
        patientId: patient.id,
        date: girthDateInput || new Date().toISOString(),
        landmark: girthLandmark,
        createdAt: new Date().toISOString(),
        measurements: validRows.map((m, idx) => ({
          id: `gm-${Date.now()}-${idx}`,
          evaluationId: "",
          distanceCm: m.distanceCm,
          injuredCm: m.injuredCm,
          healthyCm: m.healthyCm,
        })),
      };
      const nextGirthList = [newEval, ...existingGirth];
      const updated = await patchCaseWithSync(patient, {
        girthEvaluations: nextGirthList,
        girthMeasurements: nextGirthList,
      });
      setPatient(updated);
      setIsAddGirthOpen(false);
      setGirthRowsInput([
        { distanceCm: 0, injuredCm: "", healthyCm: "" },
        { distanceCm: 15, injuredCm: "", healthyCm: "" },
        { distanceCm: 30, injuredCm: "", healthyCm: "" },
      ]);
      showToast("success", "تم حفظ قياس محيط العضلات الجديد وإظهاره في الملخص والتفاصيل!");
    } finally {
      setIsSavingGirth(false);
    }
  };

  // Phase Transition via Selector Action
  const handleConfirmPhaseTransition = async () => {
    if (!patient) return;
    setIsUpdatingPhase(true);
    try {
      const notes =
        phaseTransitionNotes.trim() ||
        `انتقال سريري معتمد إلى مرحلة: ${getPhaseLabel(selectedNewPhase).ar} (${getPhaseLabel(selectedNewPhase).en})`;
      const updated = await patchCaseWithSync(patient, {
        phase: selectedNewPhase,
        phaseNotes: notes,
      });
      setPatient(updated);
      setAdvanceSuccess(true);
      setTimeout(() => setAdvanceSuccess(false), 4000);
      setIsPhaseModalOpen(false);
      setPhaseTransitionNotes("");
      showToast("success", `تم الانتقال إلى "${getPhaseLabel(selectedNewPhase).ar}" وحفظ المرحلة بنجاح!`);
    } catch (err: any) {
      console.error("Phase transition error:", err);
      showToast("error", err.message || "حدث خطأ أثناء الانتقال للمرحلة");
    } finally {
      setIsUpdatingPhase(false);
    }
  };

  // Edit Patient Profile Action
  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setIsSavingEdit(true);
    try {
      const updated = await patchCaseWithSync(patient, {
        ...editFormData,
        dateOfBirth: editFormData.dateOfBirth || null,
        surgeryDate: editFormData.surgeryDate || null,
      });
      setPatient(updated);
      setIsEditModalOpen(false);
      showToast("success", "تم حفظ تعديلات ملف المريض بنجاح!");
    } catch (err: any) {
      console.error("Save edit profile error:", err);
      showToast("error", err.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSavingEdit(false);
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

  // Flattened Girth Measurements for Multi-Date Comparison (fixes empty-array truthiness)
  const flattenedGirthRows = useMemo(() => {
    const gEv = (patient as any)?.girthEvaluations;
    const gMs = patient?.girthMeasurements;
    const list =
      Array.isArray(gEv) && gEv.length > 0
        ? gEv
        : Array.isArray(gMs) && gMs.length > 0
        ? gMs
        : [];
    if (list.length === 0) return [];
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

    list.forEach((evaluation: any, eIdx: number) => {
      const evalDate = evaluation.date || evaluation.createdAt || patient?.createdAt || new Date().toISOString();
      const evalId = evaluation.id || `eval-${eIdx}`;
      evaluation.measurements?.forEach((m: any) => {
        const injured = typeof m.injuredCm === "string" ? parseFloat(m.injuredCm) : Number(m.injuredCm);
        const healthy =
          m.healthyCm !== null && m.healthyCm !== undefined && m.healthyCm !== ""
            ? typeof m.healthyCm === "string"
              ? parseFloat(m.healthyCm)
              : Number(m.healthyCm)
            : null;

        if (isNaN(injured)) return;

        const diff = healthy !== null && !isNaN(healthy) ? Number((healthy - injured).toFixed(1)) : null;
        const lsi = healthy !== null && !isNaN(healthy) && healthy > 0 ? Math.round((injured / healthy) * 100) : null;

        rows.push({
          evaluationId: evalId,
          date: evalDate,
          landmark: evaluation.landmark || "محيط العضلات",
          distanceCm: Number(m.distanceCm) || 0,
          injuredCm: injured,
          healthyCm: healthy,
          deficitCm: diff,
          lsi,
        });
      });
    });

    return rows;
  }, [patient?.girthMeasurements, (patient as any)?.girthEvaluations, patient?.createdAt]);

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
  const latestGirthRow = flattenedGirthRows[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Global Inline Toast Banner */}
        {toastBanner && (
          <div
            className={cn(
              "p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-sm",
              toastBanner.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            )}
          >
            <div className="flex items-center gap-2">
              {toastBanner.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{toastBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="text-xs opacity-60 hover:opacity-100 px-2"
            >
              ✕
            </button>
          </div>
        )}

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
                        {patient.status === "paused" ? "متوقف مؤقتاً" : patient.status}
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
                  onClick={() => setIsEditModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  <span>تعديل البيانات</span>
                </Button>

                <Button
                  onClick={() => setIsPhaseModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تغيير المرحلة</span>
                </Button>

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

            {/* Middle Row: Diagnosis, Side, Current Phase & Girth Summary */}
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

              <button
                type="button"
                onClick={() => setIsPhaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs py-1 px-2.5 rounded-full font-semibold transition-colors"
                title="اضغط لتغيير المرحلة التأهيلية"
              >
                <span>المرحلة: {phaseInfo.ar} ({phaseInfo.en})</span>
                <Sparkles className="w-3 h-3 text-emerald-600" />
              </button>

              {latestGirthRow && (
                <button
                  type="button"
                  onClick={() => setActiveTab("girth")}
                  className={cn(
                    "inline-flex items-center gap-1.5 border text-xs py-1 px-2.5 rounded-full font-semibold transition-colors",
                    latestGirthRow.deficitCm !== null && latestGirthRow.deficitCm > 0
                      ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      : "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                  )}
                >
                  <Ruler className="w-3 h-3" />
                  <span>
                    محيط العضلات: {latestGirthRow.injuredCm} سم
                    {latestGirthRow.healthyCm !== null ? ` / السليم ${latestGirthRow.healthyCm} سم` : ""}
                    {latestGirthRow.lsi ? ` (${latestGirthRow.lsi}% LSI)` : ""}
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Row: Key Dates & Sessions Grid */}
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
                <span className="text-emerald-700 block font-medium">جلسات التأهيل المسجلة</span>
                <span className="font-bold text-emerald-900 mt-1 block">
                  {patient.sessions?.length || 0} جلسة مسجلة
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
              <span>المدى الحركي ({patient.romMeasurements?.length || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="girth"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Ruler className="w-4 h-4" />
              <span>محيط العضلات ({flattenedGirthRows.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="schedule"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Dumbbell className="w-4 h-4" />
              <span>التمارين ({dailyExercises.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="sessions"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <ClipboardList className="w-4 h-4 text-emerald-700" />
              <span>سجل الجلسات ({patient.sessions?.length || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="rtp"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>شروط النزول للملعب ({patient.rtpEvaluations?.length || 0})</span>
            </TabsTrigger>

            <TabsTrigger
              value="video-analysis"
              className="gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>تحليل AI ({patient.videoAnalyses?.length || 0})</span>
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
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>الملف الإكلينيكي وآلية الإصابة</span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="h-7 text-xs text-slate-600 hover:text-emerald-700 gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>تعديل</span>
                  </Button>
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
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>البرنامج التأهيلي النشط</span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPhaseModalOpen(true)}
                    className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>تغيير المرحلة</span>
                  </Button>
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
                      تاريخ بدء المرحلة: {currentProgram?.startDate ? formatDate(currentProgram.startDate) : formatDate(patient.rehabStartDate)}
                    </p>
                    {currentProgram?.notes && (
                      <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-emerald-100/80">
                        {currentProgram.notes}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">التمارين الموصوفة:</span>
                      <span className="font-bold text-navy-950 mt-0.5 block">
                        {dailyExercises.length} تمارين مخصصة
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block">إجمالي الجلسات المسجلة:</span>
                      <span className="font-bold text-navy-950 mt-0.5 block">
                        {patient.sessions?.length || 0} جلسة
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MUSCLE GIRTH SUMMARY CARD IN OVERVIEW */}
            <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-emerald-600" />
                    <span>ملخص قياسات محيط العضلات والضمور (Muscle Circumference Summary)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    متابعة فرق المحيط ومؤشر التماثل العضلي (LSI%) بين الطرف المصاب والسليم
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddGirthOpen(true)}
                    className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة قياس</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("girth")}
                    className="h-8 text-xs text-slate-600 hover:text-emerald-700"
                  >
                    <span>عرض السجل الكامل ←</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {flattenedGirthRows.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span>لا توجد قياسات محيط عضلات مسجلة لهذه الحالة حتى الآن.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddGirthOpen(true)}
                      className="h-7 text-xs border-emerald-300 text-emerald-700"
                    >
                      تسجيل أول قياس محيط
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {flattenedGirthRows.slice(0, 4).map((row, idx) => (
                      <div
                        key={`ov-girth-${row.evaluationId}-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 line-clamp-1">{row.landmark}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {row.distanceCm} سم
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-500">المصاب: <strong className="text-emerald-700">{row.injuredCm} سم</strong></span>
                          <span className="text-slate-500">السليم: <strong className="text-slate-800">{row.healthyCm != null ? `${row.healthyCm} سم` : "—"}</strong></span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                          {row.deficitCm !== null ? (
                            <span className={cn("font-bold", row.deficitCm > 0 ? "text-amber-700" : "text-emerald-700")}>
                              {row.deficitCm > 0 ? `ضمور: -${row.deficitCm} سم` : "متماثل"}
                            </span>
                          ) : (
                            <span className="text-slate-400">مفرد</span>
                          )}
                          {row.lsi !== null && (
                            <Badge variant={row.lsi >= 90 ? "success" : "warning"} className="text-[10px] py-0">
                              LSI {row.lsi}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DYNAMIC PHASE TRANSITION CHECKLIST SECTION */}
            <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex flex-wrap items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                      <span>معايير الانتقال للمرحلة التالية (Dynamic Transition Criteria)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>تتكيف تلقائياً حسب المرحلة الحالية ونوع الإصابة:</span>
                      <Badge variant="outline" className="text-[11px] bg-white text-emerald-800 border-emerald-200">
                        {injuryCategoryMeta.labelAr}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px] bg-emerald-100 text-emerald-800">
                        {phaseInfo.ar}
                      </Badge>
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
                    استيفاء: {criteriaMetCount} من {dynamicCriteria.length} ({criteriaProgressPct}%)
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <Progress value={criteriaProgressPct} className="h-2 bg-slate-200" />
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-3">
                {dynamicCriteria.map((item) => (
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
                    <div className="flex-1 space-y-0.5 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{item.textAr}</span>
                        {item.targetMetric && (
                          <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 text-slate-700">
                            {item.targetMetric}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block font-normal">{item.textEn}</span>
                    </div>
                  </label>
                ))}
              </CardContent>

              <CardFooter className="bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 p-4">
                <span className="text-xs text-slate-500">
                  {criteriaProgressPct === 100
                    ? "✨ جميع الشروط مستوفاة! يمكنك ترقية أو نقل الحالة لأي مرحلة."
                    : "⚠️ يمكنك تحديد الشروط المستوفاة أو اختيار أي مرحلة تأهيلية للانتقال المباشر."}
                </span>

                <Button
                  onClick={() => setIsPhaseModalOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>الانتقال أو اختيار المرحلة التأهيلية (Select Phase)</span>
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
              <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-emerald-600" />
                    <span>سجل قياسات محيط العضلات والضمور (Girth Evaluation)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    مقارنة محيط الطرف المصاب بالطرف السليم عند معالم تشريحية مختلفة (Limb Symmetry Index LSI)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddGirthOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة قياس محيط جديد</span>
                </Button>
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
          {/* TAB: RETURN TO PLAY (RTP) EVALUATIONS */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="rtp" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                      <span>تقييمات معايير النزول للملعب والجاهزية الرياضية (RTP)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      سجل الفحوصات الوظيفية واختبارات القفز والألم الخاصة بقرار العودة للمنافسة بأمان
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 self-start sm:self-auto">
                    <Link href={`/return-to-play?patientId=${patient.id}`}>
                      <Plus className="w-4 h-4" />
                      <span>إجراء فحص جاهزية جديد</span>
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {(!patient.rtpEvaluations || patient.rtpEvaluations.length === 0) ? (
                  <div className="p-12 text-center space-y-3">
                    <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لم يتم تسجيل أي فحص معايير عودة للملعب لهذا المريض حتى الآن.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2 text-xs border-emerald-300 text-emerald-700">
                      <Link href={`/return-to-play?patientId=${patient.id}`}>
                        الانتقال إلى صفحة شروط النزول للملعب
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {patient.rtpEvaluations.map((evalItem, idx) => {
                      const totalCrit = evalItem.criteria?.length || 0;
                      const passedCrit = evalItem.criteria?.filter((c) => c.passed).length || 0;
                      const score = evalItem.readinessScore ?? (totalCrit > 0 ? Math.round((passedCrit / totalCrit) * 100) : 0);
                      const isReady = score >= 90;

                      return (
                        <div key={evalItem.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs",
                                isReady ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                              )}>
                                {score}%
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">
                                  {evalItem.protocolName || "تقييم العودة للملعب"}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  تاريخ التقييم: {formatDate(evalItem.evaluatedAt || (evalItem as any).createdAt || new Date().toISOString())} • المرحلة: {getPhaseLabel(evalItem.phase || "RETURN_TO_SPORT").ar}
                                </span>
                              </div>
                            </div>

                            <Badge className={cn(
                              "text-xs px-3 py-1 font-bold",
                              isReady ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                            )}>
                              {isReady ? "جاهز للنزول للملعب (Cleared)" : `غير مكتمل (${passedCrit} من ${totalCrit} معيار)`}
                            </Badge>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {evalItem.criteria?.map((c, cIdx) => (
                              <div key={c.id || cIdx} className={cn(
                                "p-2.5 rounded-lg border flex items-start gap-2",
                                c.passed ? "bg-emerald-50/40 border-emerald-200 text-emerald-950" : "bg-slate-50 border-slate-200 text-slate-600"
                              )}>
                                <span className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold",
                                  c.passed ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                                )}>
                                  {c.passed ? "✓" : "✗"}
                                </span>
                                <div>
                                  <span className="font-semibold block">{c.criterionText}</span>
                                  {c.notes && <span className="text-[11px] text-slate-500 mt-0.5 block">{c.notes}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB: AI MOTION & VIDEO ANALYSES */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="video-analysis" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      <span>سجل تحليلات الذكاء الاصطناعي والزوايا الحركية (AI Motion Analysis)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      قياسات الزوايا المفصلية الكاملة (الكتف، لوح الكتف، الكوع، الرسغ، العمود الفقري، الورك، الركبة، الكاحل) والعضلات النشطة
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 self-start sm:self-auto">
                    <Link href={`/ai-analysis?patientId=${patient.id}`}>
                      <Video className="w-4 h-4" />
                      <span>بدء تحليل فيديو جديد</span>
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {(!patient.videoAnalyses || patient.videoAnalyses.length === 0) ? (
                  <div className="p-12 text-center space-y-3">
                    <Video className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">
                      لا توجد جلسات تحليل حركي بالذكاء الاصطناعي مسجلة لهذا المريض حتى الآن.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2 text-xs border-blue-300 text-blue-700">
                      <Link href={`/ai-analysis?patientId=${patient.id}`}>
                        الانتقال إلى صفحة تحليل الذكاء الاصطناعي (AI Analysis)
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Multi-Session AI Comparison Table when >= 2 sessions */}
                    {patient.videoAnalyses.length >= 2 && (() => {
                      const newest = patient.videoAnalyses[0];
                      const oldest = patient.videoAnalyses[patient.videoAnalyses.length - 1];
                      const comparisonRows = computeSessionComparison(oldest, newest).slice(0, 12);
                      return (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-indigo-600" />
                              <span>مقارنة التطور الحركي للمريض (أول جلسة تصوير vs أحدث جلسة)</span>
                            </h4>
                            <span className="text-[11px] text-indigo-700 font-medium">
                              {formatDateShort(oldest.evaluatedAt || oldest.createdAt)} ← {formatDateShort(newest.evaluatedAt || newest.createdAt)}
                            </span>
                          </div>
                          <div className="overflow-x-auto bg-white rounded-lg border border-indigo-100">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow>
                                  <TableHead className="text-start text-xs">المفصل</TableHead>
                                  <TableHead className="text-start text-xs">الحركة</TableHead>
                                  <TableHead className="text-start text-xs">أول قياس</TableHead>
                                  <TableHead className="text-start text-xs">أحدث قياس</TableHead>
                                  <TableHead className="text-start text-xs">التغير (Delta)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {comparisonRows.map((row) => {
                                  const improved = row.lowerIsBetter ? row.delta < 0 : row.delta > 0;
                                  return (
                                    <TableRow key={row.id} className="text-xs">
                                      <TableCell className="font-bold text-slate-800">{row.jointAr}</TableCell>
                                      <TableCell className="text-slate-600">{row.movementAr}</TableCell>
                                      <TableCell className="font-mono">{row.baselineVal}°</TableCell>
                                      <TableCell className="font-mono font-bold text-emerald-700">{row.latestVal}°</TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={improved ? "success" : "secondary"}
                                          className="text-[10px] font-mono"
                                        >
                                          {row.delta > 0 ? `+${row.delta}°` : `${row.delta}°`}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })()}

                    {patient.videoAnalyses.map((vaItem: any, idx: number) => {
                      const a = normalizeJointAngles(vaItem.jointAngles);
                      return (
                        <div key={vaItem.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                AI
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">
                                  {vaItem.exerciseName || "تحليل حركي مفصل"}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  التاريخ: {formatDate(vaItem.evaluatedAt || vaItem.createdAt || new Date().toISOString())} • زاوية التصوير: {vaItem.cameraPlane === "frontal" ? "مستوى أمامي (Frontal)" : "مستوى جانبي (Sagittal)"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Full Joint Angles Grid */}
                          <div className="p-4 border-b border-slate-100 space-y-3">
                            <span className="text-xs font-bold text-slate-700 block">الزوايا المفصلية والحركات المسجلة:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">الكتف (Shoulder)</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>رفع أمامي: <strong>{a.shoulder.flexion}°</strong></span>
                                  <span>تبعيد: <strong>{a.shoulder.abduction}°</strong></span>
                                  <span>دوران خارجي: <strong>{a.shoulder.externalRotation}°</strong></span>
                                  <span>دوران داخلي: <strong>{a.shoulder.internalRotation}°</strong></span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">لوح الكتف (Scapula)</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>دوران أعلى: <strong>{a.scapula.upwardRotation}°</strong></span>
                                  <span>ضم: <strong>{a.scapula.retraction}°</strong></span>
                                  <span>تبعيد: <strong>{a.scapula.protraction}°</strong></span>
                                  <span>إمالة خلفية: <strong>{a.scapula.posteriorTilt}°</strong></span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">الكوع والرسغ</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>ثني الكوع: <strong>{a.elbow.flexion}°</strong></span>
                                  <span>كب/بسط: <strong>{a.elbow.pronation}°/{a.elbow.supination}°</strong></span>
                                  <span>ثني الرسغ: <strong>{a.wrist.flexion}°</strong></span>
                                  <span>بسط الرسغ: <strong>{a.wrist.extension}°</strong></span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">العمود الفقري</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>انحناء أمامي: <strong>{a.spine.flexion}°</strong></span>
                                  <span>تقوس خلفي: <strong>{a.spine.extension}°</strong></span>
                                  <span>ميل جانبي: <strong>{a.spine.lateralFlexionRight}°/{a.spine.lateralFlexionLeft}°</strong></span>
                                  <span>دوران: <strong>{a.spine.rotationRight}°</strong></span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">الركبة والورك</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>ثني الركبة: <strong>{a.knee.flexion}°</strong></span>
                                  <span>انحراف Valgus: <strong>{a.knee.valgus}°</strong></span>
                                  <span>ثني الورك: <strong>{a.hip.flexion}°</strong></span>
                                  <span>تبعيد الورك: <strong>{a.hip.abduction}°</strong></span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="font-bold text-slate-800 block">الكاحل (Ankle)</span>
                                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1">
                                  <span>عطف ظهري: <strong>{a.ankle.dorsiflexion}°</strong></span>
                                  <span>عطف أخمصي: <strong>{a.ankle.plantarflexion}°</strong></span>
                                  <span>انقلاب داخلي: <strong>{a.ankle.inversion}°</strong></span>
                                  <span>انقلاب خارجي: <strong>{a.ankle.eversion}°</strong></span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Active Muscles Engagement */}
                          {vaItem.activeMuscles && vaItem.activeMuscles.length > 0 && (
                            <div className="p-4 bg-slate-50/50">
                              <span className="text-xs font-bold text-slate-700 block mb-2">العضلات العاملة والمستهدفة في التمرين:</span>
                              <div className="flex flex-wrap gap-2">
                                {vaItem.activeMuscles.map((m: any, mIdx: number) => (
                                  <Badge key={mIdx} variant="secondary" className="text-xs py-1 px-2.5 bg-white border-slate-200">
                                    <span className="font-bold text-emerald-800">{m.nameAr}</span>
                                    <span className="text-slate-400 ms-1">({m.percentage}%)</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* TAB 4: EXERCISE SCHEDULE (EXERCISES MANAGEMENT) */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Toolbar: Rest Day Switch, Add Multi-Exercises, WhatsApp & Copy */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="rest-day-toggle"
                    checked={isRestDay}
                    onCheckedChange={handleToggleRestDay}
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

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleOpenAddExercisesModal}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة تمرين / تمارين للمريض</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleShareExercisesWhatsApp}
                  variant="whatsapp"
                  size="sm"
                  className="gap-1.5 font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب</span>
                </Button>

                <Button
                  onClick={handleCopySchedule}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  {copiedSchedule ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-600" />
                      <span>نسخ الجدول</span>
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
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
                <Dumbbell className="w-10 h-10 mx-auto text-slate-300" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-base">
                    جدول التمارين فارغ حالياً
                  </p>
                  <p className="text-xs text-slate-500">
                    يبدأ ملف كل مريض بدون تمارين مثبتة مسبقاً حتى يضيف الطبيب التمارين المناسبة للحالة.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenAddExercisesModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة تمرين أو عدة تمارين الآن</span>
                </Button>
              </div>
            ) : (
              /* Exercise Cards Grid with Target Dosage, Completion %, Interactive Counters & Delete */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dailyExercises.map((item, index) => {
                  const targetSets = item.targetSets || 3;
                  const completedSets = item.completedSets || 0;
                  const pct =
                    item.completionPercentage !== undefined
                      ? item.completionPercentage
                      : Math.min(100, Math.round((completedSets / targetSets) * 100));
                  const isSetsCompleted = pct >= 100 || completedSets >= targetSets;

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
                          <div className="flex items-center gap-2.5 min-w-0">
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
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-bold text-navy-950 line-clamp-1">
                                {item.exercise?.nameAr}
                              </CardTitle>
                              <CardDescription className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                                {item.exercise?.nameEn}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="secondary" className="text-[10px]">
                              {item.exercise?.category || "تأهيل"}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAssignedExercise(item.id)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="حذف التمرين من ملف المريض"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 pb-4 space-y-4">
                        {/* Target Editable Dosage */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">المجموعات المستهدفة (Sets):</span>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={item.targetSets}
                              onChange={(e) => handleUpdateTargetDosage(index, "targetSets", Number(e.target.value))}
                              className="h-7 text-xs font-bold text-center bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">التكرار المستهدف (Reps):</span>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={item.targetReps}
                              onChange={(e) => handleUpdateTargetDosage(index, "targetReps", Number(e.target.value))}
                              className="h-7 text-xs font-bold text-center bg-white"
                            />
                          </div>
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
                              {item.completedReps} / {item.targetReps}
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
                              {item.completedReps}
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

                        {/* Completion Percentage Slider + Progress Bar */}
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">نسبة الإنجاز (%):</span>
                            <span className="font-mono font-extrabold text-emerald-700">{pct}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={pct}
                            onChange={(e) => handleUpdateCompletionPct(index, Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer h-1.5"
                          />
                          <Progress value={pct} className="h-1.5 bg-slate-200" />
                        </div>

                        {/* Notes / Instructions */}
                        {(item.notes || item.exercise?.instructions) && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            💡 {item.notes || item.exercise?.instructions}
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
          {/* TAB 5: FULL CUMULATIVE SESSIONS LOG */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-navy-950 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-emerald-600" />
                      <span>سجل الجلسات التأهيلية الكامل (من الجلسة #1 حتى آخر جلسة)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      خانة متكاملة لكل جلسة توثق التمارين المنفذة، نسب الإنجاز، مستوى الألم، وملاحظات الطبيب التراكمية
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSessionSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                      className="text-xs gap-1.5 border-slate-300"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{sessionSortOrder === "asc" ? "الترتيب: أول جلسة ← آخر جلسة" : "الترتيب: الأحدث أولاً"}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={openNewSessionModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة جلسة جديدة</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {orderedSessions.length === 0 ? (
                  <div className="p-12 text-center space-y-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">
                      لا توجد جلسات تأهيل مسجلة في السجل التراكمي حتى الآن
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      سجّل الجلسة الأولى لتوثيق كافة التمارين ونسب إنجاز المريض ومؤشرات الألم والملاحظات السريرية.
                    </p>
                    <Button
                      type="button"
                      onClick={openNewSessionModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تسجيل الجلسة الأولى (#1)</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orderedSessions.map((sess) => {
                      const completionAvg =
                        sess.overallCompletion !== undefined
                          ? sess.overallCompletion
                          : sess.exercises?.length
                          ? Math.round(
                              sess.exercises.reduce((a, b) => a + (b.completionPercentage || 0), 0) /
                                sess.exercises.length
                            )
                          : 100;

                      return (
                        <div
                          key={sess.id}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          {/* Session Header */}
                          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                                <span>جلسة</span>
                                <span className="text-sm leading-none">#{sess.sessionNumber}</span>
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-sm text-navy-950">{sess.title}</h4>
                                  {sess.phase && (
                                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                      {getPhaseLabel(sess.phase).ar}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span>📅 {formatDate(sess.date)}</span>
                                  {sess.durationMinutes && <span>• ⏱️ {sess.durationMinutes} دقيقة</span>}
                                  {sess.painLevel !== null && sess.painLevel !== undefined && (
                                    <span>• 📊 الألم (VAS): <strong>{sess.painLevel}/10</strong></span>
                                  )}
                                  <span>• ✅ الإنجاز العام: <strong className="text-emerald-700">{completionAvg}%</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <Button
                                type="button"
                                variant="whatsapp"
                                size="sm"
                                onClick={() => handleShareSessionWhatsApp(sess)}
                                className="h-8 text-xs gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>واتساب</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditSessionModal(sess)}
                                className="h-8 text-xs gap-1 border-slate-300"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(sess.id)}
                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="حذف الجلسة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Session Exercises Table */}
                          {sess.exercises && sess.exercises.length > 0 && (
                            <div className="overflow-x-auto border-b border-slate-100">
                              <Table>
                                <TableHeader className="bg-slate-50/60">
                                  <TableRow>
                                    <TableHead className="text-start text-xs">التمرين</TableHead>
                                    <TableHead className="text-start text-xs">المجموعات (Sets)</TableHead>
                                    <TableHead className="text-start text-xs">التكرارات (Reps)</TableHead>
                                    <TableHead className="text-start text-xs">نسبة الإنجاز %</TableHead>
                                    <TableHead className="text-start text-xs">ملاحظات</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sess.exercises.map((ex, eIdx) => (
                                    <TableRow key={ex.id || eIdx} className="text-xs">
                                      <TableCell className="font-semibold text-slate-900">
                                        {ex.nameAr}
                                        {ex.nameEn && <span className="text-[10px] text-slate-400 ms-1">({ex.nameEn})</span>}
                                      </TableCell>
                                      <TableCell className="font-mono font-bold">{ex.sets}</TableCell>
                                      <TableCell className="font-mono font-bold">{ex.reps}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2 min-w-[100px]">
                                          <Progress value={ex.completionPercentage} className="h-1.5 flex-1 bg-slate-200" />
                                          <span className="font-mono font-bold text-emerald-700">{ex.completionPercentage}%</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-slate-500">{ex.notes || "—"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Notes & Extra Details */}
                          {(sess.notes || sess.extraDetails) && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/30 text-xs">
                              {sess.notes && (
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">ملاحظات الطبيب:</span>
                                  <p className="text-slate-800 whitespace-pre-line">{sess.notes}</p>
                                </div>
                              )}
                              {sess.extraDetails && (
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                                  <span className="text-[11px] font-bold text-slate-500 block mb-0.5">تفاصيل إضافية (استجابة / أجهزة / توصيات):</span>
                                  <p className="text-slate-800 whitespace-pre-line">{sess.extraDetails}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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

      {/* ═══════════════════════════════════════════ */}
      {/* FULL REHAB PHASE SELECTION MODAL */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  تحديد أو تغيير المرحلة التأهيلية
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  اختر أي مرحلة من المراحل التالية للانتقال إليها مباشرة ومراجعة معاييرها الديناميكية
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REHAB_PHASES.map((phaseItem) => {
                const isSelected = selectedNewPhase === phaseItem.key;
                const isCurrent = currentPhaseKey === phaseItem.key;
                return (
                  <div
                    key={phaseItem.key}
                    onClick={() => setSelectedNewPhase(phaseItem.key)}
                    className={cn(
                      "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {phaseItem.order}. {phaseItem.ar}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isCurrent && (
                            <Badge variant="outline" className="text-[9px] bg-white border-emerald-300 text-emerald-800 py-0 px-1.5">
                              الحالية
                            </Badge>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono" dir="ltr">{phaseItem.en}</span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">{phaseItem.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Preview of Dynamic Criteria for Selected Phase + Injury */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  معايير المرحلة المختارة ({getPhaseLabel(selectedNewPhase).ar}):
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {injuryCategoryMeta.labelAr}
                </Badge>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc ps-4">
                {previewModalCriteria.map((c) => (
                  <li key={c.id}>{c.textAr}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700">ملاحظات الانتقال السريرية (Transition Notes):</label>
              <Textarea
                value={phaseTransitionNotes}
                onChange={(e) => setPhaseTransitionNotes(e.target.value)}
                placeholder="اكتب أسباب الانتقال وملاحظات استجابة المريض للعلاج..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPhaseModalOpen(false)}
              disabled={isUpdatingPhase}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmPhaseTransition}
              disabled={isUpdatingPhase}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isUpdatingPhase ? "جاري التحديث..." : "تأكيد واعتماد المرحلة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* EDIT PATIENT PROFILE MODAL */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveEditProfile}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    تعديل بيانات ملف المريض
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    تعديل كافة البيانات الشخصية، الحالة، التواريخ، والتشخيص الإكلينيكي في أي وقت
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">اسم المريض *</label>
                  <Input
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">رقم الهاتف</label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="h-9 text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="h-9 text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ الميلاد</label>
                  <Input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الجنس</label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={(val) => setEditFormData({ ...editFormData, gender: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر (Male)</SelectItem>
                      <SelectItem value="female">أنثى (Female)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">حالة الملف (Status)</label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط — قيد التأهيل (Active)</SelectItem>
                      <SelectItem value="completed">مكتمل التأهيل (Completed)</SelectItem>
                      <SelectItem value="paused">متوقف مؤقتاً (Paused)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">نوع الإصابة / التشخيص *</label>
                  <Input
                    required
                    value={editFormData.injuryType}
                    onChange={(e) => setEditFormData({ ...editFormData, injuryType: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الطرف المصاب</label>
                  <Select
                    value={editFormData.injuredSide}
                    onValueChange={(val: any) => setEditFormData({ ...editFormData, injuredSide: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RIGHT">الطرف الأيمن (Right)</SelectItem>
                      <SelectItem value="LEFT">الطرف الأيسر (Left)</SelectItem>
                      <SelectItem value="BILATERAL">الطرفان معاً (Bilateral)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ حدوث الإصابة</label>
                  <Input
                    type="date"
                    value={editFormData.injuryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, injuryDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ الجراحة (إن وجدت)</label>
                  <Input
                    type="date"
                    value={editFormData.surgeryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, surgeryDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ بدء التأهيل</label>
                  <Input
                    type="date"
                    value={editFormData.rehabStartDate}
                    onChange={(e) => setEditFormData({ ...editFormData, rehabStartDate: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">آلية الإصابة (Mechanism)</label>
                  <Input
                    value={editFormData.mechanismOfInjury}
                    onChange={(e) => setEditFormData({ ...editFormData, mechanismOfInjury: e.target.value })}
                    placeholder="التواء، سقوط، تصادم..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">الملاحظات السريرية والتوصيات</label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingEdit}
                className="text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingEdit}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSavingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* MULTI-EXERCISE PICKER MODAL */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isAddExercisesModalOpen} onOpenChange={setIsAddExercisesModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-600" />
              <span>إضافة تمرين أو عدة تمارين لملف المريض: {patient.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              يمكنك تحديد تمرين واحد أو أكثر وضبط المجموعات (Sets) والتكرارات (Reps) ونسبة الإنجاز (%) لكل تمرين
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Custom Exercise Creator */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                + إضافة تمرين مخصص سريع غير موجود بالقائمة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  value={customExNameAr}
                  onChange={(e) => setCustomExNameAr(e.target.value)}
                  placeholder="اسم التمرين بالعربي..."
                  className="h-8 text-xs sm:col-span-2 bg-white"
                />
                <Input
                  value={customExNameEn}
                  onChange={(e) => setCustomExNameEn(e.target.value)}
                  placeholder="English name (اختياري)"
                  className="h-8 text-xs bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomExerciseToSelection}
                  disabled={!customExNameAr.trim()}
                  className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white"
                >
                  إدراج في المختار
                </Button>
              </div>
            </div>

            {/* Search & Region Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="ابحث باسم التمرين أو العضلة..."
                  className="h-9 ps-8 text-xs"
                />
              </div>
              <Select value={libraryRegion} onValueChange={setLibraryRegion}>
                <SelectTrigger className="sm:w-44 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع المناطق</SelectItem>
                  <SelectItem value="LOWER">الطرف السفلي</SelectItem>
                  <SelectItem value="UPPER">الطرف العلوي</SelectItem>
                  <SelectItem value="CORE">الجذع والعمود الفقري</SelectItem>
                  <SelectItem value="FULL_BODY">كامل الجسم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exercises List with Multi-Select */}
            <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/40">
              {isLoadingLibrary ? (
                <div className="p-8 text-center text-xs text-slate-400">جاري تحميل مكتبة التمارين...</div>
              ) : (
                libraryExercises
                  .filter((ex) => {
                    const q = librarySearch.trim().toLowerCase();
                    const matchesQ =
                      !q ||
                      ex.nameAr.toLowerCase().includes(q) ||
                      ex.nameEn.toLowerCase().includes(q) ||
                      (ex.category || "").toLowerCase().includes(q);
                    const matchesR = libraryRegion === "ALL" || ex.region === libraryRegion;
                    return matchesQ && matchesR;
                  })
                  .map((ex) => {
                    const entry = selectedLibraryMap[ex.id];
                    const isChecked = Boolean(entry?.selected);
                    return (
                      <div
                        key={ex.id}
                        className={cn(
                          "p-3 rounded-xl border transition-all space-y-2.5",
                          isChecked ? "bg-emerald-50/70 border-emerald-400" : "bg-white border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleToggleLibraryPick(ex)}
                              className="mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-xs text-slate-900 block">{ex.nameAr}</span>
                              <span className="text-[11px] text-slate-500">{ex.nameEn} • {ex.category}</span>
                            </div>
                          </label>
                          <Badge variant="secondary" className="text-[10px]">{ex.region}</Badge>
                        </div>

                        {isChecked && entry && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/70 text-[11px]">
                            <div>
                              <span className="text-slate-600 block mb-0.5">المجموعات (Sets):</span>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={entry.sets}
                                onChange={(e) =>
                                  setSelectedLibraryMap((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...entry, sets: Number(e.target.value) || 1 },
                                  }))
                                }
                                className="h-7 text-xs bg-white text-center font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-slate-600 block mb-0.5">التكرارات (Reps):</span>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={entry.reps}
                                onChange={(e) =>
                                  setSelectedLibraryMap((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...entry, reps: Number(e.target.value) || 1 },
                                  }))
                                }
                                className="h-7 text-xs bg-white text-center font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-slate-600 block mb-0.5">نسبة الإنجاز (%):</span>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={entry.completionPercentage}
                                onChange={(e) =>
                                  setSelectedLibraryMap((prev) => ({
                                    ...prev,
                                    [ex.id]: {
                                      ...entry,
                                      completionPercentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                    },
                                  }))
                                }
                                className="h-7 text-xs bg-white text-center font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-slate-600 block mb-0.5">ملاحظات:</span>
                              <Input
                                value={entry.notes}
                                onChange={(e) =>
                                  setSelectedLibraryMap((prev) => ({
                                    ...prev,
                                    [ex.id]: { ...entry, notes: e.target.value },
                                  }))
                                }
                                placeholder="ملاحظة..."
                                className="h-7 text-xs bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-700">
              المختار للإضافة: {Object.values(selectedLibraryMap).filter((x) => x.selected).length} تمرين
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddExercisesModalOpen(false)}
                disabled={isSavingExercises}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSelectedExercises}
                disabled={
                  isSavingExercises ||
                  Object.values(selectedLibraryMap).filter((x) => x.selected).length === 0
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSavingExercises ? "جاري الإضافة..." : "حفظ وإضافة التمارين لملف المريض"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* FULL REHAB SESSION ADD / EDIT MODAL */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveSession}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span>{editingSessionId ? "تعديل بيانات الجلسة التأهيلية" : "تسجيل جلسة تأهيلية جديدة في سجل المريض"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                أضف تفاصيل الجلسة، التمارين المنفذة، المجموعات والتكرارات ونسب الإنجاز، وملاحظات الطبيب
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">عنوان الجلسة *</label>
                  <Input
                    required
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="مثال: جلسة تأهيل #1"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ الجلسة *</label>
                  <Input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">المرحلة التأهيلية</label>
                  <Select value={sessionPhase} onValueChange={setSessionPhase}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REHAB_PHASES.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">مدة الجلسة (بالدقائق)</label>
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">مؤشر الألم في الجلسة (VAS 0-10)</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={sessionPainLevel}
                    onChange={(e) => setSessionPainLevel(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Exercises Inside Session */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">
                    تمارين الجلسة ({sessionExercisesForm.length}):
                  </span>
                  {dailyExercises.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleImportScheduleToSession}
                      className="h-7 text-[11px] border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-50"
                    >
                      + استيراد تمارين الجدول الحالي ({dailyExercises.length})
                    </Button>
                  )}
                </div>

                {/* Add from library or custom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    value={sessionExPickerId || undefined}
                    onValueChange={(val) => handleAddLibraryExerciseToSession(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="اختر تمرين من المكتبة لإضافته للجلسة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {libraryExercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.nameAr} ({ex.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1.5">
                    <Input
                      value={sessionCustomExName}
                      onChange={(e) => setSessionCustomExName(e.target.value)}
                      placeholder="أو اكتب اسم تمرين مخصص..."
                      className="h-8 text-xs bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomExerciseToSession}
                      disabled={!sessionCustomExName.trim()}
                      className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white shrink-0"
                    >
                      إضافة
                    </Button>
                  </div>
                </div>

                {sessionExercisesForm.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sessionExercisesForm.map((row, rIdx) => (
                      <div
                        key={row.id || rIdx}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <div className="sm:col-span-4 font-bold text-slate-800 truncate">
                          {row.nameAr}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block">Sets</span>
                          <Input
                            type="number"
                            min={1}
                            value={row.sets}
                            onChange={(e) =>
                              setSessionExercisesForm((prev) =>
                                prev.map((it, i) => (i === rIdx ? { ...it, sets: Number(e.target.value) || 1 } : it))
                              )
                            }
                            className="h-7 text-xs text-center"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block">Reps</span>
                          <Input
                            type="number"
                            min={1}
                            value={row.reps}
                            onChange={(e) =>
                              setSessionExercisesForm((prev) =>
                                prev.map((it, i) => (i === rIdx ? { ...it, reps: Number(e.target.value) || 1 } : it))
                              )
                            }
                            className="h-7 text-xs text-center"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-slate-400 block">إنجاز %</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={row.completionPercentage}
                            onChange={(e) =>
                              setSessionExercisesForm((prev) =>
                                prev.map((it, i) =>
                                  i === rIdx
                                    ? { ...it, completionPercentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }
                                    : it
                                )
                              )
                            }
                            className="h-7 text-xs text-center font-bold text-emerald-700"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-end justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSessionExercisesForm((prev) => prev.filter((_, i) => i !== rIdx))
                            }
                            className="h-7 w-7 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    لم يتم إضافة تمارين لهذه الجلسة بعد.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ملاحظات الجلسة السريرية</label>
                  <Textarea
                    rows={3}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="تطور الأداء، استجابة المفصل، جودة الحركة..."
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تفاصيل إضافية (أجهزة / علاج يدوي / توصيات)</label>
                  <Textarea
                    rows={3}
                    value={sessionExtraDetails}
                    onChange={(e) => setSessionExtraDetails(e.target.value)}
                    placeholder="استخدام كمادات باردة، جلسة BFR، توصيات الجلسة القادمة..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSessionModalOpen(false)}
                disabled={isSavingSession}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingSession}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSavingSession ? "جاري الحفظ..." : editingSessionId ? "حفظ تعديلات الجلسة" : "حفظ الجلسة في السجل"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* ADD MUSCLE GIRTH MEASUREMENT MODAL */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={isAddGirthOpen} onOpenChange={setIsAddGirthOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleAddGirthSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-emerald-600" />
                <span>تسجيل قياس محيط العضلات الجديد</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                أدخل قياسات الطرف المصاب والسليم لحساب الضمور ومؤشر التماثل العضلي (LSI%)
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">المعلم التشريحي (Landmark)</label>
                  <Select value={girthLandmark} onValueChange={setGirthLandmark}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أعلى الرضفة — عضلة الفخذ (Above Patella / Thigh)">أعلى الرضفة — عضلة الفخذ</SelectItem>
                      <SelectItem value="أدنى الرضفة — عضلة السمانة (Below Patella / Calf)">أدنى الرضفة — عضلة السمانة</SelectItem>
                      <SelectItem value="محيط الذراع والعضد (Arm / Biceps)">محيط الذراع والعضد</SelectItem>
                      <SelectItem value="محيط الساعد (Forearm)">محيط الساعد</SelectItem>
                      <SelectItem value="محيط مفصل الكاحل (Ankle / Figure-of-8)">محيط الكاحل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">تاريخ القياس</label>
                  <Input
                    type="date"
                    value={girthDateInput}
                    onChange={(e) => setGirthDateInput(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">القياسات عند المسافات (سم):</span>
                {girthRowsInput.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">المسافة (سم)</span>
                      <Input
                        type="number"
                        value={row.distanceCm}
                        onChange={(e) =>
                          setGirthRowsInput((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, distanceCm: Number(e.target.value) } : r))
                          )
                        }
                        className="h-8 text-xs bg-white text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-semibold block">المصاب (سم) *</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="مثال: 42.5"
                        value={row.injuredCm}
                        onChange={(e) =>
                          setGirthRowsInput((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, injuredCm: e.target.value } : r))
                          )
                        }
                        className="h-8 text-xs bg-white text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">السليم (سم)</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="مثال: 44.0"
                        value={row.healthyCm}
                        onChange={(e) =>
                          setGirthRowsInput((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, healthyCm: e.target.value } : r))
                          )
                        }
                        className="h-8 text-xs bg-white text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddGirthOpen(false)}
                disabled={isSavingGirth}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingGirth}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSavingGirth ? "جاري الحفظ..." : "حفظ القياس"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
