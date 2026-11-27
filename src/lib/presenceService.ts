import {
  createTabSessionId,
  getOrCreateVisitorIdentity,
} from "@/lib/fingerprint";

export const HEARTBEAT_INTERVAL_MS = 10_000; // 10-second unthrottled Web Worker heartbeat
export const STALE_PRESENCE_THRESHOLD_MS = 45_000; // 45-second authoritative server stale window

export function describeActivityFromPath(pathname: string): string {
  if (!pathname || pathname === "/") return "لوحة التحكم الرئيسية — Home";
  if (pathname === "/contact") return "صفحة التواصل والحجز — Contact Us";
  if (pathname === "/login") return "تسجيل الدخول / إنشاء حساب — Auth";
  if (pathname === "/cases") return "استعراض الحالات السريرية — Cases";
  if (pathname.startsWith("/cases/")) return "عرض وتعديل ملف مريض — Case Details";
  if (pathname === "/add-case") return "تسجيل حالة مريض جديدة — Add Case";
  if (pathname.startsWith("/exercises")) return "مكتبة التمارين العلاجية — Exercises";
  if (pathname.startsWith("/protocols")) return "البروتوكولات التأهيلية — Protocols";
  if (pathname.startsWith("/research")) return "محرك الأبحاث الطبية — Research";
  if (pathname.startsWith("/return-to-play")) return "تقييم العودة للملعب — RTP Scorecard";
  if (pathname.startsWith("/online-followup")) return "المتابعة عن بُعد — Online Follow-up";
  if (pathname.startsWith("/ai-analysis")) return "تحليل الحركة بالذكاء الاصطناعي — AI Motion";
  if (pathname.startsWith("/analytics")) return "لوحة الإحصائيات والبث المباشر — Live Analytics";
  if (pathname.startsWith("/admin")) return "إعدادات الإدارة المركزية — Admin Portal";
  return `تصفح ${pathname}`;
}

/**
 * Spawns an inline Blob Web Worker timer so Chrome / Brave / Edge
 * do not throttle background-tab presence heartbeats to 60+ seconds.
 */
