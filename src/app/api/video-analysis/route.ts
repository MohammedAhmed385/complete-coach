import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysis = await prisma.videoAnalysis.create({
      data: {
        patientId: body.patientId,
        userId: body.userId || "default-user",
        videoUrl: body.videoUrl,
        cameraPlane: body.cameraPlane,
        poseResults: body.poseResults ? JSON.stringify(body.poseResults) : null,
        annotations: body.annotations ? JSON.stringify(body.annotations) : null,
        kneeValgus: body.kneeValgus ? JSON.stringify(body.kneeValgus) : null,
        thumbnailUrl: body.thumbnailUrl || null,
      },
    });
    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error("Video analysis POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;

    const analyses = await prisma.videoAnalysis.findMany({
      where,
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Video analysis GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
