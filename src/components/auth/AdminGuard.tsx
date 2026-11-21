"use client";

import React from "react";
import Link from "next/link";
import { Lock, PhoneCall, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/95 border-slate-700 text-center p-8 rounded-3xl shadow-2xl backdrop-blur">
          <CardContent className="space-y-6 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                منطقة مخصصة للإدارة فقط
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                عزيزي العميل، هذه الصفحة مخصصة لمدير المنصة فقط لإدارة البرامج التأهيلية والحالات.
                للتواصل السريع والاستفسارات يرجى التوجه لصفحة تواصل معنا.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl gap-2 shadow-lg shadow-emerald-900/30">
                <Link href="/contact">
                  <PhoneCall className="w-4 h-4" />
                  <span>الانتقال لصفحة تواصل معنا</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700 h-11 rounded-xl gap-2">
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول كمدير</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
