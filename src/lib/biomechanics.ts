export interface ActiveMuscleItem {
  nameAr: string;
  nameEn: string;
  percentage: number;
  role: "primary" | "secondary" | "stabilizer";
}

export interface FullJointAngles {
  shoulder: {
    flexion: number;
    extension: number;
    abduction: number;
    adduction: number;
    internalRotation: number;
    externalRotation: number;
    horizontalAdduction: number;
  };
  scapula: {
    elevation: number;
    depression: number;
    protraction: number;
    retraction: number;
    upwardRotation: number;
    downwardRotation: number;
    posteriorTilt: number;
  };
  elbow: {
    flexion: number;
    extension: number;
    pronation: number;
    supination: number;
  };
  wrist: {
    flexion: number;
    extension: number;
    radialDeviation: number;
    ulnarDeviation: number;
  };
  spine: {
    flexion: number;
    extension: number;
    lateralFlexionRight: number;
    lateralFlexionLeft: number;
    rotationRight: number;
    rotationLeft: number;
  };
  ankle: {
    dorsiflexion: number;
    plantarflexion: number;
    inversion: number;
    eversion: number;
  };
  knee: {
    flexion: number;
    extension: number;
    valgus: number;
  };
  hip: {
    flexion: number;
    extension: number;
    abduction: number;
    adduction: number;
    internalRotation: number;
    externalRotation: number;
  };
}

export type JointKey = keyof FullJointAngles;

export interface MovementSpec {
  key: string;
  labelAr: string;
  labelEn: string;
  maxDeg: number;
  normalRange: string;
}

export interface JointCatalogEntry {
  joint: JointKey;
  region: "upper" | "lower" | "spine";
  titleAr: string;
  titleEn: string;
  movements: MovementSpec[];
}

export const JOINT_MOVEMENT_CATALOG: JointCatalogEntry[] = [
  {
    joint: "shoulder",
    region: "upper",
    titleAr: "مفصل الكتف",
    titleEn: "Shoulder Joint",
    movements: [
      { key: "flexion", labelAr: "ثني / رفع أمامي للكتف", labelEn: "Flexion", maxDeg: 180, normalRange: "0° - 180°" },
      { key: "extension", labelAr: "بسط / مد خلفي للكتف", labelEn: "Extension", maxDeg: 60, normalRange: "0° - 60°" },
      { key: "abduction", labelAr: "تبعيد الكتف للجانب", labelEn: "Abduction", maxDeg: 180, normalRange: "0° - 180°" },
      { key: "adduction", labelAr: "تقريب الكتف للداخل", labelEn: "Adduction", maxDeg: 50, normalRange: "0° - 45°" },
      { key: "externalRotation", labelAr: "تدوير خارجي للكتف", labelEn: "External Rotation", maxDeg: 90, normalRange: "0° - 90°" },
      { key: "internalRotation", labelAr: "تدوير داخلي للكتف", labelEn: "Internal Rotation", maxDeg: 90, normalRange: "0° - 70°" },
      { key: "horizontalAdduction", labelAr: "تقريب أفقي للكتف", labelEn: "Horizontal Adduction", maxDeg: 135, normalRange: "0° - 130°" },
    ],
  },
  {
    joint: "scapula",
    region: "upper",
    titleAr: "لوح الكتف",
    titleEn: "Scapulothoracic Joint",
    movements: [
      { key: "upwardRotation", labelAr: "دوران لأعلى للوح الكتف", labelEn: "Upward Rotation", maxDeg: 60, normalRange: "0° - 60°" },
      { key: "downwardRotation", labelAr: "دوران لأسفل للوح الكتف", labelEn: "Downward Rotation", maxDeg: 30, normalRange: "0° - 25°" },
      { key: "elevation", labelAr: "رفع لوح الكتف", labelEn: "Elevation", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "depression", labelAr: "خفض لوح الكتف", labelEn: "Depression", maxDeg: 25, normalRange: "0° - 20°" },
      { key: "protraction", labelAr: "تبعيد / إبعاد لوح الكتف", labelEn: "Protraction", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "retraction", labelAr: "ضم / تقريب لوح الكتف", labelEn: "Retraction", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "posteriorTilt", labelAr: "إمالة خلفية للوح الكتف", labelEn: "Posterior Tilt", maxDeg: 35, normalRange: "0° - 30°" },
    ],
  },
  {
    joint: "elbow",
    region: "upper",
    titleAr: "مفصل الكوع / المرفق",
    titleEn: "Elbow & Radioulnar",
    movements: [
      { key: "flexion", labelAr: "ثني الكوع", labelEn: "Flexion", maxDeg: 150, normalRange: "0° - 145°" },
      { key: "extension", labelAr: "مد / بسط الكوع", labelEn: "Extension", maxDeg: 15, normalRange: "0°" },
      { key: "pronation", labelAr: "كب الساعد للداخل", labelEn: "Forearm Pronation", maxDeg: 90, normalRange: "0° - 85°" },
      { key: "supination", labelAr: "بسط / تدوير الساعد للخارج", labelEn: "Forearm Supination", maxDeg: 90, normalRange: "0° - 85°" },
    ],
  },
  {
    joint: "wrist",
    region: "upper",
    titleAr: "مفصل الرسغ / الريست",
    titleEn: "Wrist Joint",
    movements: [
      { key: "flexion", labelAr: "ثني الرسغ للراحة", labelEn: "Flexion", maxDeg: 85, normalRange: "0° - 80°" },
      { key: "extension", labelAr: "بسط / مد الرسغ للخلف", labelEn: "Extension", maxDeg: 75, normalRange: "0° - 70°" },
      { key: "radialDeviation", labelAr: "انحراف كعبري (جهة الإبهام)", labelEn: "Radial Deviation", maxDeg: 25, normalRange: "0° - 20°" },
      { key: "ulnarDeviation", labelAr: "انحراف زندي (جهة الخنصر)", labelEn: "Ulnar Deviation", maxDeg: 40, normalRange: "0° - 35°" },
    ],
  },
  {
    joint: "spine",
    region: "spine",
    titleAr: "العمود الفقري والجذع",
    titleEn: "Spine & Trunk",
    movements: [
      { key: "flexion", labelAr: "انحناء العمود الفقري للأمام", labelEn: "Spinal Flexion", maxDeg: 80, normalRange: "0° - 60°" },
      { key: "extension", labelAr: "بسط / تقوس الظهر للخلف", labelEn: "Spinal Extension", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "lateralFlexionRight", labelAr: "ميل جانبي يمين", labelEn: "Right Lateral Flexion", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "lateralFlexionLeft", labelAr: "ميل جانبي يسار", labelEn: "Left Lateral Flexion", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "rotationRight", labelAr: "دوران الجذع يميناً", labelEn: "Right Rotation", maxDeg: 50, normalRange: "0° - 45°" },
      { key: "rotationLeft", labelAr: "دوران الجذع يساراً", labelEn: "Left Rotation", maxDeg: 50, normalRange: "0° - 45°" },
    ],
  },
  {
    joint: "knee",
    region: "lower",
    titleAr: "مفصل الركبة",
    titleEn: "Knee Joint",
    movements: [
      { key: "flexion", labelAr: "ثني الركبة", labelEn: "Knee Flexion", maxDeg: 140, normalRange: "0° - 135°" },
      { key: "extension", labelAr: "مد / بسط الركبة", labelEn: "Knee Extension", maxDeg: 15, normalRange: "0°" },
      { key: "valgus", labelAr: "انحراف الركبة الديناميكي", labelEn: "Dynamic Knee Valgus", maxDeg: 25, normalRange: "آمن < 8°" },
    ],
  },
  {
    joint: "hip",
    region: "lower",
    titleAr: "مفصل الورك / الحوض",
    titleEn: "Hip Joint",
    movements: [
      { key: "flexion", labelAr: "ثني الورك", labelEn: "Hip Flexion", maxDeg: 125, normalRange: "0° - 120°" },
      { key: "extension", labelAr: "بسط الورك للخلف", labelEn: "Hip Extension", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "abduction", labelAr: "تبعيد الورك", labelEn: "Hip Abduction", maxDeg: 50, normalRange: "0° - 45°" },
      { key: "adduction", labelAr: "تقريب الورك", labelEn: "Hip Adduction", maxDeg: 35, normalRange: "0° - 30°" },
      { key: "externalRotation", labelAr: "تدوير خارجي للورك", labelEn: "Hip External Rotation", maxDeg: 50, normalRange: "0° - 45°" },
      { key: "internalRotation", labelAr: "تدوير داخلي للورك", labelEn: "Hip Internal Rotation", maxDeg: 50, normalRange: "0° - 40°" },
    ],
  },
  {
    joint: "ankle",
    region: "lower",
    titleAr: "مفصل الكاحل والقدم",
    titleEn: "Ankle & Subtalar Joint",
    movements: [
      { key: "dorsiflexion", labelAr: "عطف ظهري للكاحل (Dorsiflexion)", labelEn: "Ankle Dorsiflexion", maxDeg: 45, normalRange: "≥ 20° وظيفياً" },
      { key: "plantarflexion", labelAr: "عطف أخمصي للأسفل (Plantarflexion)", labelEn: "Ankle Plantarflexion", maxDeg: 55, normalRange: "0° - 50°" },
      { key: "inversion", labelAr: "انقلاب القدم للداخل (Inversion)", labelEn: "Ankle Inversion", maxDeg: 40, normalRange: "0° - 35°" },
      { key: "eversion", labelAr: "انقلاب القدم للخارج (Eversion)", labelEn: "Ankle Eversion", maxDeg: 25, normalRange: "0° - 20°" },
    ],
  },
];

