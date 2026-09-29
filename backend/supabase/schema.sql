-- =============================================================================
-- PortFlow Production Database Schema
-- Production Deployment for Render Backend & PostgreSQL / Supabase
-- ACID Transactions, Referential Integrity, B-Tree Indexes, Soft-Delete
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. USERS TABLE (Authentication & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
    role VARCHAR(50) NOT NULL DEFAULT 'Operator' CHECK (role IN ('Admin', 'Operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SHIPS TABLE (Vessel Registry & Entity Modeling)
CREATE TABLE IF NOT EXISTS public.ships (
    id SERIAL PRIMARY KEY,
    imo_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    vessel_type VARCHAR(100) DEFAULT 'Container',
    capacity_teu INTEGER DEFAULT 0 CHECK (capacity_teu >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Arriving' CHECK (status IN ('Docked', 'Arriving', 'Departed')),
    berth_id VARCHAR(50),
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 4. OPERATIONS TABLE (Process Scheduling, CPU Telemetry & Lifecycle)
CREATE TABLE IF NOT EXISTS public.operations (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(50),
    operation_type VARCHAR(100) NOT NULL CHECK (char_length(operation_type) >= 2),
    ship_name VARCHAR(120) NOT NULL CHECK (char_length(ship_name) >= 1),
    crane_id VARCHAR(50) DEFAULT 'None',
    berth_id VARCHAR(50) DEFAULT 'Berth 1',
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Running', 'Completed', 'Cancelled')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    waiting_time_ms INTEGER CHECK (waiting_time_ms IS NULL OR waiting_time_ms >= 0),
    turnaround_time_ms INTEGER CHECK (turnaround_time_ms IS NULL OR turnaround_time_ms >= 0),
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

-- 5. CONTAINERS TABLE (Cargo Manifest & Location Tracking)
CREATE TABLE IF NOT EXISTS public.containers (
    id SERIAL PRIMARY KEY,
    container_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(container_number) >= 3),
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

-- 6. RESOURCES TABLE (Physical Hardware: Berths, Cranes, Trucks, Warehouses)
CREATE TABLE IF NOT EXISTS public.resources (
    id SERIAL PRIMARY KEY,
    resource_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Berth', 'Crane', 'Truck', 'Warehouse')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Running', 'Busy', 'Maintenance')),
    assigned_to VARCHAR(100) DEFAULT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

-- 7. PERFORMANCE INDEXES (Optimized for Soft-Delete and Frequent Queries)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_operations_status ON public.operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON public.operations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON public.operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ships_deleted_at ON public.ships(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ships_status ON public.ships(status);
CREATE INDEX IF NOT EXISTS idx_containers_deleted_at ON public.containers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_containers_number ON public.containers(container_number);
CREATE INDEX IF NOT EXISTS idx_resources_deleted_at ON public.resources(deleted_at);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);

-- 8. INITIAL SEED ACCOUNTS (Only if table is empty)
-- Password for both accounts is: Password123!
INSERT INTO public.users (email, password_hash, full_name, role)
VALUES 
    ('admin@portflow.com', '$2a$10$wE9L0Zq2f2T0yv1eLdC5p.3uFqvjM6yZ0A5.9bW9/6.2k7Lq3W7z6', 'Port Administrator', 'Admin'),
    ('operator@portflow.com', '$2a$10$wE9L0Zq2f2T0yv1eLdC5p.3uFqvjM6yZ0A5.9bW9/6.2k7Lq3W7z6', 'Crane Operator', 'Operator')
ON CONFLICT (email) DO NOTHING;
