import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId") || "";
    const date = request.nextUrl.searchParams.get("date") || "";

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

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Appointments GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
  } catch (error) {
    console.error("Appointment POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
