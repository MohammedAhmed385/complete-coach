import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, checkIsAdminEmail } from "@/lib/auth-config";
import { verifySessionToken } from "@/lib/password";
import {
  AnalyticsRange,
  getRealAnalyticsTelemetry,
} from "@/lib/analytics";
import { getLiveCasesAsync, getLiveExercisesAsync } from "@/lib/live-store";

export async function GET(request: NextRequest) {
  try {
    // Admin-only verification using signed HttpOnly session cookie
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const verifiedUser = await verifySessionToken(token);
    if (!verifiedUser || !checkIsAdminEmail(verifiedUser.email)) {
      return NextResponse.json(
        { authorized: false, error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rawRange = request.nextUrl.searchParams.get("range") || "7d";
    const range: AnalyticsRange =
      rawRange === "24h" || rawRange === "30d" || rawRange === "90d"
        ? rawRange
        : "7d";

    const [telemetry, cases, exercises] = await Promise.all([
      getRealAnalyticsTelemetry(range),
      getLiveCasesAsync(),
      getLiveExercisesAsync(),
    ]);

    const totalPatients = cases.length;
    const activePatients = cases.filter((c) => c.status === "active").length;
    const completedPatients = cases.filter((c) => c.status === "completed").length;
    const pausedPatients = cases.filter((c) => c.status === "paused").length;

    const injuryCounts: Record<string, number> = {};
    cases.forEach((c) => {
      const type = c.injuryType?.trim() || "إصابة أخرى";
      injuryCounts[type] = (injuryCounts[type] || 0) + 1;
    });
    const injuryBreakdown = Object.entries(injuryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const phaseCounts: Record<string, number> = {
      ACUTE: 0,
      RESTORE_ROM: 0,
      STRENGTH: 0,
      NEUROMUSCULAR: 0,
      FUNCTIONAL: 0,
      RETURN_TO_SPORT: 0,
    };
    cases.forEach((c) => {
      const activeProg =
        c.rehabPrograms?.find((p) => p.isActive) || c.rehabPrograms?.[0];
      const phase = activeProg?.phase || "ACUTE";
      if (phaseCounts[phase] !== undefined) {
        phaseCounts[phase] += 1;
      } else {
        phaseCounts.ACUTE += 1;
      }
    });

    const sideCounts = { RIGHT: 0, LEFT: 0, BILATERAL: 0 };
    cases.forEach((c) => {
      if (c.injuredSide === "LEFT") sideCounts.LEFT += 1;
      else if (c.injuredSide === "BILATERAL") sideCounts.BILATERAL += 1;
      else sideCounts.RIGHT += 1;
    });

    const clinicalStats = {
      totalPatients,
      activePatients,
      completedPatients,
      pausedPatients,
      totalExercises: exercises.length,
      totalProtocols: 8,
      recoveryRate:
        totalPatients > 0
          ? Math.round((completedPatients / totalPatients) * 100)
          : 0,
      injuryBreakdown,
      phaseBreakdown: phaseCounts,
      sideBreakdown: sideCounts,
    };

    return NextResponse.json(
      {
        authorized: true,
        admin: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          name: verifiedUser.name,
        },
        ...telemetry,
        clinicalStats,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      {
        authorized: false,
        error: "تعذر تحميل بيانات الإحصائيات من الخادم.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
