"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  UserPlus,
  Dumbbell,
  FolderHeart,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Play,
  RotateCcw,
  AlertCircle,
  Check,
  ArrowRight,
  Info,
  Layers,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { getPhaseLabel } from "@/lib/utils";
import ContactPage from "./contact/page";

// ── TYPES ──

interface CaseItem {
  id: string;
  name: string;
  phone?: string | null;
  injuryType: string;
  injuredSide: "RIGHT" | "LEFT" | "BILATERAL";
  injuryDate?: string;
  rehabStartDate?: string;
  status?: string;
  notes?: string | null;
  rehabPrograms?: Array<{
    phase: string;
    notes?: string | null;
    isActive: boolean;
  }>;
  romMeasurements?: Array<{
    joint: string;
    movement: string;
    injuredAngle: number;
    healthyAngle?: number | null;
  }>;
}

interface ExerciseItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  region: "UPPER" | "LOWER" | "CORE" | "FULL_BODY";
  isIsometric: boolean;
  isometricAngle?: number | null;
  instructions?: string | null;
  youtubeSearch?: string | null;
}

export default function HomePage() {
  const { user, isAdmin, loginAsAdmin } = useAuth();

  if (!isAdmin) {
    return <ContactPage />;
  }

  const effectiveIsAdmin = isAdmin;

  const [activeMainTab, setActiveMainTab] = useState<"cases" | "exercises">("cases");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [exerciseRegionFilter, setExerciseRegionFilter] = useState<string>("ALL");

  // Client & Admin Detail Modal
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<CaseItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Admin Case Edit Modal
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);

  // Admin Add Case Modal
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    name: "",
    phone: "",
    injuryType: "",
    injuredSide: "RIGHT" as "RIGHT" | "LEFT" | "BILATERAL",
    rehabPhase: "RESTORE_ROM",
    notes: "",
  });

  // Exercise Detail Modal
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [isExerciseDetailOpen, setIsExerciseDetailOpen] = useState(false);

  // Admin Add Exercise Modal
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [newExerciseForm, setNewExerciseForm] = useState({
    nameAr: "",
    nameEn: "",
    category: "Quadriceps & Knee",
    region: "LOWER" as "UPPER" | "LOWER" | "CORE" | "FULL_BODY",
    isIsometric: false,
    isometricAngle: "45",
    instructions: "",
  });

  // Load Data on Mount
  useEffect(() => {
    fetchCases();
    fetchExercises();
  }, []);

  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const fetchExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
      }
    } catch (err) {
      console.error("Failed to load exercises:", err);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  // ── ADMIN ACTIONS: CASES ──

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.name.trim() || !newCaseForm.injuryType.trim()) {
      alert("يرجى إدخال اسم المريض ونوع الإصابة");
      return;
    }

    setIsSavingCase(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCaseForm.name,
          phone: newCaseForm.phone || null,
          injuryType: newCaseForm.injuryType,
          injuredSide: newCaseForm.injuredSide,
          injuryDate: new Date().toISOString(),
          rehabStartDate: new Date().toISOString(),
          rehabPhase: newCaseForm.rehabPhase,
          notes: newCaseForm.notes,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCases([created, ...cases]);
        setIsAddCaseModalOpen(false);
        setNewCaseForm({
          name: "",
          phone: "",
          injuryType: "",
          injuredSide: "RIGHT",
          rehabPhase: "RESTORE_ROM",
          notes: "",
        });
      }
    } catch (err) {
      console.error("Error creating case:", err);
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;

    setIsSavingCase(true);
    try {
      const res = await fetch(`/api/cases/${editingCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCase),
      });

      if (res.ok) {
        setCases(cases.map((c) => (c.id === editingCase.id ? editingCase : c)));
        setIsEditModalOpen(false);
        setEditingCase(null);
      }
    } catch (err) {
      console.error("Error updating case:", err);
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleDeleteCase = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف حالة (${name}) نهائياً؟`)) return;

    try {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCases(cases.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting case:", err);
    }
  };

  // ── ADMIN ACTIONS: EXERCISES ──

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseForm.nameAr.trim()) {
      alert("يرجى كتابة اسم التمرين");
      return;
    }

    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: newExerciseForm.nameAr,
          nameEn: newExerciseForm.nameEn || newExerciseForm.nameAr,
          category: newExerciseForm.category,
          region: newExerciseForm.region,
          isIsometric: newExerciseForm.isIsometric,
          isometricAngle: newExerciseForm.isIsometric ? parseFloat(newExerciseForm.isometricAngle) : null,
          instructions: newExerciseForm.instructions,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setExercises([created, ...exercises]);
        setIsAddExerciseModalOpen(false);
        setNewExerciseForm({
          nameAr: "",
          nameEn: "",
          category: "Quadriceps & Knee",
          region: "LOWER",
          isIsometric: false,
          isometricAngle: "45",
          instructions: "",
        });
      }
    } catch (err) {
      console.error("Error creating exercise:", err);
    }
  };

  // Filtered views
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.injuryType.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const filteredExercises = exercises.filter((ex) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      ex.nameAr.toLowerCase().includes(q) ||
      ex.nameEn.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q);
    const matchesRegion =
      exerciseRegionFilter === "ALL" || ex.region === exerciseRegionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── TOP PLATFORM HEADER ── */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 font-bold gap-1.5 shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>منصة Revive السريرية للتأهيل الحركي</span>
                </Badge>

                {isAdmin && (
                  <Badge className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>لوحة تحكم المدير</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                دليل الحالات والبرامج التأهيلية السريرية
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                استعراض فوري لبرامج تعافي المرضى، قياسات المدى الحركي (ROM)، ومكتبة التمارين المعتمدة لإصابات الملاعب
              </p>
            </div>

            {/* Actions: Admin vs Client */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isAdmin ? (
                <>
                  <Button
                    onClick={() => setIsAddCaseModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-emerald-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة حالة مريض</span>
                  </Button>

                  <Button
                    onClick={() => setIsAddExerciseModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-blue-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تمرين</span>
                  </Button>

                  <Link
                    href="/admin"
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>لوحة الإدارة</span>
                  </Link>
                </>
              ) : (
                <a
                  href="https://wa.me/201275829322?text=مرحباً%20دكتور،%20أود%20الاستفسار%20عن%20برنامج%20تأهيلي%20أو%20حجز%20موعد"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>حجز استشارة أو تقييم حالة</span>
                </a>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-6">
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
            <Input
              placeholder="ابحث بالاسم، نوع الإصابة (مثل ACL, Tendinopathy)، أو اسم التمرين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-11 h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-2xl text-xs focus:bg-white/20 focus:border-emerald-400 transition-all"
            />
          </div>
        </div>

        {/* ── MAIN DUAL TABS: CASES vs EXERCISES ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMainTab("cases")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                  activeMainTab === "cases"
                    ? "bg-navy-950 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <FolderHeart className="w-4 h-4 text-emerald-400" />
                <span>سجل الحالات التأهيلية ({cases.length})</span>
              </button>

              <button
                onClick={() => setActiveMainTab("exercises")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                  activeMainTab === "exercises"
                    ? "bg-navy-950 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <span>دليل التمارين المعتمدة ({exercises.length})</span>
              </button>
            </div>

            {/* Region Filter for Exercises */}
            {activeMainTab === "exercises" && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {["ALL", "LOWER", "UPPER", "CORE"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setExerciseRegionFilter(r)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                      exerciseRegionFilter === r
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {r === "ALL" ? "الكل" : r === "LOWER" ? "الطرف السفلي" : r === "UPPER" ? "الطرف العلوي" : "الجذع والعمود الفقري"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════
              SECTION 1: CASES SHOWCASE (Admin vs Client)
              ══════════════════════════════════════════════ */}
          {activeMainTab === "cases" && (
            <div className="space-y-6">

              {isLoadingCases ? (
                <div className="text-center py-16 space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">جاري جلب سجلات الحالات السريرية...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                /* ZERO CASES EMPTY STATE */
                <Card className="rounded-3xl border-dashed border-2 border-slate-300 p-12 text-center bg-white/60 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <FolderHeart className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-slate-900">
                      لا توجد حالات مسجلة حالياً
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {effectiveIsAdmin
                        ? "النظام مصفّر وجاهز لإضافة أول مريض أو حالة تأهيلية جديدة خاصة بعيادتك."
                        : "جاري تحديث السجلات السريرية من قِبل الأخصائي. يمكنك التواصل المباشر لحجز أول جلسة أو استشارة."}
                    </p>
                  </div>

                  {effectiveIsAdmin ? (
                    <Button
                      onClick={() => setIsAddCaseModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-6 py-2.5 shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="w-4 h-4 me-1" />
                      <span>إضافة أول حالة مريض الآن</span>
                    </Button>
                  ) : (
                    <a
                      href="https://wa.me/201275829322?text=مرحباً%20دكتور،%20أود%20الاستفسار%20لتسجيل%20حالتي%20وبدء%20البرنامج%20التأهيلي"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تواصل معنا لتسجيل حالتك عبر واتساب</span>
                    </a>
                  )}
                </Card>
              ) : (
                /* GRID OF LIVE CASES */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCases.map((c) => {
                    const activePhase = c.rehabPrograms?.find((p) => p.isActive)?.phase || "ACUTE";
                    const phaseMeta = getPhaseLabel(activePhase);

                    return (
                      <Card
                        key={c.id}
                        className="rounded-3xl border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden flex flex-col justify-between group"
                      >
                        <div className={`h-2 bg-gradient-to-r ${effectiveIsAdmin ? "from-amber-400 to-emerald-500" : "from-emerald-500 to-teal-400"}`} />

                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              {phaseMeta.ar}
                            </Badge>

                            <span className="text-[11px] text-slate-400 font-mono">
                              {c.injuredSide === "RIGHT" ? "الطرف الأيمن" : c.injuredSide === "LEFT" ? "الطرف الأيسر" : "الطرفين"}
                            </span>
                          </div>

                          <CardTitle className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {c.name}
                          </CardTitle>
                          <CardDescription className="text-xs font-bold text-emerald-600">
                            {c.injuryType}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="px-5 pb-4 space-y-3 text-xs text-slate-600">
                          {c.phone && effectiveIsAdmin && (
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono" dir="ltr">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                          )}

                          {c.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {c.notes}
                            </p>
                          )}
                        </CardContent>

                        {/* Card Footer: Client UI vs Admin UI */}
                        {effectiveIsAdmin ? (
                          /* ADMIN CARD FOOTER (Controls: Details, Edit, Delete) */
                          <CardFooter className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCaseForDetail(c);
                                setIsDetailModalOpen(true);
                              }}
                              className="rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 flex-1 gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض التفاصيل</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCase(c);
                                setIsEditModalOpen(true);
                              }}
                              className="h-8 px-2.5 rounded-lg text-blue-600 hover:bg-blue-50 border-blue-200 text-xs font-bold gap-1"
                              title="تعديل الحالة (Admin)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCase(c.id, c.name)}
                              className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-50 border-red-200 text-xs font-bold gap-1"
                              title="حذف الحالة (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </Button>
                          </CardFooter>
                        ) : (
                          /* CLIENT CARD FOOTER (View Details Only + WhatsApp Inquiry) */
                          <CardFooter className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCaseForDetail(c);
                                setIsDetailModalOpen(true);
                              }}
                              className="rounded-xl text-xs font-bold text-teal-900 bg-teal-50/60 hover:bg-teal-100/80 border-teal-200 flex-1 gap-1.5 py-4 transition"
                            >
                              <Eye className="w-4 h-4 text-teal-600" />
                              <span>عرض تفاصيل البرنامج التأهيلي</span>
                            </Button>

                            <a
                              href={`https://wa.me/201275829322?text=${encodeURIComponent(`مرحباً دكتور، أود الاستفسار عن تفاصيل الحالة: ${c.name} (${c.injuryType})`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-emerald-600 transition shadow-sm"
                              title="استفسار عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 2: EXERCISES SHOWCASE (Admin vs Client)
              ══════════════════════════════════════════════ */}
          {activeMainTab === "exercises" && (
            <div className="space-y-6">
              {isLoadingExercises ? (
                <div className="text-center py-16 space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">جاري جلب مكتبة التمارين المعتمدة...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExercises.map((ex) => (
                    <Card
                      key={ex.id}
                      className="rounded-3xl border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white overflow-hidden flex flex-col justify-between group"
                    >
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {ex.region === "LOWER" ? "الطرف السفلي" : ex.region === "UPPER" ? "الطرف العلوي" : "الجذع والعمود الفقري"}
                          </Badge>

                          {ex.isIsometric && (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">
                              انقباض ثابت {ex.isometricAngle ? `${ex.isometricAngle}°` : ""}
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {ex.nameAr}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono text-slate-500">
                          {ex.nameEn}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="px-5 pb-4 space-y-2 text-xs text-slate-600">
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {ex.instructions || "تمرين معتمد في بروتوكولات التأهيل الحركي والتقوية السريرية."}
                        </p>
                      </CardContent>

                      <CardFooter className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExercise(ex);
                            setIsExerciseDetailOpen(true);
                          }}
                          className="rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-300 flex-1 gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>طريقة الأداء وفيديو الشرح</span>
                        </Button>

                        {/* Admin delete exercise button */}
                        {effectiveIsAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("هل تريد حذف هذا التمرين؟")) {
                                setExercises(exercises.filter((item) => item.id !== ex.id));
                              }
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50"
                            title="حذف التمرين (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── MODAL: COMPREHENSIVE CASE DETAIL VIEW (Client & Admin) ── */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl rounded-3xl bg-white p-6 max-h-[85vh] overflow-y-auto">
            {selectedCaseForDetail && (
              <div className="space-y-6 text-start">
                <DialogHeader className="text-start border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                      {getPhaseLabel(selectedCaseForDetail.rehabPrograms?.[0]?.phase || "ACUTE").ar}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {selectedCaseForDetail.injuredSide === "RIGHT" ? "الطرف الأيمن" : selectedCaseForDetail.injuredSide === "LEFT" ? "الطرف الأيسر" : "الطرفين"}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-black text-slate-900 mt-2">
                    {selectedCaseForDetail.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-emerald-700 font-bold">
                    نوع الإصابة السريرية: {selectedCaseForDetail.injuryType}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-emerald-600" />
                      <span>تفاصيل البرنامج التأهيلي النشط:</span>
                    </h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {selectedCaseForDetail.notes || "يتم تطبيق بروتوكول التقوية واستعادة المدى الحركي وفقاً لمعايير Revive السريرية."}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                    <h4 className="font-bold text-emerald-900 text-xs">
                      إجراءات المتابعة والتواصل:
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      يمكنك حجز جلسة استشارة أونلاين أو التواصل المباشر مع أخصائي التأهيل عبر الواتساب للاستفسار عن هذه الحالة.
                    </p>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="rounded-xl"
                  >
                    إغلاق
                  </Button>

                  <a
                    href={`https://wa.me/201275829322?text=${encodeURIComponent(`مرحباً دكتور، أود الاستفسار بخصوص الحالة: ${selectedCaseForDetail.name} (${selectedCaseForDetail.injuryType})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل بخصوص الحالة عبر واتساب</span>
                  </a>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MODAL: ADMIN EDIT CASE ── */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white p-6">
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                <span>تعديل بيانات الحالة السريرية (Admin)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                خاص بالمدير: تحديث الاسم، نوع الإصابة، أو الملاحظات
              </DialogDescription>
            </DialogHeader>

            {editingCase && (
              <form onSubmit={handleUpdateCase} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">اسم المريض</Label>
                  <Input
                    required
                    value={editingCase.name}
                    onChange={(e) => setEditingCase({ ...editingCase, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع الإصابة</Label>
                  <Input
                    required
                    value={editingCase.injuryType}
                    onChange={(e) => setEditingCase({ ...editingCase, injuryType: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رقم الهاتف</Label>
                  <Input
                    value={editingCase.phone || ""}
                    onChange={(e) => setEditingCase({ ...editingCase, phone: e.target.value })}
                    className="rounded-xl font-mono text-end"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الملاحظات السريرية</Label>
                  <Textarea
                    rows={3}
                    value={editingCase.notes || ""}
                    onChange={(e) => setEditingCase({ ...editingCase, notes: e.target.value })}
                    className="rounded-xl resize-none"
                  />
                </div>

                <DialogFooter className="gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingCase}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                  >
                    {isSavingCase ? "جاري الحفظ..." : "حفظ التعديل"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MODAL: ADMIN ADD NEW CASE ── */}
        <Dialog open={isAddCaseModalOpen} onOpenChange={setIsAddCaseModalOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white p-6">
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>إضافة حالة مريض جديدة (Admin)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                تسجيل حالة سريرية جديدة وإدراجها في المنظومة الحية
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCase} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اسم المريض الكامل *</Label>
                <Input
                  required
                  placeholder="مثال: كابتن محمد عبد الرحمن"
                  value={newCaseForm.name}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">نوع الإصابة السريرية *</Label>
                <Input
                  required
                  placeholder="مثال: ACL + Meniscus Repair"
                  value={newCaseForm.injuryType}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, injuryType: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الجانب المصاب</Label>
                  <select
                    value={newCaseForm.injuredSide}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, injuredSide: e.target.value as any })}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="RIGHT">أيمن (Right)</option>
                    <option value="LEFT">أيسر (Left)</option>
                    <option value="BILATERAL">الطرفين (Bilateral)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">المرحلة التأهيلية</Label>
                  <select
                    value={newCaseForm.rehabPhase}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, rehabPhase: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="ACUTE">الحادة (Acute)</option>
                    <option value="RESTORE_ROM">استعادة المدى الحركي (ROM)</option>
                    <option value="STRENGTH">التقوية العضلية (Strength)</option>
                    <option value="FUNCTIONAL">الوظيفية (Functional)</option>
                    <option value="RETURN_TO_SPORT">العودة للملعب (RTP)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">رقم الهاتف / الواتساب</Label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={newCaseForm.phone}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, phone: e.target.value })}
                  className="rounded-xl font-mono text-end"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ملاحظات الطبيب المعالج</Label>
                <Textarea
                  rows={3}
                  placeholder="تاريخ الإصابة، توصيات الجراح، قياسات العجز المبدئية..."
                  value={newCaseForm.notes}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, notes: e.target.value })}
                  className="rounded-xl resize-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddCaseModalOpen(false)}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingCase}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  {isSavingCase ? "جاري الحفظ..." : "إضافة الحالة للمنظومة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── MODAL: EXERCISE DETAIL & VIDEO (Client & Admin) ── */}
        <Dialog open={isExerciseDetailOpen} onOpenChange={setIsExerciseDetailOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white p-6">
            {selectedExercise && (
              <div className="space-y-5 text-start">
                <DialogHeader className="text-start border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {selectedExercise.region}
                    </Badge>
                    {selectedExercise.isIsometric && (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                        زاوية {selectedExercise.isometricAngle}°
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    {selectedExercise.nameAr}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono text-slate-500">
                    {selectedExercise.nameEn}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs text-slate-600">
                  <h4 className="font-bold text-slate-900 text-xs">تعليمات الأداء السريري:</h4>
                  <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed text-slate-700">
                    {selectedExercise.instructions || "الحفاظ على استقامة العمود الفقري والتركيز على الانقباض العضلي المستهدف."}
                  </p>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExerciseDetailOpen(false)}
                    className="rounded-xl"
                  >
                    إغلاق
                  </Button>

                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise.youtubeSearch || selectedExercise.nameEn)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md shadow-red-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>مشاهدة فيديو الأداء على YouTube</span>
                  </a>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── MODAL: ADMIN ADD EXERCISE ── */}
        <Dialog open={isAddExerciseModalOpen} onOpenChange={setIsAddExerciseModalOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white p-6">
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span>إضافة تمرين سريري جديد (Admin)</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                خاص بالمدير: إضافة تمرين إلى دليل التمارين المعتمدة
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateExercise} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">اسم التمرين بالعربية *</Label>
                <Input
                  required
                  placeholder="مثال: سكوات أحادي على منصة مائلة"
                  value={newExerciseForm.nameAr}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, nameAr: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">الاسم بالإنجليزي</Label>
                <Input
                  placeholder="مثال: Decline Single Leg Squat"
                  value={newExerciseForm.nameEn}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, nameEn: e.target.value })}
                  className="rounded-xl font-sans"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">المنطقة</Label>
                  <select
                    value={newExerciseForm.region}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, region: e.target.value as any })}
                    className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="LOWER">الطرف السفلي</option>
                    <option value="UPPER">الطرف العلوي</option>
                    <option value="CORE">الجذع والعمود الفقري</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الفئة العضلية</Label>
                  <Input
                    placeholder="Quadriceps, Hamstrings..."
                    value={newExerciseForm.category}
                    onChange={(e) => setNewExerciseForm({ ...newExerciseForm, category: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">تعليمات الأداء</Label>
                <Textarea
                  rows={3}
                  placeholder="عدد المجموعات والتكرارات وزمن الراحة..."
                  value={newExerciseForm.instructions}
                  onChange={(e) => setNewExerciseForm({ ...newExerciseForm, instructions: e.target.value })}
                  className="rounded-xl resize-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddExerciseModalOpen(false)}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  حفظ التمرين
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
