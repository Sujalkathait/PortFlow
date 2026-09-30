-- =============================================================================
-- PortFlow Database Schema
-- PostgreSQL 14+ / Supabase & Prisma ORM
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
    role VARCHAR(50) NOT NULL DEFAULT 'Operator' CHECK (role IN ('Admin', 'Operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 3. SHIPS TABLE
CREATE TABLE IF NOT EXISTS public.ships (
    id SERIAL PRIMARY KEY,
    imo_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    vessel_type VARCHAR(100) DEFAULT 'General Cargo',
    capacity_teu INTEGER DEFAULT 0 CHECK (capacity_teu >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Arriving' CHECK (status IN ('Docked', 'Arriving', 'Departed')),
    berth_id VARCHAR(50) DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 4. EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    type VARCHAR(50) NOT NULL DEFAULT 'Berth' CHECK (type IN ('Berth', 'Crane', 'Truck', 'Warehouse')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Running', 'Busy', 'Maintenance')),
    assigned_to VARCHAR(100) DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 5. CARGO TABLE
CREATE TABLE IF NOT EXISTS public.cargo (
    id SERIAL PRIMARY KEY,
    cargo_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(cargo_number) >= 3),
    size_type VARCHAR(50) NOT NULL DEFAULT '20ft',
    weight_tons NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (weight_tons >= 0),
    cargo_type VARCHAR(100) NOT NULL DEFAULT 'General',
    current_location VARCHAR(100) NOT NULL DEFAULT 'Yard',
    ship_name VARCHAR(120) DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'On Ship' CHECK (status IN ('On Ship', 'In Yard', 'Cleared', 'In Transit')),
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 6. OPERATIONS TABLE
CREATE TABLE IF NOT EXISTS public.operations (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(50) UNIQUE,
    operation_type VARCHAR(100) NOT NULL CHECK (char_length(operation_type) >= 2),
    ship_name VARCHAR(120) NOT NULL CHECK (char_length(ship_name) >= 1),
    crane_id VARCHAR(50) DEFAULT 'None',
    berth_id VARCHAR(50) DEFAULT 'Berth 1',
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Running', 'Completed', 'Cancelled')),
    start_time TIMESTAMPTZ DEFAULT NULL,
    end_time TIMESTAMPTZ DEFAULT NULL,
    waiting_time_ms INTEGER CHECK (waiting_time_ms IS NULL OR waiting_time_ms >= 0),
    turnaround_time_ms INTEGER CHECK (turnaround_time_ms IS NULL OR turnaround_time_ms >= 0),
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

-- 7. BACKWARD-COMPATIBILITY VIEWS
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

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_operations_status ON public.operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON public.operations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON public.operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_process_id ON public.operations(process_id);

CREATE INDEX IF NOT EXISTS idx_ships_imo ON public.ships(imo_number);
CREATE INDEX IF NOT EXISTS idx_ships_status ON public.ships(status);
CREATE INDEX IF NOT EXISTS idx_ships_deleted_at ON public.ships(deleted_at);

CREATE INDEX IF NOT EXISTS idx_cargo_number ON public.cargo(cargo_number);
CREATE INDEX IF NOT EXISTS idx_cargo_status ON public.cargo(status);
CREATE INDEX IF NOT EXISTS idx_cargo_deleted_at ON public.cargo(deleted_at);

CREATE INDEX IF NOT EXISTS idx_equipment_id ON public.equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at ON public.equipment(deleted_at);

-- 9. DEFAULT ACCOUNTS (admin@portflow.com & operator@portflow.com / Password123!)
INSERT INTO public.users (email, password_hash, full_name, role)
VALUES 
    ('admin@portflow.com', crypt('Password123!', gen_salt('bf', 10)), 'Port Administrator', 'Admin'),
    ('operator@portflow.com', crypt('Password123!', gen_salt('bf', 10)), 'Crane Operator', 'Operator')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    deleted_at = NULL;
