import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const region = request.nextUrl.searchParams.get("region") || "";
    const isIsometric = request.nextUrl.searchParams.get("isIsometric");
    const angle = request.nextUrl.searchParams.get("angle");
    const category = request.nextUrl.searchParams.get("category") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (region) where.region = region;
    if (isIsometric === "true") where.isIsometric = true;
    if (angle) where.isometricAngle = parseFloat(angle);
    if (category) where.category = category;

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { nameAr: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Exercises GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const exercise = await prisma.exercise.create({
      data: {
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        instructions: body.instructions || null,
        region: body.region,
        category: body.category,
        isIsometric: body.isIsometric || false,
        isometricAngle: body.isometricAngle || null,
        imageUrl: body.imageUrl || null,
        videoUrl: body.videoUrl || null,
        youtubeSearch: body.youtubeSearch || null,
        isCustom: true,
        createdById: body.createdById || null,
      },
    });
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Exercise POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
