import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/video-analyses — list analyses for a patient or recent analyses
export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId") || "";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (patientId) {
      where.patientId = patientId;
    }

    const analyses = await prisma.videoAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            injuryType: true,
            injuredSide: true,
          },
        },
      },
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("VideoAnalysis GET error:", error);
    // In case DB is offline or not migrated yet, return empty list gracefully
    return NextResponse.json(
      [],
      { status: 200 }
    );
  }
}

// POST /api/video-analyses — save new video analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      videoUrl,
      cameraPlane,
      poseResults,
      annotations,
      kneeValgus,
      thumbnailUrl,
      userId,
    } = body;

    if (!patientId || !videoUrl || !cameraPlane) {
      return NextResponse.json(
        { error: "بيانات ناقصة (patientId, videoUrl, cameraPlane مطلوبة)" },
        { status: 400 }
      );
    }

    // Determine target userId
    let finalUserId = userId;
    if (!finalUserId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { userId: true },
      });
      if (patient?.userId) {
        finalUserId = patient.userId;
      } else {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
          finalUserId = firstUser.id;
        } else {
          const defaultUser = await prisma.user.create({
            data: {
              email: "dr.peakmotion@clinic.local",
              name: "أخصائي العلاج الطبيعي",
              role: "PHYSIOTHERAPIST",
            },
          });
          finalUserId = defaultUser.id;
        }
      }
    }

    const analysis = await prisma.videoAnalysis.create({
      data: {
        patientId,
        userId: finalUserId,
        videoUrl,
        cameraPlane,
        poseResults: typeof poseResults === "object" ? JSON.stringify(poseResults) : poseResults || null,
        annotations: typeof annotations === "object" ? JSON.stringify(annotations) : annotations || null,
        kneeValgus: typeof kneeValgus === "object" ? JSON.stringify(kneeValgus) : kneeValgus || null,
        thumbnailUrl: thumbnailUrl || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            injuryType: true,
          },
        },
      },
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: any) {
    console.error("VideoAnalysis POST error:", error);
    return NextResponse.json(
      { error: "فشل حفظ التحليل في قاعدة البيانات", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
