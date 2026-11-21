"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  Activity,
  Lock,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, signInWithGoogle, loginWithCredentials, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await signInWithGoogle();
      setSuccessMessage("جاري المتابعة بحساب Google...");
    } catch {
      // If external Google OAuth is not configured with Client ID yet,
      // guide the user seamlessly to enter their Gmail in the form
      setErrorMessage("يرجى إدخال بريد Google / Gmail وكلمة المرور في الحقول أدناه للمتابعة.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error || "تعذر تسجيل الدخول، يرجى التحقق من البيانات.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("تم تسجيل الدخول بنجاح! جاري توجيهك...");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch {
      setErrorMessage("حدث خطأ أثناء تسجيل الدخول");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-6">

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
          <h2 className="mt-4 text-2xl font-black text-white">
            تسجيل الدخول
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            أدخل بيانات حسابك للمتابعة والوصول للمنصة
          </p>
        </div>

        {/* Current status if already logged in */}
        {user && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center text-sm text-slate-300">
            <div className="flex items-center justify-center gap-2 mb-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مرحباً، {user.name}</span>
              {isAdmin && (
                <Badge className="bg-amber-400 text-slate-950 text-[10px] font-bold">
                  مدير النظام
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-400 mb-3">{user.email}</div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link href="/" className="text-xs text-emerald-400 hover:underline font-bold">
                الذهاب للوحة التحكم ←
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
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Secure Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <CardContent className="space-y-4 pt-6">

            {/* Google OAuth Button */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-5 border-slate-700 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-3 transition rounded-xl"
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
                <span>المتابعة باستخدام Google / Gmail</span>
              </Button>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium">أو عبر البريد الإلكتروني</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Standard Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>البريد الإلكتروني</span>
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11 placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>كلمة المرور</span>
                </Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11 placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              >
                {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
              </Button>
            </form>

          </CardContent>

          <CardFooter className="pt-0 justify-between text-xs text-slate-500 border-t border-slate-800/80 px-6 py-3">
            <Link href="/" className="hover:text-emerald-400 flex items-center gap-1 transition">
              <span>تصفح كزائر</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/contact" className="hover:text-emerald-400 transition">
              تواصل مع الدعم
            </Link>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
