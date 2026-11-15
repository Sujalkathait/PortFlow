import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isQuiet = process.env.NODE_ENV === 'production' || process.env.LOAD_TEST === 'true' || process.env.NODE_ENV === 'test';

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: isQuiet ? ['error'] : ['error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
