"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  FolderHeart,
  Dumbbell,
  FileHeart,
  Search,
  CheckCircle2,
  Video,
  BrainCircuit,
  BarChart3,
  Users,
  Calendar,
  Activity,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardStats {
  casesCount: number;
  todayAppointmentsCount: number;
  exercisesCount: number;
  protocolsCount: number;
}

interface ModuleItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badgeText: string;
  badgeVariant?: "default" | "secondary" | "outline" | "success" | "warning";
}

const MODULES: ModuleItem[] = [
  {
    id: "add-case",
    titleAr: "إضافة حالة",
    titleEn: "Add Case",
    descriptionAr:
      "تسجيل مريض جديد، قياس المدى الحركي (ROM)، تقييم محيط العضلات (Girth)، وتوثيق آلية الإصابة السريرية.",
    href: "/add-case",
    icon: UserPlus,
    gradient: "from-emerald-500 to-teal-600",
    badgeText: "تسجيل فوري",
    badgeVariant: "default",
  },
  {
    id: "cases",
    titleAr: "الحالات المحفوظة",
    titleEn: "Saved Cases",
    descriptionAr:
      "إدارة ملفات المرضى، متابعة تطور مراحل التأهيل، تعديل القياسات، ومشاركة ملخص الحالة عبر WhatsApp.",
    href: "/cases",
    icon: FolderHeart,
    gradient: "from-teal-600 to-cyan-700",
    badgeText: "سجلات المرضى",
    badgeVariant: "secondary",
  },
  {
    id: "exercises",
    titleAr: "مكتبة التمارين",
    titleEn: "Exercise Library",
    descriptionAr:
      "دليل التمارين السريرية المصنفة، تمارين الانقباض الثابت (Isometrics) بزوايا محددة، وخطط التقوية.",
    href: "/exercises",
    icon: Dumbbell,
    gradient: "from-emerald-600 to-emerald-800",
    badgeText: "تأهيل حركي",
    badgeVariant: "success",
  },
  {
    id: "protocols",
    titleAr: "البروتوكولات",
    titleEn: "Protocols",
    descriptionAr:
      "بروتوكولات التأهيل المقسمة إلى 6 مراحل، علامات الخطر (Red Flags)، ومعايير التقدم السريري لكل مرحلة.",
    href: "/protocols",
    icon: FileHeart,
    gradient: "from-sky-600 to-blue-700",
    badgeText: "أدلة سريرية",
    badgeVariant: "secondary",
  },
  {
    id: "research",
    titleAr: "الأبحاث",
    titleEn: "Research",
    descriptionAr:
      "بحث مباشر في مكتبة PubMed الطبية لاستعراض أحدث الأوراق والمراجعات المنهجية في العلاج الطبيعي.",
    href: "/research",
    icon: Search,
    gradient: "from-indigo-600 to-navy-800",
    badgeText: "PubMed Direct",
    badgeVariant: "outline",
  },
  {
    id: "return-to-play",
    titleAr: "شروط النزول",
    titleEn: "Return to Play (RTP)",
    descriptionAr:
      "معايير الجاهزية الرياضية الموضوعية، اختبارات التماثل الطرفي (LSI)، وتقييم الأمان قبل العودة للمنافسة.",
    href: "/return-to-play",
    icon: CheckCircle2,
    gradient: "from-teal-500 to-emerald-700",
    badgeText: "اختبارات الجاهزية",
    badgeVariant: "success",
  },
  {
    id: "online-followup",
    titleAr: "متابعة أونلاين",
    titleEn: "Online Follow-up",
    descriptionAr:
      "إدارة الاستشارات المرئية عن بُعد، تتبع التزام التمارين المنزلية، والتواصل السريري المستمر.",
    href: "/online-followup",
    icon: Video,
    gradient: "from-cyan-600 to-blue-600",
    badgeText: "عن بُعد",
    badgeVariant: "secondary",
  },
  {
    id: "ai-analysis",
    titleAr: "تحليل الحركة AI",
    titleEn: "AI Analysis",
    descriptionAr:
      "تحليل الفيديو بتقدير الوضعية (Pose Estimation)، قياس زوايا المفاصل آلياً، واكتشاف الأنماط الحركية المعيبة.",
    href: "/ai-analysis",
    icon: BrainCircuit,
    gradient: "from-violet-600 to-purple-800",
    badgeText: "ذكاء اصطناعي",
    badgeVariant: "default",
  },
  {
    id: "analytics",
    titleAr: "الإحصائيات",
    titleEn: "Analytics",
    descriptionAr:
      "لوحة تحليل البيانات، معدلات استعادة المدى الحركي، نسب الإنجاز للمرضى، والتقارير الدورية للعيادة.",
    href: "/analytics",
    icon: BarChart3,
    gradient: "from-slate-700 to-navy-950",
    badgeText: "مؤشرات الأداء",
    badgeVariant: "outline",
  },
];

