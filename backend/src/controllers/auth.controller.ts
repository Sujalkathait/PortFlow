import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Seed initial administrative & operator accounts if users table is empty.
 */
export async function seedDefaultAccounts(): Promise<void> {
    try {
        const count = await userRepository.count();
        if (count === 0) {
            console.log('[Auth] Seeding initial default accounts in PostgreSQL...');
            const adminHash = await bcrypt.hash('Password123!', 10);
            const operatorHash = await bcrypt.hash('Password123!', 10);

            await userRepository.create({
                email: 'admin@portflow.com',
                password_hash: adminHash,
                full_name: 'Port Administrator',
                role: 'Admin',
            });

            await userRepository.create({
                email: 'operator@portflow.com',
                password_hash: operatorHash,
                full_name: 'Crane Operator',
                role: 'Operator',
            });

            console.log('[Auth] Default accounts seeded: admin@portflow.com / operator@portflow.com');
        }
    } catch (err: any) {
        console.error('[Auth] Notice: Could not seed default accounts:', err.message);
    }
}

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, fullName, role } = req.body;

        if (!email || !EMAIL_REGEX.test(email)) {
            res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
            return;
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
            return;
        }

        if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
            res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
            return;
        }

        const validRole = role === 'Admin' ? 'Admin' : 'Operator';

        const existing = await userRepository.findByEmail(email);
        if (existing) {
            res.status(409).json({ success: false, message: 'An account with this email already exists.' });
            return;
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await userRepository.create({
            email,
            password_hash,
            full_name: fullName.trim(),
            role: validRole,
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role as 'Admin' | 'Operator',
            fullName: user.full_name,
        });

        res.status(201).json({
            success: true,
            message: 'Account registered successfully.',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        });
    } catch (err: any) {
        console.error('[Auth] Register error:', err);
        res.status(500).json({ success: false, message: 'Registration failed due to a server error.' });
    }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role as 'Admin' | 'Operator',
            fullName: user.full_name,
        });

        res.status(200).json({
            success: true,
            message: 'Signed in successfully.',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        });
    } catch (err: any) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ success: false, message: 'Sign in failed due to a server error.' });
    }
}

/**
 * GET /api/auth/me
 */
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
