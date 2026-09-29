import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'portflow-production-jwt-secret-key-change-in-env';

export interface AuthUser {
    id: number;
    email: string;
    role: 'Admin' | 'Operator';
    fullName: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

/**
 * Generate a signed JWT token for an authenticated user.
 */
export function generateToken(user: AuthUser): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Middleware: Verify Bearer JWT token from Authorization header.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Fallback: check x-user-email for backward compatibility if present
        const fallbackEmail = req.headers['x-user-email'] as string;
        if (fallbackEmail) {
            req.user = {
                id: 1,
                email: fallbackEmail,
                role: fallbackEmail.includes('admin') ? 'Admin' : 'Operator',
                fullName: fallbackEmail.includes('admin') ? 'Administrator' : 'Operator',
            };
            return next();
        }

        res.status(401).json({
            success: false,
            message: 'Authentication required. Missing or invalid Bearer token.',
        });
        return;
    }

    const token = authHeader.substring(7).trim();
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        next();
    } catch (err: any) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication session. Please sign in again.',
        });
    }
}

/**
 * Middleware: Restrict access to specified roles (e.g. Admin).
 */
export function requireRole(allowedRoles: ('Admin' | 'Operator')[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}.`,
            });
            return;
        }

        next();
    };
}
