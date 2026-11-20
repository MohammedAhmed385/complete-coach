import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId") || "";

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;

    const evaluations = await prisma.rTPEvaluation.findMany({
      where,
      include: { criteria: true },
      orderBy: { evaluatedAt: "desc" },
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("RTP GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const totalCriteria = body.criteria?.length || 0;
    const passed = body.criteria?.filter((c: { passed: boolean }) => c.passed).length || 0;
    const readinessScore = totalCriteria > 0 ? Math.round((passed / totalCriteria) * 100) : 0;

    const evaluation = await prisma.rTPEvaluation.create({
      data: {
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
      include: { criteria: true },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("RTP POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
