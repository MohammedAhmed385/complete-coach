import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import { getLiveRTPEvaluationsAsync, saveLiveRTPEvaluationAsync } from "@/lib/live-store";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") || "";

  // 1. Try DB if configured
  if (isDbConfigured()) {
    try {
      const where: Record<string, unknown> = {};
      if (patientId) where.patientId = patientId;

      const evaluations = await prisma.rTPEvaluation.findMany({
        where,
        include: { criteria: true },
        orderBy: { evaluatedAt: "desc" },
      });

      if (evaluations && evaluations.length > 0) {
        return NextResponse.json(evaluations);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Real Live Store with KV multi-device support
  try {
    const liveEvals = await getLiveRTPEvaluationsAsync(patientId || undefined);
    return NextResponse.json(liveEvals);
  } catch (error) {
    console.error("RTP GET error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body || !body.patientId) {
      return NextResponse.json(
        { error: "معرف المريض مطلوب لحفظ تقييم النزول للملعب" },
        { status: 400 }
      );
    }

    const totalCriteria = body.criteria?.length || 0;
    const passed = body.criteria?.filter((c: { passed: boolean }) => c.passed).length || 0;
    const readinessScore =
      body.readinessScore !== undefined && body.readinessScore !== null
        ? Number(body.readinessScore)
        : totalCriteria > 0
        ? Math.round((passed / totalCriteria) * 100)
        : 0;

    // 1. Save in Live Store with KV & Patient linkage
    const saved = await saveLiveRTPEvaluationAsync({
      patientId: body.patientId,
      phase: body.phase || "RETURN_TO_SPORT",
      protocolName: body.protocolName || "معايير العودة للملعب",
      readinessScore,
      evaluatedAt: body.evaluatedAt || new Date().toISOString(),
      criteria:
        body.criteria?.map((c: { id?: string; criterionText: string; passed: boolean; notes?: string }) => ({
          id: c.id || `crit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          criterionText: c.criterionText,
          passed: Boolean(c.passed),
          notes: c.notes || null,
        })) || [],
    });

    // 2. Try DB sync if configured
    if (isDbConfigured()) {
      try {
        await prisma.rTPEvaluation.create({
          data: {
            id: saved.id,
            patientId: body.patientId,
            phase: body.phase,
            protocolName: body.protocolName || null,
            readinessScore,
            criteria: {
              create: body.criteria?.map((c: { criterionText: string; passed: boolean; notes?: string }) => ({
                criterionText: c.criterionText,
                passed: c.passed,
                notes: c.notes || null,
              })) || [],
            },
          },
        });
      } catch (dbErr) {
        console.warn("DB RTP sync skipped:", dbErr);
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("RTP POST error:", error);
    return NextResponse.json({ error: "Failed to save RTP evaluation" }, { status: 500 });
  }
}
