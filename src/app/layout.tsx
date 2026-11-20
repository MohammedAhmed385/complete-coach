import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyticsHeartbeat } from "@/components/analytics/Heartbeat";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peak Motion — إدارة الحالات والبرامج التأهيلية",
  description:
    "منصة إدارة حالات العلاج الطبيعي والإصابات الرياضية والبرامج التأهيلية",
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
        <Navbar />
        <AnalyticsHeartbeat />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
