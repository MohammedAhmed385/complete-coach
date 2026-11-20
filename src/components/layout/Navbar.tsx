"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  UserPlus, FolderHeart, Dumbbell, FileHeart, Search,
  CheckCircle2, Video, BrainCircuit, BarChart3, Menu, X,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 gradient-header shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-lg leading-none">
                  Peak Motion
                </span>
                <span className="block text-emerald-400 text-[10px] font-medium -mt-0.5">
                  إدارة الحالات والبرامج التأهيلية
                </span>
              </div>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center gap-1">
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
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="القائمة"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-navy-950 border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="p-4 space-y-1">
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
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <span className="block">{item.label}</span>
                      <span className="block text-xs text-slate-500">
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
