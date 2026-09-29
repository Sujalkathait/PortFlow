import { prisma } from '../config/prisma';
import { IUserRepository } from '../interfaces/repositories.interface';
import { UserRecord } from '../models/user.model';

export { UserRecord };

function normalize(row: any): UserRecord {
    if (!row) return row;
    return {
        ...row,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
    };
}

export class UserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<UserRecord | null> {
        const cleanEmail = email.trim().toLowerCase();
        try {
            const user = await prisma.user.findFirst({
                where: { email: { equals: cleanEmail, mode: 'insensitive' } }
            });
            return user ? normalize(user) : null;
        } catch (err: any) {
            console.error('[UserRepository] DB findByEmail error:', err.message);
            return null;
        }
    }

    async findById(id: number): Promise<UserRecord | null> {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            return user ? normalize(user) : null;
        } catch (err: any) {
            console.error('[UserRepository] DB findById error:', err.message);
            return null;
        }
    }

    async create(data: {
        email: string;
        password_hash: string;
        full_name: string;
        role: string;
    }): Promise<UserRecord> {
        const cleanEmail = data.email.trim().toLowerCase();
        try {
            const user = await prisma.user.create({
                data: {
                    email: cleanEmail,
                    password_hash: data.password_hash,
                    full_name: data.full_name,
                    role: data.role,
                }
            });
            return normalize(user);
        } catch (err: any) {
            console.error('[UserRepository] DB create error:', err.message);
            throw err;
        }
    }

    async count(): Promise<number> {
        try {
            return await prisma.user.count({ where: { deleted_at: null } });
        } catch (err: any) {
            console.error('[UserRepository] DB count error:', err.message);
            return 0;
        }
    }
}

export const userRepository = new UserRepository();
