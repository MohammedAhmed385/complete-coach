import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, checkIsAdminEmail } from "@/lib/auth-config";
import { verifySessionToken } from "@/lib/password";
import {
  extractGeoFromHeaders,
  getCloudflareRequestCf,
  handlePresenceHeartbeat,
  handlePresenceLeave,
} from "@/lib/analytics";
import { describeActivityFromPath } from "@/lib/presenceService";

const SESSION_ID_RE = /^s_[a-zA-Z0-9_-]{8,56}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "heartbeat");
    const sessionId = String(body?.sessionId || "").slice(0, 64);

    if (!sessionId || !SESSION_ID_RE.test(sessionId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    if (action === "leave") {
      await handlePresenceLeave(sessionId);
      return NextResponse.json(
        { ok: true },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Verified server-side identity from signed HttpOnly cookie (immune to spoofing)
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const verifiedUser = await verifySessionToken(token);
    const isAuthenticated = Boolean(verifiedUser?.id);
    const uid = verifiedUser?.id || null;
    const email = verifiedUser?.email || "Guest";
    const role = verifiedUser?.email
      ? checkIsAdminEmail(verifiedUser.email)
        ? "ADMIN"
        : "CLIENT"
      : "GUEST";
    const displayName = String(
      verifiedUser?.name ||
        body?.displayName ||
        (isAuthenticated ? "مستخدم مسجل" : "زائر")
    ).slice(0, 60);

    const visitorIdRaw = String(body?.visitorId || `v_${sessionId.slice(2)}`);
    const visitorId = /^v_[a-z0-9_-]{8,56}$/i.test(visitorIdRaw)
      ? visitorIdRaw.slice(0, 64)
      : `v_${sessionId.slice(2)}`;
    const fingerprintHash = String(body?.fingerprintHash || visitorId).slice(0, 64);
    const currentPath = String(body?.currentPath || "/").slice(0, 140);
    const currentActivity = String(
      body?.currentActivity || describeActivityFromPath(currentPath)
    ).slice(0, 140);

    const cf = await getCloudflareRequestCf();
    const geo = extractGeoFromHeaders(
      request.headers,
      cf || ((request as any).cf as Record<string, any> | undefined)
    );

    const result = await handlePresenceHeartbeat({
      sessionId,
      visitorId,
      fingerprintHash,
      uid,
      isAuthenticated,
      role,
      email,
      displayName,
      currentPath,
      currentActivity,
      referrer: typeof body?.referrer === "string" ? body.referrer : undefined,
      registerVisit: body?.registerVisit === true,
      recordPageView: body?.recordPageView === true,
      userAgent: request.headers.get("user-agent") || "",
      ip: geo.ip,
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.warn("Presence POST error:", error);
    return NextResponse.json(
      { ok: false, serverNow: Date.now() },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
