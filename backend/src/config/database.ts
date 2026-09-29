import { prisma } from './prisma';

let isConnected = false;

/**
 * Check if the database connection is currently alive.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        // A simple query to check connection
        await prisma.$queryRaw`SELECT 1 as alive`;
        isConnected = true;
        return true;
    } catch (err: any) {
        console.error('[Database] Connection check failed:', err.message);
        isConnected = false;
        return false;
    }
}

/**
 * Initialize Database (Schema is managed by Prisma, so this just checks connection)
 */
export async function initDatabase(): Promise<void> {
    try {
        console.log('[Database] Verifying database connection via Prisma...');
        await checkDatabaseConnection();
        if (isConnected) {
            console.log('[Database] Database connection is ready.');
        } else {
            console.warn('[Database] Could not connect to the database.');
        }
    } catch (err: any) {
        console.error('[Database] Initialization warning:', err.message);
    }
}

export function isDatabaseConnected(): boolean {
    return isConnected;
}
