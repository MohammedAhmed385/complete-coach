import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isBot, parseDevice, parseBrowser, parseOS } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      page,
      referrer,
      userAgent = "",
      visitorId,
      sessionId,
      country,
      city,
    } = body;

    // Skip bots
    if (isBot(userAgent)) {
      return NextResponse.json({ tracked: false, reason: "bot" });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Create fingerprint
    const { createHash } = await import("crypto");
    const fingerprint = createHash("sha256")
      .update(`${ip}:${userAgent}`)
      .digest("hex")
      .slice(0, 16);

    const device = parseDevice(userAgent);
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);

    // Create page visit
    await prisma.pageVisit.create({
      data: {
        visitorId: visitorId || fingerprint,
        fingerprint,
        page: page || "/",
        referrer: referrer || null,
        userAgent,
        device,
        browser,
        os,
        country: country || null,
        city: city || null,
        sessionId: sessionId || null,
        isBot: false,
      },
    });

    // Upsert visitor session
    if (sessionId) {
      const existing = await prisma.visitorSession.findFirst({
        where: { id: sessionId },
      });

      if (existing) {
        await prisma.visitorSession.update({
          where: { id: sessionId },
          data: {
            lastActiveAt: new Date(),
            pageCount: { increment: 1 },
            duration: Math.floor(
              (Date.now() - new Date(existing.startedAt).getTime()) / 1000
            ),
          },
        });
      } else {
        await prisma.visitorSession.create({
          data: {
            id: sessionId,
            visitorId: visitorId || fingerprint,
            device,
            country: country || null,
          },
        });
      }
    }

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ tracked: false }, { status: 500 });
  }
}
