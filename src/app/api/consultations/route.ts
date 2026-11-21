import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import {
  getLiveConsultationsAsync,
  saveLiveConsultationAsync,
  updateLiveConsultationStatusAsync,
  LiveConsultation,
} from "@/lib/live-store";

// GET — List online consultations
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const patientId = request.nextUrl.searchParams.get("patientId");

    if (isDbConfigured()) {
      try {
        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (patientId) where.patientId = patientId;

        const consultations = await prisma.onlineConsultation.findMany({
          where,
          include: {
            patient: {
              select: { id: true, name: true, phone: true, injuryType: true },
            },
          },
          orderBy: { scheduledAt: "asc" },
        });

        if (consultations && consultations.length > 0) {
          return NextResponse.json(consultations);
        }
      } catch {
        // Prisma offline/failed, fallback to live store
      }
    }

    let results = await getLiveConsultationsAsync();
    if (status) {
      results = results.filter((c) => c.status === status);
    }
    if (patientId) {
      results = results.filter((c) => c.patientId === patientId);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Consultations GET error:", error);
    return NextResponse.json([]);
  }
}

// POST — Schedule new consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      patientId,
      patientName,
      patientPhone,
      injuryType,
      scheduledAt,
      durationMinutes,
      meetingType,
      meetingLink,
      notes,
    } = body;

    const newConsultation: Partial<LiveConsultation> = {
      id: `consult-${Date.now()}`,
      patientId: patientId || "patient-guest",
      patient: {
        id: patientId || "patient-guest",
        name: patientName || "مريض",
        phone: patientPhone || "",
        injuryType: injuryType || "متابعة عامة — General Follow-up",
      },
      userId: body.userId || "doctor-default",
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      durationMinutes: Number(durationMinutes) || 30,
      meetingType: meetingType || "zoom",
      meetingLink:
        meetingLink ||
        (meetingType === "zoom"
          ? "https://zoom.us/j/8492048201"
          : meetingType === "whatsapp"
          ? `https://wa.me/${(patientPhone || "").replace(/\D/g, "")}`
          : `https://peakmotion.app/room/pt-${Date.now().toString(36)}`),
      notes: notes || "",
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    // Save to Live Store (KV + Memory)
    const saved = await saveLiveConsultationAsync(newConsultation);

    // Try syncing to DB if reachable
    if (isDbConfigured()) {
      try {
        const created = await prisma.onlineConsultation.create({
          data: {
            id: saved.id,
            patientId: saved.patientId,
            userId: saved.userId || "doctor-default",
            scheduledAt: new Date(saved.scheduledAt),
            durationMinutes: saved.durationMinutes,
            meetingType: saved.meetingType,
            meetingLink: saved.meetingLink,
            notes: saved.notes,
            status: "scheduled",
          },
          include: {
            patient: {
              select: { id: true, name: true, phone: true, injuryType: true },
            },
          },
        });
        return NextResponse.json(created, { status: 201 });
      } catch (err) {
        console.warn("DB consultation create skipped:", err);
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Consultation POST error:", error);
    return NextResponse.json({ error: "Failed to schedule consultation" }, { status: 500 });
  }
}

// PATCH — Update consultation status (mark complete / cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update in Live Store (KV + Memory)
    const updated = await updateLiveConsultationStatusAsync(id, status);

    if (isDbConfigured()) {
      try {
        const dbUpdated = await prisma.onlineConsultation.update({
          where: { id },
          data: {
            status,
            ...(notes ? { notes } : {}),
          },
          include: {
            patient: {
              select: { id: true, name: true, phone: true, injuryType: true },
            },
          },
        });
        return NextResponse.json(dbUpdated);
      } catch (err) {
        console.warn("DB consultation patch skipped:", err);
      }
    }

    return NextResponse.json(updated || { id, status, updated: true });
  } catch (error) {
    console.error("Consultation PATCH error:", error);
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
  }
}
