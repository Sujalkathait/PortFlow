const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function completeAlignment() {
  console.log('--- Completing Final Schema Alignment in Supabase PostgreSQL ---');

  const statements = [
    // warehouses
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS code VARCHAR(50);`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS current_occupancy_teu INTEGER DEFAULT 0;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS temperature_celsius DOUBLE PRECISION DEFAULT NULL;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,

    // trucks
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS license_plate VARCHAR(50);`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50) DEFAULT '+1-555-0199';`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS transport_company VARCHAR(150) DEFAULT 'Port Logistics';`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS max_payload_tons DOUBLE PRECISION DEFAULT 30.0;`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;`,

    // bills
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS ship_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS cargo_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) DEFAULT 'Global Shipping Client';`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS docking_fee DOUBLE PRECISION DEFAULT 0.0;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS crane_usage_fee DOUBLE PRECISION DEFAULT 0.0;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS storage_fee DOUBLE PRECISION DEFAULT 0.0;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION DEFAULT 0.0;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,

    // issues
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(50);`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'Medium';`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS reported_by_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS equipment_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT NULL;`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;`,

    // system_logs
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'INFO';`,
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'Scheduler';`,
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';`,
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT NULL;`,
    `ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT NULL;`,

    // operations
    `ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS process_id VARCHAR(50);`
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      await prisma.$executeRawUnsafe(statements[i]);
      console.log(`[OK] Statement ${i + 1}/${statements.length}`);
    } catch (err) {
      console.warn(`[WARN] Statement ${i + 1}: ${err.message}`);
    }
  }

  console.log('--- Alignment Statements Finished Successfully! ---');
}

completeAlignment()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('Fatal error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
