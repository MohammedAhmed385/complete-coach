export interface RehabPhaseOption {
  key:
    | "ACUTE"
    | "RESTORE_ROM"
    | "STRENGTH"
    | "NEUROMUSCULAR"
    | "FUNCTIONAL"
    | "RETURN_TO_SPORT";
  order: number;
  ar: string;
  en: string;
  desc: string;
}

export const REHAB_PHASES: RehabPhaseOption[] = [
  {
    key: "ACUTE",
    order: 1,
    ar: "المرحلة الحادة والتحكم بالألم",
    en: "Acute / Protection",
    desc: "السيطرة على التورم والألم وحماية الأنسجة الملتئمة وتفعيل الانقباض الآمن",
  },
  {
    key: "RESTORE_ROM",
    order: 2,
    ar: "استعادة المدى الحركي الكامل",
    en: "Restore ROM & Mobility",
    desc: "استعادة المدى الحركي الكامل النشط والسلبي وميكانيكا المفصل الطبيعية",
  },
  {
    key: "STRENGTH",
    order: 3,
    ar: "التقوية العضلية والتحمل",
    en: "Strength & Hypertrophy",
    desc: "بناء القوة العضلية والكتلة والتحمل حول المفصل المصاب مع تماثل الطرفين",
  },
  {
    key: "NEUROMUSCULAR",
    order: 4,
    ar: "التحكم العصبي العضلي والتوازن",
    en: "Neuromuscular Control",
    desc: "تحسين التوافق العصبي العضلي والاستقبال الحسي العميق وثبات الجذع والمفصل",
  },
  {
    key: "FUNCTIONAL",
    order: 5,
    ar: "التأهيل الوظيفي والمحاكاة",
    en: "Functional & Agility",
    desc: "تمارين الرشاقة، الجري المتدرج، القفز وتغيير الاتجاه تحت أحمال رياضية",
  },
  {
    key: "RETURN_TO_SPORT",
    order: 6,
    ar: "الجاهزية التامة والنزول للملعب",
    en: "Return to Sport (RTP)",
    desc: "استيفاء معايير النزول للملعب والاختبارات البدنية والمشاركة الآمنة بالمنافسات",
  },
];

export type InjuryCategory =
  | "KNEE"
  | "SHOULDER"
  | "ANKLE_FOOT"
  | "SPINE_BACK"
  | "ELBOW_WRIST"
  | "HIP_GROIN_THIGH"
  | "GENERAL";

export interface DynamicPhaseCriterion {
  id: string;
  phase: string;
  category: InjuryCategory;
  textAr: string;
  textEn: string;
  targetMetric?: string;
}

export function detectInjuryCategory(injuryType?: string | null): {
  category: InjuryCategory;
  labelAr: string;
  labelEn: string;
} {
  const s = (injuryType || "").toLowerCase();

  if (
    s.includes("ركب") ||
    s.includes("صليبي") ||
    s.includes("غضروف") && !s.includes("ظهر") && !s.includes("قطن") ||
    s.includes("رضف") ||
    s.includes("صابون") ||
    s.includes("knee") ||
    s.includes("acl") ||
    s.includes("pcl") ||
    s.includes("mcl") ||
    s.includes("lcl") ||
    s.includes("menisc") ||
    s.includes("patell")
  ) {
    return { category: "KNEE", labelAr: "إصابات الركبة والأربطة", labelEn: "Knee & Ligaments" };
  }

  if (
    s.includes("كتف") ||
    s.includes("كفة") ||
    s.includes("كفه") ||
    s.includes("لوح") ||
    s.includes("ترقو") ||
    s.includes("shoulder") ||
    s.includes("rotator") ||
    s.includes("labrum") ||
    s.includes("slap") ||
    s.includes("bankart") ||
    s.includes("impingement") ||
    s.includes("scapula") ||
    s.includes("clavicle")
  ) {
    return { category: "SHOULDER", labelAr: "إصابات الكتف ولوح الكتف", labelEn: "Shoulder & Scapula" };
  }

  if (
    s.includes("كاحل") ||
    s.includes("انكل") ||
    s.includes("أنكل") ||
    s.includes("اكيلس") ||
    s.includes("أكيلس") ||
    s.includes("قدم") ||
    s.includes("كعب") ||
    s.includes("ankle") ||
    s.includes("achilles") ||
    s.includes("plantar") ||
    s.includes("foot") ||
    s.includes("atfl")
  ) {
    return { category: "ANKLE_FOOT", labelAr: "إصابات الكاحل والقدم", labelEn: "Ankle & Foot" };
  }

  if (
    s.includes("ظهر") ||
    s.includes("عمود") ||
    s.includes("فقر") ||
    s.includes("قطن") ||
    s.includes("عنق") ||
    s.includes("رقب") ||
    s.includes("ديسك") ||
    s.includes("عرق النسا") ||
    s.includes("spine") ||
    s.includes("lumbar") ||
    s.includes("cervical") ||
    s.includes("thoracic") ||
    s.includes("disc") ||
    s.includes("back") ||
    s.includes("sciatica")
  ) {
    return { category: "SPINE_BACK", labelAr: "إصابات العمود الفقري والظهر", labelEn: "Spine & Trunk" };
  }

  if (
    s.includes("كوع") ||
    s.includes("مرفق") ||
    s.includes("رسغ") ||
    s.includes("ريست") ||
    s.includes("يد") ||
    s.includes("تنس") ||
    s.includes("elbow") ||
    s.includes("wrist") ||
    s.includes("carpal") ||
    s.includes("epicondyl") ||
    s.includes("hand") ||
    s.includes("forearm")
  ) {
    return { category: "ELBOW_WRIST", labelAr: "إصابات الكوع والرسغ", labelEn: "Elbow & Wrist" };
  }

  if (
    s.includes("ورك") ||
    s.includes("حوض") ||
    s.includes("فخذ") ||
    s.includes("ضام") ||
    s.includes("خلفي") ||
    s.includes("امامي") ||
    s.includes("أمامي") ||
    s.includes("رباعي") ||
    s.includes("سمان") ||
    s.includes("hip") ||
    s.includes("groin") ||
    s.includes("hamstring") ||
    s.includes("quadricep") ||
    s.includes("adductor") ||
    s.includes("calf")
  ) {
    return { category: "HIP_GROIN_THIGH", labelAr: "إصابات الورك والحوض والعضلات", labelEn: "Hip & Thigh" };
  }

  return { category: "GENERAL", labelAr: "تأهيل رياضي وحركي عام", labelEn: "General Rehab" };
}

type CriterionTemplate = {
  textAr: string;
  textEn: string;
  targetMetric?: string;
};

