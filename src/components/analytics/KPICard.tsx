"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  subtitle?: string;
  pulse?: boolean;
}

export function KPICard({ title, value, change, icon, subtitle, pulse }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-foreground">
              {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
            </p>
            {pulse && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-slate-50">{icon}</div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              "text-sm font-semibold",
              change >= 0 ? "text-emerald-600" : "text-red-500"
            )}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-xs text-muted-foreground">مقارنة بالفترة السابقة</span>
        </div>
      )}
    </div>
  );
}
