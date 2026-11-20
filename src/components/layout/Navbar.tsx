"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  UserPlus,
  FolderHeart,
  Dumbbell,
  FileHeart,
  Search,
  CheckCircle2,
  Video,
  BrainCircuit,
  BarChart3,
  Menu,
  X,
  Activity,
  PhoneCall,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { label: "إضافة حالة", labelEn: "Add Case", href: "/add-case", icon: UserPlus },
  { label: "الحالات", labelEn: "Cases", href: "/cases", icon: FolderHeart },
  { label: "التمارين", labelEn: "Exercises", href: "/exercises", icon: Dumbbell },
  { label: "البروتوكولات", labelEn: "Protocols", href: "/protocols", icon: FileHeart },
  { label: "الأبحاث", labelEn: "Research", href: "/research", icon: Search },
  { label: "شروط النزول", labelEn: "RTP", href: "/return-to-play", icon: CheckCircle2 },
  { label: "متابعة أونلاين", labelEn: "Online", href: "/online-followup", icon: Video },
  { label: "تحليل AI", labelEn: "AI Analysis", href: "/ai-analysis", icon: BrainCircuit },
  { label: "الإحصائيات", labelEn: "Stats", href: "/analytics", icon: BarChart3 },
  { label: "تواصل معنا", labelEn: "Contact", href: "/contact", icon: PhoneCall },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 gradient-header shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Right Side: Logo & Brand */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-extrabold text-lg leading-none tracking-tight">
                  Revive
                </span>
                <span className="block text-emerald-400 text-[10px] font-medium -mt-0.5">
                  إدارة الحالات والبرامج التأهيلية
                </span>
              </div>
            </Link>

            {/* Center: Desktop Nav Items */}
            <div className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Left Side: Auth & Admin Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                    pathname === "/admin"
                      ? "bg-amber-400 text-slate-900 border-amber-300 shadow-md"
                      : "bg-amber-400/10 text-amber-300 border-amber-400/30 hover:bg-amber-400/20"
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>لوحة الإدارة</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-slate-200 text-xs border border-white/10">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="تسجيل الخروج"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 xl:hidden">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center gap-1 border border-amber-400/30"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Admin</span>
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="القائمة"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-navy-950 border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="p-4 space-y-2">

              {/* Mobile Auth Status */}
              <div className="p-3 mb-2 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                {user ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">{user.name}</span>
                        <span className="block text-[10px] text-emerald-400">{user.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-center text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول إلى Revive</span>
                  </Link>
                )}
              </div>

              {/* Admin Portal Link (Mobile) */}
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                  isAdmin
                    ? "bg-amber-400/10 text-amber-300 border-amber-400/40"
                    : "bg-white/5 text-slate-300 border-white/10"
                )}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="block">لوحة تحكم المدير العام (Admin)</span>
                  <span className="block text-[10px] text-slate-400">تعديل محتويات الموقع والمرضى</span>
                </div>
              </Link>

              <div className="border-t border-white/10 my-2" />

              {/* Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <span className="block">{item.label}</span>
                      <span className="block text-[10px] text-slate-500">
                        {item.labelEn}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
