"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileHeart,
  Search,
  AlertTriangle,
  ChevronDown,
  Plus,
  UserPlus,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Target,
  ChevronRight,
  X,
  Sparkles,
  Filter,
  ArrowUpRight,
  Check,
  Calendar,
  Dumbbell,
  TrendingUp,
  Info,
  Layers,
  HeartPulse,
  RefreshCw,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn, truncate, getPhaseLabel } from "@/lib/utils";
import { AdminGuard } from "@/components/auth/AdminGuard";

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export interface ExerciseDetail {
  id?: string;
  nameAr: string;
  nameEn: string;
  category?: string;
  instructions?: string;
}

export interface ProtocolExerciseItem {
  id?: string;
  sets?: number | null;
  reps?: number | null;
  notes?: string | null;
  exercise?: ExerciseDetail;
}

export interface ProtocolPhaseItem {
  id?: string;
  phase: string;
  durationWeeks?: string | null;
  goals?: string | string[] | null;
  criteria?: string | string[] | null;
  orderIndex?: number;
  exercises?: ProtocolExerciseItem[];
}

export interface ProtocolItem {
  id: string;
  nameAr: string;
  nameEn: string;
  overviewAr?: string | null;
  overviewEn?: string | null;
  rehabPrinciples?: string | null;
  redFlags?: string | string[] | null;
  isCustom?: boolean;
  createdAt?: string;
  phases: ProtocolPhaseItem[];
}

export interface PatientItem {
  id: string;
  name: string;
  phone?: string | null;
  injuryType: string;
  injuredSide?: string | null;
  status?: string;
}

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

