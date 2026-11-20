"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  RefreshCw,
  Wifi,
  Clock,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ShieldCheck,
  Compass,
  AlertCircle,
  Laptop,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// --- Types ---
type TimeRange = "24h" | "7d" | "30d" | "90d";

interface KPIStats {
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

interface BreakdownItem {
  page?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  country?: string;
  count: number;
}

interface RecentVisit {
  id: string;
  visitorId: string;
  page: string;
  device: string;
  browser: string;
  country: string | null;
  referrer: string | null;
  createdAt: string;
}

interface TimeSeriesPoint {
  date: string;
  visits: number;
  unique: number;
}

interface AnalyticsData {
  kpis: KPIStats;
  topPages: BreakdownItem[];
  topReferrers: BreakdownItem[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  countries: BreakdownItem[];
  recentVisits: RecentVisit[];
  timeSeries: TimeSeriesPoint[];
}

// --- Page & Route Mappings ---
const PAGE_INFO: Record<string, { ar: string; en: string }> = {
  "/": { ar: "الرئيسية", en: "Home Dashboard" },
  "/cases": { ar: "الحالات والملفات", en: "Patient Cases" },
  "/add-case": { ar: "إضافة حالة", en: "Add New Case" },
  "/exercises": { ar: "مكتبة التمارين", en: "Exercise Library" },
  "/protocols": { ar: "البروتوكولات التأهيلية", en: "Clinical Protocols" },
  "/research": { ar: "أبحاث PubMed", en: "Medical Research" },
  "/return-to-play": { ar: "شروط العودة للملعب (RTP)", en: "Return to Play" },
  "/online-followup": { ar: "متابعة أونلاين", en: "Online Follow-up" },
  "/ai-analysis": { ar: "تحليل الحركة بالذكاء الاصطناعي", en: "AI Motion Analysis" },
  "/analytics": { ar: "الإحصائيات والزيارات", en: "Analytics Dashboard" },
};

function getPageName(path: string): { ar: string; en: string } {
  if (PAGE_INFO[path]) return PAGE_INFO[path];
  if (path.startsWith("/cases/")) return { ar: "تفاصيل الحالة", en: "Case Details" };
  if (path.startsWith("/protocols/")) return { ar: "تفاصيل البروتوكول", en: "Protocol Details" };
  if (path.startsWith("/exercises/")) return { ar: "تفاصيل التمرين", en: "Exercise Details" };
  return { ar: path, en: path };
}

// --- Country Helpers ---
const COUNTRY_INFO: Record<string, { ar: string; flag: string }> = {
  EG: { ar: "مصر", flag: "🇪🇬" },
  SA: { ar: "السعودية", flag: "🇸🇦" },
  AE: { ar: "الإمارات", flag: "🇦🇪" },
  KW: { ar: "الكويت", flag: "🇰🇼" },
  QA: { ar: "قطر", flag: "🇶🇦" },
  BH: { ar: "البحرين", flag: "🇧🇭" },
  OM: { ar: "عُمان", flag: "🇴🇲" },
  JO: { ar: "الأردن", flag: "🇯🇴" },
  IQ: { ar: "العراق", flag: "🇮🇶" },
  LB: { ar: "لبنان", flag: "🇱🇧" },
  PS: { ar: "فلسطين", flag: "🇵🇸" },
  SY: { ar: "سوريا", flag: "🇸🇾" },
  YE: { ar: "اليمن", flag: "🇾🇪" },
  SD: { ar: "السودان", flag: "🇸🇩" },
  LY: { ar: "ليبيا", flag: "🇱🇾" },
  TN: { ar: "تونس", flag: "🇹🇳" },
  DZ: { ar: "الجزائر", flag: "🇩🇿" },
  MA: { ar: "المغرب", flag: "🇲🇦" },
  US: { ar: "أمريكا", flag: "🇺🇸" },
  GB: { ar: "بريطانيا", flag: "🇬🇧" },
  DE: { ar: "ألمانيا", flag: "🇩🇪" },
  FR: { ar: "فرنسا", flag: "🇫🇷" },
  TR: { ar: "تركيا", flag: "🇹🇷" },
  CA: { ar: "كندا", flag: "🇨🇦" },
};

function formatCountry(codeOrName: string | null): { name: string; flag: string } {
  if (!codeOrName || codeOrName === "unknown" || codeOrName === "null") {
    return { name: "غير محدد", flag: "🌐" };
  }
  const upper = codeOrName.toUpperCase().trim();
  if (COUNTRY_INFO[upper]) {
    return { name: COUNTRY_INFO[upper].ar, flag: COUNTRY_INFO[upper].flag };
  }
  return { name: codeOrName, flag: "🌍" };
}

// --- Device Helpers ---
function getDeviceDetails(device: string): { labelAr: string; labelEn: string; icon: React.ElementType; color: string } {
  const d = device.toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) {
    return { labelAr: "هاتف جوال", labelEn: "Mobile", icon: Smartphone, color: "text-emerald-600 bg-emerald-50" };
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return { labelAr: "جهاز لوحي", labelEn: "Tablet", icon: Tablet, color: "text-blue-600 bg-blue-50" };
  }
  return { labelAr: "حاسوب مكتبي", labelEn: "Desktop", icon: Monitor, color: "text-navy-600 bg-navy-50" };
}

// --- Referrer Helpers ---
function formatReferrer(ref: string | null): { labelAr: string; labelEn: string; color: string; badge: string } {
  if (!ref || ref === "Direct" || ref === "direct" || ref === "null") {
    return { labelAr: "زيارة مباشرة", labelEn: "Direct Traffic", color: "bg-slate-100 text-slate-700", badge: "Direct" };
  }
  const lower = ref.toLowerCase();
  if (lower.includes("google")) {
    return { labelAr: "بحث جوجل", labelEn: "Google Search", color: "bg-blue-50 text-blue-700 border-blue-200", badge: "Google" };
  }
  if (lower.includes("whatsapp") || lower.includes("wa.me")) {
    return { labelAr: "واتساب", labelEn: "WhatsApp", color: "bg-emerald-50 text-emerald-700 border-emerald-200", badge: "WhatsApp" };
  }
  if (lower.includes("tiktok")) {
    return { labelAr: "تيك توك", labelEn: "TikTok", color: "bg-pink-50 text-pink-700 border-pink-200", badge: "TikTok" };
  }
  if (lower.includes("facebook") || lower.includes("fb.com")) {
    return { labelAr: "فيسبوك", labelEn: "Facebook", color: "bg-indigo-50 text-indigo-700 border-indigo-200", badge: "Facebook" };
  }
  if (lower.includes("instagram")) {
    return { labelAr: "إنستغرام", labelEn: "Instagram", color: "bg-rose-50 text-rose-700 border-rose-200", badge: "Instagram" };
  }
  if (lower.includes("twitter") || lower.includes("t.co") || lower.includes("x.com")) {
    return { labelAr: "منصة إكس (تويتر)", labelEn: "X / Twitter", color: "bg-slate-800 text-white", badge: "X" };
  }
  return { labelAr: ref, labelEn: ref, color: "bg-slate-100 text-slate-700", badge: "Web" };
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 ثانية";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} ثانية (Sec)`;
  return `${mins} دقيقة ${secs > 0 ? `و ${secs} ثانية` : ""} (${mins}m ${secs}s)`;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [mounted, setMounted] = useState<boolean>(false);

  // In-memory persistent session IDs (NO localStorage used)
  const visitorIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    if (!visitorIdRef.current) {
      visitorIdRef.current = "v-" + Math.random().toString(36).substring(2, 10);
    }
    if (!sessionIdRef.current) {
      sessionIdRef.current = "s-" + Math.random().toString(36).substring(2, 10);
    }
  }, []);

  // 1. Fetch Analytics Data
  const fetchData = useCallback(
    async (range: TimeRange, silent: boolean = false) => {
      try {
        if (!silent) setIsLoading(true);
        setIsRefreshing(true);
        setError(null);

        const res = await fetch(`/api/analytics/stats?range=${range}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`تعذر تحميل بيانات الإحصائيات (رمز: ${res.status})`);
        }

        const json: AnalyticsData = await res.json();
        setData(json);
        setLastRefreshedAt(new Date());
      } catch (err: unknown) {
        console.error("Failed to fetch analytics:", err);
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع أثناء تحميل البيانات."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // 2. Fetch on mount & range change + Auto-refresh stats every 30-60s
  useEffect(() => {
    fetchData(timeRange);

    // Auto-refresh interval (every 30 seconds for real-time live feed & stats)
    const interval = setInterval(() => {
      fetchData(timeRange, true);
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange, fetchData]);

  // 3. Heartbeat: POST to /api/analytics/heartbeat every 60s
  useEffect(() => {
    const postHeartbeat = async () => {
      try {
        await fetch("/api/analytics/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            sessionId: sessionIdRef.current,
            page: window.location.pathname || "/analytics",
          }),
        });
      } catch (e) {
        // Heartbeat failure shouldn't disrupt UI
      }
    };

    postHeartbeat();
    const heartbeatInterval = setInterval(postHeartbeat, 60000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  // 4. CSV Export Handler
  const handleExportCSV = () => {
    if (!data?.recentVisits || data.recentVisits.length === 0) {
      alert("لا توجد بيانات زيارات متاحة للتصدير حالياً.");
      return;
    }

    const headers = [
      "معرّف الزائر (Visitor ID)",
      "الصفحة المزارة (Page)",
      "اسم الصفحة (Page Name)",
      "الجهاز (Device)",
      "المتصفح (Browser)",
      "الدولة (Country)",
      "مصدر الزيارة (Referrer)",
      "التاريخ والوقت (Timestamp)",
    ];

    const rows = data.recentVisits.map((v) => {
      const pInfo = getPageName(v.page);
      const cInfo = formatCountry(v.country);
      const dInfo = getDeviceDetails(v.device);
      const rInfo = formatReferrer(v.referrer);
      const formattedDate = new Date(v.createdAt).toLocaleString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return [
        `"${v.visitorId}"`,
        `"${v.page}"`,
        `"${pInfo.ar} - ${pInfo.en}"`,
        `"${dInfo.labelAr} (${dInfo.labelEn})"`,
        `"${v.browser || "Unknown"}"`,
        `"${cInfo.name}"`,
        `"${rInfo.labelAr}"`,
        `"${formattedDate}"`,
      ].join(",");
    });

    // \uFEFF BOM for UTF-8 Excel Arabic compatibility
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `peak-motion-analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper for Chart Date Formatting
  const formatTick = (val: string) => {
    try {
      if (timeRange === "24h") {
        const d = new Date(val);
        return d.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
      }
      const parts = val.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      const d = new Date(val);
      return d.toLocaleDateString("ar-EG", { month: "numeric", day: "numeric" });
    } catch {
      return val;
    }
  };

  // Safe KPI fallbacks
  const kpis: KPIStats = data?.kpis || {
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    todayUnique: 0,
    liveActive: 0,
    avgDuration: 0,
    bounceRate: 0,
    prevVisits: 0,
    prevUnique: 0,
    visitChange: 0,
    uniqueChange: 0,
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy-950 tracking-tight">
                الإحصائيات والزيارات
                <span className="text-emerald-600 text-lg md:text-xl font-semibold me-2 ms-2">
                  — Stats & Real-Time Analytics
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                <span>متابعة تفاعلية لحركة المرضى والزوار داخل العيادة والمنصة</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-400">بيانات فورية من قاعدة البيانات الحية</span>
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 me-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>بث مباشر (Live)</span>
          </div>

          {/* Time Range Selector Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { id: "24h", labelAr: "24 ساعة", labelEn: "24h" },
              { id: "7d", labelAr: "7 أيام", labelEn: "7D" },
              { id: "30d", labelAr: "30 يوماً", labelEn: "30D" },
              { id: "90d", labelAr: "90 يوماً", labelEn: "90D" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTimeRange(item.id as TimeRange)}
                className={cn(
                  "px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all duration-150 flex items-center gap-1",
                  timeRange === item.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-navy-950 hover:bg-slate-100"
                )}
              >
                <span>{item.labelAr}</span>
                <span className="text-[10px] opacity-75 font-mono">({item.labelEn})</span>
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(timeRange)}
            disabled={isRefreshing}
            className="h-9 px-3 gap-1.5 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
            title="تحديث البيانات"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-emerald-600")}
            />
            <span className="hidden sm:inline text-xs font-medium">تحديث</span>
          </Button>

          {/* CSV Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 px-3 gap-1.5 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            title="تصدير تقرير الزيارات بصيغة CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">تصدير CSV</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData(timeRange)}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Total Visits */}
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي الزيارات</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Total Visits</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {isLoading ? "..." : kpis.totalVisits.toLocaleString("ar-EG")}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {kpis.visitChange >= 0 ? (
                <Badge variant="success" className="gap-1 px-1.5 py-0.5 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>+{kpis.visitChange}%</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 px-1.5 py-0.5 text-[11px] font-bold">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span>{kpis.visitChange}%</span>
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">مقارنة بالفترة السابقة</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Unique Visitors */}
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">الزوار الفريدون</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Unique Visitors</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {isLoading ? "..." : kpis.uniqueVisitors.toLocaleString("ar-EG")}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {kpis.uniqueChange >= 0 ? (
                <Badge variant="success" className="gap-1 px-1.5 py-0.5 text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>+{kpis.uniqueChange}%</span>
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 px-1.5 py-0.5 text-[11px] font-bold">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span>{kpis.uniqueChange}%</span>
                </Badge>
              )}
              <span className="text-[10px] text-slate-400">معدل النمو</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Today's Visitors */}
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 left-0 h-1 bg-purple-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">زوار اليوم</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Today&apos;s Visitors</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {isLoading ? "..." : kpis.todayVisits.toLocaleString("ar-EG")}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium">
              منهم <span className="font-bold text-purple-700 font-mono">{kpis.todayUnique}</span> زائر فريد اليوم
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Live Active Now */}
        <Card className="border border-emerald-200 bg-emerald-50/20 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-600" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">المتصلون الآن</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 font-mono">Live Active (5m)</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                {isLoading ? "..." : kpis.liveActive.toLocaleString("ar-EG")}
              </div>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-800/80 font-medium">
              نشط الآن في آخر 5 دقائق
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Avg Session Duration */}
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">متوسط مدة الجلسة</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Avg Session Duration</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {isLoading ? "..." : `${kpis.avgDuration}s`}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium truncate" title={formatDuration(kpis.avgDuration)}>
              {formatDuration(kpis.avgDuration)}
            </p>
          </CardContent>
        </Card>

        {/* KPI 6: Bounce Rate */}
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">معدل الارتداد</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Bounce Rate</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-navy-950 font-mono tracking-tight">
              {isLoading ? "..." : `${kpis.bounceRate}%`}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 font-medium">
              زيارات الصفحة الواحدة فقط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Time-Series Area Chart */}
      <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <span>المخطط الزمني للزيارات والتفاعل</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  (Traffic Trends & User Dynamics)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                توزيع الزيارات الكلية مقابل الزوار الفريدين عبر الفترة المحددة ({timeRange})
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700">إجمالي الزيارات (Visits)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-700">الزوار الفريدون (Unique)</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading && !data ? (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>جاري تحميل بيانات الرسم البياني...</span>
              </div>
            </div>
          ) : !data?.timeSeries || data.timeSeries.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
              لا توجد بيانات مسجلة في هذا النطاق الزمني.
            </div>
          ) : (
            <div className="h-[340px] w-full" dir="ltr">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.timeSeries}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTick}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0]?.payload as TimeSeriesPoint;
                          return (
                            <div
                              className="bg-navy-950/95 text-white p-3 rounded-xl shadow-xl border border-navy-800 text-xs min-w-[200px] backdrop-blur-md"
                              dir="rtl"
                            >
                              <p className="font-bold text-slate-300 border-b border-navy-800 pb-1.5 mb-2 font-mono">
                                {timeRange === "24h"
                                  ? new Date(label).toLocaleString("ar-EG", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : new Date(label).toLocaleDateString("ar-EG", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                              </p>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-emerald-400">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>إجمالي الزيارات:</span>
                                  </span>
                                  <span className="font-bold font-mono text-sm">
                                    {item?.visits?.toLocaleString("ar-EG")}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-blue-400">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span>الزوار الفريدون:</span>
                                  </span>
                                  <span className="font-bold font-mono text-sm">
                                    {item?.unique?.toLocaleString("ar-EG")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "14px", fontSize: "12px" }}
                      formatter={(val) => {
                        if (val === "visits") return "إجمالي الزيارات (Total Visits)";
                        if (val === "unique") return "الزوار الفريدون (Unique Visitors)";
                        return val;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      name="visits"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorVisits)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unique"
                      name="unique"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorUnique)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Breakdowns Section (5 Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Breakdown 1: Top Pages/Modules */}
        <Card className="border border-slate-100 shadow-sm bg-white lg:col-span-2">
          <CardHeader className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>أكثر الصفحات والوحدات زيارة</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Top Visited Pages & Clinic Modules
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {data?.topPages?.length || 0} صفحات
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {(!data?.topPages || data.topPages.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد سجلات صفحات بعد.</p>
            ) : (
              <div className="space-y-3.5">
                {data.topPages.slice(0, 7).map((item, idx) => {
                  const pName = getPageName(item.page || "/");
                  const total = kpis.totalVisits || 1;
                  const pct = Math.min(100, Math.round((item.count / total) * 100));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 max-w-[70%] truncate">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-navy-950">{pName.ar}</span>
                          <span className="text-slate-400 font-mono text-[11px] truncate">
                            ({item.page})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-emerald-700 font-bold">
                            {item.count.toLocaleString("ar-EG")} زيارة
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono w-9 text-left">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                      {/* Horizontal Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown 2: Traffic Sources */}
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>مصادر الزيارات</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Traffic Sources & Referrers
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {data?.topReferrers?.length || 0} مصادر
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {(!data?.topReferrers || data.topReferrers.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد مصادر محددة بعد.</p>
            ) : (
              <div className="space-y-3">
                {data.topReferrers.slice(0, 6).map((item, idx) => {
                  const r = formatReferrer(item.referrer || "Direct");
                  const total = kpis.totalVisits || 1;
                  const pct = Math.min(100, Math.round((item.count / total) * 100));

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold border", r.color)}>
                          {r.badge}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-navy-950">{r.labelAr}</p>
                          <p className="text-[10px] text-slate-400">{r.labelEn}</p>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-xs font-bold text-navy-950">
                          {item.count.toLocaleString("ar-EG")}
                        </span>
                        <span className="text-[10px] text-slate-400 ms-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown 3: Devices */}
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>الأجهزة المستخدمة</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Device Breakdown (Mobile, Tablet, Desktop)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {(!data?.devices || data.devices.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد بيانات أجهزة بعد.</p>
            ) : (
              <div className="space-y-3">
                {data.devices.map((d, idx) => {
                  const dev = getDeviceDetails(d.device || "desktop");
                  const DevIcon = dev.icon;
                  const total = kpis.totalVisits || 1;
                  const pct = Math.min(100, Math.round((d.count / total) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", dev.color)}>
                            <DevIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-navy-950 font-bold">{dev.labelAr}</span>
                            <span className="text-slate-400 text-[10px] font-mono ms-1">
                              ({dev.labelEn})
                            </span>
                          </div>
                        </div>
                        <div className="font-mono">
                          <span className="font-bold text-navy-950">
                            {d.count.toLocaleString("ar-EG")}
                          </span>
                          <span className="text-[10px] text-slate-400 ms-1 font-semibold">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown 4: Browsers */}
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-600" />
              <span>المتصفحات وأنظمة التشغيل</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Browsers & Client User Agents
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {(!data?.browsers || data.browsers.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد بيانات متصفحات بعد.</p>
            ) : (
              <div className="space-y-3">
                {data.browsers.slice(0, 5).map((b, idx) => {
                  const total = kpis.totalVisits || 1;
                  const pct = Math.min(100, Math.round((b.count / total) * 100));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-navy-950 font-mono">{b.browser || "Unknown"}</span>
                        <div className="font-mono text-slate-600">
                          <span className="font-bold text-navy-950">
                            {b.count.toLocaleString("ar-EG")}
                          </span>
                          <span className="text-[10px] text-slate-400 ms-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown 5: Countries */}
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>التوزيع الجغرافي (الدول)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Geographic Traffic by Country
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {(!data?.countries || data.countries.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد بيانات جغرافية بعد.</p>
            ) : (
              <div className="space-y-3">
                {data.countries.slice(0, 5).map((c, idx) => {
                  const country = formatCountry(c.country || null);
                  const total = kpis.totalVisits || 1;
                  const pct = Math.min(100, Math.round((c.count / total) * 100));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{country.flag}</span>
                          <span className="text-navy-950 font-bold">{country.name}</span>
                          {c.country && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({c.country})
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-600">
                          <span className="font-bold text-navy-950">
                            {c.count.toLocaleString("ar-EG")}
                          </span>
                          <span className="text-[10px] text-slate-400 ms-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Recent Visits Feed Table */}
      <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-lg font-bold text-navy-950">
                  آخر الزيارات المسجلة
                </CardTitle>
                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>تحديث تلقائي كل 30 ثانية</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                سجل الزوار في الوقت الفعلي مع تفاصيل الأجهزة والمواقع الجغرافية والصفحات
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">تصدير CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {(!data?.recentVisits || data.recentVisits.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              لا توجد سجلات زيارات حديثة في قاعدة البيانات.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[140px] text-xs font-bold text-slate-600">
                      معرّف الزائر (Visitor ID)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600">
                      الصفحة المزارة (Page)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600">
                      الجهاز (Device)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600">
                      المتصفح (Browser)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600">
                      الدولة (Country)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600">
                      المرجع (Referrer)
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 text-end">
                      وقت الزيارة (Time)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentVisits.map((visit) => {
                    const pInfo = getPageName(visit.page);
                    const cInfo = formatCountry(visit.country);
                    const devInfo = getDeviceDetails(visit.device);
                    const DevIcon = devInfo.icon;
                    const rInfo = formatReferrer(visit.referrer);

                    const visitDate = new Date(visit.createdAt);
                    const timeStr = visitDate.toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
                    const dateStr = visitDate.toLocaleDateString("ar-EG", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <TableRow key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Visitor ID */}
                        <TableCell className="font-mono text-xs font-bold text-slate-700">
                          <span className="px-2 py-1 bg-slate-100 rounded text-slate-800">
                            {visit.visitorId}
                          </span>
                        </TableCell>

                        {/* Page */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-navy-950">
                              {pInfo.ar}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {visit.page}
                            </span>
                          </div>
                        </TableCell>

                        {/* Device */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-6 h-6 rounded flex items-center justify-center", devInfo.color)}>
                              <DevIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {devInfo.labelAr}
                            </span>
                          </div>
                        </TableCell>

                        {/* Browser */}
                        <TableCell className="text-xs font-medium text-slate-700 font-mono">
                          {visit.browser || "Unknown"}
                        </TableCell>

                        {/* Country */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <span className="text-base">{cInfo.flag}</span>
                            <span>{cInfo.name}</span>
                          </div>
                        </TableCell>

                        {/* Referrer */}
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] font-semibold border", rInfo.color)}>
                            {rInfo.badge}
                          </Badge>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="text-end">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {timeStr}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {dateStr}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Info & Last Update */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-200/60 pt-4 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>نظام تحليلات Peak Motion مشفر ومجهل للهوية بالكامل وفق معايير الخصوصية الصحية</span>
        </div>
        <div>
          آخر تحديث:{" "}
          <span className="font-mono text-slate-600 font-medium">
            {lastRefreshedAt.toLocaleTimeString("ar-EG")}
          </span>
        </div>
      </div>
    </div>
  );
}
