"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Target,
  Trophy,
  Shield,
  Save,
  Activity,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  RotateCcw,
  Calendar,
  Sparkles,
  Dumbbell,
  Check,
  FileCheck,
} from "lucide-react";
import { cn, formatDate, getPhaseLabel } from "@/lib/utils";
import { AdminGuard } from "@/components/auth/AdminGuard";

// ── TYPES ──

interface PatientCase {
  id: string;
  name: string;
  phone?: string | null;
  injuryType: string;
  injuredSide: string;
  injuryDate: string;
  surgeryDate?: string | null;
  rehabStartDate: string;
  status?: string;
  rehabPrograms?: Array<{
    id: string;
    phase: string;
    isActive: boolean;
  }>;
}

interface CriterionItem {
  id: string;
  category: "pain_swelling" | "rom" | "strength" | "functional" | "sport_specific";
  categoryAr: string;
  categoryEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  targetThreshold: string;
}

interface CriterionState {
  status: "pass" | "fail" | null;
  notes: string;
}

interface SavedCriterion {
  id: string;
  criterionText: string;
  passed: boolean;
  notes?: string | null;
}

interface RTPEvaluationRecord {
  id: string;
  patientId: string;
  phase: string;
  protocolName?: string | null;
  readinessScore: number | null;
  evaluatedAt: string;
  createdAt: string;
  criteria: SavedCriterion[];
}

// ── REHAB PHASES DEFINITION ──

const PHASES = [
  { key: "RETURN_TO_SPORT", labelAr: "العودة للملعب", labelEn: "Return to Sport", isMain: true },
  { key: "FUNCTIONAL", labelAr: "المرحلة الوظيفية", labelEn: "Functional Training" },
  { key: "NEUROMUSCULAR", labelAr: "التحكم العصبي", labelEn: "Neuromuscular" },
  { key: "STRENGTH", labelAr: "تقوية العضلات", labelEn: "Strengthening" },
  { key: "RESTORE_ROM", labelAr: "المدى الحركي", labelEn: "Restore ROM" },
  { key: "ACUTE", labelAr: "المرحلة الحادة", labelEn: "Acute Phase" },
];

// ── CATEGORIES CONFIG ──

const CATEGORIES: Record<
  "pain_swelling" | "rom" | "strength" | "functional" | "sport_specific",
  { ar: string; en: string; icon: typeof Shield }
> = {
  pain_swelling: {
    ar: "الألم والتورم",
    en: "Pain & Swelling",
    icon: Shield,
  },
  rom: {
    ar: "المدى الحركي",
    en: "Range of Motion (ROM)",
    icon: Target,
  },
  strength: {
    ar: "القوة العضلية",
    en: "Muscle Strength",
    icon: Dumbbell,
  },
  functional: {
    ar: "الاختبارات الوظيفية",
    en: "Functional Performance",
    icon: Activity,
  },
  sport_specific: {
    ar: "المتطلبات الرياضية",
    en: "Sport-Specific & Agility",
    icon: Trophy,
  },
};

// ── CRITERIA DATABASE PER PHASE ──

