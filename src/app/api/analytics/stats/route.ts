import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsStats } from "@/lib/analytics";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const range =
      request.nextUrl.searchParams.get("range") || "7d";

    const stats = await getAnalyticsStats(range);

    // Time-series data
    const now = new Date();
    let days: number;
    switch (range) {
      case "24h": days = 1; break;
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      default: days = 7;
    }

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const timeSeries: { date: string; visits: number; unique: number }[] = [];

    if (days <= 1) {
      // Hourly for 24h
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(startDate.getTime() + h * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        const [visits, unique] = await Promise.all([
          prisma.pageVisit.count({
            where: {
              createdAt: { gte: hourStart, lt: hourEnd },
              isBot: false,
            },
          }),
          prisma.pageVisit
            .findMany({
              where: {
                createdAt: { gte: hourStart, lt: hourEnd },
                isBot: false,
              },
              select: { visitorId: true },
              distinct: ["visitorId"],
            })
            .then((r) => r.length),
        ]);
        timeSeries.push({
          date: hourStart.toISOString(),
          visits,
          unique,
        });
      }
    } else {
      // Daily
      for (let d = 0; d < days; d++) {
        const dayStart = new Date(
          startDate.getTime() + d * 24 * 60 * 60 * 1000
        );
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const [visits, unique] = await Promise.all([
          prisma.pageVisit.count({
            where: {
              createdAt: { gte: dayStart, lt: dayEnd },
              isBot: false,
            },
          }),
          prisma.pageVisit
            .findMany({
              where: {
                createdAt: { gte: dayStart, lt: dayEnd },
                isBot: false,
              },
              select: { visitorId: true },
              distinct: ["visitorId"],
            })
            .then((r) => r.length),
        ]);
        timeSeries.push({
          date: dayStart.toISOString().split("T")[0],
          visits,
          unique,
        });
      }
    }

    return NextResponse.json({ ...stats, timeSeries });
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
