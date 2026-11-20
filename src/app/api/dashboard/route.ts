import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [
      patientCount,
      exerciseCount,
      protocolCount,
      todayAppointments,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.exercise.count(),
      prisma.injuryProtocol.count(),
      prisma.appointment.count({
        where: {
          date: {
            gte: new Date(new Date().toDateString()),
            lt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({
      patients: patientCount,
      exercises: exerciseCount,
      protocols: protocolCount,
      todayAppointments,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { patients: 0, exercises: 0, protocols: 0, todayAppointments: 0 },
      { status: 500 }
    );
  }
}
