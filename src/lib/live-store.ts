import fs from "fs";
import path from "path";

// ──────────────────────────────────────────────
// FILE SYSTEM HELPERS (FAIL-SAFE FOR SERVERLESS)
// ──────────────────────────────────────────────

function getSafeDataDir(): string | null {
  try {
    if (typeof process !== "undefined" && typeof process.cwd === "function") {
      return path.join(process.cwd(), "data");
    }
  } catch {
    // Ignore in non-Node or restricted edge environments
  }
  return null;
}

function safeReadFile(filename: string): string | null {
  try {
    const dataDir = getSafeDataDir();
    if (!dataDir) return null;
    const filePath = path.join(dataDir, filename);
    if (typeof fs !== "undefined" && typeof fs.existsSync === "function" && fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch {
    // In serverless / read-only environment, ignore fs errors
  }
  return null;
}

function safeWriteFile(filename: string, data: string): boolean {
  try {
    const dataDir = getSafeDataDir();
    if (!dataDir) return false;
    const filePath = path.join(dataDir, filename);
    if (typeof fs !== "undefined" && typeof fs.writeFileSync === "function") {
      if (typeof fs.existsSync === "function" && !fs.existsSync(dataDir)) {
        if (typeof fs.mkdirSync === "function") {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      }
      fs.writeFileSync(filePath, data, "utf8");
      return true;
    }
  } catch {
    // In Cloudflare Workers environment, fs writes throw EROFS. Gracefully ignore.
  }
  return false;
}

// ──────────────────────────────────────────────
// CLOUDFLARE KV HELPER (MULTI-DEVICE GLOBAL SYNC)
// ──────────────────────────────────────────────

interface CloudflareKVNamespace {
  get(key: string, type?: "json" | "text"): Promise<any>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export async function getCloudflareKV(): Promise<CloudflareKVNamespace | null> {
  try {
    // Dynamic import so it does not fail outside Cloudflare Workers runtime
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const kv = (ctx?.env as any)?.REVIVE_KV || (ctx?.env as any)?.DATA_KV || (ctx?.env as any)?.KV;
    if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
      return kv as CloudflareKVNamespace;
    }
  } catch {
    // Context unavailable in local development or static builds
  }
  return null;
}

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

let memoryCases: LiveCase[] = [];
let casesLoadedFromFile = false;

export function getLiveCases(): LiveCase[] {
  if (!casesLoadedFromFile) {
    const raw = safeReadFile("cases.json");
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

export async function getLiveCasesAsync(): Promise<LiveCase[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("cases", "json");
      if (Array.isArray(data)) {
        memoryCases = data as LiveCase[];
        casesLoadedFromFile = true;
        return [...memoryCases];
      }
    }
  } catch (err) {
    console.warn("KV get cases skipped:", err);
  }
  return getLiveCases();
}

export function saveLiveCase(newCase: Partial<LiveCase>): LiveCase {
  getLiveCases();
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

  safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
  return completeCase;
}

export async function saveLiveCaseAsync(newCase: Partial<LiveCase>): Promise<LiveCase> {
  const saved = saveLiveCase(newCase);
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("cases", JSON.stringify(memoryCases));
    }
  } catch (err) {
    console.warn("KV put cases skipped:", err);
  }
  return saved;
}

export async function deleteLiveCaseAsync(id: string): Promise<boolean> {
  getLiveCases();
  const prevLen = memoryCases.length;
  memoryCases = memoryCases.filter((c) => c.id !== id);
  const changed = memoryCases.length !== prevLen;
  if (changed) {
    safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
    try {
      const kv = await getCloudflareKV();
      if (kv) {
        await kv.put("cases", JSON.stringify(memoryCases));
      }
    } catch (err) {
      console.warn("KV delete case sync skipped:", err);
    }
  }
  return changed;
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
    const raw = safeReadFile("exercises.json");
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

export async function getLiveExercisesAsync(): Promise<LiveExercise[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("exercises", "json");
      if (Array.isArray(data) && data.length > 0) {
        memoryExercises = data as LiveExercise[];
        exercisesLoadedFromFile = true;
        return [...memoryExercises];
      }
    }
  } catch (err) {
    console.warn("KV get exercises skipped:", err);
  }
  return getLiveExercises();
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

  safeWriteFile("exercises.json", JSON.stringify(memoryExercises, null, 2));
  return completeEx;
}

export async function saveLiveExerciseAsync(newEx: Partial<LiveExercise>): Promise<LiveExercise> {
  const saved = saveLiveExercise(newEx);
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("exercises", JSON.stringify(memoryExercises));
    }
  } catch (err) {
    console.warn("KV put exercises skipped:", err);
  }
  return saved;
}

export async function deleteLiveExerciseAsync(id: string): Promise<boolean> {
  getLiveExercises();
  const prevLen = memoryExercises.length;
  memoryExercises = memoryExercises.filter((e) => e.id !== id);
  const changed = memoryExercises.length !== prevLen;
  if (changed) {
    safeWriteFile("exercises.json", JSON.stringify(memoryExercises, null, 2));
    try {
      const kv = await getCloudflareKV();
      if (kv) {
        await kv.put("exercises", JSON.stringify(memoryExercises));
      }
    } catch (err) {
      console.warn("KV delete exercise sync skipped:", err);
    }
  }
  return changed;
}

