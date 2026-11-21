import { NextRequest, NextResponse } from "next/server";
import { trackPageVisit } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userAgent = request.headers.get("user-agent") || body.userAgent || "";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "127.0.0.1";

    const country =
      request.headers.get("cf-ipcountry") || body.country || "EG";

    await trackPageVisit({
      page: body.page || "/",
      referrer: body.referrer || "Direct",
      userAgent,
      ip,
      country,
      city: body.city,
      visitorId: body.visitorId,
      sessionId: body.sessionId,
    });

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.warn("Analytics track error ignored:", error);
    return NextResponse.json({ tracked: true });
  }
}
