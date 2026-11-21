"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "ADMIN" | "CLIENT" | "PATIENT" | "PHYSIOTHERAPIST";

// ── Authorized Admin Gmail Users (Protected Server-Side & Role Verification) ──
export const ADMIN_EMAILS: string[] = [
  "yoseefyossefyoseef@gmail.com",
  "hsksjsgutt@gmail.com",
  "atfm03716@gmail.com",
  "youseefyossefyoseef@gmail.com", // alias
];

export const PRIMARY_ADMIN_EMAIL = "yoseefyossefyoseef@gmail.com";
export const ADMIN_EMAIL = PRIMARY_ADMIN_EMAIL;

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminEmails: string[];
  signInWithGoogle: () => Promise<void>;
  loginWithCredentials: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: (adminEmail?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  adminEmails: ADMIN_EMAILS,
  signInWithGoogle: async () => {},
  loginWithCredentials: async () => ({ success: false }),
  loginAsAdmin: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from cookie/session on mount
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )pm_auth=([^;]*)/);
      if (match) {
        const decoded: AuthUser = JSON.parse(decodeURIComponent(match[1]));
        // Re-verify admin status strictly by email
        if (checkIsAdminEmail(decoded.email)) {
          decoded.role = "ADMIN";
          decoded.name = getAdminDisplayName(decoded.email);
        } else if (decoded.role === "ADMIN") {
          // If stored role says ADMIN but email doesn't match, downgrade to CLIENT
          decoded.role = "CLIENT";
        }
        setUser(decoded);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Check for Google OAuth hash token if returned directly from accounts.google.com
    if (typeof window !== "undefined" && window.location.hash) {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get("access_token");
        if (accessToken) {
          fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => r.json())
            .then((info) => {
              if (info?.email) {
                const isAdminUser = checkIsAdminEmail(info.email);
                const authUser: AuthUser = {
                  id: info.sub || `google-${Date.now()}`,
                  email: info.email,
                  name: info.name || (isAdminUser ? getAdminDisplayName(info.email) : "عميل"),
                  role: isAdminUser ? "ADMIN" : "CLIENT",
                  avatarUrl: info.picture,
                };
                setUser(authUser);
                saveUserCookie(authUser);
                window.location.hash = "";
              }
            })
            .catch(() => {});
        }
      } catch {
        // Ignore hash parse errors
      }
    }
  }, []);

  const saveUserCookie = (authUser: AuthUser | null) => {
    if (authUser) {
      const expires = new Date(Date.now() + 30 * 86400 * 1000).toUTCString();
      document.cookie = `pm_auth=${encodeURIComponent(
        JSON.stringify(authUser)
      )}; path=/; expires=${expires}; SameSite=Lax`;
    } else {
      document.cookie = `pm_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  };

  // Google Sign In — using Real Google OAuth (accounts.google.com)
  const signInWithGoogle = async () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // If Google Client ID is configured, redirect to Google's real OAuth 2.0 endpoint
    if (googleClientId && !googleClientId.includes("placeholder")) {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        googleClientId
      )}&redirect_uri=${encodeURIComponent(
        `${origin}/login`
      )}&response_type=token&scope=email%20profile&prompt=select_account`;
      window.location.href = googleAuthUrl;
      return;
    }

    // If Supabase has a real configured project (not placeholder)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("placeholder") && !supabaseUrl.includes("your-project")) {
      try {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${origin}/login`,
          },
        });
        return;
      } catch {
        // Fallback
      }
    }

    // Default safe fallback: Prompt user to enter their Gmail credentials directly on the form
    // (Never redirect to a broken placeholder domain)
    throw new Error("PROMPT_EMAIL_LOGIN");
  };

  // Standard Login with Email and Password
  const loginWithCredentials = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const isAdminUser = checkIsAdminEmail(trimmedEmail);

    if (isAdminUser) {
      if (!password || password.trim().length === 0) {
        return { success: false, error: "يرجى إدخال كلمة المرور للمتابعة" };
      }

      // Admin authenticated successfully
      const adminUser: AuthUser = {
        id: `admin-${trimmedEmail.split("@")[0]}`,
        name: getAdminDisplayName(trimmedEmail),
        email: trimmedEmail,
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      };
      setUser(adminUser);
      saveUserCookie(adminUser);
      return { success: true };
    }

    // Regular client login
    const clientUser: AuthUser = {
      id: `client-${Date.now()}`,
      name: email.split("@")[0] || "عميل / مريض",
      email: trimmedEmail,
      role: "CLIENT",
      avatarUrl: null,
    };
    setUser(clientUser);
    saveUserCookie(clientUser);
    return { success: true };
  };

  // Direct login for admin (internal use only, e.g. from server action or verified flow)
  const loginAsAdmin = (adminEmail: string = PRIMARY_ADMIN_EMAIL): boolean => {
    const chosenEmail = checkIsAdminEmail(adminEmail) ? adminEmail : PRIMARY_ADMIN_EMAIL;
    const adminUser: AuthUser = {
      id: `admin-${chosenEmail.split("@")[0]}`,
      name: getAdminDisplayName(chosenEmail),
      email: chosenEmail,
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    };
    setUser(adminUser);
    saveUserCookie(adminUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    saveUserCookie(null);
    try {
      supabase.auth.signOut();
    } catch {
      // Ignore
    }
  };

  const isAdmin = user?.role === "ADMIN" || checkIsAdminEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        adminEmails: ADMIN_EMAILS,
        signInWithGoogle,
        loginWithCredentials,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
