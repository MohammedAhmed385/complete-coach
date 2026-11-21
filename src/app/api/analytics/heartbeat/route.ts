import { NextRequest, NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { visitorId, sessionId, page } = body;

    if (!visitorId) {
      visitorId = request.cookies.get("pm_vid")?.value || "anon-client";
    }
    if (!sessionId) {
      sessionId = request.cookies.get("pm_sid")?.value || "sess-client";
    }

    await recordHeartbeat(visitorId, sessionId, page || "/");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Heartbeat error ignored:", error);
    return NextResponse.json({ ok: true });
  }
}
