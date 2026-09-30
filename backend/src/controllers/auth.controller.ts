import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

import { prisma } from '../config/prisma';

// Seed or verify default accounts
export async function seedDefaultAccounts(): Promise<void> {
    try {
        const adminHash = await bcrypt.hash('Password123!', 10);
        const operatorHash = await bcrypt.hash('Password123!', 10);

        // Upsert ensures the account is created if missing, or reset if soft-deleted/stale
        await prisma.user.upsert({
            where: { email: 'admin@portflow.com' },
            create: {
                email: 'admin@portflow.com',
                password_hash: adminHash,
                full_name: 'Port Administrator',
                role: 'Admin',
            },
            update: { password_hash: adminHash, deleted_at: null, deleted_by: null },
        });

        await prisma.user.upsert({
            where: { email: 'operator@portflow.com' },
            create: {
                email: 'operator@portflow.com',
                password_hash: operatorHash,
                full_name: 'Crane Operator',
                role: 'Operator',
            },
            update: { password_hash: operatorHash, deleted_at: null, deleted_by: null },
        });

        console.log('[Auth] Verified default demo accounts: admin@portflow.com / operator@portflow.com with Password123!');
    } catch (err: any) {
        console.error('[Auth] Notice: Could not seed default accounts:', err.message);
    }
}

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, fullName, role } = req.body;
        const result = await authService.register({
            email,
            password,
            full_name: fullName,
            role,
        });

        res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            token: result.token,
            user: result.user,
        });
    } catch (err: any) {
        console.error('[Auth] Register error:', err.message);
        const status = err.message.includes('already exists') ? 409 : err.message.includes('JWT_SECRET') ? 500 : 400;
        res.status(status).json({ success: false, message: err.message || 'Registration failed.' });
    }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });

        res.status(200).json({
            success: true,
            message: 'Signed in successfully.',
            token: result.token,
            user: result.user,
        });
    } catch (err: any) {
        console.error('[Auth] Login error:', err.message);
        const status = err.message.includes('JWT_SECRET') ? 500 : 401;
        res.status(status).json({ success: false, message: err.message || 'Authentication failed.' });
    }
}

// GET /api/auth/me
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated.' });
        return;
    }

    res.status(200).json({
        success: true,
        user: req.user,
    });
}
