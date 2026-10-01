import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api';
import { initDatabase, checkDatabaseConnection, isDatabaseConnected } from './config/database';
import { seedDefaultAccounts } from './controllers/auth.controller';

const app = express();
const port = Number(process.env.PORT || 10000);

// Security middleware
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to API calls only
app.use('/api', apiLimiter);

// CORS configuration for Vercel frontend & production environments
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(s => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
}));

// Request parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Standard security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Production Health Check & Readiness Endpoint
app.get('/health', async (_req: Request, res: Response) => {
    const dbHealthy = await checkDatabaseConnection();
    res.status(200).json({
        status: 'ok',
        service: 'PortFlow Backend',
        environment: process.env.NODE_ENV || 'production',
        databaseConnected: dbHealthy,
        timestamp: new Date().toISOString(),
    });
});

// Root Welcome Endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'PortFlow API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            health: '/health',
            api: '/api',
            docs: 'https://github.com/Sujalkathait/PortFlow',
        },
    });
});

// Mount Main REST API
app.use('/api', apiRouter);

// 404 Route Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    });
});

// Centralized Production Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[ServerError]', err.stack || err.message || err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message || 'Internal Server Error'
            : 'An unexpected internal server error occurred.',
    });
});

// Start Server & Bootstrap Database
const server = app.listen(port, async () => {
    console.log(`\n======================================================`);
    console.log(`  ⚓ PortFlow ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} Backend`);
    console.log(`  Listening on port: ${port}`);
    console.log(`  Health Check: http://localhost:${port}/health`);
    console.log(`  API Base: http://localhost:${port}/api`);
    console.log(`======================================================\n`);

    // Initialize database tables & seed accounts
    await initDatabase();
    if (isDatabaseConnected()) {
        await seedDefaultAccounts();
    } else {
        console.warn('[Auth] Skipping demo-account seeding because the database is unavailable.');
    }
});

server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${port} is already in use.`);
        console.error(`Set PORT to an unused value, or stop the existing PortFlow process before starting another instance.`);
    } else {
        console.error('\n[Server Error] Server failed to start:', err);
    }
    process.exitCode = 1;
});

// Graceful Shutdown for Cloud Orchestration (Render / Docker)
const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down PortFlow server...`);
    server.close(() => {
        console.log('PortFlow HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