function startUnthrottledInterval(
  callback: () => void,
  intervalMs: number
): () => void {
  if (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof Blob !== "undefined"
  ) {
    try {
      const workerCode = `
        const id = setInterval(() => postMessage('tick'), ${intervalMs});
        onmessage = (e) => { if (e.data === 'stop') { clearInterval(id); close(); } };
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      worker.onmessage = () => callback();
      return () => {
        try {
          worker.postMessage("stop");
          worker.terminate();
          URL.revokeObjectURL(url);
        } catch {
          // Ignore worker cleanup errors
        }
      };
    } catch {
      // Fallback to standard setInterval if CSP blocks blob workers
    }
  }

  const fallbackTimer = setInterval(callback, intervalMs);
  return () => clearInterval(fallbackTimer);
}

export interface PresenceIdentity {
  uid: string | null;
  email: string | null;
  displayName: string;
  role: string;
}

export interface PresenceController {
  updateActivity: (pathname: string, displayName?: string) => void;
  syncIdentity: (identity: PresenceIdentity) => void;
  teardown: () => void;
}

export function startLivePresenceSession(params: {
  uid: string | null;
  email: string | null;
  displayName: string;
  role: string;
  initialPath: string;
}): PresenceController {
  if (typeof window === "undefined") {
    return {
      updateActivity: () => {},
      syncIdentity: () => {},
      teardown: () => {},
    };
  }

  const sessionId = createTabSessionId();
  let currentUid = params.uid || null;
  let currentDisplayName =
    params.displayName || (currentUid ? "مستخدم مسجل" : "زائر");
  let currentPath = params.initialPath || "/";
  let lastRecordedPath = "";

  let destroyed = false;
  let disconnectSent = false;
  let stopWorkerTimer: (() => void) | null = null;
  let resolvedVisitorId = "";
  let resolvedFpHash = "";

  const getInitialReferrer = () => {
    try {
      const ref = document.referrer;
      if (!ref) return "Direct";
      const refUrl = new URL(ref);
      if (refUrl.origin === window.location.origin) return "Direct";
      return refUrl.hostname || ref;
    } catch {
      return "Direct";
    }
  };

  const sendEdgeHeartbeat = (options: {
    registerVisit?: boolean;
    recordPageView?: boolean;
  }) => {
    if (destroyed || !resolvedVisitorId) return;
    const { registerVisit = false, recordPageView = false } = options;

    if (recordPageView) {
      lastRecordedPath = currentPath;
    }

    fetch("/api/analytics/presence", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "heartbeat",
        registerVisit,
        recordPageView,
        referrer: recordPageView ? getInitialReferrer() : undefined,
        sessionId,
        visitorId: resolvedVisitorId,
        fingerprintHash: resolvedFpHash,
        displayName: currentDisplayName.slice(0, 60),
        currentPath: currentPath.slice(0, 140),
        currentActivity: describeActivityFromPath(currentPath).slice(0, 140),
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const sendInstantDisconnect = () => {
    if (disconnectSent) return;
    disconnectSent = true;

    const leavePayload = JSON.stringify({
      action: "leave",
      sessionId,
    });

    let queued = false;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      try {
        const blob = new Blob([leavePayload], { type: "application/json" });
        queued = navigator.sendBeacon("/api/analytics/presence", blob);
      } catch {
        queued = false;
      }
    }

    if (!queued) {
      fetch("/api/analytics/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: leavePayload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  const handleVisibilityOrFocus = () => {
    if (destroyed) return;
    if (document.visibilityState === "visible") {
      disconnectSent = false;
      sendEdgeHeartbeat({ registerVisit: false, recordPageView: false });
    }
  };

  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted && !destroyed) {
      disconnectSent = false;
      sendEdgeHeartbeat({ registerVisit: false, recordPageView: false });
    }
  };

  getOrCreateVisitorIdentity()
    .then((identity) => {
      if (destroyed) return;
      resolvedVisitorId = identity.visitorId;
      resolvedFpHash = identity.fingerprintHash;

      // Immediate initial heartbeat + unique visitor deduplication + first page view
      sendEdgeHeartbeat({ registerVisit: true, recordPageView: true });

      stopWorkerTimer = startUnthrottledInterval(() => {
        if (destroyed) return;
        sendEdgeHeartbeat({ registerVisit: false, recordPageView: false });
      }, HEARTBEAT_INTERVAL_MS);
    })
    .catch(() => {});

  window.addEventListener("pagehide", sendInstantDisconnect);
  window.addEventListener("beforeunload", sendInstantDisconnect);
  document.addEventListener("visibilitychange", handleVisibilityOrFocus);
  window.addEventListener("focus", handleVisibilityOrFocus);
  window.addEventListener("pageshow", handlePageShow);

  return {
    updateActivity: (nextPath: string, nextDisplayName?: string) => {
      if (destroyed) return;
      const normalizedPath = nextPath || "/";
      const pathChanged = normalizedPath !== currentPath;
      const nameChanged =
        Boolean(nextDisplayName) && nextDisplayName !== currentDisplayName;

      currentPath = normalizedPath;
      if (nextDisplayName) currentDisplayName = nextDisplayName;

      if ((pathChanged || nameChanged) && resolvedVisitorId) {
        sendEdgeHeartbeat({
          registerVisit: false,
          recordPageView: normalizedPath !== lastRecordedPath,
        });
      }
    },
    syncIdentity: (nextIdentity: PresenceIdentity) => {
      if (destroyed) return;
      currentUid = nextIdentity.uid || null;
      currentDisplayName =
        nextIdentity.displayName || (currentUid ? "مستخدم مسجل" : "زائر");

      if (resolvedVisitorId) {
        // Re-sync identity on existing sessionId without tearing down or firing `leave`
        sendEdgeHeartbeat({ registerVisit: true, recordPageView: false });
      }
    },
    teardown: () => {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener("pagehide", sendInstantDisconnect);
      window.removeEventListener("beforeunload", sendInstantDisconnect);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handlePageShow);
      if (stopWorkerTimer) stopWorkerTimer();
      sendInstantDisconnect();
    },
  };
}
