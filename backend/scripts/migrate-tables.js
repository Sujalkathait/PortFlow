const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrateMissingTables() {
  console.log('--- Migrating Missing Tables to Supabase PostgreSQL ---');

  const statements = [
    // 1. Trucks Table check & ensure
    `CREATE TABLE IF NOT EXISTS public.trucks (
      id SERIAL PRIMARY KEY,
      license_plate VARCHAR(50) UNIQUE NOT NULL,
      driver_name VARCHAR(120) NOT NULL,
      driver_phone VARCHAR(50) NOT NULL,
      transport_company VARCHAR(150) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Idle',
      max_payload_tons DOUBLE PRECISION NOT NULL DEFAULT 30.0,
      assigned_cargo_id INTEGER DEFAULT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ DEFAULT NULL,
      deleted_by VARCHAR(255) DEFAULT NULL,
      CONSTRAINT fk_trucks_cargo FOREIGN KEY (assigned_cargo_id) REFERENCES public.cargo(id) ON DELETE SET NULL
    );`,

    // 2. Gate Passes Table
    `CREATE TABLE IF NOT EXISTS public.gate_passes (
      id SERIAL PRIMARY KEY,
      pass_number VARCHAR(100) UNIQUE NOT NULL,
      truck_id INTEGER NOT NULL,
      cargo_id INTEGER DEFAULT NULL,
      issued_by_id INTEGER DEFAULT NULL,
      gate_lane VARCHAR(50) NOT NULL DEFAULT 'Gate-In-Lane-1',
      pass_type VARCHAR(50) NOT NULL DEFAULT 'Inbound_Delivery',
      status VARCHAR(50) NOT NULL DEFAULT 'Issued',
      check_in_time TIMESTAMPTZ DEFAULT NULL,
      check_out_time TIMESTAMPTZ DEFAULT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ DEFAULT NULL,
      CONSTRAINT fk_gate_passes_truck FOREIGN KEY (truck_id) REFERENCES public.trucks(id) ON DELETE CASCADE,
      CONSTRAINT fk_gate_passes_cargo FOREIGN KEY (cargo_id) REFERENCES public.cargo(id) ON DELETE SET NULL,
      CONSTRAINT fk_gate_passes_issuer FOREIGN KEY (issued_by_id) REFERENCES public.users(id) ON DELETE SET NULL
    );`,

    // 3. Customs Inspections Table
    `CREATE TABLE IF NOT EXISTS public.customs_inspections (
      id SERIAL PRIMARY KEY,
      inspection_number VARCHAR(100) UNIQUE NOT NULL,
      cargo_id INTEGER NOT NULL,
      inspector_id INTEGER DEFAULT NULL,
      declaration_number VARCHAR(100) NOT NULL,
      inspection_type VARCHAR(50) NOT NULL DEFAULT 'X-Ray_Scan',
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      duty_amount_cents BIGINT NOT NULL DEFAULT 0,
      findings TEXT DEFAULT NULL,
      inspected_at TIMESTAMPTZ DEFAULT NULL,
      cleared_at TIMESTAMPTZ DEFAULT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ DEFAULT NULL,
      CONSTRAINT fk_inspections_cargo FOREIGN KEY (cargo_id) REFERENCES public.cargo(id) ON DELETE CASCADE,
      CONSTRAINT fk_inspections_inspector FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE SET NULL
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_gate_passes_truck ON public.gate_passes(truck_id);`,
    `CREATE INDEX IF NOT EXISTS idx_gate_passes_cargo ON public.gate_passes(cargo_id);`,
    `CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON public.gate_passes(status);`,
    `CREATE INDEX IF NOT EXISTS idx_gate_passes_deleted_at ON public.gate_passes(deleted_at);`,

    `CREATE INDEX IF NOT EXISTS idx_customs_inspections_cargo ON public.customs_inspections(cargo_id);`,
    `CREATE INDEX IF NOT EXISTS idx_customs_inspections_inspector ON public.customs_inspections(inspector_id);`,
    `CREATE INDEX IF NOT EXISTS idx_customs_inspections_status ON public.customs_inspections(status);`,
    `CREATE INDEX IF NOT EXISTS idx_customs_inspections_deleted_at ON public.customs_inspections(deleted_at);`
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[OK] Executed statement ${i + 1}/${statements.length}`);
    } catch (err) {
      console.error(`[ERR] Statement ${i + 1} failed:`, err.message);
    }
  }

  console.log('--- Migration Complete! Re-testing table counts ---');
}

migrateMissingTables()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Fatal error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
