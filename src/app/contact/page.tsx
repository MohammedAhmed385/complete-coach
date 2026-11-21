"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Facebook,
  Wallet,
  Phone,
  Copy,
  Check,
  Send,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  Sparkles,
  Calendar,
  ExternalLink,
  HelpCircle,
  HeartPulse,
  AtSign,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAILS, PRIMARY_ADMIN_EMAIL } from "@/lib/auth-context";

export default function ContactPage() {
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSubmittingGmail, setIsSubmittingGmail] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "online_consultation",
    message: "",
  });
  const [submitted, setSubmitted] = useState<string | null>(null);

  const WHATSAPP_NUMBER = "+201275829322";
  const WHATSAPP_RAW = "201275829322";
  const FACEBOOK_URL = "https://www.facebook.com/ywsf.ly.618634";
  const WALLET_NUMBER = "01064751088";

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(WALLET_NUMBER);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2500);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(WHATSAPP_NUMBER);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PRIMARY_ADMIN_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const serviceLabels: Record<string, string> = {
    online_consultation: "استشارة تأهيلية أونلاين",
    clinic_session: "حجز جلسة علاج طبيعي بالعيادة",
    injury_evaluation: "تقييم إصابة رياضية وبرنامج تأهيلي",
    general_inquiry: "استفسار عام بخصوص منصة Revive",
  };

  // Submit via WhatsApp
  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("يرجى إدخال الاسم ورقم الهاتف على الأقل");
      return;
    }

    const text = encodeURIComponent(
      `مرحباً دكتور، أود التواصل بخصوص منصة Revive:\n\n` +
      `👤 الاسم: ${formData.name.trim()}\n` +
      `📱 الهاتف: ${formData.phone.trim()}\n` +
      (formData.email.trim() ? `✉️ البريد: ${formData.email.trim()}\n` : "") +
      `🩺 نوع الخدمة: ${serviceLabels[formData.service] || formData.service}\n` +
      `📝 الرسالة: ${formData.message.trim() || "لا توجد تفاصيل إضافية"}`
    );

    window.open(`https://wa.me/${WHATSAPP_RAW}?text=${text}`, "_blank");
    setSubmitted("whatsapp");
  };

  // Submit via Real Gmail Connection
  const handleGmailSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("يرجى إدخال الاسم ورقم الهاتف على الأقل");
      return;
    }

    setIsSubmittingGmail(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      if (data.gmailComposeUrl) {
        window.open(data.gmailComposeUrl, "_blank");
      } else {
        const subject = encodeURIComponent(`[Revive] استفسار تأهيلي من ${formData.name}`);
        const body = encodeURIComponent(
          `الاسم: ${formData.name}\nالهاتف: ${formData.phone}\nالخدمة: ${serviceLabels[formData.service] || formData.service}\nالرسالة: ${formData.message}`
        );
        window.open(
          `https://mail.google.com/mail/?view=cm&fs=1&to=${PRIMARY_ADMIN_EMAIL}&cc=hsksjsgutt@gmail.com,atfm03716@gmail.com&su=${subject}&body=${body}`,
          "_blank"
        );
      }
      setSubmitted("gmail");
    } catch {
      window.open(
        `mailto:${PRIMARY_ADMIN_EMAIL}?cc=hsksjsgutt@gmail.com,atfm03716@gmail.com&subject=استفسار منصة Revive`,
        "_blank"
      );
      setSubmitted("gmail");
    } finally {
      setIsSubmittingGmail(false);
    }
  };

  const primaryCcEmails = ADMIN_EMAILS.filter((e) => e !== PRIMARY_ADMIN_EMAIL).join(",");
  const directGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    PRIMARY_ADMIN_EMAIL
  )}&cc=${encodeURIComponent(
    primaryCcEmails
  )}&su=${encodeURIComponent("استفسار بخصوص منصة Revive التأهيلية")}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-1 text-xs font-semibold gap-1.5 shadow-sm">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>مركز التواصل والدعم السريري المباشر</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            تواصل مع فريق <span className="text-emerald-600">Revive</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            يسعدنا استقبال استفساراتكم وحجوزاتكم الطبية والتأهيلية عبر مختلف القنوات الرسمية السريعة
          </p>
        </div>

        {/* 4 Core Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* 1. WhatsApp Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col justify-between">
            <div>
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <CardHeader className="text-center pb-2 pt-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  واتساب المباشر
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  للحجز الفوري والتنسيق السريع
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-950 text-xs" dir="ltr">
                    {WHATSAPP_NUMBER}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyPhone}
                    className="h-7 px-2 text-emerald-700 hover:bg-emerald-100 text-xs"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </div>
            <div className="px-4 pb-5">
              <a
                href={`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent("مرحباً، أود الاستفسار عن جلسات التأهيل عبر منصة Revive")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>محادثة واتساب فورية</span>
              </a>
            </div>
          </Card>

          {/* 2. Real Gmail Connection Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col justify-between">
            <div>
              <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" />
              <CardHeader className="text-center pb-2 pt-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  البريد الرسمي (Gmail)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  ربط مباشر بإدارة العيادة والأطباء
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[145px]" dir="ltr">
                    {PRIMARY_ADMIN_EMAIL}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyEmail}
                    className="h-7 px-2 text-slate-700 hover:bg-slate-200 text-xs"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <div className="text-[10px] text-slate-400">
                  نسخة موجهة لكافة مديري النظام (CC)
                </div>
              </CardContent>
            </div>
            <div className="px-4 pb-5">
              <a
                href={directGmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>مراسلة عبر Gmail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>

          {/* 3. Facebook Account Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col justify-between">
            <div>
              <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-500" />
              <CardHeader className="text-center pb-2 pt-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Facebook className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  صفحة فيسبوك
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  المتابعة الطبية والمقالات
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-center">
                  <span className="font-semibold text-slate-700 text-xs truncate max-w-[170px]">
                    ywsf.ly.618634
                  </span>
                </div>
              </CardContent>
            </div>
            <div className="px-4 pb-5">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>زيارة الحساب الرسمي</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>

          {/* 4. Electronic Wallet Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group bg-white flex flex-col justify-between">
            <div>
              <div className="h-2 bg-gradient-to-r from-rose-500 to-red-600" />
              <CardHeader className="text-center pb-2 pt-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  المحفظة الإلكترونية
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  فودافون كاش / إنستاباي
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900 text-xs" dir="ltr">
                    {WALLET_NUMBER}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyWallet}
                    className="h-7 px-2 text-rose-700 hover:bg-rose-100 text-xs"
                  >
                    {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </div>
            <div className="px-4 pb-5">
              <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>إرسال إشعار السداد عبر الواتساب</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Contact Form and Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Form (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-slate-200 shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      طلب حجز استشارة أو إرسال استفسار طبي
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      املأ البيانات وسيتم إرسالها فوراً للإدارة عبر الواتساب أو بريد Gmail المعتمد
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <form onSubmit={handleWhatsAppSubmit}>
                <CardContent className="p-6 space-y-4">
                  {submitted === "whatsapp" && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم تجهيز رسالتك وفتح محادثة الواتساب للتأكيد الفوري!</span>
                    </div>
                  )}

                  {submitted === "gmail" && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>تم تسجيل استفسارك بنجاح وتوجيهه إلى حسابات Gmail المعتمدة للإدارة!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                        الاسم الكامل *
                      </Label>
                      <Input
                        id="name"
                        required
                        placeholder="مثال: كابتن أحمد محمد"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                        رقم الهاتف / الواتساب *
                      </Label>
                      <Input
                        id="phone"
                        required
                        dir="ltr"
                        placeholder="01XXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-xl text-end"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                        البريد الإلكتروني (اختياري)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        dir="ltr"
                        placeholder="yourname@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="rounded-xl text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="service" className="text-xs font-semibold text-slate-700">
                        نوع الخدمة أو الاستفسار
                      </Label>
                      <select
                        id="service"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="online_consultation">استشارة تأهيلية أونلاين (Online Consultation)</option>
                        <option value="clinic_session">حجز جلسة علاج طبيعي بالعيادة</option>
                        <option value="injury_evaluation">تقييم إصابة رياضية وبرنامج تأهيلي (ACL, Tendinopathy)</option>
                        <option value="general_inquiry">استفسار عام بخصوص منصة Revive</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-semibold text-slate-700">
                      تفاصيل الإصابة أو الاستفسار
                    </Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="صف الإصابة أو الأعراض، وتاريخ العملية إن وُجدت، أو أي أسئلة تود طرحها..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50/60 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    * يتم الرد والتنسيق المباشر مع أطباء العيادة
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Send via WhatsApp Button */}
                    <Button
                      type="submit"
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 gap-2 font-bold shadow-md shadow-emerald-600/20 text-xs h-10"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>إرسال عبر الواتساب</span>
                    </Button>

                    {/* Send via Real Gmail Connection Button */}
                    <Button
                      type="button"
                      onClick={handleGmailSubmit}
                      disabled={isSubmittingGmail}
                      className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 gap-2 font-bold shadow-md shadow-red-600/20 text-xs h-10"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isSubmittingGmail ? "جاري الإرسال..." : "إرسال عبر Gmail"}</span>
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Right Info Sidebar (1 col) */}
          <div className="space-y-6">

            {/* Quick Clinic Info */}
            <Card className="rounded-2xl border-slate-200 shadow-md bg-white p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>مواعيد العمل والاستشارات</span>
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">الاستشارات أونلاين:</span>
                  <span className="font-semibold text-slate-800">يومياً 10:00 ص – 11:00 م</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">الجلسات السريرية:</span>
                  <span className="font-semibold text-slate-800">السبت إلى الخميس بالحجز</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">خدمة الطوارئ الرياضية:</span>
                  <span className="font-semibold text-emerald-700">متاحة عبر الواتساب وGmail</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 leading-relaxed">
                💡 <strong>منصة Revive:</strong> نوفر جلسات متابعة مصورة عبر Zoom و WhatsApp مع تتبع دقيق للمدى الحركي وتمارين التعافي المنزلية.
              </div>
            </Card>

            {/* Admin Gmail Users List Card */}
            <Card className="rounded-2xl border-slate-200 shadow-md bg-white p-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>عناوين إدارة المنصة المعتمدة:</span>
              </h3>

              <div className="space-y-2">
                {[
                  { email: "yoseefyossefyoseef@gmail.com", role: "المدير الأساسي (كابتن يوسف)" },
                  { email: "hsksjsgutt@gmail.com", role: "مدير معتمد" },
                  { email: "atfm03716@gmail.com", role: "مدير معتمد" },
                ].map((admin) => (
                  <div key={admin.email} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{admin.role}</span>
                      <Badge variant="outline" className="text-[9px] bg-white border-slate-200">
                        Admin
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono text-left dir-ltr truncate">
                      {admin.email}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Direct Quick Links */}
            <Card className="rounded-2xl border-slate-200 shadow-md bg-navy-950 text-white p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>خدمات منصة Revive السريعة</span>
              </h3>

              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Link href="/add-case" className="hover:text-emerald-400 transition-colors">
                    تسجيل حالة وإجراء قياسات المدى الحركي (ROM)
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Link href="/protocols" className="hover:text-emerald-400 transition-colors">
                    استعراض بروتوكولات إصابات الملاعب المعتمدة
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Link href="/online-followup" className="hover:text-emerald-400 transition-colors">
                    جدول الاستشارات والمتابعة الافتراضية
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Link href="/return-to-play" className="hover:text-emerald-400 transition-colors">
                    اختبارات شروط النزول للملعب (RTP Scorecard)
                  </Link>
                </li>
              </ul>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
