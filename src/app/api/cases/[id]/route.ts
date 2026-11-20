import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Patient detail error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Patient delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const patient = await prisma.patient.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(patient);
  } catch (error) {
    console.error("Patient update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
