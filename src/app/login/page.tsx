"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Activity,
  HeartPulse,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, signInWithGoogle, loginAsAdmin, loginWithEmail, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"physio" | "admin">("physio");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("revive2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signInWithGoogle();
      setSuccessMessage("تم تسجيل الدخول بنجاح عبر حساب Google!");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage("حدث خطأ أثناء الاتصال بخدمة Google. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhysioEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setIsLoading(true);
    loginWithEmail(email, "PHYSIOTHERAPIST");
    setSuccessMessage("مرحباً بك! تم تسجيل الدخول بنجاح.");
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const success = loginAsAdmin(adminPasscode);
    if (success) {
      setSuccessMessage("تم التحقق بنجاح! جاري تحويلك إلى لوحة الإدارة الشاملة (Admin Portal)...");
      setTimeout(() => {
        router.push("/admin");
      }, 900);
    } else {
      setErrorMessage("رمز مرور الإدارة غير صحيح. الرمز الافتراضي: revive2026");
      setIsLoading(false);
    }
  };

  const handleQuickAdminDemo = () => {
    loginAsAdmin("revive2026");
    setSuccessMessage("تم تفعيل صلاحيات المدير العام (Super Admin) بنجاح!");
    setTimeout(() => {
      router.push("/admin");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        {/* Logo & Platform Name */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div className="text-start">
              <span className="text-2xl font-black text-white tracking-tight">Revive</span>
              <span className="block text-[11px] font-medium text-emerald-400">
                منصة التأهيل وإدارة الحالات السريرية
              </span>
            </div>
          </Link>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            تسجيل الدخول إلى النظام
          </h2>
          <p className="text-xs text-slate-400">
            اختر نوع الحساب للوصول إلى برامج المرضى أو لوحة التحكم الشاملة
          </p>
        </div>

        {/* If Already Logged In */}
        {user && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>أنت مسجل حالياً كـ: <strong>{user.name}</strong></span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                {user.role}
              </Badge>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex-1 py-2 text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  الدخول للوحة الإدارة (Admin Portal)
                </Link>
              ) : (
                <Link
                  href="/"
                  className="flex-1 py-2 text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  الصفحة الرئيسية
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-slate-300 border-white/20 hover:bg-white/10 text-xs"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        )}

        {/* Main Login Card */}
        <Card className="rounded-3xl border-white/10 shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            
            <div className="p-3 bg-slate-100/80 border-b border-slate-200">
              <TabsList className="grid grid-cols-2 w-full h-11 bg-slate-200/80 p-1 rounded-2xl">
                <TabsTrigger
                  value="physio"
                  className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 shadow-sm gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>طبيب / أخصائي معالج</span>
                </TabsTrigger>

                <TabsTrigger
                  value="admin"
                  className="rounded-xl text-xs font-bold data-[state=active]:bg-navy-950 data-[state=active]:text-white shadow-sm gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>المدير العام (Admin)</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: PHYSIOTHERAPIST & GOOGLE LOGIN */}
            <TabsContent value="physio" className="m-0 p-6 space-y-6">

              {/* Google Button */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm hover:shadow flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>متابعة باستخدام حساب Google</span>
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold absolute">
                    أو عبر البريد الإلكتروني
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handlePhysioEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    البريد الإلكتروني للعيادة
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="dr.name@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="pass" className="text-xs font-semibold text-slate-700">
                      كلمة المرور
                    </Label>
                    <span className="text-[11px] text-slate-400">اختياري للتجربة</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <Input
                      id="pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20"
                >
                  <span>تسجيل الدخول</span>
                </Button>
              </form>

            </TabsContent>

            {/* TAB 2: ADMIN MASTER LOGIN */}
            <TabsContent value="admin" className="m-0 p-6 space-y-6">

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>بوابة المدير العام (Revive Master Admin)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  تمنحك هذه البوابة الصلاحية الكاملة لتعديل كل محتويات المنصة، المرضى، التمارين، البروتوكولات، وساعات العيادة.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminCode" className="text-xs font-semibold text-slate-700">
                    رمز مرور الإدارة الشاملة (Master Passcode)
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <Input
                      id="adminCode"
                      type="password"
                      required
                      placeholder="أدخل رمز مرور المدير..."
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="pr-10 rounded-xl font-mono text-center tracking-wider text-base"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-start">
                    رمز التجربة الافتراضي: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">revive2026</code>
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-navy-950 hover:bg-slate-900 text-white font-bold text-sm shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>الدخول كمدير للنظام والتعديل الكامل</span>
                </Button>
              </form>

              {/* Quick 1-Click Demo Button */}
              <div className="pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickAdminDemo}
                  className="w-full h-10 rounded-xl border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-bold gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>دخول تجريبي فوري بصلاحيات الإدارة (1-Click Admin)</span>
                </Button>
              </div>

            </TabsContent>

          </Tabs>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mx-6 mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

        </Card>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          منصة Revive الطبية التأهيلية • إصدار 2026
        </div>

      </div>
    </div>
  );
}