export const MANUAL_GONIOMETER_OPTIONS: { value: string; label: string }[] = [
  { value: "ثني الركبة Knee Flexion", label: "الركبة: ثني الركبة — Knee Flexion" },
  { value: "مد الركبة Knee Extension", label: "الركبة: مد الركبة — Knee Extension" },
  { value: "انحراف الركبة Knee Valgus", label: "الركبة: انحراف ديناميكي — Knee Valgus" },
  { value: "زاوية Q (Q-Angle)", label: "الركبة: زاوية Q (Q-Angle)" },
  { value: "ثني الورك Hip Flexion", label: "الورك: ثني الورك — Hip Flexion" },
  { value: "بسط الورك Hip Extension", label: "الورك: بسط الورك — Hip Extension" },
  { value: "تبعيد الورك Hip Abduction", label: "الورك: تبعيد الورك — Hip Abduction" },
  { value: "عطف ظهري للكاحل Ankle Dorsiflexion", label: "الكاحل: عطف ظهري — Ankle Dorsiflexion" },
  { value: "عطف أخمصي للكاحل Ankle Plantarflexion", label: "الكاحل: عطف أخمصي — Ankle Plantarflexion" },
  { value: "انقلاب الكاحل للداخل Ankle Inversion", label: "الكاحل: انقلاب للداخل — Ankle Inversion" },
  { value: "انقلاب الكاحل للخارج Ankle Eversion", label: "الكاحل: انقلاب للخارج — Ankle Eversion" },
  { value: "ثني الكتف Shoulder Flexion", label: "الكتف: رفع أمامي / ثني — Shoulder Flexion" },
  { value: "بسط الكتف Shoulder Extension", label: "الكتف: مد خلفي — Shoulder Extension" },
  { value: "تبعيد الكتف Shoulder Abduction", label: "الكتف: تبعيد جانبي — Shoulder Abduction" },
  { value: "تقريب الكتف Shoulder Adduction", label: "الكتف: تقريب — Shoulder Adduction" },
  { value: "تدوير الكتف الخارجي Shoulder ER", label: "الكتف: تدوير خارجي — Shoulder ER" },
  { value: "تدوير الكتف الداخلي Shoulder IR", label: "الكتف: تدوير داخلي — Shoulder IR" },
  { value: "دوران لوح الكتف لأعلى Scapula Upward Rotation", label: "لوح الكتف: دوران لأعلى — Scapula Upward Rotation" },
  { value: "تبعيد لوح الكتف Scapula Protraction", label: "لوح الكتف: تبعيد / ضم — Scapula Protraction/Retraction" },
  { value: "رفع لوح الكتف Scapula Elevation", label: "لوح الكتف: رفع / خفض — Scapula Elevation" },
  { value: "ثني الكوع Elbow Flexion", label: "الكوع: ثني — Elbow Flexion" },
  { value: "بسط الكوع Elbow Extension", label: "الكوع: مد — Elbow Extension" },
  { value: "كب وبسط الساعد Forearm Pronation/Supination", label: "الكوع/الساعد: كب وبسط — Pronation/Supination" },
  { value: "ثني الرسغ Wrist Flexion", label: "الرسغ: ثني — Wrist Flexion" },
  { value: "بسط الرسغ Wrist Extension", label: "الرسغ: بسط / مد — Wrist Extension" },
  { value: "انحراف الرسغ Wrist Radial/Ulnar Deviation", label: "الرسغ: انحراف كعبري / زندي — Wrist Deviation" },
  { value: "انحناء العمود الفقري Spine Flexion", label: "العمود الفقري: انحناء أمامي — Spine Flexion" },
  { value: "بسط العمود الفقري Spine Extension", label: "العمود الفقري: تقوس خلفي — Spine Extension" },
  { value: "ميل الجذع الجانبي Spine Lateral Flexion", label: "العمود الفقري: ميل جانبي — Lateral Flexion" },
  { value: "دوران العمود الفقري Spine Rotation", label: "العمود الفقري: دوران — Spine Rotation" },
];