export default function HomeDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    casesCount: 0,
    todayAppointmentsCount: 0,
    exercisesCount: 0,
    protocolsCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  useEffect(() => {
    // Format Arabic date on client
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDateFormatted(now.toLocaleDateString("ar-EG", options));
    } catch {
      setCurrentDateFormatted(new Date().toDateString());
    }
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [casesRes, apptsRes, exercisesRes, protocolsRes] =
        await Promise.allSettled([
          fetch("/api/cases"),
          fetch("/api/appointments"),
          fetch("/api/exercises"),
          fetch("/api/protocols"),
        ]);

      let casesCount = 0;
      let todayAppointmentsCount = 0;
      let exercisesCount = 0;
      let protocolsCount = 0;

      if (casesRes.status === "fulfilled" && casesRes.value.ok) {
        const data = await casesRes.value.json();
        if (Array.isArray(data)) {
          casesCount = data.length;
        }
      }

      if (apptsRes.status === "fulfilled" && apptsRes.value.ok) {
        const data = await apptsRes.value.json();
        if (Array.isArray(data)) {
          const now = new Date();
          todayAppointmentsCount = data.filter((appt: { date?: string }) => {
            if (!appt.date) return false;
            const apptDate = new Date(appt.date);
            return (
              apptDate.getFullYear() === now.getFullYear() &&
              apptDate.getMonth() === now.getMonth() &&
              apptDate.getDate() === now.getDate()
            );
          }).length;
        }
      }

      if (exercisesRes.status === "fulfilled" && exercisesRes.value.ok) {
        const data = await exercisesRes.value.json();
        if (Array.isArray(data)) {
          exercisesCount = data.length;
        }
      }

      if (protocolsRes.status === "fulfilled" && protocolsRes.value.ok) {
        const data = await protocolsRes.value.json();
        if (Array.isArray(data)) {
          protocolsCount = data.length;
        }
      }

      setStats({
        casesCount,
        todayAppointmentsCount,
        exercisesCount,
        protocolsCount,
      });
    } catch (error) {
      console.error("Dashboard stats fetch error:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          HERO / WELCOME HEADER
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white shadow-xl">
        {/* Subtle decorative background glow circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium backdrop-blur-sm">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>المنصة السريرية المتخصصة لتأهيل الإصابات الرياضية</span>
                <span className="text-emerald-400/50">•</span>
                <span className="text-slate-300 hidden sm:inline">
                  Clinical Rehabilitation OS
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Peak Motion —{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-200">
                  إدارة الحالات والبرامج التأهيلية
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                متابعة دقيقة لمراحل الشفاء، قياس المدى الحركي (ROM) ومحيط
                العضلات، تطبيق بروتوكولات التأهيل المبنية على الدلائل السريرية
                (Evidence-Based)، واختبارات الجاهزية للعودة للملعب (Return to
                Play).
              </p>

              {currentDateFormatted && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 pt-1">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>{currentDateFormatted}</span>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/add-case"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <UserPlus className="w-5 h-5" />
                <span>إضافة حالة جديدة</span>
              </Link>

              <Link
                href="/cases"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-semibold text-sm backdrop-blur-sm transition-all duration-200"
              >
                <FolderHeart className="w-5 h-5 text-emerald-400" />
                <span>سجل الحالات</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT CONTAINER
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-10">
        {/* ───────────────────────────────────────────────────────────
            QUICK STATS CARDS (4 CARDS)
        ─────────────────────────────────────────────────────────── */}
        <section aria-label="الإحصائيات السريعة">
          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm animate-pulse flex items-center justify-between"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-8 w-16 bg-slate-300 rounded font-bold" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            /* Actual Stats Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Stat 1: Total Cases */}
              <Link href="/cases" className="block group">
                <Card className="border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        عدد الحالات
                      </p>
                      <p className="text-3xl font-extrabold text-navy-950 group-hover:text-emerald-600 transition-colors">
                        {stats.casesCount}
                      </p>
                      <p className="text-xs text-slate-400">
                        Total Patients Recorded
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <Users className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Stat 2: Today's Appointments */}
              <Link href="/cases" className="block group">
                <Card className="border border-slate-200/80 bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        المواعيد اليوم
                      </p>
                      <p className="text-3xl font-extrabold text-navy-950 group-hover:text-teal-600 transition-colors">
                        {stats.todayAppointmentsCount}
                      </p>
                      <p className="text-xs text-slate-400">
                        Appointments Today
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Stat 3: Exercises Library */}
              <Link href="/exercises" className="block group">
                <Card className="border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        التمارين
                      </p>
                      <p className="text-3xl font-extrabold text-navy-950 group-hover:text-emerald-600 transition-colors">
                        {stats.exercisesCount}
                      </p>
                      <p className="text-xs text-slate-400">
                        Rehab Exercises Library
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Stat 4: Protocols */}
              <Link href="/protocols" className="block group">
                <Card className="border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        البروتوكولات
                      </p>
                      <p className="text-3xl font-extrabold text-navy-950 group-hover:text-blue-600 transition-colors">
                        {stats.protocolsCount}
                      </p>
                      <p className="text-xs text-slate-400">
                        Clinical Rehab Protocols
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <FileHeart className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Fallback indicator if error occurs */}
          {hasError && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
              <span>
                تعذر تحديث بعض الإحصائيات مؤقتاً من الخادم. يمكنك المحاولة مجدداً.
              </span>
              <button
                onClick={fetchStats}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </section>

        {/* ───────────────────────────────────────────────────────────
            MODULE QUICK-ACCESS GRID (9 MODULES)
        ─────────────────────────────────────────────────────────── */}
        <section className="space-y-6" aria-label="وحدات النظام">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950 flex items-center gap-2">
                <span>وحدات النظام والخدمات السريرية</span>
                <span className="text-xs font-normal text-slate-400">
                  (9 Modules)
                </span>
              </h2>
              <p className="text-sm text-slate-500">
                وصول سريع إلى أدوات التقييم، البرامج التأهيلية، والأدلة الطبية
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-slate-600">
                <Sparkles className="w-3 h-3 text-emerald-500 ml-1" />
                جاهز للعمل السريري
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.id}
                  href={module.href}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-xl"
                >
                  <Card className="h-full border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl overflow-hidden animate-fade-in flex flex-col justify-between">
                    <div>
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Gradient Icon Container */}
                          <div
                            className={cn(
                              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-md shadow-slate-200 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300",
                              module.gradient
                            )}
                          >
                            <Icon className="w-7 h-7 stroke-[1.8]" />
                          </div>

                          {/* Badge */}
                          <Badge
                            variant={module.badgeVariant || "secondary"}
                            className="text-xs"
                          >
                            {module.badgeText}
                          </Badge>
                        </div>

                        {/* Title and Subtitle */}
                        <div className="mt-4 space-y-0.5">
                          <CardTitle className="text-xl font-bold text-navy-950 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                            <span>{module.titleAr}</span>
                            <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all" />
                          </CardTitle>
                          <CardDescription className="text-xs font-semibold text-emerald-700/80 tracking-wide font-sans">
                            {module.titleEn}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 pt-0">
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {module.descriptionAr}
                        </p>
                      </CardContent>
                    </div>

                    {/* Bottom subtle bar */}
                    <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-emerald-700 transition-colors">
                      <span>فتح الوحدة</span>
                      <span className="font-sans font-bold group-hover:underline">
                        {module.href}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────
            CLINICAL HIGHLIGHTS / EVIDENCE-BASED PRINCIPLES
        ─────────────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
          aria-label="مبادئ التأهيل السريري"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-950">
                  منهجية التأهيل السريري في Peak Motion
                </h3>
                <p className="text-xs text-slate-500">
                  Clinical Rehabilitation Framework & Evidence-Based Practice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-emerald-700">
                النظام جاهز ومُحدث
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-700 shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-navy-950">
                  تقييم موضوعي مستمر (ROM & Girth)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  قياس المدى الحركي بالدرجات ومحيط العضلات بالسنتيمتر مقارنة
                  بالطرف السليم لتوثيق التحسن بدقة بالأرقام.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-blue-100/80 text-blue-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-navy-950">
                  بروتوكولات مرحلية بمؤشرات أمان
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تدرج مرحلي من التمارين الساكنة (Isometrics) إلى الوظيفية مع
                  مراعاة الرايات الحمراء (Red Flags) لتفادي الانتكاس.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-teal-100/80 text-teal-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-navy-950">
                  معايير موضوعية للنزول (RTP Criteria)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  اختبارات القوة والقفز ومؤشر التماثل الطرفي (LSI ≥ 90%) لضمان
                  الأمان التام قبل السماح بالعودة للمنافسة.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
