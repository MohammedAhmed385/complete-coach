import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { visitorId, sessionId, page } = body;

    if (!visitorId) {
      visitorId = request.cookies.get("pm_vid")?.value;
    }
    if (!sessionId) {
      sessionId = request.cookies.get("pm_sid")?.value;
    }

    if (!visitorId || !page) {
      // If still missing, provide fallback so heartbeat never crashes
      visitorId = visitorId || "anon-client";
      page = page || "/analytics";
    }

    await prisma.visitorHeartbeat.create({
      data: {
        visitorId,
        sessionId: sessionId || null,
        page,
      },
    });

    // Update session last_active
    if (sessionId) {
      await prisma.visitorSession.updateMany({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
