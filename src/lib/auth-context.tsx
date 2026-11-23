"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Role,
  AuthUser,
  ADMIN_EMAILS,
  PRIMARY_ADMIN_EMAIL,
  ADMIN_EMAIL,
  DISPLAY_COOKIE_NAME,
  checkIsAdminEmail,
  getAdminDisplayName,
} from "@/lib/auth-config";
import type { SignedAccountBackup } from "@/lib/password";

export type { Role, AuthUser };
export {
  ADMIN_EMAILS,
  PRIMARY_ADMIN_EMAIL,
  ADMIN_EMAIL,
  checkIsAdminEmail,
  getAdminDisplayName,
};

const LOCAL_AUTH_BACKUPS_KEY = "revive_auth_accounts_v1";

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountType: "USER" | "ADMIN";
  adminCode?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  code?: string;
  user?: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminEmails: string[];
  signUp: (params: SignUpParams) => Promise<AuthActionResult>;
  loginWithCredentials: (
    email: string,
    password: string
  ) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  adminEmails: ADMIN_EMAILS,
  signUp: async () => ({ success: false }),
  loginWithCredentials: async () => ({ success: false }),
  logout: async () => {},
});

function loadAccountBackups(): Record<string, SignedAccountBackup> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_BACKUPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, SignedAccountBackup>)
      : {};
  } catch {
    return {};
  }
}

function saveAccountBackup(backup?: SignedAccountBackup | null) {
  if (typeof window === "undefined" || !backup?.email) return;
  try {
    const existing = loadAccountBackups();
    existing[backup.email.toLowerCase().trim()] = backup;
    window.localStorage.setItem(
      LOCAL_AUTH_BACKUPS_KEY,
      JSON.stringify(existing)
    );
  } catch {
    // Ignore localStorage quota or private-mode errors
  }
}

function getAccountBackup(email: string): SignedAccountBackup | null {
  const backups = loadAccountBackups();
  return backups[email.toLowerCase().trim()] || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveDisplayCookie = (authUser: AuthUser | null) => {
    if (typeof document === "undefined") return;
    if (authUser) {
      const expires = new Date(Date.now() + 30 * 86400 * 1000).toUTCString();
      document.cookie = `${DISPLAY_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(authUser)
      )}; path=/; expires=${expires}; SameSite=Lax`;
    } else {
      document.cookie = `${DISPLAY_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            saveDisplayCookie(null);
          }
          return;
        }

        const data = await res.json().catch(() => ({ authenticated: false }));
        if (!cancelled) {
          if (data?.authenticated && data?.user) {
            const verifiedUser = data.user as AuthUser;
            setUser(verifiedUser);
            saveDisplayCookie(verifiedUser);
          } else {
            setUser(null);
            saveDisplayCookie(null);
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          saveDisplayCookie(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = async (params: SignUpParams): Promise<AuthActionResult> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        return {
          success: false,
          code: data?.code,
          error: data?.error || "تعذر إنشاء الحساب، يرجى التحقق من البيانات.",
        };
      }

      const authUser = data.user as AuthUser;
      saveAccountBackup(data.accountBackup as SignedAccountBackup | undefined);
      setUser(authUser);
      saveDisplayCookie(authUser);
      return { success: true, user: authUser };
    } catch {
      return {
        success: false,
        error: "حدث خطأ في الاتصال بالخادم أثناء إنشاء الحساب.",
      };
    }
  };

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const localAccountBackup = getAccountBackup(trimmedEmail);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          localAccountBackup,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        return {
          success: false,
          code: data?.code,
          error:
            data?.error || "تعذر تسجيل الدخول، يرجى التحقق من البريد وكلمة المرور.",
        };
      }

      const authUser = data.user as AuthUser;
      saveAccountBackup(data.accountBackup as SignedAccountBackup | undefined);
      setUser(authUser);
      saveDisplayCookie(authUser);
      return { success: true, user: authUser };
    } catch {
      return {
        success: false,
        error: "حدث خطأ في الاتصال بالخادم أثناء تسجيل الدخول.",
      };
    }
  };

  const logout = async () => {
    setUser(null);
    saveDisplayCookie(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors during logout cleanup
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        adminEmails: ADMIN_EMAILS,
        signUp,
        loginWithCredentials,
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
