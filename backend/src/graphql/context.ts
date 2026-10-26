import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { AuthUser } from '../middleware/auth';

export interface GraphQLContext {
    user: AuthUser | null;
    prisma: typeof prisma;
}

export const createGraphQLContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
    let user: AuthUser | null = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const secret = process.env.JWT_SECRET;
        if (secret) {
            try {
                const decoded = jwt.verify(token, secret) as any;
                user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role || 'Operator',
                    fullName: decoded.fullName || decoded.full_name || decoded.email
                };
            } catch {
                // Invalid or expired token - proceed as unauthenticated guest
                user = null;
            }
        }
    }

    return {
        user,
        prisma
    };
};
