"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  ExternalLink,
  MessageCircle,
  UserPlus,
  Youtube,
  Eye,
  RotateCcw,
  Activity,
  Shield,
  Flame,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Clock,
  Layers,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { cn, getRegionLabel, truncate, generateWhatsAppShareLink } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// --- TYPES ---
export type ExerciseRegion = "UPPER" | "LOWER" | "CORE" | "FULL_BODY";

export interface Exercise {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  instructions?: string | null;
  region: ExerciseRegion;
  category: string;
  isIsometric: boolean;
  isometricAngle?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  youtubeSearch?: string | null;
  isCustom: boolean;
  createdById?: string | null;
  createdAt: string | Date;
}

interface Patient {
  id: string;
  name: string;
  injuryType: string;
  phone?: string | null;
  status: string;
}

const COMMON_CATEGORIES = [
  "Quadriceps",
  "Hamstring",
  "Calf",
  "Hip",
  "Shoulder",
  "Rotator Cuff",
  "Chest",
  "Biceps",
  "Triceps",
  "Forearm",
  "Core Stability",
  "Abdominals",
  "Anti-Rotation",
  "Back Extension",
  "Mobility",
  "Balance",
  "Plyometric",
];

const STANDARD_ISOMETRIC_ANGLES = [0, 30, 45, 60, 90];

