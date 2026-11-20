"use client";

import { useEffect } from "react";

export function AnalyticsHeartbeat() {
  useEffect(() => {
    // Get cookies from document (non-httponly backup check)
    const getCookieValue = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };

    const sendHeartbeat = () => {
      const visitorId = getCookieValue("pm_vid") || "anonymous";
      const sessionId = getCookieValue("pm_sid") || "";

      fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          sessionId,
          page: window.location.pathname,
        }),
      }).catch(() => {});
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 60 seconds
    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
