import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth';

export async function seedDefaultAccounts(): Promise<void> {
    try {
        console.log('[Auth] Database account seeding skipped (demo features removed).');
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

// DELETE /api/auth/account
export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated.' });
        return;
    }

    try {
        await authService.deleteAccount(req.user.id, req.user.email);
        res.status(200).json({
            success: true,
            message: 'Your PortFlow account has been deleted successfully.',
        });
    } catch (err: any) {
        console.error('[Auth] Delete account error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to delete account.' });
    }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body;
        const result = await authService.requestPasswordResetOTP(email);
        res.status(200).json(result);
    } catch (err: any) {
        console.error('[Auth] Forgot password error:', err.message);
        res.status(400).json({ success: false, message: err.message || 'Failed to process password reset request.' });
    }
}

// POST /api/auth/verify-otp
export async function verifyOTP(req: Request, res: Response): Promise<void> {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyPasswordResetOTP(email, otp);
        res.status(200).json(result);
    } catch (err: any) {
        console.error('[Auth] Verify OTP error:', err.message);
        res.status(400).json({ success: false, message: err.message || 'OTP verification failed.' });
    }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await authService.resetPasswordWithOTP(email, otp, newPassword);
        res.status(200).json(result);
    } catch (err: any) {
        console.error('[Auth] Reset password error:', err.message);
        res.status(400).json({ success: false, message: err.message || 'Password reset failed.' });
    }
}
