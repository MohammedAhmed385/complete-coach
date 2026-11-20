import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ──────────────────────────────────────────────
// CASES STORAGE (STARTS COMPLETELY AT ZERO 0)
// ──────────────────────────────────────────────

export interface LiveCase {
  id: string;
  name: string;
  phone?: string | null;
  injuryType: string;
  injuredSide: "RIGHT" | "LEFT" | "BILATERAL";
  injuryDate: string;
  surgeryDate?: string | null;
  rehabStartDate: string;
  mechanismOfInjury?: string | null;
  notes?: string | null;
  status: "active" | "completed" | "paused";
  createdAt: string;
  rehabPrograms?: Array<{
    id?: string;
    phase: string;
    notes?: string | null;
    isActive: boolean;
  }>;
  romMeasurements?: Array<{
    id?: string;
    joint: string;
    movement: string;
    injuredAngle: number;
    healthyAngle?: number | null;
    notes?: string | null;
  }>;
  girthEvaluations?: Array<{
    id?: string;
    landmark: string;
    measurements?: Array<{
      distanceCm: number;
      injuredCm: number;
      healthyCm?: number | null;
    }>;
  }>;
}

const CASES_FILE = path.join(DATA_DIR, "cases.json");

export function getLiveCases(): LiveCase[] {
  ensureDataDir();
  if (!fs.existsSync(CASES_FILE)) {
    // Starts completely empty as requested: "وصفر كل حاجة انا هضيفها"
    fs.writeFileSync(CASES_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    const raw = fs.readFileSync(CASES_FILE, "utf8");
    return JSON.parse(raw) as LiveCase[];
  } catch {
    return [];
  }
}

export function saveLiveCase(newCase: Partial<LiveCase>): LiveCase {
  const cases = getLiveCases();
  const caseId = newCase.id || `case-${Date.now()}`;
  const completeCase: LiveCase = {
    id: caseId,
    name: newCase.name || "مريض جديد",
    phone: newCase.phone || null,
    injuryType: newCase.injuryType || "إصابة رياضية",
    injuredSide: newCase.injuredSide || "RIGHT",
    injuryDate: newCase.injuryDate || new Date().toISOString(),
    surgeryDate: newCase.surgeryDate || null,
    rehabStartDate: newCase.rehabStartDate || new Date().toISOString(),
    mechanismOfInjury: newCase.mechanismOfInjury || null,
    notes: newCase.notes || null,
    status: newCase.status || "active",
    createdAt: newCase.createdAt || new Date().toISOString(),
    rehabPrograms: newCase.rehabPrograms || [
      { phase: "ACUTE", isActive: true, notes: "المرحلة الأولية" },
    ],
    romMeasurements: newCase.romMeasurements || [],
    girthEvaluations: newCase.girthEvaluations || [],
  };

  const existingIndex = cases.findIndex((c) => c.id === caseId);
  if (existingIndex >= 0) {
    cases[existingIndex] = { ...cases[existingIndex], ...completeCase };
  } else {
    cases.unshift(completeCase);
  }

  ensureDataDir();
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2), "utf8");
  return completeCase;
}

export function deleteLiveCase(id: string): boolean {
  const cases = getLiveCases();
  const filtered = cases.filter((c) => c.id !== id);
  if (filtered.length !== cases.length) {
    ensureDataDir();
    fs.writeFileSync(CASES_FILE, JSON.stringify(filtered, null, 2), "utf8");
    return true;
  }
  return false;
}

export function updateLiveCase(id: string, updates: Partial<LiveCase>): LiveCase | null {
  const cases = getLiveCases();
  const index = cases.findIndex((c) => c.id === id);
  if (index === -1) return null;
  cases[index] = { ...cases[index], ...updates };
  ensureDataDir();
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2), "utf8");
  return cases[index];
}

// ──────────────────────────────────────────────
// EXERCISES STORAGE (REAL CLINICAL LIBRARY)
// ──────────────────────────────────────────────

export interface LiveExercise {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  region: "UPPER" | "LOWER" | "CORE" | "FULL_BODY";
  isIsometric: boolean;
  isometricAngle?: number | null;
  instructions?: string | null;
  videoUrl?: string | null;
  youtubeSearch?: string | null;
  isCustom?: boolean;
}

const EXERCISES_FILE = path.join(DATA_DIR, "exercises.json");

