import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import { getLiveCasesAsync, deleteLiveCaseAsync, saveLiveCaseAsync } from "@/lib/live-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Try DB if configured
  if (isDbConfigured()) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          romMeasurements: { orderBy: { date: "desc" } },
          girthMeasurements: {
            include: { measurements: true },
            orderBy: { date: "desc" },
          },
          rehabPrograms: {
            include: {
              programExercises: { include: { exercise: true }, orderBy: { orderIndex: "asc" } },
            },
            orderBy: { createdAt: "desc" },
          },
          appointments: { orderBy: { date: "desc" } },
          rtpEvaluations: {
            include: { criteria: true },
            orderBy: { evaluatedAt: "desc" },
          },
          exerciseSchedules: {
            include: { exercises: { include: { exercise: true } } },
            orderBy: { date: "desc" },
            take: 14,
          },
          videoAnalyses: { orderBy: { createdAt: "desc" } },
        },
      });

      if (patient) return NextResponse.json(patient);
    } catch {
      // DB not reachable, fall to live store
    }
  }

  // 2. Fallback to Live Store (KV + Memory)
  const cases = await getLiveCasesAsync();
  const c = cases.find((item) => item.id === id);
  if (c) {
    return NextResponse.json(c);
  }

  return NextResponse.json({ error: "Case not found" }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isDbConfigured()) {
    try {
      await prisma.patient.delete({ where: { id } });
    } catch {
      // Ignore
    }
  }

  // Delete from Live Store with KV sync
  await deleteLiveCaseAsync(id);
  return NextResponse.json({ deleted: true, success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (isDbConfigured()) {
    try {
      await prisma.patient.update({
        where: { id },
        data: body,
      });
    } catch {
      // Ignore
    }
  }

  // Update in Live Store with KV sync
  const updated = await saveLiveCaseAsync({ id, ...body });
  return NextResponse.json(updated || { id, ...body });
}
