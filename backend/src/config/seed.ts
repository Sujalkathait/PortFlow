export async function seedDatabase(force: boolean = false): Promise<void> {
    try {
        console.log('[Seed] Database seed skipped. No demo data is injected.');
    } catch (err: any) {
        console.error('[Seed] Database seeding error:', err.message);
    }
}
