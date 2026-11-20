import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { isBot, parseDevice, parseBrowser, parseOS } from "./utils";
import prisma from "./db";

const VISITOR_COOKIE = "pm_vid";
const SESSION_COOKIE = "pm_sid";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function hashFingerprint(ip: string, ua: string): string {
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 16);
}

export async function getVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  let vid = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!vid) {
    vid = randomUUID();
  }
  return vid;
}

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sid = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sid) {
    sid = randomUUID();
  }
  return sid;
}

interface TrackPayload {
  page: string;
  referrer?: string;
  userAgent: string;
  ip: string;
  userId?: string;
  country?: string;
  city?: string;
}

export async function trackPageVisit(payload: TrackPayload) {
  const { page, referrer, userAgent, ip, userId, country, city } = payload;

  if (isBot(userAgent)) return null;

  const visitorId = await getVisitorId();
  const sessionId = await getSessionId();
  const fingerprint = hashFingerprint(ip, userAgent);
  const device = parseDevice(userAgent);
  const browser = parseBrowser(userAgent);
  const os = parseOS(userAgent);

  // Create page visit
  const visit = await prisma.pageVisit.create({
    data: {
      visitorId,
      fingerprint,
      userId,
      page,
      referrer: referrer || null,
      userAgent,
      device,
      browser,
      os,
      country: country || null,
      city: city || null,
      sessionId,
      isBot: false,
    },
  });

  // Upsert session
  const existing = await prisma.visitorSession.findFirst({
    where: { id: sessionId },
  });

  if (existing) {
    await prisma.visitorSession.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
        pageCount: { increment: 1 },
        duration: Math.floor(
          (Date.now() - new Date(existing.startedAt).getTime()) / 1000
        ),
      },
    });
  } else {
    await prisma.visitorSession.create({
      data: {
        id: sessionId,
        visitorId,
        userId,
        device,
        country: country || null,
      },
    });
  }

  return { visit, visitorId, sessionId };
}

export async function recordHeartbeat(
  visitorId: string,
  sessionId: string,
  page: string
) {
  await prisma.visitorHeartbeat.create({
    data: { visitorId, sessionId, page },
  });

  // Update session last active
  await prisma.visitorSession.updateMany({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}

export async function getAnalyticsStats(range: string = "7d") {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const prevStart = new Date(
    startDate.getTime() - (now.getTime() - startDate.getTime())
  );

  // Current period
  const [totalVisits, uniqueVisitors, todayVisits, todayUnique] =
    await Promise.all([
      prisma.pageVisit.count({
        where: { createdAt: { gte: startDate }, isBot: false },
      }),
      prisma.pageVisit
        .findMany({
          where: { createdAt: { gte: startDate }, isBot: false },
          select: { visitorId: true },
          distinct: ["visitorId"],
        })
        .then((r) => r.length),
      prisma.pageVisit.count({
        where: {
          createdAt: { gte: new Date(now.toDateString()) },
          isBot: false,
        },
      }),
      prisma.pageVisit
        .findMany({
          where: {
            createdAt: { gte: new Date(now.toDateString()) },
            isBot: false,
          },
          select: { visitorId: true },
          distinct: ["visitorId"],
        })
        .then((r) => r.length),
    ]);

  // Previous period for comparison
  const [prevVisits, prevUnique] = await Promise.all([
    prisma.pageVisit.count({
      where: { createdAt: { gte: prevStart, lt: startDate }, isBot: false },
    }),
    prisma.pageVisit
      .findMany({
        where: { createdAt: { gte: prevStart, lt: startDate }, isBot: false },
        select: { visitorId: true },
        distinct: ["visitorId"],
      })
      .then((r) => r.length),
  ]);

  // Live active (last 5 mins)
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const liveActive = await prisma.visitorHeartbeat
    .findMany({
      where: { timestamp: { gte: fiveMinAgo } },
      select: { visitorId: true },
      distinct: ["visitorId"],
    })
    .then((r) => r.length);

  // Average session duration
  const sessions = await prisma.visitorSession.findMany({
    where: { startedAt: { gte: startDate } },
    select: { duration: true, pageCount: true },
  });
  const avgDuration =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length
        )
      : 0;
  const bounceRate =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s) => s.pageCount <= 1).length / sessions.length) *
            100
        )
      : 0;

  // Top pages
  const topPages = await prisma.pageVisit.groupBy({
    by: ["page"],
    where: { createdAt: { gte: startDate }, isBot: false },
    _count: { page: true },
    orderBy: { _count: { page: "desc" } },
    take: 10,
  });

  // Top referrers
  const topReferrers = await prisma.pageVisit.groupBy({
    by: ["referrer"],
    where: {
      createdAt: { gte: startDate },
      isBot: false,
      referrer: { not: null },
    },
    _count: { referrer: true },
    orderBy: { _count: { referrer: "desc" } },
    take: 10,
  });

  // Device breakdown
  const devices = await prisma.pageVisit.groupBy({
    by: ["device"],
    where: { createdAt: { gte: startDate }, isBot: false },
    _count: { device: true },
  });

  // Browser breakdown
  const browsers = await prisma.pageVisit.groupBy({
    by: ["browser"],
    where: { createdAt: { gte: startDate }, isBot: false },
    _count: { browser: true },
  });

  // Country breakdown
  const countries = await prisma.pageVisit.groupBy({
    by: ["country"],
    where: {
      createdAt: { gte: startDate },
      isBot: false,
      country: { not: null },
    },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });

  // Recent visits
  const recentVisits = await prisma.pageVisit.findMany({
    where: { isBot: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      visitorId: true,
      page: true,
      device: true,
      browser: true,
      country: true,
      referrer: true,
      createdAt: true,
    },
  });

  return {
    kpis: {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      todayUnique,
      liveActive,
      avgDuration,
      bounceRate,
      prevVisits,
      prevUnique,
      visitChange: prevVisits
        ? Math.round(((totalVisits - prevVisits) / prevVisits) * 100)
        : 0,
      uniqueChange: prevUnique
        ? Math.round(((uniqueVisitors - prevUnique) / prevUnique) * 100)
        : 0,
    },
    topPages: topPages.map((p) => ({ page: p.page, count: p._count.page })),
    topReferrers: topReferrers.map((r) => ({
      referrer: r.referrer || "Direct",
      count: r._count.referrer,
    })),
    devices: devices.map((d) => ({
      device: d.device || "unknown",
      count: d._count.device,
    })),
    browsers: browsers.map((b) => ({
      browser: b.browser || "unknown",
      count: b._count.browser,
    })),
    countries: countries.map((c) => ({
      country: c.country || "unknown",
      count: c._count.country,
    })),
    recentVisits: recentVisits.map((v) => ({
      ...v,
      visitorId: v.visitorId.slice(0, 8) + "...",
    })),
  };
}
