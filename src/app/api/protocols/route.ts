import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";

// Pre-seeded medical protocols for Peak Motion
const PRESEEDED_PROTOCOLS = [
  {
    id: "proto-patellar",
    nameAr: "اعتلال وتر الرضفة (ركبة القافز)",
    nameEn: "Patellar Tendinopathy",
    overviewAr: "اعتلال شائع في وتر الرضفة ناتج عن الإجهاد الميكانيكي المتكرر والقفز. يتمركز الألم عند القطب السفلي للرضفة ويزداد مع القرفصاء والقفز وصعود الدرج.",
    overviewEn: "Patellar tendinopathy is an overuse injury common in jumping sports. Pain localizes to the inferior pole of the patella and worsens with tendon load.",
    rehabPrinciples: "التحميل المتدرج للأوتار عبر 4 مراحل سريرية: البدء بالانقباضات الإيزومترية لتسكين الألم الفوري، تليها تمارين المقاومة البطيئة الثقيلة (HSR)، ثم تدريبات تخزين وإطلاق الطاقة البليومترية، وأخيراً محاكاة الأنشطة الرياضية التنافسية. يجب تجنب الراحة التامة لأنها تؤدي لتدهور خصائص الوتر.",
    redFlags: JSON.stringify([
      "ألم حاد مفاجئ وشديد مع سماع صوت فرقعة (اشتباه تمزق وتر الرضفة الكامل — Patellar Tendon Rupture)",
      "عدم القدرة التامة على بسط الركبة ضد الجاذبية (Loss of active knee extension)",
      "انصباب حاد وتورم مفصلي سريع ومفاجئ داخل الركبة (Intra-articular effusion)",
      "احمرار موضعي شديد مع سخونة وحمى (اشتباه التهاب جرابي صديدي — Septic Bursitis)",
    ]),
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-patellar-1",
        phase: "ACUTE",
        durationWeeks: "1-2 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تخفيف الألم الموضعي إلى أقل من 3/10 على مقياس VAS",
          "تقليل الحمل الديناميكي العالي على وتر الرضفة",
          "الحفاظ على التنشيط العصبي العضلي للعضلة رباعية الرؤوس",
        ]),
        criteria: JSON.stringify([
          "تحمل الانقباض الإيزومتري لمدة 45 ثانية x 5 تكرارات بألم ≤ 3/10",
          "استقرار الأعراض بعد 24 ساعة من أداء التمارين الإيزومترية",
        ]),
        exercises: [
          {
            id: "ex-patellar-1",
            sets: 5,
            reps: 1,
            notes: "ثبات 45 ثانية بحمل 70% من أقصى قوة، راحة دقيقتين بين المجموعات",
            exercise: {
              id: "ex-quad-iso",
              nameAr: "تمديد الركبة الإيزومتري بجهاز Leg Extension عند 60°",
              nameEn: "Isometric Leg Extension at 60°",
              category: "Quadriceps",
              instructions: "اجلس على الجهاز مع تثبيت الركبة بزاوية 60°. قم بانقباض إيزومتري ثابت دون حركة المفصل.",
            },
          },
          {
            id: "ex-patellar-2",
            sets: 4,
            reps: 1,
            notes: "ثبات 45 ثانية بزاوية ركبة 70-90° مع حزام خلف الركبة لتفريغ الوزن",
            exercise: {
              id: "ex-spanish-squat",
              nameAr: "تمرين القرفصاء الإسبانية (Spanish Squat)",
              nameEn: "Spanish Squat Hold",
              category: "Quadriceps",
              instructions: "ثبت حزاماً سميكاً خلف الركبتين مربوطاً بقائم، وانزل للخلف في وضعية القرفصاء الجزئية مع الحفاظ على استقامة الجذع.",
            },
          },
          {
            id: "ex-patellar-3",
            sets: 3,
            reps: 12,
            notes: "تنشيط عضلات الحوض والأرداف لتخفيف الحمل عن الركبة",
            exercise: {
              id: "ex-glute-bridge",
              nameAr: "جسر الأرداف (Glute Bridge)",
              nameEn: "Glute Bridge",
              category: "Hip / Glutes",
              instructions: "استلقِ على ظهرك واثنِ الركبتين، ثم ارفع الحوض للأعلى مع قبض عضلات الأرداف بإحكام.",
            },
          },
        ],
      },
      {
        id: "phase-patellar-2",
        phase: "RESTORE_ROM",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "تحفيز تصنيع الكولاجين وزيادة سمك الوتر",
          "بناء القوة القصوى للعضلة رباعية الرؤوس",
          "استعادة المدى الحركي الكامل للثني والتمديد",
        ]),
        criteria: JSON.stringify([
          "أداء تمارين HSR بمعدل 3 ثوانٍ نزولاً و3 ثوانٍ صعوداً بدون تفاقم الألم في اليوم التالي",
          "مؤشر تماثل القوة الطرفية LSI ≥ 75%",
        ]),
        exercises: [
          {
            id: "ex-patellar-4",
            sets: 4,
            reps: 8,
            notes: "3 ثوانِ هبوط لامركزي و3 ثوانِ صعود، حمل ثقيل 6-8 RM",
            exercise: {
              id: "ex-decline-squat",
              nameAr: "القرفصاء على لوح مائل 25° (Decline Board Squat)",
              nameEn: "Decline Board Squat (HSR)",
              category: "Quadriceps",
              instructions: "قف على لوح مائل بزاوية 25° مع الكعبين للأعلى، انزل ببطء في القرفصاء لتحميل مباشر على وتر الرضفة.",
            },
          },
          {
            id: "ex-patellar-5",
            sets: 4,
            reps: 8,
            notes: "تركيز على المرحلة اللامركزية وبطء الحركة",
            exercise: {
              id: "ex-leg-press",
              nameAr: "جهاز ضغط الساق الأحادي (Single Leg Press)",
              nameEn: "Single Leg Press",
              category: "Quadriceps",
              instructions: "ادفع الوزن بساق واحدة ببطء وتحكم، وانزل ببطء لمدة 3-4 ثوانٍ دون قفل مفصل الركبة.",
            },
          },
        ],
      },
      {
        id: "phase-patellar-3",
        phase: "NEUROMUSCULAR",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "تطوير قدرة دورة التمدد والتقصير (Stretch-Shortening Cycle)",
          "تحمل الهبوط وامتصاص الصدمات بمحاذاة سليمة",
          "تحسين التوافق العضلي العصبي وسرعة رد الفعل",
        ]),
        criteria: JSON.stringify([
          "إجراء اختبار القفز الأحادي بدون ألم",
          "مؤشر تماثل القوة LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-patellar-6",
            sets: 4,
            reps: 6,
            notes: "التركيز على الثبات الفوري بدون ارتعاش وبدون انحراف للداخل",
            exercise: {
              id: "ex-box-drop",
              nameAr: "الهبوط من الصندوق وتثبيت الهبوط (Box Drop & Stick)",
              nameEn: "Box Drop & Stick Landing",
              category: "Plyometrics",
              instructions: "انزل من صندوق بارتفاع 30 سم واهبط بهدوء مع ثني الركبتين وامتصاص الصدمة.",
            },
          },
          {
            id: "ex-patellar-7",
            sets: 3,
            reps: 20,
            notes: "قفزات سريعة ومرنة لتدريب مرونة الوتر",
            exercise: {
              id: "ex-pogo",
              nameAr: "قفزات بوجو السريعة (Pogo Hops)",
              nameEn: "Pogo Hops",
              category: "Plyometrics",
              instructions: "اقفز بقدمين أو قدم واحدة باعتماد مرونة الكاحل والركبة دون ثني عميق.",
            },
          },
        ],
      },
      {
        id: "phase-patellar-4",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "4-6 أسابيع",
        orderIndex: 3,
        goals: JSON.stringify([
          "العودة الكاملة للتدريبات الجماعية والمباريات",
          "تحمل أحمال المنافسة المتكررة",
          "تطبيق برنامج وقائي دائم لمنع الانتكاس",
        ]),
        criteria: JSON.stringify([
          "مؤشر التماثل LSI ≥ 90% في القوة والقفز",
          "مقياس VISA-P ≥ 85 نقطة",
          "عدم وجود ألم أو تيبس بعد 24 ساعة من التدريب الشاق",
        ]),
        exercises: [
          {
            id: "ex-patellar-8",
            sets: 4,
            reps: 6,
            notes: "تسارع وكبح بأقصى سرعة مع تغيير الاتجاه 90 و180 درجة",
            exercise: {
              id: "ex-cod-drills",
              nameAr: "تدريبات تغيير الاتجاه والرشاقة (Change of Direction Drills)",
              nameEn: "Agility & Change of Direction Drills",
              category: "Functional Training",
              instructions: "تمارين قمعية مكثفة تحاكي مراوغة الخصم وتغيير المسار الحركي في الملعب.",
            },
          },
          {
            id: "ex-patellar-9",
            sets: 3,
            reps: 1,
            notes: "جلسات صيانة دورية مرتين أسبوعياً لمنع عودة الأعراض",
            exercise: {
              id: "ex-maintenance",
              nameAr: "بروتوكول الصيانة الإيزومترية الأسبوعي",
              nameEn: "Isometric Maintenance Session",
              category: "Quadriceps",
              instructions: "انقباضات إيزومترية مكثفة 45 ثانية x 4 تكرارات قبل أو بعد الوحدات التدريبية.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-achilles",
    nameAr: "اعتلال وتر أخيل (التهاب وتر العرقوب)",
    nameEn: "Achilles Tendinopathy",
    overviewAr: "اعتلال مزمن في نسيج وتر أخيل يظهر غالباً عند الرياضيين والعدائين. يتمركز الألم والتيبس الصباحي في منتصف الوتر (Midportion) أو عند اتصاله بعظمة العقب (Insertional).",
    overviewEn: "Achilles tendinopathy presents with pain, localized swelling, and morning stiffness in the mid-portion or insertional region.",
    rehabPrinciples: "بروتوكول ألفريدسون (Alfredson Eccentric Protocol) أو بروتوكول المقاومة البطيئة الثقيلة Silbernagel. تعديل درجة الثني الظهري بحسب مكان الإصابة (تجنب الإفراط في الثني الظهري في الحالات الاندخالية Insertional).",
    redFlags: [
      "شعور مباغت بضربة حجرية حادة خلف الكاحل مع صوت طرقعة مسموع (تمزق وتر أخيل الكامل — Complete Rupture)",
      "فحص تومسون إيجابي (Positive Thompson/Simmonds Squeeze Test)",
      "عدم القدرة التامة على الوقوف على أطراف أصابع القدم (Loss of single leg calf raise)",
      "ألم حاد مترافق مع برودة وشحوب في القدم (اشتباه قصور وعائي حاد)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-achilles-1",
        phase: "ACUTE",
        durationWeeks: "1-2 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تخفيف الألم الصباحي والتيبس",
          "تعديل أحمال الجري والقفز",
          "بدء التحميل الإيزومتري لتسكين الألم",
        ]),
        criteria: JSON.stringify([
          "ألم الصباح ≤ 3/10 على مقياس VAS",
          "القدرة على المشي المعتدل بدون عرج واضح",
        ]),
        exercises: [
          {
            id: "ex-achilles-1",
            sets: 5,
            reps: 1,
            notes: "ثبات 45 ثانية على مشط القدم في وضعية الوقوف على الأرض، 5 مرات يومياً",
            exercise: {
              id: "ex-iso-calf",
              nameAr: "رفع الكعب الإيزومتري على الأرض (Isometric Calf Raise Hold)",
              nameEn: "Isometric Calf Raise Hold",
              category: "Calf",
              instructions: "قف على القدمين وارفع الكعبين في منتصف المدى، حافظ على الثبات لمدة 45 ثانية.",
            },
          },
        ],
      },
      {
        id: "phase-achilles-2",
        phase: "STRENGTH",
        durationWeeks: "6-12 أسبوعاً",
        orderIndex: 1,
        goals: JSON.stringify([
          "تنشيط ألياف الوتر وإعادة ترتيب الكولاجين عبر التحميل اللامركزي",
          "تقوية العضلة التوأمية والنعلية (Gastrocnemius & Soleus)",
          "تحقيق القدرة على رفع الكعب الأحادي 25 تكراراً بدون ألم",
        ]),
        criteria: JSON.stringify([
          "إتمام 25 رفعة كعب بساق واحدة (Single Leg Calf Raise) متتالية",
          "مؤشر تماثل القوة LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-achilles-2",
            sets: 3,
            reps: 15,
            notes: "تكرار بالركبة ممدودة ثم بالركبة مثنية 45° لاستهداف عضلة السولوس",
            exercise: {
              id: "ex-alfredson",
              nameAr: "إنزال الكعب اللامركزي على حافة الدرج (Alfredson Eccentric Heel Drops)",
              nameEn: "Alfredson Eccentric Heel Drops",
              category: "Calf",
              instructions: "اصعد بالقدمين وأنزل الكعب ببطء بالساق المصابة أسفل مستوى الدرجة لمدة 3 ثوانٍ.",
            },
          },
          {
            id: "ex-achilles-3",
            sets: 4,
            reps: 10,
            notes: "تحميل ثقيل وبطيء، لأن عضلة السولوس تتحمل 8 أضعاف وزن الجسم أثناء الركض",
            exercise: {
              id: "ex-seated-calf",
              nameAr: "رفع الكعب جالساً بالوزن (Seated Calf Raise)",
              nameEn: "Seated Calf Raise (Soleus Focus)",
              category: "Calf",
              instructions: "اجلس مع وضع الوزن فوق الركبتين وارفع الكعبين للأعلى ببطء ثم أنزلهما بتحكم تام.",
            },
          },
        ],
      },
      {
        id: "phase-achilles-3",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "استعادة الوظيفة المرنة الزنبركية لوتر أخيل",
          "برنامج الجري التدرجي (Walk-to-Run)",
          "العودة للأنشطة الرياضية التنافسية",
        ]),
        criteria: JSON.stringify([
          "مقياس تقييم وتر أخيل VISA-A ≥ 85 نقطة",
          "اختبار القفز الأحادي Single Leg Hop LSI ≥ 90%",
          "الجري المستمر 20 دقيقة بدون أي ألم في اليوم التالي",
        ]),
        exercises: [
          {
            id: "ex-achilles-4",
            sets: 4,
            reps: 20,
            notes: "قفزات زنبركية سريعة ومرنة لتدريب صلابة الكاحل الارتدادية",
            exercise: {
              id: "ex-ankle-pogo",
              nameAr: "قفزات الكاحل الزنبركية المتتالية (Ankle Pogo Hops)",
              nameEn: "Ankle Pogo Hops",
              category: "Plyometrics",
              instructions: "اقفز على مشط القدم بارتداد سريع وخفيف مع الحفاظ على استقامة الركبة تقريباً.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-pfps",
    nameAr: "متلازمة الألم الرضفي الفخذي (ركبة العداء)",
    nameEn: "Patellofemoral Pain Syndrome (PFPS)",
    overviewAr: "ألم غير رضحي خلف أو حول عظمة الصابونة (الرضفة) يتفاقم مع ثني الركبة المحمّل مثل صعود ونزول الدرج، القرفصاء، والجلوس المطول (علامة مسرح السينما Movie Theater Sign).",
    overviewEn: "Anterior knee pain around or behind the patella, exacerbated by activities loading the patellofemoral joint: stairs, squatting, and prolonged sitting.",
    rehabPrinciples: "تقوية عضلات الحوض والمؤخرة (Gluteus Medius & Maximus) بالتوازي مع العضلة رباعية الرؤوس. تصحيح انحراف الركبة إلى الداخل (Dynamic Knee Valgus)، وتعديل الأحمال وتفادي النطاقات ذات الضغط العالي.",
    redFlags: [
      "قفل ميكانيكي تام في الركبة (True Joint Locking — اشتباه تمزق غضروف هلالي دلو المقبض Bucket-handle tear)",
      "انصباب حاد وتجمع سوائل ملحوظ بالركبة (Tense Joint Effusion)",
      "تاريخ خلع أو عدم استقرار صريح بالرضفة (Patellar Dislocation / Subluxation)",
      "ألم ليلي مستمر لا يهدأ بالراحة التامة (اشتباه أورام أو التهابات مناعية)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-pfps-1",
        phase: "ACUTE",
        durationWeeks: "1-3 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تخفيف الألم في الأنشطة اليومية وصعود الدرج",
          "تنشيط عضلات الورك والمؤخرة في وضعيات السلسلة المفتوحة الآمنة",
          "تقليل الضغط على المفصل الرضفي الفخذي",
        ]),
        criteria: JSON.stringify([
          "ألم صعود ونزول الدرج ≤ 2/10",
          "الجلوس المطول لأكثر من 45 دقيقة بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-pfps-1",
            sets: 3,
            reps: 15,
            notes: "تنشيط عضلات التدوير الخارجي للورك بدون أي حمل على الركبة",
            exercise: {
              id: "ex-clamshell",
              nameAr: "تمرين المحارة بمطاط المقاومة (Clamshell)",
              nameEn: "Clamshell with Resistance Band",
              category: "Hip",
              instructions: "استلقِ على جنبك واثنِ الركبتين مع وضع مطاط مقاومة حول الفخذين، افتح الركبة العلوية للأعلى وأغلقها ببطء.",
            },
          },
          {
            id: "ex-pfps-2",
            sets: 3,
            reps: 12,
            notes: "تثبيت حزام حول الفخذين لتعزيز إبعاد الحوض أثناء رفع الجسر",
            exercise: {
              id: "ex-bridge-abduct",
              nameAr: "جسر الأرداف مع شد الحزام للخارج (Glute Bridge with Abduction)",
              nameEn: "Glute Bridge with Abduction",
              category: "Hip / Glutes",
              instructions: "ارفع الحوض للأعلى مع دفع الركبتين للخارج ضد مقاومة الحزام المطاطي.",
            },
          },
        ],
      },
      {
        id: "phase-pfps-2",
        phase: "STRENGTH",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "الدمج الوظيفي وتقوية السلسلة المغلقة (Closed Kinetic Chain)",
          "القضاء التام على انحراف الركبة لداخل (Dynamic Valgus)",
          "تحسين محاذاة الرضفة أثناء الحركة",
        ]),
        criteria: JSON.stringify([
          "أداء 10 تكرارات Step-Down بساق واحدة بمحاذاة مثالية بدون فالجوس وبدون ألم",
          "قوة عضلات الحوض المبعدة LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-pfps-3",
            sets: 3,
            reps: 10,
            notes: "الحفاظ على الركبة بمحاذاة إصبع القدم الثاني ومنع ميل الحوض",
            exercise: {
              id: "ex-step-down",
              nameAr: "النزول من الدرجة بساق واحدة (Single Leg Step-Down)",
              nameEn: "Single Leg Step-Down",
              category: "Quadriceps & Hip",
              instructions: "قف على درجة بارتفاع 15-20 سم بساق واحدة وانزل بكعب الساق الأخرى للمس الأرض بخفة ثم اصعد.",
            },
          },
          {
            id: "ex-pfps-4",
            sets: 3,
            reps: 12,
            notes: "الحفاظ على وضعية نصف القرفصاء أثناء المشي الجانبي",
            exercise: {
              id: "ex-monster-walk",
              nameAr: "مشي الوحش بمطاط المقاومة (Resisted Monster Walk)",
              nameEn: "Resisted Monster Walk",
              category: "Hip",
              instructions: "ضع حزام المقاومة حول الكاحلين وامشِ خطوات جانبية مع الحفاظ على التوتر العضلي وثبات الجذع.",
            },
          },
        ],
      },
      {
        id: "phase-pfps-3",
        phase: "FUNCTIONAL",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "التحكم الحركي الكامل في الهبوط والركض",
          "العودة للأنشطة الرياضية التنافسية بدون أي تحفظ",
        ]),
        criteria: JSON.stringify([
          "مقياس Kujala Patellofemoral Scale ≥ 90 نقطة",
          "غياب الألم تماماً أثناء الركض وتغيير الاتجاه",
        ]),
        exercises: [
          {
            id: "ex-pfps-5",
            sets: 4,
            reps: 8,
            notes: "امتصاص القوة بمحاذاة حركية سليمة للطرف السفلي",
            exercise: {
              id: "ex-decel-landing",
              nameAr: "تمارين الهبوط وامتصاص السرعة (Deceleration & Landing Drills)",
              nameEn: "Deceleration & Landing Drills",
              category: "Neuromuscular",
              instructions: "انطلق بسرعة معتدلة ثم توقف بثبات مفاجئ على قدم واحدة مع مراعاة وضعية الركبة السليمة.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-acl",
    nameAr: "إعادة تأهيل الرباط الصليبي الأمامي (ACLR)",
    nameEn: "ACL Reconstruction Rehabilitation",
    overviewAr: "بروتوكول تأهيلي شامل قائم على المعايير السريرية (Criterion-based) يمتد عبر 6 مراحل تدريجية خلال 9 إلى 12 شهراً لحماية الطعم واستعادة الوظيفة العصبية العضلية والوقاية من الإصابة الثانوية.",
    overviewEn: "Comprehensive criterion-based post-operative ACL reconstruction protocol progressing through six phases over 9-12 months.",
    rehabPrinciples: "تحقيق التمديد الكامل 0° مبكراً خلال أول أسبوعين، حماية الطعم أثناء مرحلة إعادة التوعية (Ligamentization)، تقوية العضلة الرباعية والعضلات الخلفية، تدريب التوازن والتوافق الحركي، وتطبيق بطارية اختبارات RTS الصارمة قبل التصريح الرياضي.",
    redFlags: [
      "فقدان تمديد الركبة التام المستمر (اشتباه Cyclops Lesion أو Arthrofibrosis)",
      "عدم ثبات مفصلي حاد أو إحساس بـ Giving Way أثناء المشي العادي (اشتباه فشل الطعم)",
      "علامات خثار وريدي عميق DVT (ألم وتورم واحمرار في ربلة الساق — Calf tenderness)",
      "حمى موضعية أو عامة ونزيز صديدي من الجروح الجراحية (اشتباه عدوى مفصلية جرثومية عاجلة)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-acl-1",
        phase: "ACUTE",
        durationWeeks: "0-2 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "حماية الرقعة وتقليل التورم والانصباب",
          "تحقيق التمديد الكامل للركبة 0° Passive Extension",
          "تنشيط العضلة رباعية الرؤوس بدون حدوث تأخر (Quad Lag)",
        ]),
        criteria: JSON.stringify([
          "تمديد كامل 0° مساوٍ للطرف السليم",
          "ثني الركبة ≥ 90°",
          "رفع الساق المستقيمة (SLR) بدون Quad Lag",
        ]),
        exercises: [
          {
            id: "ex-acl-1",
            sets: 4,
            reps: 15,
            notes: "ضغط الركبة لأسفل مع شد مشط القدم للأعلى لمدة 10 ثوانٍ",
            exercise: {
              id: "ex-quad-set",
              nameAr: "شد العضلة الرباعية (Quad Set)",
              nameEn: "Quad Set",
              category: "Quadriceps",
              instructions: "استلقِ على السرير واضغط الركبة لأسفل بقوة لتسطيح الجزء الخلفي من الركبة مع رفع الكعب قليلاً.",
            },
          },
          {
            id: "ex-acl-2",
            sets: 3,
            reps: 12,
            notes: "الحفاظ على الركبة مفرودة تماماً بدون أي انثناء أثناء الرفع",
            exercise: {
              id: "ex-slr",
              nameAr: "رفع الساق المستقيمة (Straight Leg Raise)",
              nameEn: "Straight Leg Raise",
              category: "Quadriceps",
              instructions: "اشدد العضلة الرباعية وارفع الساق مستقيمة حتى مستوى ركبة الطرف الآخر ثم أنزلها ببطء.",
            },
          },
        ],
      },
      {
        id: "phase-acl-2",
        phase: "RESTORE_ROM",
        durationWeeks: "2-6 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "استعادة المدى الحركي الكامل للثني والتمديد",
          "المشي بنمط طبيعي متناسق بدون عكازات",
          "بدء تمارين السلسلة الحركية المغلقة الخفيفة",
        ]),
        criteria: JSON.stringify([
          "ثني الركبة ≥ 120° وتمديد 0°",
          "مشي متناسق بدون عرج وبدون عكاز",
          "غياب الانصباب والتورم المستمر",
        ]),
        exercises: [
          {
            id: "ex-acl-3",
            sets: 3,
            reps: 12,
            notes: "استخدام وزن الجسم فقط مع ثني لا يتجاوز 60 درجة في البداية",
            exercise: {
              id: "ex-mini-squat",
              nameAr: "القرفصاء الجزئية (Mini Squat 0-60°)",
              nameEn: "Partial Squat",
              category: "Quadriceps",
              instructions: "قف مع مباعدة القدمين بعرض الكتفين وانزل بالقرفصاء الجزئية حتى زاوية 60° ثم اصعد.",
            },
          },
        ],
      },
      {
        id: "phase-acl-3",
        phase: "STRENGTH",
        durationWeeks: "6-12 أسبوعاً",
        orderIndex: 2,
        goals: JSON.stringify([
          "تقوية مكثفة للعضلة الرباعية والخلفية",
          "تطوير تحمل القوة العضلية",
          "تحقيق تماثل القوة LSI ≥ 70%",
        ]),
        criteria: JSON.stringify([
          "مؤشر تماثل القوة LSI ≥ 70%",
          "أداء جهاز ضغط الساق الأحادي بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-acl-4",
            sets: 4,
            reps: 10,
            notes: "مقاومة تدريجية مع التركيز على التحميل المتساوي",
            exercise: {
              id: "ex-leg-press-acl",
              nameAr: "جهاز ضغط الساق (Leg Press Progression)",
              nameEn: "Leg Press Machine",
              category: "Quadriceps",
              instructions: "ادفع منصة الجهاز مع المحافظة على مسار الركبتين فوق أصابع القدم.",
            },
          },
        ],
      },
      {
        id: "phase-acl-4",
        phase: "NEUROMUSCULAR",
        durationWeeks: "12-20 أسبوعاً",
        orderIndex: 3,
        goals: JSON.stringify([
          "التحكم العصبي العضلي والتوازن الديناميكي",
          "بدء برنامج الجري المستقيم في خط مستقيم",
          "تحسين التوافق والاتزان على ساق واحدة",
        ]),
        criteria: JSON.stringify([
          "اختبار التوازن الديناميكي Y-Balance Test LSI ≥ 90%",
          "الجري المستقيم على جهاز المشي 10 دقائق بدون ألم أو تورم",
        ]),
        exercises: [
          {
            id: "ex-acl-5",
            sets: 3,
            reps: 30,
            notes: "ثبات 30 ثانية لكل اتجاه، إضافة إغلاق العينين أو سطح غير مستقر",
            exercise: {
              id: "ex-y-balance",
              nameAr: "تمرين التوازن الديناميكي Y-Balance Drill",
              nameEn: "Single Leg Dynamic Balance",
              category: "Balance & Neuromuscular",
              instructions: "قف على الساق المصابة ومد الساق الأخرى للأمام والخلف والجانبين مع الحفاظ على الاتزان.",
            },
          },
        ],
      },
      {
        id: "phase-acl-5",
        phase: "FUNCTIONAL",
        durationWeeks: "20-32 أسبوعاً",
        orderIndex: 4,
        goals: JSON.stringify([
          "تدريبات القفز والبليومتري المتدرج",
          "تطوير الرشاقة وتغيير الاتجاه (Agility & COD)",
          "تحقيق LSI ≥ 85% في اختبارات القفز الوظيفية",
        ]),
        criteria: JSON.stringify([
          "اجتياز بطارية اختبارات القفز Hop Tests LSI ≥ 85%",
          "قوة العضلة الرباعية LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-acl-6",
            sets: 4,
            reps: 5,
            notes: "تسارع وكبح مع تغيير اتجاه 45 و90 درجة",
            exercise: {
              id: "ex-agility-t",
              nameAr: "اختبار وتدريب الرشاقة T-Test Drill",
              nameEn: "T-Test Agility Drill",
              category: "Agility & Functional",
              instructions: "انطلاق سريع للأمام، خطوة جانبية لليسار، خطوة لليمين، ثم رجوع للخلف بأقصى تحكم.",
            },
          },
        ],
      },
      {
        id: "phase-acl-6",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "32-48 أسبوعاً",
        orderIndex: 5,
        goals: JSON.stringify([
          "العودة الكاملة للتدريب الجماعي والمباريات",
          "الجاهزية النفسية والتغلب على الخوف من تجدد الإصابة",
          "الوقاية الدائمة من إصابة الطرف الآخر",
        ]),
        criteria: JSON.stringify([
          "بطارية RTS كاملة LSI ≥ 90% (القوة والقفز)",
          "مقياس الجاهزية النفسية ACL-RSI ≥ 60 نقطة",
          "إتمام 4 أسابيع من التدريب الجماعي الكامل بدون انتكاس",
        ]),
        exercises: [
          {
            id: "ex-acl-7",
            sets: 1,
            reps: 1,
            notes: "محاكاة شاملة لمواقف المباريات الحقيقية",
            exercise: {
              id: "ex-sport-simulation",
              nameAr: "محاكاة المباريات الرياضية التخصصية",
              nameEn: "Sport-Specific Simulation & Scrimmage",
              category: "Functional Training",
              instructions: "المشاركة في تدريبات تكتيكية ومباريات تجريبية بضغط تدريجي حتى الوصول للمنافسة الرسمية.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-tennis-elbow",
    nameAr: "مرفق التنس (التهاب اللقيمة الوحشية)",
    nameEn: "Tennis Elbow (Lateral Epicondylitis)",
    overviewAr: "اعتلال أوتار باسطات الرسغ المشتركة (خاصة عضلة ECRB) عند اللقيمة الوحشية لمفصل المرفق. يسبب ألماً حاداً وضعفاً في قبضة اليد أثناء رفع وحمل الأشياء.",
    overviewEn: "Tendinopathy of the common extensor origin at the lateral epicondyle, characterized by lateral elbow pain and grip weakness.",
    rehabPrinciples: "تخفيف الحمل الميكانيكي المفرط، تمارين التحميل اللامركزي والإيزومتري لباسطات المعصم، تقوية الكفة المدورة وعضلات لوح الكتف لتصحيح نقل القوة، واستخدام تمرين Tyler Twist بالشريط المطاطي.",
    redFlags: [
      "ضعف قبضة يد شديد وفقدان القدرة على بسط المعصم أو الأصابع (اشتباه ضغط العصب الكعبري Radial Nerve Palsy)",
      "ألم وخدر يمتد من الرقبة عبر الذراع لليد (اشتباه اعتلال جذور رقبي Cervical Radiculopathy)",
      "عدم استقرار جانبي لمفصل المرفق أو طرقعة مؤلمة (Lateral collateral ligament laxity)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-tennis-1",
        phase: "ACUTE",
        durationWeeks: "1-2 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تخفيف الألم الموضعي في المرفق",
          "تعديل المقبض وأنشطة العمل والرياضة",
          "انقباضات إيزومترية لتسكين الألم",
        ]),
        criteria: JSON.stringify([
          "ألم القبضة والخمول ≤ 3/10 على مقياس VAS",
          "القدرة على أداء الأنشطة اليومية الخفيفة بدون تفاقم",
        ]),
        exercises: [
          {
            id: "ex-tennis-1",
            sets: 4,
            reps: 1,
            notes: "ثبات 30-45 ثانية في زاوية معصم ممتدة 30° بدون حركة",
            exercise: {
              id: "ex-wrist-iso",
              nameAr: "تمديد المعصم الإيزومتري (Isometric Wrist Extension)",
              nameEn: "Isometric Wrist Extension",
              category: "Forearm",
              instructions: "ضع الساعد على الطاولة واليد معلقة، اضغط باليد الأخرى لمقاومة رفع المعصم بثبات.",
            },
          },
        ],
      },
      {
        id: "phase-tennis-2",
        phase: "STRENGTH",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "بناء قوة باسطات المعصم اللامركزية عبر تمرين Tyler Twist",
          "تقوية الساعد والكتف وعضلات القبضة",
          "تحسين التحمل العضلي أثناء الأنشطة المتكررة",
        ]),
        criteria: JSON.stringify([
          "قوة القبضة الخالية من الألم LSI ≥ 85%",
          "أداء تمرين Tyler Twist 3 مجموعات x 15 تكراراً بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-tennis-2",
            sets: 3,
            reps: 15,
            notes: "تمرين تيلر تويست باستخدام شريط FlexBar المطاطي المقاوم",
            exercise: {
              id: "ex-tyler-twist",
              nameAr: "تمرين تيلر تويست اللامركزي (Tyler Twist with FlexBar)",
              nameEn: "Tyler Twist Exercise",
              category: "Forearm",
              instructions: "أمسك الشريط المطاطي باليد المصابة واثنِ باليد الأخرى ثم أدر المعصم المصاب لفك الشريط ببطء لامركزي.",
            },
          },
        ],
      },
      {
        id: "phase-tennis-3",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "2-4 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "العودة للأنشطة الرياضية التنافسية أو الأعمال الحرفية",
          "تعديل حجم مقبض المضرب أو بيئة العمل",
          "الوقاية من تكرار الإجهاد العضلي",
        ]),
        criteria: JSON.stringify([
          "عدم وجود ألم أثناء ضربات التنس الخلفية Backhand أو رفع الأثقال",
          "مؤشر تقييم مرفق التنس PRTEE ≤ 15 نقطة",
        ]),
        exercises: [
          {
            id: "ex-tennis-3",
            sets: 3,
            reps: 10,
            notes: "محاكاة ضربات المضرب أو الأحمال العملية تدريجياً",
            exercise: {
              id: "ex-racquet-drills",
              nameAr: "تدريبات المضرب والأحمال التخصصية",
              nameEn: "Sport-Specific Racquet Drills",
              category: "Functional Training",
              instructions: "تمارين متدرجة لضربات التنس أو رمي الكرة مع التركيز على استخدام كامل السلسلة الحركية للجسم.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-rotator-cuff",
    nameAr: "اعتلال أوتار الكفة المدورة للكتف",
    nameEn: "Rotator Cuff Tendinopathy",
    overviewAr: "ألم في مقدمة وجانب الكتف يزداد مع رفع الذراع فوق مستوى الرأس أو النوم على الجانب المصاب. ناتج عن إجهاد أوتار Supraspinatus و Infraspinatus ومتلازمة الارتطام تحت الأخرمي.",
    overviewEn: "Overuse tendinopathy affecting supraspinatus/infraspinatus tendons causing anterolateral shoulder pain with overhead elevation.",
    rehabPrinciples: "استعادة حركية الكتف والفقرات الصدرية، تقوية عضلات الكفة المدورة في زوايا وظيفية آمنة دون إثارة الألم، تصحيح ديناميكية لوح الكتف (Scapular Dyskinesis)، وتدريب الاستقرار المفصلي الديناميكي.",
    redFlags: [
      "سقوط الذراع المفاجئ وفقدان القدرة على إبقائه مرفوعاً (Drop Arm Test إيجابي — اشتباه تمزق كامل للكفة Massive Tear)",
      "ألم صدري يشع للكتف الأيسر والفك مع ضيق تنفس (استبعاد أزمة قلبية عاجلة Acute Myocardial Infarction)",
      "عدم ثبات متكرر أو خلع في مفصل الكتف (Shoulder Dislocation / Subluxation)",
      "فقدان تدريجي وحاد في المدى الحركي السلبي والإيجابي (اشتباه الكتف المتجمد Frozen Shoulder)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-rc-1",
        phase: "ACUTE",
        durationWeeks: "1-3 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تخفيف ألم الكتف الليلي وألم الرفع",
          "استعادة حركية لوح الكتف والفقرات الصدرية",
          "تنشيط إيزومتري لعضلات التدوير الخارجي والداخلي",
        ]),
        criteria: JSON.stringify([
          "القدرة على النوم على الكتف المصاب بدون ألم حاد",
          "رفع الذراع حتى 90° بدون ألم معيق",
        ]),
        exercises: [
          {
            id: "ex-rc-1",
            sets: 4,
            reps: 1,
            notes: "ثبات 30 ثانية ضد حائط أو يد المعالج بدون حركة المفصل",
            exercise: {
              id: "ex-iso-er",
              nameAr: "التدوير الخارجي الإيزومتري للكتف (Isometric External Rotation)",
              nameEn: "Isometric Shoulder External Rotation",
              category: "Rotator Cuff",
              instructions: "ثبت المرفق بجانبك بزاوية 90°، واضغط بظهر اليد ضد الجدار للخارج بثبات.",
            },
          },
          {
            id: "ex-rc-2",
            sets: 3,
            reps: 15,
            notes: "تحريك الذراع بحرية كالبندول لتليين المفصل وتخفيف الشد",
            exercise: {
              id: "ex-codman",
              nameAr: "تمرين البندول (Codman Pendulum Exercise)",
              nameEn: "Codman Pendulum Exercise",
              category: "Shoulder Mobility",
              instructions: "انحنِ للأمام ودع الذراع يتدلى لأسفل، وحركه في دوائر لطيفة بتأثير الجاذبية.",
            },
          },
        ],
      },
      {
        id: "phase-rc-2",
        phase: "STRENGTH",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "تقوية عضلات التدوير الخارجي والداخلي بمطاط المقاومة",
          "تقوية عضلات لوح الكتف (Serratus Anterior & Lower Trapezius)",
          "تحسين التوافق العضلي في المستويات العالية فوق الرأس",
        ]),
        criteria: JSON.stringify([
          "قوة التدوير الخارجي LSI ≥ 85%",
          "أداء تمرين رفع الكتف الجانبي بالدمبل بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-rc-3",
            sets: 3,
            reps: 12,
            notes: "تثبيت المرفق بجانب الجسم بواسطة منشفة مطوية",
            exercise: {
              id: "ex-band-er",
              nameAr: "الدوران الخارجي بمطاط المقاومة (Resisted External Rotation)",
              nameEn: "Band External Rotation",
              category: "Rotator Cuff",
              instructions: "أمسك حزام المقاومة ولف الساعد للخارج ببطء ثم عُد ببطء وتحكم.",
            },
          },
          {
            id: "ex-rc-4",
            sets: 3,
            reps: 10,
            notes: "تنشيط عضلات لوح الكتف السفلية والوسطى",
            exercise: {
              id: "ex-iyt",
              nameAr: "تمارين لوح الكتف I-Y-T",
              nameEn: "Scapular I-Y-T Raises",
              category: "Scapular",
              instructions: "استلقِ على بطنك وارفع الذراعين على التوالي في أشكال حروف I ثم Y ثم T مع ضم لوحي الكتف.",
            },
          },
        ],
      },
      {
        id: "phase-rc-3",
        phase: "FUNCTIONAL",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "التمارين البليومترية ورمي الكرات الطبية للكتف",
          "العودة للرياضات العلوية مثل السباحة والكرة الطائرة ورمي الرمح",
        ]),
        criteria: JSON.stringify([
          "مقياس كتف الرياضيين Kerlan-Jobe Orthopedic Clinic (KJOC) ≥ 85",
          "اختبار الرمي الأحادي بدون أي ألم",
        ]),
        exercises: [
          {
            id: "ex-rc-5",
            sets: 3,
            reps: 15,
            notes: "رمي سريع وارتداد مرن بالكرة الطبية لتطوير القوة الارتدادية",
            exercise: {
              id: "ex-plyo-ball",
              nameAr: "رمي الكرة الطبية المرتدة ضد الجدار (Plyometric Wall Rebounds)",
              nameEn: "Plyometric Ball Rebounds",
              category: "Plyometrics",
              instructions: "أمسك كرة طبية خفيفة بزاوية 90/90 وارمِها ضد الترامبولين أو الجدار مع التقاطها بمرونة.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-itbs",
    nameAr: "متلازمة الشريط الحرقفي الظنبوبي (ITBS)",
    nameEn: "Iliotibial Band Syndrome",
    overviewAr: "ألم حارق في الجانب الخارجي لمفصل الركبة عند اللقيمة الفخذية الوحشية يظهر لدى العدائين وراكبي الدراجات. ينجم عن احتكاك وضغط النسيج الدهني الوعائي الغني بالأعصاب تحت الشريط عند زاوية 30° ثني.",
    overviewEn: "Lateral knee pain in runners and cyclists caused by repetitive compression of the richly innervated fat pad deep to the iliotibial band.",
    rehabPrinciples: "تعديل حجم ووتيرة الجري، تقوية عضلات الحوض المبعدة والباسطة (Gluteus Medius & Maximus)، تصحيح ميكانيكا الجري وزيادة سرعة الخطوة (Cadence) بنسبة 5-10% لتقليل الضغط الجانبي.",
    redFlags: [
      "انتفاخ مفصلي حاد وانصباب سوائل داخل الركبة (يستبعد ITBS ويوجه نحو إصابة غضروف هلالي وحشي)",
      "ألم حاد مع سخونة وتورم موضعي فوق رأس عظمة الشظية (اشتباه كسر إجهادي أو خثار)",
      "ضعف رفع مشط القدم أو خدر في ظهر القدم (اشتباه انضغاط العصب الشظوي Common Peroneal Nerve)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-itbs-1",
        phase: "ACUTE",
        durationWeeks: "1-2 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تهدئة الألم الحارق في الجانب الخارجي للركبة",
          "تعديل أحمال الجري وتجنب الجري على المنحدرات",
          "تنشيط عضلات الحوض في وضعيات بدون احتكاك",
        ]),
        criteria: JSON.stringify([
          "ألم اللمس فوق اللقيمة الوحشية ≤ 2/10",
          "المشي العادي بدون ألم جانبي بالركبة",
        ]),
        exercises: [
          {
            id: "ex-itbs-1",
            sets: 3,
            reps: 15,
            notes: "تنشيط عضلات الأرداف الجانبية دون ثني الركبة لمستوى الاحتكاك",
            exercise: {
              id: "ex-side-lying-abduct",
              nameAr: "رفع الساق الجانبي مع دوران خفيف للخلف (Side-Lying Hip Abduction)",
              nameEn: "Side-Lying Hip Abduction",
              category: "Hip",
              instructions: "استلقِ على الجانب السليم، ارفع الساق المصابة للأعلى ومائلاً قليلاً للخلف مع توجيه أصابع القدم للأمام.",
            },
          },
        ],
      },
      {
        id: "phase-itbs-2",
        phase: "STRENGTH",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "تقوية عضلات الحوض في وضعية الوقوف وتحمل الوزن",
          "تصحيح ميل الحوض الجانبي (Trendelenburg Sign)",
          "تحسين ثبات الطرف السفلي في السلسلة الحركية المغلقة",
        ]),
        criteria: JSON.stringify([
          "أداء تمرين رفع الحوض الأحادي 15 تكراراً بدون إجهاد أو ميل",
          "قوة عضلات الحوض المبعدة LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-itbs-2",
            sets: 3,
            reps: 12,
            notes: "الوقوف بساق واحدة على درجة وإنزال ورفع الحوض المعاكس",
            exercise: {
              id: "ex-pelvic-drop",
              nameAr: "رفع وإنزال الحوض على الدرجة (Pelvic Drop / Hip Hike)",
              nameEn: "Pelvic Drop / Hip Hike",
              category: "Hip Stability",
              instructions: "قف على حافة الدرجة بساق واحدة ودع الحوض الآخر ينزل ثم ارفعه بقبض عضلات أرداف الساق الثابتة.",
            },
          },
        ],
      },
      {
        id: "phase-itbs-3",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "إعادة الجري التدريجي مع تعديل الخطوة (زيادة الـ Cadence)",
          "تحمل الجري على الأسطح المتفاوتة",
          "العودة لمسافات الجري السابقة بدون انتكاس",
        ]),
        criteria: JSON.stringify([
          "الجري المستمر لمدة 30 دقيقة بدون أي ألم أثناء أو بعد الجري",
          "مؤشر تماثل القوة والأداء LSI ≥ 90%",
        ]),
        exercises: [
          {
            id: "ex-itbs-3",
            sets: 1,
            reps: 1,
            notes: "استخدام المسرع الإيقاعي Metronome لزيادة وتيرة الخطوات بنسبة 5-10%",
            exercise: {
              id: "ex-gait-retraining",
              nameAr: "إعادة تدريب ميكانيكا الجري (Gait Retraining & Cadence)",
              nameEn: "Running Gait Retraining",
              category: "Gait & Running",
              instructions: "الجري بخطوات أقصر وأسرع لتفادي هبوط القدم بعيداً أمام مركز ثقل الجسم (Overstriding).",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-ankle-sprain",
    nameAr: "التواء الكاحل الحاد (إصابة الرباط الشظوي)",
    nameEn: "Lateral Ankle Sprain",
    overviewAr: "إصابة رضية شائعة ناتجة عن التواء الكاحل نحو الداخل مسببة تمدد أو تمزق أربطة الكاحل الجانبية (خاصة ATFL و CFL). تتبع بتورم وكدمات وعدم ثبات حركي.",
    overviewEn: "Inversion trauma causing stretching or tear of lateral ankle ligaments (ATFL/CFL), with swelling, pain, and mechanical instability.",
    rehabPrinciples: "تطبيق بروتوكول PEACE & LOVE بدلاً من RICE القديم، التحميل المبكر المحمي، استعادة المدى الحركي للثني الظهري (Dorsiflexion)، تدريب الحس العميق والتوازن الديناميكي، وتقوية العضلات الشظوية لمنع عدم الثبات المزمن (CAI).",
    redFlags: [
      "عدم القدرة على المشي 4 خطوات متتالية مع ألم عند الحافة الخلفية للعظمين (قواعد أوتاوا Ottawa Ankle Rules — اشتباه كسر)",
      "ألم حاد وضغط شديد عند قاعدة مشط القدم الخامس (Base of 5th Metatarsal — Jones Fracture)",
      "ألم حاد في المفصل الشظوي القصبي مع اختبار عصر الساق إيجابي (High Ankle Sprain / Syndesmosis Tear)",
      "خدر وفقدان الإحساس في أصابع القدم مع شحوب أو برودة",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-ankle-1",
        phase: "ACUTE",
        durationWeeks: "0-1 أسبوع",
        orderIndex: 0,
        goals: JSON.stringify([
          "حماية الكاحل برباط داعم وتقليل التورم الشديد",
          "بدء التحميل الآمن وتحمل الوزن تدريجياً",
          "الحفاظ على حركية الأصابع والكاحل الخفيفة",
        ]),
        criteria: JSON.stringify([
          "المشي بوزن كامل بدون ألم حاد مع الدعامة",
          "انخفاض مقياس تورم الكاحل بمقدار ملحوظ",
        ]),
        exercises: [
          {
            id: "ex-ankle-1",
            sets: 3,
            reps: 25,
            notes: "حركات نشطة خفيفة في الهواء لضخ السائل اللمفاوي وتقليل التورم",
            exercise: {
              id: "ex-ankle-pumps",
              nameAr: "مضخات الكاحل ورسم الحروف بالقدم (Ankle Pumps & Alphabet)",
              nameEn: "Ankle Pumps & Alphabet Drills",
              category: "Mobility",
              instructions: "حرك الكاحل للأعلى وللأسفل وارسم حروف الهجاء في الهواء بأصابع القدم.",
            },
          },
        ],
      },
      {
        id: "phase-ankle-2",
        phase: "RESTORE_ROM",
        durationWeeks: "1-3 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "استعادة الثني الظهري الكامل للكاحل (Dorsiflexion ≥ 10 cm في اختبار الجدار)",
          "المشي الطبيعي بدون أي عرج وبدون دعامة",
          "بدء تقوية العضلات الشظوية (Peroneals)",
        ]),
        criteria: JSON.stringify([
          "اختبار الثني الظهري عند الجدار (Weight-bearing Lunge Test) LSI ≥ 90%",
          "مشي متناسق تماماً بدون عرج",
        ]),
        exercises: [
          {
            id: "ex-ankle-2",
            sets: 3,
            reps: 15,
            notes: "تقوية العضلات الشظوية المسؤولة عن منع تكرار التواء الكاحل",
            exercise: {
              id: "ex-band-eversion",
              nameAr: "انقلاب القدم للخارج بمطاط المقاومة (Resisted Ankle Eversion)",
              nameEn: "Band Ankle Eversion",
              category: "Ankle / Peroneals",
              instructions: "ثبت مطاط المقاومة ولف القدم للخارج للأعلى ضد المقاومة مع تثبيت الساق.",
            },
          },
        ],
      },
      {
        id: "phase-ankle-3",
        phase: "NEUROMUSCULAR",
        durationWeeks: "2-4 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "إعادة برمجة الحس العميق والتوازن الديناميكي العصبي",
          "ثبات الكاحل على الأسطح غير المستقرة وكرة BOSU",
          "بدء الركض وتدريبات القفز الخفيف",
        ]),
        criteria: JSON.stringify([
          "الوقوف بثبات على ساق واحدة بعيون مغلقة لمدة 30 ثانية",
          "اختبار Y-Balance للكاحل LSI ≥ 90%",
        ]),
        exercises: [
          {
            id: "ex-ankle-3",
            sets: 4,
            reps: 1,
            notes: "ثبات 30-45 ثانية، والتدرج مع إغلاق العينين أو رمي واستقبال كرة",
            exercise: {
              id: "ex-balance-bosu",
              nameAr: "التوازن على لوح التمايل أو كرة BOSU",
              nameEn: "BOSU / Balance Board Training",
              category: "Proprioception",
              instructions: "قف على ساق واحدة فوق لوح التوازن وحافظ على ثبات المفصل دون لمس الأرض.",
            },
          },
        ],
      },
      {
        id: "phase-ankle-4",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 3,
        goals: JSON.stringify([
          "القفزات المتعددة الاتجاهات والهبوط التنافسي",
          "الرشاقة وتغيير الاتجاه السريع بدون قلق",
          "العودة الكاملة للمباريات والمنافسة",
        ]),
        criteria: JSON.stringify([
          "اختبار القفز الجانبي Side Hop Test LSI ≥ 90%",
          "مقياس تقييم كاحل القدم FAAM Sport Scale ≥ 90%",
        ]),
        exercises: [
          {
            id: "ex-ankle-4",
            sets: 4,
            reps: 10,
            notes: "قفزات جانبية سريعة فوق شريط بارتفاع 10 سم لتحدي ثبات الكاحل الديناميكي",
            exercise: {
              id: "ex-side-hops",
              nameAr: "القفزات الجانبية السريعة (Side-to-Side Hops)",
              nameEn: "Lateral Hop Progression",
              category: "Plyometrics",
              instructions: "اقفز بالساق المصابة يميناً ويساراً بسرعة وتحكم مع الحفاظ على التوازن.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-hamstring",
    nameAr: "تمزق وشد عضلات الفخذ الخلفية (Hamstring Strain)",
    nameEn: "Hamstring Strain",
    overviewAr: "إصابة عضلية حادة ومفاجئة تحدث أثناء الركض السريع بأقصى سرعة (غالباً في عضلة Biceps Femoris) أو الركل والتمدد المفرط (Semimembranosus)، مع نسبة تكرار مرتفعة إذا لم تؤهل بشكل كافٍ.",
    overviewEn: "Acute muscle strain commonly affecting long head of biceps femoris during maximal sprinting or semimembranosus during stretching.",
    rehabPrinciples: "بروتوكول Askling L-Protocol للتحميل في وضعية الاستطالة العضلية، تدريب التحميل اللامركزي عالي السرعة (Nordic Hamstring Curl)، تقوية عضلات الحوض والبطن وتأهيل الركض السريع بأقصى سرعة قبل التصريح بالعودة.",
    redFlags: [
      "كتلة ورمية محسوسة مع تراجع العضلة للأسفل وكدمة زرقاء دموية واسعة (اشتباه انفصال وتر العضلة من منبت الحوض Hamstring Avulsion)",
      "خدر وتنميل مستمر في خلف الفخذ والساق (اشتباه انضغاط أو تهيج العصب الوركي Sciatic Nerve)",
      "فقدان تام لقدرة ثني الركبة ضد المقاومة الخفيفة",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-ham-1",
        phase: "ACUTE",
        durationWeeks: "0-1 أسبوع",
        orderIndex: 0,
        goals: JSON.stringify([
          "حماية الألياف العضلية المصابة والحد من النزيف العضلي",
          "تقليل الألم أثناء المشي والأنشطة اليومية",
          "بدء الانقباض الإيزومتري الخفيف في مدى آمن",
        ]),
        criteria: JSON.stringify([
          "المشي الطبيعي بدون ألم أو عرج",
          "انقباض إيزومتري بزاوية 90° ألم ≤ 2/10",
        ]),
        exercises: [
          {
            id: "ex-ham-1",
            sets: 4,
            reps: 1,
            notes: "ثبات 30 ثانية بحمل خفيف إلى متوسط بدون أي ألم حاد",
            exercise: {
              id: "ex-iso-ham-bridge",
              nameAr: "جسر الأرداف الإيزومتري بالقدمين (Isometric Glute Bridge)",
              nameEn: "Isometric Glute Bridge Hold",
              category: "Hamstring",
              instructions: "ارفع الحوض واثبت في الأعلى مع الضغط بالكعبين على الأرض لتنشيط العضلات الخلفية.",
            },
          },
        ],
      },
      {
        id: "phase-ham-2",
        phase: "STRENGTH",
        durationWeeks: "2-6 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "تطبيق بروتوكول Askling L-Protocol لتقوية العضلة في وضعية الاستطالة",
          "تدريب تمرين Nordic Hamstring Curl لزيادة الطول اللامركزي للألياف",
          "تقوية عضلات الجذع والحوض لتثبيت الميل الأمامي للحوض",
        ]),
        criteria: JSON.stringify([
          "اختبار Askling H-Test بدون ألم أو شعور بعدم الأمان",
          "قوة العضلات الخلفية LSI ≥ 85%",
        ]),
        exercises: [
          {
            id: "ex-ham-2",
            sets: 3,
            reps: 6,
            notes: "الهبوط للأمام ببطء شديد مع مقاومة الهبوط بالعضلات الخلفية",
            exercise: {
              id: "ex-nordic",
              nameAr: "تمرين نورديك لتقوية العضلة الخلفية (Nordic Hamstring Curl)",
              nameEn: "Nordic Hamstring Curl",
              category: "Hamstring Eccentric",
              instructions: "اركع على ركبتيك مع تثبيت الكاحلين بإحكام، وانزل بجذعك للأمام ببطء مقاومًا بجاذبية الأرض.",
            },
          },
          {
            id: "ex-ham-3",
            sets: 3,
            reps: 10,
            notes: "تمرين Askling 'The Extender' في وضعية الاستطالة اللامركزية",
            exercise: {
              id: "ex-askling-extender",
              nameAr: "تمرين التمديد اللامركزي (The Extender Drill)",
              nameEn: "Askling Extender Drill",
              category: "Hamstring",
              instructions: "استلقِ على ظهرك واثنِ الفخذ 90°، ثم مدّ الركبة ببطء حتى أقصى مدى بدون ألم.",
            },
          },
        ],
      },
      {
        id: "phase-ham-3",
        phase: "RETURN_TO_SPORT",
        durationWeeks: "2-4 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "الوصول للسرعة القصوى في الركض (100% Maximal Sprinting Speed)",
          "تدريبات التسارع والكبح المفاجئ مع تغيير الاتجاه",
          "العودة للمباريات والمنافسة بدون أي خوف أو تردد",
        ]),
        criteria: JSON.stringify([
          "الجري بأقصى سرعة 100% بدون أي ألم أو تحفظ",
          "مؤشر تماثل القوة اللامركزية LSI ≥ 90%",
          "مقياس الجاهزية الرياضية واختبار Askling H-Test سلبي تماماً",
        ]),
        exercises: [
          {
            id: "ex-ham-4",
            sets: 5,
            reps: 1,
            notes: "تدرج من 70% ثم 85% ثم 95% حتى الوصول للسرعة القصوى 100%",
            exercise: {
              id: "ex-max-sprint",
              nameAr: "بروتوكول الانطلاق بأقصى سرعة (Maximal Sprinting Progression)",
              nameEn: "Maximal Velocity Sprinting",
              category: "Sprinting",
              instructions: "ركض سريع متدرج لمسافة 30-40 متراً مع التركيز على مرحلة التأرجح الطرفية (Terminal Swing).",
            },
          },
        ],
      },
    ],
  },
  {
    id: "proto-sciatica",
    nameAr: "عرق النسا والاعتلال الجذري القطني",
    nameEn: "Sciatica / Lumbar Radiculopathy",
    overviewAr: "ألم مشع حاد أو حارق يمتد من أسفل الظهر والأرداف عبر مسار العصب الوركي إلى أسفل الساق والقدم، مصحوباً أحياناً بوخز وتنميل ناتج عن انضغاط جذور الأعصاب القطنية (L4-S1) بالانزلاق الغضروفي.",
    overviewEn: "Radiating leg pain along sciatic nerve pathway originating from lumbar disc herniation or foraminal stenosis.",
    rehabPrinciples: "تحديد الاتجاه التفضيلي لحركة العمود الفقري (Directional Preference — طريقة ماكنزي McKenzie)، تمارين تحريك وتسليك العصب (Neurodynamics / Nerve Flossing)، تدريب استقرار الجذع العميق (Core Stability)، والتثقيف الصحي لتعديل وضعيات الجلوس والرفع.",
    redFlags: [
      "متلازمة ذيل الفرس (Cauda Equina Syndrome): فقدان التحكم بالبول أو البراز، خدر تنميلي في منطقة السرج (Saddle Anesthesia) — طوارئ جراحية فورية!",
      "ضعف عصبي حركي تصاعدي وسقوط مشط القدم (Progressive motor deficit / Foot drop)",
      "ألم غير ميكانيكي مستمر ليلاً مع حمى أو فقدان غير مفسر في الوزن (اشتباه ورم أو التهاب فقري صديدي)",
    ],
    isCustom: false,
    createdAt: new Date().toISOString(),
    phases: [
      {
        id: "phase-sci-1",
        phase: "ACUTE",
        durationWeeks: "1-3 أسابيع",
        orderIndex: 0,
        goals: JSON.stringify([
          "تمركز الألم وانحساره من الساق نحو الظهر (Centralization of Symptoms)",
          "تخفيف الضغط الميكانيكي والالتهابي عن جذر العصب",
          "استعادة الحركة الخالية من الألم في الاتجاه التفضيلي",
        ]),
        criteria: JSON.stringify([
          "انحسار الألم المشع أسفل الركبة",
          "القدرة على الوقوف والمشي 15 دقيقة بدون زيادة الألم بالساق",
        ]),
        exercises: [
          {
            id: "ex-sci-1",
            sets: 4,
            reps: 10,
            notes: "طريقة ماكنزي لبسط الظهر لتمركز الألم الغضروفي",
            exercise: {
              id: "ex-mckenzie-ext",
              nameAr: "تمديد الظهر في وضعية الانبطاح (McKenzie Prone Extension)",
              nameEn: "McKenzie Prone Press-Up",
              category: "Spine / McKenzie",
              instructions: "استلقِ على بطنك وادفع بجذعك للأعلى باليدين مع إرخاء عضلات الحوض والظهر تماماً.",
            },
          },
          {
            id: "ex-sci-2",
            sets: 3,
            reps: 15,
            notes: "حركات انزلاقية لطيفة للعصب بدون شد أو استفزاز حاد",
            exercise: {
              id: "ex-nerve-slider",
              nameAr: "تحريك وتسليك العصب الوركي (Sciatic Nerve Flossing / Slider)",
              nameEn: "Sciatic Nerve Slider",
              category: "Neurodynamics",
              instructions: "اجلس على كرسي، مع رفع الساق افرد رأسك للخلف، وعند إنزال الساق اثنِ رأسك للأمام بحركة متناغمة.",
            },
          },
        ],
      },
      {
        id: "phase-sci-2",
        phase: "RESTORE_ROM",
        durationWeeks: "3-6 أسابيع",
        orderIndex: 1,
        goals: JSON.stringify([
          "استعادة حركة العمود الفقري القطني والورك في جميع الاتجاهات",
          "تقوية عضلات الجذع العميقة (Transversus Abdominis & Multifidus)",
          "التحكم في حركة الحوض أثناء الأنشطة اليومية",
        ]),
        criteria: JSON.stringify([
          "اختبار رفع الساق المستقيمة (SLR Test) سلبي أو خالي من الألم المشع",
          "القدرة على أداء تمارين الثبات بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-sci-3",
            sets: 3,
            reps: 10,
            notes: "الحفاظ على استقامة العمود الفقري وعدم تدوير الحوض",
            exercise: {
              id: "ex-bird-dog",
              nameAr: "تمرين الكلب الطائر (Bird Dog Exercise)",
              nameEn: "Bird Dog Core Exercise",
              category: "Core Stability",
              instructions: "على أربعتك، مدّ الذراع اليمنى والساق اليسرى بالتوازي مع الأرض مع الحفاظ على ثبات الحوض والظهر.",
            },
          },
          {
            id: "ex-sci-4",
            sets: 3,
            reps: 10,
            notes: "تنشيط عضلات البطن العميقة مع حماية الظهر",
            exercise: {
              id: "ex-dead-bug",
              nameAr: "تمرين الحشرة الميتة (Dead Bug Exercise)",
              nameEn: "Dead Bug Exercise",
              category: "Core Stability",
              instructions: "استلقِ على ظهرك واضغط أسفل ظهرك على السرير، ومد ذراعاً وساقاً معاكسين بالتناوب وبتحكم.",
            },
          },
        ],
      },
      {
        id: "phase-sci-3",
        phase: "FUNCTIONAL",
        durationWeeks: "4-8 أسابيع",
        orderIndex: 2,
        goals: JSON.stringify([
          "تأهيل ميكانيكا رفع الأثقال وحمل الأوزان بأمان",
          "تقوية عضلات الأرداف والسلسلة الخلفية لحماية الفقرات",
          "العودة الكاملة للرياضة والعمل الشاق مع الوقاية الدائمة",
        ]),
        criteria: JSON.stringify([
          "مقياس الإعاقة القطنية Oswestry Disability Index (ODI) ≤ 12%",
          "القدرة على رفع أوزان وظيفية بميكانيكا سليمة بدون ألم",
        ]),
        exercises: [
          {
            id: "ex-sci-5",
            sets: 3,
            reps: 10,
            notes: "تمرين ثني الورك (Hip Hinge) مع الحفاظ على استقامة العمود الفقري التامة",
            exercise: {
              id: "ex-rdl-spine",
              nameAr: "الرفعة الرومانية بالدمبل (Romanian Deadlift Hip Hinge)",
              nameEn: "RDL Hip Hinge",
              category: "Functional Lifting",
              instructions: "انحنِ من مفصل الورك مع دفع الأرداف للخلف واستقامة الظهر لحمل الوزن بقوة الفخذ الخلفي.",
            },
          },
        ],
      },
    ],
  },
];

