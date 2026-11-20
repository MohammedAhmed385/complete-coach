import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function generateWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getPhaseLabel(phase: string): { ar: string; en: string } {
  const labels: Record<string, { ar: string; en: string }> = {
    ACUTE: { ar: "المرحلة الحادة", en: "Acute Phase" },
    RESTORE_ROM: { ar: "استعادة المدى الحركي", en: "Restore ROM" },
    STRENGTH: { ar: "تقوية العضلات", en: "Strengthening" },
    NEUROMUSCULAR: { ar: "التحكم العصبي العضلي", en: "Neuromuscular Control" },
    FUNCTIONAL: { ar: "التمارين الوظيفية", en: "Functional Training" },
    RETURN_TO_SPORT: { ar: "العودة للرياضة", en: "Return to Sport" },
  };
  return labels[phase] || { ar: phase, en: phase };
}

export function getRegionLabel(region: string): { ar: string; en: string } {
  const labels: Record<string, { ar: string; en: string }> = {
    UPPER: { ar: "الجزء العلوي", en: "Upper Body" },
    LOWER: { ar: "الجزء السفلي", en: "Lower Body" },
    CORE: { ar: "الجذع", en: "Core" },
    FULL_BODY: { ar: "الجسم الكامل", en: "Full Body" },
  };
  return labels[region] || { ar: region, en: region };
}

export function getJointLabel(joint: string): string {
  const labels: Record<string, string> = {
    Knee: "الركبة — Knee",
    Hip: "الورك — Hip",
    Ankle: "الكاحل — Ankle",
    Shoulder: "الكتف — Shoulder",
    Elbow: "المرفق — Elbow",
    Wrist: "الرسغ — Wrist",
    Cervical: "فقرات عنقية — Cervical",
    Thoracic: "فقرات صدرية — Thoracic",
    Lumbar: "فقرات قطنية — Lumbar",
  };
  return labels[joint] || joint;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
    /googlebot/i, /bingbot/i, /yandex/i, /baidu/i, /duckduckbot/i,
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
    /whatsapp/i, /telegrambot/i, /pingdom/i, /uptimerobot/i,
    /headlesschrome/i, /phantomjs/i, /lighthouse/i, /gtmetrix/i,
  ];
  return botPatterns.some((p) => p.test(userAgent));
}

export function parseDevice(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function parseBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/opera|opr/i.test(userAgent)) return "Opera";
  return "Other";
}

export function parseOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad/i.test(userAgent)) return "iOS";
  return "Other";
}