const CRITERIA_DATA: Record<string, CriterionItem[]> = {
  RETURN_TO_SPORT: [
    // Pain & Swelling
    {
      id: "rts_pain_rest",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "غياب الألم أثناء الراحة",
      titleEn: "No pain at rest",
      descriptionAr: "عدم وجود أي ألم في وضع الراحة أو الاسترخاء (مقياس الألم البصري VAS = 0)",
      targetThreshold: "VAS = 0 / 10",
    },
    {
      id: "rts_effusion",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "خلو المفصل تماماً من الارتشاح والتورم",
      titleEn: "No effusion",
      descriptionAr: "فحص الارتشاح السريري طبيعي بدون ارتشاح مائي أو تورم تفاعلي (Stroke Test: Grade 0)",
      targetThreshold: "Effusion Grade 0",
    },
    {
      id: "rts_pain_free_rom",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "مدى حركي كامل بدون ألم",
      titleEn: "Pain-free ROM",
      descriptionAr: "حركة المفصل في المدى الكامل النشط والسلبي دون أي انزعاج أو مقاومة ألمية",
      targetThreshold: "Pain-Free 100%",
    },
    // ROM
    {
      id: "rts_full_extension",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "بسط كامل متطابق للركبة",
      titleEn: "Full extension",
      descriptionAr: "بسط كامل للركبة 0° متطابق تماماً مع الطرف السليم أو بسط مفرط متماثل دون عجز",
      targetThreshold: "0° (Extension Symmetrical)",
    },
    {
      id: "rts_flexion",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "ثني الركبة كامل ≥ 130°",
      titleEn: "Flexion ≥ 130°",
      descriptionAr: "ثني نشط وسلبي للركبة 130 درجة فأكثر مع ملامسة الكعب للأرداف بحرية",
      targetThreshold: "≥ 130° Flexion",
    },
    // Strength
    {
      id: "rts_quad_strength",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلة الرباعية ≥ 90% LSI",
      titleEn: "Quad strength ≥ 90% LSI",
      descriptionAr: "مؤشر تماثل قوة الفخذ الأمامية (Isokinetic أو Handheld Dynamometer) بنسبة 90% فأكثر مقارنة بالطرف السليم",
      targetThreshold: "≥ 90% LSI",
    },
    {
      id: "rts_hamstring_strength",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلات الخلفية ≥ 90% LSI",
      titleEn: "Hamstring strength ≥ 90% LSI",
      descriptionAr: "مؤشر تماثل قوة أوتار الركبة الخلفية بنسبة 90% فأكثر مع توازن نسبة H/Q ratio > 60%",
      targetThreshold: "≥ 90% LSI",
    },
    // Functional
    {
      id: "rts_single_leg_squat",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "تماثل القرفصاء بساق واحدة",
      titleEn: "Single leg squat symmetry",
      descriptionAr: "أداء القرفصاء بساق واحدة بزاوية 60°-70° بثبات حركي ممتاز ودون انحراف داخلي للركبة (Dynamic Valgus)",
      targetThreshold: "تحكم حركي وتماثل تام",
    },
    {
      id: "rts_hop_tests",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "بطارية اختبارات القفز ≥ 90% LSI",
      titleEn: "Hop tests ≥ 90% LSI",
      descriptionAr: "اجتياز بطارية القفز الأربعة (Single Hop, Triple Hop, Crossover Hop, 6m Timed Hop) بنسبة تماثل ≥ 90%",
      targetThreshold: "≥ 90% LSI (All 4 Hops)",
    },
    // Sport-Specific
    {
      id: "rts_agility_drills",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "تدريبات الرشاقة وتغيير الاتجاه",
      titleEn: "Agility drills",
      descriptionAr: "إتمام اختبارات الرشاقة المكوكية (T-test, Pro Agility Shuttle, Illinois Drill) بأقصى سرعة وتنافسية",
      targetThreshold: "أقصى سرعة تنافسية",
    },
    {
      id: "rts_sport_movements",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "الحركات التخصصية للرياضة",
      titleEn: "Sport-specific movements",
      descriptionAr: "أداء مهارات اللعبة التخصصية (المناورة Cutting، الدوران Pivoting، التسارع والفرملة الحادة) بدون تردد",
      targetThreshold: "100% مهارات تخصصية",
    },
    {
      id: "rts_confidence",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "الثقة والجاهزية النفسية الرياضية",
      titleEn: "Confidence & Psychological Readiness",
      descriptionAr: "ثقة الرياضي الكاملة بالطرف المصاب وغياب الخوف من تكرار الإصابة (مقياس ACL-RSI ≥ 75-80%)",
      targetThreshold: "ACL-RSI ≥ 75%",
    },
  ],
  FUNCTIONAL: [
    {
      id: "func_pain",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "غياب الألم أثناء الجري والقفز",
      titleEn: "Pain-free running & hopping",
      descriptionAr: "عدم ظهور ألم أثناء الركض المستقيم والقفز التمهيدي",
      targetThreshold: "VAS ≤ 1/10",
    },
    {
      id: "func_effusion",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "ثبات المفصل بدون تورم تفاعلي",
      titleEn: "No post-training effusion",
      descriptionAr: "اختفاء التورم خلال 12 ساعة من التدريبات الوظيفية",
      targetThreshold: "Effusion Grade 0",
    },
    {
      id: "func_rom",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "مدى حركي كامل نشط وسلبي",
      titleEn: "Full active & passive ROM",
      descriptionAr: "مدى ثني وبسط كامل غير مقيد إطلاقاً",
      targetThreshold: "100% ROM",
    },
    {
      id: "func_quad_str",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلة الرباعية ≥ 85% LSI",
      titleEn: "Quad strength ≥ 85% LSI",
      descriptionAr: "مؤشر تماثل قوة الفخذ الأمامية لا يقل عن 85%",
      targetThreshold: "≥ 85% LSI",
    },
    {
      id: "func_ham_str",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلات الخلفية ≥ 85% LSI",
      titleEn: "Hamstring strength ≥ 85% LSI",
      descriptionAr: "مؤشر تماثل قوة أوتار الركبة الخلفية لا يقل عن 85%",
      targetThreshold: "≥ 85% LSI",
    },
    {
      id: "func_hop_single",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "اختبار القفز الفردي ≥ 85% LSI",
      titleEn: "Single hop test ≥ 85% LSI",
      descriptionAr: "مسافة القفز بساق واحدة لا تقل عن 85% من الطرف السليم مع هبوط مستقر",
      targetThreshold: "≥ 85% LSI",
    },
    {
      id: "func_drop_jump",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "هبوط سليم من صندوق Drop Jump",
      titleEn: "Drop vertical jump mechanics",
      descriptionAr: "الهبوط من ارتفاع 30 سم بامتصاص مرن وبدون انحراف ركبي",
      targetThreshold: "تماثل ميكانيكي تام",
    },
    {
      id: "func_agility_intro",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "تدريبات الرشاقة بسرعة 75%",
      titleEn: "Submaximal agility drills",
      descriptionAr: "الجري الزجزاجي وتغيير الاتجاه بسرعة 75% وبتحكم كامل",
      targetThreshold: "75% Pace Controlled",
    },
  ],
  NEUROMUSCULAR: [
    {
      id: "nm_effusion",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "تحمل الحمل الحركي بدون تورم",
      titleEn: "Effusion tolerance under load",
      descriptionAr: "عدم حدوث ارتشاح بعد تمارين الاتزان الديناميكي",
      targetThreshold: "Effusion Grade 0",
    },
    {
      id: "nm_rom",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "مدى حركي كامل بدون ألم",
      titleEn: "Full pain-free extension & flexion",
      descriptionAr: "بسط كامل وثني يتجاوز 125 درجة",
      targetThreshold: "0° Ext / ≥ 125° Flex",
    },
    {
      id: "nm_quad_str",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلة الرباعية ≥ 80% LSI",
      titleEn: "Quad strength ≥ 80% LSI",
      descriptionAr: "مؤشر تماثل قوة الفخذ الأمامية 80% فأكثر",
      targetThreshold: "≥ 80% LSI",
    },
    {
      id: "nm_hip_str",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة عضلات الحوض المبعدة ≥ 80%",
      titleEn: "Hip abductor & rotator strength ≥ 80%",
      descriptionAr: "قوة العضلة الألوية الوسطى لتحقيق ثبات الحوض أثناء الحركة",
      targetThreshold: "≥ 80% LSI",
    },
    {
      id: "nm_y_balance",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "اختبار الاتزان الديناميكي Y-Balance ≥ 90%",
      titleEn: "Y-Balance composite score ≥ 90%",
      descriptionAr: "الوصول بالقدم الحرة في الاتجاهات الثلاثة بنسبة تماثل ≥ 90%",
      targetThreshold: "Composite ≥ 90%",
    },
    {
      id: "nm_jogging",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "الجري الخطي المستقيم بدون عرج",
      titleEn: "Straight-line jogging symmetry",
      descriptionAr: "القدرة على الركض الخفيف على السير لمدة 15 دقيقة بنمط مشي وركض طبيعي",
      targetThreshold: "15 min Symmetrical",
    },
  ],
  STRENGTH: [
    {
      id: "str_pain",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "عدم وجود ألم بعد تمارين المقاومة",
      titleEn: "No post-resistance pain flare-ups",
      descriptionAr: "ألم أقل من 2/10 ويزول خلال ساعة بعد جلسة التقوية",
      targetThreshold: "VAS ≤ 2/10",
    },
    {
      id: "str_rom",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "مدى حركي كامل بدون ألم",
      titleEn: "Full pain-free ROM",
      descriptionAr: "بسط كامل 0° وثني الركبة ≥ 120°",
      targetThreshold: "0° Ext / ≥ 120° Flex",
    },
    {
      id: "str_quad_70",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلة الرباعية ≥ 70% LSI",
      titleEn: "Quad strength ≥ 70% LSI",
      descriptionAr: "قوة الفخذ الأمامية في جهاز ضغط الأرجل Leg Press",
      targetThreshold: "≥ 70% LSI",
    },
    {
      id: "str_ham_70",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "قوة العضلات الخلفية ≥ 70% LSI",
      titleEn: "Hamstring strength ≥ 70% LSI",
      descriptionAr: "أداء تمرين ثني الساق Leg Curl بمقاومة متماثلة",
      targetThreshold: "≥ 70% LSI",
    },
    {
      id: "str_step_down",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "نزول الدرج بدون ألم أو تعويض Step-Down",
      titleEn: "Eccentric step-down test",
      descriptionAr: "نزول من درجة 20 سم بالساق المصابة بتحكم محايد للركبة",
      targetThreshold: "تحكم بدون ألم",
    },
    {
      id: "str_bike",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "الدراجة الثابتة بمقاومة متوسطة 20 دقيقة",
      titleEn: "Stationary cycling with resistance",
      descriptionAr: "التبديل المتواصل بدون ألم أو صوت طقطقة مزعج",
      targetThreshold: "20 min Pain-free",
    },
  ],
  RESTORE_ROM: [
    {
      id: "rom_pain_walk",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "غياب الألم أثناء المشي العادي",
      titleEn: "Pain-free level walking",
      descriptionAr: "المشي لمسافات معتدلة داخل المنزل والعيادة دون تفاقم الألم",
      targetThreshold: "VAS ≤ 1/10",
    },
    {
      id: "rom_ext_sym",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "بسط كامل للركبة 0°",
      titleEn: "Full knee extension 0°",
      descriptionAr: "بسط كامل للركبة مساوٍ للطرف السليم",
      targetThreshold: "0° Extension",
    },
    {
      id: "rom_flex_110",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "ثني الركبة ≥ 110°",
      titleEn: "Knee flexion ≥ 110°",
      descriptionAr: "ثني مريح للركبة يسمح بركوب الدراجة الثابتة",
      targetThreshold: "≥ 110° Flexion",
    },
    {
      id: "rom_slr_good",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "رفع الساق مستقيمة بدون عجز SLR",
      titleEn: "Straight leg raise without lag",
      descriptionAr: "رفع الساق 45 درجة 10 تكرارات مع بسط كامل مستمر",
      targetThreshold: "10 reps no lag",
    },
    {
      id: "rom_gait_normal",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "نمط مشي طبيعي بدون عكازات",
      titleEn: "Normal gait pattern without crutches",
      descriptionAr: "المشي بدون عرج وبتحميل كامل للوزن",
      targetThreshold: "نمط طبيعي 100%",
    },
    {
      id: "rom_balance_single",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "توازن ثابت على ساق واحدة 30 ثانية",
      titleEn: "Single leg standing balance 30s",
      descriptionAr: "الحفاظ على التوازن بساق واحدة على أرضية مستوية",
      targetThreshold: "30 ثانية بثبات",
    },
  ],
  ACUTE: [
    {
      id: "acute_pain_rest",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "السيطرة على الألم الحاد أثناء الراحة",
      titleEn: "Acute pain control at rest",
      descriptionAr: "ألم تحت السيطرة أثناء الاستلقاء ووضع الثلج والرفع",
      targetThreshold: "VAS ≤ 3/10",
    },
    {
      id: "acute_effusion_ctrl",
      category: "pain_swelling",
      categoryAr: "الألم والتورم",
      categoryEn: "Pain & Swelling",
      titleAr: "التحكم في التورم والانصباب الحاد",
      titleEn: "Controlled acute effusion",
      descriptionAr: "انخفاض محيط المفصل مع كمادات الثلج والرباط الضاغط",
      targetThreshold: "Effusion ≤ 1+",
    },
    {
      id: "acute_ext_0",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "تحقيق بسط كامل 0° مبكراً",
      titleEn: "Attain passive extension 0°",
      descriptionAr: "استعادة بسط الركبة السلبي 0° لمنع التيبس العضلي",
      targetThreshold: "0° Passive Ext",
    },
    {
      id: "acute_flex_90",
      category: "rom",
      categoryAr: "المدى الحركي",
      categoryEn: "Range of Motion (ROM)",
      titleAr: "ثني الركبة حتى 90°",
      titleEn: "Knee flexion to 90°",
      descriptionAr: "ثني تدريجي بدون إجهاد للغرز أو الرقعة الجراحية",
      targetThreshold: "≥ 90° Flexion",
    },
    {
      id: "acute_quad_set",
      category: "strength",
      categoryAr: "القوة العضلية",
      categoryEn: "Muscle Strength",
      titleAr: "انقباض إرادي للعضلة الرباعية Quad Set",
      titleEn: "Voluntary isometric quad set",
      descriptionAr: "القدرة على شد العضلة مع حركة الصابونة العلوية Superior Patellar Glide",
      targetThreshold: "انقباض إرادي واضح",
    },
    {
      id: "acute_weight_bearing",
      category: "functional",
      categoryAr: "الاختبارات الوظيفية",
      categoryEn: "Functional Performance",
      titleAr: "تحميل وزن آمن بالعكازات",
      titleEn: "Protected weight bearing with crutches",
      descriptionAr: "تحميل وزن مسموح به مع دعامة الركبة والعكازين بأمان",
      targetThreshold: "تحميل وزن آمن",
    },
    {
      id: "acute_compliance",
      category: "sport_specific",
      categoryAr: "المتطلبات الرياضية",
      categoryEn: "Sport-Specific & Agility",
      titleAr: "الالتزام بتعليمات الحماية المبكرة",
      titleEn: "Compliance with early protection guidelines",
      descriptionAr: "فهم المريض لقيود الحركة وحماية الرقعة الجراحية",
      targetThreshold: "التزام تام 100%",
    },
  ],
};

