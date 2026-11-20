"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ADMIN_EMAIL } from "@/lib/auth-context";
import {
  User,
  Activity,
  Ruler,
  Save,
  Plus,
  Minus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

type InjuredSideType = "RIGHT" | "LEFT" | "BILATERAL";

type RehabPhaseType =
  | "ACUTE"
  | "RESTORE_ROM"
  | "STRENGTH"
  | "NEUROMUSCULAR"
  | "FUNCTIONAL"
  | "RETURN_TO_SPORT";

interface PatientFormState {
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  injuryType: string;
  injuryDate: string;
  surgeryDate: string;
  rehabStartDate: string;
  injuredSide: InjuredSideType;
  mechanismOfInjury: string;
  notes: string;
}

interface ROMEntryState {
  id: string;
  joint: string;
  movement: string;
  injuredAngle: string;
  healthyAngle: string;
  notes: string;
}

interface GirthMeasurementState {
  distanceCm: number;
  injuredCm: string;
  healthyCm: string;
}

interface GirthEvaluationState {
  id: string;
  landmark: string;
  date: string;
  measurements: GirthMeasurementState[];
}

interface RehabProgramState {
  phase: RehabPhaseType;
  notes: string;
}

// ── Medical Constants ──────────────────────────────────────────────

interface JointOption {
  value: string;
  labelAr: string;
  labelEn: string;
  defaultMovements: { movement: string; labelAr: string; healthyRef: number }[];
}

const JOINTS_CONFIG: JointOption[] = [
  {
    value: "Knee",
    labelAr: "الركبة",
    labelEn: "Knee",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني الركبة (Flexion)", healthyRef: 135 },
      { movement: "Extension", labelAr: "بسط الركبة (Extension)", healthyRef: 0 },
    ],
  },
  {
    value: "Hip",
    labelAr: "الورك",
    labelEn: "Hip",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني الورك (Flexion)", healthyRef: 120 },
      { movement: "Extension", labelAr: "بسط الورك (Extension)", healthyRef: 20 },
      { movement: "Abduction", labelAr: "إبعاد الورك (Abduction)", healthyRef: 45 },
      { movement: "Adduction", labelAr: "تقريب الورك (Adduction)", healthyRef: 30 },
      { movement: "Internal Rotation", labelAr: "دوران داخلي (Internal Rotation)", healthyRef: 45 },
      { movement: "External Rotation", labelAr: "دوران خارجي (External Rotation)", healthyRef: 45 },
    ],
  },
  {
    value: "Ankle",
    labelAr: "الكاحل",
    labelEn: "Ankle",
    defaultMovements: [
      { movement: "Dorsiflexion", labelAr: "ثني ظهري (Dorsiflexion)", healthyRef: 20 },
      { movement: "Plantarflexion", labelAr: "ثني أخمصي (Plantarflexion)", healthyRef: 50 },
      { movement: "Inversion", labelAr: "انقلاب داخلي (Inversion)", healthyRef: 35 },
      { movement: "Eversion", labelAr: "انقلاب خارجي (Eversion)", healthyRef: 15 },
    ],
  },
  {
    value: "Shoulder",
    labelAr: "الكتف",
    labelEn: "Shoulder",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني الكتف (Flexion)", healthyRef: 180 },
      { movement: "Extension", labelAr: "بسط الكتف (Extension)", healthyRef: 60 },
      { movement: "Abduction", labelAr: "إبعاد الكتف (Abduction)", healthyRef: 180 },
      { movement: "External Rotation", labelAr: "دوران خارجي (External Rotation)", healthyRef: 90 },
      { movement: "Internal Rotation", labelAr: "دوران داخلي (Internal Rotation)", healthyRef: 70 },
    ],
  },
  {
    value: "Elbow",
    labelAr: "المرفق",
    labelEn: "Elbow",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني المرفق (Flexion)", healthyRef: 145 },
      { movement: "Extension", labelAr: "بسط المرفق (Extension)", healthyRef: 0 },
      { movement: "Supination", labelAr: "بطح الساعد (Supination)", healthyRef: 85 },
      { movement: "Pronation", labelAr: "كب الساعد (Pronation)", healthyRef: 80 },
    ],
  },
  {
    value: "Wrist",
    labelAr: "الرسغ",
    labelEn: "Wrist",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني الرسغ (Flexion)", healthyRef: 80 },
      { movement: "Extension", labelAr: "بسط الرسغ (Extension)", healthyRef: 70 },
      { movement: "Radial Deviation", labelAr: "انحراف كعبري (Radial Dev.)", healthyRef: 20 },
      { movement: "Ulnar Deviation", labelAr: "انحراف زندي (Ulnar Dev.)", healthyRef: 30 },
    ],
  },
  {
    value: "Cervical",
    labelAr: "الفقرات العنقية",
    labelEn: "Cervical Spine",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني عنقي (Flexion)", healthyRef: 50 },
      { movement: "Extension", labelAr: "بسط عنقي (Extension)", healthyRef: 60 },
      { movement: "Lateral Flexion", labelAr: "ثني جانبي (Lateral Flexion)", healthyRef: 45 },
      { movement: "Rotation", labelAr: "دوران عنقي (Rotation)", healthyRef: 80 },
    ],
  },
  {
    value: "Thoracic",
    labelAr: "الفقرات الصدرية",
    labelEn: "Thoracic Spine",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني صدري (Flexion)", healthyRef: 40 },
      { movement: "Extension", labelAr: "بسط صدري (Extension)", healthyRef: 25 },
      { movement: "Rotation", labelAr: "دوران صدري (Rotation)", healthyRef: 35 },
    ],
  },
  {
    value: "Lumbar",
    labelAr: "الفقرات القطنية",
    labelEn: "Lumbar Spine",
    defaultMovements: [
      { movement: "Flexion", labelAr: "ثني قطني (Flexion)", healthyRef: 60 },
      { movement: "Extension", labelAr: "بسط قطني (Extension)", healthyRef: 25 },
      { movement: "Lateral Flexion", labelAr: "ثني جانبي (Lateral Flexion)", healthyRef: 25 },
    ],
  },
];

