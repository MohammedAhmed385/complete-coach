import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const isDbConfigured = (): boolean => {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  // If URL contains dummy placeholder domains, it's not a real DB connection
  if (
    url.includes("your-project") ||
    url.includes("example.com") ||
    url.includes("localhost:5432")
  ) {
    return false;
  }
  return true;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
