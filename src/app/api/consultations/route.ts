import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Fallback in-memory store if DB is offline or table is empty
let inMemoryConsultations = [
  {
    id: "consult-1",
    patientId: "patient-1",
    patient: {
      id: "patient-1",
      name: "أحمد محمود المنصوري",
      phone: "+201012345678",
      injuryType: "إعادة بناء الرباط الصليبي — ACL Reconstruction",
    },
    userId: "doctor-1",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // in 2 hours
    durationMinutes: 30,
    meetingType: "zoom",
    meetingLink: "https://zoom.us/j/98765432100",
    notes: "متابعة المدى الحركي (ROM) لثني الركبة والتحقق من زاوية التمديد 0° بعد 4 أسابيع من الجراحة.",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "consult-2",
    patientId: "patient-2",
    patient: {
      id: "patient-2",
      name: "سارة عبد الرحمن",
      phone: "+201123456789",
      injuryType: "اعتلال وتر الرضفة — Patellar Tendinopathy",
    },
    userId: "doctor-1",
    scheduledAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // in 5 hours
    durationMinutes: 45,
    meetingType: "whatsapp",
    meetingLink: "https://wa.me/201123456789",
    notes: "تقييم الألم أثناء تمرين Wall Sit ومراجعة تمارين الانقباض الثابت Isometric 45°.",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "consult-3",
    patientId: "patient-3",
    patient: {
      id: "patient-3",
      name: "كريم يوسف النجار",
      phone: "+201234567890",
      injuryType: "مرفق التنس — Tennis Elbow (Lateral Epicondylitis)",
    },
    userId: "doctor-1",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    durationMinutes: 30,
    meetingType: "webrtc",
    meetingLink: "https://peakmotion.app/room/pt-tennis-elbow-ky",
    notes: "فحص قوة القبضة بدون ألم وتقييم برنامج التحميل اللامركزي Eccentric Loading.",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "consult-4",
    patientId: "patient-4",
    patient: {
      id: "patient-4",
      name: "مروان خالد العوضي",
      phone: "+201098765432",
      injuryType: "التواء الكاحل من الدرجة الثانية — Inversion Ankle Sprain Grade II",
    },
    userId: "doctor-1",
    scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    durationMinutes: 30,
    meetingType: "zoom",
    meetingLink: "https://zoom.us/j/12345678901",
    notes: "تم التأكد من زوال التورم وبدء تمارين التوازن على ساق واحدة Single Leg Balance.",
    status: "completed",
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "consult-5",
    patientId: "patient-5",
    patient: {
      id: "patient-5",
      name: "فاطمة حسن إبراهيم",
      phone: "+201187654321",
      injuryType: "متلازمة الألم الرضفي الفخذي — PFPS",
    },
    userId: "doctor-1",
    scheduledAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4 days ago
    durationMinutes: 15,
    meetingType: "whatsapp",
    meetingLink: "https://wa.me/201187654321",
    notes: "تم إلغاء الموعد بناءً على طلب المريضة لظروف طارئة وتأجيله للأسبوع القادم.",
    status: "cancelled",
    createdAt: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(),
  },
];

// GET — List online consultations
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const patientId = request.nextUrl.searchParams.get("patientId");

    try {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (patientId) where.patientId = patientId;

      const consultations = await prisma.onlineConsultation.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, phone: true, injuryType: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      if (consultations && consultations.length > 0) {
        return NextResponse.json(consultations);
      }
    } catch {
      // Prisma offline/failed, fallback to in-memory
    }

    let results = inMemoryConsultations;
    if (status) {
      results = results.filter((c) => c.status === status);
    }
    if (patientId) {
      results = results.filter((c) => c.patientId === patientId);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Consultations GET error:", error);
    return NextResponse.json(inMemoryConsultations);
  }
}

// POST — Schedule new consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, patientName, patientPhone, injuryType, scheduledAt, durationMinutes, meetingType, meetingLink, notes } = body;

    const newConsultation = {
      id: `consult-${Date.now()}`,
      patientId: patientId || "patient-guest",
      patient: {
        id: patientId || "patient-guest",
        name: patientName || "مريض بدون اسم",
        phone: patientPhone || "",
        injuryType: injuryType || "متابعة عامة — General Follow-up",
      },
      userId: body.userId || "doctor-default",
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 30,
      meetingType: meetingType || "zoom",
      meetingLink: meetingLink || (meetingType === "zoom" ? "https://zoom.us/j/8492048201" : meetingType === "whatsapp" ? `https://wa.me/${(patientPhone || "").replace(/\D/g, "")}` : `https://peakmotion.app/room/pt-${Date.now().toString(36)}`),
      notes: notes || "",
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await prisma.onlineConsultation.create({
        data: {
          patientId: newConsultation.patientId,
          userId: newConsultation.userId,
          scheduledAt: new Date(newConsultation.scheduledAt),
          durationMinutes: newConsultation.durationMinutes,
          meetingType: newConsultation.meetingType,
          meetingLink: newConsultation.meetingLink,
          notes: newConsultation.notes,
          status: "scheduled",
        },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, injuryType: true },
          },
        },
      });
      return NextResponse.json(created, { status: 201 });
    } catch {
      // Prisma offline, add to in-memory store
      inMemoryConsultations.unshift(newConsultation);
      return NextResponse.json(newConsultation, { status: 201 });
    }
  } catch (error) {
    console.error("Consultation POST error:", error);
    return NextResponse.json({ error: "Failed to schedule consultation" }, { status: 500 });
  }
}

// PATCH — Update consultation status (mark complete / cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const updated = await prisma.onlineConsultation.update({
        where: { id },
        data: {
          status,
          ...(notes ? { notes } : {}),
        },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, injuryType: true },
          },
        },
      });
      return NextResponse.json(updated);
    } catch {
      // Update in-memory
      const idx = inMemoryConsultations.findIndex((c) => c.id === id);
      if (idx !== -1) {
        inMemoryConsultations[idx] = {
          ...inMemoryConsultations[idx],
          status,
          ...(notes ? { notes } : {}),
        };
        return NextResponse.json(inMemoryConsultations[idx]);
      }
      return NextResponse.json({ id, status, updated: true });
    }
  } catch (error) {
    console.error("Consultation PATCH error:", error);
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
  }
}
