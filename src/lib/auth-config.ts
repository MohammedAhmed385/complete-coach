export type Role = "ADMIN" | "CLIENT" | "PATIENT" | "PHYSIOTHERAPIST";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt?: string;
}

// Authorized Admin Emails (can sign up directly as Admin without an invite code)
export const ADMIN_EMAILS: string[] = [
  "yoseefyossefyoseef@gmail.com",
  "hsksjsgutt@gmail.com",
  "atfm03716@gmail.com",
  "youseefyossefyoseef@gmail.com", // alias
];

export const PRIMARY_ADMIN_EMAIL = "yoseefyossefyoseef@gmail.com";
export const ADMIN_EMAIL = PRIMARY_ADMIN_EMAIL;

export const ADMIN_SIGNUP_CODE_DEFAULT = "REVIVE-ADMIN-2026";

export function getAdminSignupCode(): string {
  return process.env.ADMIN_SIGNUP_CODE || ADMIN_SIGNUP_CODE_DEFAULT;
}

export const SESSION_COOKIE_NAME = "pm_session";
export const DISPLAY_COOKIE_NAME = "pm_auth";

export const checkIsAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
};

export const getAdminDisplayName = (email?: string | null): string => {
  if (!email) return "كابتن يوسف (Admin)";
  const normalized = email.toLowerCase().trim();
  if (normalized.includes("hsksjsgutt")) return "المدير (hsksjsgutt)";
  if (normalized.includes("atfm03716")) return "المدير (atfm03716)";
  return "كابتن يوسف (Admin)";
};
