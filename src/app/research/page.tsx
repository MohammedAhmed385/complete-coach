"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Calendar,
  FileText,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Filter,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Share2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, generateWhatsAppShareLink, formatDateShort } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────

interface Article {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi?: string;
  sortDate?: string;
}

interface SavedPaper {
  id: string;
  pmid: string;
  title: string;
  authors: string;
  journal?: string | null;
  pubDate?: string | null;
  doi?: string | null;
  abstract?: string | null;
  savedAt: string;
}

interface TopicTag {
  ar: string;
  en: string;
  query: string;
}

interface StudyTypeOption {
  ar: string;
  en: string;
  value: string;
}

// ── Constants ────────────────────────────────────────────────────────

const TOPIC_TAGS: TopicTag[] = [
  { ar: "تأهيل الرباط الصليبي", en: "ACL Rehabilitation", query: "ACL Rehabilitation" },
  { ar: "اعتلال الأوتار", en: "Tendinopathy", query: "Tendinopathy" },
  { ar: "خشونة الركبة", en: "Knee Osteoarthritis", query: "Knee Osteoarthritis" },
  { ar: "الإصابات الرياضية", en: "Sports Injuries", query: "Sports Injuries" },
  { ar: "العلاج الطبيعي", en: "Physical Therapy", query: "Physical Therapy" },
  { ar: "العودة للملاعب", en: "Return to Sport", query: "Return to Sport" },
  { ar: "التدريب العصبي العضلي", en: "Neuromuscular Training", query: "Neuromuscular Training" },
  { ar: "التمارين الثابتة", en: "Isometric Exercise", query: "Isometric Exercise" },
  { ar: "تقييد تدفق الدم (BFR)", en: "Blood Flow Restriction", query: "Blood Flow Restriction" },
];

const STUDY_TYPES: StudyTypeOption[] = [
  { ar: "كافة أنواع الدراسات", en: "All Study Types", value: "" },
  { ar: "تجربة سريرية", en: "Clinical Trial", value: "Clinical Trial" },
  { ar: "تحليل تلوي", en: "Meta-Analysis", value: "Meta-Analysis" },
  { ar: "مراجعة علمية", en: "Review", value: "Review" },
  { ar: "تجربة عشوائية منضبطة (RCT)", en: "Randomized Controlled Trial", value: "Randomized Controlled Trial" },
  { ar: "مراجعة منهجية", en: "Systematic Review", value: "Systematic Review" },
];

const PAGE_SIZE = 10;

// ── Component ────────────────────────────────────────────────────────

