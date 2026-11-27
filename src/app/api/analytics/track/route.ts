import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, checkIsAdminEmail } from "@/lib/auth-config";
import { verifySessionToken } from "@/lib/password";
import {
  extractGeoFromHeaders,
  getCloudflareRequestCf,
  handlePresenceHeartbeat,
} from "@/lib/analytics";
import { describeActivityFromPath } from "@/lib/presenceService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawSession = String(body?.sessionId || "track_sess").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    const sessionId = rawSession.startsWith("s_")
      ? rawSession.slice(0, 64)
      : `s_trk_${rawSession.slice(0, 40) || "default"}`;

    const rawVisitor = String(body?.visitorId || "track_vis").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    const visitorId = rawVisitor.startsWith("v_")
      ? rawVisitor.slice(0, 64)
      : `v_trk_${rawVisitor.slice(0, 40) || "default"}`;

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const verifiedUser = await verifySessionToken(token);
    const currentPath = String(body?.page || "/").slice(0, 140);

    const cf = await getCloudflareRequestCf();
    const geo = extractGeoFromHeaders(request.headers, cf);

    await handlePresenceHeartbeat({
      sessionId,
      visitorId,
      fingerprintHash: visitorId,
      uid: verifiedUser?.id || null,
      isAuthenticated: Boolean(verifiedUser?.id),
      role: verifiedUser?.email
        ? checkIsAdminEmail(verifiedUser.email)
          ? "ADMIN"
          : "CLIENT"
        : "GUEST",
      email: verifiedUser?.email || "Guest",
      displayName: verifiedUser?.name || "زائر",
      currentPath,
      currentActivity: describeActivityFromPath(currentPath),
      referrer: typeof body?.referrer === "string" ? body.referrer : "Direct",
      registerVisit: true,
      recordPageView: true,
      userAgent: request.headers.get("user-agent") || body?.userAgent || "",
      ip: geo.ip,
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
    });

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: true });
  }
}
