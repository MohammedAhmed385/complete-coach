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

  // Resolve Phase Transition
  let updatedPrograms = body.rehabPrograms;
  if (body.phase) {
    const cases = await getLiveCasesAsync();
    const existingCase = cases.find((c) => c.id === id);
    const prevPrograms = existingCase?.rehabPrograms || [];
    updatedPrograms = [
      {
        id: `prog-${Date.now()}`,
        phase: body.phase,
        notes: body.phaseNotes || body.rehabNotes || `انتقال إلى مرحلة: ${body.phase}`,
        isActive: true,
        startDate: new Date().toISOString(),
      },
      ...prevPrograms.map((p) => ({ ...p, isActive: false })),
    ];
  }

  // Sync with DB if reachable
  if (isDbConfigured()) {
    try {
      const allowedKeys = [
        "name",
        "phone",
        "email",
        "dateOfBirth",
        "gender",
        "injuryType",
        "injuredSide",
        "injuryDate",
        "surgeryDate",
        "rehabStartDate",
        "mechanismOfInjury",
        "notes",
        "status",
      ];
      const dbData: Record<string, any> = {};
      for (const k of allowedKeys) {
        if (body[k] !== undefined) {
          if ((k === "injuryDate" || k === "rehabStartDate") && body[k]) {
            dbData[k] = new Date(body[k]);
          } else if (k === "surgeryDate") {
            dbData[k] = body[k] ? new Date(body[k]) : null;
          } else {
            dbData[k] = body[k];
          }
        }
      }

      if (Object.keys(dbData).length > 0) {
        await prisma.patient.update({
          where: { id },
          data: dbData,
        });
      }

      if (body.phase) {
        await prisma.rehabProgram.updateMany({
          where: { patientId: id, isActive: true },
          data: { isActive: false, endDate: new Date() },
        });
        await prisma.rehabProgram.create({
          data: {
            patientId: id,
            phase: body.phase,
            isActive: true,
            startDate: new Date(),
            notes: body.phaseNotes || "انتقال المرحلة",
          },
        });
      }
    } catch (dbErr) {
      console.warn("DB update skipped:", dbErr);
    }
  }

  // Update in Live Store with KV sync
  const caseUpdatePayload: Record<string, any> = { id, ...body };
  if (updatedPrograms) {
    caseUpdatePayload.rehabPrograms = updatedPrograms;
  }
  const updated = await saveLiveCaseAsync(caseUpdatePayload);
  return NextResponse.json(updated || { id, ...body });
}
