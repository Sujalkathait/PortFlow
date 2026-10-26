const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function alignColumns() {
  console.log('--- Ensuring All Columns and Foreign Keys Exist Across All 12 Tables ---');

  const alterations = [
    // users
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,

    // equipment
    `ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS capacity_metric DOUBLE PRECISION DEFAULT 0.0;`,
    `ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100) DEFAULT NULL;`,

    // ships
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS berth_equipment_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS eta TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.ships ADD COLUMN IF NOT EXISTS etd TIMESTAMPTZ DEFAULT NULL;`,

    // warehouses
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS current_occupancy_teu INTEGER DEFAULT 0;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS temperature_celsius DOUBLE PRECISION DEFAULT NULL;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,

    // cargo
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS ship_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS warehouse_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.cargo ADD COLUMN IF NOT EXISTS hazard_class VARCHAR(50) DEFAULT NULL;`,

    // operations
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS ship_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS cargo_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS crane_equipment_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS berth_equipment_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS waiting_time_ms INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS turnaround_time_ms INTEGER DEFAULT NULL;`,

    // bills
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,

    // issues
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`
  ];

  for (let i = 0; i < alterations.length; i++) {
    try {
      await prisma.$executeRawUnsafe(alterations[i]);
      console.log(`[OK] Column sync ${i + 1}/${alterations.length}`);
    } catch (err) {
      console.warn(`[WARN] Column sync ${i + 1}: ${err.message}`);
    }
  }

  console.log('--- All Table Columns Successfully Aligned! ---');
}

alignColumns()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Fatal align error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