export function getLiveExercises(): LiveExercise[] {
  ensureDataDir();
  if (!fs.existsSync(EXERCISES_FILE)) {
    const initialExercises: LiveExercise[] = [
      {
        id: "ex-1",
        nameAr: "تمرين السكوات الإسباني لتهدئة وتر الصابونة",
        nameEn: "Spanish Squat (Patellar Tendon)",
        category: "Quadriceps & Tendon",
        region: "LOWER",
        isIsometric: true,
        isometricAngle: 60,
        instructions: "تثبيت حزام مقاومة خلف الركبة، والنزول بزاوية 60 درجة مع الثبات لمدة 45 ثانية في 5 تكرارات.",
        youtubeSearch: "Spanish Squat Patellar Tendinopathy",
      },
      {
        id: "ex-2",
        nameAr: "الانقباض الثابت للرباط الصليبي بزاوية 90 درجة",
        nameEn: "Isometric Wall Sit (ACL Rehab)",
        category: "Quadriceps",
        region: "LOWER",
        isIsometric: true,
        isometricAngle: 90,
        instructions: "الاستناد على الحائط مع ثني الركبتين بزاوية 90 درجة، وتوزيع الوزن بالتساوي مع تفعيل عضلات الفخذ الأمامية.",
        youtubeSearch: "Wall Sit Isometric Quadriceps",
      },
      {
        id: "ex-3",
        nameAr: "تنزيل الكعب اللامركزي لوتر أكيلس",
        nameEn: "Eccentric Heel Drop (Achilles Tendon)",
        category: "Calf & Achilles",
        region: "LOWER",
        isIsometric: false,
        instructions: "الوقوف على حافة الدرج والصعود بالقدمين، ثم النزول البطيء بالطرف المصاب فقط لمدة 3 ثوانٍ.",
        youtubeSearch: "Alfredson Protocol Eccentric Heel Drop",
      },
      {
        id: "ex-4",
        nameAr: "اللوح الخشبي الأمامي لثبات الجذع",
        nameEn: "Front Plank Core Stability",
        category: "Core Stability",
        region: "CORE",
        isIsometric: true,
        isometricAngle: 0,
        instructions: "الحفاظ على استقامة العمود الفقري وتفعيل عضلات البطن العميقة والألوية مع الثبات 30-45 ثانية.",
        youtubeSearch: "Plank Core Stability",
      },
      {
        id: "ex-5",
        nameAr: "الدوران الخارجي للكتف بمطاط المقاومة",
        nameEn: "Shoulder External Rotation (Rotator Cuff)",
        category: "Rotator Cuff",
        region: "UPPER",
        isIsometric: false,
        instructions: "تثبيت الكوع بجانب الجسم بزاوية 90 درجة، وسحب المطاط للخارج ببطء والتحكم في مرحلة العودة.",
        youtubeSearch: "Shoulder External Rotation Resistance Band",
      },
      {
        id: "ex-6",
        nameAr: "تمرين الجسر الأحادي لتقوية العضلات الخلفية",
        nameEn: "Single Leg Glute Bridge",
        category: "Hamstring & Glutes",
        region: "LOWER",
        isIsometric: false,
        instructions: "الاستلقاء على الظهر ورفع الحوض بساق واحدة مع عصر عضلات الألوية لمدة ثانيتين في الأعلى.",
        youtubeSearch: "Single Leg Glute Bridge Physical Therapy",
      },
      {
        id: "ex-7",
        nameAr: "الانقباض الثابت لأوتار الركبة بزاوية 45 درجة",
        nameEn: "Isometric Hamstring Bridge 45°",
        category: "Hamstrings",
        region: "LOWER",
        isIsometric: true,
        isometricAngle: 45,
        instructions: "وضع الكعبين على منصة بارتفاع 45 درجة، ورفع الحوض مع الثبات لتفعيل أوتار الركبة دون تحميل مفرط.",
        youtubeSearch: "Isometric Hamstring Bridge",
      },
      {
        id: "ex-8",
        nameAr: "تمرين الطائر الكلب للتوازن العصبي العضلي",
        nameEn: "Bird Dog Neuromuscular Control",
        category: "Core & Lumbar",
        region: "CORE",
        isIsometric: false,
        instructions: "الارتكاز على اليدين والركبتين، ومد الذراع اليمنى للأمام مع الساق اليسرى للخلف في خط مستقيم.",
        youtubeSearch: "Bird Dog Exercise Rehab",
      },
    ];
    fs.writeFileSync(EXERCISES_FILE, JSON.stringify(initialExercises, null, 2), "utf8");
    return initialExercises;
  }
  try {
    const raw = fs.readFileSync(EXERCISES_FILE, "utf8");
    return JSON.parse(raw) as LiveExercise[];
  } catch {
    return [];
  }
}

export function saveLiveExercise(newEx: Partial<LiveExercise>): LiveExercise {
  const exercises = getLiveExercises();
  const id = newEx.id || `ex-${Date.now()}`;
  const completeEx: LiveExercise = {
    id,
    nameAr: newEx.nameAr || "تمرين جديد",
    nameEn: newEx.nameEn || "New Exercise",
    category: newEx.category || "General",
    region: newEx.region || "LOWER",
    isIsometric: Boolean(newEx.isIsometric),
    isometricAngle: newEx.isometricAngle || null,
    instructions: newEx.instructions || null,
    videoUrl: newEx.videoUrl || null,
    youtubeSearch: newEx.youtubeSearch || newEx.nameEn || null,
    isCustom: true,
  };

  const existingIndex = exercises.findIndex((e) => e.id === id);
  if (existingIndex >= 0) {
    exercises[existingIndex] = { ...exercises[existingIndex], ...completeEx };
  } else {
    exercises.unshift(completeEx);
  }

  ensureDataDir();
  fs.writeFileSync(EXERCISES_FILE, JSON.stringify(exercises, null, 2), "utf8");
  return completeEx;
}

export function deleteLiveExercise(id: string): boolean {
  const exercises = getLiveExercises();
  const filtered = exercises.filter((e) => e.id !== id);
  if (filtered.length !== exercises.length) {
    ensureDataDir();
    fs.writeFileSync(EXERCISES_FILE, JSON.stringify(filtered, null, 2), "utf8");
    return true;
  }
  return false;
}
