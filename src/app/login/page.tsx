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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, signInWithGoogle, loginAsClient, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      await signInWithGoogle();
      setMessage("جاري تسجيل الدخول...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    loginAsClient(email.trim());
    setMessage("تم تسجيل الدخول بنجاح.");
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            سجّل دخولك للمتابعة والاطلاع على برامجك التأهيلية
          </p>
        </div>

        {/* Current status if already logged in */}
        {user && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center text-sm text-slate-300">
            <div className="flex items-center justify-center gap-2 mb-2 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مرحباً، {user.name}</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
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
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Clean Login Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <CardContent className="space-y-4 pt-6">

            {/* Google OAuth Button */}
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
              <span>المتابعة باستخدام Google</span>
            </Button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium">أو عبر البريد الإلكتروني</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Email Input Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/80 border-slate-700 text-white text-xs text-left dir-ltr rounded-xl h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-md shadow-emerald-600/20"
              >
                تسجيل الدخول
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
