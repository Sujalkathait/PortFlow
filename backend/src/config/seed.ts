import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function seedDatabase(force: boolean = false): Promise<void> {
    try {
        console.log('[Seed] Checking database seed status...');

        // 1. Ensure Default Operator Account (needed for demo login)
        const operatorHash = await bcrypt.hash('Password123!', 10);
        await prisma.user.upsert({
            where: { email: 'operator@portflow.com' },
            create: {
                email: 'operator@portflow.com',
                password_hash: operatorHash,
                full_name: 'Terminal Operator',
                role: 'Operator',
            },
            update: { password_hash: operatorHash, deleted_at: null, deleted_by: null },
        });

        console.log('[Seed] Default operator account ensured.');
        console.log('[Seed] Database initialization completed. Use the app CRUD to add ships, equipment, cargo, and operations.');
    } catch (err: any) {
        console.error('[Seed] Database seeding warning:', err.message);
    }
}
