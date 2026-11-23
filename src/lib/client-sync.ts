"use client";

export const LOCAL_CASES_KEY = "revive_cases";
export const LOCAL_DELETED_CASES_KEY = "revive_deleted_case_ids";
export const LOCAL_RTP_KEY = "revive_rtp_evaluations";
export const LOCAL_VIDEO_ANALYSES_KEY = "revive_video_analyses";
export const LOCAL_DELETED_EXERCISES_KEY = "revive_deleted_exercise_ids";

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function getDeletedCaseIds(): string[] {
  const arr = safeReadJson<string[]>(LOCAL_DELETED_CASES_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function getDeletedExerciseIds(): string[] {
  const arr = safeReadJson<string[]>(LOCAL_DELETED_EXERCISES_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function markExerciseDeletedLocal(id: string): void {
  const current = getDeletedExerciseIds();
  if (!current.includes(id)) {
    safeWriteJson(LOCAL_DELETED_EXERCISES_KEY, [...current, id]);
  }
}

export function getLocalCases(): any[] {
  const arr = safeReadJson<any[]>(LOCAL_CASES_KEY, []);
  const deleted = new Set(getDeletedCaseIds());
  return Array.isArray(arr) ? arr.filter((c) => c && c.id && !deleted.has(c.id)) : [];
}

export function upsertLocalCase(caseObj: any): void {
  if (!caseObj || !caseObj.id) return;
  const list = getLocalCases();
  const idx = list.findIndex((c) => c.id === caseObj.id);
  const deleted = getDeletedCaseIds().filter((d) => d !== caseObj.id);
  safeWriteJson(LOCAL_DELETED_CASES_KEY, deleted);

  if (idx >= 0) {
    list[idx] = mergeCaseRecords(list[idx], caseObj);
  } else {
    list.unshift(caseObj);
  }
  safeWriteJson(LOCAL_CASES_KEY, list);
}

export function removeLocalCase(id: string): void {
  const list = getLocalCases().filter((c) => c.id !== id);
  safeWriteJson(LOCAL_CASES_KEY, list);
  const deleted = getDeletedCaseIds();
  if (!deleted.includes(id)) {
    safeWriteJson(LOCAL_DELETED_CASES_KEY, [...deleted, id]);
  }
}

function mergeById(primary: any[] = [], secondary: any[] = []): any[] {
  const map = new Map<string, any>();
  [...secondary, ...primary].forEach((item, idx) => {
    if (!item) return;
    const key = item.id || `idx-${idx}-${item.createdAt || item.evaluatedAt || item.landmark || ""}`;
    map.set(String(key), item);
  });
  return Array.from(map.values());
}

/**
 * Merges local and server representations of the same patient without letting
 * empty server defaults (e.g. cold Worker stub "مريض جديد") overwrite richer data.
 */
export function mergeCaseRecords(localCase: any, serverCase: any): any {
  if (!localCase) return serverCase;
  if (!serverCase) return localCase;

  const isServerStub = serverCase.name === "مريض جديد" && localCase.name && localCase.name !== "مريض جديد";
  const serverTime = new Date(serverCase.updatedAt || serverCase.createdAt || 0).getTime();
  const localTime = new Date(localCase.updatedAt || localCase.createdAt || 0).getTime();
  const preferServer = !isServerStub && serverTime >= localTime;

  const pickScalar = (field: string) => {
    const sVal = serverCase[field];
    const lVal = localCase[field];
    if (isServerStub) return lVal !== undefined ? lVal : sVal;
    if (preferServer) return sVal !== undefined ? sVal : lVal;
    return lVal !== undefined ? lVal : sVal;
  };

  const localGirth =
    (localCase.girthEvaluations?.length ? localCase.girthEvaluations : localCase.girthMeasurements) || [];
  const serverGirth =
    (serverCase.girthEvaluations?.length ? serverCase.girthEvaluations : serverCase.girthMeasurements) || [];
  const mergedGirth = serverGirth.length >= localGirth.length ? (serverGirth.length ? serverGirth : localGirth) : localGirth;

  const mergedRom = mergeById(
    preferServer ? serverCase.romMeasurements : localCase.romMeasurements,
    preferServer ? localCase.romMeasurements : serverCase.romMeasurements
  );
  const mergedRtp = mergeById(
    preferServer ? serverCase.rtpEvaluations : localCase.rtpEvaluations,
    preferServer ? localCase.rtpEvaluations : serverCase.rtpEvaluations
  );
  const mergedVideos = mergeById(
    preferServer ? serverCase.videoAnalyses : localCase.videoAnalyses,
    preferServer ? localCase.videoAnalyses : serverCase.videoAnalyses
  );

  // For assignedExercises & sessions, choose the newer non-empty array or whichever is explicitly passed from the newer update
  const sExercises = Array.isArray(serverCase.assignedExercises) ? serverCase.assignedExercises : [];
  const lExercises = Array.isArray(localCase.assignedExercises) ? localCase.assignedExercises : [];
  const mergedExercises = preferServer && sExercises.length > 0 ? sExercises : lExercises.length > 0 ? lExercises : sExercises;

  const sSessions = Array.isArray(serverCase.sessions) ? serverCase.sessions : [];
  const lSessions = Array.isArray(localCase.sessions) ? localCase.sessions : [];
  const mergedSessions = mergeById(
    preferServer ? sSessions : lSessions,
    preferServer ? lSessions : sSessions
  ).sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

  const mergedPrograms =
    preferServer && serverCase.rehabPrograms?.length
      ? serverCase.rehabPrograms
      : localCase.rehabPrograms?.length
      ? localCase.rehabPrograms
      : serverCase.rehabPrograms || [];

  const mergedCriteriaStatus = {
    ...(localCase.phaseCriteriaStatus || {}),
    ...(serverCase.phaseCriteriaStatus || {}),
  };

  return {
    ...localCase,
    ...serverCase,
    name: pickScalar("name"),
    phone: pickScalar("phone"),
    email: pickScalar("email"),
    dateOfBirth: pickScalar("dateOfBirth"),
    gender: pickScalar("gender"),
    injuryType: pickScalar("injuryType"),
    injuredSide: pickScalar("injuredSide"),
    injuryDate: pickScalar("injuryDate"),
    surgeryDate: pickScalar("surgeryDate"),
    rehabStartDate: pickScalar("rehabStartDate"),
    mechanismOfInjury: pickScalar("mechanismOfInjury"),
    notes: pickScalar("notes"),
    status: pickScalar("status") || "active",
    isRestDay: pickScalar("isRestDay") ?? false,
    phaseCriteriaStatus: mergedCriteriaStatus,
    rehabPrograms: mergedPrograms,
    romMeasurements: mergedRom,
    girthEvaluations: mergedGirth,
    girthMeasurements: mergedGirth,
    assignedExercises: mergedExercises,
    sessions: mergedSessions,
    rtpEvaluations: mergedRtp,
    videoAnalyses: mergedVideos,
    appointments: mergeById(serverCase.appointments, localCase.appointments),
    exerciseSchedules: serverCase.exerciseSchedules || localCase.exerciseSchedules || [],
    updatedAt:
      preferServer
        ? serverCase.updatedAt || new Date().toISOString()
        : localCase.updatedAt || new Date().toISOString(),
  };
}

export async function fetchMergedCases(): Promise<any[]> {
  let serverData: any[] = [];
  try {
    const res = await fetch("/api/cases", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) serverData = data;
    }
  } catch (err) {
    console.warn("fetchMergedCases API fallback:", err);
  }

  const localData = getLocalCases();
  const deletedIds = new Set(getDeletedCaseIds());
  const map = new Map<string, any>();

  localData.forEach((c) => {
    if (c && c.id && !deletedIds.has(c.id)) {
      map.set(c.id, c);
    }
  });

  serverData.forEach((s) => {
    if (!s || !s.id || deletedIds.has(s.id)) return;
    const existing = map.get(s.id);
    map.set(s.id, existing ? mergeCaseRecords(existing, s) : s);
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  if (merged.length > 0) {
    safeWriteJson(LOCAL_CASES_KEY, merged);
  }

  return merged;
}

export async function fetchMergedRtp(patientId?: string): Promise<any[]> {
  let serverData: any[] = [];
  try {
    const url = patientId ? `/api/rtp?patientId=${encodeURIComponent(patientId)}` : "/api/rtp";
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) serverData = data;
    }
  } catch (err) {
    console.warn("fetchMergedRtp fallback:", err);
  }

  const localAll = safeReadJson<any[]>(LOCAL_RTP_KEY, []);
  const localFiltered = patientId ? localAll.filter((r) => r.patientId === patientId) : localAll;
  const merged = mergeById(serverData, localFiltered).sort(
    (a, b) =>
      new Date(b.evaluatedAt || b.createdAt || 0).getTime() -
      new Date(a.evaluatedAt || a.createdAt || 0).getTime()
  );
  return merged;
}

export async function fetchMergedVideoAnalyses(patientId?: string): Promise<any[]> {
  let serverData: any[] = [];
  try {
    const url = patientId
      ? `/api/video-analysis?patientId=${encodeURIComponent(patientId)}`
      : "/api/video-analysis";
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) serverData = data;
    }
  } catch (err) {
    console.warn("fetchMergedVideoAnalyses fallback:", err);
  }

  const localAll = safeReadJson<any[]>(LOCAL_VIDEO_ANALYSES_KEY, []);
  const localFiltered = patientId ? localAll.filter((v) => v.patientId === patientId) : localAll;
  const merged = mergeById(serverData, localFiltered).sort(
    (a, b) =>
      new Date(b.createdAt || b.evaluatedAt || 0).getTime() -
      new Date(a.createdAt || a.evaluatedAt || 0).getTime()
  );
  return merged;
}

export async function fetchMergedCaseById(id: string): Promise<any | null> {
  if (!id) return null;
  const localMatch = getLocalCases().find((c) => c.id === id) || null;

  const [caseRes, rtpList, videoList] = await Promise.all([
    fetch(`/api/cases/${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null),
    fetchMergedRtp(id),
    fetchMergedVideoAnalyses(id),
  ]);

  let serverMatch: any = null;
  if (caseRes && caseRes.ok) {
    serverMatch = await caseRes.json().catch(() => null);
  }

  const combinedBase = mergeCaseRecords(localMatch, serverMatch);
  if (!combinedBase) return null;

  const finalRtp = mergeById(rtpList, combinedBase.rtpEvaluations || []).sort(
    (a, b) =>
      new Date(b.evaluatedAt || b.createdAt || 0).getTime() -
      new Date(a.evaluatedAt || a.createdAt || 0).getTime()
  );
  const finalVideos = mergeById(videoList, combinedBase.videoAnalyses || []).sort(
    (a, b) =>
      new Date(b.createdAt || b.evaluatedAt || 0).getTime() -
      new Date(a.createdAt || a.evaluatedAt || 0).getTime()
  );

  const hydrated = {
    ...combinedBase,
    rtpEvaluations: finalRtp,
    videoAnalyses: finalVideos,
  };

  upsertLocalCase(hydrated);
  return hydrated;
}

export async function patchCaseWithSync(currentPatient: any, patch: Record<string, any>): Promise<any> {
  if (!currentPatient?.id) throw new Error("معرف المريض غير صالح");

  const optimisticPrograms = patch.phase
    ? [
        {
          id: `prog-${Date.now()}`,
          phase: patch.phase,
          isActive: true,
          notes: patch.phaseNotes || patch.rehabNotes || `انتقال إلى مرحلة: ${patch.phase}`,
          startDate: new Date().toISOString(),
        },
        ...(currentPatient.rehabPrograms || []).map((p: any) => ({ ...p, isActive: false })),
      ]
    : patch.rehabPrograms ?? currentPatient.rehabPrograms;

  const optimisticGirth =
    patch.girthEvaluations ??
    patch.girthMeasurements ??
    (currentPatient.girthEvaluations?.length
      ? currentPatient.girthEvaluations
      : currentPatient.girthMeasurements) ??
    [];

  const optimisticPatient = {
    ...currentPatient,
    ...patch,
    rehabPrograms: optimisticPrograms,
    girthEvaluations: optimisticGirth,
    girthMeasurements: optimisticGirth,
    updatedAt: new Date().toISOString(),
  };

  upsertLocalCase(optimisticPatient);

  try {
    const res = await fetch(`/api/cases/${encodeURIComponent(currentPatient.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, _baseSnapshot: currentPatient }),
    });
    if (res.ok) {
      const serverUpdated = await res.json().catch(() => null);
      if (serverUpdated) {
        const merged = mergeCaseRecords(optimisticPatient, serverUpdated);
        upsertLocalCase(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("patchCaseWithSync server fallback:", err);
  }

  return optimisticPatient;
}

export async function saveRtpWithSync(payload: any): Promise<any> {
  let savedRecord: any = null;
  const res = await fetch("/api/rtp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "فشل حفظ تقييم العودة للملعب في الخادم");
  }

  savedRecord = await res.json();

  // Save in local RTP evaluations list
  const existingRtp = safeReadJson<any[]>(LOCAL_RTP_KEY, []);
  safeWriteJson(LOCAL_RTP_KEY, [savedRecord, ...existingRtp.filter((r) => r.id !== savedRecord.id)]);

  // Attach directly to matching patient in local cases
  if (payload.patientId) {
    const localCase = getLocalCases().find((c) => c.id === payload.patientId);
    if (localCase) {
      const nextRtpList = [
        savedRecord,
        ...(localCase.rtpEvaluations || []).filter((r: any) => r.id !== savedRecord.id),
      ];
      upsertLocalCase({ ...localCase, rtpEvaluations: nextRtpList, updatedAt: new Date().toISOString() });
    }
  }

  return savedRecord;
}

export async function saveVideoAnalysisWithSync(payload: any): Promise<any> {
  let savedRecord: any = null;
  const res = await fetch("/api/video-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "فشل حفظ تحليل الذكاء الاصطناعي في الخادم");
  }

  savedRecord = await res.json();

  // Save in local video analyses list
  const existingVideos = safeReadJson<any[]>(LOCAL_VIDEO_ANALYSES_KEY, []);
  safeWriteJson(LOCAL_VIDEO_ANALYSES_KEY, [
    savedRecord,
    ...existingVideos.filter((v) => v.id !== savedRecord.id),
  ]);

  // Attach directly to matching patient in local cases
  if (payload.patientId) {
    const localCase = getLocalCases().find((c) => c.id === payload.patientId);
    if (localCase) {
      const nextList = [
        savedRecord,
        ...(localCase.videoAnalyses || []).filter((v: any) => v.id !== savedRecord.id),
      ];
      upsertLocalCase({ ...localCase, videoAnalyses: nextList, updatedAt: new Date().toISOString() });
    }
  }

  return savedRecord;
}
