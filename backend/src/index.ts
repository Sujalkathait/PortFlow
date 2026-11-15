import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cluster from 'node:cluster';
import os from 'node:os';
import { apiRouter } from './routes/api';
import { initDatabase, checkDatabaseConnection, isDatabaseConnected } from './config/database';
import { seedDefaultAccounts } from './controllers/auth.controller';
import { seedDatabase } from './config/seed';
import { setupGraphQL } from './graphql';

// Enable Round-Robin socket scheduling on Windows for optimal load distribution across workers
if (cluster.isPrimary) {
    (cluster as any).schedulingPolicy = (cluster as any).SCHED_RR;
}

const app = express();
const port = Number(process.env.PORT || 10000);

// Security Headers (relaxed slightly on /graphql for Apollo Sandbox if requested in dev)
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
}));

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 3000, // Generous limit for real-time telemetry and polling
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.LOAD_TEST === 'true',
    message: { success: false, message: 'Too many requests. Please wait a moment and try again.' },
});

app.use('/api', apiLimiter);

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!corsOrigin || corsOrigin === '*') {
            return callback(null, true);
        }
        const allowed = corsOrigin.split(',').map(s => s.trim());
        if (allowed.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // Dev fallback
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'Accept', 'Origin', 'X-Requested-With'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.get('/health', (_req: Request, res: Response) => {
    // Ultra-fast, non-blocking health check powered by background heartbeat cache (<1ms response time)
    res.status(200).json({
        status: 'ok',
        service: 'PortFlow Backend',
        environment: process.env.NODE_ENV || 'production',
        databaseConnected: isDatabaseConnected(),
        graphqlReady: true,
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'PortFlow Dual REST & GraphQL Engine',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            health: '/health',
            restApi: '/api',
            graphql: '/graphql',
            docs: 'https://github.com/Sujalkathait/PortFlow',
        },
    });
});

async function startServer() {
    // 1. Initialize GraphQL Apollo Server at /graphql
    await setupGraphQL(app);

    // 2. Mount REST API Router at /api
    app.use('/api', apiRouter);

    // 3. 404 Handler for unmatched paths
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
        });
    });

    // 4. Global Error Handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[ServerError]', err.stack || err.message || err);
        res.status(err.status || 500).json({
            success: false,
            message: process.env.NODE_ENV === 'development'
                ? err.message || 'Internal Server Error'
                : 'An unexpected internal server error occurred.',
        });
    });

    // 5. Start HTTP Listener with large backlog (65535) for high-concurrency surge handling
    const server = app.listen(port, '0.0.0.0', 65535, async () => {
        const workerTag = cluster.isWorker ? `[Worker ${process.pid}]` : '[SingleProcess]';
        console.log(`  ⚓ ${workerTag} PortFlow server active on port ${port}`);

        await initDatabase();
        if (!cluster.isWorker) {
            if (isDatabaseConnected()) {
                await seedDefaultAccounts();
                await seedDatabase();
            } else {
                console.warn('[Auth] Skipping demo-account seeding because the database is unavailable.');
            }
        }
    });

    // High-concurrency TCP & Keep-Alive socket tuning
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    (server as any).requestTimeout = 30000;
    if ('maxRequestsPerSocket' in server) {
        (server as any).maxRequestsPerSocket = 0; // Unlimited keep-alive reuse per socket
    }

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n[Server Error] Port ${port} is already in use.`);
            console.error(`Set PORT to an unused value, or stop the existing PortFlow process before starting another instance.`);
        } else {
            console.error('\n[Server Error] Server failed to start:', err);
        }
        process.exitCode = 1;
    });

    const handleShutdown = (signal: string) => {
        console.log(`\n[PID ${process.pid}] Received ${signal}. Gracefully shutting down HTTP server...`);
        server.close(() => {
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
}

// Multi-Core Cluster Supervisor
const isClusterEnabled = process.env.ENABLE_CLUSTER !== 'false' && process.env.NODE_ENV !== 'test';

if (cluster.isPrimary && isClusterEnabled) {
    const numWorkers = process.env.WORKER_COUNT
        ? parseInt(process.env.WORKER_COUNT, 10)
        : Math.min(os.cpus().length, 6);

    console.log(`\n======================================================`);
    console.log(`  ⚓ PortFlow Multi-Core Clustered Engine`);
    console.log(`  Primary PID: ${process.pid} | Cores: ${os.cpus().length} | Worker Pools: ${numWorkers}`);
    console.log(`  Port: ${port}`);
    console.log(`  Health Check: http://localhost:${port}/health`);
    console.log(`  GraphQL Endpoint: http://localhost:${port}/graphql`);
    console.log(`======================================================\n`);

    (async () => {
        try {
            await initDatabase();
            if (isDatabaseConnected()) {
                await seedDefaultAccounts();
                await seedDatabase();
            }
        } catch (err: any) {
            console.warn('[Cluster Primary] Database initialization note:', err.message);
        }

        console.log(`[Cluster Primary] Spawning ${numWorkers} worker processes across CPU cores...`);
        for (let i = 0; i < numWorkers; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.warn(`[Cluster] Worker ${worker.process.pid} exited (${signal || code}). Auto-recovering worker...`);
            cluster.fork();
        });

        const shutdownPrimary = (sig: string) => {
            console.log(`\n[Cluster Primary] Received ${sig}. Terminating all workers...`);
            for (const id in cluster.workers) {
                cluster.workers[id]?.kill();
            }
            process.exit(0);
        };
        process.on('SIGINT', () => shutdownPrimary('SIGINT'));
        process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
    })().catch(err => {
        console.error('[Cluster Primary Fatal Error]', err);
    });
} else {
    startServer().catch(err => {
        console.error('[FatalStartupError]', err);
        process.exit(1);
    });
}

export default app;
