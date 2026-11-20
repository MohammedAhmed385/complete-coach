import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set visitor ID cookie if not present
  if (!request.cookies.get("pm_vid")) {
    const vid = crypto.randomUUID();
    response.cookies.set("pm_vid", vid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });
  }

  // Set session ID cookie if not present
  if (!request.cookies.get("pm_sid")) {
    const sid = crypto.randomUUID();
    response.cookies.set("pm_sid", sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
      path: "/",
    });
  }

  // Track page views (non-API, non-static)
  const path = request.nextUrl.pathname;
  if (
    !path.startsWith("/api/") &&
    !path.startsWith("/_next/") &&
    !path.includes(".")
  ) {
    // Fire-and-forget analytics tracking via internal API
    const trackUrl = new URL("/api/analytics/track", request.url);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-forwarded-for":
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1",
    };

    fetch(trackUrl.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        page: path,
        referrer: request.headers.get("referer") || null,
        userAgent: request.headers.get("user-agent") || "",
        visitorId: request.cookies.get("pm_vid")?.value,
        sessionId: request.cookies.get("pm_sid")?.value,
        country:
          request.headers.get("x-vercel-ip-country") ||
          request.headers.get("cf-ipcountry") ||
          null,
        city:
          request.headers.get("x-vercel-ip-city") ||
          request.headers.get("cf-ipcity") ||
          null,
      }),
    }).catch(() => {});
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