export interface AIExercisePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  defaultPlane: "sagittal" | "frontal";
  focusRegion: "lower" | "upper" | "spine" | "all";
  targetMusclesHint: string;
  generateFrameBiometrics: (
    depthFactor: number,
    t: number,
    plane: "sagittal" | "frontal"
  ) => {
    fullAngles: FullJointAngles;
    activeMuscles: ActiveMuscleItem[];
  };
}

function emptyAngles(): FullJointAngles {
  return {
    shoulder: {
      flexion: 15,
      extension: 5,
      abduction: 12,
      adduction: 5,
      internalRotation: 10,
      externalRotation: 15,
      horizontalAdduction: 10,
    },
    scapula: {
      elevation: 4,
      depression: 2,
      protraction: 5,
      retraction: 6,
      upwardRotation: 8,
      downwardRotation: 3,
      posteriorTilt: 4,
    },
    elbow: { flexion: 12, extension: 0, pronation: 10, supination: 8 },
    wrist: { flexion: 5, extension: 8, radialDeviation: 3, ulnarDeviation: 5 },
    spine: {
      flexion: 10,
      extension: 4,
      lateralFlexionRight: 2,
      lateralFlexionLeft: 2,
      rotationRight: 3,
      rotationLeft: 3,
    },
    ankle: { dorsiflexion: 10, plantarflexion: 5, inversion: 4, eversion: 4 },
    knee: { flexion: 10, extension: 0, valgus: 3 },
    hip: {
      flexion: 15,
      extension: 5,
      abduction: 8,
      adduction: 4,
      internalRotation: 6,
      externalRotation: 8,
    },
  };
}