const LANDMARK_OPTIONS = [
  "فوق الرضفة — Above Patella",
  "منتصف الفخذ — Mid-Thigh",
  "أعلى الفخذ — Upper Thigh",
  "أسفل الركبة — Below Knee",
  "منتصف الساق — Mid-Calf",
  "الكاحل — Ankle",
  "الذراع — Upper Arm",
  "الساعد — Forearm",
];

const COMMON_INJURIES = [
  "قطع الرباط الصليبي الأمامي (ACL Tear)",
  "قطع الرباط الصليبي + تمزق الغضروف الهلالي (ACL + Meniscus)",
  "تمزق الغضروف الهلالي الإنسي (Medial Meniscus Tear)",
  "التواء الكاحل من الدرجة الثانية (Grade 2 Ankle Sprain)",
  "قطع الوتر الرضفي (Patellar Tendon Rupture)",
  "إصابة أوتار الكفة المدورة (Rotator Cuff Tear)",
  "التهاب وتر أخيل (Achilles Tendinopathy)",
  "انزلاق غضروفي قطني L4-L5 (Lumbar Disc Herniation)",
];

const REHAB_PHASES_DATA = [
  {
    value: "ACUTE" as RehabPhaseType,
    titleAr: "المرحلة الحادة",
    titleEn: "Acute / Protection Phase",
    description:
      "السيطرة على الألم والتورم، حماية الأنسجة الملتئمة، واستعادة حركة البسط الكاملة تدريجياً وبدء الانقباضات الثابتة الخفيفة.",
    criteria: "ألم ≤ 3/10 أثناء الراحة، تحكم بالتورم، إمكانية المشي بدعامة أو عكازين.",
  },
  {
    value: "RESTORE_ROM" as RehabPhaseType,
    titleAr: "استعادة المدى الحركي",
    titleEn: "Restore ROM & Early Mobility",
    description:
      "استعادة المدى الحركي الكامل النشط والسلبي، تحريك صابونة الركبة والمفصل، ومنع تكون الالتصاقات الليفية.",
    criteria: "بسط كامل متماثل 0°، ثني ≥ 120°، انقباض فعال لعضلة الفخذ الرباعية دون عجز.",
  },
  {
    value: "STRENGTH" as RehabPhaseType,
    titleAr: "التقوية العضلية والتحمل",
    titleEn: "Strength & Hypertrophy",
    description:
      "بناء القوة العضلية القصوى والتحمل حول المفصل باستخدام المقاومة المتدرجة وتمارين السلسلة المغلقة والمفتوحة.",
    criteria: "اكتمال المدى الحركي بدون ألم، قوة الطرف المصاب ≥ 70% مقارنة بالطرف السليم.",
  },
  {
    value: "NEUROMUSCULAR" as RehabPhaseType,
    titleAr: "التحكم العصبي العضلي والاتزان",
    titleEn: "Neuromuscular & Proprioception",
    description:
      "تحسين حس الاستقبال العميق، التوازن الديناميكي على ساق واحدة، والتحكم الحركي للطرف لمنع تكرار الإصابة.",
    criteria: "ثبات التوازن على ساق واحدة ≥ 30 ثانية بدون تذبذب، عدم وجود انهيار حركي في الركبة (Dynamic Valgus).",
  },
  {
    value: "FUNCTIONAL" as RehabPhaseType,
    titleAr: "التأهيل الوظيفي والحركي",
    titleEn: "Functional & Agility Training",
    description:
      "البدء بالركض التدريجي المستقيم، تمارين تغيير الاتجاه، القفز والهبوط الثنائي والأحادي، ومحاكاة مهارات اللعبة الأساسية.",
    criteria: "مؤشر التماثل الطرفي (LSI) ≥ 85%، عدم حدوث ارتشاح بعد الجهد، اجتياز اختبارات الركض.",
  },
  {
    value: "RETURN_TO_SPORT" as RehabPhaseType,
    titleAr: "العودة للرياضة والمنافسة",
    titleEn: "Return to Sport / Competition",
    description:
      "الجاهزية التامة للاندماج في التدريبات الجماعية والاحتكاك التنافسي واجتياز بطارية اختبارات Return to Play كاملة.",
    criteria: "مؤشر LSI ≥ 90% في جميع اختبارات القفز (Hop Tests)، اجتياز تقييم الجاهزية النفسية (ACL-RSI ≥ 75%).",
  },
];

// ── Main Page Component ────────────────────────────────────────────

