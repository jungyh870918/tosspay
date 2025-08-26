// lib/prisma.ts
// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../generated/prisma'


const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'error', 'warn'], // 필요에 따라 로그
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