export default function ResearchPage() {
  // Search & Filter States
  const [query, setQuery] = useState("ACL Rehabilitation");
  const [selectedTopic, setSelectedTopic] = useState<string>("ACL Rehabilitation");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [studyType, setStudyType] = useState("");
  const [page, setPage] = useState(0);

  // Data States
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [savedPmids, setSavedPmids] = useState<Set<string>>(new Set());

  // UI States
  const [activeTab, setActiveTab] = useState("search");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [savingPmid, setSavingPmid] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  // ── Fetch Saved Papers from Cloud DB ───────────────────────────────

  const fetchSavedPapers = useCallback(async () => {
    setIsSavedLoading(true);
    setSavedError(null);
    try {
      const res = await fetch("/api/research/save");
      if (!res.ok) {
        throw new Error("فشل استرجاع الأوراق المحفوظة من قاعدة البيانات");
      }
      const data = await res.json();
      const list: SavedPaper[] = data.papers || [];
      setSavedPapers(list);
      setSavedPmids(new Set(list.map((p) => p.pmid)));
    } catch (err) {
      console.error("Fetch saved papers error:", err);
      setSavedError("تعذر تحميل الأبحاث المحفوظة. يرجى إعادة المحاولة.");
    } finally {
      setIsSavedLoading(false);
    }
  }, []);

  // ── Fetch PubMed Articles ──────────────────────────────────────────

  const executeSearch = useCallback(
    async (targetPage = 0, currentQuery = query, currentType = studyType) => {
      if (!currentQuery.trim()) return;

      setIsLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          query: currentQuery.trim(),
          page: targetPage.toString(),
        });

        if (dateFrom) params.set("dateFrom", dateFrom.replace(/-/g, "/"));
        if (dateTo) params.set("dateTo", dateTo.replace(/-/g, "/"));
        if (currentType) params.set("studyType", currentType);

        const res = await fetch(`/api/research?${params.toString()}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `خطأ في البحث: ${res.status}`);
        }

        const data = await res.json();
        setArticles(data.articles || []);
        setTotalResults(data.total || 0);
        setPage(targetPage);
      } catch (err) {
        console.error("PubMed search error:", err);
        setSearchError("تعذر الاتصال بـ PubMed أو جلب النتائج. يرجى التحقق من اتصالك والمحاولة مجدداً.");
        setArticles([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    },
    [query, dateFrom, dateTo, studyType]
  );

  // Initial Load: Fetch saved papers and run default search
  useEffect(() => {
    fetchSavedPapers();
    executeSearch(0, "ACL Rehabilitation", "");
  }, [fetchSavedPapers]);

  // Handle Form Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(0);
  };

  // Handle Topic Tag Click
  const handleTopicClick = (topic: TopicTag) => {
    setSelectedTopic(topic.en);
    setQuery(topic.query);
    executeSearch(0, topic.query, studyType);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setQuery("");
    setSelectedTopic("");
    setDateFrom("");
    setDateTo("");
    setStudyType("");
  };

  // Toggle Save to Cloud DB
  const handleToggleSave = async (article: Article) => {
    const isCurrentlySaved = savedPmids.has(article.pmid);
    setSavingPmid(article.pmid);

    try {
      if (isCurrentlySaved) {
        // Unsave via POST action unsave or DELETE
        const res = await fetch("/api/research/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pmid: article.pmid,
            action: "unsave",
          }),
        });

        if (!res.ok) throw new Error("فشل إزالة المقال من المحفوظات");

        setSavedPmids((prev) => {
          const next = new Set(prev);
          next.delete(article.pmid);
          return next;
        });
        setSavedPapers((prev) => prev.filter((p) => p.pmid !== article.pmid));
      } else {
        // Save to cloud DB
        const res = await fetch("/api/research/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pmid: article.pmid,
            title: article.title,
            authors: article.authors,
            journal: article.journal,
            pubDate: article.pubDate,
            doi: article.doi,
            action: "save",
          }),
        });

        if (!res.ok) throw new Error("فشل حفظ المقال");

        const data = await res.json();
        const savedItem: SavedPaper = data.paper || {
          id: article.pmid,
          pmid: article.pmid,
          title: article.title,
          authors: article.authors.join(", "),
          journal: article.journal,
          pubDate: article.pubDate,
          doi: article.doi,
          savedAt: new Date().toISOString(),
        };

        setSavedPmids((prev) => new Set(prev).add(article.pmid));
        setSavedPapers((prev) => [savedItem, ...prev]);
      }
    } catch (err) {
      console.error("Save toggle error:", err);
      alert("حدث خطأ أثناء حفظ أو إزالة البحث. يرجى المحاولة مرة أخرى.");
    } finally {
      setSavingPmid(null);
    }
  };

  // Remove saved paper from Saved Papers tab
  const handleRemoveSaved = async (pmid: string) => {
    setSavingPmid(pmid);
    try {
      const res = await fetch(`/api/research/save?pmid=${pmid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("فشل الحذف");

      setSavedPmids((prev) => {
        const next = new Set(prev);
        next.delete(pmid);
        return next;
      });
      setSavedPapers((prev) => prev.filter((p) => p.pmid !== pmid));
    } catch (err) {
      console.error("Delete saved error:", err);
      alert("تعذر حذف البحث من المحفوظات");
    } finally {
      setSavingPmid(null);
    }
  };

  // WhatsApp Share helper
  const getWhatsAppShareUrl = (title: string, pmid: string, journal?: string, date?: string) => {
    const text =
      `*Peak Motion — دراسة طبية معتمدة من PubMed*\n` +
      `📌 *العنوان:* ${title}\n` +
      (journal ? `📖 *المجلة:* ${journal}\n` : "") +
      (date ? `📅 *التاريخ:* ${date}\n` : "") +
      `🔗 *رابط البحث:* https://pubmed.ncbi.nlm.nih.gov/${pmid}/\n\n` +
      `تمت المشاركة عبر نظام Peak Motion لإدارة الحالات والتأهيل الرياضي`;
    return generateWhatsAppShareLink(text);
  };

  // Clean DOI string for display
  const formatDoi = (doi?: string) => {
    if (!doi) return null;
    return doi.replace(/^doi:\s*/i, "").trim();
  };

  // Pagination calculation
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="gradient-header text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-inner">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>قاعدة بيانات الأبحاث الطبية المعتمدة</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono">NCBI / PubMed API</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                الأبحاث — PubMed Research
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                تصفح واستكشف أحدث التجارب السريرية والأدلة العلمية (Evidence-Based Practice) في العلاج الطبيعي والتأهيل
                الرياضي مباشرة من المكتبة الوطنية للطب الأمريكية.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-white border-white/20 bg-white/10 px-3 py-1.5 text-xs">
                {savedPapers.length} أوراق محفوظة
              </Badge>
            </div>
          </div>

          {/* ── Quick-filter topic tags ─────────────────────────────── */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>المواضيع الشائعة في التأهيل (Quick Topics):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPIC_TAGS.map((tag) => {
                const isActive = selectedTopic === tag.en;
                return (
                  <button
                    key={tag.en}
                    onClick={() => handleTopicClick(tag)}
                    type="button"
                    className={cn(
                      "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                      isActive
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-md scale-105"
                        : "bg-white/10 text-slate-200 border-white/15 hover:bg-white/20 hover:text-white hover:border-emerald-400/50"
                    )}
                  >
                    <span>{tag.ar}</span>
                    <span className="text-[10px] opacity-75 font-mono">({tag.en})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Container ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ── Search & Filters Section ─────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                معايير البحث المتقدم في PubMed
              </span>
              {(query || dateFrom || dateTo || studyType) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  مسح الفلاتر
                </button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Keyword Search Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  الكلمات المفتاحية أو اسم الباحث أو الإصابة (Keywords / Diagnosis / Intervention)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedTopic("");
                    }}
                    placeholder="مثال: ACL rehabilitation, Eccentric exercise, Patellar tendinopathy, Knee osteoarthritis..."
                    className="h-11 pr-11 text-base placeholder:text-slate-400 border-slate-300 focus:border-emerald-500"
                    dir="ltr"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Date Range & Study Type Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Date From */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    من تاريخ (From Date)
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 text-xs border-slate-300"
                  />
                </div>

                {/* Date To */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    إلى تاريخ (To Date)
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 text-xs border-slate-300"
                  />
                </div>

                {/* Study Type Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    نوع الدراسة (Study Type)
                  </label>
                  <select
                    value={studyType}
                    onChange={(e) => setStudyType(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  >
                    {STUDY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.ar} — {type.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {studyType && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="font-semibold text-slate-700">النوع المفلتر:</span>
                      <Badge variant="secondary" className="text-[11px]">
                        {studyType}
                      </Badge>
                    </span>
                  )}
                  {dateFrom && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="font-semibold text-slate-700">من:</span>
                      <span className="font-mono">{dateFrom}</span>
                    </span>
                  )}
                  {dateTo && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold text-slate-700">إلى:</span>
                      <span className="font-mono">{dateTo}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 h-10"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري البحث في PubMed...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 ml-2" />
                        بحث في الأبحاث
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Tabs: Search Results vs. Saved Papers ─────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <TabsList className="bg-slate-200/80 p-1 rounded-xl">
              <TabsTrigger
                value="search"
                className="gap-2 px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>نتائج البحث — PubMed Results</span>
                {totalResults > 0 && (
                  <Badge variant="default" className="text-[11px] py-0 px-2 font-mono">
                    {totalResults.toLocaleString()}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="saved"
                className="gap-2 px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <Bookmark className="w-4 h-4" />
                <span>الأوراق المحفوظة — Saved Papers</span>
                <Badge
                  variant={savedPapers.length > 0 ? "success" : "secondary"}
                  className="text-[11px] py-0 px-2 font-mono"
                >
                  {savedPapers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Quick Helper Text */}
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              {activeTab === "search" ? (
                <>
                  <span>يتم العرض بحد أقصى</span>
                  <span className="font-bold text-slate-700 font-mono">{PAGE_SIZE}</span>
                  <span>نتائج في كل صفحة</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>محفوظة في السحابة ومتاحة في أي وقت</span>
                </>
              )}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 1: Search Results                                        */}
          {/* ──────────────────────────────────────────────────────────── */}
          <TabsContent value="search" className="space-y-4 focus-visible:outline-none">
            {/* Error State */}
            {searchError && (
              <Card className="border-red-200 bg-red-50 text-red-800 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-semibold">{searchError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeSearch(page)}
                      className="border-red-300 bg-white text-red-700 hover:bg-red-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6 border-slate-200 animate-pulse bg-white">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-24 bg-slate-200 rounded-full" />
                        <div className="h-5 w-20 bg-slate-200 rounded-full" />
                      </div>
                      <div className="h-6 w-3/4 bg-slate-200 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 rounded" />
                      <div className="flex items-center gap-4 pt-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                        <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                        <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty Search Results */}
            {!isLoading && !searchError && articles.length === 0 && (
              <Card className="p-12 text-center bg-white border-dashed border-slate-300">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">لا توجد أبحاث مطابقة لمعايير البحث</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  حاول توسيع نطاق البحث، تغيير الكلمات المفتاحية باللغة الإنجليزية، أو إزالة فلاتر التاريخ ونوع الدراسة.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTopicClick(TOPIC_TAGS[0])}>
                    جرب: {TOPIC_TAGS[0].ar}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleTopicClick(TOPIC_TAGS[1])}>
                    جرب: {TOPIC_TAGS[1].ar}
                  </Button>
                </div>
              </Card>
            )}

            {/* Articles List */}
            {!isLoading && articles.length > 0 && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    عرض النتائج من <strong className="font-mono text-slate-700">{page * PAGE_SIZE + 1}</strong> إلى{" "}
                    <strong className="font-mono text-slate-700">
                      {Math.min((page + 1) * PAGE_SIZE, totalResults)}
                    </strong>{" "}
                    من أصل <strong className="font-mono text-emerald-700">{totalResults.toLocaleString()}</strong> دراسة
                  </span>
                  <span className="font-mono">
                    الصفحة {page + 1} من {totalPages || 1}
                  </span>
                </div>

                {articles.map((article) => {
                  const isSaved = savedPmids.has(article.pmid);
                  const isBusy = savingPmid === article.pmid;
                  const cleanDoi = formatDoi(article.doi);
                  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`;
                  const authorsText =
                    article.authors && article.authors.length > 0
                      ? article.authors.slice(0, 4).join(", ") + (article.authors.length > 4 ? " وآخرون..." : "")
                      : "لم يُذكر الباحثون";

                  return (
                    <Card
                      key={article.pmid}
                      className="border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <CardContent className="p-5 sm:p-6 space-y-3">
                        {/* Badges Bar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[11px] bg-slate-100 text-slate-700">
                            PMID: {article.pmid}
                          </Badge>

                          {cleanDoi && (
                            <Badge variant="outline" className="font-mono text-[11px] text-slate-600 border-slate-300">
                              DOI: {cleanDoi}
                            </Badge>
                          )}

                          {isSaved && (
                            <Badge variant="success" className="text-[11px] gap-1">
                              <BookmarkCheck className="w-3 h-3 text-emerald-700" />
                              محفوظ في مكتبتك
                            </Badge>
                          )}
                        </div>

                        {/* Title (Clickable) */}
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          <a
                            href={pubmedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-start gap-1.5"
                            dir="ltr"
                          >
                            <span>{article.title || "عنوان البحث غير متوفر"}</span>
                            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-600 mt-1 inline" />
                          </a>
                        </h2>

                        {/* Authors */}
                        <p className="text-xs text-slate-600" dir="ltr">
                          <span className="font-semibold text-slate-700">Authors: </span>
                          {authorsText}
                        </p>

                        {/* Journal & Pub Date */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                          {article.journal && (
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-700 italic">{article.journal}</span>
                            </div>
                          )}

                          {article.pubDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono">{article.pubDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                          {/* Open on PubMed */}
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs border-slate-200 hover:border-emerald-500 hover:text-emerald-700"
                          >
                            <a href={pubmedUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-emerald-600" />
                              قراءة على PubMed
                            </a>
                          </Button>

                          {/* Save to Library */}
                          <Button
                            variant={isSaved ? "secondary" : "default"}
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleToggleSave(article)}
                            className={cn(
                              "h-8 text-xs font-medium transition-colors",
                              isSaved
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                            ) : isSaved ? (
                              <BookmarkCheck className="w-3.5 h-3.5 ml-1.5 text-emerald-700" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5 ml-1.5" />
                            )}
                            {isSaved ? "محفوظ في المكتبة" : "حفظ في المكتبة"}
                          </Button>

                          {/* Share via WhatsApp */}
                          <Button
                            variant="whatsapp"
                            size="sm"
                            asChild
                            className="h-8 text-xs font-medium"
                          >
                            <a
                              href={getWhatsAppShareUrl(
                                article.title,
                                article.pmid,
                                article.journal,
                                article.pubDate
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                              مشاركة واتساب
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* ── Pagination Controls ────────────────────────────── */}
                <Card className="border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      الصفحة <strong className="font-mono text-slate-800">{page + 1}</strong> من{" "}
                      <strong className="font-mono text-slate-800">{totalPages || 1}</strong>
                      <span className="mx-2">•</span>
                      <span>إجمالي {totalResults.toLocaleString()} بحث معتمد</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0 || isLoading}
                        onClick={() => executeSearch(page - 1)}
                        className="h-9 px-4 text-xs font-semibold"
                      >
                        <ChevronRight className="w-4 h-4 ml-1" />
                        السابق (Previous)
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(page + 1) * PAGE_SIZE >= totalResults || isLoading}
                        onClick={() => executeSearch(page + 1)}
                        className="h-9 px-4 text-xs font-semibold"
                      >
                        التالي (Next)
                        <ChevronLeft className="w-4 h-4 mr-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* TAB 2: Saved Papers (Cloud DB)                               */}
          {/* ──────────────────────────────────────────────────────────── */}
          <TabsContent value="saved" className="space-y-4 focus-visible:outline-none">
            {savedError && (
              <Card className="border-amber-200 bg-amber-50 text-amber-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{savedError}</span>
                  <Button size="sm" variant="outline" onClick={fetchSavedPapers}>
                    تحديث
                  </Button>
                </div>
              </Card>
            )}

            {isSavedLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6 border-slate-200 animate-pulse bg-white">
                    <div className="space-y-3">
                      <div className="h-5 w-24 bg-slate-200 rounded-full" />
                      <div className="h-6 w-3/4 bg-slate-200 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : savedPapers.length === 0 ? (
              <Card className="p-12 text-center bg-white border-dashed border-slate-300">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">مكتبتك خالية حتى الآن</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  يمكنك حفظ الأبحاث والدراسات المهمة من تبويب البحث للرجوع إليها في أي وقت وتطبيقها في الخطط التأهيلية.
                </p>
                <div className="mt-5">
                  <Button
                    onClick={() => setActiveTab("search")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-5"
                  >
                    <Search className="w-3.5 h-3.5 ml-1.5" />
                    تصفح أبحاث PubMed الآن
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    إجمالي الأوراق المحفوظة في قاعدة البيانات:{" "}
                    <strong className="font-mono text-emerald-700">{savedPapers.length}</strong> بحث
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSavedPapers}
                    className="h-7 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <RefreshCw className="w-3 h-3 ml-1" />
                    تحديث القائمة
                  </Button>
                </div>

                {savedPapers.map((paper) => {
                  const cleanDoi = formatDoi(paper.doi || undefined);
                  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`;
                  const isBusy = savingPmid === paper.pmid;

                  return (
                    <Card
                      key={paper.id || paper.pmid}
                      className="border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-5 sm:p-6 space-y-3">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-[11px] bg-slate-100 text-slate-700">
                              PMID: {paper.pmid}
                            </Badge>

                            {cleanDoi && (
                              <Badge
                                variant="outline"
                                className="font-mono text-[11px] text-slate-600 border-slate-300"
                              >
                                DOI: {cleanDoi}
                              </Badge>
                            )}

                            <Badge variant="success" className="text-[11px]">
                              محفوظ في السحابة
                            </Badge>
                          </div>

                          {paper.savedAt && (
                            <span className="text-[11px] text-slate-400">
                              حُفظ بتاريخ: {formatDateShort(paper.savedAt)}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          <a
                            href={pubmedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-emerald-700 flex items-start gap-1.5"
                            dir="ltr"
                          >
                            <span>{paper.title}</span>
                            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 mt-1 inline" />
                          </a>
                        </h2>

                        {/* Authors */}
                        {paper.authors && (
                          <p className="text-xs text-slate-600" dir="ltr">
                            <span className="font-semibold text-slate-700">Authors: </span>
                            {paper.authors}
                          </p>
                        )}

                        {/* Journal & PubDate */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                          {paper.journal && (
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-700 italic">{paper.journal}</span>
                            </div>
                          )}

                          {paper.pubDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono">{paper.pubDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                          {/* Open on PubMed */}
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs border-slate-200 hover:border-emerald-500 hover:text-emerald-700"
                          >
                            <a href={pubmedUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-emerald-600" />
                              قراءة على PubMed
                            </a>
                          </Button>

                          {/* Share via WhatsApp */}
                          <Button
                            variant="whatsapp"
                            size="sm"
                            asChild
                            className="h-8 text-xs font-medium"
                          >
                            <a
                              href={getWhatsAppShareUrl(
                                paper.title,
                                paper.pmid,
                                paper.journal || undefined,
                                paper.pubDate || undefined
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                              مشاركة واتساب
                            </a>
                          </Button>

                          {/* Remove from Saved */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRemoveSaved(paper.pmid)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 mr-auto"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                            )}
                            إزالة من المحفوظات
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
