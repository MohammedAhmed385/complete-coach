import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Default online consultation availability
let inMemoryOnlineHours = [
  { id: "hours-0", dayOfWeek: 0, dayNameAr: "الأحد", dayNameEn: "Sunday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "hours-1", dayOfWeek: 1, dayNameAr: "الاثنين", dayNameEn: "Monday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "hours-2", dayOfWeek: 2, dayNameAr: "الثلاثاء", dayNameEn: "Tuesday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "hours-3", dayOfWeek: 3, dayNameAr: "الأربعاء", dayNameEn: "Wednesday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "hours-4", dayOfWeek: 4, dayNameAr: "الخميس", dayNameEn: "Thursday", startTime: "10:00", endTime: "18:00", isOpen: true },
  { id: "hours-5", dayOfWeek: 5, dayNameAr: "الجمعة", dayNameEn: "Friday", startTime: "14:00", endTime: "20:00", isOpen: false },
  { id: "hours-6", dayOfWeek: 6, dayNameAr: "السبت", dayNameEn: "Saturday", startTime: "11:00", endTime: "19:00", isOpen: true },
];

// GET — Fetch online hours
export async function GET() {
  try {
    try {
      const dbHours = await prisma.clinicHours.findMany({
        orderBy: { dayOfWeek: "asc" },
      });
      if (dbHours && dbHours.length > 0) {
        const enriched = dbHours.map((h) => {
          const defaultRef = inMemoryOnlineHours.find((d) => d.dayOfWeek === h.dayOfWeek);
          return {
            id: h.id,
            dayOfWeek: h.dayOfWeek,
            dayNameAr: defaultRef?.dayNameAr || "",
            dayNameEn: defaultRef?.dayNameEn || "",
            startTime: h.startTime,
            endTime: h.endTime,
            isOpen: h.isOpen,
          };
        });
        return NextResponse.json(enriched);
      }
    } catch {
      // Prisma offline, fallback
    }

    return NextResponse.json(inMemoryOnlineHours);
  } catch (error) {
    console.error("Online hours GET error:", error);
    return NextResponse.json(inMemoryOnlineHours);
  }
}

// PUT — Save or update online consultation hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { hours } = body;

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: "Invalid hours data" }, { status: 400 });
    }

    try {
      // Upsert into ClinicHours
      for (const item of hours) {
        const existing = await prisma.clinicHours.findFirst({
          where: { dayOfWeek: item.dayOfWeek },
        });
        if (existing) {
          await prisma.clinicHours.update({
            where: { id: existing.id },
            data: {
              startTime: item.startTime,
              endTime: item.endTime,
              isOpen: item.isOpen,
            },
          });
        } else {
          await prisma.clinicHours.create({
            data: {
              dayOfWeek: item.dayOfWeek,
              startTime: item.startTime,
              endTime: item.endTime,
              isOpen: item.isOpen,
            },
          });
        }
      }
    } catch {
      // Update in-memory fallback
      inMemoryOnlineHours = hours;
    }

    inMemoryOnlineHours = hours;
    return NextResponse.json({ success: true, hours: inMemoryOnlineHours });
  } catch (error) {
    console.error("Online hours PUT error:", error);
    return NextResponse.json({ error: "Failed to update hours" }, { status: 500 });
  }
}