const CRITERIA_BANK: Record<InjuryCategory, Record<string, CriterionTemplate[]>> = {
  KNEE: {
    ACUTE: [
      { textAr: "زوال التورم والانصباب المفصلي للركبة (Stroke Test ≤ Trace)", textEn: "Minimal to zero knee joint effusion", targetMetric: "Effusion ≤ 1+" },
      { textAr: "انخفاض حدة الألم أثناء الراحة إلى ≤ 3 من 10 على مقياس VAS", textEn: "Resting pain VAS ≤ 3/10", targetMetric: "VAS ≤ 3/10" },
      { textAr: "تحقيق بسط كامل للركبة 0° دون قصور (Full Passive Extension 0°)", textEn: "Full passive knee extension 0°", targetMetric: "0° Extension" },
      { textAr: "تنشيط واضح للعضلة الرباعية ورفع الساق المستقيمة دون سقوط (No Quad Lag)", textEn: "SLR without extension lag", targetMetric: "0° Quad Lag" },
      { textAr: "القدرة على المشي بنمط سليم دون عرج باستخدام العكازات عند الحاجة", textEn: "Symmetric gait mechanics", targetMetric: "Normal Gait" },
    ],
    RESTORE_ROM: [
      { textAr: "بسط كامل نشط وسلبي للركبة 0° متماثل مع الطرف السليم", textEn: "Full symmetrical active knee extension 0°", targetMetric: "0° Symmetrical" },
      { textAr: "ثني الركبة الفعال لا يقل عن 120° – 125° دون ألم حاد", textEn: "Active knee flexion ≥ 120°–125°", targetMetric: "≥ 120° Flexion" },
      { textAr: "حرية حركة عظمة الرضفة (Patellar Mobility) في جميع الاتجاهات", textEn: "Normal superior-inferior & medial-lateral patellar glide", targetMetric: "Free Glide" },
      { textAr: "الاستغناء الكامل عن العكازات مع توزيع متوازن للوزن", textEn: "Independent ambulation without crutches", targetMetric: "No Crutches" },
      { textAr: "ثبات محيط مفصل الركبة وعدم زيادة التورم بعد التمرين", textEn: "No post-exercise joint swelling spike", targetMetric: "Stable Girth" },
    ],
    STRENGTH: [
      { textAr: "ثني الركبة الكامل ≥ 135° أو متماثل بنسبة ≥ 95% مع الجانب السليم", textEn: "Full symmetrical ROM within 5° of uninvolved side", targetMetric: "≥ 95% ROM" },
      { textAr: "تماثل محيط عضلة الفخذ (Thigh Girth LSI) ≥ 90% وتقلص الضمور", textEn: "Thigh circumference LSI ≥ 90%", targetMetric: "Girth LSI ≥ 90%" },
      { textAr: "نسبة قوة العضلة الرباعية والخلفية ≥ 75% مقارنة بالطرف السليم", textEn: "Quad & hamstring strength LSI ≥ 75%", targetMetric: "Strength ≥ 75%" },
      { textAr: "أداء تمرين السكوات وثني الساق بوزن الجسم بتحكم كامل ودون Knee Valgus", textEn: "Pain-free controlled double/single leg squat", targetMetric: "No Valgus" },
      { textAr: "صعود ونزول الدرج بسلاسة وتحكم لامركزي في عضلات الفخذ", textEn: "Controlled eccentric stair descent", targetMetric: "Clean Stairs" },
    ],
    NEUROMUSCULAR: [
      { textAr: "قوة العضلات المحيطة بالركبة ≥ 85% مقارنة بالطرف السليم", textEn: "Quadriceps & hamstring LSI ≥ 85%", targetMetric: "LSI ≥ 85%" },
      { textAr: "ثبات التوازن على قدم واحدة لمدة 45 ثانية دون فقدان المحاذاة", textEn: "Single-leg stance balance ≥ 45s", targetMetric: "Balance ≥ 45s" },
      { textAr: "اختبار توازن النجمة (Y-Balance Test) بفارق أقل من 4 سم بين الطرفين", textEn: "Y-Balance anterior reach asymmetry < 4 cm", targetMetric: "Diff < 4 cm" },
      { textAr: "هبوط آمن من الصندوق مع امتصاص الصدمة ومنع انحراف الركبة للداخل", textEn: "Drop landing with neutral knee alignment", targetMetric: "Valgus < 8°" },
      { textAr: "عدم ظهور ألم أو ارتشاح بعد جلسات التوافق العصبي والقفز الخفيف", textEn: "Zero pain/effusion following plyometric drills", targetMetric: "VAS ≤ 1/10" },
    ],
    FUNCTIONAL: [
      { textAr: "تماثل القوة العضلية ومحيط العضلات ≥ 90% (LSI ≥ 90%)", textEn: "Quad strength & thigh girth LSI ≥ 90%", targetMetric: "LSI ≥ 90%" },
      { textAr: "اجتياز الجري المتسارع والمحاور الخفيفة والقطع (Cutting) بسلاسة", textEn: "Controlled multi-directional cutting at 80% speed", targetMetric: "80% Speed Cut" },
      { textAr: "نسبة القفز على قدم واحدة (Single & Triple Hop) ≥ 85% من الطرف السليم", textEn: "Single/Triple hop distance LSI ≥ 85%", targetMetric: "Hop LSI ≥ 85%" },
      { textAr: "أداء تمارين الرشاقة (T-Test / Illinois Agility) بثبات كامل", textEn: "Symmetrical agility & deceleration mechanics", targetMetric: "Full Agility" },
      { textAr: "تقييم الجاهزية النفسية للعودة (ACL-RSI ≥ 75%) دون تردد", textEn: "Psychological readiness score ≥ 75%", targetMetric: "RSI ≥ 75%" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "استيفاء تماثل القوة العضلية (Isokinetic / HHD LSI ≥ 95%)", textEn: "Limb Symmetry Index ≥ 95% across all muscle groups", targetMetric: "LSI ≥ 95%" },
      { textAr: "اجتياز بطارية اختبارات القفز الأربعة بنسبة تماثل ≥ 90–95%", textEn: "Hop test battery LSI ≥ 90–95%", targetMetric: "Hop ≥ 90%" },
      { textAr: "تماثل محيط العضلات الكامل وزوال أي ضمور متبقي", textEn: "Restored symmetrical muscle circumference", targetMetric: "Full Girth" },
      { textAr: "إتمام التدريبات الجماعية بالملعب واحتكاك المباراة بأمان تام", textEn: "Full unrestricted team training participation", targetMetric: "Full Practice" },
      { textAr: "اعتماد التقييم النهائي في صفحة شروط النزول للملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  SHOULDER: {
    ACUTE: [
      { textAr: "انخفاض الألم الليلي وألم الراحة في الكتف إلى ≤ 3 من 10", textEn: "Shoulder resting/night pain VAS ≤ 3/10", targetMetric: "VAS ≤ 3/10" },
      { textAr: "أداء تمارين البندول (Pendulum) والمدى السلبي بحدود الأمان دون تشنج", textEn: "Pain-free gentle pendulum & PROM in safe zone", targetMetric: "Safe PROM" },
      { textAr: "تثبيت صحيح للوح الكتف والوضعية (Scapular Setting) دون رفع الأكتاف", textEn: "Active scapular retraction & depression awareness", targetMetric: "Scapula Set" },
      { textAr: "تنشيط آيزومترك لطيف لعضلات الكفة المدورة دون إجهاد الوتر", textEn: "Pain-free submaximal rotator cuff isometrics", targetMetric: "Pain-Free Iso" },
      { textAr: "حماية الأنسجة المرممة والالتزام بزاوية الحمالة أو الحركة المسموحة", textEn: "Strict protection within safe tissue healing zone", targetMetric: "Protected" },
    ],
    RESTORE_ROM: [
      { textAr: "استعادة الرفع الأمامي للكتف (Flexion) ≥ 150° والمدى السلبي الكامل", textEn: "Shoulder flexion ≥ 150° with good mechanics", targetMetric: "Flex ≥ 150°" },
      { textAr: "تبعيد الكتف (Abduction) ≥ 140° دون انحشار أو رفع للكتف (Shrug Sign)", textEn: "Abduction ≥ 140° without upper trap compensation", targetMetric: "Abd ≥ 140°" },
      { textAr: "تحسن الدوران الخارجي والداخلي (ER/IR) ليصل إلى ≥ 80% من الطرف السليم", textEn: "ER & IR ROM ≥ 80% of contralateral side", targetMetric: "ER/IR ≥ 80%" },
      { textAr: "انزلاق وحركة متناغمة للوح الكتف (Scapulohumeral Rhythm) دون مجنحة", textEn: "Normalized scapulohumeral rhythm during elevation", targetMetric: "Clean Rhythm" },
      { textAr: "أداء الأنشطة اليومية فوق مستوى الرأس بألم ≤ 2 من 10", textEn: "Overhead daily activities with VAS ≤ 2/10", targetMetric: "VAS ≤ 2/10" },
    ],
    STRENGTH: [
      { textAr: "مدى حركي كامل غير مؤلم في جميع اتجاهات الكتف (Flex/Abd/ER/IR)", textEn: "Full pain-free multi-planar shoulder ROM", targetMetric: "Full ROM" },
      { textAr: "قوة عضلات الكفة المدورة (ER/IR) ≥ 80% مقارنة بالكتف السليم", textEn: "Rotator cuff strength LSI ≥ 80%", targetMetric: "Cuff ≥ 80%" },
      { textAr: "تفعيل قوي ومتوازن لعضلة Serratus Anterior و Lower Trapezius", textEn: "Strong scapular upward rotators & stabilizers", targetMetric: "Scapula Strong" },
      { textAr: "أداء تمارين الدفع والسحب بأوزان متدرجة دون ألم أمامي أو خلفي", textEn: "Progressive push/pull resistance training pain-free", targetMetric: "Pain-Free Load" },
      { textAr: "استعادة محيط عضلات الذراع والكتف (Girth Symmetry ≥ 90%)", textEn: "Upper arm & deltoid circumference symmetry ≥ 90%", targetMetric: "Girth ≥ 90%" },
    ],
    NEUROMUSCULAR: [
      { textAr: "ثبات الكتف في السلسلة المغلقة (Plank / Bear Crawl / Ball Stabilization)", textEn: "Closed-chain shoulder stability & rhythmic stabilization", targetMetric: "Closed-Chain" },
      { textAr: "توازن نسبة قوة التدوير الخارجي إلى الداخلي (ER:IR Ratio ≥ 65–70%)", textEn: "Balanced ER/IR functional strength ratio", targetMetric: "ER:IR ≥ 65%" },
      { textAr: "القدرة على تحمل تمارين البليومترك الخفيف للذراع والرمي على الترامبولين", textEn: "Tolerance to two-hand & light single-arm plyometrics", targetMetric: "Plyo Ready" },
      { textAr: "استقرار كامل للوح الكتف أثناء الحركات السريعة فوق مستوى الكتف", textEn: "Zero scapular dyskinesis during high-speed elevation", targetMetric: "No Dyskinesis" },
      { textAr: "تحمل العضلات الدوارة أثناء تكرارات الأداء الرياضي العالية", textEn: "Adequate rotator cuff endurance under fatigue", targetMetric: "High Endurance" },
    ],
    FUNCTIONAL: [
      { textAr: "قوة وتماثل الكتف ومثبتات اللوح ≥ 90% مقارنة بالجانب السليم", textEn: "Shoulder & scapular strength LSI ≥ 90%", targetMetric: "Strength ≥ 90%" },
      { textAr: "القدرة على أداء برنامج الرمي المتدرج أو السباحة أو الصد بتدرج سرعة 80%", textEn: "Progressive sport-specific overhead/throwing drills at 80%", targetMetric: "80% Velocity" },
      { textAr: "اجتياز اختبار CKCUEST (لمس اليدين من وضع البلانك) بالمعدل الرياضي", textEn: "CKCUEST score meets sport normative threshold", targetMetric: "CKCUEST Pass" },
      { textAr: "غياب تام لأعراض الانحشار (Impingement) أو عدم الثبات (Apprehension Negative)", textEn: "Negative apprehension & impingement signs", targetMetric: "Tests Negative" },
      { textAr: "ثبات وتوازن العمود الفقري الصدري وتدويره مع حركة الكتف", textEn: "Full thoracic rotation supporting overhead kinetic chain", targetMetric: "T-Spine Sync" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "تماثل قوة عضلات الكتف والكفة المدورة ≥ 95% (LSI ≥ 95%)", textEn: "Rotator cuff & deltoid strength LSI ≥ 95%", targetMetric: "LSI ≥ 95%" },
      { textAr: "اجتياز اختبار ASH / Y-Balance العلوي بنجاح وتناظر تام", textEn: "Upper Quarter Y-Balance & ASH test passed", targetMetric: "UQYBT ≥ 95%" },
      { textAr: "إتمام الرمي أو السقوط والالتحام الكامل بأقصى سرعة دون أي خوف", textEn: "Full velocity throwing/contact tolerance without fear", targetMetric: "100% Velocity" },
      { textAr: "خلو كامل من الألم والتيبس بعد التدريب التنافسي المكثف", textEn: "Zero post-competition pain or soreness", targetMetric: "VAS 0/10" },
      { textAr: "اعتماد الجاهزية النهائية للنزول في بطاقة تقييم الملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  ANKLE_FOOT: {
    ACUTE: [
      { textAr: "السيطرة على التورم والأورام الدموية حول الكاحل (Figure-of-8 Swelling Reduced)", textEn: "Controlled ankle swelling and acute inflammation", targetMetric: "Swelling Down" },
      { textAr: "انخفاض الألم عند التحميل الجزئي إلى ≤ 3 من 10", textEn: "Pain VAS ≤ 3/10 during protected weight-bearing", targetMetric: "VAS ≤ 3/10" },
      { textAr: "أداء حركات العطف الظهري والبلانتر اللطيفة داخل المدى الخالي من الألم", textEn: "Gentle pain-free ankle AROM circles & pumps", targetMetric: "Pain-Free AROM" },
      { textAr: "حماية الأربطة الجانبية أو الوتر وتنشيط انقباضات آيزومترك آمنة", textEn: "Protected ligament/tendon isometric loading", targetMetric: "Safe Load" },
      { textAr: "تقدم آمن في التحميل التدريجي بالوزن دون عرج حاد", textEn: "Progressive weight-bearing tolerance", targetMetric: "WB Tolerated" },
    ],
    RESTORE_ROM: [
      { textAr: "تحقيق عطف ظهري للكاحل (Dorsiflexion / Knee-to-Wall) ≥ 10 سم أو متماثل", textEn: "Knee-to-wall dorsiflexion within 1–2 cm of healthy side", targetMetric: "Dorsi ≥ 10 cm" },
      { textAr: "استعادة حركة العطف الأخمصي والانقلاب للداخل والخارج (Inv/Ev ≥ 85%)", textEn: "Plantarflexion, inversion & eversion ≥ 85% ROM", targetMetric: "ROM ≥ 85%" },
      { textAr: "مشي طبيعي كامل دون عرج وحركة كعب-أصابع سلسة (Heel-to-Toe Gait)", textEn: "Symmetric heel-toe gait without antalgic limp", targetMetric: "Normal Gait" },
      { textAr: "مرونة جيدة في عضلات السمانة (Gastrocnemius & Soleus) ولفافة القدم", textEn: "Adequate calf flexibility without morning stiffness", targetMetric: "Calf Flexible" },
      { textAr: "انعدام الألم أثناء الوقوف الطويل والأنشطة اليومية", textEn: "Pain-free daily standing & walking", targetMetric: "VAS ≤ 1/10" },
    ],
    STRENGTH: [
      { textAr: "مدى حركي كامل للكاحل في جميع الاتجاهات الأربع متماثل مع الطرف السليم", textEn: "Full symmetrical 4-way ankle ROM", targetMetric: "100% ROM" },
      { textAr: "قوة عضلات الشظوية (Peroneals/Evertors) والقصبية ≥ 85%", textEn: "Peroneal & tibialis strength LSI ≥ 85%", targetMetric: "Evertors ≥ 85%" },
      { textAr: "القدرة على أداء 25 رفعة كعب بقدم واحدة (Single-Leg Heel Raise)", textEn: "≥ 20–25 symmetrical single-leg heel raises", targetMetric: "25 Heel Raises" },
      { textAr: "تماثل محيط عضلة السمانة (Calf Girth LSI ≥ 90%)", textEn: "Calf circumference LSI ≥ 90%", targetMetric: "Calf Girth ≥ 90%" },
      { textAr: "تحمل تمارين التوازن المتحرك والهبوط المتدرج على سطح مستوٍ", textEn: "Controlled loaded calf & ankle drills", targetMetric: "Clean Load" },
    ],
    NEUROMUSCULAR: [
      { textAr: "ثبات التوازن بقدم واحدة مع إغلاق العينين ≥ 20 ثانية", textEn: "Single-leg balance eyes closed ≥ 20 seconds", targetMetric: "Balance ≥ 20s" },
      { textAr: "اجتياز اختبار توازن Y-Balance للكاحل بتناظر ≥ 90%", textEn: "Y-Balance ankle composite symmetry ≥ 90%", targetMetric: "YBT ≥ 90%" },
      { textAr: "التحكم في ثبات الكاحل أثناء الحركة على الأسطح غير المستقرة (BOSU/Wobble)", textEn: "Proprioceptive control on unstable surfaces", targetMetric: "Perturbation Safe" },
      { textAr: "هبوط سلس ومتماثل بالقدمين دون التواء أو فقدان التوازن", textEn: "Symmetrical double-to-single leg landing control", targetMetric: "Stable Land" },
      { textAr: "تدرج في القفز البسيط والحبل دون ألم في الوتر أو المفصل", textEn: "Pain-free low-impact hopping progression", targetMetric: "Pain-Free Plyo" },
    ],
    FUNCTIONAL: [
      { textAr: "قوة السمانة والكاحل ومثبتات القدم ≥ 90% من الطرف السليم", textEn: "Calf & peroneal strength LSI ≥ 90%", targetMetric: "Strength ≥ 90%" },
      { textAr: "الجري المستقيم السريع والتوقف المفاجئ وتغيير الاتجاه (Figure-8 / Zigzag)", textEn: "Pain-free sprinting & sharp cutting maneuvers", targetMetric: "Cutting Clean" },
      { textAr: "اختبار القفز الجانبي المتكرر والقفز العمودي بنسبة تماثل ≥ 90%", textEn: "Side-hop test & single-leg hop LSI ≥ 90%", targetMetric: "Side Hop ≥ 90%" },
      { textAr: "عدم حدوث تيبس صباحي أو ارتشاح في الكاحل بعد التمارين عالية الشدة", textEn: "Zero next-day tendon stiffness or ankle swelling", targetMetric: "No Stiffness" },
      { textAr: "ثقة تامة في القفز والارتكاز على الطرف المصاب بدون دعامة أو خوف", textEn: "High confidence during high-speed pivoting", targetMetric: "Full Confidence" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "تماثل قوة السمانة والانقلاب الخارجي (Eversion Strength LSI ≥ 95%)", textEn: "Calf endurance & eversion strength LSI ≥ 95%", targetMetric: "LSI ≥ 95%" },
      { textAr: "إتمام التدريبات الرياضية الكاملة بالميدان وأرضية الملعب الفعلية", textEn: "Full unrestricted field/court team practices", targetMetric: "Full Field" },
      { textAr: "نتيجة اختبار القفز الجانبي للرشاقة متطابقة مع المعايير المعيارية", textEn: "Side hop test within normative sport range", targetMetric: "Hop Passed" },
      { textAr: "مدى العطف الظهري الكامل والحفاظ على ثبات الكاحل تحت الإجهاد", textEn: "Preserved dorsiflexion and stability under fatigue", targetMetric: "Full ROM" },
      { textAr: "اعتماد الجاهزية للعودة في بطاقة تقييم الملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  SPINE_BACK: {
    ACUTE: [
      { textAr: "تهدئة الألم الحاد وتمركز الألم بعيداً عن الأطراف (Centralization of Symptoms)", textEn: "Pain reduction VAS ≤ 3/10 & symptom centralization", targetMetric: "VAS ≤ 3/10" },
      { textAr: "غياب الأعراض العصبية المتصاعدة (التنميل أو فقدان القوة الحركية)", textEn: "Stable/improving neurological signs", targetMetric: "Neuro Stable" },
      { textAr: "القدرة على إيجاد وضعية حيادية مريحة للعمود الفقري والتنفس البطني الصحيح", textEn: "Neutral spine awareness & diaphragmatic breathing", targetMetric: "Neutral Spine" },
      { textAr: "تفعيل آمن لعضلة البطن العميقة (TA) دون ضغط على الفقرات", textEn: "Gentle transverse abdominis bracing without pain", targetMetric: "Safe Bracing" },
      { textAr: "تحمل المشي الخفيف المتقطع والانتقال من السرير بآلية صحية", textEn: "Independent safe bed mobility & short walks", targetMetric: "Safe ADL" },
    ],
    RESTORE_ROM: [
      { textAr: "استعادة المدى الحركي الآمن لثني ومد ودوران الجذع دون ألم ممتد", textEn: "Pain-free restoration of directional trunk mobility", targetMetric: "Pain-Free ROM" },
      { textAr: "فك تيبس الفقرات الصدرية والورك لتخفيف الحمل عن أسفل الظهر والرقبة", textEn: "Improved thoracic & hip mobility reducing spinal load", targetMetric: "Segmental Mobility" },
      { textAr: "انعدام علامات التهيج العصبي أثناء اختبارات الشد العصبي (SLR Negative)", textEn: "Negative/improved neural tension signs", targetMetric: "Neural Clear" },
      { textAr: "استقامة قوام الجذع وتصحيح الميل الجانبي (Lateral Shift Corrected)", textEn: "Corrected lateral shift and upright posture", targetMetric: "Posture Clean" },
      { textAr: "الجلوس والوقوف لمدة 30+ دقيقة متصلة دون تزايد الألم", textEn: "Sitting/standing tolerance ≥ 30 minutes pain-free", targetMetric: "≥ 30 min Tolerance" },
    ],
    STRENGTH: [
      { textAr: "اجتياز أساسيات تحمل الجذع (McGill Big 3: Curl-up, Side Plank, Bird-Dog)", textEn: "McGill Big 3 core endurance symmetry", targetMetric: "McGill Pass" },
      { textAr: "تحكم كامل في ثبات الحوض والفقرات أثناء حركة الأطراف العلوية والسفلية", textEn: "Anti-rotation & anti-extension lumbar control", targetMetric: "Core Locked" },
      { textAr: "القدرة على أداء تمرين Hip Hinge وDeadlift/Squat خفيف بعمود فقري محايد", textEn: "Pain-free loaded hip-hinging mechanics", targetMetric: "Neutral Hinge" },
      { textAr: "توازن قوة عضلات الظهر المقومة (Erector Spinae) وعضلات البطن", textEn: "Flexor-to-extensor trunk endurance symmetry", targetMetric: "Balanced Trunk" },
      { textAr: "تحمل الأنشطة الحياتية وحمل الأوزان الخفيفة دون إجهاد بالفقرات", textEn: "Pain-free daily lifting mechanics", targetMetric: "Safe Lifting" },
    ],
    NEUROMUSCULAR: [
      { textAr: "ثبات الجذع السريع أمام الاضطرابات الخارجية والتمارين التفاعلية", textEn: "Dynamic reactive trunk stabilization drills", targetMetric: "Reactive Core" },
      { textAr: "تحمل اختبارات بيرانج-سورينسن واللوح الجانبي بثبات وتناظر ≥ 90%", textEn: "Side-bridge symmetry & trunk endurance benchmark", targetMetric: "Symmetry ≥ 90%" },
      { textAr: "دمج حركة دوران الجذع والكتف مع الورك بسلاسة دون تعويض قطني", textEn: "Coordinated thoracic-pelvic dissociation during sport", targetMetric: "Dissociation" },
      { textAr: "التحكم الهوائي وتثبيت الجذع أثناء الجري والقفز الخفيف", textEn: "Spinal control during running & impact absorption", targetMetric: "Impact Safe" },
      { textAr: "خلو تام من التنميل أو الشد العضلي الدفاعي أثناء وبعد الجلسات", textEn: "Zero post-session spasm or radiating discomfort", targetMetric: "Zero Radicular" },
    ],
    FUNCTIONAL: [
      { textAr: "أداء حركات التحميل الرياضي (Medicine Ball Throws / Woodchops) بأمان", textEn: "Pain-free rotational power & multi-planar trunk drills", targetMetric: "Power Clean" },
      { textAr: "السرعة والرشاقة والانحناء والتقاط الكرة/الأدوات بآليات ظهر سليمة", textEn: "Sport-specific bending, twisting & acceleration", targetMetric: "Sport Mobility" },
      { textAr: "المدى الحركي الكامل للعمود الفقري في الثني، المد، الميل الجانبي والدوران", textEn: "Full functional multi-planar spine ROM", targetMetric: "Full Spine ROM" },
      { textAr: "قوة وتحمل الجذع والأرداف بمستوى التنافس الرياضي", textEn: "High-level core & glute stamina under fatigue", targetMetric: "High Endurance" },
      { textAr: "ثقة المريض الكاملة في الانحناء والحركة السريعة دون خوف الانتكاسة", textEn: "Zero kinesiophobia during explosive movement", targetMetric: "No Fear" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "مدى حركي وقوة كاملة ومتوازنة للعمود الفقري وعضلات الجذع (100%)", textEn: "Full asymptomatic spine ROM and core strength", targetMetric: "100% Core/Spine" },
      { textAr: "المشاركة في التدريبات الكاملة والالتحامات الرياضية بدون ألم أو أعراض عصبية", textEn: "Unrestricted full contact/team practice pain-free", targetMetric: "Full Contact" },
      { textAr: "استقرار التقييم الحركي عبر تحليل الذكاء الاصطناعي دون ميلان تعويضي", textEn: "Normalized AI trunk & spine posture kinematics", targetMetric: "AI Kinematics OK" },
      { textAr: "الالتزام ببرنامج صيانة الجذع والمرونة اليومي", textEn: "Consistent maintenance warm-up routine established", targetMetric: "Maintenance Set" },
      { textAr: "اعتماد الجاهزية للنزول في بطاقة تقييم العودة للملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  ELBOW_WRIST: {
    ACUTE: [
      { textAr: "انخفاض الألم والتورم الموضعي حول الكوع أو الرسغ إلى ≤ 3 من 10", textEn: "Local elbow/wrist pain VAS ≤ 3/10", targetMetric: "VAS ≤ 3/10" },
      { textAr: "حماية الأوتار والأنسجة المرممة دون تحفيز ألم القبضة", textEn: "Protected tissue environment free of sharp grip pain", targetMetric: "Protected" },
      { textAr: "مدى لطيف للأصابع والأكتاف للحفاظ على الانزلاق الوترى والعصبي", textEn: "Preserved finger/shoulder mobility & tendon gliding", targetMetric: "Tendon Glide" },
      { textAr: "تهدئة التشنج العضلي في عضلات الساعد الباسطة والقابضة", textEn: "Controlled forearm flexor/extensor resting tone", targetMetric: "Tone Controlled" },
      { textAr: "غياب الخدر أو التنميل الممتد لليد والأصابع", textEn: "No progressive distal nerve paresthesia", targetMetric: "Neuro Clear" },
    ],
    RESTORE_ROM: [
      { textAr: "استعادة ثني الكوع الكامل وبسط الكوع حتى 0° متماثل مع الطرف السليم", textEn: "Full elbow flexion & 0° extension symmetry", targetMetric: "Elbow 0–145°" },
      { textAr: "استعادة حركة الكب والبسط بالساعد (Pronation/Supination ≥ 80°)", textEn: "Forearm pronation & supination ≥ 80° each", targetMetric: "Pro/Sup ≥ 80°" },
      { textAr: "مدى الرسغ في الثني والمد والانحراف الكعبري والزندي ≥ 85%", textEn: "Wrist flexion/extension/deviation ≥ 85% ROM", targetMetric: "Wrist ≥ 85%" },
      { textAr: "انعدام الألم عند الكتابة وحمل الكوب وأنشطة الحياة اليومية", textEn: "Pain-free routine daily manual tasks", targetMetric: "Pain-Free ADL" },
      { textAr: "مرونة سلسة لأوتار الرسغ والكوع تحت حركة الشد الخفيف", textEn: "Smooth forearm muscle extensibility", targetMetric: "Clean Flexibility" },
    ],
    STRENGTH: [
      { textAr: "قوة قبضة اليد (Grip Strength Dynamometer) ≥ 80% مقارنة باليد السليمة", textEn: "Grip strength LSI ≥ 80%", targetMetric: "Grip ≥ 80%" },
      { textAr: "قوة ثني ومد الكوع والرسغ والساعد ≥ 80% (Tyler Twist / Wrist Curls)", textEn: "Eccentric/concentric wrist & elbow loading at 80%", targetMetric: "Load ≥ 80%" },
      { textAr: "تحمل الساعد والرسغ لأوزان متدرجة دون ألم عند اللقيمة الوحشية/الأنسية", textEn: "Pain-free epicondylar & wrist tendon loading", targetMetric: "VAS ≤ 1/10" },
      { textAr: "تماثل محيط عضلات الساعد والعضد (Arm/Forearm Girth ≥ 90%)", textEn: "Upper arm & forearm circumference symmetry ≥ 90%", targetMetric: "Girth ≥ 90%" },
      { textAr: "ربط قوة الذراع بثبات لوح الكتف والكتف أثناء تمارين المقاومة", textEn: "Proximal scapular integration during arm work", targetMetric: "Chain Sync" },
    ],
    NEUROMUSCULAR: [
      { textAr: "تحمل اليد والرسغ للتحميل التدريجي في السلسلة المغلقة (Wall/Incline Push-ups)", textEn: "Pain-free weight-bearing through wrist and elbow", targetMetric: "Weight-Bear OK" },
      { textAr: "التحكم العصبي والدقة في التقاط وإمساك الأدوات السريعة والمتفاعلة", textEn: "Reactive grip control & wrist proprioception", targetMetric: "Reactive Grip" },
      { textAr: "قوة قبضة اليد والقرصة (Pinch & Grip) ≥ 90% من الجانب السليم", textEn: "Grip & pinch strength LSI ≥ 90%", targetMetric: "Grip ≥ 90%" },
      { textAr: "أداء حركات الكب والبسط السريعة والانفجار العضلي للساعد بدون ألم", textEn: "Fast forearm rotation drills pain-free", targetMetric: "Fast Rotation" },
      { textAr: "تحمل الجهد المتكرر لعضلات الساعد دون تزايد التيبس", textEn: "Maintained endurance without tendon flare-up", targetMetric: "Zero Flare" },
    ],
    FUNCTIONAL: [
      { textAr: "القدرة على الضرب بالمضرب أو التقاط الكرات أو الضغط الأرضي الكامل (Push-ups)", textEn: "Full push-ups, catching & racquet/ball sports drills", targetMetric: "Full Push-up" },
      { textAr: "سرعة وتحكم ممتاز في حركة الكوع والرسغ تحت الأحمال التنافسية", textEn: "High-speed wrist snap & elbow extension control", targetMetric: "Full Speed" },
      { textAr: "تحمل تمارين البليومترك العلوية (Chest Pass / Drop Catch) بأمان", textEn: "Upper extremity plyometric drills tolerated", targetMetric: "Plyo Passed" },
      { textAr: "غياب الإجهاد أو الألم خلال 24 ساعة بعد التدريب الرياضي المكثف", textEn: "Zero delayed onset tendon soreness post-training", targetMetric: "Clean Recovery" },
      { textAr: "مدى حركي وقوة متماثلة بين الطرفين في جميع القياسات", textEn: "Symmetrical ROM and circumference", targetMetric: "LSI ≥ 90%" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "تماثل قوة القبضة وثني/مد الكوع والرسغ ≥ 95% (LSI ≥ 95%)", textEn: "Grip, elbow & wrist strength LSI ≥ 95%", targetMetric: "LSI ≥ 95%" },
      { textAr: "مدى حركي كامل غير محدود في الكوع، الساعد، والرسغ", textEn: "Full unrestricted elbow, forearm & wrist ROM", targetMetric: "100% ROM" },
      { textAr: "اختبارات الاستفزاز السريرية سلبية تماماً (Cozen / Mill / Phalen / Valgus)", textEn: "All clinical provocation & instability tests negative", targetMetric: "Tests Negative" },
      { textAr: "إتمام جلسات تدريب كاملة بالمستوى التنافسي واحتكاك الرياضة", textEn: "Full unrestricted sport competition readiness", targetMetric: "Full Practice" },
      { textAr: "اعتماد الجاهزية النهائية في بطاقة تقييم الملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  HIP_GROIN_THIGH: {
    ACUTE: [
      { textAr: "تهدئة الألم الحاد والحد من أي نزيف عضلي إضافي (VAS ≤ 3/10)", textEn: "Acute muscle/hip pain settled VAS ≤ 3/10", targetMetric: "VAS ≤ 3/10" },
      { textAr: "المشي بدون عرج وتوزيع الوزن بتدرج آمن بدون شد عضلي حاد", textEn: "Pain-free level gait without muscle guarding", targetMetric: "Clean Gait" },
      { textAr: "تفعيل انقباضات آيزومترك خفيفة في زوايا مريحة (30°/45°/90°)", textEn: "Pain-free gentle submaximal isometrics", targetMetric: "Iso Pain-Free" },
      { textAr: "انعدام الألم المفاجئ عند اللمس الخفيف أو الاستطالة اللطيفة", textEn: "Decreased acute palpation tenderness", targetMetric: "Settling" },
      { textAr: "استقرار تورم ومحيط الفخذ وعدم تراجع الحالة", textEn: "Stable thigh/groin swelling profile", targetMetric: "Stable Girth" },
    ],
    RESTORE_ROM: [
      { textAr: "استعادة مدى ثني ومد وتبعيد وتقريب الورك ≥ 85–90% مقارنة بالسليم", textEn: "Hip flexion/extension/abduction/adduction ≥ 85% ROM", targetMetric: "Hip ≥ 85%" },
      { textAr: "مدى إطالة العضلة الخلفية أو الضامة (Askling H-Test / Bent Knee Fall Out) بأمان", textEn: "Pain-free end-range muscle lengthening mobility", targetMetric: "Safe Length" },
      { textAr: "خلو المشي والجلوس وصعود السلم من أي وخز أو شد حاد بالعضلة", textEn: "Pain-free stairs and rapid walking stride", targetMetric: "Clean Stairs" },
      { textAr: "تحكم ممتاز في استقرار الحوض (Pelvic Tilt Control) دون ميلان تعويضي", textEn: "Controlled pelvic position in sagittal/frontal planes", targetMetric: "Pelvis Neutral" },
      { textAr: "أداء حركات الدوران الداخلي والخارجي للورك بدون انحشار مفصلي", textEn: "Pain-free hip internal and external rotation", targetMetric: "IR/ER Clear" },
    ],
    STRENGTH: [
      { textAr: "قوة العضلات اللامركزية (Nordic Hamstrings / Copenhagen Adductors) ≥ 80%", textEn: "Eccentric muscle strength LSI ≥ 80%", targetMetric: "Eccentric ≥ 80%" },
      { textAr: "تحمل اختبار ضغط العضلات الضامة (Adductor Squeeze Test) بألم ≤ 2/10", textEn: "Adductor squeeze test VAS ≤ 2/10", targetMetric: "Squeeze ≤ 2/10" },
      { textAr: "تماثل محيط الفخذ عند 15 و30 سم (Thigh Girth LSI ≥ 90%)", textEn: "Thigh circumference LSI ≥ 90%", targetMetric: "Girth ≥ 90%" },
      { textAr: "أداء التمارين المركبة (RDL / Lunges / Bulgarian Split Squat) بتوازن", textEn: "Symmetrical compound lower-body lifting", targetMetric: "Clean Lifts" },
      { textAr: "نسبة التوازن بين العضلات الخلفية والأمامية (H:Q Ratio ≥ 60–65%)", textEn: "Hamstring-to-quadriceps strength ratio ≥ 60%", targetMetric: "H:Q ≥ 60%" },
    ],
    NEUROMUSCULAR: [
      { textAr: "التحكم في الحوض على قدم واحدة وتجنب سقوط الحوض (Trendelenburg Negative)", textEn: "Level pelvis in single-leg dynamic drills", targetMetric: "No Pelvis Drop" },
      { textAr: "تحمل الهرولة والجري المتدرج حتى 70–75% من السرعة القصوى دون شد", textEn: "Pain-free running progression up to 75% max velocity", targetMetric: "75% Sprint" },
      { textAr: "توافق وتوقيت تفعيل الأرداف والعضلات الخلفية عند التسارع", textEn: "Coordinated glute-hamstring firing patterns", targetMetric: "Timing Sync" },
      { textAr: "تحمل التمارين الباليستية السريعة والانزلاق الجانبي", textEn: "Ballistic hip swing & lateral slide control", targetMetric: "Ballistic OK" },
      { textAr: "قوة العضلات المصابة ≥ 85–90% مقارنة بالطرف السليم", textEn: "Muscle strength LSI ≥ 85–90%", targetMetric: "LSI ≥ 85%" },
    ],
    FUNCTIONAL: [
      { textAr: "انعدام الألم أثناء التسارع السريع والسرعات القصوى (Sprint 90–100%)", textEn: "Pain-free high-speed sprinting mechanics", targetMetric: "95% Sprint" },
      { textAr: "اجتياز اختبار Askling H-Test بدون خوف أو شد في نهاية المدى", textEn: "Fear-free dynamic flexibility H-Test", targetMetric: "H-Test Pass" },
      { textAr: "أداء الركل والتسديد وتغيير الاتجاه الحاد بدون وخز بالضامة أو الورك", textEn: "High-load kicking, pivoting & cutting tolerated", targetMetric: "Kick/Cut Pass" },
      { textAr: "تماثل اختبارات القفز والتوازن الديناميكي ≥ 90%", textEn: "Hop battery & dynamic balance ≥ 90%", targetMetric: "Hop ≥ 90%" },
      { textAr: "استكمال 3 جلسات ميدانية متتالية بأحمال عالية دون إرهاق موضعي", textEn: "3 consecutive high-load field sessions pain-free", targetMetric: "3 Clean Sessions" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "تماثل قوة العضلات اللامركزية ومحيط العضلة الكامل (LSI ≥ 95%)", textEn: "Eccentric strength & thigh girth LSI ≥ 95%", targetMetric: "LSI ≥ 95%" },
      { textAr: "مدى مرونة كامل ومطابق للطرف السليم بدون فرق في الطول العضلي", textEn: "Full symmetrical flexibility & extensibility", targetMetric: "100% Length" },
      { textAr: "قدرة كاملة على السبرينت 100% والالتحام الكروي والتسديد بأقصى قوة", textEn: "100% sprint velocity and maximal kicking/cutting", targetMetric: "100% Speed" },
      { textAr: "خلو تام من التصلب في الصباح التالي للمباراة التدريبية", textEn: "Zero next-day morning muscle tightness", targetMetric: "No Tightness" },
      { textAr: "اعتماد الجاهزية في صفحة شروط النزول للملعب (RTP ≥ 90%)", textEn: "RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
  GENERAL: {
    ACUTE: [
      { textAr: "انخفاض الألم والتورم الموضعي إلى مستوى آمن (VAS ≤ 3/10)", textEn: "Pain & swelling reduced to safe baseline (VAS ≤ 3/10)", targetMetric: "VAS ≤ 3/10" },
      { textAr: "حماية الأنسجة في المرحلة الحرجة وتجنب أي حركات تسبب ألماً حاداً", textEn: "Protected tissue healing without acute flare-ups", targetMetric: "Protected" },
      { textAr: "تحقيق التنشيط العضلي الآمن الآيزومترك حول منطقة الإصابة", textEn: "Safe gentle isometric muscle activation", targetMetric: "Iso Activated" },
      { textAr: "انتظام التنفس وجودة أداء الأنشطة الأساسية اليومية", textEn: "Comfortable basic daily activities", targetMetric: "Safe ADL" },
      { textAr: "ثبات القياسات السريرية الأولية وعدم ظهور مضاعفات", textEn: "Stable baseline measurements without red flags", targetMetric: "Stable" },
    ],
    RESTORE_ROM: [
      { textAr: "استعادة المدى الحركي النشط والسلبي (ROM) بنسبة ≥ 85% مقارنة بالجانب السليم", textEn: "Active & passive ROM ≥ 85% of healthy side", targetMetric: "ROM ≥ 85%" },
      { textAr: "تحسن مرونة الأنسجة المحيطة دون تيبس أو شد تعويضي", textEn: "Restored soft tissue extensibility without compensation", targetMetric: "Clean Mobility" },
      { textAr: "أداء الأنشطة الحركية اليومية بأسلوب متماثل وسليم (Symmetrical Mechanics)", textEn: "Symmetrical pain-free movement quality", targetMetric: "Symmetrical" },
      { textAr: "انعدام الألم أثناء الحركة في المدى المتوسط (VAS ≤ 2/10)", textEn: "Mid-range movement pain VAS ≤ 2/10", targetMetric: "VAS ≤ 2/10" },
      { textAr: "استقرار التورم والمحيط بعد تطبيق تمارين المرونة", textEn: "No post-mobility swelling reaction", targetMetric: "Stable Girth" },
    ],
    STRENGTH: [
      { textAr: "اكتمال المدى الحركي الحر في جميع المستويات التشريحية", textEn: "Full pain-free multi-planar ROM", targetMetric: "Full ROM" },
      { textAr: "وصول القوة العضلية إلى ≥ 80% مقارنة بالجانب السليم", textEn: "Affected limb muscle strength LSI ≥ 80%", targetMetric: "Strength ≥ 80%" },
      { textAr: "تحسن محيط العضلات وتقليص الفارق مقارنة بالطرف السليم (LSI ≥ 90%)", textEn: "Muscle circumference LSI ≥ 90%", targetMetric: "Girth ≥ 90%" },
      { textAr: "القدرة على تحمل أحمال المقاومة المتدرجة بسلامة ميكانيكية", textEn: "Progressive resistance tolerance with clean form", targetMetric: "Clean Form" },
      { textAr: "زيادة التحمل العضلي وعدم الشعور بإجهاد مبكر", textEn: "Improved muscular stamina during sessions", targetMetric: "Stamina Up" },
    ],
    NEUROMUSCULAR: [
      { textAr: "تطور التوازن الحركي والاستقبال الحسي العميق للمفصل المصاب", textEn: "Improved proprioception & dynamic joint stability", targetMetric: "Stable Control" },
      { textAr: "استقامة المفاصل وثبات الجذع أثناء الحركات السريعة أو غير المتوقعة", textEn: "Clean joint & trunk alignment under perturbations", targetMetric: "Alignment OK" },
      { textAr: "وصول قوة العضلات إلى ≥ 85–90% من الطرف السليم", textEn: "Muscle strength LSI ≥ 85–90%", targetMetric: "LSI ≥ 85%" },
      { textAr: "القدرة على التحكم بالانقباض التفاعلي والهبوط وامتصاص الصدمات", textEn: "Effective impact absorption & deceleration", targetMetric: "Impact Clean" },
      { textAr: "أداء التمارين التوافقية دون ألم أو علامات عدم ثبات", textEn: "Pain-free neuromuscular drill execution", targetMetric: "Pain-Free" },
    ],
    FUNCTIONAL: [
      { textAr: "تماثل القوة والمحيط العضلي ≥ 90% مع الطرف السليم", textEn: "Strength & girth LSI ≥ 90%", targetMetric: "LSI ≥ 90%" },
      { textAr: "اجتياز تدريبات الرشاقة، السرعة، والمحاكاة النوعية للرياضة بأمان", textEn: "Sport-specific agility & simulation at ≥ 85% intensity", targetMetric: "85% Intensity" },
      { textAr: "أداء الاختبارات الوظيفية التخصصية بتناظر وكفاءة ميكانيكية", textEn: "Functional testing symmetry passed", targetMetric: "Tests Passed" },
      { textAr: "جاهزية نفسية ممتازة واختفاء التردد عند أداء الحركة السريعة", textEn: "Strong confidence during explosive drills", targetMetric: "High Confidence" },
      { textAr: "تعافٍ تام بعد التدريب العالي الشدة خلال 24 ساعة", textEn: "Full recovery within 24h post high-intensity session", targetMetric: "24h Recovery" },
    ],
    RETURN_TO_SPORT: [
      { textAr: "تحقيق نسبة تماثل ≥ 95% في القوة والمدى الحركي ومحيط العضلات", textEn: "≥ 95% LSI in strength, ROM, and muscle circumference", targetMetric: "LSI ≥ 95%" },
      { textAr: "اجتياز الاختبارات البدنية والوظيفية بدون أي ألم أو تعويض حركي", textEn: "Asymptomatic functional & movement clearance", targetMetric: "100% Clean" },
      { textAr: "إتمام المشاركة الكاملة في التدريب التنافسي بنجاح", textEn: "Unrestricted full sport training participation", targetMetric: "Full Practice" },
      { textAr: "اجتياز تحليل الذكاء الاصطناعي للمفاصل بزوايا متزنة وآمنة", textEn: "Balanced AI kinematic movement analysis", targetMetric: "AI Cleared" },
      { textAr: "اعتماد جاهزية النزول للملعب في بطاقة التقييم النهائية (RTP ≥ 90%)", textEn: "Final RTP Scorecard clearance ≥ 90%", targetMetric: "RTP ≥ 90%" },
    ],
  },
};

export function getDynamicPhaseCriteria(
  phase: string,
  injuryType?: string | null
): DynamicPhaseCriterion[] {
  const { category } = detectInjuryCategory(injuryType);
  const validPhase = REHAB_PHASES.some((p) => p.key === phase) ? phase : "ACUTE";
  const templates =
    CRITERIA_BANK[category]?.[validPhase] ||
    CRITERIA_BANK.GENERAL[validPhase] ||
    CRITERIA_BANK.GENERAL.ACUTE;

  return templates.map((tpl, idx) => ({
    id: `${validPhase}_${category}_${idx + 1}`,
    phase: validPhase,
    category,
    textAr: tpl.textAr,
    textEn: tpl.textEn,
    targetMetric: tpl.targetMetric,
  }));
}
