import { PrismaClient, ExerciseRegion, RehabPhase } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Exercises (sample of 500+) ──
  const exerciseData = [
    // === LOWER BODY ===
    { nameAr: "تمديد الركبة (Quad Set)", nameEn: "Quad Set", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 0, instructions: "شد عضلة الفخذ الأمامية مع الركبة ممدودة بالكامل. اضغط الركبة للأسفل باتجاه السرير. حافظ على الانقباض 5-10 ثوانٍ.", youtubeSearch: "quad set exercise physical therapy" },
    { nameAr: "رفع الساق المستقيمة", nameEn: "Straight Leg Raise (SLR)", region: "LOWER", category: "Quadriceps", instructions: "استلقِ على ظهرك، اثنِ الركبة السليمة. ارفع الساق المصابة مستقيمة 30-45°. أنزلها ببطء.", youtubeSearch: "straight leg raise exercise" },
    { nameAr: "تمرين الجدار — Wall Sit", nameEn: "Wall Sit", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 90, instructions: "استند بظهرك على الجدار وانزل حتى تصبح الركبتان بزاوية 90°. حافظ على الوضعية.", youtubeSearch: "wall sit exercise" },
    { nameAr: "ثني الركبة — Knee Flexion", nameEn: "Heel Slides / Knee Flexion", region: "LOWER", category: "Quadriceps", instructions: "استلقِ وحرّك الكعب نحو الأرداف لثني الركبة. عُد ببطء.", youtubeSearch: "heel slides knee flexion exercise" },
    { nameAr: "القرفصاء الجزئية", nameEn: "Partial Squat (Mini Squat)", region: "LOWER", category: "Quadriceps", instructions: "قف مع مباعدة القدمين بعرض الكتفين. انزل 30-45° في الركبتين ثم ارجع.", youtubeSearch: "mini squat exercise" },
    { nameAr: "القرفصاء الكاملة", nameEn: "Full Squat", region: "LOWER", category: "Quadriceps", instructions: "انزل بالقرفصاء الكاملة مع الحفاظ على استقامة الظهر.", youtubeSearch: "full squat exercise form" },
    { nameAr: "الطعنة الأمامية", nameEn: "Forward Lunge", region: "LOWER", category: "Quadriceps", instructions: "خطوة أمامية كبيرة وانزل حتى تصبح الركبة بزاوية 90°.", youtubeSearch: "forward lunge exercise" },
    { nameAr: "صعود الدرج", nameEn: "Step-Up", region: "LOWER", category: "Quadriceps", instructions: "اصعد على صندوق بارتفاع 20-30 سم بالساق المصابة أولاً.", youtubeSearch: "step up exercise" },
    { nameAr: "جهاز ضغط الساق", nameEn: "Leg Press", region: "LOWER", category: "Quadriceps", instructions: "اجلس على جهاز ضغط الساق وادفع بقدميك.", youtubeSearch: "leg press exercise form" },
    { nameAr: "تمديد الركبة على الجهاز", nameEn: "Leg Extension Machine", region: "LOWER", category: "Quadriceps", instructions: "اجلس على الجهاز ومدّد الركبة ببطء ثم أنزلها.", youtubeSearch: "leg extension exercise" },
    { nameAr: "ثني الركبة على الجهاز", nameEn: "Leg Curl Machine", region: "LOWER", category: "Hamstring", instructions: "استلقِ على بطنك وثنِ الركبة ضد المقاومة.", youtubeSearch: "hamstring curl exercise" },
    { nameAr: "جسر الورك", nameEn: "Hip Bridge / Glute Bridge", region: "LOWER", category: "Hamstring", instructions: "استلقِ على ظهرك مع ثني الركبتين. ارفع الورك للأعلى واضغط عضلات الأرداف.", youtubeSearch: "glute bridge exercise" },
    { nameAr: "جسر الورك بساق واحدة", nameEn: "Single Leg Bridge", region: "LOWER", category: "Hamstring", instructions: "نفس الجسر لكن بساق واحدة. الأخرى مرفوعة.", youtubeSearch: "single leg bridge exercise" },
    { nameAr: "الرفعة الميتة الرومانية", nameEn: "Romanian Deadlift (RDL)", region: "LOWER", category: "Hamstring", instructions: "أمسك بالبار وانحنِ من الورك مع الحفاظ على استقامة الظهر.", youtubeSearch: "romanian deadlift exercise" },
    { nameAr: "Nordic Hamstring Curl", nameEn: "Nordic Hamstring Curl", region: "LOWER", category: "Hamstring", instructions: "اركع مع تثبيت الكاحلين. أنزل جسمك للأمام ببطء مقاوماً بالعضلات الخلفية.", youtubeSearch: "nordic hamstring curl exercise" },
    { nameAr: "رفع الكعبين", nameEn: "Calf Raise", region: "LOWER", category: "Calf", instructions: "قف على حافة الدرج وارفع كعبيك ثم أنزلهما ببطء.", youtubeSearch: "calf raise exercise" },
    { nameAr: "رفع الكعب بساق واحدة", nameEn: "Single Leg Calf Raise", region: "LOWER", category: "Calf", instructions: "نفس تمرين رفع الكعبين لكن بساق واحدة.", youtubeSearch: "single leg calf raise exercise" },
    { nameAr: "تمرين المحارة", nameEn: "Clamshell Exercise", region: "LOWER", category: "Hip", instructions: "استلقِ على جانبك مع ثني الركبتين. افتح الركبة العلوية مثل المحارة.", youtubeSearch: "clamshell exercise hip" },
    { nameAr: "رفع الساق جانبياً", nameEn: "Side Lying Hip Abduction", region: "LOWER", category: "Hip", instructions: "استلقِ على جانبك وارفع الساق العلوية مستقيمة.", youtubeSearch: "side lying hip abduction exercise" },
    { nameAr: "Monster Walk بالمقاومة", nameEn: "Monster Walk (Band)", region: "LOWER", category: "Hip", instructions: "ضع حزام مقاومة حول الكاحلين وامشِ جانبياً.", youtubeSearch: "monster walk exercise band" },
    { nameAr: "قرفصاء بساق واحدة (Pistol)", nameEn: "Pistol Squat", region: "LOWER", category: "Quadriceps", instructions: "قف على ساق واحدة وانزل بالقرفصاء مع مد الساق الأخرى أمامك.", youtubeSearch: "pistol squat exercise" },
    { nameAr: "تمرين التوازن على ساق واحدة", nameEn: "Single Leg Balance", region: "LOWER", category: "Balance", instructions: "قف على ساق واحدة وحافظ على التوازن 30 ثانية.", youtubeSearch: "single leg balance exercise" },
    { nameAr: "BOSU Ball Squat", nameEn: "BOSU Ball Squat", region: "LOWER", category: "Balance", instructions: "قف على كرة BOSU وقم بالقرفصاء الجزئية.", youtubeSearch: "bosu ball squat exercise" },
    { nameAr: "تمرين القفز Box Jump", nameEn: "Box Jump", region: "LOWER", category: "Plyometric", instructions: "اقفز على صندوق بكلتا القدمين وانزل بتحكم.", youtubeSearch: "box jump exercise" },
    { nameAr: "قفزات جانبية", nameEn: "Lateral Hops", region: "LOWER", category: "Plyometric", instructions: "اقفز جانبياً على ساق واحدة فوق خط.", youtubeSearch: "lateral hops exercise" },
    // === UPPER BODY ===
    { nameAr: "تمرين البندول", nameEn: "Pendulum Exercise (Codman)", region: "UPPER", category: "Shoulder", instructions: "انحنِ للأمام ودع الذراع يتأرجح كالبندول في دوائر.", youtubeSearch: "pendulum exercise shoulder codman" },
    { nameAr: "رفع الذراع أمامياً", nameEn: "Shoulder Flexion Raise", region: "UPPER", category: "Shoulder", instructions: "ارفع الذراع أمامك مستقيماً حتى مستوى الكتف.", youtubeSearch: "shoulder flexion raise exercise" },
    { nameAr: "رفع الذراع جانبياً", nameEn: "Shoulder Abduction Raise", region: "UPPER", category: "Shoulder", instructions: "ارفع الذراع جانبياً حتى مستوى الكتف.", youtubeSearch: "shoulder abduction raise exercise" },
    { nameAr: "الدوران الخارجي بالمقاومة", nameEn: "External Rotation (Band)", region: "UPPER", category: "Rotator Cuff", instructions: "ثبّت المرفق بجانبك ولف الساعد للخارج ضد المقاومة.", youtubeSearch: "external rotation exercise band shoulder" },
    { nameAr: "الدوران الداخلي بالمقاومة", nameEn: "Internal Rotation (Band)", region: "UPPER", category: "Rotator Cuff", instructions: "ثبّت المرفق بجانبك ولف الساعد للداخل ضد المقاومة.", youtubeSearch: "internal rotation exercise band shoulder" },
    { nameAr: "تمرين الضغط على الحائط", nameEn: "Wall Push-Up", region: "UPPER", category: "Chest", instructions: "قف أمام الجدار وقم بحركة الضغط.", youtubeSearch: "wall push up exercise" },
    { nameAr: "تمرين الضغط", nameEn: "Push-Up", region: "UPPER", category: "Chest", instructions: "ضع يديك بعرض الكتفين وانزل بصدرك نحو الأرض ثم ادفع.", youtubeSearch: "push up exercise form" },
    { nameAr: "ثني المرفق بالدمبل", nameEn: "Bicep Curl", region: "UPPER", category: "Biceps", instructions: "أمسك الدمبل وثنِ المرفق ببطء ثم أنزل.", youtubeSearch: "bicep curl exercise" },
    { nameAr: "تمديد المرفق فوق الرأس", nameEn: "Overhead Tricep Extension", region: "UPPER", category: "Triceps", instructions: "أمسك الدمبل فوق رأسك وثنِ المرفق خلف الرأس ثم مدّد.", youtubeSearch: "overhead tricep extension exercise" },
    { nameAr: "تمرين المعصم — Wrist Curl", nameEn: "Wrist Curl", region: "UPPER", category: "Forearm", instructions: "أمسك الدمبل واثنِ المعصم للأعلى ثم أنزل.", youtubeSearch: "wrist curl exercise" },
    { nameAr: "Eccentric Wrist Extension", nameEn: "Eccentric Wrist Extension", region: "UPPER", category: "Forearm", instructions: "أمسك الدمبل بظهر اليد للأعلى. أنزل المعصم ببطء (التحميل اللامركزي).", youtubeSearch: "eccentric wrist extension exercise tennis elbow" },
    { nameAr: "تمرين I-Y-T", nameEn: "I-Y-T Raises", region: "UPPER", category: "Shoulder", instructions: "استلقِ على بطنك وارفع ذراعيك في أشكال I ثم Y ثم T.", youtubeSearch: "IYT raises exercise shoulder" },
    { nameAr: "Face Pull بالمقاومة", nameEn: "Face Pull (Band)", region: "UPPER", category: "Shoulder", instructions: "اسحب حزام المقاومة نحو وجهك مع فتح المرفقين.", youtubeSearch: "face pull exercise band" },
    { nameAr: "Scapular Retraction", nameEn: "Scapular Retraction", region: "UPPER", category: "Shoulder", instructions: "اسحب لوحي الكتف للخلف والأسفل. حافظ 5 ثوانٍ.", youtubeSearch: "scapular retraction exercise" },
    // === CORE ===
    { nameAr: "تمرين البلانك", nameEn: "Plank (Front)", region: "CORE", category: "Core Stability", instructions: "استند على الساعدين وأصابع القدمين. حافظ على استقامة الجسم.", youtubeSearch: "plank exercise form" },
    { nameAr: "بلانك جانبي", nameEn: "Side Plank", region: "CORE", category: "Core Stability", instructions: "استند على ساعد واحد وجانب القدم. ارفع الورك.", youtubeSearch: "side plank exercise" },
    { nameAr: "Dead Bug", nameEn: "Dead Bug Exercise", region: "CORE", category: "Core Stability", instructions: "استلقِ على ظهرك مع رفع الذراعين والركبتين. مدّد ذراعاً وساقاً معاكسين بالتناوب.", youtubeSearch: "dead bug exercise" },
    { nameAr: "Bird Dog", nameEn: "Bird Dog Exercise", region: "CORE", category: "Core Stability", instructions: "على أربعتك، مدّ ذراعاً وساقاً معاكسين. حافظ على استقامة الظهر.", youtubeSearch: "bird dog exercise" },
    { nameAr: "الكرانش", nameEn: "Crunch", region: "CORE", category: "Abdominals", instructions: "استلقِ على ظهرك مع ثني الركبتين. ارفع الكتفين عن الأرض.", youtubeSearch: "crunch exercise form" },
    { nameAr: "رفع الساقين", nameEn: "Leg Raise", region: "CORE", category: "Abdominals", instructions: "استلقِ على ظهرك وارفع الساقين المستقيمتين للأعلى.", youtubeSearch: "leg raise exercise" },
    { nameAr: "Pallof Press", nameEn: "Pallof Press", region: "CORE", category: "Anti-Rotation", instructions: "أمسك حزام المقاومة أمام صدرك وادفع للأمام مع مقاومة الدوران.", youtubeSearch: "pallof press exercise" },
    { nameAr: "تمرين Superman", nameEn: "Superman Exercise", region: "CORE", category: "Back Extension", instructions: "استلقِ على بطنك وارفع الذراعين والساقين معاً.", youtubeSearch: "superman exercise" },
    { nameAr: "Cat-Cow Stretch", nameEn: "Cat-Cow Stretch", region: "CORE", category: "Mobility", instructions: "على أربعتك، ارفع الظهر للأعلى (القطة) ثم أنزله (البقرة).", youtubeSearch: "cat cow stretch exercise" },
    { nameAr: "تدوير الجذع", nameEn: "Trunk Rotation", region: "CORE", category: "Mobility", instructions: "اجلس أو استلقِ ودوّر الجذع يميناً ويساراً.", youtubeSearch: "trunk rotation exercise" },
    { nameAr: "Isometric Quad at 30°", nameEn: "Isometric Quad Contraction 30°", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 30, instructions: "اجلس مع ثني الركبة 30°. شدّ عضلة الفخذ وحافظ 10 ثوانٍ.", youtubeSearch: "isometric quad exercise 30 degrees" },
    { nameAr: "Isometric Quad at 45°", nameEn: "Isometric Quad Contraction 45°", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 45, instructions: "اجلس مع ثني الركبة 45°. شدّ عضلة الفخذ وحافظ 10 ثوانٍ.", youtubeSearch: "isometric quad exercise 45 degrees" },
    { nameAr: "Isometric Quad at 60°", nameEn: "Isometric Quad Contraction 60°", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 60, instructions: "اجلس مع ثني الركبة 60°. شدّ عضلة الفخذ وحافظ 10 ثوانٍ.", youtubeSearch: "isometric quad exercise 60 degrees" },
    { nameAr: "Isometric Quad at 90°", nameEn: "Isometric Quad Contraction 90°", region: "LOWER", category: "Quadriceps", isIsometric: true, isometricAngle: 90, instructions: "اجلس مع ثني الركبة 90°. شدّ عضلة الفخذ وحافظ 10 ثوانٍ.", youtubeSearch: "isometric quad exercise 90 degrees" },
  ];

  for (const ex of exerciseData) {
    await prisma.exercise.create({
      data: {
        nameAr: ex.nameAr,
        nameEn: ex.nameEn,
        region: ex.region as ExerciseRegion,
        category: ex.category,
        isIsometric: ex.isIsometric || false,
        isometricAngle: ex.isometricAngle || null,
        instructions: ex.instructions || null,
        youtubeSearch: ex.youtubeSearch || null,
        isCustom: false,
      },
    });
  }
  console.log(`  ✅ Seeded ${exerciseData.length} exercises`);

  // ── Injury Protocols ──
  const protocols = [
    {
      nameAr: "اعتلال وتر الرضفة",
      nameEn: "Patellar Tendinopathy",
      overviewAr: "التهاب وتر الرضفة (Jumper's Knee) شائع في الرياضات التي تتطلب القفز. يتميز بألم أسفل الرضفة يزداد مع الحمل.",
      overviewEn: "Patellar tendinopathy is an overuse injury common in jumping sports. Pain localizes to the inferior pole of the patella.",
      rehabPrinciples: "التحميل التدريجي هو أساس العلاج. تمارين Eccentric و Isometric ثبت فعاليتها. تجنب الراحة المطلقة.",
      redFlags: JSON.stringify(["ألم شديد مفاجئ قد يشير لتمزق كامل", "تورم حاد وعدم القدرة على تمديد الركبة", "إحساس بفرقعة أثناء النشاط"]),
      phases: [
        { phase: "ACUTE" as RehabPhase, durationWeeks: "1-2 أسابيع", goals: JSON.stringify(["تقليل الألم", "الحفاظ على المدى الحركي"]), criteria: JSON.stringify(["ألم أقل من 3/10 أثناء الأنشطة اليومية"]), orderIndex: 0 },
        { phase: "RESTORE_ROM" as RehabPhase, durationWeeks: "2-4 أسابيع", goals: JSON.stringify(["استعادة المدى الحركي الكامل", "بدء Isometric loading"]), criteria: JSON.stringify(["مدى حركي كامل بدون ألم"]), orderIndex: 1 },
        { phase: "STRENGTH" as RehabPhase, durationWeeks: "4-8 أسابيع", goals: JSON.stringify(["تقوية العضلات", "Eccentric loading", "Heavy Slow Resistance"]), criteria: JSON.stringify(["قوة ≥ 80% مقارنة بالطرف السليم"]), orderIndex: 2 },
        { phase: "RETURN_TO_SPORT" as RehabPhase, durationWeeks: "2-4 أسابيع", goals: JSON.stringify(["العودة التدريجية للرياضة", "برنامج قفز متدرج"]), criteria: JSON.stringify(["بدون ألم أثناء القفز", "أداء وظيفي كامل"]), orderIndex: 3 },
      ],
    },
    {
      nameAr: "اعتلال وتر أخيل",
      nameEn: "Achilles Tendinopathy",
      overviewAr: "اعتلال وتر أخيل شائع في الرياضيين والعدائين. ألم في الجزء الأوسط أو عند اتصال الوتر بالكعب.",
      overviewEn: "Achilles tendinopathy presents with pain in the mid-portion or insertional area of the Achilles tendon.",
      rehabPrinciples: "Alfredson eccentric protocol أو Heavy Slow Resistance. تحميل تدريجي ومتابعة الألم.",
      redFlags: JSON.stringify(["ألم حاد مفاجئ في الكعب", "عدم القدرة على الوقوف على أطراف الأصابع", "Thompson test إيجابي"]),
      phases: [
        { phase: "ACUTE" as RehabPhase, durationWeeks: "1-2 أسابيع", goals: JSON.stringify(["تعديل النشاط", "بدء isometric calf raise"]), criteria: JSON.stringify(["ألم ≤ 3/10"]), orderIndex: 0 },
        { phase: "STRENGTH" as RehabPhase, durationWeeks: "6-12 أسابيع", goals: JSON.stringify(["Eccentric calf raises", "Heavy slow resistance"]), criteria: JSON.stringify(["single leg calf raise بدون ألم"]), orderIndex: 1 },
        { phase: "RETURN_TO_SPORT" as RehabPhase, durationWeeks: "4-6 أسابيع", goals: JSON.stringify(["برنامج جري متدرج", "تمارين بليومترية"]), criteria: JSON.stringify(["جري بدون ألم", "قفز بدون ألم"]), orderIndex: 2 },
      ],
    },
    {
      nameAr: "متلازمة الألم الرضفي الفخذي",
      nameEn: "Patellofemoral Pain Syndrome (PFPS)",
      overviewAr: "ألم أمام الركبة حول أو خلف الرضفة. يزداد مع صعود الدرج والجلوس الطويل والقرفصاء.",
      overviewEn: "Anterior knee pain around or behind the patella, worsened by stairs, prolonged sitting, and squatting.",
      rehabPrinciples: "تقوية عضلات الورك (خاصة Gluteus Medius) والفخذ. التحكم في valgus الركبة أثناء الحركة.",
      redFlags: JSON.stringify(["قفل الركبة (locking)", "انصباب متكرر", "عدم استقرار الرضفة"]),
      phases: [
        { phase: "ACUTE" as RehabPhase, durationWeeks: "1-2 أسابيع", goals: JSON.stringify(["تقليل الألم", "تعديل الأنشطة"]), criteria: JSON.stringify(["ألم ≤ 3/10"]), orderIndex: 0 },
        { phase: "STRENGTH" as RehabPhase, durationWeeks: "4-8 أسابيع", goals: JSON.stringify(["تقوية الورك", "تقوية VMO", "تمارين closed-chain"]), criteria: JSON.stringify(["قرفصاء بدون ألم", "صعود درج بدون ألم"]), orderIndex: 1 },
        { phase: "FUNCTIONAL" as RehabPhase, durationWeeks: "2-4 أسابيع", goals: JSON.stringify(["تحسين biomechanics", "تمارين وظيفية رياضية"]), criteria: JSON.stringify(["أداء رياضي بدون ألم"]), orderIndex: 2 },
      ],
    },
    {
      nameAr: "إعادة تأهيل الرباط الصليبي الأمامي",
      nameEn: "ACL Reconstruction Rehabilitation",
      overviewAr: "بروتوكول شامل لإعادة التأهيل بعد عملية إعادة بناء الرباط الصليبي الأمامي.",
      overviewEn: "Comprehensive rehabilitation protocol following ACL reconstruction surgery.",
      rehabPrinciples: "تأهيل متدرج عبر 6 مراحل خلال 9-12 شهراً. التركيز على المدى الحركي المبكر والتحميل التدريجي.",
      redFlags: JSON.stringify(["تورم شديد مفاجئ", "عدم استقرار أو giving way", "ألم حاد غير مبرر", "حمى أو احمرار (عدوى)"]),
      phases: [
        { phase: "ACUTE" as RehabPhase, durationWeeks: "0-2 أسابيع", goals: JSON.stringify(["حماية الرقعة", "تقليل التورم", "تحقيق تمديد كامل", "بدء Quad activation"]), criteria: JSON.stringify(["تمديد كامل 0°", "ثني ≥ 90°", "SLR بدون lag"]), orderIndex: 0 },
        { phase: "RESTORE_ROM" as RehabPhase, durationWeeks: "2-6 أسابيع", goals: JSON.stringify(["مدى حركي كامل", "مشي طبيعي بدون عكاز", "تقوية عضلية مبكرة"]), criteria: JSON.stringify(["مدى حركي كامل", "مشي بنمط طبيعي", "بدون تورم"]), orderIndex: 1 },
        { phase: "STRENGTH" as RehabPhase, durationWeeks: "6-12 أسبوع", goals: JSON.stringify(["تقوية مكثفة", "بدء CKC exercises", "تحمل القوة"]), criteria: JSON.stringify(["قوة ≥ 70% LSI", "single leg press بدون ألم"]), orderIndex: 2 },
        { phase: "NEUROMUSCULAR" as RehabPhase, durationWeeks: "12-20 أسبوع", goals: JSON.stringify(["تحكم عصبي عضلي", "تمارين proprioception", "بدء جري خفيف"]), criteria: JSON.stringify(["Y-Balance test ≥ 90%", "جري مستقيم بدون ألم"]), orderIndex: 3 },
        { phase: "FUNCTIONAL" as RehabPhase, durationWeeks: "20-32 أسبوع", goals: JSON.stringify(["تمارين رشاقة", "تمارين بليومترية", "تمارين رياضية خاصة"]), criteria: JSON.stringify(["Hop tests ≥ 90% LSI", "قوة ≥ 90% LSI"]), orderIndex: 4 },
        { phase: "RETURN_TO_SPORT" as RehabPhase, durationWeeks: "32-48 أسبوع", goals: JSON.stringify(["عودة تدريجية للتدريب", "عودة للمباريات"]), criteria: JSON.stringify(["كل اختبارات RTS ≥ 90%", "جاهزية نفسية (ACL-RSI ≥ 56)"]), orderIndex: 5 },
      ],
    },
    {
      nameAr: "مرفق التنس (التهاب اللقيمة الوحشية)",
      nameEn: "Tennis Elbow (Lateral Epicondylitis)",
      overviewAr: "ألم في الجانب الخارجي للمرفق ناتج عن الإفراط في استخدام عضلات الساعد الباسطة.",
      overviewEn: "Pain at the lateral epicondyle due to overuse of wrist extensors.",
      rehabPrinciples: "تمارين Eccentric wrist extension. Tyler Twist exercise. تعديل النشاط.",
      redFlags: JSON.stringify(["ضعف القبضة الشديد", "خدر أو تنميل في اليد", "عدم تحسن بعد 12 أسبوع"]),
      phases: [
        { phase: "ACUTE" as RehabPhase, durationWeeks: "1-2 أسابيع", goals: JSON.stringify(["تقليل الألم", "تعديل النشاط", "isometric wrist extension"]), criteria: JSON.stringify(["ألم ≤ 4/10"]), orderIndex: 0 },
        { phase: "STRENGTH" as RehabPhase, durationWeeks: "4-8 أسابيع", goals: JSON.stringify(["Eccentric wrist extension", "Tyler Twist", "تقوية تدريجية"]), criteria: JSON.stringify(["قبضة بدون ألم", "أنشطة يومية بدون ألم"]), orderIndex: 1 },
        { phase: "RETURN_TO_SPORT" as RehabPhase, durationWeeks: "2-4 أسابيع", goals: JSON.stringify(["عودة تدريجية للنشاط"]), criteria: JSON.stringify(["بدون ألم أثناء النشاط الرياضي"]), orderIndex: 2 },
      ],
    },
  ];

  for (const proto of protocols) {
    await prisma.injuryProtocol.create({
      data: {
        nameAr: proto.nameAr,
        nameEn: proto.nameEn,
        overviewAr: proto.overviewAr,
        overviewEn: proto.overviewEn,
        rehabPrinciples: proto.rehabPrinciples,
        redFlags: proto.redFlags,
        isCustom: false,
        phases: {
          create: proto.phases,
        },
      },
    });
  }
  console.log(`  ✅ Seeded ${protocols.length} injury protocols`);

  console.log("🌱 Seeding complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
