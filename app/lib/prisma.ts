// lib/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma";

declare global {
  // Allow global `prisma` across hot reloads in development
  var prisma: PrismaClient | undefined;
}

const client = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = client;

export default client;
