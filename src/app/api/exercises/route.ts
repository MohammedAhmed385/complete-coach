import { NextRequest, NextResponse } from "next/server";
import prisma, { isDbConfigured } from "@/lib/db";
import { getLiveExercises, saveLiveExercise } from "@/lib/live-store";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
  const region = request.nextUrl.searchParams.get("region") || "";
  const isIsometric = request.nextUrl.searchParams.get("isIsometric");
  const angle = request.nextUrl.searchParams.get("angle");
  const category = request.nextUrl.searchParams.get("category") || "";

  // 1. Try DB first if configured
  if (isDbConfigured()) {
    try {
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

      const dbExercises = await prisma.exercise.findMany({
        where,
        orderBy: { nameAr: "asc" },
      });

      if (dbExercises && dbExercises.length > 0) {
        return NextResponse.json(dbExercises);
      }
    } catch {
      // DB offline, fall through to live store
    }
  }

  // 2. Real Live Store
  let exercises = getLiveExercises();
  if (search) {
    exercises = exercises.filter(
      (e) =>
        e.nameAr.toLowerCase().includes(search) ||
        e.nameEn.toLowerCase().includes(search) ||
        e.category.toLowerCase().includes(search)
    );
  }
  if (region) {
    exercises = exercises.filter((e) => e.region === region);
  }
  if (isIsometric === "true") {
    exercises = exercises.filter((e) => e.isIsometric === true);
  }
  if (angle) {
    exercises = exercises.filter((e) => e.isometricAngle === parseFloat(angle));
  }
  if (category) {
    exercises = exercises.filter((e) => e.category === category);
  }

  return NextResponse.json(exercises);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Save in Live Store
    const saved = saveLiveExercise({
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      category: body.category || "General",
      region: body.region || "LOWER",
      isIsometric: Boolean(body.isIsometric),
      isometricAngle: body.isometricAngle ? parseFloat(body.isometricAngle) : null,
      instructions: body.instructions || null,
      videoUrl: body.videoUrl || null,
      youtubeSearch: body.youtubeSearch || body.nameEn,
    });

    // Try DB if configured
    if (isDbConfigured()) {
      try {
        await prisma.exercise.create({
          data: {
            id: saved.id,
            nameAr: body.nameAr,
            nameEn: body.nameEn,
            instructions: body.instructions || null,
            region: body.region || "LOWER",
            category: body.category || "General",
            isIsometric: Boolean(body.isIsometric),
            isometricAngle: body.isometricAngle ? parseFloat(body.isometricAngle) : null,
            videoUrl: body.videoUrl || null,
            youtubeSearch: body.youtubeSearch || body.nameEn,
            isCustom: true,
          },
        });
      } catch (dbErr) {
        console.warn("DB save exercise skipped:", dbErr);
      }
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Exercise POST error:", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}