export default function AddCasePage() {
  const router = useRouter();
  const { user, isAdmin, loginAsAdmin } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("patient-info");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Today's ISO date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 py-16 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              واجهة مخصصة لمدير النظام (Admin)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              إضافة الحالات السريرية مقتصرة على مدير النظام. يمكن للعملاء والزوار استعراض الحالات والتفاصيل من الصفحة الرئيسية.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono text-amber-900 text-center">
              {ADMIN_EMAIL}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              onClick={() => {
                loginAsAdmin();
              }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black gap-2 text-sm shadow-md"
            >
              <span>دخول كمدير النظام (Admin)</span>
            </Button>

            <Link
              href="/"
              className="block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              العودة للرئيسية (واجهة العميل)
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 1. Patient Info Form State
  const [patientForm, setPatientForm] = useState<PatientFormState>({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "ذكر — Male",
    injuryType: "",
    injuryDate: todayStr,
    surgeryDate: "",
    rehabStartDate: todayStr,
    injuredSide: "RIGHT",
    mechanismOfInjury: "",
    notes: "",
  });

  // 2. ROM State
  const [selectedJoint, setSelectedJoint] = useState<string>("Knee");
  const [romList, setRomList] = useState<ROMEntryState[]>([
    {
      id: "rom-1",
      joint: "Knee",
      movement: "Flexion",
      injuredAngle: "95",
      healthyAngle: "135",
      notes: "ألم في نهاية المدى الحركي (End-range discomfort)",
    },
    {
      id: "rom-2",
      joint: "Knee",
      movement: "Extension",
      injuredAngle: "5",
      healthyAngle: "0",
      notes: "عجز في البسط الكامل (Lag / extension deficit)",
    },
  ]);

  // 3. Muscle Girth State
  const [girthEvaluations, setGirthEvaluations] = useState<GirthEvaluationState[]>([
    {
      id: "girth-eval-1",
      landmark: "فوق الرضفة — Above Patella",
      date: todayStr,
      measurements: [
        { distanceCm: 0, injuredCm: "42.5", healthyCm: "41.0" },
        { distanceCm: 15, injuredCm: "48.0", healthyCm: "51.5" },
        { distanceCm: 30, injuredCm: "56.0", healthyCm: "58.0" },
      ],
    },
  ]);

  // New distance column input for a specific evaluation
  const [customDistanceInput, setCustomDistanceInput] = useState<{
    [evalId: string]: string;
  }>({});

  // 4. Rehab Program State
  const [rehabProgram, setRehabProgram] = useState<RehabProgramState>({
    phase: "ACUTE",
    notes:
      "التركيز الأولي: كمادات ثلج 20 دقيقة، رفع الطرف، تمارين الانقباض الثابت للفخذ (Quad sets 3x10)، تحريك الكاحل (Ankle pumps). تجنب أي حركة التواء للمفصل.",
  });

  // ── Handlers: Patient Info ───────────────────────────────────────

  const handlePatientInputChange = (
    field: keyof PatientFormState,
    value: string
  ) => {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  // ── Handlers: ROM Measurements ───────────────────────────────────

  const handleAddRomEntry = (movement: string, healthyRef: number) => {
    const newEntry: ROMEntryState = {
      id: `rom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      joint: selectedJoint,
      movement: movement,
      injuredAngle: "",
      healthyAngle: healthyRef.toString(),
      notes: "",
    };
    setRomList((prev) => [...prev, newEntry]);
  };

  const handleUpdateRomEntry = (
    id: string,
    field: keyof ROMEntryState,
    value: string
  ) => {
    setRomList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveRomEntry = (id: string) => {
    setRomList((prev) => prev.filter((item) => item.id !== id));
  };

  // ── Handlers: Girth Evaluations ──────────────────────────────────

  const handleAddEvaluation = () => {
    const nextLandmark =
      LANDMARK_OPTIONS.find(
        (lm) => !girthEvaluations.some((e) => e.landmark === lm)
      ) || LANDMARK_OPTIONS[1];

    const newEval: GirthEvaluationState = {
      id: `girth-eval-${Date.now()}`,
      landmark: nextLandmark,
      date: todayStr,
      measurements: [
        { distanceCm: 0, injuredCm: "", healthyCm: "" },
        { distanceCm: 15, injuredCm: "", healthyCm: "" },
        { distanceCm: 30, injuredCm: "", healthyCm: "" },
      ],
    };
    setGirthEvaluations((prev) => [...prev, newEval]);
  };

  const handleRemoveEvaluation = (evalId: string) => {
    if (girthEvaluations.length <= 1) return;
    setGirthEvaluations((prev) => prev.filter((item) => item.id !== evalId));
  };

  const handleUpdateEvaluationInfo = (
    evalId: string,
    field: "landmark" | "date",
    value: string
  ) => {
    setGirthEvaluations((prev) =>
      prev.map((item) => (item.id === evalId ? { ...item, [field]: value } : item))
    );
  };

  const handleUpdateGirthValue = (
    evalId: string,
    distanceCm: number,
    field: "injuredCm" | "healthyCm",
    value: string
  ) => {
    setGirthEvaluations((prev) =>
      prev.map((ev) => {
        if (ev.id !== evalId) return ev;
        return {
          ...ev,
          measurements: ev.measurements.map((m) =>
            m.distanceCm === distanceCm ? { ...m, [field]: value } : m
          ),
        };
      })
    );
  };

  const handleAddDistanceToEval = (evalId: string, distanceToAdd: number) => {
    setGirthEvaluations((prev) =>
      prev.map((ev) => {
        if (ev.id !== evalId) return ev;
        if (ev.measurements.some((m) => m.distanceCm === distanceToAdd)) {
          return ev;
        }
        const updated = [
          ...ev.measurements,
          { distanceCm: distanceToAdd, injuredCm: "", healthyCm: "" },
        ].sort((a, b) => a.distanceCm - b.distanceCm);
        return { ...ev, measurements: updated };
      })
    );
  };

  const handleRemoveDistance = (evalId: string, distanceCm: number) => {
    setGirthEvaluations((prev) =>
      prev.map((ev) => {
        if (ev.id !== evalId) return ev;
        return {
          ...ev,
          measurements: ev.measurements.filter((m) => m.distanceCm !== distanceCm),
        };
      })
    );
  };

  // ── Form Submission ──────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!patientForm.name.trim()) {
      setErrorMessage("يرجى إدخال اسم المريض بالكامل (Patient Name is required)");
      setActiveTab("patient-info");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!patientForm.injuryType.trim()) {
      setErrorMessage("يرجى إدخال نوع الإصابة التشخيصية (Injury Type is required)");
      setActiveTab("patient-info");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!patientForm.injuryDate) {
      setErrorMessage("يرجى تحديد تاريخ حدوث الإصابة (Injury Date is required)");
      setActiveTab("patient-info");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!patientForm.rehabStartDate) {
      setErrorMessage("يرجى تحديد تاريخ بدء البرنامج التأهيلي (Rehab Start Date is required)");
      setActiveTab("patient-info");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Prepare ROM payload
    const romPayload = romList
      .filter((item) => item.injuredAngle.trim() !== "")
      .map((item) => ({
        joint: item.joint,
        movement: item.movement,
        injuredAngle: parseFloat(item.injuredAngle),
        healthyAngle: item.healthyAngle ? parseFloat(item.healthyAngle) : undefined,
        notes: item.notes.trim() || undefined,
      }));

    // Prepare Girth payload
    const girthPayload = girthEvaluations
      .map((evaluation) => ({
        landmark: evaluation.landmark,
        measurements: evaluation.measurements
          .filter((m) => m.injuredCm.trim() !== "")
          .map((m) => ({
            distanceCm: m.distanceCm,
            injuredCm: parseFloat(m.injuredCm),
            healthyCm: m.healthyCm ? parseFloat(m.healthyCm) : undefined,
          })),
      }))
      .filter((ev) => ev.measurements.length > 0);

    const payload = {
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim() || undefined,
      email: patientForm.email.trim() || undefined,
      dateOfBirth: patientForm.dateOfBirth || undefined,
      gender: patientForm.gender || undefined,
      injuryType: patientForm.injuryType.trim(),
      injuryDate: patientForm.injuryDate,
      surgeryDate: patientForm.surgeryDate || undefined,
      rehabStartDate: patientForm.rehabStartDate,
      injuredSide: patientForm.injuredSide,
      mechanismOfInjury: patientForm.mechanismOfInjury.trim() || undefined,
      notes: patientForm.notes.trim() || undefined,
      romMeasurements: romPayload,
      girthEvaluations: girthPayload,
      rehabPhase: rehabProgram.phase,
      rehabNotes: rehabProgram.notes.trim() || undefined,
    };

    setIsLoading(true);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `خطأ في الخادم: رمز الاستجابة ${response.status}`
        );
      }

      setSuccessMessage("تم حفظ الحالة والقياسات بنجاح! جاري التوجيه إلى قائمة الحالات...");
      setTimeout(() => {
        router.push("/cases");
      }, 900);
    } catch (err: unknown) {
      console.error("Error creating case:", err);
      const msg =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حفظ الحالة";
      setErrorMessage(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  // Find currently active joint configuration
  const currentJointConfig =
    JOINTS_CONFIG.find((j) => j.value === selectedJoint) || JOINTS_CONFIG[0];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-4 text-slate-900" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  إضافة حالة سريرية جديدة
                </h1>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  New Patient Assessment & Case File — تسجيل التقييم الأولي والبرنامج التأهيلي
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/cases")}
              disabled={isLoading}
              className="text-xs sm:text-sm"
            >
              إلغاء (Cancel)
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading}
              className="gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>حفظ الحالة (Save Case)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm animate-fade-in">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <h4 className="text-sm font-bold">تنبيه أثناء إدخال البيانات</h4>
              <p className="text-xs font-medium text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
          </div>
        )}

        {/* Main Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Navigation Header */}
          <div className="mb-6">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 rounded-xl bg-slate-200/70 p-1.5 sm:grid-cols-4">
              <TabsTrigger
                value="patient-info"
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <User className="h-4 w-4" />
                <span>بيانات المريض (Patient)</span>
              </TabsTrigger>

              <TabsTrigger
                value="rom"
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                <span>المدى الحركي (ROM)</span>
                {romList.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {romList.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="girth"
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <Ruler className="h-4 w-4" />
                <span>محيط العضلات (Girth)</span>
                {girthEvaluations.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {girthEvaluations.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="rehab"
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>البرنامج التأهيلي (Rehab)</span>
                <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                  {rehabProgram.phase}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              TAB 1: Patient Info Section (بيانات المريض)
             ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="patient-info" className="focus-visible:outline-none">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      بيانات المريض والإصابة (Patient Information)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      أدخل البيانات الشخصية، الطرف المصاب، والتواريخ الطبية الأساسية
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                    الخطوة 1 من 4
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 sm:text-sm">
                      الاسم الكامل للمريض (Patient Name) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="مثال: محمد أحمد علي"
                      value={patientForm.name}
                      onChange={(e) => handlePatientInputChange("name", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-slate-700 sm:text-sm">
                      رقم الهاتف (Phone Number)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      dir="ltr"
                      placeholder="+20 100 123 4567"
                      value={patientForm.phone}
                      onChange={(e) => handlePatientInputChange("phone", e.target.value)}
                      className="border-slate-200 text-end focus-visible:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Email, DOB & Gender */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 sm:text-sm">
                      البريد الإلكتروني (Email - اختياري)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      dir="ltr"
                      placeholder="patient@example.com"
                      value={patientForm.email}
                      onChange={(e) => handlePatientInputChange("email", e.target.value)}
                      className="border-slate-200 text-end focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-700 sm:text-sm">
                      تاريخ الميلاد (Date of Birth)
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={(e) => handlePatientInputChange("dateOfBirth", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-xs font-bold text-slate-700 sm:text-sm">
                      الجنس (Gender)
                    </Label>
                    <Select
                      value={patientForm.gender}
                      onValueChange={(val) => handlePatientInputChange("gender", val)}
                    >
                      <SelectTrigger id="gender" className="border-slate-200">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ذكر — Male">ذكر (Male)</SelectItem>
                        <SelectItem value="أنثى — Female">أنثى (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Injured Side Selector */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-slate-700 sm:text-sm">
                    الطرف المصاب (Injured Side) <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "RIGHT" as InjuredSideType, labelAr: "اليمين (Right)", desc: "الطرف الأيمن" },
                      { value: "LEFT" as InjuredSideType, labelAr: "اليسار (Left)", desc: "الطرف الأيسر" },
                      { value: "BILATERAL" as InjuredSideType, labelAr: "ثنائي (Bilateral)", desc: "كلا الطرفين" },
                    ].map((side) => {
                      const isSelected = patientForm.injuredSide === side.value;
                      return (
                        <button
                          key={side.value}
                          type="button"
                          onClick={() => handlePatientInputChange("injuredSide", side.value)}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all duration-200",
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm ring-1 ring-emerald-600/30"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <span className="text-xs font-bold sm:text-sm">{side.labelAr}</span>
                          <span className="text-[11px] text-slate-400">{side.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Injury Type with Quick Suggestions */}
                <div className="space-y-2">
                  <Label htmlFor="injuryType" className="text-xs font-bold text-slate-700 sm:text-sm">
                    نوع الإصابة والتشخيص السريري (Injury Type & Diagnosis){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="injuryType"
                    placeholder="مثال: قطع الرباط الصليبي الأمامي + الغضروف الهلالي (ACL + Meniscus)"
                    value={patientForm.injuryType}
                    onChange={(e) => handlePatientInputChange("injuryType", e.target.value)}
                    className="border-slate-200 focus-visible:ring-emerald-500/20"
                    required
                  />

                  {/* Common Presets Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">تشخيصات شائعة:</span>
                    {COMMON_INJURIES.slice(0, 4).map((injury, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePatientInputChange("injuryType", injury)}
                        className="rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        + {injury}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Important Dates (Injury, Surgery, Rehab Start) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="injuryDate" className="text-xs font-bold text-slate-700 sm:text-sm">
                      تاريخ الإصابة (Injury Date) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="injuryDate"
                        type="date"
                        value={patientForm.injuryDate}
                        onChange={(e) => handlePatientInputChange("injuryDate", e.target.value)}
                        className="border-slate-200 focus-visible:ring-emerald-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surgeryDate" className="text-xs font-bold text-slate-700 sm:text-sm">
                      تاريخ العملية (Surgery Date — اختياري)
                    </Label>
                    <Input
                      id="surgeryDate"
                      type="date"
                      value={patientForm.surgeryDate}
                      onChange={(e) => handlePatientInputChange("surgeryDate", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rehabStartDate" className="text-xs font-bold text-slate-700 sm:text-sm">
                      تاريخ بدء التأهيل (Rehab Start Date) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="rehabStartDate"
                      type="date"
                      value={patientForm.rehabStartDate}
                      onChange={(e) => handlePatientInputChange("rehabStartDate", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Mechanism of Injury */}
                <div className="space-y-2">
                  <Label htmlFor="mechanismOfInjury" className="text-xs font-bold text-slate-700 sm:text-sm">
                    آلية الإصابة وحركة الحادث (Mechanism of Injury)
                  </Label>
                  <Textarea
                    id="mechanismOfInjury"
                    rows={2}
                    placeholder="مثال: التواء مفاجئ للركبة للداخل (Valgus Collapse & External Rotation) أثناء الهبوط من قفزة دون احتكاك مباشر، مع سماع صوت فرقعة (Audible Pop) وتورم فوري خلال ساعتين..."
                    value={patientForm.mechanismOfInjury}
                    onChange={(e) => handlePatientInputChange("mechanismOfInjury", e.target.value)}
                    className="border-slate-200 focus-visible:ring-emerald-500/20"
                  />
                </div>

                {/* General Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-bold text-slate-700 sm:text-sm">
                    ملاحظات سريرية وفحوصات إضافية (Clinical Notes & Imaging)
                  </Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="مثال: رنين مغناطيسي MRI يؤكد قطع كامل للرباط ACL مع تمزق في القرن الخلفي للغضروف الداخلي. اختبار Lachman إيجابي (Grade 3). لا يوجد إصابة في الرباط الجانبي MCL..."
                    value={patientForm.notes}
                    onChange={(e) => handlePatientInputChange("notes", e.target.value)}
                    className="border-slate-200 focus-visible:ring-emerald-500/20"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <span className="text-xs text-slate-400">
                  يرجى التأكد من ملء الحقول الإلزامية (*) قبل المتابعة
                </span>
                <Button
                  type="button"
                  onClick={() => setActiveTab("rom")}
                  className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                >
                  <span>التالي: قياسات المدى الحركي (ROM)</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 2: ROM Measurements Section (قياسات المدى الحركي)
             ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="rom" className="focus-visible:outline-none">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      قياسات المدى الحركي (Range of Motion — ROM)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      اختر المفصل، استخدم أزرار الإضافة السريعة لحركات المفصل، وسجّل درجات الزوايا
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="self-start border-blue-300 bg-blue-50 text-blue-700 sm:self-auto">
                    الخطوة 2 من 4
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Joint Selector & Quick Movement Add Bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                    {/* Joint Selector Dropdown */}
                    <div className="space-y-1.5 md:col-span-4">
                      <Label className="text-xs font-bold text-slate-700">
                        المفصل المستهدف (Target Joint)
                      </Label>
                      <Select value={selectedJoint} onValueChange={setSelectedJoint}>
                        <SelectTrigger className="border-slate-200 bg-white">
                          <SelectValue placeholder="اختر المفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOINTS_CONFIG.map((joint) => (
                            <SelectItem key={joint.value} value={joint.value}>
                              {joint.labelAr} ({joint.labelEn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quick Add Buttons for Flexion / Extension and other joint movements */}
                    <div className="space-y-1.5 md:col-span-8">
                      <Label className="text-xs font-bold text-slate-700">
                        إضافة سريعة لحركات {currentJointConfig.labelAr} (Quick Add Movements)
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {currentJointConfig.defaultMovements.map((mvt) => (
                          <Button
                            key={mvt.movement}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddRomEntry(mvt.movement, mvt.healthyRef)}
                            className="h-9 border-slate-300 bg-white text-xs font-semibold hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Plus className="me-1 h-3.5 w-3.5 text-emerald-600" />
                            {mvt.labelAr}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROM Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-end text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700">
                          <th className="px-4 py-3 font-bold text-start">المفصل (Joint)</th>
                          <th className="px-4 py-3 font-bold text-start">الحركة (Movement)</th>
                          <th className="px-4 py-3 font-bold text-center">
                            الطرف المصاب (Injured °)
                          </th>
                          <th className="px-4 py-3 font-bold text-center">
                            الطرف السليم (Healthy °)
                          </th>
                          <th className="px-4 py-3 font-bold text-center">
                            الفارق / العجز (Deficit)
                          </th>
                          <th className="px-4 py-3 font-bold text-start">ملاحظات سريرية (Notes)</th>
                          <th className="px-3 py-3 font-bold text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {romList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400">
                              <Activity className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                              <p className="font-semibold text-slate-600">لا توجد قياسات مضافة حتى الآن</p>
                              <p className="text-xs text-slate-400">
                                استخدم أزرار الإضافة السريعة أعلاه لإدراج قياسات زوايا المفصل
                              </p>
                            </td>
                          </tr>
                        ) : (
                          romList.map((entry) => {
                            const inj = parseFloat(entry.injuredAngle);
                            const hlt = parseFloat(entry.healthyAngle);
                            const hasValidNumbers = !isNaN(inj) && !isNaN(hlt);
                            const deficit = hasValidNumbers ? hlt - inj : null;

                            return (
                              <tr key={entry.id} className="transition-colors hover:bg-slate-50/70">
                                {/* Joint Name */}
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  <Badge variant="outline" className="font-bold">
                                    {entry.joint}
                                  </Badge>
                                </td>

                                {/* Movement */}
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {entry.movement}
                                </td>

                                {/* Injured Angle Input */}
                                <td className="px-3 py-2 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="220"
                                      dir="ltr"
                                      placeholder="0"
                                      value={entry.injuredAngle}
                                      onChange={(e) =>
                                        handleUpdateRomEntry(entry.id, "injuredAngle", e.target.value)
                                      }
                                      className="h-8 w-20 text-center font-bold text-slate-900 border-slate-200 focus-visible:ring-emerald-500/20"
                                    />
                                    <span className="text-xs text-slate-400">°</span>
                                  </div>
                                </td>

                                {/* Healthy Angle Input */}
                                <td className="px-3 py-2 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="220"
                                      dir="ltr"
                                      placeholder="Ref"
                                      value={entry.healthyAngle}
                                      onChange={(e) =>
                                        handleUpdateRomEntry(entry.id, "healthyAngle", e.target.value)
                                      }
                                      className="h-8 w-20 text-center font-medium text-slate-700 border-slate-200 focus-visible:ring-emerald-500/20"
                                    />
                                    <span className="text-xs text-slate-400">°</span>
                                  </div>
                                </td>

                                {/* Deficit Calculation Display */}
                                <td className="px-3 py-2 text-center font-semibold">
                                  {deficit !== null ? (
                                    deficit > 0 ? (
                                      <Badge
                                        variant="warning"
                                        className="gap-1 border-amber-300 bg-amber-50 text-amber-800"
                                      >
                                        <span>عجز {deficit}°</span>
                                      </Badge>
                                    ) : deficit < 0 ? (
                                      <Badge
                                        variant="secondary"
                                        className="gap-1 border-blue-200 bg-blue-50 text-blue-800"
                                      >
                                        <span>زيادة {Math.abs(deficit)}°</span>
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="success"
                                        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800"
                                      >
                                        <span>مدى كامل (0°)</span>
                                      </Badge>
                                    )
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Notes Input */}
                                <td className="px-3 py-2">
                                  <Input
                                    placeholder="ملاحظات سريرية، ألم، مقاومة..."
                                    value={entry.notes}
                                    onChange={(e) =>
                                      handleUpdateRomEntry(entry.id, "notes", e.target.value)
                                    }
                                    className="h-8 border-slate-200 text-xs focus-visible:ring-emerald-500/20"
                                  />
                                </td>

                                {/* Remove Button */}
                                <td className="px-3 py-2 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveRomEntry(entry.id)}
                                    className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="حذف هذا القياس"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Helper Guidelines Card */}
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50/70 p-3 text-xs text-emerald-900 border border-emerald-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p>
                    <strong>توصية سريرية:</strong> في إصابات الرباط الصليبي (ACL)، تعتبر استعادة بسط الركبة
                    الكامل (Extension 0°) أولوية قصوى في الأسابيع الأولى لتجنب المشية غير الطبيعية وتيبس المفصل
                    (Cyclops Lesion).
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("patient-info")}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>السابق: بيانات المريض</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setActiveTab("girth")}
                  className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                >
                  <span>التالي: قياس محيط العضلات (Girth)</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 3: Muscle Girth Measurements (قياس محيط العضلات)
             ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="girth" className="focus-visible:outline-none">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      قياس محيط العضلات والضمور (Muscle Girth & Atrophy)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      مقارنة محيط الطرف المصاب بالطرف السليم على مسافات قياسية (0، 15، 30 سم) لحساب نسبة الضمور
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddEvaluation}
                      className="border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      <Plus className="me-1 h-3.5 w-3.5" />
                      إضافة موضع قياس آخر (Add Landmark)
                    </Button>
                    <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
                      الخطوة 3 من 4
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {girthEvaluations.map((evaluation, evalIdx) => (
                  <div
                    key={evaluation.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all"
                  >
                    {/* Evaluation Header (Landmark selector, Date, Remove button) */}
                    <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
                          #{evalIdx + 1}
                        </span>

                        {/* Landmark Selector */}
                        <div className="w-56 sm:w-64">
                          <Select
                            value={evaluation.landmark}
                            onValueChange={(val) =>
                              handleUpdateEvaluationInfo(evaluation.id, "landmark", val)
                            }
                          >
                            <SelectTrigger className="h-9 border-slate-200 text-xs font-semibold">
                              <SelectValue placeholder="اختر المعلم التشريحي" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANDMARK_OPTIONS.map((lm) => (
                                <SelectItem key={lm} value={lm}>
                                  {lm}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Picker */}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <Input
                            type="date"
                            value={evaluation.date}
                            onChange={(e) =>
                              handleUpdateEvaluationInfo(evaluation.id, "date", e.target.value)
                            }
                            className="h-9 w-36 border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      {/* Remove Evaluation Button */}
                      {girthEvaluations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEvaluation(evaluation.id)}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="me-1 h-3.5 w-3.5" />
                          حذف هذا التقييم
                        </Button>
                      )}
                    </div>

                    {/* Configurable Distance Chips Bar */}
                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                      <span className="text-xs font-bold text-slate-600">
                        المسافات المقاسة (Distances):
                      </span>
                      {evaluation.measurements.map((m) => (
                        <span
                          key={m.distanceCm}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700"
                        >
                          {m.distanceCm} سم
                          {evaluation.measurements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDistance(evaluation.id, m.distanceCm)}
                              className="text-slate-400 hover:text-red-500"
                              title="حذف هذه المسافة"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}

                      {/* Quick Distance Adder */}
                      <div className="flex items-center gap-1 ps-2">
                        {[5, 10, 20, 25].map((dist) => {
                          const exists = evaluation.measurements.some((m) => m.distanceCm === dist);
                          if (exists) return null;
                          return (
                            <button
                              key={dist}
                              type="button"
                              onClick={() => handleAddDistanceToEval(evaluation.id, dist)}
                              className="rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              + {dist} سم
                            </button>
                          );
                        })}

                        {/* Custom Distance Input */}
                        <div className="inline-flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="60"
                            placeholder="سم"
                            value={customDistanceInput[evaluation.id] || ""}
                            onChange={(e) =>
                              setCustomDistanceInput((prev) => ({
                                ...prev,
                                [evaluation.id]: e.target.value,
                              }))
                            }
                            className="h-6 w-14 border-slate-300 text-center text-[10px]"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const val = parseFloat(customDistanceInput[evaluation.id] || "");
                              if (!isNaN(val) && val >= 0) {
                                handleAddDistanceToEval(evaluation.id, val);
                                setCustomDistanceInput((prev) => ({
                                  ...prev,
                                  [evaluation.id]: "",
                                }));
                              }
                            }}
                            className="h-6 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                          >
                            + إضافة
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Measurements Table for this Evaluation */}
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full border-collapse text-end text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700">
                            <th className="px-4 py-2.5 font-bold text-start">
                              المسافة من المعلم (Distance)
                            </th>
                            <th className="px-4 py-2.5 font-bold text-center">
                              الطرف المصاب (Injured cm)
                            </th>
                            <th className="px-4 py-2.5 font-bold text-center">
                              الطرف السليم (Healthy cm)
                            </th>
                            <th className="px-4 py-2.5 font-bold text-center">
                              الفارق (Difference)
                            </th>
                            <th className="px-4 py-2.5 font-bold text-center">
                              نسبة الضمور / التغير (Atrophy %)
                            </th>
                            <th className="px-3 py-2.5 font-bold text-center">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {evaluation.measurements.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">
                                لا توجد مسافات محددة. يرجى إضافة مسافة من الشريط أعلاه.
                              </td>
                            </tr>
                          ) : (
                            evaluation.measurements.map((m) => {
                              const inj = parseFloat(m.injuredCm);
                              const hlt = parseFloat(m.healthyCm);
                              const hasValues = !isNaN(inj) && !isNaN(hlt);
                              const diff = hasValues ? hlt - inj : null;
                              const atrophyPct =
                                hasValues && hlt > 0 ? ((hlt - inj) / hlt) * 100 : null;

                              return (
                                <tr key={m.distanceCm} className="hover:bg-slate-50/60">
                                  {/* Distance label */}
                                  <td className="px-4 py-2.5 font-bold text-slate-800">
                                    {m.distanceCm === 0
                                      ? "0 سم (عند خط المعلم مباشرة)"
                                      : `${m.distanceCm} سم فوق المعلم`}
                                  </td>

                                  {/* Injured cm */}
                                  <td className="px-3 py-2 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="150"
                                        dir="ltr"
                                        placeholder="0.0"
                                        value={m.injuredCm}
                                        onChange={(e) =>
                                          handleUpdateGirthValue(
                                            evaluation.id,
                                            m.distanceCm,
                                            "injuredCm",
                                            e.target.value
                                          )
                                        }
                                        className="h-8 w-24 text-center font-bold text-slate-900 border-slate-200 focus-visible:ring-emerald-500/20"
                                      />
                                      <span className="text-xs text-slate-400">سم</span>
                                    </div>
                                  </td>

                                  {/* Healthy cm */}
                                  <td className="px-3 py-2 text-center">
                                    <div className="inline-flex items-center gap-1">
                                      <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="150"
                                        dir="ltr"
                                        placeholder="0.0"
                                        value={m.healthyCm}
                                        onChange={(e) =>
                                          handleUpdateGirthValue(
                                            evaluation.id,
                                            m.distanceCm,
                                            "healthyCm",
                                            e.target.value
                                          )
                                        }
                                        className="h-8 w-24 text-center font-medium text-slate-700 border-slate-200 focus-visible:ring-emerald-500/20"
                                      />
                                      <span className="text-xs text-slate-400">سم</span>
                                    </div>
                                  </td>

                                  {/* Difference */}
                                  <td className="px-3 py-2 text-center font-bold">
                                    {diff !== null ? (
                                      diff > 0 ? (
                                        <span className="text-amber-700">-{diff.toFixed(1)} سم</span>
                                      ) : diff < 0 ? (
                                        <span className="text-blue-700">+{Math.abs(diff).toFixed(1)} سم (تورم)</span>
                                      ) : (
                                        <span className="text-emerald-700">0.0 سم</span>
                                      )
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>

                                  {/* Atrophy % Badge */}
                                  <td className="px-3 py-2 text-center">
                                    {atrophyPct !== null ? (
                                      atrophyPct > 0 ? (
                                        <Badge
                                          variant="warning"
                                          className="border-amber-300 bg-amber-50 text-amber-800"
                                        >
                                          ضمور {atrophyPct.toFixed(1)}%
                                        </Badge>
                                      ) : atrophyPct < 0 ? (
                                        <Badge
                                          variant="secondary"
                                          className="border-blue-200 bg-blue-50 text-blue-800"
                                        >
                                          ارتشاح {Math.abs(atrophyPct).toFixed(1)}%
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="success"
                                          className="border-emerald-300 bg-emerald-50 text-emerald-800"
                                        >
                                          تماثل 100%
                                        </Badge>
                                      )
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </td>

                                  {/* Delete distance */}
                                  <td className="px-3 py-2 text-center">
                                    {evaluation.measurements.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleRemoveDistance(evaluation.id, m.distanceCm)
                                        }
                                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("rom")}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>السابق: المدى الحركي (ROM)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setActiveTab("rehab")}
                  className="gap-2 bg-slate-800 text-white hover:bg-slate-900"
                >
                  <span>التالي: البرنامج التأهيلي (Rehab)</span>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════
              TAB 4: Rehab Program Assignment (البرنامج التأهيلي)
             ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="rehab" className="focus-visible:outline-none">
            <Card className="border-slate-200/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      تحديد المرحلة التأهيلية (Rehabilitation Phase Assignment)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      حدد المرحلة الحالية للبرنامج العلاجي بناءً على المعايير السريرية وملاحظات التقدم
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-800">
                    الخطوة 4 من 4 (الأخيرة)
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Rehab Phase Cards Grid */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700 sm:text-sm">
                    اختر المرحلة التأهيلية المعتمدة (Select Rehab Phase){" "}
                    <span className="text-red-500">*</span>
                  </Label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {REHAB_PHASES_DATA.map((phase) => {
                      const isSelected = rehabProgram.phase === phase.value;
                      return (
                        <div
                          key={phase.value}
                          onClick={() =>
                            setRehabProgram((prev) => ({ ...prev, phase: phase.value }))
                          }
                          className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-black sm:text-sm">
                              {phase.titleAr}
                            </span>
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border-2",
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              )}
                            >
                              {isSelected && <CheckCircle2 className="h-4 w-4" />}
                            </div>
                          </div>

                          <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                            {phase.titleEn}
                          </span>

                          <p className="text-xs leading-relaxed text-slate-600 mb-3">
                            {phase.description}
                          </p>

                          <div className="rounded-md bg-white/80 p-2 text-[11px] border border-slate-100">
                            <span className="font-bold text-slate-700">معيار الانتقال: </span>
                            <span className="text-slate-500">{phase.criteria}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Program Notes and Clinical Plan */}
                <div className="space-y-2">
                  <Label htmlFor="rehabNotes" className="text-xs font-bold text-slate-700 sm:text-sm">
                    خطة البرنامج والملاحظات التوجيهية (Rehab Program Notes & Plan)
                  </Label>
                  <Textarea
                    id="rehabNotes"
                    rows={4}
                    placeholder="اكتب التوجيهات السريرية، التمارين المسموحة والمحظورة، وعدد الجلسات الأسبوعية المقترحة..."
                    value={rehabProgram.notes}
                    onChange={(e) =>
                      setRehabProgram((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="border-slate-200 focus-visible:ring-emerald-500/20 leading-relaxed text-xs sm:text-sm"
                  />
                </div>

                {/* Case Summary Preview Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="mb-2 text-xs font-bold text-slate-700 sm:text-sm">
                    ملخص بيانات الحالة قبل الحفظ (Summary Overview):
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                      <span className="block text-slate-400 text-[10px]">المريض:</span>
                      <span className="font-bold text-slate-800">
                        {patientForm.name || "لم يُحدد بعد"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                      <span className="block text-slate-400 text-[10px]">الطرف المصاب:</span>
                      <span className="font-bold text-slate-800">
                        {patientForm.injuredSide === "RIGHT"
                          ? "الأيمن (Right)"
                          : patientForm.injuredSide === "LEFT"
                          ? "الأيسر (Left)"
                          : "ثنائي (Bilateral)"}
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                      <span className="block text-slate-400 text-[10px]">قياسات ROM:</span>
                      <span className="font-bold text-slate-800">
                        {romList.length} قياسات مسجلة
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                      <span className="block text-slate-400 text-[10px]">المرحلة المختارة:</span>
                      <span className="font-bold text-emerald-700">
                        {REHAB_PHASES_DATA.find((p) => p.value === rehabProgram.phase)?.titleAr}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("girth")}
                  className="gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>السابق: محيط العضلات (Girth)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isLoading}
                  className="gap-2 bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>حفظ وتأكيد الحالة (Save Case)</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
