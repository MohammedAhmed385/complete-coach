import { NextRequest, NextResponse } from "next/server";
import { saveLiveInquiryAsync, getLiveInquiriesAsync } from "@/lib/live-store";
import { ADMIN_EMAILS, PRIMARY_ADMIN_EMAIL } from "@/lib/auth-config";

export async function GET() {
  try {
    const inquiries = await getLiveInquiriesAsync();
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("Inquiries GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, phone, email, service, message } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف مطلوبان للتواصل" },
        { status: 400 }
      );
    }

    // Save in Live Store with KV support
    const saved = await saveLiveInquiryAsync({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      service: service || "online_consultation",
      message: message ? message.trim() : "",
      status: "new",
    });

    const serviceLabels: Record<string, string> = {
      online_consultation: "استشارة تأهيلية أونلاين (Online Consultation)",
      clinic_session: "حجز جلسة علاج طبيعي بالعيادة",
      injury_evaluation: "تقييم إصابة رياضية وبرنامج تأهيلي (ACL, Tendinopathy)",
      other: "استفسار طبي آخر",
    };

    const serviceText = serviceLabels[service] || service;

    // Build real Gmail compose URLs targeting all 3 admin Gmails
    const subject = `[Revive] طلب استشارة وتواصل جديد: ${name.trim()}`;
    const bodyText =
      `مرحباً دكتور / إدارة منصة Revive،\n\n` +
      `وصلكم طلب تواصل واستشارة جديد عبر الموقع:\n` +
      `-----------------------------------------\n` +
      `👤 الاسم: ${name.trim()}\n` +
      `📱 الهاتف: ${phone.trim()}\n` +
      (email ? `✉️ البريد: ${email.trim()}\n` : "") +
      `🩺 الخدمة المطلوبة: ${serviceText}\n` +
      `📝 التفاصيل / الأعراض:\n${message || "لا توجد تفاصيل إضافية"}\n` +
      `-----------------------------------------\n` +
      `تاريخ الطلب: ${new Date().toLocaleString("ar-EG")}`;

    const primaryTo = PRIMARY_ADMIN_EMAIL;
    const ccEmails = ADMIN_EMAILS.filter((e) => e !== primaryTo).join(",");

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      primaryTo
    )}&cc=${encodeURIComponent(ccEmails)}&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;

    const mailtoUrl = `mailto:${primaryTo}?cc=${encodeURIComponent(
      ccEmails
    )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    return NextResponse.json(
      {
        success: true,
        inquiry: saved,
        gmailComposeUrl,
        mailtoUrl,
        adminEmails: ADMIN_EMAILS,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
