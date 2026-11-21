import fs from "fs";
import path from "path";

// ──────────────────────────────────────────────
// FILE SYSTEM HELPERS (FAIL-SAFE FOR SERVERLESS)
// ──────────────────────────────────────────────

function safeReadFile(filePath: string): string | null {
  try {
    if (typeof fs !== "undefined" && typeof fs.existsSync === "function" && fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch {
    // In serverless / read-only environment, ignore fs errors
  }
  return null;
}

function safeWriteFile(filePath: string, data: string): boolean {
  try {
    if (typeof fs !== "undefined" && typeof fs.writeFileSync === "function") {
      const dir = path.dirname(filePath);
      if (typeof fs.existsSync === "function" && !fs.existsSync(dir)) {
        if (typeof fs.mkdirSync === "function") {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      fs.writeFileSync(filePath, data, "utf8");
      return true;
    }
  } catch {
    // In serverless / Cloudflare Workers environment, fs writes throw EROFS. Gracefully ignore.
  }
  return false;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CASES_FILE = path.join(DATA_DIR, "cases.json");
const EXERCISES_FILE = path.join(DATA_DIR, "exercises.json");

// ──────────────────────────────────────────────
// CASES STORAGE
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

// In-memory cases store
let memoryCases: LiveCase[] = [];
let casesLoadedFromFile = false;

export function getLiveCases(): LiveCase[] {
  if (!casesLoadedFromFile) {
    const raw = safeReadFile(CASES_FILE);
    if (raw) {
      try {
        memoryCases = JSON.parse(raw) as LiveCase[];
      } catch {
        // Fallback to memory
      }
    }
    casesLoadedFromFile = true;
  }
  return [...memoryCases];
}

export function saveLiveCase(newCase: Partial<LiveCase>): LiveCase {
  const cases = getLiveCases();
  const caseId = newCase.id || `case-${Date.now()}`;
  const completeCase: LiveCase = {
    id: caseId,
    name: newCase.name || "مريض جديد",
    phone: newCase.phone || null,
    injuryType: newCase.injuryType || "إصابة رياضية",
    injuredSide: (newCase.injuredSide as any) || "RIGHT",
    injuryDate: newCase.injuryDate || new Date().toISOString(),
    surgeryDate: newCase.surgeryDate || null,
    rehabStartDate: newCase.rehabStartDate || new Date().toISOString(),
    mechanismOfInjury: newCase.mechanismOfInjury || null,
    notes: newCase.notes || null,
    status: (newCase.status as any) || "active",
    createdAt: newCase.createdAt || new Date().toISOString(),
    rehabPrograms: newCase.rehabPrograms || [
      { phase: "ACUTE", isActive: true, notes: "المرحلة الأولية" },
    ],
    romMeasurements: newCase.romMeasurements || [],
    girthEvaluations: newCase.girthEvaluations || [],
  };

  const existingIndex = memoryCases.findIndex((c) => c.id === caseId);
  if (existingIndex >= 0) {
    memoryCases[existingIndex] = { ...memoryCases[existingIndex], ...completeCase };
  } else {
    memoryCases.unshift(completeCase);
  }

  safeWriteFile(CASES_FILE, JSON.stringify(memoryCases, null, 2));
  return completeCase;
}

export function deleteLiveCase(id: string): boolean {
  getLiveCases();
  const prevLen = memoryCases.length;
  memoryCases = memoryCases.filter((c) => c.id !== id);
  if (memoryCases.length !== prevLen) {
    safeWriteFile(CASES_FILE, JSON.stringify(memoryCases, null, 2));
    return true;
  }
  return false;
}

export function updateLiveCase(id: string, updates: Partial<LiveCase>): LiveCase | null {
  getLiveCases();
  const index = memoryCases.findIndex((c) => c.id === id);
  if (index === -1) return null;
  memoryCases[index] = { ...memoryCases[index], ...updates };
  safeWriteFile(CASES_FILE, JSON.stringify(memoryCases, null, 2));
  return memoryCases[index];
}

// ──────────────────────────────────────────────
// EXERCISES STORAGE
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

const DEFAULT_EXERCISES: LiveExercise[] = [
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

let memoryExercises: LiveExercise[] = [...DEFAULT_EXERCISES];
let exercisesLoadedFromFile = false;

export function getLiveExercises(): LiveExercise[] {
  if (!exercisesLoadedFromFile) {
    const raw = safeReadFile(EXERCISES_FILE);
    if (raw) {
      try {
        memoryExercises = JSON.parse(raw) as LiveExercise[];
      } catch {
        // Fallback to memory
      }
    }
    exercisesLoadedFromFile = true;
  }
  return [...memoryExercises];
}

export function saveLiveExercise(newEx: Partial<LiveExercise>): LiveExercise {
  getLiveExercises();
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

  const existingIndex = memoryExercises.findIndex((e) => e.id === id);
  if (existingIndex >= 0) {
    memoryExercises[existingIndex] = { ...memoryExercises[existingIndex], ...completeEx };
  } else {
    memoryExercises.unshift(completeEx);
  }

  safeWriteFile(EXERCISES_FILE, JSON.stringify(memoryExercises, null, 2));
  return completeEx;
}

export function deleteLiveExercise(id: string): boolean {
  getLiveExercises();
  const prevLen = memoryExercises.length;
  memoryExercises = memoryExercises.filter((e) => e.id !== id);
  if (memoryExercises.length !== prevLen) {
    safeWriteFile(EXERCISES_FILE, JSON.stringify(memoryExercises, null, 2));
    return true;
  }
  return false;
}
