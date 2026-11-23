import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import { getLiveCasesAsync, saveLiveCaseAsync } from "@/lib/live-store";

// GET — list patients/cases
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
  const status = request.nextUrl.searchParams.get("status") || "";

  // 1. Try Prisma DB if configured
  if (isDbConfigured()) {
    try {
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { injuryType: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.status = status;

      const patients = await prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          romMeasurements: { orderBy: { date: "desc" }, take: 5 },
          girthMeasurements: {
            include: { measurements: true },
            orderBy: { date: "desc" },
          },
          rehabPrograms: { where: { isActive: true }, take: 1 },
          appointments: { orderBy: { date: "desc" }, take: 3 },
        },
      });

      if (patients && patients.length > 0) {
        return NextResponse.json(patients);
      }
    } catch {
      // DB failed, fall back
    }
  }

  // 2. Real Live Store (KV + Memory)
  let liveCases = await getLiveCasesAsync();
  if (search) {
    liveCases = liveCases.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.injuryType.toLowerCase().includes(search)
    );
  }
  if (status) {
    liveCases = liveCases.filter((c) => c.status === status);
  }
  return NextResponse.json(liveCases);
}

// POST — create patient/case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body || !body.name || !body.injuryType) {
      return NextResponse.json(
        { error: "البيانات الأساسية للمريض مطلوبة (الاسم ونوع الإصابة)" },
        { status: 400 }
      );
    }

    const normalizedGirth = Array.isArray(body.girthEvaluations)
      ? body.girthEvaluations.map((ev: any, idx: number) => ({
          id: ev.id || `girth-${Date.now()}-${idx}`,
          landmark: ev.landmark || "محيط العضلات",
          date: ev.date || new Date().toISOString(),
          measurements: Array.isArray(ev.measurements) ? ev.measurements : [],
        }))
      : [];

    // Save in Live Store with KV support first for guaranteed multi-device persistence
    const saved = await saveLiveCaseAsync({
      id: body.id,
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || null,
      injuryType: body.injuryType,
      injuredSide: body.injuredSide || "RIGHT",
      injuryDate: body.injuryDate || new Date().toISOString(),
      surgeryDate: body.surgeryDate || null,
      rehabStartDate: body.rehabStartDate || new Date().toISOString(),
      mechanismOfInjury: body.mechanismOfInjury || null,
      notes: body.notes || null,
      status: "active",
      rehabPrograms: [
        {
          id: `prog-${Date.now()}`,
          phase: body.rehabPhase || "ACUTE",
          isActive: true,
          notes: body.rehabNotes || "المرحلة التأهيلية المحددة",
          startDate: body.rehabStartDate || new Date().toISOString(),
        },
      ],
      romMeasurements: body.romMeasurements || [],
      girthEvaluations: normalizedGirth,
      girthMeasurements: normalizedGirth,
      assignedExercises: [],
      sessions: [],
    });

    // Try syncing to DB if reachable
    if (isDbConfigured()) {
      try {
        let userId = body.userId;
        if (!userId) {
          const existingUser = await prisma.user.findFirst();
          userId = existingUser?.id;
        }
        if (userId) {
          await prisma.patient.create({
            data: {
              id: saved.id,
              name: body.name,
              phone: body.phone || null,
              email: body.email || null,
              dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
              gender: body.gender || null,
              injuryType: body.injuryType,
              injuryDate: new Date(body.injuryDate || Date.now()),
              surgeryDate: body.surgeryDate ? new Date(body.surgeryDate) : null,
              rehabStartDate: new Date(body.rehabStartDate || Date.now()),
              injuredSide: body.injuredSide || "RIGHT",
              mechanismOfInjury: body.mechanismOfInjury || null,
              notes: body.notes || null,
              userId: userId,
              rehabPrograms: {
                create: {
                  phase: body.rehabPhase || "ACUTE",
                  startDate: new Date(body.rehabStartDate || Date.now()),
                  isActive: true,
                  notes: body.rehabNotes || "المرحلة التأهيلية المحددة",
                },
              },
              romMeasurements: Array.isArray(body.romMeasurements) && body.romMeasurements.length > 0
                ? {
                    create: body.romMeasurements.map((r: any) => ({
                      joint: r.joint,
                      movement: r.movement,
                      injuredAngle: Number(r.injuredAngle) || 0,
                      healthyAngle: r.healthyAngle !== undefined && r.healthyAngle !== null ? Number(r.healthyAngle) : null,
                      notes: r.notes || null,
                    })),
                  }
                : undefined,
              girthMeasurements: normalizedGirth.length > 0
                ? {
                    create: normalizedGirth.map((g: any) => ({
                      landmark: g.landmark,
                      date: g.date ? new Date(g.date) : new Date(),
                      measurements: {
                        create: (g.measurements || []).map((m: any) => ({
                          distanceCm: Number(m.distanceCm) || 0,
                          injuredCm: Number(m.injuredCm) || 0,
                          healthyCm: m.healthyCm !== undefined && m.healthyCm !== null ? Number(m.healthyCm) : null,
                        })),
                      },
                    })),
                  }
                : undefined,
            },
          });
        }
      } catch (err) {
        console.warn("Prisma sync skipped:", err);
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error("Patient POST error:", error);
    return NextResponse.json(
      { error: error?.message || "فشل حفظ بيانات المريض في الخادم" },
      { status: 500 }
    );
  }
}
