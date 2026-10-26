const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function inspectAndFix() {
  const tables = ['warehouses', 'cargo', 'operations', 'trucks', 'gate_passes', 'customs_inspections', 'bills', 'issues', 'system_logs', 'equipment', 'ships', 'users'];
  
  for (const t of tables) {
    const cols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`);
    console.log(`Table ${t} columns:`, cols.map(c => c.column_name).join(', '));
  }

  // Add status to warehouses
  await prisma.$executeRawUnsafe(`ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active'`);
  console.log('Added status to warehouses.');
}

inspectAndFix()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