export default function ExercisesPage() {
  const { isAdmin } = useAuth();

  // --- STATE: Data ---
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE: Filters ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isIsometricOnly, setIsIsometricOnly] = useState<boolean>(false);
  const [selectedAngle, setSelectedAngle] = useState<string>("ALL");
  const [customAngleInput, setCustomAngleInput] = useState<string>("");

  // --- STATE: Pagination ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  // --- STATE: Dialogs ---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [isAddToPatientDialogOpen, setIsAddToPatientDialogOpen] = useState<boolean>(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  // --- STATE: Add Custom Exercise Form ---
  const [newExercise, setNewExercise] = useState({
    nameAr: "",
    nameEn: "",
    region: "LOWER" as ExerciseRegion,
    category: "Quadriceps",
    customCategory: "",
    isIsometric: false,
    isometricAngleType: "0", // "0", "30", "45", "60", "90", or "CUSTOM"
    customAngle: "",
    instructions: "",
    videoUrl: "",
    youtubeSearch: "",
  });
  const [isSubmittingExercise, setIsSubmittingExercise] = useState<boolean>(false);
  const [addExerciseError, setAddExerciseError] = useState<string | null>(null);

  // --- STATE: Add to Patient Form ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [prescriptionSets, setPrescriptionSets] = useState<number>(3);
  const [prescriptionReps, setPrescriptionReps] = useState<number>(10);
  const [prescriptionHoldSec, setPrescriptionHoldSec] = useState<string>("5");
  const [prescriptionRestSec, setPrescriptionRestSec] = useState<string>("60");
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>("");
  const [isPrescribing, setIsPrescribing] = useState<boolean>(false);
  const [prescribeSuccessMessage, setPrescribeSuccessMessage] = useState<string | null>(null);
  const [prescribeError, setPrescribeError] = useState<string | null>(null);

  // --- FETCH EXERCISES ---
  const fetchExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (selectedRegion !== "ALL") {
        params.set("region", selectedRegion);
      }
      if (selectedCategory !== "ALL") {
        params.set("category", selectedCategory);
      }
      if (isIsometricOnly) {
        params.set("isIsometric", "true");
        if (selectedAngle !== "ALL") {
          if (selectedAngle === "CUSTOM" && customAngleInput) {
            params.set("angle", customAngleInput);
          } else if (selectedAngle !== "CUSTOM") {
            params.set("angle", selectedAngle);
          }
        }
      }

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (!res.ok) {
        throw new Error("فشل في تحميل قائمة التمارين");
      }
      const data: Exercise[] = await res.json();
      setExercises(data);
      setCurrentPage(1); // Reset to page 1 on new filter results
    } catch (err: unknown) {
      console.error("Error fetching exercises:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRegion, selectedCategory, isIsometricOnly, selectedAngle, customAngleInput]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // --- FETCH PATIENTS (FOR "ADD TO PROGRAM" DIALOG) ---
  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data: Patient[] = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // --- DERIVED LIST OF CATEGORIES ---
  const availableCategories = useMemo(() => {
    const categoriesFromData = exercises.map((e) => e.category).filter(Boolean);
    const set = new Set([...COMMON_CATEGORIES, ...categoriesFromData]);
    return Array.from(set).sort();
  }, [exercises]);

  // --- ACTIVE FILTERS COUNT ---
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedRegion !== "ALL") count++;
    if (selectedCategory !== "ALL") count++;
    if (isIsometricOnly) count++;
    if (selectedAngle !== "ALL") count++;
    return count;
  }, [searchQuery, selectedRegion, selectedCategory, isIsometricOnly, selectedAngle]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedRegion("ALL");
    setSelectedCategory("ALL");
    setIsIsometricOnly(false);
    setSelectedAngle("ALL");
    setCustomAngleInput("");
  };

  // --- PAGINATION CALCULATIONS ---
  const totalPages = Math.max(1, Math.ceil(exercises.length / pageSize));
  const paginatedExercises = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return exercises.slice(start, start + pageSize);
  }, [exercises, currentPage, pageSize]);

  // --- ACTION: ADD CUSTOM EXERCISE SUBMISSION ---
  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddExerciseError(null);

    if (!newExercise.nameAr.trim() || !newExercise.nameEn.trim()) {
      setAddExerciseError("يرجى إدخال اسم التمرين بالعربية والإنجليزية");
      return;
    }

    const categoryToSave =
      newExercise.category === "CUSTOM"
        ? newExercise.customCategory.trim()
        : newExercise.category;

    if (!categoryToSave) {
      setAddExerciseError("يرجى تحديد أو إدخال تصنيف التمرين");
      return;
    }

    let calculatedAngle: number | null = null;
    if (newExercise.isIsometric) {
      if (newExercise.isometricAngleType === "CUSTOM") {
        calculatedAngle = newExercise.customAngle ? parseFloat(newExercise.customAngle) : null;
      } else {
        calculatedAngle = parseFloat(newExercise.isometricAngleType);
      }
    }

    setIsSubmittingExercise(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: newExercise.nameAr.trim(),
          nameEn: newExercise.nameEn.trim(),
          region: newExercise.region,
          category: categoryToSave,
          isIsometric: newExercise.isIsometric,
          isometricAngle: calculatedAngle,
          instructions: newExercise.instructions.trim() || null,
          videoUrl: newExercise.videoUrl.trim() || null,
          youtubeSearch:
            newExercise.youtubeSearch.trim() ||
            `${newExercise.nameEn} exercise physical therapy`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل في حفظ التمرين");
      }

      // Reset form and close dialog
      setNewExercise({
        nameAr: "",
        nameEn: "",
        region: "LOWER",
        category: "Quadriceps",
        customCategory: "",
        isIsometric: false,
        isometricAngleType: "0",
        customAngle: "",
        instructions: "",
        videoUrl: "",
        youtubeSearch: "",
      });
      setIsAddDialogOpen(false);
      await fetchExercises();
    } catch (err: unknown) {
      console.error("Error creating custom exercise:", err);
      setAddExerciseError(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmittingExercise(false);
    }
  };

  // --- ACTION: PRESCRIBE EXERCISE TO PATIENT ---
  const handleOpenAddToPatient = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setPrescribeSuccessMessage(null);
    setPrescribeError(null);
    setPrescriptionSets(3);
    setPrescriptionReps(10);
    setPrescriptionHoldSec(exercise.isIsometric ? "10" : "0");
    setPrescriptionRestSec("60");
    setPrescriptionNotes("");
    setIsAddToPatientDialogOpen(true);
    fetchPatients();
  };

  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !activeExercise) {
      setPrescribeError("يرجى اختيار مريض أولاً");
      return;
    }

    setIsPrescribing(true);
    setPrescribeError(null);
    setPrescribeSuccessMessage(null);

    try {
      const res = await fetch(`/api/cases/${selectedPatientId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: activeExercise.id,
          sets: prescriptionSets,
          reps: prescriptionReps,
          holdSeconds: prescriptionHoldSec ? parseInt(prescriptionHoldSec, 10) : null,
          restSeconds: prescriptionRestSec ? parseInt(prescriptionRestSec, 10) : null,
          notes: prescriptionNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error("فشل في إضافة التمرين لبرنامج المريض");
      }

      setPrescribeSuccessMessage("تمت إضافة التمرين إلى برنامج المريض بنجاح!");
      setTimeout(() => {
        setIsAddToPatientDialogOpen(false);
        setPrescribeSuccessMessage(null);
      }, 1500);
    } catch (err: unknown) {
      console.error("Prescribe error:", err);
      setPrescribeError(err instanceof Error ? err.message : "حدث خطأ أثناء الإضافة");
    } finally {
      setIsPrescribing(false);
    }
  };

  // --- ACTION: SEND VIA WHATSAPP ---
  const handleShareWhatsApp = (exercise: Exercise) => {
    const regionInfo = getRegionLabel(exercise.region);
    const youtubeLink = exercise.youtubeSearch
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearch)}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.nameEn + " physical therapy exercise")}`;

    const text = `🏥 *Peak Motion — بطاقة تمرين تأهيلي*
────────────────────
📌 *اسم التمرين:* ${exercise.nameAr}
🔤 *الاسم بالإنجليزية:* ${exercise.nameEn}
🎯 *المنطقة:* ${regionInfo.ar} (${regionInfo.en})
🏷️ *التصنيف:* ${exercise.category}
${
  exercise.isIsometric
    ? `📐 *نوع التمرين:* أيزومترك (انقباض عضلي ثابت) ${
        exercise.isometricAngle !== null && exercise.isometricAngle !== undefined
          ? `عند زاوية ${exercise.isometricAngle}°`
          : ""
      }\n`
    : ""
}📝 *تعليمات الأداء:*
${exercise.instructions || "يرجى اتباع الجرعة والتعليمات المحددة من أخصائي العلاج الطبيعي بدقة."}

🎥 *رابط توضيحي على يوتيوب:*
${youtubeLink}
────────────────────
عيادة Peak Motion للعلاج الطبيعي والتأهيل الحركي`;

    const shareUrl = generateWhatsAppShareLink(text);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  // --- ANATOMICAL DIAGRAM THEME HELPER ---
  const getRegionTheme = (region: ExerciseRegion) => {
    switch (region) {
      case "UPPER":
        return {
          gradient: "from-blue-700 via-indigo-800 to-slate-900",
          accentColor: "text-blue-300",
          badgeColor: "bg-blue-500/20 text-blue-200 border-blue-400/30",
          icon: Shield,
          iconLabel: "الجزء العلوي • Upper Body",
          anatomyTag: "الكتف / المرفق / الصدر",
        };
      case "LOWER":
        return {
          gradient: "from-emerald-700 via-teal-800 to-slate-900",
          accentColor: "text-emerald-300",
          badgeColor: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
          icon: Activity,
          iconLabel: "الجزء السفلي • Lower Body",
          anatomyTag: "الركبة / الفخذ / الكاحل",
        };
      case "CORE":
        return {
          gradient: "from-amber-600 via-orange-800 to-slate-900",
          accentColor: "text-amber-300",
          badgeColor: "bg-amber-500/20 text-amber-200 border-amber-400/30",
          icon: Flame,
          iconLabel: "الجذع والعمود الفقري • Core",
          anatomyTag: "عضلات البطن / أسفل الظهر",
        };
      case "FULL_BODY":
      default:
        return {
          gradient: "from-purple-700 via-violet-900 to-slate-900",
          accentColor: "text-purple-300",
          badgeColor: "bg-purple-500/20 text-purple-200 border-purple-400/30",
          icon: Zap,
          iconLabel: "الجسم بالكامل • Full Body",
          anatomyTag: "سلسلة حركية شاملة",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      مكتبة التمارين
                    </h1>
                    <span className="text-xl sm:text-2xl font-light text-slate-400">
                      — Exercise Library
                    </span>
                    <Badge
                      variant="default"
                      className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1 font-bold text-xs"
                    >
                      {exercises.length} {exercises.length === 1 ? "تمرين" : "تمارين"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    دليل شامل للتمارين التأهيلية والحركية مع زوايا الأيزومترك وبروتوكولات العلاج الطبيعي
                  </p>
                </div>
              </div>
            </div>

            {/* Top Action Button (Admin Only) */}
            {isAdmin && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setAddExerciseError(null);
                    setIsAddDialogOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 h-11 px-5 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">إضافة تمرين مخصص</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTERS BAR
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5">
          {/* Top Filter Row: Search & Region Quick Pills */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-5">
              <Search className="w-5 h-5 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن تمرين (بالعربية، الإنجليزية، أو العضلة)..."
                className="ps-11 pe-4 h-11 bg-slate-50/70 border-slate-200 focus-visible:bg-white text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Region Filter Segmented Pills */}
            <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                المنطقة:
              </span>
              {[
                { key: "ALL", labelAr: "الكل", labelEn: "All" },
                { key: "UPPER", labelAr: "الجزء العلوي", labelEn: "Upper" },
                { key: "LOWER", labelAr: "السفلي", labelEn: "Lower" },
                { key: "CORE", labelAr: "الجذع", labelEn: "Core" },
                { key: "FULL_BODY", labelAr: "الجسم الكامل", labelEn: "Full Body" },
              ].map((reg) => {
                const isActive = selectedRegion === reg.key;
                return (
                  <button
                    key={reg.key}
                    type="button"
                    onClick={() => setSelectedRegion(reg.key)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {reg.labelAr}
                    <span className="opacity-60 ms-1 text-[10px]">({reg.labelEn})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Bottom Filter Row: Category & Isometric Toggle with Angle Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 shrink-0">التصنيف العضلي:</span>
              <div className="w-full sm:w-60">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50/70 border-slate-200">
                    <SelectValue placeholder="اختر التصنيف..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع التصنيفات (All Categories)</SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Isometric Toggle & Angles */}
            <div className="flex items-center gap-3 flex-wrap bg-slate-50/90 border border-slate-200/80 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <Switch
                  id="isometric-mode"
                  checked={isIsometricOnly}
                  onCheckedChange={(checked) => {
                    setIsIsometricOnly(checked);
                    if (!checked) {
                      setSelectedAngle("ALL");
                      setCustomAngleInput("");
                    }
                  }}
                />
                <Label
                  htmlFor="isometric-mode"
                  className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                >
                  تمارين الأيزومترك (Isometric)
                </Label>
              </div>

              {/* Angles if Isometric is checked */}
              {isIsometricOnly && (
                <div className="flex items-center gap-1.5 flex-wrap border-s border-slate-300 ps-3 animate-fade-in">
                  <span className="text-[11px] font-medium text-slate-500">الزاوية:</span>
                  {[
                    { key: "ALL", label: "الكل" },
                    { key: "0", label: "0°" },
                    { key: "30", label: "30°" },
                    { key: "45", label: "45°" },
                    { key: "60", label: "60°" },
                    { key: "90", label: "90°" },
                    { key: "CUSTOM", label: "مخصص" },
                  ].map((ang) => (
                    <button
                      key={ang.key}
                      type="button"
                      onClick={() => setSelectedAngle(ang.key)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-bold transition-all",
                        selectedAngle === ang.key
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {ang.label}
                    </button>
                  ))}

                  {selectedAngle === "CUSTOM" && (
                    <div className="flex items-center gap-1 ms-1">
                      <Input
                        type="number"
                        placeholder="زاوية °"
                        value={customAngleInput}
                        onChange={(e) => setCustomAngleInput(e.target.value)}
                        className="w-16 h-8 text-xs px-2"
                        min="0"
                        max="180"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. EXERCISE GRID / SKELETONS / EMPTY STATE
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Error message banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExercises}
              className="text-xs border-red-300 hover:bg-red-100 text-red-800"
            >
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* LOADING SKELETONS */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 animate-pulse"
              >
                <div className="h-40 bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-full" />
                  <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                </div>
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div className="h-9 bg-slate-200 rounded-lg" />
                  <div className="h-9 bg-slate-200 rounded-lg" />
                  <div className="h-9 bg-slate-200 rounded-lg" />
                  <div className="h-9 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : exercises.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 opacity-75" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              لا توجد تمارين تطابق معايير البحث
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              جرّب تغيير كلمات البحث، أو إلغاء تحديد بعض الفلاتر لعرض مزيد من التمارين في المكتبة.
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={handleResetFilters} className="text-xs">
                  <RotateCcw className="w-3.5 h-3.5 me-1.5" />
                  إعادة ضبط جميع الفلاتر
                </Button>
              )}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 me-1.5" />
                إضافة تمرين جديد
              </Button>
            </div>
          </div>
        ) : (
          /* EXERCISE GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedExercises.map((exercise) => {
              const theme = getRegionTheme(exercise.region);
              const RegionIcon = theme.icon;
              const regionMeta = getRegionLabel(exercise.region);

              return (
                <Card
                  key={exercise.id}
                  className="group rounded-2xl border border-slate-200/90 hover:border-emerald-300 bg-white shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Anatomical Diagram Area */}
                    <div
                      className={cn(
                        "relative h-44 bg-gradient-to-br p-4 flex flex-col justify-between overflow-hidden",
                        theme.gradient
                      )}
                    >
                      {/* Decorative anatomical grid lines / circles */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="absolute -end-10 -bottom-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

                      {/* Top Badges over diagram */}
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        {/* Region Badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
                            theme.badgeColor
                          )}
                        >
                          <RegionIcon className="w-3.5 h-3.5" />
                          <span>{regionMeta.ar}</span>
                        </span>

                        {/* Isometric Angle Badge */}
                        {exercise.isIsometric && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-sm border border-emerald-400">
                            <span>📐 أيزومترك</span>
                            {exercise.isometricAngle !== null && exercise.isometricAngle !== undefined ? (
                              <span>{exercise.isometricAngle}°</span>
                            ) : null}
                          </span>
                        )}
                      </div>

                      {/* Center Graphic / Anatomical Representation */}
                      <div className="relative z-10 flex items-center justify-center my-auto">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <RegionIcon className="w-8 h-8 opacity-90" />
                        </div>
                      </div>

                      {/* Bottom strip on diagram */}
                      <div className="relative z-10 flex items-center justify-between text-xs text-white/80">
                        <span className="text-[11px] font-medium tracking-wide">
                          {theme.anatomyTag}
                        </span>
                        {exercise.isCustom && (
                          <span className="text-[10px] bg-amber-500/80 text-white px-2 py-0.5 rounded-md font-bold">
                            تمرين مخصص
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <CardHeader className="p-5 pb-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {exercise.nameAr}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 font-mono tracking-tight" dir="ltr">
                        {exercise.nameEn}
                      </p>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium"
                        >
                          {exercise.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-slate-500 border-slate-200 text-[11px]"
                        >
                          {regionMeta.en}
                        </Badge>
                        {exercise.isIsometric && (
                          <Badge
                            variant="default"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                          >
                            ثابت (Isometric)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    {/* Instructions preview */}
                    <CardContent className="px-5 pb-4 pt-1">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {exercise.instructions || "لا توجد تعليمات تفصيلية مسجلة لهذا التمرين."}
                      </p>
                    </CardContent>
                  </div>

                  {/* Card Action Buttons (Footer) */}
                  <div className="p-4 pt-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {/* 1. YouTube Search Link */}
                    <a
                      href={
                        exercise.youtubeSearch
                          ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearch)}`
                          : `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.nameEn + " physiotherapy exercise")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-xs"
                      title="بحث ومشاهدة على يوتيوب"
                    >
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span>يوتيوب</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ms-0.5" />
                    </a>

                    {/* 2. Add to Patient Program */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenAddToPatient(exercise)}
                      className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إضافة لمريض</span>
                    </Button>

                    {/* 3. Send via WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(exercise)}
                      className="h-9 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>واتساب</span>
                    </Button>

                    {/* 4. View Details */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveExercise(exercise);
                        setIsDetailsDialogOpen(true);
                      }}
                      className="h-9 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-1.5 shadow-xs"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>تفاصيل</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. PAGINATION CONTROLS
        ───────────────────────────────────────────────────────────── */}
        {!isLoading && exercises.length > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Summary text */}
            <div className="text-xs text-slate-500">
              عرض{" "}
              <span className="font-bold text-slate-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              إلى{" "}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * pageSize, exercises.length)}
              </span>{" "}
              من أصل <span className="font-bold text-slate-900">{exercises.length}</span> تمرين
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs px-2.5 gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  // Show current, first, last, or adjacent pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="text-xs text-slate-400 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs px-2.5 gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Per page size selector */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value={9}>9</option>
                <option value={18}>18</option>
                <option value={27}>27</option>
                <option value={exercises.length}>الكل ({exercises.length})</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DIALOG: ADD CUSTOM EXERCISE
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  إضافة تمرين مخصص جديد
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  أضف تمريناً علاجياً جديداً إلى مكتبة العيادة ليتم استخدامه في خطط وبرامج المرضى
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {addExerciseError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addExerciseError}</span>
            </div>
          )}

          <form onSubmit={handleCreateExercise} className="space-y-4 pt-2">
            {/* Names row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-xs font-bold">
                  اسم التمرين (بالعربية) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nameAr"
                  value={newExercise.nameAr}
                  onChange={(e) =>
                    setNewExercise((prev) => ({ ...prev, nameAr: e.target.value }))
                  }
                  placeholder="مثال: تمديد الركبة ضد المقاومة"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nameEn" className="text-xs font-bold">
                  اسم التمرين (بالإنجليزية) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="nameEn"
                  value={newExercise.nameEn}
                  onChange={(e) =>
                    setNewExercise((prev) => ({ ...prev, nameEn: e.target.value }))
                  }
                  placeholder="e.g. Resisted Knee Extension"
                  dir="ltr"
                  required
                  className="text-sm font-mono"
                />
              </div>
            </div>

            {/* Region & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  المنطقة التشريحية <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={newExercise.region}
                  onValueChange={(val: ExerciseRegion) =>
                    setNewExercise((prev) => ({ ...prev, region: val }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOWER">الجزء السفلي — Lower Body</SelectItem>
                    <SelectItem value="UPPER">الجزء العلوي — Upper Body</SelectItem>
                    <SelectItem value="CORE">الجذع — Core</SelectItem>
                    <SelectItem value="FULL_BODY">الجسم بالكامل — Full Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  التصنيف / العضلة المستهدفة <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={newExercise.category}
                  onValueChange={(val) =>
                    setNewExercise((prev) => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="CUSTOM">+ تصنيف مخصص آخر...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Category Input if selected */}
            {newExercise.category === "CUSTOM" && (
              <div className="space-y-1.5 animate-fade-in">
                <Label htmlFor="customCategory" className="text-xs font-bold">
                  اسم التصنيف المخصص
                </Label>
                <Input
                  id="customCategory"
                  value={newExercise.customCategory}
                  onChange={(e) =>
                    setNewExercise((prev) => ({ ...prev, customCategory: e.target.value }))
                  }
                  placeholder="مثال: Scapular Stabilizers"
                  className="text-sm"
                />
              </div>
            )}

            {/* Isometric Toggle & Angle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isIsometric-toggle" className="text-sm font-bold text-slate-800">
                    تمرين أيزومترك (انقباض عضلي ثابت — Isometric)
                  </Label>
                  <p className="text-xs text-slate-500">
                    انقباض العضلة دون تغيير في طولها أو حركة المفصل
                  </p>
                </div>
                <Switch
                  id="isIsometric-toggle"
                  checked={newExercise.isIsometric}
                  onCheckedChange={(checked) =>
                    setNewExercise((prev) => ({ ...prev, isIsometric: checked }))
                  }
                />
              </div>

              {newExercise.isIsometric && (
                <div className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
                  <Label className="text-xs font-bold text-slate-700">
                    زاوية الأيزومترك (Isometric Joint Angle)
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {STANDARD_ISOMETRIC_ANGLES.map((angle) => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() =>
                          setNewExercise((prev) => ({
                            ...prev,
                            isometricAngleType: String(angle),
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                          newExercise.isometricAngleType === String(angle)
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {angle}°
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setNewExercise((prev) => ({
                          ...prev,
                          isometricAngleType: "CUSTOM",
                        }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        newExercise.isometricAngleType === "CUSTOM"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      )}
                    >
                      زاوية مخصصة
                    </button>
                  </div>

                  {newExercise.isometricAngleType === "CUSTOM" && (
                    <div className="pt-1 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="180"
                        value={newExercise.customAngle}
                        onChange={(e) =>
                          setNewExercise((prev) => ({
                            ...prev,
                            customAngle: e.target.value,
                          }))
                        }
                        placeholder="أدخل الزاوية بالدرجات (مثال: 75)"
                        className="w-48 text-sm"
                      />
                      <span className="text-xs text-slate-500 font-bold">درجة</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <Label htmlFor="instructions" className="text-xs font-bold">
                تعليمات وخطوات التمرين (Instructions)
              </Label>
              <Textarea
                id="instructions"
                rows={3}
                value={newExercise.instructions}
                onChange={(e) =>
                  setNewExercise((prev) => ({ ...prev, instructions: e.target.value }))
                }
                placeholder="اشرح وضعية البداية، مسار الحركة، وضعية التنفس، وفترة الثبات بدقة..."
                className="text-sm"
              />
            </div>

            {/* Video & YouTube Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="videoUrl" className="text-xs font-bold">
                  رابط فيديو توضيحي (اختياري)
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={newExercise.videoUrl}
                  onChange={(e) =>
                    setNewExercise((prev) => ({ ...prev, videoUrl: e.target.value }))
                  }
                  placeholder="https://youtu.be/..."
                  dir="ltr"
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="youtubeSearch" className="text-xs font-bold">
                  كلمات بحث يوتيوب (YouTube Search Query)
                </Label>
                <Input
                  id="youtubeSearch"
                  value={newExercise.youtubeSearch}
                  onChange={(e) =>
                    setNewExercise((prev) => ({
                      ...prev,
                      youtubeSearch: e.target.value,
                    }))
                  }
                  placeholder="e.g. quad set exercise physical therapy"
                  dir="ltr"
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmittingExercise}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingExercise}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              >
                {isSubmittingExercise ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <span>حفظ التمرين</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          6. DIALOG: ADD EXERCISE TO PATIENT PROGRAM
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isAddToPatientDialogOpen} onOpenChange={setIsAddToPatientDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  إضافة التمرين لبرنامج مريض
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  وصف التمرين وجرعته التأهيلية (المجموعات والتكرارات) للمريض المحدد
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Exercise quick banner */}
          {activeExercise && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {activeExercise.nameAr}
                </h4>
                <p className="text-xs text-slate-500 font-mono" dir="ltr">
                  {activeExercise.nameEn}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {activeExercise.category}
                </Badge>
                {activeExercise.isIsometric && (
                  <Badge variant="default" className="text-xs bg-emerald-600 text-white">
                    {activeExercise.isometricAngle !== null
                      ? `${activeExercise.isometricAngle}°`
                      : "أيزومترك"}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {prescribeSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{prescribeSuccessMessage}</span>
            </div>
          )}
          {prescribeError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{prescribeError}</span>
            </div>
          )}

          <form onSubmit={handlePrescribeSubmit} className="space-y-4 pt-1">
            {/* Patient Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                اختر المريض <span className="text-rose-500">*</span>
              </Label>
              {isLoadingPatients ? (
                <div className="h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  جاري تحميل قائمة المرضى...
                </div>
              ) : patients.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
                  لا يوجد مرضى مسجلين حالياً. يرجى إضافة حالة مريض أولاً من صفحة الحالات.
                </div>
              ) : (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="اختر مريضاً من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ({p.injuryType || "بدون تشخيص"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Prescription parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sets" className="text-xs font-bold">
                  المجموعات (Sets)
                </Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  max="10"
                  value={prescriptionSets}
                  onChange={(e) => setPrescriptionSets(Number(e.target.value))}
                  className="text-center font-bold text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reps" className="text-xs font-bold">
                  التكرار (Reps)
                </Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  max="100"
                  value={prescriptionReps}
                  onChange={(e) => setPrescriptionReps(Number(e.target.value))}
                  className="text-center font-bold text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="holdSec" className="text-xs font-bold">
                  الثبات (ثوانٍ)
                </Label>
                <Input
                  id="holdSec"
                  type="number"
                  min="0"
                  max="180"
                  value={prescriptionHoldSec}
                  onChange={(e) => setPrescriptionHoldSec(e.target.value)}
                  placeholder="0"
                  className="text-center font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="restSec" className="text-xs font-bold">
                  الراحة (ثوانٍ)
                </Label>
                <Input
                  id="restSec"
                  type="number"
                  min="0"
                  max="300"
                  value={prescriptionRestSec}
                  onChange={(e) => setPrescriptionRestSec(e.target.value)}
                  className="text-center font-bold text-sm"
                />
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="prescribeNotes" className="text-xs font-bold">
                ملاحظات أو توجيهات خاصة للمريض
              </Label>
              <Textarea
                id="prescribeNotes"
                rows={2}
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                placeholder="مثال: تجنب الألم الحاد، حافظ على استقامة الحوض أثناء الأداء..."
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddToPatientDialogOpen(false)}
                disabled={isPrescribing}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isPrescribing || patients.length === 0 || !selectedPatientId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              >
                {isPrescribing ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الإضافة...</span>
                  </div>
                ) : (
                  <span>تأكيد الإضافة</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          7. DIALOG: VIEW EXERCISE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {activeExercise && (
            <div>
              {/* Diagram Header Banner */}
              {(() => {
                const theme = getRegionTheme(activeExercise.region);
                const RegionIcon = theme.icon;
                const regionMeta = getRegionLabel(activeExercise.region);

                return (
                  <div
                    className={cn(
                      "p-6 text-white bg-gradient-to-br relative overflow-hidden flex flex-col justify-between h-48",
                      theme.gradient
                    )}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
                          theme.badgeColor
                        )}
                      >
                        <RegionIcon className="w-3.5 h-3.5" />
                        <span>{regionMeta.ar}</span>
                      </span>

                      {activeExercise.isIsometric && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white border border-emerald-400">
                          <span>📐 أيزومترك</span>
                          {activeExercise.isometricAngle !== null &&
                          activeExercise.isometricAngle !== undefined ? (
                            <span>عند {activeExercise.isometricAngle}°</span>
                          ) : null}
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold tracking-tight mb-1">
                        {activeExercise.nameAr}
                      </h2>
                      <p className="text-sm text-slate-300 font-mono" dir="ltr">
                        {activeExercise.nameEn}
                      </p>
                    </div>

                    <div className="absolute end-4 -bottom-4 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  </div>
                );
              })()}

              {/* Details Content */}
              <div className="p-6 space-y-6">
                {/* Meta Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">
                      المنطقة
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {getRegionLabel(activeExercise.region).ar}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">
                      التصنيف
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {activeExercise.category}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">
                      نوع الانقباض
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {activeExercise.isIsometric ? "أيزومترك (ثابت)" : "ديناميكي"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">
                      الزاوية
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {activeExercise.isometricAngle !== null &&
                      activeExercise.isometricAngle !== undefined
                        ? `${activeExercise.isometricAngle}°`
                        : "حركي كامل"}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" />
                    تعليمات وأسلوب الأداء:
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeExercise.instructions || "لا توجد تعليمات مفصلة مسجلة لهذا التمرين."}
                  </div>
                </div>

                {/* External links */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {/* YouTube link */}
                  <a
                    href={
                      activeExercise.youtubeSearch
                        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(activeExercise.youtubeSearch)}`
                        : `https://www.youtube.com/results?search_query=${encodeURIComponent(activeExercise.nameEn + " physiotherapy exercise")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
                  >
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>مشاهدة شروحات التمرين على YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5 ms-1" />
                  </a>

                  {/* Direct video url if present */}
                  {activeExercise.videoUrl && (
                    <a
                      href={activeExercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <span>رابط الفيديو المرفق</span>
                      <ExternalLink className="w-3.5 h-3.5 ms-1" />
                    </a>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleShareWhatsApp(activeExercise)}
                    className="w-full sm:w-auto text-xs gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>مشاركة عبر واتساب</span>
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailsDialogOpen(false)}
                      className="w-full sm:w-auto text-xs"
                    >
                      إغلاق
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        handleOpenAddToPatient(activeExercise);
                      }}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إضافة لبرنامج مريض</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
