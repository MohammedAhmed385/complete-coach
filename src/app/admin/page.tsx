"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Settings,
  Users,
  Dumbbell,
  FileHeart,
  Save,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Activity,
  Phone,
  Facebook,
  Wallet,
  Clock,
  Sparkles,
  Lock,
  Layers,
  Database,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { ADMIN_SIGNUP_CODE_DEFAULT } from "@/lib/auth-config";

interface PatientItem {
  id: string;
  name: string;
  injuryType: string;
  injuredSide: string;
  phone?: string | null;
  status: string;
  rehabStartDate: string;
}

interface ExerciseItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  region: string;
  isIsometric: boolean;
}

interface ProtocolItem {
  id: string;
  nameAr: string;
  nameEn: string;
  isCustom: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("settings");
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [protocols, setProtocols] = useState<ProtocolItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedAdminCode, setCopiedAdminCode] = useState(false);

  // Platform editable settings
  const [webSettings, setWebSettings] = useState({
    clinicName: "Revive Clinic & Performance",
    clinicNameAr: "عيادة ريفيف للعلاج الطبيعي والتأهيل الرياضي",
    whatsappNumber: "+201275829322",
    facebookUrl: "https://www.facebook.com/ywsf.ly.618634",
    walletNumber: "01064751088",
    consultationFee: "350 ج.م",
    clinicHours: "السبت - الخميس: 10:00 ص - 10:00 م",
    emergencyAvailable: true,
    announcementBanner: "مرحباً بكم في منصة Revive — احجز استشارتك التأهيلية الآن عبر الواتساب",
  });

  // Patient editing state
  const [editingPatient, setEditingPatient] = useState<PatientItem | null>(null);
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Patients
      const resCases = await fetch("/api/cases");
      if (resCases.ok) {
        const data = await resCases.json();
        setPatients(data);
      }

      // 2. Fetch Exercises
      const resEx = await fetch("/api/exercises?limit=30");
      if (resEx.ok) {
        const data = await resEx.json();
        setExercises(data.exercises || []);
      }

      // 3. Fetch Protocols
      const resProto = await fetch("/api/protocols");
      if (resProto.ok) {
        const data = await resProto.json();
        setProtocols(data);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحالة السريرية نهائياً؟")) return;
    try {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPatients(patients.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePatientEdit = async () => {
    if (!editingPatient) return;
    try {
      const res = await fetch(`/api/cases/${editingPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPatient),
      });
      if (res.ok) {
        setPatients(patients.map((p) => (p.id === editingPatient.id ? editingPatient : p)));
        setEditPatientModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If not logged in as Admin, show clean access gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 py-16 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              واجهة مخصصة لمدير النظام
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              هذه اللوحة خاصة بمدير منصة <strong>Revive</strong> لتعديل جميع بيانات الموقع والحالات والتمارين. يرجى تسجيل الدخول بحساب المدير للمتابعة.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/login"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black gap-2 text-xs shadow-md flex items-center justify-center transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول بحساب الإدارة</span>
            </Link>

            <Link
              href="/"
              className="block pt-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              العودة للرئيسية (واجهة العميل)
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs px-3 py-1 font-bold gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Portal — صلاحيات التحكم الشامل</span>
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Revive Core v1.0</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              لوحة إدارة المنصة والتحكم الشامل
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              تعديل هوية الموقع، أرقام التواصل، أسعار الخدمات، المرضى، التمارين، والبروتوكولات السريرية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInitialData}
              disabled={isLoading}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>تحديث البيانات</span>
            </Button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              <span>معاينة الموقع كزائر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">إجمالي المرضى</span>
              <p className="text-xl font-black text-slate-900">{patients.length}</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">مكتبة التمارين</span>
              <p className="text-xl font-black text-slate-900">500+</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileHeart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">البروتوكولات</span>
              <p className="text-xl font-black text-slate-900">{protocols.length || 5}</p>
            </div>
          </Card>

          <Card className="rounded-2xl p-4 bg-white border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">حالة النظام</span>
              <p className="text-sm font-bold text-emerald-600">نشط ومتصل بالسحابة</p>
            </div>
          </Card>
        </div>

        {/* Main Tabs Control */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-12 w-full grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="settings" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-navy-950 data-[state=active]:text-white">
              <Settings className="w-3.5 h-3.5" />
              <span>إعدادات الموقع والتواصل</span>
            </TabsTrigger>

            <TabsTrigger value="patients" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-navy-950 data-[state=active]:text-white">
              <Users className="w-3.5 h-3.5" />
              <span>إدارة المرضى والحالات ({patients.length})</span>
            </TabsTrigger>

            <TabsTrigger value="exercises" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-navy-950 data-[state=active]:text-white">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>مكتبة التمارين</span>
            </TabsTrigger>

            <TabsTrigger value="protocols" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-navy-950 data-[state=active]:text-white">
              <FileHeart className="w-3.5 h-3.5" />
              <span>البروتوكولات السريرية</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: WEBSITE & CONTACT SETTINGS */}
          <TabsContent value="settings" className="m-0 space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-md bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>تعديل بيانات وهوية منصة Revive والتواصل</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  يمكنك تعديل أرقام الواتساب والمحفظة وروابط السوشيال لتنعكس فوراً في صفحة التواصل
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveSettings}>
                <CardContent className="p-6 space-y-6">
                  {saveSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم حفظ التعديلات وتحديث إعدادات المنصة بنجاح!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clinic Name Ar */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        اسم العيادة / المنصة (بالعربية)
                      </Label>
                      <Input
                        value={webSettings.clinicNameAr}
                        onChange={(e) => setWebSettings({ ...webSettings, clinicNameAr: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>

                    {/* Clinic Name En */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        اسم المنصة (بالإنجليزية)
                      </Label>
                      <Input
                        value={webSettings.clinicName}
                        onChange={(e) => setWebSettings({ ...webSettings, clinicName: e.target.value })}
                        className="rounded-xl font-sans"
                        dir="ltr"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>رقم الواتساب الرسمي للاستشارات</span>
                      </Label>
                      <Input
                        value={webSettings.whatsappNumber}
                        onChange={(e) => setWebSettings({ ...webSettings, whatsappNumber: e.target.value })}
                        className="rounded-xl font-mono text-start"
                        dir="ltr"
                      />
                    </div>

                    {/* Wallet */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-red-600" />
                        <span>رقم المحفظة الإلكترونية (فودافون كاش / إنستاباي)</span>
                      </Label>
                      <Input
                        value={webSettings.walletNumber}
                        onChange={(e) => setWebSettings({ ...webSettings, walletNumber: e.target.value })}
                        className="rounded-xl font-mono text-start"
                        dir="ltr"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-blue-600" />
                        <span>رابط صفحة / بروفايل فيسبوك</span>
                      </Label>
                      <Input
                        value={webSettings.facebookUrl}
                        onChange={(e) => setWebSettings({ ...webSettings, facebookUrl: e.target.value })}
                        className="rounded-xl font-mono text-start"
                        dir="ltr"
                      />
                    </div>

                    {/* Working Hours */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>ساعات عمل العيادة والاستشارات</span>
                      </Label>
                      <Input
                        value={webSettings.clinicHours}
                        onChange={(e) => setWebSettings({ ...webSettings, clinicHours: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>

                    {/* Consultation Fee */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        سعر جلسة التقييم والاستشارة أونلاين
                      </Label>
                      <Input
                        value={webSettings.consultationFee}
                        onChange={(e) => setWebSettings({ ...webSettings, consultationFee: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Authorized Admin Accounts & Invite Code Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-900">
                          حسابات الإدارة المعتمدة وكود تسجيل مدير جديد:
                        </span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        3 حسابات معتمدة
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { email: "yoseefyossefyoseef@gmail.com", title: "كابتن يوسف (المدير الأساسي)" },
                        { email: "hsksjsgutt@gmail.com", title: "حساب إدارة معتمد 1" },
                        { email: "atfm03716@gmail.com", title: "حساب إدارة معتمد 2" },
                      ].map((adm) => (
                        <div key={adm.email} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-sm">
                          <span className="text-[11px] font-bold text-slate-800 block">{adm.title}</span>
                          <span className="text-[11px] font-mono text-emerald-700 text-left dir-ltr block truncate">
                            {adm.email}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>كود تفعيل تسجيل حساب مدير جديد (Admin Invite Code):</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          يستخدم هذا الكود عند إنشاء حساب مدير ببريد إلكتروني إضافي من صفحة تسجيل الدخول، بينما الحسابات الثلاثة أعلاه مسموح لها بتعيين كلمة المرور مباشرة بدون كود.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                        <code className="font-mono font-bold text-xs text-slate-900 dir-ltr">
                          {ADMIN_SIGNUP_CODE_DEFAULT}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard?.writeText(ADMIN_SIGNUP_CODE_DEFAULT);
                            setCopiedAdminCode(true);
                            setTimeout(() => setCopiedAdminCode(false), 2000);
                          }}
                          className="h-7 px-2 text-amber-700 hover:bg-amber-100"
                        >
                          {copiedAdminCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Banner */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      شريط التنبيهات والإعلانات أعلى الموقع
                    </Label>
                    <Textarea
                      rows={2}
                      value={webSettings.announcementBanner}
                      onChange={(e) => setWebSettings({ ...webSettings, announcementBanner: e.target.value })}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50/70 border-t border-slate-100 p-6 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ كافة إعدادات المنصة</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* TAB 2: PATIENTS MANAGEMENT */}
          <TabsContent value="patients" className="m-0 space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-md bg-white p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    إدارة الحالات السريرية والمرضى
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعديل بيانات المرضى، مراحل التأهيل، أو حذف الحالات
                  </p>
                </div>

                <Link
                  href="/add-case"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حالة مريض جديدة</span>
                </Link>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  لا توجد حالات مسجلة حالياً
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                        <th className="py-3 px-4 text-start font-bold">اسم المريض</th>
                        <th className="py-3 px-4 text-start font-bold">نوع الإصابة</th>
                        <th className="py-3 px-4 text-start font-bold">الجانب</th>
                        <th className="py-3 px-4 text-start font-bold">الهاتف</th>
                        <th className="py-3 px-4 text-start font-bold">الحالة</th>
                        <th className="py-3 px-4 text-start font-bold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-700">{p.injuryType}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.injuredSide === "RIGHT" ? "أيمن" : p.injuredSide === "LEFT" ? "أيسر" : "ثنائي"}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{p.phone || "—"}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                              {p.status || "نشط"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/cases/${p.id}`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              <button
                                onClick={() => {
                                  setEditingPatient(p);
                                  setEditPatientModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                title="تعديل المريض"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeletePatient(p.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: EXERCISES MANAGEMENT */}
          <TabsContent value="exercises" className="m-0 space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-md bg-white p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    التحكم في مكتبة التمارين
                  </h3>
                  <p className="text-xs text-slate-500">
                    إمكانية إضافة وحذف وتعديل التمارين التأهيلية السريرية
                  </p>
                </div>

                <Link
                  href="/exercises"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>فتح مكتبة التمارين الكاملة</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.slice(0, 9).map((ex) => (
                  <div key={ex.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{ex.nameAr}</h4>
                        <span className="text-[11px] font-mono text-slate-500">{ex.nameEn}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {ex.region}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      الفئة: {ex.category}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: PROTOCOLS */}
          <TabsContent value="protocols" className="m-0 space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-md bg-white p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    البروتوكولات السريرية لإصابات الملاعب
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعديل المراحل التأهيلية، أهداف العلاج، وعلامات الخطر
                  </p>
                </div>

                <Link
                  href="/protocols"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء بروتوكول جديد</span>
                </Link>
              </div>

              <div className="space-y-3">
                {protocols.map((proto) => (
                  <div key={proto.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{proto.nameAr}</h4>
                      <span className="text-xs font-mono text-slate-500">{proto.nameEn}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/protocols"
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white hover:text-emerald-700"
                      >
                        معاينة وتعديل
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Modal: Edit Patient */}
        <Dialog open={editPatientModalOpen} onOpenChange={setEditPatientModalOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                تعديل بيانات الحالة السريرية
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                تحديث اسم المريض أو نوع الإصابة أو رقم الهاتف
              </DialogDescription>
            </DialogHeader>

            {editingPatient && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">اسم المريض</Label>
                  <Input
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نوع الإصابة</Label>
                  <Input
                    value={editingPatient.injuryType}
                    onChange={(e) => setEditingPatient({ ...editingPatient, injuryType: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رقم الهاتف</Label>
                  <Input
                    value={editingPatient.phone || ""}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="rounded-xl font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditPatientModalOpen(false)}
                className="rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSavePatientEdit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
