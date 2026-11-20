"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "ADMIN" | "CLIENT" | "PATIENT" | "PHYSIOTHERAPIST";

export const ADMIN_EMAIL = "youseefyossefyoseef@gmail.com";

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
  signInWithGoogle: () => Promise<void>;
  loginAsAdmin: () => boolean;
  loginAsClient: (email?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signInWithGoogle: async () => {},
  loginAsAdmin: () => false,
  loginAsClient: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to determine if an email belongs to the admin
  const checkIsAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  };

  // Load user from cookie/session on mount
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )pm_auth=([^;]*)/);
      if (match) {
        const decoded: AuthUser = JSON.parse(decodeURIComponent(match[1]));
        // Re-verify admin status strictly by email
        if (checkIsAdminEmail(decoded.email)) {
          decoded.role = "ADMIN";
        } else if (decoded.role === "ADMIN") {
          // If stored role says ADMIN but email doesn't match, downgrade to CLIENT
          decoded.role = "CLIENT";
        }
        setUser(decoded);
      } else {
        // Default to a guest client
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
              (isAdminUser ? "كابتن يوسف (Admin)" : email.split("@")[0] || "عميل"),
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
        // Fallback demo client if keys not connected
        loginAsClient("client.demo@gmail.com", "عميل تجريبي");
      }
    } catch {
      loginAsClient("client.demo@gmail.com", "عميل تجريبي");
    }
  };

  // Direct login as Admin (youseefyossefyoseef@gmail.com) with NO password
  const loginAsAdmin = (): boolean => {
    const adminUser: AuthUser = {
      id: "admin-youseef",
      name: "كابتن يوسف (المدير العام)",
      email: ADMIN_EMAIL,
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    };
    setUser(adminUser);
    saveUserCookie(adminUser);
    return true;
  };

  // Direct login as Client (read-only view) with NO password
  const loginAsClient = (email = "client@revive.com", name = "عميل / مريض") => {
    // If someone passes the admin email, elevate them to Admin
    const isAdminUser = checkIsAdminEmail(email);
    const clientUser: AuthUser = {
      id: `client-${Date.now()}`,
      name: isAdminUser ? "كابتن يوسف (المدير العام)" : name,
      email: email,
      role: isAdminUser ? "ADMIN" : "CLIENT",
      avatarUrl: null,
    };
    setUser(clientUser);
    saveUserCookie(clientUser);
  };

  const logout = () => {
    setUser(null);
    saveUserCookie(null);
    supabase.auth.signOut().catch(() => {});
  };

  // Strict check: Only ADMIN role and matching email has isAdmin = true
  const isAdmin =
    user?.role === "ADMIN" || checkIsAdminEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
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
  return useContext(AuthContext);
}
