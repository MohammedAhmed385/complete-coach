import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Ensure lightweight visitor/session ID cookies exist (actual tracking runs accurately
  // on real page mount & 10s Web Worker heartbeats via /api/analytics/presence,
  // avoiding false RSC prefetch ghost visits).
  if (!request.cookies.get("pm_vid")) {
    response.cookies.set("pm_vid", crypto.randomUUID(), {
      httpOnly: true,
      secure: request.url.startsWith("https://"),
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
