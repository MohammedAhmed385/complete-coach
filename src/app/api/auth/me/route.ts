import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, checkIsAdminEmail } from "@/lib/auth-config";
import { verifySessionToken } from "@/lib/password";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const verifiedUser = await verifySessionToken(token);

    if (!verifiedUser) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    if (checkIsAdminEmail(verifiedUser.email)) {
      verifiedUser.role = "ADMIN";
    }

    return NextResponse.json({
      authenticated: true,
      user: verifiedUser,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
