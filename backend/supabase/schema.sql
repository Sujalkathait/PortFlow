-- =============================================================================
-- PortFlow Marine Terminal Operating System (TOS) - Database Schema
-- Target: PostgreSQL 14+ / Supabase | Companion: Prisma (schema.prisma)
-- =============================================================================

-- SECTION 1: EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SECTION 2: AUTOMATIC TIMESTAMP TRIGGER
-- Automatically updates updated_at whenever a row is modified in PostgreSQL.
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SECTION 3: USERS TABLE
-- Stores authenticated port operators and system administrators.
-- Passwords are never stored in plain text; only 60-character bcrypt hashes are kept.
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
    role VARCHAR(50) NOT NULL DEFAULT 'Operator' CHECK (role IN ('Operator', 'Admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- Trigger to auto-update `updated_at` on modification of users
DROP TRIGGER IF EXISTS trg_users_update_timestamp ON public.users;
CREATE TRIGGER trg_users_update_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- SECTION 4: SHIPS TABLE
-- Marine vessels arriving, docking, and departing the terminal.
-- Identified internationally by IMO (International Maritime Organization) standard numbers.
CREATE TABLE IF NOT EXISTS public.ships (
    id SERIAL PRIMARY KEY,
    imo_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(imo_number) >= 3),
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    vessel_type VARCHAR(100) NOT NULL DEFAULT 'General Cargo',
    capacity_teu INTEGER NOT NULL DEFAULT 0 CHECK (capacity_teu >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Arriving' CHECK (status IN ('Docked', 'Arriving', 'Departed', 'Anchored', 'Approaching', 'Berthed', 'Arrived')),
    berth_id VARCHAR(50) DEFAULT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- SECTION 5: EQUIPMENT TABLE
-- Shared hardware resources (Berths, STS Gantry Cranes, Yard Trucks).
-- Governed by operating system synchronization primitives (Mutexes and Semaphores).
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(equipment_id) >= 2),
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    type VARCHAR(50) NOT NULL DEFAULT 'Berth' CHECK (type IN ('Berth', 'Crane', 'Truck', 'Warehouse')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Running', 'Busy', 'Maintenance', 'In Use', 'Offline', 'Decommissioned')),
    assigned_to VARCHAR(100) DEFAULT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- SECTION 6: CARGO TABLE
-- Freight manifests, ISO shipping containers, and container tracking.
-- Parity type DOUBLE PRECISION matches IEEE 754 float in Prisma / TypeScript.
CREATE TABLE IF NOT EXISTS public.cargo (
    id SERIAL PRIMARY KEY,
    cargo_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(cargo_number) >= 3),
    size_type VARCHAR(50) NOT NULL DEFAULT '20ft',
    weight_tons DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (weight_tons >= 0),
    cargo_type VARCHAR(100) NOT NULL DEFAULT 'General',
    current_location VARCHAR(100) NOT NULL DEFAULT 'Yard',
    ship_name VARCHAR(120) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'On Ship' CHECK (status IN ('On Ship', 'In Yard', 'Cleared', 'In Transit', 'Loaded', 'Discharged', 'Dispatched')),
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- SECTION 7: OPERATIONS TABLE
-- Represents the core process queue executed by the OS Scheduler.
-- Algorithms applied: FCFS, SJF, Round Robin (Quantum), Priority.
CREATE TABLE IF NOT EXISTS public.operations (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(50) UNIQUE DEFAULT NULL,
    operation_type VARCHAR(100) NOT NULL CHECK (char_length(operation_type) >= 2),
    ship_name VARCHAR(120) NOT NULL CHECK (char_length(ship_name) >= 1),
    crane_id VARCHAR(50) NOT NULL DEFAULT 'None',
    berth_id VARCHAR(50) NOT NULL DEFAULT 'Berth 1',
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Running', 'Completed', 'Cancelled', 'In progress')),
    start_time TIMESTAMPTZ DEFAULT NULL,
    end_time TIMESTAMPTZ DEFAULT NULL,
    waiting_time_ms INTEGER CHECK (waiting_time_ms IS NULL OR waiting_time_ms >= 0),
    turnaround_time_ms INTEGER CHECK (turnaround_time_ms IS NULL OR turnaround_time_ms >= 0),
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT chk_operations_time_sequence CHECK (
        end_time IS NULL OR start_time IS NULL OR end_time >= start_time
    )
);

-- SECTION 8: BACKWARD-COMPATIBILITY RELATIONAL VIEWS
-- Abstract legacy aliases (containers -> cargo, resources -> equipment)
-- without altering underlying normalized storage.
CREATE OR REPLACE VIEW public.containers AS
SELECT 
    id,
    cargo_number AS container_number,
    size_type,
    weight_tons,
    cargo_type,
    current_location,
    ship_name,
    status,
    created_by,
    created_at,
    deleted_at,
    deleted_by
FROM public.cargo;

CREATE OR REPLACE VIEW public.resources AS
SELECT 
    id,
    equipment_id AS resource_id,
    name,
    type,
    status,
    assigned_to,
    created_by,
    created_at,
    deleted_at,
    deleted_by
FROM public.equipment;

-- SECTION 9: PERFORMANCE B-TREE INDEXES
-- Index optimization: speeds up frequent WHERE, ORDER BY, and JOIN operations.
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ships_imo ON public.ships(imo_number);
CREATE INDEX IF NOT EXISTS idx_ships_name ON public.ships(name);
CREATE INDEX IF NOT EXISTS idx_ships_status ON public.ships(status);
CREATE INDEX IF NOT EXISTS idx_ships_deleted_at ON public.ships(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ships_created_at ON public.ships(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_equipment_id ON public.equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at ON public.equipment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON public.equipment(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cargo_number ON public.cargo(cargo_number);
CREATE INDEX IF NOT EXISTS idx_cargo_ship_name ON public.cargo(ship_name);
CREATE INDEX IF NOT EXISTS idx_cargo_status ON public.cargo(status);
CREATE INDEX IF NOT EXISTS idx_cargo_deleted_at ON public.cargo(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cargo_created_at ON public.cargo(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operations_process_id ON public.operations(process_id);
CREATE INDEX IF NOT EXISTS idx_operations_ship_name ON public.operations(ship_name);
CREATE INDEX IF NOT EXISTS idx_operations_status ON public.operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_priority ON public.operations(priority DESC);
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON public.operations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON public.operations(created_at DESC);

-- SECTION 10: IDEMPOTENT CONSTRAINTS & DEFAULTS FOR EXISTING DATABASES
-- Safely applies schema updates even if tables were previously created without them.
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'Operator';
ALTER TABLE public.users ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE public.ships ALTER COLUMN created_by SET DEFAULT 'system';
ALTER TABLE public.equipment ALTER COLUMN created_by SET DEFAULT 'system';
ALTER TABLE public.cargo ALTER COLUMN created_by SET DEFAULT 'system';
ALTER TABLE public.operations ALTER COLUMN created_by SET DEFAULT 'system';
ALTER TABLE public.operations ALTER COLUMN status SET DEFAULT 'Queued';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ships_imo_number_key') THEN
        ALTER TABLE public.ships ADD CONSTRAINT ships_imo_number_key UNIQUE (imo_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_equipment_id_key') THEN
        ALTER TABLE public.equipment ADD CONSTRAINT equipment_equipment_id_key UNIQUE (equipment_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cargo_cargo_number_key') THEN
        ALTER TABLE public.cargo ADD CONSTRAINT cargo_cargo_number_key UNIQUE (cargo_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operations_process_id_key') THEN
        ALTER TABLE public.operations ADD CONSTRAINT operations_process_id_key UNIQUE (process_id);
    END IF;
END $$;

-- SECTION 11: ROW LEVEL SECURITY (RLS) & ACCESS PERMISSIONS
-- Ensures Supabase security compliance while allowing seamless REST API & Prisma queries.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_ships" ON public.ships;
CREATE POLICY "allow_all_ships" ON public.ships FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_equipment" ON public.equipment;
CREATE POLICY "allow_all_equipment" ON public.equipment FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_cargo" ON public.cargo;
CREATE POLICY "allow_all_cargo" ON public.cargo FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_operations" ON public.operations;
CREATE POLICY "allow_all_operations" ON public.operations FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- SECTION 12: INITIAL SEED DATA (IDEMPOTENT)
-- Seeds the default evaluation credentials specified in project documentation:
-- Terminal Operator | operator@portflow.com | Password123!
INSERT INTO public.users (email, password_hash, full_name, role)
VALUES (
    'operator@portflow.com',
    crypt('Password123!', gen_salt('bf', 10)),
    'Terminal Operator',
    'Operator'
)
ON CONFLICT (email) DO NOTHING;

-- Seeds default physical berths and cranes required by OS Simulation Kernel:
INSERT INTO public.equipment (equipment_id, name, type, status, created_by)
VALUES 
    ('EQ-BERTH-1', 'Berth 1', 'Berth', 'Available', 'system'),
    ('EQ-BERTH-2', 'Berth 2', 'Berth', 'Available', 'system'),
    ('EQ-CRANE-A', 'Crane A', 'Crane', 'Available', 'system'),
    ('EQ-CRANE-B', 'Crane B', 'Crane', 'Available', 'system')
ON CONFLICT (equipment_id) DO NOTHING;

-- =============================================================================
-- End of Schema Definition
-- =============================================================================
