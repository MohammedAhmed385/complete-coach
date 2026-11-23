import * as fs from "fs";
import * as path from "path";

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

export interface PatientAssignedExercise {
  id: string;
  exerciseId: string;
  exercise: {
    id: string;
    nameAr: string;
    nameEn: string;
    region?: string;
    category?: string;
    isIsometric?: boolean;
    isometricAngle?: number | null;
    instructions?: string | null;
    youtubeSearch?: string | null;
  };
  targetSets: number;
  targetReps: number;
  completedSets: number;
  completedReps: number;
  completionPercentage: number;
  holdSeconds?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  orderIndex: number;
  addedAt?: string;
}

export interface SessionExerciseEntry {
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

export interface PatientRehabSession {
  id: string;
  sessionNumber: number;
  date: string;
  title: string;
  phase?: string;
  durationMinutes?: number | null;
  painLevel?: number | null;
  overallCompletion?: number;
  exercises: SessionExerciseEntry[];
  notes?: string | null;
  extraDetails?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveCase {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  injuryType: string;
  injuredSide: "RIGHT" | "LEFT" | "BILATERAL";
  injuryDate: string;
  surgeryDate?: string | null;
  rehabStartDate: string;
  mechanismOfInjury?: string | null;
  notes?: string | null;
  status: "active" | "completed" | "paused";
  createdAt: string;
  updatedAt?: string;
  isRestDay?: boolean;
  phaseCriteriaStatus?: Record<string, Record<string, boolean>>;
  rehabPrograms?: Array<{
    id?: string;
    phase: string;
    notes?: string | null;
    isActive: boolean;
    startDate?: string;
    endDate?: string | null;
    programExercises?: any[];
  }>;
  romMeasurements?: Array<{
    id?: string;
    patientId?: string;
    joint: string;
    movement: string;
    injuredAngle: number;
    healthyAngle?: number | null;
    notes?: string | null;
    date?: string;
  }>;
  girthEvaluations?: Array<{
    id?: string;
    patientId?: string;
    landmark: string;
    date?: string;
    measurements?: Array<{
      distanceCm: number;
      injuredCm: number;
      healthyCm?: number | null;
    }>;
  }>;
  girthMeasurements?: Array<{
    id?: string;
    patientId?: string;
    landmark: string;
    date?: string;
    measurements?: Array<{
      distanceCm: number;
      injuredCm: number;
      healthyCm?: number | null;
    }>;
  }>;
  assignedExercises?: PatientAssignedExercise[];
  sessions?: PatientRehabSession[];
  rtpEvaluations?: Array<{
    id: string;
    patientId: string;
    phase: string;
    protocolName?: string | null;
    readinessScore: number;
    evaluatedAt: string;
    createdAt?: string;
    criteria: Array<{
      id?: string;
      criterionText: string;
      passed: boolean;
      notes?: string | null;
    }>;
  }>;
  videoAnalyses?: Array<{
    id: string;
    patientId?: string | null;
    userId?: string | null;
    exerciseName?: string | null;
    cameraPlane: string;
    evaluatedAt: string;
    createdAt?: string;
    jointAngles?: Record<string, any>;
    activeMuscles?: Array<{
      nameAr: string;
      nameEn: string;
      percentage: number;
      role: "primary" | "secondary" | "stabilizer";
    }>;
    summaryNotes?: string | null;
    poseResults?: any;
    kneeValgus?: any;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
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

function normalizeGirthList(list: any): LiveCase["girthEvaluations"] {
  if (!Array.isArray(list)) return [];
  return list.map((ev, idx) => ({
    ...ev,
    id: ev?.id || `girth-${Date.now()}-${idx}`,
    date: ev?.date || ev?.createdAt || new Date().toISOString(),
    landmark: ev?.landmark || "محيط العضلات",
    measurements: Array.isArray(ev?.measurements) ? ev.measurements : [],
  }));
}

export async function getLiveCaseByIdAsync(id: string): Promise<LiveCase | null> {
  const list = await getLiveCasesAsync();
  return list.find((c) => c.id === id) || null;
}

export function saveLiveCase(
  newCase: Partial<LiveCase> & { _baseSnapshot?: Partial<LiveCase> }
): LiveCase {
  getLiveCases();
  const caseId = newCase.id || `case-${Date.now()}`;
  const existingIndex = memoryCases.findIndex((c) => c.id === caseId);
  const existingCase = existingIndex >= 0 ? memoryCases[existingIndex] : null;
  const base: Partial<LiveCase> | null = existingCase ?? newCase._baseSnapshot ?? null;

  // Harmonize girthEvaluations and girthMeasurements without empty-array truthiness trap
  let resolvedGirth: LiveCase["girthEvaluations"] = [];
  if (newCase.girthEvaluations !== undefined) {
    resolvedGirth = normalizeGirthList(newCase.girthEvaluations);
  } else if (newCase.girthMeasurements !== undefined) {
    resolvedGirth = normalizeGirthList(newCase.girthMeasurements);
  } else if (base?.girthEvaluations && base.girthEvaluations.length > 0) {
    resolvedGirth = normalizeGirthList(base.girthEvaluations);
  } else if (base?.girthMeasurements && base.girthMeasurements.length > 0) {
    resolvedGirth = normalizeGirthList(base.girthMeasurements);
  }

  // Merge rehab programs properly
  let resolvedRehabPrograms =
    newCase.rehabPrograms && newCase.rehabPrograms.length > 0
      ? newCase.rehabPrograms
      : base?.rehabPrograms && base.rehabPrograms.length > 0
      ? base.rehabPrograms
      : [
          {
            id: `prog-${caseId}`,
            phase: "ACUTE",
            isActive: true,
            notes: "المرحلة الأولية",
            startDate: new Date().toISOString(),
          },
        ];

  const completeCase: LiveCase = {
    id: caseId,
    name: newCase.name ?? base?.name ?? "مريض جديد",
    phone: newCase.phone !== undefined ? newCase.phone : (base?.phone ?? null),
    email: newCase.email !== undefined ? newCase.email : (base?.email ?? null),
    dateOfBirth: newCase.dateOfBirth !== undefined ? newCase.dateOfBirth : (base?.dateOfBirth ?? null),
    gender: newCase.gender !== undefined ? newCase.gender : (base?.gender ?? null),
    injuryType: newCase.injuryType ?? base?.injuryType ?? "إصابة رياضية",
    injuredSide: (newCase.injuredSide as any) ?? base?.injuredSide ?? "RIGHT",
    injuryDate: newCase.injuryDate ?? base?.injuryDate ?? new Date().toISOString(),
    surgeryDate: newCase.surgeryDate !== undefined ? newCase.surgeryDate : (base?.surgeryDate ?? null),
    rehabStartDate: newCase.rehabStartDate ?? base?.rehabStartDate ?? new Date().toISOString(),
    mechanismOfInjury:
      newCase.mechanismOfInjury !== undefined
        ? newCase.mechanismOfInjury
        : (base?.mechanismOfInjury ?? null),
    notes: newCase.notes !== undefined ? newCase.notes : (base?.notes ?? null),
    status: (newCase.status as any) ?? base?.status ?? "active",
    createdAt: base?.createdAt ?? newCase.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRestDay: newCase.isRestDay !== undefined ? newCase.isRestDay : (base?.isRestDay ?? false),
    phaseCriteriaStatus: newCase.phaseCriteriaStatus ?? base?.phaseCriteriaStatus ?? {},
    rehabPrograms: resolvedRehabPrograms,
    romMeasurements: newCase.romMeasurements ?? base?.romMeasurements ?? [],
    girthEvaluations: resolvedGirth,
    girthMeasurements: resolvedGirth,
    assignedExercises: newCase.assignedExercises ?? base?.assignedExercises ?? [],
    sessions: newCase.sessions ?? base?.sessions ?? [],
    rtpEvaluations: newCase.rtpEvaluations ?? base?.rtpEvaluations ?? [],
    videoAnalyses: newCase.videoAnalyses ?? base?.videoAnalyses ?? [],
  };

  if (existingIndex >= 0) {
    memoryCases[existingIndex] = completeCase;
  } else {
    memoryCases.unshift(completeCase);
  }

  safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
  return completeCase;
}

export async function saveLiveCaseAsync(
  newCase: Partial<LiveCase> & { _baseSnapshot?: Partial<LiveCase> }
): Promise<LiveCase> {
  await getLiveCasesAsync();
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

async function persistMemoryCasesAsync(): Promise<void> {
  safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("cases", JSON.stringify(memoryCases));
    }
  } catch (err) {
    console.warn("KV put cases skipped:", err);
  }
}

export async function addCaseExercisesAsync(
  caseId: string,
  items: Partial<PatientAssignedExercise>[],
  baseSnapshot?: Partial<LiveCase>
): Promise<PatientAssignedExercise[]> {
  await getLiveCasesAsync();
  await getLiveExercisesAsync();

  let existingCase = memoryCases.find((c) => c.id === caseId);
  if (!existingCase) {
    existingCase = saveLiveCase({ id: caseId, _baseSnapshot: baseSnapshot });
  }

  const currentList = [...(existingCase.assignedExercises || [])];
  const baseOrder = currentList.length;

  const newEntries: PatientAssignedExercise[] = items.map((item, idx) => {
    const libEx = item.exerciseId
      ? memoryExercises.find((e) => e.id === item.exerciseId)
      : undefined;
    const resolvedEx = item.exercise?.nameAr
      ? {
          id: item.exercise.id || item.exerciseId || `ex-${Date.now()}-${idx}`,
          nameAr: item.exercise.nameAr,
          nameEn: item.exercise.nameEn || item.exercise.nameAr,
          region: item.exercise.region || libEx?.region || "LOWER",
          category: item.exercise.category || libEx?.category || "Rehab",
          isIsometric: item.exercise.isIsometric ?? libEx?.isIsometric ?? false,
          isometricAngle: item.exercise.isometricAngle ?? libEx?.isometricAngle ?? null,
          instructions: item.exercise.instructions ?? libEx?.instructions ?? null,
          youtubeSearch: item.exercise.youtubeSearch ?? libEx?.youtubeSearch ?? null,
        }
      : {
          id: libEx?.id || item.exerciseId || `ex-${Date.now()}-${idx}`,
          nameAr: libEx?.nameAr || "تمرين تأهيلي مخصص",
          nameEn: libEx?.nameEn || "Custom Rehab Exercise",
          region: libEx?.region || "LOWER",
          category: libEx?.category || "Rehab",
          isIsometric: libEx?.isIsometric ?? false,
          isometricAngle: libEx?.isometricAngle ?? null,
          instructions: libEx?.instructions ?? null,
          youtubeSearch: libEx?.youtubeSearch ?? null,
        };

    const targetSets = Math.max(1, Number(item.targetSets) || 3);
    const targetReps = Math.max(1, Number(item.targetReps) || 10);
    const completedSets = Math.max(0, Number(item.completedSets) || 0);
    const completedReps = Math.max(0, Number(item.completedReps) || 0);
    const completionPercentage =
      item.completionPercentage !== undefined
        ? Math.min(100, Math.max(0, Math.round(Number(item.completionPercentage))))
        : targetSets > 0 && completedSets > 0
        ? Math.min(100, Math.round((completedSets / targetSets) * 100))
        : 0;

    return {
      id: item.id || `pex-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: resolvedEx.id,
      exercise: resolvedEx,
      targetSets,
      targetReps,
      completedSets,
      completedReps,
      completionPercentage,
      holdSeconds: item.holdSeconds ?? null,
      restSeconds: item.restSeconds ?? null,
      notes: item.notes ?? null,
      orderIndex: item.orderIndex ?? baseOrder + idx,
      addedAt: item.addedAt || new Date().toISOString(),
    };
  });

  const updatedList = [...currentList, ...newEntries];
  saveLiveCase({ id: caseId, assignedExercises: updatedList, _baseSnapshot: baseSnapshot });
  await persistMemoryCasesAsync();
  return updatedList;
}

export async function updateCaseExercisesAsync(
  caseId: string,
  payload: {
    exerciseItemId?: string;
    updates?: Partial<PatientAssignedExercise>;
    assignedExercises?: PatientAssignedExercise[];
  },
  baseSnapshot?: Partial<LiveCase>
): Promise<PatientAssignedExercise[]> {
  await getLiveCasesAsync();
  let existingCase = memoryCases.find((c) => c.id === caseId);
  if (!existingCase) {
    existingCase = saveLiveCase({ id: caseId, _baseSnapshot: baseSnapshot });
  }

  let updatedList: PatientAssignedExercise[] = [...(existingCase.assignedExercises || [])];

  if (Array.isArray(payload.assignedExercises)) {
    updatedList = payload.assignedExercises;
  } else if (payload.exerciseItemId && payload.updates) {
    updatedList = updatedList.map((item) => {
      if (item.id !== payload.exerciseItemId) return item;
      const merged = { ...item, ...payload.updates };
      if (merged.completionPercentage !== undefined) {
        merged.completionPercentage = Math.min(100, Math.max(0, Math.round(Number(merged.completionPercentage))));
      }
      return merged;
    });
  }

  saveLiveCase({ id: caseId, assignedExercises: updatedList, _baseSnapshot: baseSnapshot });
  await persistMemoryCasesAsync();
  return updatedList;
}

export async function deleteCaseExerciseAsync(
  caseId: string,
  exerciseItemId: string,
  baseSnapshot?: Partial<LiveCase>
): Promise<PatientAssignedExercise[]> {
  await getLiveCasesAsync();
  let existingCase = memoryCases.find((c) => c.id === caseId);
  if (!existingCase) {
    existingCase = saveLiveCase({ id: caseId, _baseSnapshot: baseSnapshot });
  }

  const updatedList = (existingCase.assignedExercises || []).filter((item) => item.id !== exerciseItemId);
  const updatedPrograms = (existingCase.rehabPrograms || []).map((prog) =>
    Array.isArray(prog.programExercises)
      ? {
          ...prog,
          programExercises: prog.programExercises.filter((pe: any) => pe.id !== exerciseItemId),
        }
      : prog
  );

  saveLiveCase({
    id: caseId,
    assignedExercises: updatedList,
    rehabPrograms: updatedPrograms,
    _baseSnapshot: baseSnapshot,
  });
  await persistMemoryCasesAsync();
  return updatedList;
}

export async function getCaseSessionsAsync(caseId: string): Promise<PatientRehabSession[]> {
  await getLiveCasesAsync();
  const c = memoryCases.find((item) => item.id === caseId);
  const sessions = [...(c?.sessions || [])];
  sessions.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
  return sessions;
}

export async function saveCaseSessionAsync(
  caseId: string,
  sessionData: Partial<PatientRehabSession>,
  baseSnapshot?: Partial<LiveCase>
): Promise<{ session: PatientRehabSession; sessions: PatientRehabSession[] }> {
  await getLiveCasesAsync();
  let existingCase = memoryCases.find((c) => c.id === caseId);
  if (!existingCase) {
    existingCase = saveLiveCase({ id: caseId, _baseSnapshot: baseSnapshot });
  }

  const existingSessions = [...(existingCase.sessions || [])];
  const existingIdx = sessionData.id
    ? existingSessions.findIndex((s) => s.id === sessionData.id)
    : -1;

  const maxNumber = existingSessions.reduce((max, s) => Math.max(max, s.sessionNumber || 0), 0);
  const sessionNumber =
    sessionData.sessionNumber ||
    (existingIdx >= 0 ? existingSessions[existingIdx].sessionNumber : maxNumber + 1);

  const normalizedExercises: SessionExerciseEntry[] = (sessionData.exercises || []).map((ex, idx) => ({
    id: ex.id || `sex-${Date.now()}-${idx}`,
    exerciseId: ex.exerciseId,
    nameAr: ex.nameAr || "تمرين تأهيلي",
    nameEn: ex.nameEn || "",
    category: ex.category || "تأهيل",
    sets: Math.max(1, Number(ex.sets) || 3),
    reps: Math.max(1, Number(ex.reps) || 10),
    completionPercentage: Math.min(100, Math.max(0, Math.round(Number(ex.completionPercentage ?? 0)))),
    notes: ex.notes ?? null,
  }));

  const overallCompletion =
    normalizedExercises.length > 0
      ? Math.round(
          normalizedExercises.reduce((acc, ex) => acc + ex.completionPercentage, 0) /
            normalizedExercises.length
        )
      : sessionData.overallCompletion ?? 100;

  const completeSession: PatientRehabSession = {
    id: sessionData.id || `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sessionNumber,
    date: sessionData.date || new Date().toISOString().split("T")[0],
    title: sessionData.title?.trim() || `جلسة تأهيل #${sessionNumber}`,
    phase: sessionData.phase || existingCase.rehabPrograms?.[0]?.phase || "ACUTE",
    durationMinutes:
      sessionData.durationMinutes !== undefined && sessionData.durationMinutes !== null
        ? Number(sessionData.durationMinutes)
        : 45,
    painLevel:
      sessionData.painLevel !== undefined && sessionData.painLevel !== null
        ? Number(sessionData.painLevel)
        : null,
    overallCompletion,
    exercises: normalizedExercises,
    notes: sessionData.notes ?? null,
    extraDetails: sessionData.extraDetails ?? null,
    createdAt:
      existingIdx >= 0
        ? existingSessions[existingIdx].createdAt
        : sessionData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    existingSessions[existingIdx] = completeSession;
  } else {
    existingSessions.push(completeSession);
  }

  existingSessions.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

  saveLiveCase({ id: caseId, sessions: existingSessions, _baseSnapshot: baseSnapshot });
  await persistMemoryCasesAsync();

  return { session: completeSession, sessions: existingSessions };
}

export async function deleteCaseSessionAsync(
  caseId: string,
  sessionId: string,
  baseSnapshot?: Partial<LiveCase>
): Promise<PatientRehabSession[]> {
  await getLiveCasesAsync();
  let existingCase = memoryCases.find((c) => c.id === caseId);
  if (!existingCase) {
    existingCase = saveLiveCase({ id: caseId, _baseSnapshot: baseSnapshot });
  }

  const remaining = (existingCase.sessions || []).filter((s) => s.id !== sessionId);
  saveLiveCase({ id: caseId, sessions: remaining, _baseSnapshot: baseSnapshot });
  await persistMemoryCasesAsync();
  return remaining;
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

// ──────────────────────────────────────────────
// RETURN TO PLAY (RTP) EVALUATIONS STORAGE
// ──────────────────────────────────────────────

export interface LiveRTPEvaluation {
  id: string;
  patientId: string;
  phase: string;
  protocolName?: string | null;
  readinessScore: number;
  evaluatedAt: string;
  createdAt: string;
  criteria: Array<{
    id?: string;
    criterionText: string;
    passed: boolean;
    notes?: string | null;
  }>;
}

let memoryRTPEvaluations: LiveRTPEvaluation[] = [];
let rtpLoadedFromFile = false;

export function getLiveRTPEvaluations(patientId?: string): LiveRTPEvaluation[] {
  if (!rtpLoadedFromFile) {
    const raw = safeReadFile("rtp.json");
    if (raw) {
      try {
        memoryRTPEvaluations = JSON.parse(raw) as LiveRTPEvaluation[];
      } catch {
        // Fallback
      }
    }
    rtpLoadedFromFile = true;
  }
  if (patientId) {
    return memoryRTPEvaluations.filter((r) => r.patientId === patientId);
  }
  return [...memoryRTPEvaluations];
}

export async function getLiveRTPEvaluationsAsync(patientId?: string): Promise<LiveRTPEvaluation[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("rtp_evaluations", "json");
      if (Array.isArray(data)) {
        memoryRTPEvaluations = data as LiveRTPEvaluation[];
        rtpLoadedFromFile = true;
        if (patientId) {
          return memoryRTPEvaluations.filter((r) => r.patientId === patientId);
        }
        return [...memoryRTPEvaluations];
      }
    }
  } catch (err) {
    console.warn("KV get RTP skipped:", err);
  }
  return getLiveRTPEvaluations(patientId);
}

export async function saveLiveRTPEvaluationAsync(evaluation: Partial<LiveRTPEvaluation>): Promise<LiveRTPEvaluation> {
  getLiveRTPEvaluations();
  const id = evaluation.id || `rtp-${Date.now()}`;
  const complete: LiveRTPEvaluation = {
    id,
    patientId: evaluation.patientId || "",
    phase: evaluation.phase || "RETURN_TO_SPORT",
    protocolName: evaluation.protocolName || "معايير العودة للملعب",
    readinessScore: evaluation.readinessScore ?? 0,
    evaluatedAt: evaluation.evaluatedAt || new Date().toISOString(),
    createdAt: evaluation.createdAt || new Date().toISOString(),
    criteria: evaluation.criteria || [],
  };

  const existingIdx = memoryRTPEvaluations.findIndex((r) => r.id === id);
  if (existingIdx >= 0) {
    memoryRTPEvaluations[existingIdx] = complete;
  } else {
    memoryRTPEvaluations.unshift(complete);
  }

  safeWriteFile("rtp.json", JSON.stringify(memoryRTPEvaluations, null, 2));

  // Sync with matching patient's file in LiveCases
  if (complete.patientId) {
    getLiveCases();
    const caseIndex = memoryCases.findIndex((c) => c.id === complete.patientId);
    if (caseIndex >= 0) {
      const targetCase = memoryCases[caseIndex];
      const existingRtpList = targetCase.rtpEvaluations || [];
      const updatedRtpList = [complete, ...existingRtpList.filter((item) => item.id !== complete.id)];
      memoryCases[caseIndex] = {
        ...targetCase,
        rtpEvaluations: updatedRtpList,
        updatedAt: new Date().toISOString(),
      };
      safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
    }
  }

  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("rtp_evaluations", JSON.stringify(memoryRTPEvaluations));
      await kv.put("cases", JSON.stringify(memoryCases));
    }
  } catch (err) {
    console.warn("KV put RTP skipped:", err);
  }

  return complete;
}

// ──────────────────────────────────────────────
// AI VIDEO & MOTION ANALYSES STORAGE
// ──────────────────────────────────────────────

export interface LiveVideoAnalysis {
  id: string;
  patientId?: string | null;
  userId?: string | null;
  exerciseName?: string | null;
  cameraPlane: string;
  evaluatedAt: string;
  createdAt: string;
  jointAngles?: Record<string, any>;
  activeMuscles?: Array<{
    nameAr: string;
    nameEn: string;
    percentage: number;
    role: "primary" | "secondary" | "stabilizer";
  }>;
  summaryNotes?: string | null;
  poseResults?: any;
  kneeValgus?: any;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
}

let memoryVideoAnalyses: LiveVideoAnalysis[] = [];
let videoAnalysesLoadedFromFile = false;

export function getLiveVideoAnalyses(patientId?: string): LiveVideoAnalysis[] {
  if (!videoAnalysesLoadedFromFile) {
    const raw = safeReadFile("video_analyses.json");
    if (raw) {
      try {
        memoryVideoAnalyses = JSON.parse(raw) as LiveVideoAnalysis[];
      } catch {
        // Fallback
      }
    }
    videoAnalysesLoadedFromFile = true;
  }
  if (patientId) {
    return memoryVideoAnalyses.filter((v) => v.patientId === patientId);
  }
  return [...memoryVideoAnalyses];
}

export async function getLiveVideoAnalysesAsync(patientId?: string): Promise<LiveVideoAnalysis[]> {
  try {
    const kv = await getCloudflareKV();
    if (kv) {
      const data = await kv.get("video_analyses", "json");
      if (Array.isArray(data)) {
        memoryVideoAnalyses = data as LiveVideoAnalysis[];
        videoAnalysesLoadedFromFile = true;
        if (patientId) {
          return memoryVideoAnalyses.filter((v) => v.patientId === patientId);
        }
        return [...memoryVideoAnalyses];
      }
    }
  } catch (err) {
    console.warn("KV get video analyses skipped:", err);
  }
  return getLiveVideoAnalyses(patientId);
}

export async function saveLiveVideoAnalysisAsync(analysis: Partial<LiveVideoAnalysis>): Promise<LiveVideoAnalysis> {
  getLiveVideoAnalyses();
  const id = analysis.id || `va-${Date.now()}`;
  const complete: LiveVideoAnalysis = {
    id,
    patientId: analysis.patientId || null,
    userId: analysis.userId || null,
    exerciseName: analysis.exerciseName || "تحليل حركي بالذكاء الاصطناعي",
    cameraPlane: analysis.cameraPlane || "sagittal",
    evaluatedAt: analysis.evaluatedAt || new Date().toISOString(),
    createdAt: analysis.createdAt || new Date().toISOString(),
    jointAngles: analysis.jointAngles || {},
    activeMuscles: analysis.activeMuscles || [],
    summaryNotes: analysis.summaryNotes || null,
    poseResults: analysis.poseResults || null,
    kneeValgus: analysis.kneeValgus || null,
    thumbnailUrl: analysis.thumbnailUrl || null,
    videoUrl: analysis.videoUrl || null,
  };

  const existingIdx = memoryVideoAnalyses.findIndex((v) => v.id === id);
  if (existingIdx >= 0) {
    memoryVideoAnalyses[existingIdx] = complete;
  } else {
    memoryVideoAnalyses.unshift(complete);
  }

  safeWriteFile("video_analyses.json", JSON.stringify(memoryVideoAnalyses, null, 2));

  // Sync to Patient file if linked
  if (complete.patientId) {
    getLiveCases();
    const caseIndex = memoryCases.findIndex((c) => c.id === complete.patientId);
    if (caseIndex >= 0) {
      const targetCase = memoryCases[caseIndex];
      const existingList = targetCase.videoAnalyses || [];
      const updatedList = [complete, ...existingList.filter((item) => item.id !== complete.id)];
      memoryCases[caseIndex] = {
        ...targetCase,
        videoAnalyses: updatedList,
        updatedAt: new Date().toISOString(),
      };
      safeWriteFile("cases.json", JSON.stringify(memoryCases, null, 2));
    }
  }

  try {
    const kv = await getCloudflareKV();
    if (kv) {
      await kv.put("video_analyses", JSON.stringify(memoryVideoAnalyses));
      await kv.put("cases", JSON.stringify(memoryCases));
    }
  } catch (err) {
    console.warn("KV put video analysis skipped:", err);
  }

  return complete;
}


