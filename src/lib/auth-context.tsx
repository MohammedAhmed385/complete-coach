"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "ADMIN" | "CLIENT" | "PATIENT" | "PHYSIOTHERAPIST";

// ── Authorized Admin Gmail Users ──
export const ADMIN_EMAILS: string[] = [
  "yoseefyossefyoseef@gmail.com",
  "hsksjsgutt@gmail.com",
  "atfm03716@gmail.com",
  "youseefyossefyoseef@gmail.com", // alias with u for backward compatibility
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
  if (normalized.includes("hsksjsgutt")) return "المدير المعتمد (hsksjsgutt)";
  if (normalized.includes("atfm03716")) return "المدير المعتمد (atfm03716)";
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
  loginAsAdmin: (adminEmail?: string) => boolean;
  loginAsClient: (email?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  adminEmails: ADMIN_EMAILS,
  signInWithGoogle: async () => {},
  loginAsAdmin: () => false,
  loginAsClient: () => {},
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

    // Listen to Supabase auth state change (e.g. from Google OAuth)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const email = session.user.email || "";
          const isAdminUser = checkIsAdminEmail(email);

          const authUser: AuthUser = {
            id: session.user.id,
            email: email,
            name:
              session.user.user_metadata?.full_name ||
              (isAdminUser ? getAdminDisplayName(email) : email.split("@")[0] || "عميل"),
            role: isAdminUser ? "ADMIN" : "CLIENT",
            avatarUrl: session.user.user_metadata?.avatar_url,
          };
          setUser(authUser);
          saveUserCookie(authUser);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
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

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.warn("Supabase Google Auth warning:", error.message);
        // Default to primary admin login if OAuth is not configured in Supabase
        loginAsAdmin(PRIMARY_ADMIN_EMAIL);
      }
    } catch {
      loginAsAdmin(PRIMARY_ADMIN_EMAIL);
    }
  };

  // Direct login as Admin with one of the authorized admin Gmails
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

  // Direct login as Client (or Admin if admin email is provided)
  const loginAsClient = (email = "client@revive.com", name = "عميل / مريض") => {
    const isAdminUser = checkIsAdminEmail(email);
    const authUser: AuthUser = {
      id: isAdminUser ? `admin-${email.split("@")[0]}` : `client-${Date.now()}`,
      name: isAdminUser ? getAdminDisplayName(email) : name,
      email: email,
      role: isAdminUser ? "ADMIN" : "CLIENT",
      avatarUrl: isAdminUser
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
        : null,
    };
    setUser(authUser);
    saveUserCookie(authUser);
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

  // Strict check: Only ADMIN role or matching authorized email has isAdmin = true
  const isAdmin =
    user?.role === "ADMIN" || checkIsAdminEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        adminEmails: ADMIN_EMAILS,
        signInWithGoogle,
        loginAsAdmin,
        loginAsClient,
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