function parseStringList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [val];
    } catch {
      return val
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

const CATEGORY_TABS = [
  { id: "ALL", labelAr: "الكل", labelEn: "All Protocols" },
  { id: "KNEE", labelAr: "الركبة والأربطة", labelEn: "Knee & Ligaments" },
  { id: "ANKLE", labelAr: "الكاحل والقدم", labelEn: "Ankle & Tendons" },
  { id: "SHOULDER", labelAr: "الكتف والطرف العلوي", labelEn: "Shoulder & Upper" },
  { id: "SPINE_HIP", labelAr: "العمود الفقري والفخذ", labelEn: "Spine & Hamstring" },
  { id: "CUSTOM", labelAr: "البروتوكولات المخصصة", labelEn: "Custom" },
];

const AVAILABLE_PHASES = [
  { value: "ACUTE", labelAr: "المرحلة الحادة (Acute)" },
  { value: "RESTORE_ROM", labelAr: "استعادة المدى الحركي (Restore ROM)" },
  { value: "STRENGTH", labelAr: "تقوية العضلات (Strengthening)" },
  { value: "NEUROMUSCULAR", labelAr: "التحكم العصبي العضلي (Neuromuscular)" },
  { value: "FUNCTIONAL", labelAr: "التمارين الوظيفية (Functional)" },
  { value: "RETURN_TO_SPORT", labelAr: "العودة للرياضة (Return to Sport)" },
];

const RTS_CRITERIA_ITEMS = [
  {
    id: "lsi_strength",
    titleAr: "مؤشر تماثل القوة الطرفية LSI ≥ 90%",
    titleEn: "Limb Symmetry Index on Dynamometer ≥ 90%",
    category: "القوة العضلية",
    desc: "تماثل عزم الدوران الأقصى للعضلات الباسطة والثانية مقارنة بالطرف السليم.",
  },
  {
    id: "hop_tests",
    titleAr: "بطارية اختبارات القفز الوظيفية Hop Tests ≥ 90%",
    titleEn: "Functional Hop Battery (Single, Triple, Crossover Hop)",
    category: "الأداء الوظيفي",
    desc: "اجتياز اختبارات القفز الأفقي الأحادي مع الهبوط والتحكم الثابت بدون عدم اتزان.",
  },
  {
    id: "y_balance",
    titleAr: "التوازن الديناميكي واختبار Y-Balance ≥ 95%",
    titleEn: "Dynamic Balance & Y-Balance Test",
    category: "التحكم العصبي",
    desc: "معدل وصول متماثل في الاتجاهات الأمامية والوسطية الخلفية والجانبية الخلفية.",
  },
  {
    id: "symptom_free",
    titleAr: "غياب الألم والتورم بعد 24 ساعة من التدريب الشاق",
    titleEn: "No Pain (VAS ≤ 1) or Joint Effusion after 24h",
    category: "الاستجابة الحيوية",
    desc: "عدم حدوث انصباب مفصلي أو ألم التهابي تالٍ للمجهود الرياضي المكثف.",
  },
  {
    id: "psych_readiness",
    titleAr: "مقياس الجاهزية النفسية الرياضية ACL-RSI / Tampa ≥ 60",
    titleEn: "Psychological Readiness & Low Kinesiophobia",
    category: "الجاهزية النفسية",
    desc: "غياب الخوف المرضي من تجدد الإصابة والثقة العالية بالطرف المصاب.",
  },
  {
    id: "sport_simulation",
    titleAr: "إتمام محاكاة تدريبية كاملة خاصة باللعبة بدون أي تحفظ",
    titleEn: "Full Sport-Specific Scrimmage & Contact Training",
    category: "محاكاة الرياضة",
    desc: "القدرة على أداء تدريبات الرشاقة، السرعة القصوى، والكبح المفاجئ مع الفريق.",
  },
];

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export default function ProtocolsPage() {
  return (
    <AdminGuard>
      <ProtocolsContent />
    </AdminGuard>
  );
}

function ProtocolsContent() {
  // Data state
  const [protocols, setProtocols] = useState<ProtocolItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");

  // Detail Modal State
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [activePhaseTab, setActivePhaseTab] = useState<string>("");

  // RTS Scorecard State
  const [rtsChecked, setRtsChecked] = useState<Record<string, boolean>>({});

  // Apply to Patient Modal State
  const [isApplyOpen, setIsApplyOpen] = useState<boolean>(false);
  const [protocolToApply, setProtocolToApply] = useState<ProtocolItem | null>(null);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [patientSearch, setPatientSearch] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedApplyPhase, setSelectedApplyPhase] = useState<string>("ACUTE");
  const [applyStartDate, setApplyStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [applyNotes, setApplyNotes] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // Add New Protocol Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newProtocolNameAr, setNewProtocolNameAr] = useState<string>("");
  const [newProtocolNameEn, setNewProtocolNameEn] = useState<string>("");
  const [newProtocolOverviewAr, setNewProtocolOverviewAr] = useState<string>("");
  const [newProtocolOverviewEn, setNewProtocolOverviewEn] = useState<string>("");
  const [newProtocolRehabPrinciples, setNewProtocolRehabPrinciples] = useState<string>("");
  const [newRedFlagsList, setNewRedFlagsList] = useState<string[]>([]);
  const [redFlagInput, setRedFlagInput] = useState<string>("");

  interface NewPhaseForm {
    phase: string;
    durationWeeks: string;
    goals: string[];
    criteria: string[];
    goalInput: string;
    critInput: string;
  }

  const [newPhasesList, setNewPhasesList] = useState<NewPhaseForm[]>([
    {
      phase: "ACUTE",
      durationWeeks: "1-2 أسابيع",
      goals: ["تسكين الألم", "الحفاظ على المدى الحركي"],
      criteria: ["ألم ≤ 3/10"],
      goalInput: "",
      critInput: "",
    },
    {
      phase: "STRENGTH",
      durationWeeks: "4-8 أسابيع",
      goals: ["تقوية العضلات المحيطة", "تحسين التحمل الحركي"],
      criteria: ["LSI ≥ 80%"],
      goalInput: "",
      critInput: "",
    },
  ]);
  const [isSubmittingNewProtocol, setIsSubmittingNewProtocol] = useState<boolean>(false);
  const [addProtocolError, setAddProtocolError] = useState<string | null>(null);

  // Delete Protocol Confirmation State
  const [protocolToDelete, setProtocolToDelete] = useState<ProtocolItem | null>(null);
  const [isDeletingProtocol, setIsDeletingProtocol] = useState<boolean>(false);
  const [deleteProtocolError, setDeleteProtocolError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════

  const fetchProtocols = async (query = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/protocols?search=${encodeURIComponent(query)}`
        : "/api/protocols";
      const res = await fetch(url);
      let serverProtocols: ProtocolItem[] = [];
      if (res.ok) {
        const data = await res.json();
        serverProtocols = Array.isArray(data) ? data : [];
      }

      let localProtocols: ProtocolItem[] = [];
      let deletedIds: string[] = [];
      if (typeof window !== "undefined") {
        try {
          localProtocols = JSON.parse(localStorage.getItem("revive_custom_protocols") || "[]");
        } catch {}
        try {
          deletedIds = JSON.parse(localStorage.getItem("revive_deleted_protocols") || "[]");
        } catch {}
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        localProtocols = localProtocols.filter(
          (p) =>
            p.nameAr.toLowerCase().includes(q) ||
            p.nameEn.toLowerCase().includes(q) ||
            p.overviewAr?.toLowerCase().includes(q)
        );
      }

      const map = new Map<string, ProtocolItem>();
      [...localProtocols, ...serverProtocols].forEach((p) => {
        if (p && p.id && !deletedIds.includes(p.id)) map.set(p.id, p);
      });

      setProtocols(Array.from(map.values()));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء تحميل البيانات";
      console.error("Fetch protocols error:", err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteProtocol = async () => {
    if (!protocolToDelete) return;
    setIsDeletingProtocol(true);
    setDeleteProtocolError(null);
    try {
      const res = await fetch(`/api/protocols?id=${encodeURIComponent(protocolToDelete.id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("فشل حذف البروتوكول من الخادم");
      }

      if (typeof window !== "undefined") {
        try {
          const localProtocols = JSON.parse(localStorage.getItem("revive_custom_protocols") || "[]");
          const filtered = localProtocols.filter((p: any) => p.id !== protocolToDelete.id);
          localStorage.setItem("revive_custom_protocols", JSON.stringify(filtered));

          const deletedIds = JSON.parse(localStorage.getItem("revive_deleted_protocols") || "[]");
          if (!deletedIds.includes(protocolToDelete.id)) {
            deletedIds.push(protocolToDelete.id);
            localStorage.setItem("revive_deleted_protocols", JSON.stringify(deletedIds));
          }
        } catch {}
      }

      setProtocols((prev) => prev.filter((p) => p.id !== protocolToDelete.id));
      if (selectedProtocol?.id === protocolToDelete.id) {
        setIsDetailOpen(false);
        setSelectedProtocol(null);
      }
      setProtocolToDelete(null);
    } catch (err: unknown) {
      console.error("Delete protocol error:", err);
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حذف البروتوكول";
      setDeleteProtocolError(msg);
    } finally {
      setIsDeletingProtocol(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  // Fetch Patients for Apply Dialog
  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // ═══════════════════════════════════════════════
  // FILTERING LOGIC
  // ═══════════════════════════════════════════════

  const filteredProtocols = useMemo(() => {
    return protocols.filter((proto) => {
      // Category tab filter
      if (selectedCategoryTab === "CUSTOM") {
        if (!proto.isCustom) return false;
      } else if (selectedCategoryTab === "KNEE") {
        const text = `${proto.nameAr} ${proto.nameEn} ${proto.overviewAr || ""}`.toLowerCase();
        if (
          !text.includes("patellar") &&
          !text.includes("pfps") &&
          !text.includes("acl") &&
          !text.includes("رضفة") &&
          !text.includes("صليبي") &&
          !text.includes("ركبة")
        ) {
          return false;
        }
      } else if (selectedCategoryTab === "ANKLE") {
        const text = `${proto.nameAr} ${proto.nameEn} ${proto.overviewAr || ""}`.toLowerCase();
        if (
          !text.includes("achilles") &&
          !text.includes("ankle") &&
          !text.includes("أخيل") &&
          !text.includes("عرقوب") &&
          !text.includes("كاحل")
        ) {
          return false;
        }
      } else if (selectedCategoryTab === "SHOULDER") {
        const text = `${proto.nameAr} ${proto.nameEn} ${proto.overviewAr || ""}`.toLowerCase();
        if (
          !text.includes("rotator") &&
          !text.includes("tennis") &&
          !text.includes("كتف") &&
          !text.includes("مرفق") &&
          !text.includes("كفة")
        ) {
          return false;
        }
      } else if (selectedCategoryTab === "SPINE_HIP") {
        const text = `${proto.nameAr} ${proto.nameEn} ${proto.overviewAr || ""}`.toLowerCase();
        if (
          !text.includes("hamstring") &&
          !text.includes("sciatica") &&
          !text.includes("itbs") &&
          !text.includes("خلفية") &&
          !text.includes("نسا") &&
          !text.includes("ظنبوبي") &&
          !text.includes("جذع")
        ) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAr = proto.nameAr?.toLowerCase().includes(q);
        const matchesEn = proto.nameEn?.toLowerCase().includes(q);
        const matchesOverviewAr = proto.overviewAr?.toLowerCase().includes(q);
        const matchesOverviewEn = proto.overviewEn?.toLowerCase().includes(q);
        return matchesAr || matchesEn || matchesOverviewAr || matchesOverviewEn;
      }

      return true;
    });
  }, [protocols, selectedCategoryTab, searchQuery]);

  // ═══════════════════════════════════════════════
  // PROTOCOL DETAIL HANDLERS
  // ═══════════════════════════════════════════════

  const handleOpenDetail = (proto: ProtocolItem) => {
    setSelectedProtocol(proto);
    if (proto.phases && proto.phases.length > 0) {
      setActivePhaseTab(proto.phases[0].id || proto.phases[0].phase || "phase-0");
    } else {
      setActivePhaseTab("");
    }
    // Reset RTS checklist for this protocol
    setRtsChecked({
      lsi_strength: true,
      y_balance: true,
      symptom_free: true,
    });
    setIsDetailOpen(true);
  };

  const handleOpenApplyModal = (proto: ProtocolItem) => {
    setProtocolToApply(proto);
    setSelectedApplyPhase(proto.phases?.[0]?.phase || "ACUTE");
    setApplySuccessMsg(null);
    setIsApplyOpen(true);
    fetchPatients();
  };

  // RTS Score calculation
  const rtsScorePercentage = useMemo(() => {
    const total = RTS_CRITERIA_ITEMS.length;
    const passed = RTS_CRITERIA_ITEMS.filter((item) => rtsChecked[item.id]).length;
    return Math.round((passed / total) * 100);
  }, [rtsChecked]);

  // ═══════════════════════════════════════════════
  // APPLY PROTOCOL SUBMISSION
  // ═══════════════════════════════════════════════

  const handleApplyToPatientSubmit = async () => {
    if (!selectedPatientId || !protocolToApply) return;
    setIsApplying(true);
    try {
      const res = await fetch("/api/protocols/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          protocolId: protocolToApply.id,
          protocolName: `${protocolToApply.nameAr} (${protocolToApply.nameEn})`,
          phase: selectedApplyPhase,
          startDate: applyStartDate,
          notes: applyNotes,
        }),
      });

      if (!res.ok) {
        throw new Error("فشل تطبيق البروتوكول");
      }

      const assignedPatient = patients.find((p) => p.id === selectedPatientId);
      setApplySuccessMsg(
        `تم تطبيق بروتوكول "${protocolToApply.nameAr}" بنجاح على المريض (${
          assignedPatient?.name || "المريض المحدد"
        }) في مرحلة ${getPhaseLabel(selectedApplyPhase).ar}.`
      );
    } catch (err: unknown) {
      console.error("Apply error:", err);
      const msg = err instanceof Error ? err.message : "تعذر حفظ التعيين للمريض";
      alert(msg);
    } finally {
      setIsApplying(false);
    }
  };

  // ═══════════════════════════════════════════════
  // ADD NEW PROTOCOL HANDLERS
  // ═══════════════════════════════════════════════

  const handleAddRedFlag = () => {
    if (!redFlagInput.trim()) return;
    setNewRedFlagsList([...newRedFlagsList, redFlagInput.trim()]);
    setRedFlagInput("");
  };

  const handleRemoveRedFlag = (index: number) => {
    setNewRedFlagsList(newRedFlagsList.filter((_, i) => i !== index));
  };

  const handleAddPhase = () => {
    setNewPhasesList([
      ...newPhasesList,
      {
        phase: "FUNCTIONAL",
        durationWeeks: "2-4 أسابيع",
        goals: [],
        criteria: [],
        goalInput: "",
        critInput: "",
      },
    ]);
  };

  const handleRemovePhase = (index: number) => {
    if (newPhasesList.length <= 1) return;
    setNewPhasesList(newPhasesList.filter((_, i) => i !== index));
  };

  const handlePhaseFieldChange = (
    index: number,
    field: keyof NewPhaseForm,
    value: string
  ) => {
    const updated = [...newPhasesList];
    (updated[index] as any)[field] = value;
    setNewPhasesList(updated);
  };

  const handleAddGoalToPhase = (phaseIndex: number) => {
    const p = newPhasesList[phaseIndex];
    if (!p.goalInput.trim()) return;
    const updated = [...newPhasesList];
    updated[phaseIndex].goals.push(p.goalInput.trim());
    updated[phaseIndex].goalInput = "";
    setNewPhasesList(updated);
  };

  const handleRemoveGoalFromPhase = (phaseIndex: number, goalIndex: number) => {
    const updated = [...newPhasesList];
    updated[phaseIndex].goals.splice(goalIndex, 1);
    setNewPhasesList(updated);
  };

  const handleAddCritToPhase = (phaseIndex: number) => {
    const p = newPhasesList[phaseIndex];
    if (!p.critInput.trim()) return;
    const updated = [...newPhasesList];
    updated[phaseIndex].criteria.push(p.critInput.trim());
    updated[phaseIndex].critInput = "";
    setNewPhasesList(updated);
  };

  const handleRemoveCritFromPhase = (phaseIndex: number, critIndex: number) => {
    const updated = [...newPhasesList];
    updated[phaseIndex].criteria.splice(critIndex, 1);
    setNewPhasesList(updated);
  };

  const handleCreateProtocolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProtocolNameAr.trim() || !newProtocolNameEn.trim()) {
      setAddProtocolError("يرجى إدخال الاسم بالعربية والاسم بالإنجليزية");
      return;
    }

    setIsSubmittingNewProtocol(true);
    setAddProtocolError(null);

    try {
      const payload = {
        nameAr: newProtocolNameAr.trim(),
        nameEn: newProtocolNameEn.trim(),
        overviewAr: newProtocolOverviewAr.trim() || null,
        overviewEn: newProtocolOverviewEn.trim() || null,
        rehabPrinciples: newProtocolRehabPrinciples.trim() || null,
        redFlags: newRedFlagsList,
        phases: newPhasesList.map((p) => ({
          phase: p.phase,
          durationWeeks: p.durationWeeks.trim(),
          goals: p.goals,
          criteria: p.criteria,
        })),
      };

      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("فشل إنشاء البروتوكول عبر الخادم");
      }

      const createdProto = await res.json().catch(() => null);

      if (typeof window !== "undefined") {
        try {
          const localProtocols = JSON.parse(localStorage.getItem("revive_custom_protocols") || "[]");
          const protoToStore = createdProto || {
            id: `custom-proto-${Date.now()}`,
            ...payload,
            isCustom: true,
            createdAt: new Date().toISOString(),
          };
          const updated = [protoToStore, ...localProtocols.filter((p: any) => p.id !== protoToStore.id)];
          localStorage.setItem("revive_custom_protocols", JSON.stringify(updated));
        } catch {}
      }

      // Reset form & close dialog
      setIsAddOpen(false);
      setNewProtocolNameAr("");
      setNewProtocolNameEn("");
      setNewProtocolOverviewAr("");
      setNewProtocolOverviewEn("");
      setNewProtocolRehabPrinciples("");
      setNewRedFlagsList([]);
      setRedFlagInput("");

      // Refresh protocols list
      await fetchProtocols();
    } catch (err: unknown) {
      console.error("Create protocol error:", err);
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ البروتوكول";
      setAddProtocolError(msg);
    } finally {
      setIsSubmittingNewProtocol(false);
    }
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-4" dir="rtl">
      {/* Top Banner & Header */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Top Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
          <HeartPulse className="w-4 h-4 text-emerald-600" />
          <span>منظومة التأهيل الحركي السريري</span>
          <span>/</span>
          <span className="text-emerald-700 font-semibold">بروتوكولات الإصابات</span>
        </div>

        {/* 1. Header Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden mb-8">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-64 h-64 rounded-full bg-navy-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <FileHeart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    الإصابات والبروتوكولات — Injuries & Protocols
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-0.5">
                    دليل البروتوكولات العلاجية المبنية على الأدلة السريرية ومراحل التأهيل الحركي
                    المتدرج
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 gap-1.5 py-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>10 بروتوكولات قياسية متكاملة</span>
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 gap-1.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>تأهيل متدرج قائم على المعايير السريرية</span>
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 gap-1.5 py-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>دليل علامات الخطورة الحمراء (Red Flags)</span>
                </Badge>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProtocols(searchQuery)}
                disabled={isLoading}
                className="gap-2 border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                <span className="hidden sm:inline">تحديث</span>
              </Button>

              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بروتوكول جديد</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="بحث بالاسم العربي، الاسم الإنجليزي، أو طبيعة الإصابة (مثال: Patellar, أخيل, رباط صليبي)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Clear or Filter counter */}
            <div className="flex items-center gap-2 justify-between md:justify-end text-xs text-slate-500 px-1">
              <span>
                النتائج المعروضة:{" "}
                <strong className="text-slate-800 font-bold">
                  {filteredProtocols.length}
                </strong>{" "}
                من أصل {protocols.length}
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ms-1" />
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={cn(
                    "whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600"
                  )}
                >
                  <span>{tab.labelAr}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    {tab.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Protocols Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-6 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-16 bg-slate-50 rounded" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 bg-slate-100 rounded w-24" />
                  <div className="h-6 bg-slate-100 rounded w-28" />
                </div>
                <div className="h-10 bg-slate-100 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-900">تعذر تحميل البروتوكولات</h3>
            <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchProtocols()}
              className="mt-2 border-red-300 text-red-800 hover:bg-red-100"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : filteredProtocols.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              لم يتم العثور على بروتوكولات مطابقة للبحث
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              جرب تغيير كلمة البحث أو اختيار تصنيف آخر لعرض جميع البروتوكولات المعتمدة.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryTab("ALL");
              }}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              عرض كافة البروتوكولات
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProtocols.map((proto) => {
              const redFlags = parseStringList(proto.redFlags);
              const phasesCount = proto.phases?.length || 0;

              return (
                <Card
                  key={proto.id}
                  className="flex flex-col justify-between hover:shadow-lg transition-all duration-200 border-slate-200/90 group bg-white hover:border-emerald-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px] font-medium",
                          proto.isCustom
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        )}
                      >
                        {proto.isCustom ? "بروتوكول مخصص" : "بروتوكول قياسي معتمد"}
                      </Badge>

                      {/* Red Flags Indicator Badge */}
                      {redFlags.length > 0 && (
                        <Badge
                          variant="destructive"
                          className="bg-red-50 text-red-700 border-red-200 gap-1 text-[11px]"
                        >
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>{redFlags.length} علامات تحذير</span>
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      {proto.nameAr}
                    </CardTitle>

                    <CardDescription className="text-xs font-semibold text-slate-500 font-mono tracking-wide">
                      {proto.nameEn}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm text-slate-600 flex-1">
                    {/* Overview Truncated */}
                    <p className="line-clamp-3 leading-relaxed text-slate-600 text-xs sm:text-sm">
                      {proto.overviewAr || proto.overviewEn || "لا يوجد وصف مختصر متاح حالياً."}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{phasesCount} مراحل تأهيلية</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Activity className="w-3.5 h-3.5 text-navy-600" />
                        <span>جاهزية RTS</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenDetail(proto)}
                      className="flex-1 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold h-10 gap-2 transition-all duration-200"
                    >
                      <FileHeart className="w-4 h-4" />
                      <span>عرض البروتوكول</span>
                      <ChevronRight className="w-4 h-4 ms-auto text-slate-400 group-hover:text-white" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenApplyModal(proto)}
                      title="تطبيق على مريض"
                      className="h-10 w-10 shrink-0 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProtocolToDelete(proto);
                      }}
                      title="حذف البروتوكول (Admin)"
                      className="h-10 w-10 shrink-0 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          4. PROTOCOL DETAIL VIEW DIALOG
      ═══════════════════════════════════════════════ */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          {selectedProtocol && (
            <div className="space-y-6" dir="rtl">
              {/* Detail Header */}
              <DialogHeader className="text-start border-b border-slate-100 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                        {selectedProtocol.isCustom ? "بروتوكول سريري مخصص" : "بروتوكول معتمد — Evidence-Based"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {selectedProtocol.phases?.length || 0} مراحل متدرجة
                      </span>
                    </div>

                    <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                      {selectedProtocol.nameAr}
                    </DialogTitle>
                    <DialogDescription className="text-sm font-semibold text-slate-500 font-mono mt-0.5">
                      {selectedProtocol.nameEn}
                    </DialogDescription>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setProtocolToDelete(selectedProtocol)}
                      title="حذف البروتوكول (Admin)"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-10 gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenApplyModal(selectedProtocol);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>تطبيق على مريض</span>
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Section 1: Problem Overview */}
              <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Info className="w-5 h-5 text-emerald-600" />
                  <h4>نظرة عامة على الإصابة (Problem Overview)</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedProtocol.overviewAr || "لا توجد نظرة عامة متوفرة بالعربية."}
                </p>
                {selectedProtocol.overviewEn && (
                  <p className="text-xs text-slate-500 font-mono pt-1 italic border-t border-slate-200/60">
                    {selectedProtocol.overviewEn}
                  </p>
                )}
              </div>

              {/* Section 2: Rehab Principles */}
              {selectedProtocol.rehabPrinciples && (
                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                    <Shield className="w-5 h-5 text-emerald-700" />
                    <h4>مبادئ التأهيل والعلاج الطبيعي (Rehab Principles)</h4>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {selectedProtocol.rehabPrinciples}
                  </p>
                </div>
              )}

              {/* Section 3: Red Flags for Physician Referral (Displayed as red alert cards) */}
              {(() => {
                const redFlags = parseStringList(selectedProtocol.redFlags);
                if (redFlags.length === 0) return null;

                return (
                  <div className="bg-red-50/90 rounded-xl p-5 border-2 border-red-200 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2.5 text-red-900 font-extrabold text-base">
                      <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4>علامات تحذيرية للإحالة الطبية العاجلة (Red Flags for Referral)</h4>
                        <p className="text-xs text-red-700 font-normal mt-0.5">
                          يجب إيقاف خطة التأهيل فوراً وإحالة المريض لطبيب العظام في حال ظهور أي من
                          المؤشرات التالية:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {redFlags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 border border-red-200 text-xs font-semibold text-red-900 flex items-start gap-2 shadow-2xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Section 4: Multi-phase Exercise Progression */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-lg font-bold text-slate-900">
                      التدرج العلاجي والمراحل الحركية (Multi-Phase Progression)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedProtocol.phases?.length || 0} مراحل متدرجة
                  </Badge>
                </div>

                {selectedProtocol.phases && selectedProtocol.phases.length > 0 ? (
                  <Tabs
                    value={activePhaseTab || selectedProtocol.phases[0].id || selectedProtocol.phases[0].phase}
                    onValueChange={setActivePhaseTab}
                    className="w-full"
                  >
                    {/* Phase Tabs List */}
                    <TabsList className="w-full flex flex-wrap h-auto bg-slate-100 p-1.5 rounded-xl gap-1">
                      {selectedProtocol.phases.map((ph, idx) => {
                        const phaseId = ph.id || ph.phase || `phase-${idx}`;
                        const label = getPhaseLabel(ph.phase);
                        return (
                          <TabsTrigger
                            key={phaseId}
                            value={phaseId}
                            className="flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                          >
                            <span>المرحلة {idx + 1}: {label.ar}</span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {/* Phase Tab Contents */}
                    {selectedProtocol.phases.map((ph, idx) => {
                      const phaseId = ph.id || ph.phase || `phase-${idx}`;
                      const label = getPhaseLabel(ph.phase);
                      const goals = parseStringList(ph.goals);
                      const criteria = parseStringList(ph.criteria);
                      const exercises = ph.exercises || [];

                      return (
                        <TabsContent key={phaseId} value={phaseId} className="space-y-5 pt-3">
                          {/* Phase Header Card */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <h5 className="font-bold text-slate-900 text-base">
                                  {label.ar} — {label.en}
                                </h5>
                              </div>
                              <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                                معرف المرحلة: {ph.phase}
                              </span>
                            </div>

                            {ph.durationWeeks && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-semibold self-start sm:self-auto gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>المدة التقديرية: {ph.durationWeeks}</span>
                              </Badge>
                            )}
                          </div>

                          {/* Goals & Advancement Criteria 2-column Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Goals */}
                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
                              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Target className="w-4 h-4 text-emerald-600" />
                                <h6>أهداف المرحلة (Clinical Goals)</h6>
                              </div>
                              {goals.length > 0 ? (
                                <ul className="space-y-2 text-xs text-slate-700">
                                  {goals.map((g, gIdx) => (
                                    <li key={gIdx} className="flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{g}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-400">لا توجد أهداف مسجلة لهذه المرحلة.</p>
                              )}
                            </div>

                            {/* Advancement Criteria */}
                            <div className="bg-white rounded-xl p-4 border border-amber-200/80 bg-amber-50/20 shadow-2xs space-y-2.5">
                              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                                <h6>معايير الانتقال للمرحلة التالية (Criteria to Advance)</h6>
                              </div>
                              {criteria.length > 0 ? (
                                <ul className="space-y-2 text-xs text-slate-800">
                                  {criteria.map((c, cIdx) => (
                                    <li key={cIdx} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                      <span className="leading-relaxed">{c}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-400">
                                  لا توجد معايير انتقال محددة لهذه المرحلة.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Exercise List */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                              <Dumbbell className="w-4 h-4 text-emerald-600" />
                              <h6>التمارين الموصى بها في هذه المرحلة (Phase Exercises)</h6>
                            </div>

                            {exercises.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2.5">
                                {exercises.map((item, exIdx) => {
                                  const ex = item.exercise;
                                  return (
                                    <div
                                      key={item.id || exIdx}
                                      className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-emerald-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h6 className="font-bold text-slate-900 text-sm">
                                            {ex?.nameAr || `تمرين ${exIdx + 1}`}
                                          </h6>
                                          {ex?.nameEn && (
                                            <span className="text-xs text-slate-500 font-mono">
                                              ({ex.nameEn})
                                            </span>
                                          )}
                                          {ex?.category && (
                                            <Badge variant="secondary" className="text-[10px] py-0 px-2">
                                              {ex.category}
                                            </Badge>
                                          )}
                                        </div>

                                        {ex?.instructions && (
                                          <p className="text-xs text-slate-600 line-clamp-2">
                                            {ex.instructions}
                                          </p>
                                        )}

                                        {item.notes && (
                                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block font-medium">
                                            ملاحظات التنفيذ: {item.notes}
                                          </div>
                                        )}
                                      </div>

                                      {/* Sets & Reps */}
                                      <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <span>
                                          {item.sets ? `${item.sets} مجموعات` : "3 مجموعات"}
                                        </span>
                                        <span>×</span>
                                        <span>
                                          {item.reps ? `${item.reps} تكرار` : "10-12 تكرار"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-500 border border-slate-200">
                                لم يتم ربط تمارين محددة مسبقاً لهذه المرحلة، يمكن للأخصائي اختيار التمارين من مكتبة التمارين.
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                ) : (
                  <p className="text-sm text-slate-500">لا توجد مراحل مسجلة لهذا البروتوكول.</p>
                )}
              </div>

              {/* Section 5: Return-to-Sport Readiness Scorecard */}
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 space-y-4 shadow-sm pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        بطاقة تقييم الجاهزية للعودة للرياضة (RTS Readiness Scorecard)
                      </h4>
                      <p className="text-xs text-slate-500">
                        معايير فحص موضوعية لتحديد جاهزية الرياضي للعودة للمنافسات التنافسية
                      </p>
                    </div>
                  </div>

                  {/* Readiness Score Progress Meter */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-end">
                      <span className="text-xs text-slate-500 block">نسبة الجاهزية</span>
                      <span
                        className={cn(
                          "text-xl font-extrabold font-mono",
                          rtsScorePercentage >= 85
                            ? "text-emerald-600"
                            : rtsScorePercentage >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        )}
                      >
                        {rtsScorePercentage}%
                      </span>
                    </div>

                    <Badge
                      className={cn(
                        "text-xs px-3 py-1 font-bold",
                        rtsScorePercentage >= 85
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : rtsScorePercentage >= 60
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {rtsScorePercentage >= 85
                        ? "جاهز للمنافسة (Clearance)"
                        : rtsScorePercentage >= 60
                        ? "تأهيل متقدم مشروط"
                        : "غير مؤهل — خطر مرتفع"}
                    </Badge>
                  </div>
                </div>

                {/* Scorecard Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {RTS_CRITERIA_ITEMS.map((item) => {
                    const isChecked = !!rtsChecked[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setRtsChecked({
                            ...rtsChecked,
                            [item.id]: !isChecked,
                          })
                        }
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                          isChecked
                            ? "bg-emerald-50/50 border-emerald-300 shadow-2xs"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors",
                            isChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h6 className="text-xs font-bold text-slate-900 leading-snug">
                              {item.titleAr}
                            </h6>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {item.titleEn}
                          </span>
                          <p className="text-[11px] text-slate-600 pt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Footer */}
              <DialogFooter className="pt-4 border-t border-slate-100 sm:justify-between flex-row items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="border-slate-300"
                >
                  إغلاق
                </Button>

                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenApplyModal(selectedProtocol);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>تطبيق هذا البروتوكول على مريض</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          5. APPLY TO PATIENT DIALOG
      ═══════════════════════════════════════════════ */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xl" dir="rtl">
          <DialogHeader className="text-start border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <UserPlus className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                تعيين خطة تأهيلية لحالة سريرية
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              تطبيق البروتوكول على مريض
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {protocolToApply
                ? `تطبيق بروتوكول: "${protocolToApply.nameAr}" (${protocolToApply.nameEn})`
                : "حدد المريض والمرحلة الابتدائية لبدء الخطة."}
            </DialogDescription>
          </DialogHeader>

          {applySuccessMsg ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">تم التعيين بنجاح!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">{applySuccessMsg}</p>
              <Button
                onClick={() => setIsApplyOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                تم
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  اختيار المريض (Select Patient) <span className="text-red-500">*</span>
                </label>

                {/* Patient Search */}
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="ابحث باسم المريض أو نوع الإصابة..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="ps-9 h-9 text-xs"
                  />
                </div>

                {isLoadingPatients ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    جاري تحميل قائمة المرضى...
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {patients
                      .filter(
                        (p) =>
                          !patientSearch ||
                          p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                          p.injuryType.toLowerCase().includes(patientSearch.toLowerCase())
                      )
                      .map((p) => {
                        const isSelected = selectedPatientId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPatientId(p.id)}
                            className={cn(
                              "p-3 text-xs flex items-center justify-between cursor-pointer transition-colors",
                              isSelected
                                ? "bg-emerald-50 text-emerald-900 font-bold"
                                : "hover:bg-slate-100 text-slate-700"
                            )}
                          >
                            <div className="space-y-0.5">
                              <span className="block font-semibold">{p.name}</span>
                              <span className="text-[11px] text-slate-500 block">
                                {p.injuryType} — {p.injuredSide === "RIGHT" ? "الطرف الأيمن" : p.injuredSide === "LEFT" ? "الطرف الأيسر" : "ثنائي"}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    {patients.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        لا توجد حالات مسجلة حالياً، سيتم إنشاء التعيين بشكل افتراضي.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Starting Phase Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  مرحلة البدء في البروتوكول (Starting Rehab Phase)
                </label>
                <select
                  value={selectedApplyPhase}
                  onChange={(e) => setSelectedApplyPhase(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {AVAILABLE_PHASES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  تاريخ بدء الخطة التأهيلية (Start Date)
                </label>
                <Input
                  type="date"
                  value={applyStartDate}
                  onChange={(e) => setApplyStartDate(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ملاحظات وتعديلات سريرية خاصة بالمريض (Optional Notes)
                </label>
                <Textarea
                  placeholder="مثال: يراعى تخفيف زاوية الثني بسبب وجود ألم رضفي خفيف في الأسبوع الأول..."
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  className="text-xs h-20"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsApplyOpen(false)}
                  disabled={isApplying}
                  className="border-slate-300"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleApplyToPatientSubmit}
                  disabled={isApplying || !selectedPatientId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التعيين...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تأكيد تطبيق البروتوكول</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          6. ADD NEW PROTOCOL DIALOG
      ═══════════════════════════════════════════════ */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl" dir="rtl">
          <DialogHeader className="text-start border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Plus className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                إضافة بروتوكول تأهيلي سريري
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold text-slate-900">
              إضافة بروتوكول علاجي جديد
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              قم بإدخال بيانات البروتوكول ومراحله السريرية وعلامات الخطورة الحمراء.
            </DialogDescription>
          </DialogHeader>

          {addProtocolError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{addProtocolError}</span>
            </div>
          )}

          <form onSubmit={handleCreateProtocolSubmit} className="space-y-6 pt-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  اسم البروتوكول بالعربية <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="مثال: متلازمة اصطدام مفصل الورك"
                  value={newProtocolNameAr}
                  onChange={(e) => setNewProtocolNameAr(e.target.value)}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  الاسم الطبي بالإنجليزية <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Femoroacetabular Impingement (FAI)"
                  value={newProtocolNameEn}
                  onChange={(e) => setNewProtocolNameEn(e.target.value)}
                  className="text-xs h-10 font-mono"
                />
              </div>
            </div>

            {/* Overviews */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  نظرة عامة على المشكلة والإصابة (بالعربية)
                </label>
                <Textarea
                  placeholder="وصف الإصابة ومسبباتها البيوميكانيكية والأعراض الشائعة..."
                  value={newProtocolOverviewAr}
                  onChange={(e) => setNewProtocolOverviewAr(e.target.value)}
                  className="text-xs h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Overview in English (Optional)
                </label>
                <Input
                  placeholder="Clinical brief and biomechanical background in English..."
                  value={newProtocolOverviewEn}
                  onChange={(e) => setNewProtocolOverviewEn(e.target.value)}
                  className="text-xs h-10 font-mono"
                />
              </div>
            </div>

            {/* Rehab Principles */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                مبادئ التأهيل والعلاج الطبيعي (Rehabilitation Principles)
              </label>
              <Textarea
                placeholder="القواعد الحركية، استراتيجيات التحميل المتدرج، وتفادي الإجهاد المفرط..."
                value={newProtocolRehabPrinciples}
                onChange={(e) => setNewProtocolRehabPrinciples(e.target.value)}
                className="text-xs h-20"
              />
            </div>

            {/* Red Flags Dynamic List */}
            <div className="bg-red-50/60 rounded-xl p-4 border border-red-200 space-y-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>علامات الخطورة الحمراء للإحالة الطبية (Red Flags)</span>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="أدخل علامة خطورة حمراء (مثال: ألم غير ميكانيكي مستمر ليلاً، أو خدر حاد)..."
                  value={redFlagInput}
                  onChange={(e) => setRedFlagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRedFlag();
                    }
                  }}
                  className="text-xs h-9 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRedFlag}
                  className="shrink-0 h-9 text-xs border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Plus className="w-3.5 h-3.5 me-1" />
                  إضافة
                </Button>
              </div>

              {/* Red Flags List */}
              {newRedFlagsList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {newRedFlagsList.map((rf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-900"
                    >
                      <span className="leading-snug">{rf}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRedFlag(idx)}
                        className="text-red-400 hover:text-red-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phases Dynamic List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    مراحل التأهيل المتدرجة ({newPhasesList.length} مراحل)
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddPhase}
                  className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مرحلة أخرى</span>
                </Button>
              </div>

              <div className="space-y-4">
                {newPhasesList.map((phaseItem, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {pIdx + 1}
                      </span>

                      {newPhasesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhase(pIdx)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>حذف المرحلة</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Phase Type */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          نوع المرحلة
                        </label>
                        <select
                          value={phaseItem.phase}
                          onChange={(e) =>
                            handlePhaseFieldChange(pIdx, "phase", e.target.value)
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          {AVAILABLE_PHASES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.labelAr}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          المدة التقديرية (مثال: 2-4 أسابيع)
                        </label>
                        <Input
                          placeholder="المدة التقديرية..."
                          value={phaseItem.durationWeeks}
                          onChange={(e) =>
                            handlePhaseFieldChange(pIdx, "durationWeeks", e.target.value)
                          }
                          className="text-xs h-9 bg-white"
                        />
                      </div>
                    </div>

                    {/* Goals for this phase */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        أهداف المرحلة (Clinical Goals)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="أدخل هدفاً للمرحلة ثم اضغط إضافة..."
                          value={phaseItem.goalInput}
                          onChange={(e) =>
                            handlePhaseFieldChange(pIdx, "goalInput", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddGoalToPhase(pIdx);
                            }
                          }}
                          className="text-xs h-8 bg-white"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddGoalToPhase(pIdx)}
                          className="h-8 text-xs shrink-0"
                        >
                          إضافة هدف
                        </Button>
                      </div>

                      {phaseItem.goals.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {phaseItem.goals.map((g, gIdx) => (
                            <Badge
                              key={gIdx}
                              variant="secondary"
                              className="bg-white border-slate-200 text-[11px] py-0.5 pe-1 gap-1"
                            >
                              <span>{g}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGoalFromPhase(pIdx, gIdx)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Criteria for this phase */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        معايير الانتقال للمرحلة التالية (Criteria to Advance)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="أدخل شرط أو معيار انتقال ثم اضغط إضافة..."
                          value={phaseItem.critInput}
                          onChange={(e) =>
                            handlePhaseFieldChange(pIdx, "critInput", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCritToPhase(pIdx);
                            }
                          }}
                          className="text-xs h-8 bg-white"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddCritToPhase(pIdx)}
                          className="h-8 text-xs shrink-0"
                        >
                          إضافة معيار
                        </Button>
                      </div>

                      {phaseItem.criteria.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {phaseItem.criteria.map((c, cIdx) => (
                            <Badge
                              key={cIdx}
                              variant="outline"
                              className="bg-amber-50/70 text-amber-800 border-amber-200 text-[11px] py-0.5 pe-1 gap-1"
                            >
                              <span>{c}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCritFromPhase(pIdx, cIdx)}
                                className="text-amber-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Protocol Dialog Footer */}
            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmittingNewProtocol}
                className="border-slate-300"
              >
                إلغاء
              </Button>

              <Button
                type="submit"
                disabled={isSubmittingNewProtocol}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {isSubmittingNewProtocol ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>حفظ ونشر البروتوكول</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════
          6. DELETE PROTOCOL CONFIRMATION DIALOG
      ═══════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(protocolToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setProtocolToDelete(null);
            setDeleteProtocolError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              تأكيد حذف البروتوكول التأهيلي
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-2 text-sm leading-relaxed">
              هل أنت متأكد من رغبتك في حذف بروتوكول{" "}
              <strong className="text-slate-900 font-bold">
                "{protocolToDelete?.nameAr} ({protocolToDelete?.nameEn})"
              </strong>
              ؟
              <span className="block text-xs text-rose-500 mt-2 font-medium">
                تنبيه: سيتم حذف كافة المراحل والمعايير العلاجية والتمارين المقترحة المسجلة في هذا البروتوكول نهائياً.
              </span>
            </DialogDescription>
          </DialogHeader>

          {deleteProtocolError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {deleteProtocolError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProtocolToDelete(null);
                setDeleteProtocolError(null);
              }}
              disabled={isDeletingProtocol}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteProtocol}
              disabled={isDeletingProtocol}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2"
            >
              {isDeletingProtocol ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الحذف...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف النهائي</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