export const AI_EXERCISE_PRESETS: AIExercisePreset[] = [
  {
    id: "squat",
    nameAr: "تمرين السكوات العميق (القرفصاء)",
    nameEn: "Deep Squat & Lower Chain",
    defaultPlane: "sagittal",
    focusRegion: "lower",
    targetMusclesHint: "Quadriceps, Gluteals, Hamstrings, Calves & Erector Spinae",
    generateFrameBiometrics: (d, t, plane) => {
      const base = emptyAngles();
      base.knee.flexion = Math.round(15 + d * 90);
      base.knee.extension = Math.max(0, Math.round((1 - d) * 4));
      base.knee.valgus =
        plane === "frontal" ? Number((3.2 + d * 8.2).toFixed(1)) : Number((2 + d * 2.5).toFixed(1));
      base.hip.flexion = Math.round(20 + d * 78);
      base.hip.abduction = Math.round(8 + d * 12);
      base.hip.externalRotation = Math.round(8 + d * 10);
      base.ankle.dorsiflexion = Math.round(10 + d * 24);
      base.ankle.plantarflexion = Math.round(4 + (1 - d) * 6);
      base.ankle.inversion = Number((3 + d * 4).toFixed(1));
      base.ankle.eversion = Number((4 + d * 5.5).toFixed(1));
      base.spine.flexion = Math.round(10 + d * 28);
      base.spine.extension = Math.round(6 + d * 8);
      base.spine.lateralFlexionRight = Number((1.2 + Math.abs(Math.sin(t * 1.5)) * 2).toFixed(1));
      base.spine.lateralFlexionLeft = Number((1.1 + Math.abs(Math.cos(t * 1.5)) * 2).toFixed(1));
      base.shoulder.flexion = Math.round(30 + d * 55);
      base.scapula.upwardRotation = Math.round(8 + d * 16);
      base.scapula.retraction = Math.round(8 + d * 10);
      base.elbow.flexion = Math.round(15 + d * 25);
      base.wrist.extension = Math.round(8 + d * 10);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "عضلة الفخذ الرباعية (Quadriceps)", nameEn: "Quadriceps", percentage: Math.min(98, Math.round(40 + d * 55)), role: "primary" },
        { nameAr: "عضلات الأرداف الكبرى والوسطى (Gluteus Max/Med)", nameEn: "Gluteals", percentage: Math.min(96, Math.round(38 + d * 54)), role: "primary" },
        { nameAr: "عضلات العمود الفقري المقومة (Erector Spinae)", nameEn: "Erector Spinae", percentage: Math.min(88, Math.round(35 + d * 45)), role: "stabilizer" },
        { nameAr: "عضلات الفخذ الخلفية (Hamstrings)", nameEn: "Hamstrings", percentage: Math.min(85, Math.round(28 + d * 46)), role: "secondary" },
        { nameAr: "عضلة السمانة النعلية (Soleus & Gastrocnemius)", nameEn: "Calves", percentage: Math.min(82, Math.round(25 + d * 44)), role: "secondary" },
        { nameAr: "عضلات البطن العميقة (Transverse Abdominis)", nameEn: "Deep Core", percentage: Math.min(80, Math.round(32 + d * 38)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "drop_jump",
    nameAr: "هبوط القفز وتحليل الرباط الصليبي (Drop Jump / ACL)",
    nameEn: "Drop Jump Landing Mechanics",
    defaultPlane: "frontal",
    focusRegion: "lower",
    targetMusclesHint: "Gluteals, Quadriceps, Hamstrings, Calves & Core",
    generateFrameBiometrics: (d, t, plane) => {
      const base = emptyAngles();
      base.knee.flexion = Math.round(10 + d * 80);
      base.knee.valgus =
        plane === "frontal" ? Number((3.5 + d * 9.2).toFixed(1)) : Number((2.5 + d * 3.5).toFixed(1));
      base.hip.flexion = Math.round(15 + d * 68);
      base.hip.adduction = Math.round(3 + d * 9);
      base.hip.internalRotation = Math.round(4 + d * 10);
      base.ankle.dorsiflexion = Math.round(12 + d * 22);
      base.ankle.plantarflexion = Math.round(18 * (1 - d));
      base.ankle.eversion = Number((4 + d * 7).toFixed(1));
      base.ankle.inversion = Number((3 + (1 - d) * 6).toFixed(1));
      base.spine.flexion = Math.round(12 + d * 24);
      base.spine.lateralFlexionRight = Number((1.5 + d * 4.5).toFixed(1));
      base.shoulder.abduction = Math.round(20 + d * 45);
      base.elbow.flexion = Math.round(25 + d * 40);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "عضلة الألوية الوسطى لمقاومة انحراف الركبة (Gluteus Medius)", nameEn: "Gluteus Medius", percentage: Math.min(97, Math.round(45 + d * 50)), role: "primary" },
        { nameAr: "عضلة الفخذ الرباعية — امتصاص صدمة الهبوط (Quadriceps Eccentric)", nameEn: "Quadriceps", percentage: Math.min(95, Math.round(42 + d * 50)), role: "primary" },
        { nameAr: "العضلات الخلفية لحماية الرباط الصليبي (Hamstrings Co-activation)", nameEn: "Hamstrings", percentage: Math.min(90, Math.round(36 + d * 48)), role: "primary" },
        { nameAr: "عضلات السمانة ومثبتات الكاحل (Gastrocnemius & Peroneals)", nameEn: "Calves & Peroneals", percentage: Math.min(88, Math.round(34 + d * 46)), role: "secondary" },
        { nameAr: "عضلات ثبات الجذع والحوض (Core & Quadratus Lumborum)", nameEn: "Core Stabilizers", percentage: Math.min(84, Math.round(30 + d * 44)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "overhead_press",
    nameAr: "تأهيل الكتف والرفع العلوي (Overhead & Scapula)",
    nameEn: "Overhead Shoulder & Scapular Elevation",
    defaultPlane: "sagittal",
    focusRegion: "upper",
    targetMusclesHint: "Deltoids, Rotator Cuff, Serratus Anterior, Trapezius, Triceps & Forearm",
    generateFrameBiometrics: (d, t) => {
      const base = emptyAngles();
      base.shoulder.flexion = Math.round(25 + d * 145);
      base.shoulder.abduction = Math.round(20 + d * 140);
      base.shoulder.externalRotation = Math.round(15 + d * 62);
      base.shoulder.internalRotation = Math.round(12 + (1 - d) * 20);
      base.shoulder.extension = Math.round(5 + (1 - d) * 12);
      base.shoulder.horizontalAdduction = Math.round(10 + d * 25);
      base.scapula.upwardRotation = Math.round(8 + d * 48);
      base.scapula.posteriorTilt = Math.round(5 + d * 22);
      base.scapula.elevation = Math.round(4 + d * 18);
      base.scapula.depression = Math.round(6 + (1 - d) * 8);
      base.scapula.protraction = Math.round(6 + d * 14);
      base.scapula.retraction = Math.round(8 + (1 - d) * 14);
      base.elbow.flexion = Math.round(95 - d * 80);
      base.elbow.extension = d > 0.8 ? 0 : Math.round((1 - d) * 10);
      base.elbow.pronation = Math.round(15 + d * 45);
      base.elbow.supination = Math.round(25 * (1 - d));
      base.wrist.extension = Math.round(10 + d * 22);
      base.wrist.flexion = Math.round(5 + (1 - d) * 10);
      base.wrist.radialDeviation = Math.round(4 + d * 8);
      base.wrist.ulnarDeviation = Math.round(6 + (1 - d) * 8);
      base.spine.extension = Math.round(5 + d * 14);
      base.spine.flexion = Math.round(4 + Math.abs(Math.sin(t)) * 4);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "العضلة الدالية الأمامية والجانبية (Anterior & Lateral Deltoid)", nameEn: "Deltoids", percentage: Math.min(98, Math.round(35 + d * 60)), role: "primary" },
        { nameAr: "عضلات الكفة المدورة (Supraspinatus & Infraspinatus)", nameEn: "Rotator Cuff", percentage: Math.min(92, Math.round(38 + d * 50)), role: "primary" },
        { nameAr: "العضلة المنشارية الأمامية وشبه المنحرفة السفلية (Serratus & Lower Trap)", nameEn: "Scapular Stabilizers", percentage: Math.min(90, Math.round(32 + d * 52)), role: "stabilizer" },
        { nameAr: "العضلة ثلاثية الرؤوس العضدية (Triceps Brachii)", nameEn: "Triceps", percentage: Math.min(86, Math.round(25 + d * 55)), role: "secondary" },
        { nameAr: "باسطات وقابضات الرسغ والقبضة (Forearm & Wrist Stabilizers)", nameEn: "Forearm & Wrist", percentage: Math.min(76, Math.round(28 + d * 40)), role: "stabilizer" },
        { nameAr: "عضلات الجذع والبطن لمنع تقوس الظهر (Abdominals & Core)", nameEn: "Core Bracing", percentage: Math.min(82, Math.round(35 + d * 42)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "shoulder_rehab",
    nameAr: "تدوير وتبعيد الكتف ولوح الكتف (Rotator Cuff & Scapula)",
    nameEn: "Rotator Cuff ER/IR & Scaption",
    defaultPlane: "frontal",
    focusRegion: "upper",
    targetMusclesHint: "Rotator Cuff, Rhomboids, Trapezius, Deltoid & Forearm",
    generateFrameBiometrics: (d) => {
      const base = emptyAngles();
      base.shoulder.externalRotation = Math.round(10 + d * 72);
      base.shoulder.internalRotation = Math.round(15 + (1 - d) * 45);
      base.shoulder.abduction = Math.round(20 + d * 75);
      base.shoulder.flexion = Math.round(20 + d * 65);
      base.shoulder.adduction = Math.round(5 + (1 - d) * 20);
      base.scapula.retraction = Math.round(8 + d * 20);
      base.scapula.upwardRotation = Math.round(6 + d * 24);
      base.scapula.posteriorTilt = Math.round(4 + d * 18);
      base.scapula.depression = Math.round(6 + d * 12);
      base.elbow.flexion = Math.round(85 + Math.round(d * 8));
      base.elbow.supination = Math.round(25 + d * 45);
      base.elbow.pronation = Math.round(15 + (1 - d) * 20);
      base.wrist.extension = Math.round(10 + d * 15);
      base.wrist.radialDeviation = Math.round(5 + d * 10);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "عضلات الكفة المدورة الخارجية (Infraspinatus & Teres Minor)", nameEn: "External Rotators", percentage: Math.min(96, Math.round(40 + d * 55)), role: "primary" },
        { nameAr: "المعينية ووسط/أسفل شبه المنحرفة (Rhomboids & Mid/Lower Trap)", nameEn: "Rhomboids & Trap", percentage: Math.min(92, Math.round(34 + d * 52)), role: "primary" },
        { nameAr: "العضلة تحت الكتفية وفوق الشوكة (Subscapularis & Supraspinatus)", nameEn: "Cuff Stabilizers", percentage: Math.min(88, Math.round(32 + d * 48)), role: "stabilizer" },
        { nameAr: "العضلة الدالية الخلفية والجانبية (Posterior & Mid Deltoid)", nameEn: "Deltoid", percentage: Math.min(82, Math.round(26 + d * 46)), role: "secondary" },
        { nameAr: "عضلات الساعد والرسغ المثبتة (Wrist & Forearm Extensors)", nameEn: "Wrist Stabilizers", percentage: Math.min(72, Math.round(24 + d * 38)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "elbow_wrist_rehab",
    nameAr: "تأهيل الكوع والرسغ والساعد (Elbow & Wrist ROM/Load)",
    nameEn: "Elbow Flexion/Pronation & Wrist Rehab",
    defaultPlane: "sagittal",
    focusRegion: "upper",
    targetMusclesHint: "Biceps, Triceps, Brachioradialis, Pronators & Wrist Flexors/Extensors",
    generateFrameBiometrics: (d) => {
      const base = emptyAngles();
      base.elbow.flexion = Math.round(15 + d * 125);
      base.elbow.extension = Math.round((1 - d) * 10);
      base.elbow.pronation = Math.round(10 + d * 68);
      base.elbow.supination = Math.round(10 + (1 - d) * 65);
      base.wrist.flexion = Math.round(10 + d * 60);
      base.wrist.extension = Math.round(10 + (1 - d) * 58);
      base.wrist.radialDeviation = Math.round(4 + d * 16);
      base.wrist.ulnarDeviation = Math.round(5 + d * 26);
      base.shoulder.flexion = Math.round(18 + d * 22);
      base.scapula.retraction = 12;

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "العضلة ذات الرأسين والعضدية (Biceps Brachii & Brachialis)", nameEn: "Biceps & Brachialis", percentage: Math.min(96, Math.round(38 + d * 55)), role: "primary" },
        { nameAr: "باسطات الرسغ والأصابع (Extensor Carpi Radialis/Ulnaris)", nameEn: "Wrist Extensors", percentage: Math.min(92, Math.round(36 + d * 50)), role: "primary" },
        { nameAr: "قابضات الرسغ والساعد (Flexor Carpi & Pronator Teres)", nameEn: "Wrist Flexors & Pronators", percentage: Math.min(89, Math.round(34 + d * 48)), role: "secondary" },
        { nameAr: "العضلة ثلاثية الرؤوس العضدية والمرفقية (Triceps & Anconeus)", nameEn: "Triceps", percentage: Math.min(80, Math.round(28 + (1 - d) * 45)), role: "secondary" },
        { nameAr: "العضلة العضدية الكعبرية وباسطات الساعد (Brachioradialis & Supinator)", nameEn: "Brachioradialis", percentage: Math.min(84, Math.round(30 + d * 46)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "spine_mobility",
    nameAr: "تأهيل العمود الفقري والجذع (Spine Flexion/Extension/Rotation)",
    nameEn: "Spinal Mobility & Trunk Control",
    defaultPlane: "sagittal",
    focusRegion: "spine",
    targetMusclesHint: "Erector Spinae, Multifidus, Rectus/Transverse Abdominis, Obliques & Glutes",
    generateFrameBiometrics: (d, t) => {
      const base = emptyAngles();
      base.spine.flexion = Math.round(10 + d * 55);
      base.spine.extension = Math.round(5 + (1 - d) * 22);
      base.spine.lateralFlexionRight = Number((4 + Math.max(0, Math.sin(t * 1.4)) * 22).toFixed(1));
      base.spine.lateralFlexionLeft = Number((4 + Math.max(0, -Math.sin(t * 1.4)) * 22).toFixed(1));
      base.spine.rotationRight = Number((5 + Math.max(0, Math.cos(t * 1.3)) * 34).toFixed(1));
      base.spine.rotationLeft = Number((5 + Math.max(0, -Math.cos(t * 1.3)) * 34).toFixed(1));
      base.hip.flexion = Math.round(15 + d * 52);
      base.hip.extension = Math.round(5 + (1 - d) * 18);
      base.scapula.retraction = Math.round(8 + (1 - d) * 16);
      base.scapula.protraction = Math.round(6 + d * 18);
      base.shoulder.flexion = Math.round(15 + d * 40);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "العضلات المقومة للفقرات والعديدة الفلوح (Erector Spinae & Multifidus)", nameEn: "Erector Spinae & Multifidus", percentage: Math.min(96, Math.round(42 + d * 50)), role: "primary" },
        { nameAr: "العضلات المائلة للبطن لتدوير الجذع (Internal & External Obliques)", nameEn: "Abdominal Obliques", percentage: Math.min(90, Math.round(35 + d * 48)), role: "primary" },
        { nameAr: "العضلة المستعرضة للبطن لحماية الفقرات (Transverse Abdominis)", nameEn: "Transverse Abdominis", percentage: Math.min(88, Math.round(38 + d * 45)), role: "stabilizer" },
        { nameAr: "عضلات الألوية والأوتار الخلفية لدعم الحوض (Gluteus & Hamstrings)", nameEn: "Pelvic Support", percentage: Math.min(82, Math.round(30 + d * 44)), role: "secondary" },
        { nameAr: "العضلة الظهرية العريضة وشبه المنحرفة (Latissimus Dorsi)", nameEn: "Lats & Mid-Back", percentage: Math.min(76, Math.round(25 + d * 40)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "ankle_balance",
    nameAr: "تأهيل الكاحل والتوازن والهبوط (Ankle & Foot Kinematics)",
    nameEn: "Ankle Dorsiflexion, Inversion/Eversion & Balance",
    defaultPlane: "frontal",
    focusRegion: "lower",
    targetMusclesHint: "Tibialis Anterior/Posterior, Peroneals, Gastrocnemius, Soleus & Foot Intrinsics",
    generateFrameBiometrics: (d, t) => {
      const base = emptyAngles();
      base.ankle.dorsiflexion = Math.round(10 + d * 28);
      base.ankle.plantarflexion = Math.round(8 + (1 - d) * 34);
      base.ankle.inversion = Number((5 + Math.max(0, Math.sin(t * 2)) * 22).toFixed(1));
      base.ankle.eversion = Number((4 + Math.max(0, -Math.sin(t * 2)) * 14).toFixed(1));
      base.knee.flexion = Math.round(12 + d * 45);
      base.knee.valgus = Number((2.5 + d * 4.5).toFixed(1));
      base.hip.flexion = Math.round(12 + d * 32);
      base.hip.abduction = Math.round(8 + d * 12);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "العضلات الشظوية لمنع التواء الكاحل (Peroneus Longus & Brevis)", nameEn: "Peroneals", percentage: Math.min(96, Math.round(42 + d * 52)), role: "primary" },
        { nameAr: "عضلة السمانة والوتر العرقوبي (Gastrocnemius & Soleus)", nameEn: "Calf Complex", percentage: Math.min(94, Math.round(38 + d * 52)), role: "primary" },
        { nameAr: "القصبية الأمامية والخلفية لدعم قوس القدم (Tibialis Ant/Post)", nameEn: "Tibialis Ant & Post", percentage: Math.min(90, Math.round(36 + d * 46)), role: "primary" },
        { nameAr: "العضلات الداخلية لثبات قوس القدم (Intrinsic Foot Muscles)", nameEn: "Foot Intrinsics", percentage: Math.min(84, Math.round(30 + d * 46)), role: "stabilizer" },
        { nameAr: "عضلات الألوية لتثبيت محور الساق (Gluteus Medius)", nameEn: "Gluteus Medius", percentage: Math.min(78, Math.round(28 + d * 40)), role: "stabilizer" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
  {
    id: "custom",
    nameAr: "تقييم حركي شامل مخصص (كامل الجسم)",
    nameEn: "Full-Body Multi-Joint Analysis",
    defaultPlane: "sagittal",
    focusRegion: "all",
    targetMusclesHint: "Full Kinematic Chain (Upper, Spine & Lower)",
    generateFrameBiometrics: (d, t, plane) => {
      const base = emptyAngles();
      base.shoulder.flexion = Math.round(25 + d * 115);
      base.shoulder.abduction = Math.round(20 + d * 95);
      base.shoulder.extension = Math.round(8 + (1 - d) * 20);
      base.shoulder.adduction = Math.round(6 + (1 - d) * 14);
      base.shoulder.externalRotation = Math.round(15 + d * 45);
      base.shoulder.internalRotation = Math.round(12 + (1 - d) * 30);
      base.shoulder.horizontalAdduction = Math.round(10 + d * 45);
      base.scapula.upwardRotation = Math.round(8 + d * 34);
      base.scapula.downwardRotation = Math.round(4 + (1 - d) * 14);
      base.scapula.elevation = Math.round(5 + d * 14);
      base.scapula.depression = Math.round(4 + (1 - d) * 10);
      base.scapula.protraction = Math.round(6 + d * 16);
      base.scapula.retraction = Math.round(8 + (1 - d) * 16);
      base.scapula.posteriorTilt = Math.round(5 + d * 18);
      base.elbow.flexion = Math.round(18 + d * 88);
      base.elbow.extension = Math.round((1 - d) * 6);
      base.elbow.pronation = Math.round(15 + d * 40);
      base.elbow.supination = Math.round(12 + (1 - d) * 35);
      base.wrist.flexion = Math.round(8 + d * 36);
      base.wrist.extension = Math.round(10 + d * 32);
      base.wrist.radialDeviation = Math.round(4 + d * 12);
      base.wrist.ulnarDeviation = Math.round(5 + d * 16);
      base.spine.flexion = Math.round(10 + d * 36);
      base.spine.extension = Math.round(6 + (1 - d) * 14);
      base.spine.lateralFlexionRight = Number((2 + Math.max(0, Math.sin(t * 1.4)) * 12).toFixed(1));
      base.spine.lateralFlexionLeft = Number((2 + Math.max(0, -Math.sin(t * 1.4)) * 12).toFixed(1));
      base.spine.rotationRight = Number((3 + Math.max(0, Math.cos(t * 1.2)) * 18).toFixed(1));
      base.spine.rotationLeft = Number((3 + Math.max(0, -Math.cos(t * 1.2)) * 18).toFixed(1));
      base.ankle.dorsiflexion = Math.round(10 + d * 24);
      base.ankle.plantarflexion = Math.round(8 + (1 - d) * 22);
      base.ankle.inversion = Number((4 + d * 10).toFixed(1));
      base.ankle.eversion = Number((4 + d * 8).toFixed(1));
      base.knee.flexion = Math.round(15 + d * 85);
      base.knee.extension = Math.round((1 - d) * 5);
      base.knee.valgus =
        plane === "frontal" ? Number((3.5 + d * 8.5).toFixed(1)) : Number((2 + d * 3).toFixed(1));
      base.hip.flexion = Math.round(20 + d * 70);
      base.hip.extension = Math.round(6 + (1 - d) * 16);
      base.hip.abduction = Math.round(10 + d * 20);
      base.hip.adduction = Math.round(5 + (1 - d) * 12);
      base.hip.externalRotation = Math.round(10 + d * 22);
      base.hip.internalRotation = Math.round(8 + (1 - d) * 18);

      const activeMuscles: ActiveMuscleItem[] = [
        { nameAr: "عضلات الفخذ والأرداف (Quadriceps & Gluteals)", nameEn: "Lower Prime Movers", percentage: Math.min(96, Math.round(38 + d * 54)), role: "primary" },
        { nameAr: "عضلات الكتف والكفة المدورة (Deltoids & Rotator Cuff)", nameEn: "Shoulder & Cuff", percentage: Math.min(90, Math.round(30 + d * 54)), role: "primary" },
        { nameAr: "عضلات العمود الفقري والجذع (Erector Spinae & Core)", nameEn: "Spine & Core", percentage: Math.min(88, Math.round(34 + d * 48)), role: "stabilizer" },
        { nameAr: "مثبتات لوح الكتف والظهر (Scapular Stabilizers)", nameEn: "Scapula & Traps", percentage: Math.min(82, Math.round(28 + d * 44)), role: "stabilizer" },
        { nameAr: "عضلات السمانة ومثبتات الكاحل (Calves & Peroneals)", nameEn: "Ankle & Calves", percentage: Math.min(80, Math.round(26 + d * 44)), role: "secondary" },
        { nameAr: "عضلات الذراع والساعد والرسغ (Biceps, Triceps & Forearms)", nameEn: "Arm & Forearm", percentage: Math.min(75, Math.round(24 + d * 42)), role: "secondary" },
      ];
      return { fullAngles: base, activeMuscles };
    },
  },
];

export function normalizeJointAngles(raw: any): FullJointAngles {
  const base = emptyAngles();
  if (!raw || typeof raw !== "object") return base;

  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Already nested FullJointAngles structure
  if (raw.shoulder && typeof raw.shoulder === "object" && "flexion" in raw.shoulder) {
    return {
      shoulder: { ...base.shoulder, ...raw.shoulder },
      scapula: { ...base.scapula, ...(raw.scapula || {}) },
      elbow: { ...base.elbow, ...(raw.elbow || {}) },
      wrist: { ...base.wrist, ...(raw.wrist || {}) },
      spine: { ...base.spine, ...(raw.spine || {}) },
      ankle: { ...base.ankle, ...(raw.ankle || {}) },
      knee: { ...base.knee, ...(raw.knee || {}) },
      hip: { ...base.hip, ...(raw.hip || {}) },
    };
  }

  // Legacy flat structure mapping
  return {
    shoulder: {
      ...base.shoulder,
      flexion: num(raw.shoulderAngle ?? raw.shoulder?.right, base.shoulder.flexion),
      abduction: num(raw.shoulder?.left, base.shoulder.abduction),
    },
    scapula: {
      ...base.scapula,
      upwardRotation: num(raw.scapulaAngle, base.scapula.upwardRotation),
    },
    elbow: {
      ...base.elbow,
      flexion: num(raw.elbowAngle ?? raw.elbow?.right, base.elbow.flexion),
    },
    wrist: {
      ...base.wrist,
      extension: num(raw.wristAngle ?? raw.wrist?.right, base.wrist.extension),
    },
    spine: {
      ...base.spine,
      flexion: num(raw.spineFlexion ?? raw.spine?.flexion, base.spine.flexion),
      lateralFlexionRight: num(raw.trunkLateralLean, base.spine.lateralFlexionRight),
    },
    ankle: {
      ...base.ankle,
      dorsiflexion: num(raw.ankleDorsiflexion ?? raw.ankle?.right, base.ankle.dorsiflexion),
    },
    knee: {
      ...base.knee,
      flexion: num(raw.kneeFlexion ?? raw.knee?.right, base.knee.flexion),
      valgus: num(raw.valgusAngle, base.knee.valgus),
    },
    hip: {
      ...base.hip,
      flexion: num(raw.hipFlexion, base.hip.flexion),
    },
  };
}

export interface ComparisonMetricRow {
  id: string;
  jointAr: string;
  movementAr: string;
  baselineVal: number;
  latestVal: number;
  delta: number;
  lowerIsBetter?: boolean;
}

export function computeSessionComparison(
  baselineAnalysis: any,
  latestAnalysis: any
): ComparisonMetricRow[] {
  const b = normalizeJointAngles(baselineAnalysis?.jointAngles);
  const l = normalizeJointAngles(latestAnalysis?.jointAngles);

  const pairs: Array<{
    id: string;
    jointAr: string;
    movementAr: string;
    bVal: number;
    lVal: number;
    lowerIsBetter?: boolean;
  }> = [
    { id: "knee_flex", jointAr: "الركبة", movementAr: "ثني الركبة (Flexion)", bVal: b.knee.flexion, lVal: l.knee.flexion },
    { id: "knee_valgus", jointAr: "الركبة", movementAr: "انحراف الركبة (Valgus)", bVal: b.knee.valgus, lVal: l.knee.valgus, lowerIsBetter: true },
    { id: "hip_flex", jointAr: "الورك", movementAr: "ثني الورك (Flexion)", bVal: b.hip.flexion, lVal: l.hip.flexion },
    { id: "hip_abd", jointAr: "الورك", movementAr: "تبعيد الورك (Abduction)", bVal: b.hip.abduction, lVal: l.hip.abduction },
    { id: "ankle_df", jointAr: "الكاحل", movementAr: "عطف ظهري (Dorsiflexion)", bVal: b.ankle.dorsiflexion, lVal: l.ankle.dorsiflexion },
    { id: "ankle_pf", jointAr: "الكاحل", movementAr: "عطف أخمصي (Plantarflexion)", bVal: b.ankle.plantarflexion, lVal: l.ankle.plantarflexion },
    { id: "ankle_inv", jointAr: "الكاحل", movementAr: "انقلاب داخلي (Inversion)", bVal: b.ankle.inversion, lVal: l.ankle.inversion },
    { id: "ankle_ev", jointAr: "الكاحل", movementAr: "انقلاب خارجي (Eversion)", bVal: b.ankle.eversion, lVal: l.ankle.eversion },
    { id: "sh_flex", jointAr: "الكتف", movementAr: "رفع أمامي (Flexion)", bVal: b.shoulder.flexion, lVal: l.shoulder.flexion },
    { id: "sh_abd", jointAr: "الكتف", movementAr: "تبعيد (Abduction)", bVal: b.shoulder.abduction, lVal: l.shoulder.abduction },
    { id: "sh_er", jointAr: "الكتف", movementAr: "تدوير خارجي (ER)", bVal: b.shoulder.externalRotation, lVal: l.shoulder.externalRotation },
    { id: "sh_ir", jointAr: "الكتف", movementAr: "تدوير داخلي (IR)", bVal: b.shoulder.internalRotation, lVal: l.shoulder.internalRotation },
    { id: "scap_up", jointAr: "لوح الكتف", movementAr: "دوران لأعلى (Upward Rot)", bVal: b.scapula.upwardRotation, lVal: l.scapula.upwardRotation },
    { id: "scap_ret", jointAr: "لوح الكتف", movementAr: "ضم اللوح (Retraction)", bVal: b.scapula.retraction, lVal: l.scapula.retraction },
    { id: "elb_flex", jointAr: "الكوع", movementAr: "ثني الكوع (Flexion)", bVal: b.elbow.flexion, lVal: l.elbow.flexion },
    { id: "elb_pro", jointAr: "الكوع", movementAr: "كب الساعد (Pronation)", bVal: b.elbow.pronation, lVal: l.elbow.pronation },
    { id: "elb_sup", jointAr: "الكوع", movementAr: "بسط الساعد (Supination)", bVal: b.elbow.supination, lVal: l.elbow.supination },
    { id: "wri_flex", jointAr: "الرسغ", movementAr: "ثني الرسغ (Flexion)", bVal: b.wrist.flexion, lVal: l.wrist.flexion },
    { id: "wri_ext", jointAr: "الرسغ", movementAr: "بسط الرسغ (Extension)", bVal: b.wrist.extension, lVal: l.wrist.extension },
    { id: "spi_flex", jointAr: "العمود الفقري", movementAr: "انحناء أمامي (Flexion)", bVal: b.spine.flexion, lVal: l.spine.flexion },
    { id: "spi_rot", jointAr: "العمود الفقري", movementAr: "دوران يمين (Rotation R)", bVal: b.spine.rotationRight, lVal: l.spine.rotationRight },
  ];

  return pairs.map((p) => ({
    id: p.id,
    jointAr: p.jointAr,
    movementAr: p.movementAr,
    baselineVal: Number(Number(p.bVal || 0).toFixed(1)),
    latestVal: Number(Number(p.lVal || 0).toFixed(1)),
    delta: Number((Number(p.lVal || 0) - Number(p.bVal || 0)).toFixed(1)),
    lowerIsBetter: p.lowerIsBetter,
  }));
}
