import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import { getLiveVideoAnalysesAsync, saveLiveVideoAnalysisAsync } from "@/lib/live-store";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") || "";

  // 1. Try DB if configured
  if (isDbConfigured()) {
    try {
      const where: Record<string, unknown> = {};
      if (patientId) where.patientId = patientId;

      const analyses = await prisma.videoAnalysis.findMany({
        where,
        include: { patient: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });

      if (analyses && analyses.length > 0) {
        return NextResponse.json(analyses);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Real Live Store with KV multi-device support
  try {
    const liveAnalyses = await getLiveVideoAnalysesAsync(patientId || undefined);
    return NextResponse.json(liveAnalyses);
  } catch (error) {
    console.error("Video analysis GET error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Save in Live Store with KV and Patient linkage
    const saved = await saveLiveVideoAnalysisAsync({
      id: body.id,
      patientId: body.patientId || null,
      userId: body.userId || "admin-user",
      exerciseName: body.exerciseName || "تحليل حركي مفصل بالذكاء الاصطناعي",
      cameraPlane: body.cameraPlane || "sagittal",
      evaluatedAt: body.evaluatedAt || new Date().toISOString(),
      jointAngles: body.jointAngles || {},
      activeMuscles: body.activeMuscles || [],
      summaryNotes: body.summaryNotes || null,
      poseResults: body.poseResults || null,
      kneeValgus: body.kneeValgus || null,
      thumbnailUrl: body.thumbnailUrl || null,
      videoUrl: body.videoUrl || null,
    });

    // Try DB sync if configured
    if (isDbConfigured() && body.patientId) {
      try {
        await prisma.videoAnalysis.create({
          data: {
            id: saved.id,
            patientId: body.patientId,
            userId: body.userId || "admin-user",
            videoUrl: body.videoUrl || "local-upload",
            cameraPlane: body.cameraPlane || "sagittal",
            poseResults: body.poseResults ? JSON.stringify(body.poseResults) : null,
            annotations: body.annotations ? JSON.stringify(body.annotations) : null,
            kneeValgus: body.kneeValgus ? JSON.stringify(body.kneeValgus) : null,
            thumbnailUrl: body.thumbnailUrl || null,
          },
        });
      } catch (dbErr) {
        console.warn("DB Video analysis sync skipped:", dbErr);
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Video analysis POST error:", error);
    return NextResponse.json({ error: "Failed to save video analysis" }, { status: 500 });
  }
}