// In-memory protocols store for newly created protocols
const inMemoryProtocols = [...PRESEEDED_PROTOCOLS];

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";

    // Attempt to query database if configured
    let protocols: any[] = [];
    if (isDbConfigured()) {
      try {
        const where: Record<string, unknown> = {};
        if (search) {
          where.OR = [
            { nameAr: { contains: search, mode: "insensitive" } },
            { nameEn: { contains: search, mode: "insensitive" } },
          ];
        }

        protocols = await prisma.injuryProtocol.findMany({
          where,
          include: {
            phases: {
              include: {
                exercises: { include: { exercise: true } },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { nameAr: "asc" },
        });
      } catch {
        protocols = [];
      }
    }

    // If database returned results, return them
    if (protocols && protocols.length > 0) {
      return NextResponse.json(protocols);
    }

    // Fallback: return pre-seeded protocols (including any created in-memory)
    let filtered = inMemoryProtocols;
    if (search) {
      filtered = inMemoryProtocols.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(search) ||
          p.nameEn.toLowerCase().includes(search) ||
          p.overviewAr?.toLowerCase().includes(search) ||
          p.overviewEn?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Protocols GET error:", error);
    return NextResponse.json(inMemoryProtocols);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const redFlagsData = Array.isArray(body.redFlags)
      ? JSON.stringify(body.redFlags)
      : typeof body.redFlags === "string"
      ? body.redFlags
      : JSON.stringify([]);

    const newProtocol = {
      id: `custom-proto-${Date.now()}`,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      overviewAr: body.overviewAr || null,
      overviewEn: body.overviewEn || null,
      rehabPrinciples: body.rehabPrinciples || null,
      redFlags: redFlagsData,
      isCustom: true,
      createdAt: new Date().toISOString(),
      phases:
        body.phases?.map(
          (
            phase: {
              phase: string;
              durationWeeks: string;
              goals: string[] | string;
              criteria: string[] | string;
              exercises?: any[];
            },
            idx: number
          ) => ({
            id: `phase-custom-${Date.now()}-${idx}`,
            phase: phase.phase,
            durationWeeks: phase.durationWeeks || null,
            goals: Array.isArray(phase.goals) ? JSON.stringify(phase.goals) : phase.goals || "[]",
            criteria: Array.isArray(phase.criteria) ? JSON.stringify(phase.criteria) : phase.criteria || "[]",
            orderIndex: idx,
            exercises: phase.exercises || [],
          })
        ) || [],
    };

    inMemoryProtocols.unshift(newProtocol as any);

    // Attempt database creation if configured
    if (isDbConfigured()) {
      try {
        const protocol = await prisma.injuryProtocol.create({
          data: {
            nameAr: body.nameAr,
            nameEn: body.nameEn,
            overviewAr: body.overviewAr || null,
            overviewEn: body.overviewEn || null,
            rehabPrinciples: body.rehabPrinciples || null,
            redFlags: redFlagsData,
            isCustom: true,
            phases: {
              create:
                body.phases?.map(
                  (
                    phase: {
                      phase: string;
                      durationWeeks: string;
                      goals: string[] | string;
                      criteria: string[] | string;
                    },
                    idx: number
                  ) => ({
                    phase: phase.phase as any,
                    durationWeeks: phase.durationWeeks || null,
                    goals: Array.isArray(phase.goals) ? JSON.stringify(phase.goals) : phase.goals || null,
                    criteria: Array.isArray(phase.criteria) ? JSON.stringify(phase.criteria) : phase.criteria || null,
                    orderIndex: idx,
                  })
                ) || [],
            },
          },
          include: {
            phases: {
              include: {
                exercises: { include: { exercise: true } },
              },
            },
          },
        });

        return NextResponse.json(protocol, { status: 201 });
      } catch (err) {
        console.warn("DB protocol create skipped:", err);
      }
    }

    return NextResponse.json(newProtocol, { status: 201 });
  } catch (error) {
    console.error("Protocol POST error:", error);
    return NextResponse.json({ error: "Failed to create protocol" }, { status: 500 });
  }
}
