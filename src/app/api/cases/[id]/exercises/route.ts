import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        rehabPrograms: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let program = patient.rehabPrograms[0];
    if (!program) {
      program = await prisma.rehabProgram.create({
        data: {
          patientId: id,
          phase: "STRENGTH",
          startDate: new Date(),
          isActive: true,
        },
      });
    }

    const programExercise = await prisma.programExercise.create({
      data: {
        programId: program.id,
        exerciseId: body.exerciseId,
        sets: Number(body.sets) || 3,
        reps: Number(body.reps) || 10,
        holdSeconds: body.holdSeconds ? Number(body.holdSeconds) : null,
        restSeconds: body.restSeconds ? Number(body.restSeconds) : null,
        notes: body.notes || null,
      },
      include: {
        exercise: true,
      },
    });

    return NextResponse.json(programExercise, { status: 201 });
  } catch (error) {
    console.error("Add exercise to patient error:", error);
    return NextResponse.json(
      { error: "Failed to add exercise to patient" },
      { status: 500 }
    );
  }
}
