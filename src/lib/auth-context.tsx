"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "ADMIN" | "PHYSIOTHERAPIST" | "PATIENT";

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
  loginAsAdmin: (passcode?: string) => boolean;
  loginWithEmail: (email: string, role?: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signInWithGoogle: async () => {},
  loginAsAdmin: () => false,
  loginWithEmail: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from cookie/session on mount
  useEffect(() => {
    try {
      // Check document cookie for pm_auth
      const match = document.cookie.match(/(?:^|; )pm_auth=([^;]*)/);
      if (match) {
        const decoded = JSON.parse(decodeURIComponent(match[1]));
        setUser(decoded);
      } else {
        // Default to guest or physiotherapist
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Listen to Supabase auth state change
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || "",
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "د. المعالج",
            role:
              session.user.email === "admin@revive.com" ||
              session.user.user_metadata?.role === "ADMIN"
                ? "ADMIN"
                : "PHYSIOTHERAPIST",
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
        console.warn("Supabase Google Auth not configured yet, simulating login:", error.message);
        // Fallback for local demo if keys are placeholders
        const demoUser: AuthUser = {
          id: `google-${Date.now()}`,
          name: "د. أحمد (Google)",
          email: "user.revive@gmail.com",
          role: "PHYSIOTHERAPIST",
          avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face",
        };
        setUser(demoUser);
        saveUserCookie(demoUser);
      }
    } catch {
      // Mock fallback
      const demoUser: AuthUser = {
        id: `google-${Date.now()}`,
        name: "د. أحمد (Google)",
        email: "user.revive@gmail.com",
        role: "PHYSIOTHERAPIST",
      };
      setUser(demoUser);
      saveUserCookie(demoUser);
    }
  };

  const loginAsAdmin = (passcode?: string) => {
    // Default admin code is 'revive2026' or 'admin' or direct
    if (!passcode || passcode === "revive2026" || passcode === "admin" || passcode === "123456") {
      const adminUser: AuthUser = {
        id: "admin-master-001",
        name: "المدير العام (Super Admin)",
        email: "admin@revive.com",
        role: "ADMIN",
        avatarUrl: null,
      };
      setUser(adminUser);
      saveUserCookie(adminUser);
      return true;
    }
    return false;
  };

  const loginWithEmail = (email: string, role: Role = "PHYSIOTHERAPIST") => {
    const customUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0] || "طبيب معالج",
      email: email,
      role: role,
    };
    setUser(customUser);
    saveUserCookie(customUser);
  };

  const logout = () => {
    setUser(null);
    saveUserCookie(null);
    supabase.auth.signOut().catch(() => {});
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signInWithGoogle,
        loginAsAdmin,
        loginWithEmail,
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
