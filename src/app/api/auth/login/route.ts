import { NextRequest, NextResponse } from "next/server";
import {
  AuthUser,
  SESSION_COOKIE_NAME,
  checkIsAdminEmail,
} from "@/lib/auth-config";
import {
  createSessionToken,
  createSignedAccountBackup,
  verifyPassword,
  verifySignedAccountBackup,
} from "@/lib/password";
import {
  findLiveAuthUserByEmailAsync,
  saveLiveAuthUserAsync,
} from "@/lib/live-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const password = typeof body.password === "string" ? body.password : "";

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال البريد الإلكتروني وكلمة المرور للمتابعة.",
        },
        { status: 400 }
      );
    }

    let account = await findLiveAuthUserByEmailAsync(normalizedEmail);

    // Cold-isolate / multi-instance fallback using HMAC-signed local backup
    if (!account && body.localAccountBackup) {
      const verifiedBackup = await verifySignedAccountBackup(
        body.localAccountBackup
      );
      if (
        verifiedBackup &&
        verifiedBackup.email.toLowerCase().trim() === normalizedEmail
      ) {
        account = await saveLiveAuthUserAsync({
          id: verifiedBackup.id,
          name: verifiedBackup.name,
          email: normalizedEmail,
          role: checkIsAdminEmail(normalizedEmail)
            ? "ADMIN"
            : verifiedBackup.role,
          passwordHash: verifiedBackup.passwordHash,
          salt: verifiedBackup.salt,
          avatarUrl: verifiedBackup.avatarUrl || null,
          createdAt: verifiedBackup.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          error:
            "هذا البريد الإلكتروني غير مسجل بعد. يرجى الانتقال إلى إنشاء حساب جديد وتعيين كلمة المرور.",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(
      password,
      account.passwordHash,
      account.salt
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PASSWORD",
          error: "كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.",
        },
        { status: 401 }
      );
    }

    const finalRole = checkIsAdminEmail(account.email)
      ? "ADMIN"
      : account.role;

    const authUser: AuthUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: finalRole,
      avatarUrl: account.avatarUrl || null,
      createdAt: account.createdAt,
    };

    const sessionToken = await createSessionToken(authUser);
    const accountBackup = await createSignedAccountBackup({
      id: account.id,
      name: account.name,
      email: account.email,
      role: finalRole,
      passwordHash: account.passwordHash,
      salt: account.salt,
      avatarUrl: account.avatarUrl || null,
      createdAt: account.createdAt,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: authUser,
        accountBackup,
      },
      { status: 200 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      secure: request.url.startsWith("https://"),
    });

    return response;
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تسجيل الدخول." },
      { status: 500 }
    );
  }
}