// ──────────────────────────────────────────────
// ONLINE CONSULTATIONS STORAGE (REAL ONLY)
// ──────────────────────────────────────────────

export interface LiveConsultation {
  id: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    phone?: string | null;
    injuryType: string;
  };
  userId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: "webrtc" | "whatsapp" | "zoom";
  meetingLink?: string | null;
  notes?: string | null;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

let memoryConsultations: LiveConsultation[] = [];
let consultationsLoadedFromFile = false;

export function getLiveConsultations(): LiveConsultation[] {
  if (!consultationsLoadedFromFile) {
    const raw = safeReadFile("consultations.json");
    if (raw) {
      try {
        memoryConsultations = JSON.parse(raw) as LiveConsultation[];
      } catch {
        // Fallback
      }
    }
    consultationsLoadedFromFile = true;
  }
  return [...memoryConsultations];
}

export async function getLiveConsultationsAsync(): Promise<LiveConsultation[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("consultations", "json");
      if (Array.isArray(data)) {
        memoryConsultations = data as LiveConsultation[];
        consultationsLoadedFromFile = true;
        return [...memoryConsultations];
      }
    }
  } catch (err) {
    console.warn("KV get consultations skipped:", err);
  }
  return getLiveConsultations();
}

export function saveLiveConsultation(c: Partial<LiveConsultation>): LiveConsultation {
  getLiveConsultations();
  const id = c.id || `consult-${Date.now()}`;
  const complete: LiveConsultation = {
    id,
    patientId: c.patientId || "",
    patient: {
      id: c.patient?.id || c.patientId || "",
      name: c.patient?.name || "مريض",
      phone: c.patient?.phone || null,
      injuryType: c.patient?.injuryType || "متابعة تأهيلية",
    },
    userId: c.userId || null,
    scheduledAt: c.scheduledAt || new Date().toISOString(),
    durationMinutes: c.durationMinutes || 30,
    meetingType: (c.meetingType as any) || "zoom",
    meetingLink: c.meetingLink || null,
    notes: c.notes || null,
    status: (c.status as any) || "scheduled",
    createdAt: c.createdAt || new Date().toISOString(),
  };

  const existingIndex = memoryConsultations.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    memoryConsultations[existingIndex] = { ...memoryConsultations[existingIndex], ...complete };
  } else {
    memoryConsultations.unshift(complete);
  }

  safeWriteFile("consultations.json", JSON.stringify(memoryConsultations, null, 2));
  return complete;
}

export async function saveLiveConsultationAsync(c: Partial<LiveConsultation>): Promise<LiveConsultation> {
  const saved = saveLiveConsultation(c);
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("consultations", JSON.stringify(memoryConsultations));
    }
  } catch (err) {
    console.warn("KV put consultations skipped:", err);
  }
  return saved;
}

export async function updateLiveConsultationStatusAsync(
  id: string,
  newStatus: "scheduled" | "completed" | "cancelled"
): Promise<LiveConsultation | null> {
  getLiveConsultations();
  const index = memoryConsultations.findIndex((c) => c.id === id);
  if (index === -1) return null;
  memoryConsultations[index] = { ...memoryConsultations[index], status: newStatus };
  safeWriteFile("consultations.json", JSON.stringify(memoryConsultations, null, 2));
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("consultations", JSON.stringify(memoryConsultations));
    }
  } catch (err) {
    console.warn("KV update status skipped:", err);
  }
  return memoryConsultations[index];
}

// ──────────────────────────────────────────────
// CONTACT INQUIRIES & GMAIL NOTIFICATIONS
// ──────────────────────────────────────────────

export interface LiveInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  service: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "archived";
}

let memoryInquiries: LiveInquiry[] = [];
let inquiriesLoadedFromFile = false;

export function getLiveInquiries(): LiveInquiry[] {
  if (!inquiriesLoadedFromFile) {
    const raw = safeReadFile("inquiries.json");
    if (raw) {
      try {
        memoryInquiries = JSON.parse(raw) as LiveInquiry[];
      } catch {
        // Fallback
      }
    }
    inquiriesLoadedFromFile = true;
  }
  return [...memoryInquiries];
}

export async function getLiveInquiriesAsync(): Promise<LiveInquiry[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("inquiries", "json");
      if (Array.isArray(data)) {
        memoryInquiries = data as LiveInquiry[];
        inquiriesLoadedFromFile = true;
        return [...memoryInquiries];
      }
    }
  } catch (err) {
    console.warn("KV get inquiries skipped:", err);
  }
  return getLiveInquiries();
}

export async function saveLiveInquiryAsync(inq: Partial<LiveInquiry>): Promise<LiveInquiry> {
  getLiveInquiries();
  const id = inq.id || `inq-${Date.now()}`;
  const complete: LiveInquiry = {
    id,
    name: inq.name || "زائر للموقع",
    phone: inq.phone || "",
    email: inq.email || null,
    service: inq.service || "online_consultation",
    message: inq.message || "",
    createdAt: inq.createdAt || new Date().toISOString(),
    status: inq.status || "new",
  };

  memoryInquiries.unshift(complete);
  safeWriteFile("inquiries.json", JSON.stringify(memoryInquiries, null, 2));

  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("inquiries", JSON.stringify(memoryInquiries));
    }
  } catch (err) {
    console.warn("KV put inquiries skipped:", err);
  }

  return complete;
}