// ── CIRCULAR PROGRESS COMPONENT ──

function CircularReadinessGauge({
  score,
  size = 170,
  strokeWidth = 14,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorConfig = useMemo(() => {
    if (score >= 90) {
      return {
        stroke: "#10b981", // emerald-500
        text: "text-emerald-600",
        bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "جاهز للنزول الكامل",
        labelEn: "Cleared for Full RTP",
        statusColor: "emerald",
      };
    }
    if (score >= 75) {
      return {
        stroke: "#f59e0b", // amber-500
        text: "text-amber-600",
        bgBadge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "جاهزية تدريبية مشروطة",
        labelEn: "Modified Non-Contact",
        statusColor: "amber",
      };
    }
    return {
      stroke: "#ef4444", // red-500
      text: "text-red-600",
      bgBadge: "bg-red-50 text-red-700 border-red-200",
      label: "غير مؤهل لنزول الملعب",
      labelEn: "Not Cleared — Further Rehab",
      statusColor: "red",
    };
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline">
            <span className={cn("text-4xl font-extrabold tracking-tight", colorConfig.text)}>
              {score}
            </span>
            <span className="text-xl font-bold text-slate-500 ms-0.5">%</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-1">نسبة الجاهزية</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            colorConfig.bgBadge
          )}
        >
          {score >= 90 ? (
            <Trophy className="w-3.5 h-3.5" />
          ) : score >= 75 ? (
            <Shield className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {colorConfig.label}
        </span>
      </div>
    </div>
  );
}

// ── MAIN RETURN-TO-PLAY PAGE ──

export default function ReturnToPlayPage() {
  return (
    <AdminGuard>
      <ReturnToPlayContent />
    </AdminGuard>
  );
}

function ReturnToPlayContent() {
  // State
  const [patients, setPatients] = useState<PatientCase[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [activePhase, setActivePhase] = useState<string>("RETURN_TO_SPORT");
  const [checklistState, setChecklistState] = useState<Record<string, Record<string, CriterionState>>>({});
  const [isPatientsLoading, setIsPatientsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyEvaluations, setHistoryEvaluations] = useState<RTPEvaluationRecord[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Initialize empty state for a phase if needed
  const getPhaseCriteriaState = useCallback(
    (phase: string): Record<string, CriterionState> => {
      if (checklistState[phase]) return checklistState[phase];
      const items = CRITERIA_DATA[phase] || [];
      const initial: Record<string, CriterionState> = {};
      items.forEach((item) => {
        initial[item.id] = { status: null, notes: "" };
      });
      return initial;
    },
    [checklistState]
  );

  // Active items for the current phase
  const currentCriteriaItems = useMemo(() => {
    return CRITERIA_DATA[activePhase] || [];
  }, [activePhase]);

  // Current state map for active phase
  const currentPhaseState = useMemo(() => {
    return checklistState[activePhase] || getPhaseCriteriaState(activePhase);
  }, [checklistState, activePhase, getPhaseCriteriaState]);

  // Fetch Patients on Mount
  useEffect(() => {
    async function fetchPatients() {
      setIsPatientsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error("تعذر جلب قائمة المرضى");
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } catch (err: unknown) {
        console.error("Error fetching cases:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "حدث خطأ أثناء تحميل الحالات. يرجى إعادة المحاولة."
        );
      } finally {
        setIsPatientsLoading(false);
      }
    }
    fetchPatients();
  }, []);

  // Fetch History whenever selected patient changes
  const fetchPatientHistory = useCallback(async (patientId: string) => {
    if (!patientId) {
      setHistoryEvaluations([]);
      return;
    }
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/rtp?patientId=${patientId}`);
      if (!res.ok) throw new Error("تعذر جلب سجل التقييمات");
      const data = await res.json();
      setHistoryEvaluations(data);
    } catch (err) {
      console.error("Error fetching RTP history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientHistory]);

  // Selected Patient Details
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Toggle Criterion Pass/Fail
  const handleToggleCriterion = (criterionId: string, targetStatus: "pass" | "fail") => {
    setChecklistState((prev) => {
      const phaseState = { ...(prev[activePhase] || {}) };
      const currentStatus = phaseState[criterionId]?.status;

      // If already active, clicking again resets to null, otherwise sets to target
      const newStatus = currentStatus === targetStatus ? null : targetStatus;
      phaseState[criterionId] = {
        ...(phaseState[criterionId] || { notes: "" }),
        status: newStatus,
      };

      return {
        ...prev,
        [activePhase]: phaseState,
      };
    });
  };

  // Checkbox toggle (checked = pass, unchecked = null)
  const handleCheckboxToggle = (criterionId: string, checked: boolean) => {
    setChecklistState((prev) => {
      const phaseState = { ...(prev[activePhase] || {}) };
      phaseState[criterionId] = {
        ...(phaseState[criterionId] || { notes: "" }),
        status: checked ? "pass" : null,
      };
      return {
        ...prev,
        [activePhase]: phaseState,
      };
    });
  };

  // Update notes
  const handleNotesChange = (criterionId: string, notes: string) => {
    setChecklistState((prev) => {
      const phaseState = { ...(prev[activePhase] || {}) };
      phaseState[criterionId] = {
        ...(phaseState[criterionId] || { status: null }),
        notes,
      };
      return {
        ...prev,
        [activePhase]: phaseState,
      };
    });
  };

  // Category Quick "Select All as Pass"
  const handleToggleCategoryAll = (
    category: CriterionItem["category"],
    makeAllPass: boolean
  ) => {
    const categoryItemIds = currentCriteriaItems
      .filter((item) => item.category === category)
      .map((item) => item.id);

    setChecklistState((prev) => {
      const phaseState = { ...(prev[activePhase] || {}) };
      categoryItemIds.forEach((id) => {
        phaseState[id] = {
          ...(phaseState[id] || { notes: "" }),
          status: makeAllPass ? "pass" : null,
        };
      });
      return {
        ...prev,
        [activePhase]: phaseState,
      };
    });
  };

  // Reset current phase criteria
  const handleResetPhase = () => {
    setChecklistState((prev) => {
      const initial: Record<string, CriterionState> = {};
      currentCriteriaItems.forEach((item) => {
        initial[item.id] = { status: null, notes: "" };
      });
      return {
        ...prev,
        [activePhase]: initial,
      };
    });
  };

  // Mark all criteria in active phase as Pass
  const handlePassAllPhase = () => {
    setChecklistState((prev) => {
      const allPassed: Record<string, CriterionState> = {};
      currentCriteriaItems.forEach((item) => {
        allPassed[item.id] = {
          notes: prev[activePhase]?.[item.id]?.notes || "",
          status: "pass",
        };
      });
      return {
        ...prev,
        [activePhase]: allPassed,
      };
    });
  };

  // Calculations
  const stats = useMemo(() => {
    const total = currentCriteriaItems.length;
    let passed = 0;
    let failed = 0;

    currentCriteriaItems.forEach((item) => {
      const s = currentPhaseState[item.id]?.status;
      if (s === "pass") passed++;
      if (s === "fail") failed++;
    });

    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, score };
  }, [currentCriteriaItems, currentPhaseState]);

  // Category breakdown calculations
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { total: number; passed: number; failed: number; percent: number }
    > = {};

    Object.keys(CATEGORIES).forEach((cat) => {
      const items = currentCriteriaItems.filter((i) => i.category === cat);
      let p = 0;
      let f = 0;
      items.forEach((item) => {
        const s = currentPhaseState[item.id]?.status;
        if (s === "pass") p++;
        if (s === "fail") f++;
      });
      map[cat] = {
        total: items.length,
        passed: p,
        failed: f,
        percent: items.length > 0 ? Math.round((p / items.length) * 100) : 0,
      };
    });

    return map;
  }, [currentCriteriaItems, currentPhaseState]);

  // Save Evaluation POST
  const handleSaveEvaluation = async () => {
    if (!selectedPatientId) {
      setErrorMessage("يرجى اختيار مريض أولاً قبل حفظ التقييم.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const criteriaPayload = currentCriteriaItems.map((item) => {
        const state = currentPhaseState[item.id];
        return {
          criterionText: `${item.titleAr} (${item.titleEn})`,
          passed: state?.status === "pass",
          notes: state?.notes || null,
        };
      });

      const payload = {
        patientId: selectedPatientId,
        patient: selectedPatientId,
        phase: activePhase,
        protocolName: "Peak Motion Return-to-Play Criteria",
        readinessScore: stats.score,
        score: stats.score,
        criteria: criteriaPayload,
      };

      const res = await fetch("/api/rtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "فشل حفظ التقييم في الخادم");
      }

      setSaveSuccessMessage(
        `تم حفظ تقييم الجاهزية بنجاح! نسبة الجاهزية المسجلة: ${stats.score}% (${stats.passed} من أصل ${stats.total} معيار).`
      );

      // Refresh history immediately
      await fetchPatientHistory(selectedPatientId);

      // Auto dismiss success toast after 6 seconds
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 6000);
    } catch (err: unknown) {
      console.error("Save evaluation error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع أثناء الحفظ. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-4 text-slate-900" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── 1. HEADER SECTION ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-navy-950 via-slate-900 to-navy-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>بروتوكول معايير الأمان والجاهزية الرياضية — Melbourne & Bern Criteria</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Target className="w-8 h-8 text-emerald-400 shrink-0" />
                <span>شروط نزول الملعب — Return-to-Play Criteria</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                تقييم موضوعي مبني على الأدلة السريرية لقياس تعافي الأنسجة، التماثل الحركي (LSI ≥ 90%)،
                واستيفاء شروط النزول الآمن للملعب للحد من خطر تكرار الإصابة.
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
              <div className="text-right">
                <span className="block text-xs text-slate-400">الحد الأدنى للنزول الكامل</span>
                <span className="text-lg font-bold text-emerald-400">LSI ≥ 90%</span>
              </div>
              <Badge variant="outline" className="text-slate-300 border-slate-700 bg-white/5">
                فحص دوري متدرج
              </Badge>
            </div>
          </div>
        </div>

        {/* ── NOTIFICATION BANNERS ── */}
        {saveSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              <p className="font-bold text-emerald-950">عملية حفظ ناجحة!</p>
              <p className="text-emerald-800 mt-0.5">{saveSuccessMessage}</p>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              <p className="font-bold text-red-950">تنبيه:</p>
              <p className="text-red-800 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* ── 2. PATIENT SELECTOR & INFO BAR ── */}
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Select Dropdown */}
              <div className="lg:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اختيار المريض (Patient Selector):</span>
                </label>
                {isPatientsLoading ? (
                  <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse border border-slate-200 flex items-center px-4 text-xs text-slate-400">
                    جاري تحميل الحالات من السجل...
                  </div>
                ) : patients.length === 0 ? (
                  <div className="h-10 w-full rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center px-4 text-xs font-medium">
                    لا توجد حالات مسجلة حالياً في النظام
                  </div>
                ) : (
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 hover:border-emerald-500 font-medium">
                      <SelectValue placeholder="اختر المريض للتقييم..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            <span className="font-semibold text-slate-900">{patient.name}</span>
                            <span className="text-slate-500 text-xs ms-2">
                              — {patient.injuryType} ({patient.injuredSide === "RIGHT" ? "الطرف الأيمن" : patient.injuredSide === "LEFT" ? "الطرف الأيسر" : patient.injuredSide})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Selected Patient Details Quick View */}
              {selectedPatient ? (
                <div className="lg:col-span-7 flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-slate-400 font-medium">نوع الإصابة:</span>
                    <Badge variant="secondary" className="font-bold text-slate-800 bg-white shadow-xs">
                      {selectedPatient.injuryType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">الجهة:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPatient.injuredSide === "RIGHT"
                        ? "الطرف الأيمن"
                        : selectedPatient.injuredSide === "LEFT"
                        ? "الطرف الأيسر"
                        : selectedPatient.injuredSide}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400 font-medium">بدء التأهيل:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDate(selectedPatient.rehabStartDate)}
                    </span>
                  </div>
                  {selectedPatient.surgeryDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">تاريخ الجراحة:</span>
                      <span className="font-semibold text-slate-900">
                        {formatDate(selectedPatient.surgeryDate)}
                      </span>
                    </div>
                  )}
                  <div className="ms-auto flex items-center gap-1.5">
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold">
                      {historyEvaluations.length} تقييمات سابقة
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-7 text-xs text-slate-400 italic">
                  اختر مريضاً من القائمة المنسدلة للبدء في تقييم معايير النزول للملعب.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 3. PHASE SELECTOR (TABS) ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>مراحل التأهيل الحركي (Rehabilitation Phases):</span>
              </h2>
              <p className="text-xs text-slate-500">
                اختر المرحلة التأهيلية لتقييم استيفاء شروط الانتقال أو النزول النهائي
              </p>
            </div>
            {/* Quick Action Buttons for Checklist */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePassAllPhase}
                className="text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Check className="w-3.5 h-3.5 me-1 text-emerald-600" />
                اجتياز جميع معايير المرحلة
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetPhase}
                className="text-xs h-8 text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5 me-1" />
                إعادة تعيين
              </Button>
            </div>
          </div>

          <Tabs value={activePhase} onValueChange={setActivePhase} className="w-full">
            <div className="overflow-x-auto pb-1">
              <TabsList className="bg-slate-200/70 p-1 rounded-xl h-auto flex gap-1 min-w-max">
                {PHASES.map((p) => {
                  const isActive = activePhase === p.key;
                  return (
                    <TabsTrigger
                      key={p.key}
                      value={p.key}
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2",
                        isActive
                          ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
                        p.isMain && !isActive && "text-emerald-700 font-extrabold"
                      )}
                    >
                      {p.isMain ? (
                        <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Target className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      )}
                      <span>{p.labelAr}</span>
                      <span className="hidden sm:inline-block text-[11px] opacity-60 font-normal">
                        ({p.labelEn})
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tabs Content Wrapper */}
            <TabsContent value={activePhase} className="mt-4 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ── 4. INTERACTIVE CHECKLIST (8 COLS) ── */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Category Sections */}
                  {(
                    Object.keys(CATEGORIES) as Array<
                      "pain_swelling" | "rom" | "strength" | "functional" | "sport_specific"
                    >
                  ).map((categoryKey) => {
                    const categoryMeta = CATEGORIES[categoryKey];
                    const items = currentCriteriaItems.filter(
                      (item) => item.category === categoryKey
                    );
                    if (items.length === 0) return null;

                    const catStat = categoryStats[categoryKey] || {
                      total: items.length,
                      passed: 0,
                      failed: 0,
                      percent: 0,
                    };

                    const CategoryIcon = categoryMeta.icon;
                    const isAllPassed = catStat.passed === catStat.total && catStat.total > 0;

                    return (
                      <Card
                        key={categoryKey}
                        className="border border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-200"
                      >
                        {/* Category Header */}
                        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                              <CategoryIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{categoryMeta.ar}</span>
                                <span className="text-xs text-slate-500 font-normal">
                                  — {categoryMeta.en}
                                </span>
                              </h3>
                              <span className="text-xs text-slate-500">
                                {catStat.passed} من {catStat.total} معايير تم اجتيازها ({catStat.percent}%)
                              </span>
                            </div>
                          </div>

                          {/* Category Actions */}
                          <div className="flex items-center gap-3">
                            <div className="w-24 sm:w-32 hidden sm:block">
                              <Progress value={catStat.percent} className="h-2" />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCategoryAll(categoryKey, !isAllPassed)}
                              className="text-xs h-7 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <Checkbox
                                checked={isAllPassed}
                                className="me-1.5 h-3.5 w-3.5 pointer-events-none"
                              />
                              <span>تحديد الكل</span>
                            </Button>
                          </div>
                        </div>

                        {/* Criteria Items List */}
                        <CardContent className="p-0 divide-y divide-slate-100">
                          {items.map((criterion) => {
                            const state = currentPhaseState[criterion.id] || {
                              status: null,
                              notes: "",
                            };
                            const isPassed = state.status === "pass";
                            const isFailed = state.status === "fail";

                            return (
                              <div
                                key={criterion.id}
                                className={cn(
                                  "p-4 sm:p-5 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                                  isPassed && "bg-emerald-50/30",
                                  isFailed && "bg-red-50/30"
                                )}
                              >
                                {/* Criterion Title & Info */}
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-start gap-2.5">
                                    <div className="pt-0.5">
                                      <Checkbox
                                        checked={isPassed}
                                        onCheckedChange={(checked) =>
                                          handleCheckboxToggle(criterion.id, Boolean(checked))
                                        }
                                        aria-label={`تحديد ${criterion.titleAr}`}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                          {criterion.titleAr}
                                        </h4>
                                        <span className="text-xs font-semibold text-slate-500">
                                          ({criterion.titleEn})
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 px-2 border-slate-300 text-slate-600 bg-white"
                                        >
                                          المعيار: {criterion.targetThreshold}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {criterion.descriptionAr}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Optional note / measure input */}
                                  <div className="pt-1 ps-7">
                                    <input
                                      type="text"
                                      placeholder="ملاحظات أو القيمة المقاسة (اختياري، مثلاً: LSI 94% أو 135°)..."
                                      value={state.notes || ""}
                                      onChange={(e) =>
                                        handleNotesChange(criterion.id, e.target.value)
                                      }
                                      className="text-xs w-full max-w-md px-2.5 py-1 rounded border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                  </div>
                                </div>

                                {/* Pass / Fail Toggle Buttons */}
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ps-7 sm:ps-0">
                                  {/* PASS BUTTON (صح ✓) */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleCriterion(criterion.id, "pass")
                                    }
                                    className={cn(
                                      "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer select-none",
                                      isPassed
                                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20"
                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                    )}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>صح ✓</span>
                                  </button>

                                  {/* FAIL BUTTON (نقط ✗) */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleCriterion(criterion.id, "fail")
                                    }
                                    className={cn(
                                      "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer select-none",
                                      isFailed
                                        ? "bg-red-500 text-white border-red-600 shadow-sm ring-2 ring-red-500/20"
                                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                    )}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>نقط ✗</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* ── 5 & 6. READINESS SCORE & SAVE SIDEBAR (4 COLS) ── */}
                <div className="lg:col-span-4 space-y-6 sticky top-20">
                  {/* Readiness Score Card */}
                  <Card className="border border-slate-200 shadow-md bg-white overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-600" />
                          <span>نسبة الجاهزية — Readiness Score</span>
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs font-bold">
                          {getPhaseLabel(activePhase).ar}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-500">
                        حساب فوري للنسبة المئوية للمعايير المستوفاة في هذه المرحلة
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 space-y-5">
                      {/* Gauge Indicator */}
                      <CircularReadinessGauge score={stats.score} size={170} strokeWidth={14} />

                      {/* Stat summary count */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50">
                          <span className="block text-[11px] text-slate-500">الإجمالي</span>
                          <span className="text-sm font-extrabold text-slate-800">{stats.total}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <span className="block text-[11px] text-emerald-700">ناجح (صح ✓)</span>
                          <span className="text-sm font-extrabold text-emerald-700">{stats.passed}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-red-50">
                          <span className="block text-[11px] text-red-700">راسب (نقط ✗)</span>
                          <span className="text-sm font-extrabold text-red-700">{stats.failed}</span>
                        </div>
                      </div>

                      {/* Category Breakdown Progress */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-700 block">
                          توزيع الإنجاز حسب الأقسام:
                        </span>
                        {(
                          Object.keys(CATEGORIES) as Array<
                            "pain_swelling" | "rom" | "strength" | "functional" | "sport_specific"
                          >
                        ).map((catKey) => {
                          const cat = CATEGORIES[catKey];
                          const cStat = categoryStats[catKey];
                          if (!cStat || cStat.total === 0) return null;
                          return (
                            <div key={catKey} className="space-y-1 text-xs">
                              <div className="flex justify-between items-center text-slate-600 font-medium">
                                <span>{cat.ar}</span>
                                <span className="font-bold text-slate-800">
                                  {cStat.passed}/{cStat.total} ({cStat.percent}%)
                                </span>
                              </div>
                              <Progress value={cStat.percent} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Clinical Decision Recommendation Box */}
                      <div
                        className={cn(
                          "p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5",
                          stats.score >= 90
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : stats.score >= 75
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-red-50 border-red-200 text-red-900"
                        )}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {stats.score >= 90 ? (
                            <>
                              <Trophy className="w-4 h-4 text-emerald-600" />
                              <span>توصية طبية: مؤهل للنزول الكامل</span>
                            </>
                          ) : stats.score >= 75 ? (
                            <>
                              <Shield className="w-4 h-4 text-amber-600" />
                              <span>توصية طبية: تدريب جزئي بدون التحام</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span>توصية طبية: غير مؤهل — استكمال التأهيل</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] opacity-90">
                          {stats.score >= 90
                            ? "استوفى الرياضي معايير القوة والتماثل الطرفي (LSI ≥ 90%) واختبارات القفز والأمان. مسموح بالعودة الكاملة مع المراقبة الدورية."
                            : stats.score >= 75
                            ? "يمكن مشاركة اللاعب في الإحماء وتدريبات المهارات الفردية وتغيير الاتجاه غير التنافسي دون التحامات بدنية."
                            : "يجب استمرار العمل على المعايير غير المكتملة خاصة في القوة والتحكم الحركي لتفادي انتكاسة أو إصابة جديدة."}
                        </p>
                      </div>
                    </CardContent>

                    {/* ── 6. SAVE EVALUATION BUTTON ── */}
                    <CardFooter className="p-5 pt-0 flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveEvaluation}
                        disabled={isSaving || !selectedPatientId}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري حفظ التقييم...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>حفظ التقييم — Save Evaluation</span>
                          </>
                        )}
                      </Button>
                      <p className="text-[11px] text-slate-400 text-center">
                        يتم حفظ النتائج والدرجة في السجل الطبي للمريض عبر /api/rtp
                      </p>
                    </CardFooter>
                  </Card>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── 7. HISTORY SECTION (PREVIOUS EVALUATIONS) ── */}
        <div className="pt-6">
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span>سجل التقييمات السابقة — Evaluation History</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    متابعة التطور الزمني لجاهزية المريض عبر مختلف مراحل إعادة التأهيل
                  </CardDescription>
                </div>
                {selectedPatient && (
                  <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto bg-white">
                    المريض: {selectedPatient.name}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {!selectedPatientId ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <User className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm">اختر مريضاً لعرض سجل تقييمات شروط النزول السابقة.</p>
                </div>
              ) : isHistoryLoading ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium">جاري تحميل سجل التقييمات...</p>
                </div>
              ) : historyEvaluations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">لا توجد تقييمات سابقة مسجلة</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    لم يتم تسجيل أي تقييم جاهزية نزول للملعب لهذا المريض حتى الآن. يمكنك إتمام الفحص أعلاه
                    والضغط على زر &quot;حفظ التقييم&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyEvaluations.map((evalRecord) => {
                    const isExpanded = expandedHistoryId === evalRecord.id;
                    const passedCount = evalRecord.criteria.filter((c) => c.passed).length;
                    const totalCount = evalRecord.criteria.length;
                    const score = evalRecord.readinessScore ?? (totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0);

                    return (
                      <div
                        key={evalRecord.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:border-slate-300"
                      >
                        <div
                          onClick={() =>
                            setExpandedHistoryId(isExpanded ? null : evalRecord.id)
                          }
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border",
                                score >= 90
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : score >= 75
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {score}%
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="font-bold text-sm text-slate-900">
                                  {formatDate(evalRecord.evaluatedAt)}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-semibold bg-slate-100 text-slate-700"
                                >
                                  {getPhaseLabel(evalRecord.phase).ar}
                                </Badge>
                                {score >= 90 && (
                                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    مؤهل للنزول الكامل
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                استوفى {passedCount} من أصل {totalCount} معياراً طبياً
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="text-xs text-emerald-700 font-bold hidden sm:inline">
                              {isExpanded ? "إخفاء التفاصيل" : "عرض المعايير"}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Criteria Details */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 space-y-3">
                            <span className="text-xs font-bold text-slate-700 block">
                              تفاصيل نتائج المعايير المقيمة:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {evalRecord.criteria.map((c) => (
                                <div
                                  key={c.id}
                                  className={cn(
                                    "p-3 rounded-lg border text-xs flex items-start gap-2.5 bg-white",
                                    c.passed ? "border-emerald-200" : "border-red-200"
                                  )}
                                >
                                  {c.passed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 space-y-0.5">
                                    <span
                                      className={cn(
                                        "font-semibold block",
                                        c.passed ? "text-slate-900" : "text-red-900"
                                      )}
                                    >
                                      {c.criterionText}
                                    </span>
                                    {c.notes && (
                                      <p className="text-[11px] text-slate-500 italic">
                                        ملاحظة: {c.notes}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                      c.passed
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {c.passed ? "اجتياز ✓" : "عدم اجتياز ✗"}
                                  </span>
                                </div>
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
        </div>

      </div>
    </div>
  );
}
