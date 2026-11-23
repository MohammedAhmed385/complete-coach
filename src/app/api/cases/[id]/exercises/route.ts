import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import {
  getLiveCaseByIdAsync,
  addCaseExercisesAsync,
  updateCaseExercisesAsync,
  deleteCaseExerciseAsync,
} from "@/lib/live-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isDbConfigured()) {
      try {
        const patient = await prisma.patient.findUnique({
          where: { id },
          include: {
            rehabPrograms: {
              where: { isActive: true },
              take: 1,
              include: {
                programExercises: {
                  include: { exercise: true },
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        });
        if (patient?.rehabPrograms?.[0]?.programExercises?.length) {
          return NextResponse.json(patient.rehabPrograms[0].programExercises);
        }
      } catch {
        // Fallback to live store
      }
    }

    const liveCase = await getLiveCaseByIdAsync(id);
    return NextResponse.json(liveCase?.assignedExercises || []);
  } catch (error) {
    console.error("Get case exercises error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const itemsInput = Array.isArray(body.exercises)
      ? body.exercises
      : body.exerciseId || body.exercise
      ? [body]
      : [];

    if (itemsInput.length === 0) {
      return NextResponse.json(
        { error: "يرجى اختيار تمرين واحد على الأقل لإضافته" },
        { status: 400 }
      );
    }

    const normalizedItems = itemsInput.map((item: any, idx: number) => ({
      id: item.id,
      exerciseId: item.exerciseId || item.exercise?.id || `custom-ex-${Date.now()}-${idx}`,
      exercise: item.exercise,
      targetSets: Number(item.targetSets ?? item.sets) || 3,
      targetReps: Number(item.targetReps ?? item.reps) || 10,
      completedSets: Number(item.completedSets) || 0,
      completedReps: Number(item.completedReps) || 0,
      completionPercentage:
        item.completionPercentage !== undefined ? Number(item.completionPercentage) : 0,
      holdSeconds: item.holdSeconds ? Number(item.holdSeconds) : null,
      restSeconds: item.restSeconds ? Number(item.restSeconds) : null,
      notes: item.notes || null,
    }));

    const updatedList = await addCaseExercisesAsync(id, normalizedItems, body._baseSnapshot);

    if (isDbConfigured()) {
      try {
        const patient = await prisma.patient.findUnique({
          where: { id },
          include: { rehabPrograms: { where: { isActive: true }, take: 1 } },
        });
        if (patient) {
          let program = patient.rehabPrograms[0];
          if (!program) {
            program = await prisma.rehabProgram.create({
              data: {
                patientId: id,
                phase: "ACUTE",
                startDate: new Date(),
                isActive: true,
              },
            });
          }
          for (const item of normalizedItems) {
            if (!item.exerciseId) continue;
            try {
              await prisma.programExercise.create({
                data: {
                  programId: program.id,
                  exerciseId: item.exerciseId,
                  sets: item.targetSets,
                  reps: item.targetReps,
                  holdSeconds: item.holdSeconds,
                  restSeconds: item.restSeconds,
                  notes: item.notes,
                },
              });
            } catch {
              // Skip if exerciseId does not exist in Prisma catalog
            }
          }
        }
      } catch (err) {
        console.warn("Prisma exercise attach skipped:", err);
      }
    }

    return NextResponse.json({ success: true, exercises: updatedList }, { status: 201 });
  } catch (error) {
    console.error("Add exercise to patient error:", error);
    return NextResponse.json(
      { error: "Failed to add exercise to patient" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updatedList = await updateCaseExercisesAsync(
      id,
      {
        exerciseItemId: body.exerciseItemId || body.id,
        updates: body.updates,
        assignedExercises: body.assignedExercises,
      },
      body._baseSnapshot
    );

    if (isDbConfigured() && (body.exerciseItemId || body.id) && body.updates) {
      try {
        const targetId = body.exerciseItemId || body.id;
        await prisma.programExercise.update({
          where: { id: targetId },
          data: {
            sets: body.updates.targetSets !== undefined ? Number(body.updates.targetSets) : undefined,
            reps: body.updates.targetReps !== undefined ? Number(body.updates.targetReps) : undefined,
            notes: body.updates.notes !== undefined ? body.updates.notes : undefined,
          },
        });
      } catch {
        // Ignore if record is only in live-store
      }
    }

    return NextResponse.json({ success: true, exercises: updatedList });
  } catch (error) {
    console.error("Update case exercise error:", error);
    return NextResponse.json(
      { error: "Failed to update patient exercise" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const queryItemId = url.searchParams.get("exerciseItemId") || url.searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const targetItemId = queryItemId || body.exerciseItemId || body.id;

    if (!targetItemId) {
      return NextResponse.json(
        { error: "معرف التمرين مطلوب للحذف" },
        { status: 400 }
      );
    }

    const updatedList = await deleteCaseExerciseAsync(id, targetItemId, body._baseSnapshot);

    if (isDbConfigured()) {
      try {
        await prisma.programExercise.delete({ where: { id: targetItemId } });
      } catch {
        // Ignore if only in live-store
      }
    }

    return NextResponse.json({ deleted: true, exercises: updatedList });
  } catch (error) {
    console.error("Delete case exercise error:", error);
    return NextResponse.json(
      { error: "Failed to delete patient exercise" },
      { status: 500 }
    );
  }
}
