"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  HeartPulse,
  Eye,
  Info,
  Check,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth, ADMIN_EMAIL } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, signInWithGoogle, loginAsAdmin, loginAsClient, logout } = useAuth();

  const [customEmail, setCustomEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    try {
      await signInWithGoogle();
      setSuccessMessage("جاري الاتصال بخدمة Google...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch {
      setIsLoading(false);
    }
  };

  const handleDirectAdminLogin = () => {
    setIsLoading(true);
    loginAsAdmin();
    setSuccessMessage("مرحباً بك كابتن يوسف! تم تفعيل واجهة وصلاحيات المدير العام (Admin) بنجاح.");
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  const handleDirectClientLogin = () => {
    setIsLoading(true);
    loginAsClient("client.visitor@revive.com", "عميل / مريض");
    setSuccessMessage("تم تسجيل الدخول كعميل (عرض التفاصيل والبرامج التأهيلية فقط).");
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  const handleCustomEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsLoading(true);
    loginAsClient(customEmail.trim());
    if (customEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      setSuccessMessage("مرحباً بك كابتن يوسف! تم التعرف على بريدك كمدير للنظام.");
    } else {
      setSuccessMessage("تم تسجيل الدخول كعميل (عرض التفاصيل فقط).");
    }
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div className="text-right">
              <span className="text-white font-extrabold text-2xl tracking-tight block">
                Revive
              </span>
              <span className="text-emerald-400 text-xs font-semibold">
                إدارة الحالات والبرامج التأهيلية
              </span>
            </div>
          </Link>
          <h2 className="mt-4 text-xl sm:text-2xl font-black text-white">
            تسجيل الدخول وتحديد الصلاحيات
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            واجهة المدير المخصصة للتحكم والتعديل • واجهة العميل للاطلاع على تفاصيل البرامج
          </p>
        </div>

        {/* Current Active Status if logged in */}
        {user && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center text-sm text-slate-300">
            <div className="flex items-center justify-center gap-2 mb-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>أنت مسجل حالياً كـ: {user.name}</span>
              <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-amber-500 text-slate-950" : "bg-slate-700"}>
                {isAdmin ? "مدير النظام (Admin)" : "عميل (Client - عرض فقط)"}
              </Badge>
            </div>
            <div className="flex items-center justify-center gap-3 mt-3">
              <Link href="/" className="text-xs text-emerald-400 hover:underline font-bold">
                الذهاب للرئيسية ←
              </Link>
              <button
                onClick={logout}
                className="text-xs text-rose-400 hover:underline"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Two Dedicated Portals: Admin vs Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 1. Admin Dedicated Portal */}
          <Card className="border-amber-500/40 bg-slate-900/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            <CardHeader className="pb-3 pt-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-white">
                  واجهة المدير (Admin)
                </CardTitle>
                <Badge className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px]">
                  صلاحيات كاملة
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-300 leading-relaxed mt-1">
                خاصة بالمدير المسؤول فقط: إضافة حالات، تعديل وحذف البرامج والتمارين.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 leading-tight">
                <div className="font-bold mb-0.5">الحساب المعتمد للمدير:</div>
                <div className="font-mono text-emerald-400 dir-ltr text-right select-all">
                  {ADMIN_EMAIL}
                </div>
                <div className="text-slate-400 text-[10px] mt-1">
                  بدون أي كلمة سر • مرتبط مباشرة بالبريد
                </div>
              </div>

              <Button
                onClick={handleDirectAdminLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md shadow-amber-500/20 py-5"
              >
                <ShieldCheck className="w-4 h-4 ml-2" />
                <span>دخول كمدير النظام (Admin)</span>
              </Button>
            </CardContent>
          </Card>

          {/* 2. Client Dedicated Portal */}
          <Card className="border-teal-500/30 bg-slate-900/90 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500" />
            <CardHeader className="pb-3 pt-5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-2">
                <User className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-white">
                  واجهة العميل (Client)
                </CardTitle>
                <Badge className="bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[10px]">
                  عرض التفاصيل فقط
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-300 leading-relaxed mt-1">
                للمرضى والزوار: استعراض الحالات، البرامج التأهيلية، التمارين والفيديوهات.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300 leading-tight">
                <div className="font-bold text-teal-400 mb-0.5">مميزات حساب العميل:</div>
                <div className="text-slate-400 text-[10px]">
                  مشاهدة تفاصيل التشخيص ومدى الحركة (ROM) والتواصل مع العيادة بدون أي أزرار تعديل.
                </div>
              </div>

              <Button
                onClick={handleDirectClientLogin}
                disabled={isLoading}
                variant="outline"
                className="w-full border-teal-500/40 text-teal-300 hover:bg-teal-500/10 font-bold py-5"
              >
                <Eye className="w-4 h-4 ml-2" />
                <span>دخول كعميل (عرض التفاصيل)</span>
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Google OAuth & Custom Email Option */}
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-bold text-slate-300">
              أو تسجيل الدخول المباشر عبر Google
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              إذا سجلت بـ <span className="text-amber-400 font-mono">{ADMIN_EMAIL}</span> ستتحول لمدير تلقائياً، وأي إيميل آخر سيكون كعميل.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-5 border-slate-700 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-3 transition"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>تسجيل الدخول باستخدام Google</span>
            </Button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium">أو أدخل أي بريد بدون كلمة مرور</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Custom Email without password */}
            <form onSubmit={handleCustomEmailLogin} className="flex gap-2">
              <Input
                type="email"
                placeholder="your-email@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-xs text-left dir-ltr"
              />
              <Button
                type="submit"
                disabled={isLoading || !customEmail.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 shrink-0"
              >
                دخول
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 justify-between text-xs text-slate-500 border-t border-slate-800/80 px-6 py-3">
            <Link href="/" className="hover:text-emerald-400 flex items-center gap-1 transition">
              <span>تصفح بدون تسجيل دخول</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/contact" className="hover:text-emerald-400 transition">
              تواصل مع الدعم الفني
            </Link>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
