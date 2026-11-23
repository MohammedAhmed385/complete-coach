"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Activity,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth, checkIsAdminEmail } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, signUp, loginWithCredentials, logout } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [accountType, setAccountType] = useState<"USER" | "ADMIN">("USER");
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup") {
        setMode("signup");
      }
    }
  }, []);

  const switchMode = (nextMode: AuthMode, prefillEmail?: string) => {
    setMode(nextMode);
    setErrorMessage("");
    setErrorCode(undefined);
    setSuccessMessage("");
    if (prefillEmail && nextMode === "signup") {
      setSignUpEmail(prefillEmail);
      if (checkIsAdminEmail(prefillEmail)) {
        setAccountType("ADMIN");
      }
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setErrorCode(undefined);
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور للمتابعة.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) {
        setErrorCode(result.code);
        setErrorMessage(
          result.error || "تعذر تسجيل الدخول، يرجى التحقق من البيانات."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage("تم تسجيل الدخول بنجاح! جاري توجيهك...");
      setTimeout(() => {
        router.push("/");
      }, 650);
    } catch {
      setErrorMessage("حدث خطأ أثناء تسجيل الدخول.");
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setErrorCode(undefined);
    setSuccessMessage("");

    if (fullName.trim().length < 2) {
      setErrorMessage("يرجى إدخال الاسم الكامل (حرفين على الأقل).");
      return;
    }

    if (!signUpEmail.trim()) {
      setErrorMessage("يرجى إدخال البريد الإلكتروني.");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage("يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.");
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setErrorMessage("كلمة المرور وتأكيد كلمة المرور غير متطابقتين.");
      return;
    }

    const isPreauthorizedAdmin = checkIsAdminEmail(signUpEmail);
    if (accountType === "ADMIN" && !isPreauthorizedAdmin && !adminCode.trim()) {
      setErrorMessage("يرجى إدخال كود تفعيل الإدارة لإنشاء حساب مدير.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp({
        name: fullName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        confirmPassword,
        accountType,
        adminCode: adminCode.trim() || undefined,
      });

      if (!result.success) {
        setErrorCode(result.code);
        setErrorMessage(
          result.error || "تعذر إنشاء الحساب، يرجى مراجعة البيانات المدخلة."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage("تم إنشاء الحساب وتسجيل الدخول بنجاح! جاري توجيهك...");
      setTimeout(() => {
        router.push("/");
      }, 650);
    } catch {
      setErrorMessage("حدث خطأ غير متوقع أثناء إنشاء الحساب.");
      setIsLoading(false);
    }
  };

  const isPreauthorizedAdminEmail = checkIsAdminEmail(signUpEmail);
  const passwordMismatch =
    confirmPassword.length > 0 && signUpPassword !== confirmPassword;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
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
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {mode === "signin"
              ? "أدخل البريد الإلكتروني وكلمة المرور للدخول إلى حسابك"
              : "اختر نوع الحساب وأنشئ كلمة مرور آمنة للمستخدم أو المدير"}
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
            <div className="text-xs text-slate-400 mb-3 dir-ltr">
              {user.email}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link
                href="/"
                className="text-xs text-emerald-400 hover:underline font-bold"
              >
                الذهاب للوحة التحكم ←
              </Link>
              <button
                type="button"
                onClick={() => logout()}
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
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center space-y-2 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {errorCode === "ACCOUNT_NOT_FOUND" && mode === "signin" && (
              <button
                type="button"
                onClick={() => switchMode("signup", email.trim())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب بهذا البريد الآن</span>
              </button>
            )}
          </div>
        )}

        {/* Auth Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 border-b border-slate-800 gap-1.5">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                mode === "signin"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                mode === "signup"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          <CardContent className="space-y-4 pt-6">
            {mode === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>البريد الإلكتروني</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
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
                  <div className="relative">
                    <Input
                      type={showSignInPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11 pl-10 placeholder:text-slate-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword((v) => !v)}
                      aria-label={
                        showSignInPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showSignInPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                >
                  {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
                </Button>

                <p className="text-center text-[11px] text-slate-400 pt-1">
                  ليس لديك حساب بعد؟{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup", email.trim())}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    أنشئ حساباً الآن (مستخدم أو مدير)
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* Account Type Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">
                    نوع الحساب
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAccountType("USER")}
                      className={cn(
                        "p-3 rounded-xl border text-right transition-all space-y-1",
                        accountType === "USER"
                          ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <User
                          className={cn(
                            "w-3.5 h-3.5",
                            accountType === "USER"
                              ? "text-emerald-400"
                              : "text-slate-400"
                          )}
                        />
                        <span>مستخدم / عميل</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        للتواصل وحجز الاستشارات التأهيلية
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType("ADMIN")}
                      className={cn(
                        "p-3 rounded-xl border text-right transition-all space-y-1",
                        accountType === "ADMIN"
                          ? "bg-amber-500/15 border-amber-400 text-white shadow-sm"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ShieldCheck
                          className={cn(
                            "w-3.5 h-3.5",
                            accountType === "ADMIN"
                              ? "text-amber-400"
                              : "text-slate-400"
                          )}
                        />
                        <span>مدير / طبيب (Admin)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        لإدارة الحالات والتمارين والبروتوكولات
                      </p>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>الاسم الكامل</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="مثال: كابتن يوسف أحمد"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-800/80 border-slate-700 text-white text-xs rounded-xl h-11 placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                {/* Sign Up Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>البريد الإلكتروني</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11 placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                {/* Admin Verification Info or Invite Code */}
                {accountType === "ADMIN" && (
                  isPreauthorizedAdminEmail ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        بريد إدارة معتمد — يمكنك تعيين كلمة المرور مباشرة بدون كود
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>كود تفعيل الإدارة (Admin Code)</span>
                      </Label>
                      <Input
                        type="text"
                        required
                        placeholder="أدخل كود تفعيل الإدارة"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        className="bg-slate-800/80 border-amber-500/40 text-white text-xs text-left dir-ltr rounded-xl h-11 placeholder:text-slate-500 focus:border-amber-400"
                      />
                    </div>
                  )
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>كلمة المرور (6 أحرف على الأقل)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11 pl-10 placeholder:text-slate-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword((v) => !v)}
                      aria-label={
                        showSignUpPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>تأكيد كلمة المرور</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "bg-slate-800/80 text-white text-xs text-left dir-ltr rounded-xl h-11 pl-10 placeholder:text-slate-500",
                        passwordMismatch
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-700 focus:border-emerald-500"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-[11px] text-rose-400">
                      كلمتا المرور غير متطابقتين.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    fullName.trim().length < 2 ||
                    !signUpEmail.trim() ||
                    signUpPassword.length < 6 ||
                    passwordMismatch
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                >
                  {isLoading
                    ? "جاري إنشاء الحساب..."
                    : "إنشاء الحساب وتسجيل الدخول"}
                </Button>

                <p className="text-center text-[11px] text-slate-400 pt-1">
                  لديك حساب بالفعل؟{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 justify-between text-xs text-slate-500 border-t border-slate-800/80 px-6 py-3">
            <Link
              href="/"
              className="hover:text-emerald-400 flex items-center gap-1 transition"
            >
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
