import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";

// In-memory appointments fallback
let memoryAppointments: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId") || "";
    const date = request.nextUrl.searchParams.get("date") || "";

    if (isDbConfigured()) {
      try {
        const where: Record<string, unknown> = {};
        if (patientId) where.patientId = patientId;
        if (date) {
          const d = new Date(date);
          where.date = {
            gte: new Date(d.toDateString()),
            lt: new Date(d.getTime() + 24 * 60 * 60 * 1000),
          };
        }

        const appointments = await prisma.appointment.findMany({
          where,
          include: { patient: { select: { name: true, injuryType: true } } },
          orderBy: { date: "asc" },
        });

        if (appointments && appointments.length > 0) {
          return NextResponse.json(appointments);
        }
      } catch (dbErr) {
        console.warn("DB appointments query failed:", dbErr);
      }
    }

    let filtered = memoryAppointments;
    if (patientId) {
      filtered = filtered.filter((a) => a.patientId === patientId);
    }
    if (date) {
      filtered = filtered.filter((a) => a.date?.startsWith(date));
    }
    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Appointments GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newAppointment = {
      id: `apt-${Date.now()}`,
      patientId: body.patientId,
      userId: body.userId || "default-user",
      type: body.type || "IN_CLINIC",
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      startTime: body.startTime || "10:00",
      endTime: body.endTime || "11:00",
      recurringDays: body.recurringDays
        ? JSON.stringify(body.recurringDays)
        : null,
      notes: body.notes || null,
      patient: {
        name: body.patientName || "مريض",
        injuryType: body.injuryType || "علاج طبيعي",
      },
    };

    memoryAppointments.unshift(newAppointment);

    if (isDbConfigured()) {
      try {
        const appointment = await prisma.appointment.create({
          data: {
            patientId: body.patientId,
            userId: body.userId || "default-user",
            type: body.type,
            date: new Date(body.date),
            startTime: body.startTime,
            endTime: body.endTime,
            recurringDays: body.recurringDays
              ? JSON.stringify(body.recurringDays)
              : null,
            notes: body.notes || null,
          },
        });
        return NextResponse.json(appointment, { status: 201 });
      } catch (dbErr) {
        console.warn("DB appointment create skipped:", dbErr);
      }
    }

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Appointment POST error:", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
