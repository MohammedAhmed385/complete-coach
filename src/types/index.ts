export type { 
  User, Patient, ROMMeasurement, GirthEvaluation, GirthMeasurement,
  RehabProgram, ProgramExercise, Exercise, ExerciseSchedule, ScheduleExercise,
  InjuryProtocol, ProtocolPhase, ProtocolExercise,
  Appointment, ClinicHours, RTPEvaluation, RTPCriterion,
  OnlineConsultation, VideoAnalysis, SavedPaper,
  PageVisit, VisitorSession, VisitorHeartbeat
} from "@prisma/client";

export interface NavItem {
  label: string;
  labelEn: string;
  href: string;
  icon: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  doi?: string;
}

export interface TimeSeriesPoint {
  date: string;
  visits: number;
  unique: number;
}

export interface AnalyticsKPIs {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  todayUnique: number;
  liveActive: number;
  avgDuration: number;
  bounceRate: number;
  prevVisits: number;
  prevUnique: number;
  visitChange: number;
  uniqueChange: number;
}

export interface ROMEntry {
  joint: string;
  movement: string;
  injuredAngle: number;
  healthyAngle?: number;
  notes?: string;
}

export interface GirthEntry {
  distanceCm: number;
  injuredCm: number;
  healthyCm?: number;
}

export const JOINTS = [
  "Knee", "Hip", "Ankle", "Shoulder", "Elbow", "Wrist",
  "Cervical", "Thoracic", "Lumbar",
] as const;

export const MOVEMENTS = [
  "Flexion", "Extension", "Abduction", "Adduction",
  "Internal Rotation", "External Rotation",
  "Lateral Flexion", "Rotation",
] as const;

export const REHAB_PHASES = [
  "ACUTE", "RESTORE_ROM", "STRENGTH",
  "NEUROMUSCULAR", "FUNCTIONAL", "RETURN_TO_SPORT",
] as const;

export const ISOMETRIC_ANGLES = [0, 30, 45, 60, 90] as const;

export const GIRTH_DISTANCES = [0, 5, 10, 15, 20, 25, 30] as const;

export const LANDMARKS = [
  "فوق الرضفة — Above Patella",
  "منتصف الفخذ — Mid-Thigh",
  "أعلى الفخذ — Upper Thigh",
  "أسفل الركبة — Below Knee",
  "منتصف الساق — Mid-Calf",
  "الكاحل — Ankle",
  "الذراع — Upper Arm",
  "الساعد — Forearm",
] as const;

export const DAYS_AR: Record<string, string> = {
  SUN: "الأحد",
  MON: "الاثنين",
  TUE: "الثلاثاء",
  WED: "الأربعاء",
  THU: "الخميس",
  FRI: "الجمعة",
  SAT: "السبت",
};
