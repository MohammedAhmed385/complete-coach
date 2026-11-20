import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyticsHeartbeat } from "@/components/analytics/Heartbeat";
import { AuthProvider } from "@/lib/auth-context";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revive — إدارة الحالات والبرامج التأهيلية",
  description:
    "منصة Revive لإدارة حالات العلاج الطبيعي والإصابات الرياضية والبرامج التأهيلية وتحليل الحركة",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          <Navbar />
          <AnalyticsHeartbeat />
          <main className="pt-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
