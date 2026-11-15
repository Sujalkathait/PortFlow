import { prisma } from './prisma';

let isConnected = false;
let lastCheckTime = 0;
const DB_HEALTH_CACHE_TTL_MS = 10000; // 10-second heartbeat cache to protect DB against connection exhaustion
let heartbeatTimer: NodeJS.Timeout | null = null;

/**
 * Check if the database connection is currently alive.
 * Uses a non-blocking TTL cache to handle high-concurrency health check probes (e.g. 3000 VUs)
 * without exhausting the connection pool.
 */
export async function checkDatabaseConnection(force = false): Promise<boolean> {
    const now = Date.now();
    if (!force && (now - lastCheckTime < DB_HEALTH_CACHE_TTL_MS)) {
        return isConnected;
    }

    lastCheckTime = now;
    try {
        await prisma.$queryRaw`SELECT 1 as alive`;
        isConnected = true;
        return true;
    } catch (err: any) {
        // If query fails, mark disconnected without crashing
        isConnected = false;
        return false;
    }
}

/**
 * Background Heartbeat probe to keep database pool active and non-blocking
 */
export function startDatabaseHeartbeat(intervalMs = 15000): void {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (process.env.NODE_ENV === 'test') return;

    heartbeatTimer = setInterval(async () => {
        await checkDatabaseConnection(true);
    }, intervalMs);

    // Prevent heartbeat from blocking process exit
    if (heartbeatTimer.unref) {
        heartbeatTimer.unref();
    }
}

/**
 * Initialize Database (Schema is managed by Prisma, verifies connection and starts background heartbeat)
 */
export async function initDatabase(): Promise<void> {
    try {
        console.log('[Database] Verifying database connection via Prisma...');
        await checkDatabaseConnection(true);
        if (isConnected) {
            console.log('[Database] Database connection is ready.');
            startDatabaseHeartbeat();
        } else {
            console.warn('[Database] Could not connect to the database (in-memory resilience active).');
        }
    } catch (err: any) {
        console.error('[Database] Initialization warning:', err.message);
    }
}

export function isDatabaseConnected(): boolean {
    return isConnected;
}

