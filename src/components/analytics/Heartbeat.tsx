"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  PresenceController,
  startLivePresenceSession,
} from "@/lib/presenceService";

export function AnalyticsHeartbeat() {
  const pathname = usePathname() || "/";
  const { user, isLoading } = useAuth();
  const presenceRef = useRef<PresenceController | null>(null);
  const initialPathRef = useRef<string>(pathname);
  initialPathRef.current = pathname;

  // Single tab-lifetime presence controller (never torn down on auth or route change)
  useEffect(() => {
    presenceRef.current = startLivePresenceSession({
      uid: user?.id || null,
      email: user?.email || null,
      displayName: user?.name || (user?.id ? "مستخدم مسجل" : "زائر"),
      role: user?.role || "GUEST",
      initialPath: initialPathRef.current,
    });

    return () => {
      presenceRef.current?.teardown();
      presenceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync identity seamlessly when session finishes loading or user logs in/out
  useEffect(() => {
    if (isLoading) return;
    presenceRef.current?.syncIdentity({
      uid: user?.id || null,
      email: user?.email || null,
      displayName: user?.name || (user?.id ? "مستخدم مسجل" : "زائر"),
      role: user?.role || "GUEST",
    });
  }, [user?.id, user?.email, user?.name, user?.role, isLoading]);

  // Update active route / clinic module immediately on navigation
  useEffect(() => {
    presenceRef.current?.updateActivity(
      pathname,
      user?.name || (user?.id ? "مستخدم مسجل" : "زائر")
    );
  }, [pathname, user?.id, user?.name]);

  return null;
}
