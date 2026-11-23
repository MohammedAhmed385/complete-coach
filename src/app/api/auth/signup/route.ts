import { NextRequest, NextResponse } from "next/server";
import {
  AuthUser,
  Role,
  SESSION_COOKIE_NAME,
  checkIsAdminEmail,
} from "@/lib/auth-config";
import {
  createSessionToken,
  createSignedAccountBackup,
  hashPassword,
} from "@/lib/password";
import {
  LiveAuthAccount,
  findLiveAuthUserByEmailAsync,
  saveLiveAuthUserAsync,
} from "@/lib/live-store";
import { isDbConfigured, prisma } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const normalizedEmail = rawEmail.toLowerCase().trim();
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : undefined;

    if (rawName.length < 2) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال الاسم الكامل (حرفين على الأقل)." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال بريد إلكتروني صحيح." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.",
        },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين.",
        },
        { status: 400 }
      );
    }

    const existing = await findLiveAuthUserByEmailAsync(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_EXISTS",
          error: "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بكلمة المرور.",
        },
        { status: 409 }
      );
    }

    // Strict email-based role resolution: only the 3 authorized emails get ADMIN
    const assignedRole: Role = checkIsAdminEmail(normalizedEmail)
      ? "ADMIN"
      : "CLIENT";

    const { hash, salt } = await hashPassword(password);
    const now = new Date().toISOString();
    const accountId = `${assignedRole === "ADMIN" ? "admin" : "user"}-${Date.now()}`;

    const accountRecord: LiveAuthAccount = {
      id: accountId,
      name: rawName,
      email: normalizedEmail,
      role: assignedRole,
      passwordHash: hash,
      salt,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await saveLiveAuthUserAsync(accountRecord);

    if (isDbConfigured()) {
      try {
        await prisma.user.upsert({
          where: { email: normalizedEmail },
          update: {
            name: rawName,
            role: assignedRole === "ADMIN" ? "ADMIN" : "PATIENT",
          },
          create: {
            id: saved.id,
            email: normalizedEmail,
            name: rawName,
            role: assignedRole === "ADMIN" ? "ADMIN" : "PATIENT",
          },
        });
      } catch (dbErr) {
        console.warn("Prisma user upsert skipped on signup:", dbErr);
      }
    }

    const authUser: AuthUser = {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      avatarUrl: saved.avatarUrl || null,
      createdAt: saved.createdAt,
    };

    const sessionToken = await createSessionToken(authUser);
    const accountBackup = await createSignedAccountBackup({
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      passwordHash: saved.passwordHash,
      salt: saved.salt,
      avatarUrl: saved.avatarUrl || null,
      createdAt: saved.createdAt,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: authUser,
        accountBackup,
      },
      { status: 201 }
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
    console.error("Auth signup error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر إنشاء الحساب حالياً. يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
