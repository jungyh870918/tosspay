// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// 하나만 쓰세요: DATABASE_URL 또는 MEDIPAY_DATABASE_URL
const connectionString =
    process.env.DATABASE_URL ?? process.env.MEDIPAY_DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL (or MEDIPAY_DATABASE_URL) is not set');
}

// ✅ Driver Adapter에 "직접" 연결 문자열 전달
const adapter = new PrismaNeon({ connectionString });

// 개발환경에서 싱글톤 패턴 권장
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
