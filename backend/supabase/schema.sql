-- =============================================================================
-- PortFlow Enterprise Phase 3 Relational Database Schema (3NF)
-- Database Engine: PostgreSQL 14+ / Supabase
-- Core Tenets:
--   1. Strict Referential Integrity: Primary Keys (PK) & Foreign Keys (FK)
--   2. Normalization: Third Normal Form (3NF) eliminating update/delete anomalies
--   3. Soft-Delete Architecture: Multi-tenant safety with `deleted_at` audit columns
--   4. Performance: B-Tree Indexes on all FKs and query filtration columns
--   5. Automated Audit: PL/pgSQL Triggers for `updated_at` timestamps
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. Universal Timestamp Update Trigger Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE (Authentication, RBAC, Operators & Inspectors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
    role VARCHAR(50) NOT NULL DEFAULT 'Operator' CHECK (role IN ('Operator', 'Admin', 'Customs_Officer', 'Supervisor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

DROP TRIGGER IF EXISTS trg_users_update_timestamp ON public.users;
CREATE TRIGGER trg_users_update_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 2. EQUIPMENT TABLE (Berths, STS Quay Cranes, Yard Gantries - Mutex/Semaphores)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    equipment_id VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(equipment_id) >= 2),
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    type VARCHAR(50) NOT NULL DEFAULT 'Berth' CHECK (type IN ('Berth', 'Crane', 'Yard_Gantry', 'Forklift', 'Truck')),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Running', 'Busy', 'Maintenance', 'In Use', 'Offline', 'Decommissioned')),
    capacity_metric DOUBLE PRECISION DEFAULT 0.0 CHECK (capacity_metric >= 0),
    assigned_to VARCHAR(100) DEFAULT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL
);

DROP TRIGGER IF EXISTS trg_equipment_update_timestamp ON public.equipment;
CREATE TRIGGER trg_equipment_update_timestamp
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 3. SHIPS TABLE (Marine Vessels calling at port terminal)
-- FK -> equipment(id) for assigned Berth
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ships (
    id SERIAL PRIMARY KEY,
    imo_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(imo_number) >= 3),
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    vessel_type VARCHAR(100) NOT NULL DEFAULT 'General Cargo',
    capacity_teu INTEGER NOT NULL DEFAULT 0 CHECK (capacity_teu >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Arriving' CHECK (status IN ('Docked', 'Arriving', 'Departed', 'Anchored', 'Approaching', 'Berthed', 'Arrived')),
    berth_id VARCHAR(50) DEFAULT NULL, -- Legacy display tag
    berth_equipment_id INTEGER DEFAULT NULL,
    eta TIMESTAMPTZ DEFAULT NULL,
    etd TIMESTAMPTZ DEFAULT NULL,
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_ships_berth_equipment
        FOREIGN KEY (berth_equipment_id)
        REFERENCES public.equipment(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_ships_update_timestamp ON public.ships;
CREATE TRIGGER trg_ships_update_timestamp
BEFORE UPDATE ON public.ships
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 4. WAREHOUSES TABLE (CFS, Reefer Cold Storage, Hazardous Yards)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(code) >= 2),
    name VARCHAR(120) NOT NULL CHECK (char_length(name) >= 1),
    zone_type VARCHAR(50) NOT NULL DEFAULT 'Dry_Storage' CHECK (zone_type IN ('Dry_Storage', 'CFS', 'Reefer_Cold_Storage', 'Hazardous_Material')),
    capacity_teu INTEGER NOT NULL DEFAULT 500 CHECK (capacity_teu > 0),
    current_occupancy_teu INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy_teu >= 0),
    temperature_celsius DOUBLE PRECISION DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Full', 'Maintenance', 'Closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT chk_warehouses_capacity CHECK (current_occupancy_teu <= capacity_teu)
);

DROP TRIGGER IF EXISTS trg_warehouses_update_timestamp ON public.warehouses;
CREATE TRIGGER trg_warehouses_update_timestamp
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 5. CARGO TABLE (Shipping Containers & Freight Manifests)
-- FK -> ships(id)
-- FK -> warehouses(id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cargo (
    id SERIAL PRIMARY KEY,
    cargo_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(cargo_number) >= 3),
    size_type VARCHAR(50) NOT NULL DEFAULT '20ft' CHECK (size_type IN ('20ft', '40ft', '45ft_HC')),
    weight_tons DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (weight_tons >= 0),
    cargo_type VARCHAR(100) NOT NULL DEFAULT 'General',
    current_location VARCHAR(100) NOT NULL DEFAULT 'Yard',
    ship_name VARCHAR(120) NOT NULL DEFAULT '',
    ship_id INTEGER DEFAULT NULL,
    warehouse_id INTEGER DEFAULT NULL,
    hazard_class VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'On Ship' CHECK (status IN ('On Ship', 'In Yard', 'In Warehouse', 'Cleared', 'In Transit', 'Loaded', 'Discharged', 'Dispatched')),
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_cargo_ship
        FOREIGN KEY (ship_id)
        REFERENCES public.ships(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_cargo_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES public.warehouses(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_cargo_update_timestamp ON public.cargo;
CREATE TRIGGER trg_cargo_update_timestamp
BEFORE UPDATE ON public.cargo
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 6. OPERATIONS TABLE (OS Process Control Blocks & Port Jobs)
-- FK -> ships(id)
-- FK -> cargo(id)
-- FK -> equipment(id) for Crane Mutex
-- FK -> equipment(id) for Berth Semaphore
-- FK -> users(id) for Initiator
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operations (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(50) UNIQUE DEFAULT NULL,
    operation_type VARCHAR(100) NOT NULL CHECK (char_length(operation_type) >= 2),
    ship_name VARCHAR(120) NOT NULL CHECK (char_length(ship_name) >= 1),
    ship_id INTEGER DEFAULT NULL,
    cargo_id INTEGER DEFAULT NULL,
    crane_id VARCHAR(50) NOT NULL DEFAULT 'None',
    crane_equipment_id INTEGER DEFAULT NULL,
    berth_id VARCHAR(50) NOT NULL DEFAULT 'Berth 1',
    berth_equipment_id INTEGER DEFAULT NULL,
    created_by_user_id INTEGER DEFAULT NULL,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Running', 'Completed', 'Cancelled', 'In progress')),
    start_time TIMESTAMPTZ DEFAULT NULL,
    end_time TIMESTAMPTZ DEFAULT NULL,
    waiting_time_ms INTEGER CHECK (waiting_time_ms IS NULL OR waiting_time_ms >= 0),
    turnaround_time_ms INTEGER CHECK (turnaround_time_ms IS NULL OR turnaround_time_ms >= 0),
    created_by VARCHAR(255) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT chk_operations_time_sequence CHECK (
        end_time IS NULL OR start_time IS NULL OR end_time >= start_time
    ),
    CONSTRAINT fk_operations_ship
        FOREIGN KEY (ship_id)
        REFERENCES public.ships(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_operations_cargo
        FOREIGN KEY (cargo_id)
        REFERENCES public.cargo(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_operations_crane
        FOREIGN KEY (crane_equipment_id)
        REFERENCES public.equipment(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_operations_berth
        FOREIGN KEY (berth_equipment_id)
        REFERENCES public.equipment(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_operations_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_operations_update_timestamp ON public.operations;
CREATE TRIGGER trg_operations_update_timestamp
BEFORE UPDATE ON public.operations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 7. TRUCKS TABLE (Land Drayage Logistics & Gate Fleet)
-- FK -> cargo(id) for Current Payload
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trucks (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(license_plate) >= 4),
    driver_name VARCHAR(120) NOT NULL CHECK (char_length(driver_name) >= 2),
    driver_phone VARCHAR(50) NOT NULL,
    transport_company VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Idle' CHECK (status IN ('Idle', 'En_Route', 'At_Gate', 'Loading', 'Departed')),
    max_payload_tons DOUBLE PRECISION NOT NULL DEFAULT 30.0 CHECK (max_payload_tons > 0),
    assigned_cargo_id INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    deleted_by VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_trucks_cargo
        FOREIGN KEY (assigned_cargo_id)
        REFERENCES public.cargo(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_trucks_update_timestamp ON public.trucks;
CREATE TRIGGER trg_trucks_update_timestamp
BEFORE UPDATE ON public.trucks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 8. GATE PASSES TABLE (Port Perimeter Security, Access Control)
-- FK -> trucks(id) ON DELETE CASCADE
-- FK -> cargo(id)
-- FK -> users(id) for Security Guard / Issuer
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gate_passes (
    id SERIAL PRIMARY KEY,
    pass_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(pass_number) >= 3),
    truck_id INTEGER NOT NULL,
    cargo_id INTEGER DEFAULT NULL,
    issued_by_id INTEGER DEFAULT NULL,
    gate_lane VARCHAR(50) NOT NULL DEFAULT 'Gate-In-Lane-1',
    pass_type VARCHAR(50) NOT NULL DEFAULT 'Inbound_Delivery' CHECK (pass_type IN ('Inbound_Delivery', 'Outbound_Pickup', 'Empty_Return')),
    status VARCHAR(50) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Validated', 'Completed', 'Expired')),
    check_in_time TIMESTAMPTZ DEFAULT NULL,
    check_out_time TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_gate_passes_truck
        FOREIGN KEY (truck_id)
        REFERENCES public.trucks(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_gate_passes_cargo
        FOREIGN KEY (cargo_id)
        REFERENCES public.cargo(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_gate_passes_issuer
        FOREIGN KEY (issued_by_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 9. CUSTOMS INSPECTIONS TABLE (Regulatory Border Clearances & Holds)
-- FK -> cargo(id) ON DELETE CASCADE
-- FK -> users(id) for Customs Officer
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customs_inspections (
    id SERIAL PRIMARY KEY,
    inspection_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(inspection_number) >= 3),
    cargo_id INTEGER NOT NULL,
    inspector_id INTEGER DEFAULT NULL,
    declaration_number VARCHAR(100) NOT NULL CHECK (char_length(declaration_number) >= 3),
    inspection_type VARCHAR(50) NOT NULL DEFAULT 'X-Ray_Scan' CHECK (inspection_type IN ('X-Ray_Scan', 'Physical_Inspection', 'Document_Audit', 'Quarantine')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In_Review', 'Cleared', 'Held', 'Confiscated')),
    duty_amount_cents BIGINT NOT NULL DEFAULT 0 CHECK (duty_amount_cents >= 0),
    findings TEXT DEFAULT NULL,
    inspected_at TIMESTAMPTZ DEFAULT NULL,
    cleared_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_inspections_cargo
        FOREIGN KEY (cargo_id)
        REFERENCES public.cargo(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_inspections_inspector
        FOREIGN KEY (inspector_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_customs_inspections_update_timestamp ON public.customs_inspections;
CREATE TRIGGER trg_customs_inspections_update_timestamp
BEFORE UPDATE ON public.customs_inspections
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 10. BILLS TABLE (Automated Tariff Billing Engine)
-- FK -> ships(id)
-- FK -> cargo(id)
-- FK -> operations(id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL CHECK (char_length(invoice_number) >= 3),
    ship_id INTEGER DEFAULT NULL,
    cargo_id INTEGER DEFAULT NULL,
    operation_id INTEGER DEFAULT NULL,
    customer_name VARCHAR(150) NOT NULL CHECK (char_length(customer_name) >= 2),
    docking_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (docking_fee >= 0),
    crane_usage_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (crane_usage_fee >= 0),
    storage_fee DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (storage_fee >= 0),
    total_amount DOUBLE PRECISION NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (payment_status IN ('Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled')),
    due_date TIMESTAMPTZ DEFAULT NULL,
    paid_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_bills_ship
        FOREIGN KEY (ship_id)
        REFERENCES public.ships(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_bills_cargo
        FOREIGN KEY (cargo_id)
        REFERENCES public.cargo(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_bills_operation
        FOREIGN KEY (operation_id)
        REFERENCES public.operations(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_bills_update_timestamp ON public.bills;
CREATE TRIGGER trg_bills_update_timestamp
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 11. ISSUES TABLE (Incident Reports, Hardware Malfunctions, Support Tickets)
-- FK -> users(id) for Reporter
-- FK -> equipment(id) for Faulty Unit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL CHECK (char_length(ticket_number) >= 3),
    title VARCHAR(200) NOT NULL CHECK (char_length(title) >= 3),
    description TEXT NOT NULL CHECK (char_length(description) >= 5),
    severity VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved', 'Closed')),
    reported_by_id INTEGER DEFAULT NULL,
    equipment_id INTEGER DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_issues_reported_by
        FOREIGN KEY (reported_by_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_issues_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES public.equipment(id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_issues_update_timestamp ON public.issues;
CREATE TRIGGER trg_issues_update_timestamp
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 12. SYSTEM LOGS TABLE (Operational Runtime & Security Audit Trail)
-- FK -> users(id) for Action Performer
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    source VARCHAR(100) NOT NULL DEFAULT 'Scheduler',
    message TEXT NOT NULL,
    action VARCHAR(100) DEFAULT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INTEGER DEFAULT NULL,
    user_id INTEGER DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_system_logs_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL
);

-- =============================================================================
-- PERFORMANCE B-TREE INDEXES (Covering Foreign Keys, Lookups, Soft-Deletes)
-- =============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Equipment
CREATE INDEX IF NOT EXISTS idx_equipment_id ON public.equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at ON public.equipment(deleted_at);

-- Ships
CREATE INDEX IF NOT EXISTS idx_ships_imo ON public.ships(imo_number);
CREATE INDEX IF NOT EXISTS idx_ships_name ON public.ships(name);
CREATE INDEX IF NOT EXISTS idx_ships_status ON public.ships(status);
CREATE INDEX IF NOT EXISTS idx_ships_berth_fk ON public.ships(berth_equipment_id);
CREATE INDEX IF NOT EXISTS idx_ships_deleted_at ON public.ships(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ships_created_at ON public.ships(created_at DESC);

-- Warehouses
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON public.warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_zone_type ON public.warehouses(zone_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON public.warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_deleted_at ON public.warehouses(deleted_at);

-- Cargo
CREATE INDEX IF NOT EXISTS idx_cargo_number ON public.cargo(cargo_number);
CREATE INDEX IF NOT EXISTS idx_cargo_ship_fk ON public.cargo(ship_id);
CREATE INDEX IF NOT EXISTS idx_cargo_warehouse_fk ON public.cargo(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_cargo_status ON public.cargo(status);
CREATE INDEX IF NOT EXISTS idx_cargo_deleted_at ON public.cargo(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cargo_created_at ON public.cargo(created_at DESC);

-- Operations
CREATE INDEX IF NOT EXISTS idx_operations_process_id ON public.operations(process_id);
CREATE INDEX IF NOT EXISTS idx_operations_ship_fk ON public.operations(ship_id);
CREATE INDEX IF NOT EXISTS idx_operations_cargo_fk ON public.operations(cargo_id);
CREATE INDEX IF NOT EXISTS idx_operations_crane_fk ON public.operations(crane_equipment_id);
CREATE INDEX IF NOT EXISTS idx_operations_berth_fk ON public.operations(berth_equipment_id);
CREATE INDEX IF NOT EXISTS idx_operations_user_fk ON public.operations(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON public.operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_priority ON public.operations(priority DESC);
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON public.operations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON public.operations(created_at DESC);

-- Trucks
CREATE INDEX IF NOT EXISTS idx_trucks_plate ON public.trucks(license_plate);
CREATE INDEX IF NOT EXISTS idx_trucks_cargo_fk ON public.trucks(assigned_cargo_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON public.trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_deleted_at ON public.trucks(deleted_at);

-- Gate Passes
CREATE INDEX IF NOT EXISTS idx_gate_passes_number ON public.gate_passes(pass_number);
CREATE INDEX IF NOT EXISTS idx_gate_passes_truck_fk ON public.gate_passes(truck_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_cargo_fk ON public.gate_passes(cargo_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON public.gate_passes(status);

-- Customs Inspections
CREATE INDEX IF NOT EXISTS idx_inspections_num ON public.customs_inspections(inspection_number);
CREATE INDEX IF NOT EXISTS idx_inspections_cargo_fk ON public.customs_inspections(cargo_id);
CREATE INDEX IF NOT EXISTS idx_inspections_user_fk ON public.customs_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.customs_inspections(status);

-- Bills
CREATE INDEX IF NOT EXISTS idx_bills_invoice_num ON public.bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bills_ship_fk ON public.bills(ship_id);
CREATE INDEX IF NOT EXISTS idx_bills_cargo_fk ON public.bills(cargo_id);
CREATE INDEX IF NOT EXISTS idx_bills_operation_fk ON public.bills(operation_id);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(payment_status);

-- Issues
CREATE INDEX IF NOT EXISTS idx_issues_ticket ON public.issues(ticket_number);
CREATE INDEX IF NOT EXISTS idx_issues_user_fk ON public.issues(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_issues_equipment_fk ON public.issues(equipment_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON public.issues(severity);

-- System Logs
CREATE INDEX IF NOT EXISTS idx_system_logs_ts ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_fk ON public.system_logs(user_id);

-- =============================================================================
-- LEGACY COMPATIBILITY VIEWS
-- =============================================================================
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

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_equipment" ON public.equipment FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ships" ON public.ships FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_warehouses" ON public.warehouses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cargo" ON public.cargo FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations" ON public.operations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_trucks" ON public.trucks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_gate_passes" ON public.gate_passes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_inspections" ON public.customs_inspections FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bills" ON public.bills FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_issues" ON public.issues FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_system_logs" ON public.system_logs FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =============================================================================
-- SEED INITIAL RECORD DATA (End-to-End Primary & Foreign Key Connections)
-- =============================================================================

-- 1. Default Terminal Operator User
INSERT INTO public.users (email, password_hash, full_name, role)
VALUES (
    'operator@portflow.com',
    crypt('Password123!', gen_salt('bf', 10)),
    'Terminal Operator',
    'Operator'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Initial Physical Equipment (Berths & Cranes)
INSERT INTO public.equipment (equipment_id, name, type, status, capacity_metric)
VALUES 
    ('BERTH-01', 'Deepwater Berth North', 'Berth', 'Available', 25000),
    ('BERTH-02', 'Container Berth South', 'Berth', 'Available', 18000),
    ('CRANE-A', 'Super Post-Panamax STS Crane 1', 'Crane', 'Available', 65.0),
    ('CRANE-B', 'Gantry Rail Crane 2', 'Crane', 'Available', 50.0)
ON CONFLICT (equipment_id) DO NOTHING;

-- 3. Initial Marine Vessel
INSERT INTO public.ships (imo_number, name, vessel_type, capacity_teu, status, berth_id, berth_equipment_id)
VALUES (
    'IMO9176187',
    'Ever Given Pioneer',
    'Container Vessel',
    20000,
    'Berthed',
    'BERTH-01',
    (SELECT id FROM public.equipment WHERE equipment_id = 'BERTH-01' LIMIT 1)
)
ON CONFLICT (imo_number) DO NOTHING;

-- 4. Initial CFS Reefer Warehouse
INSERT INTO public.warehouses (code, name, zone_type, capacity_teu, current_occupancy_teu, temperature_celsius, status)
VALUES 
    ('CFS-REEFER-01', 'Cold Chain CFS Facility 1', 'Reefer_Cold_Storage', 400, 120, -18.5, 'Active'),
    ('YARD-ZONE-A', 'General Cargo Dry Yard A', 'Dry_Storage', 1500, 480, NULL, 'Active')
ON CONFLICT (code) DO NOTHING;

-- 5. Initial Cargo Containers
INSERT INTO public.cargo (cargo_number, size_type, weight_tons, cargo_type, current_location, ship_name, ship_id, warehouse_id, status)
VALUES 
    (
        'MSKU-998822-1',
        '40ft',
        26.4,
        'Reefer Pharmaceuticals',
        'Yard',
        'Ever Given Pioneer',
        (SELECT id FROM public.ships WHERE imo_number = 'IMO9176187' LIMIT 1),
        (SELECT id FROM public.warehouses WHERE code = 'CFS-REEFER-01' LIMIT 1),
        'In Yard'
    ),
    (
        'TCLU-102938-4',
        '20ft',
        18.2,
        'Electronics & Machinery',
        'On Ship',
        'Ever Given Pioneer',
        (SELECT id FROM public.ships WHERE imo_number = 'IMO9176187' LIMIT 1),
        (SELECT id FROM public.warehouses WHERE code = 'YARD-ZONE-A' LIMIT 1),
        'On Ship'
    )
ON CONFLICT (cargo_number) DO NOTHING;

-- 6. Initial Operation Process
INSERT INTO public.operations (process_id, operation_type, ship_name, ship_id, cargo_id, crane_id, crane_equipment_id, berth_id, berth_equipment_id, created_by_user_id, priority, status)
VALUES (
    'op-demo-101',
    'Discharge Container',
    'Ever Given Pioneer',
    (SELECT id FROM public.ships WHERE imo_number = 'IMO9176187' LIMIT 1),
    (SELECT id FROM public.cargo WHERE cargo_number = 'MSKU-998822-1' LIMIT 1),
    'CRANE-A',
    (SELECT id FROM public.equipment WHERE equipment_id = 'CRANE-A' LIMIT 1),
    'BERTH-01',
    (SELECT id FROM public.equipment WHERE equipment_id = 'BERTH-01' LIMIT 1),
    (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1),
    2,
    'Queued'
)
ON CONFLICT (process_id) DO NOTHING;

-- 7. Initial Logistics Truck
INSERT INTO public.trucks (license_plate, driver_name, driver_phone, transport_company, status, assigned_cargo_id)
VALUES (
    'MH-04-AZ-8819',
    'Rajesh Kumar',
    '+91 98201 12345',
    'Pacific Inland Freight Logistics',
    'At_Gate',
    (SELECT id FROM public.cargo WHERE cargo_number = 'MSKU-998822-1' LIMIT 1)
)
ON CONFLICT (license_plate) DO NOTHING;

-- 8. Initial Gate Pass
INSERT INTO public.gate_passes (pass_number, truck_id, cargo_id, issued_by_id, gate_lane, pass_type, status, check_in_time)
VALUES (
    'GP-2026-0012',
    (SELECT id FROM public.trucks WHERE license_plate = 'MH-04-AZ-8819' LIMIT 1),
    (SELECT id FROM public.cargo WHERE cargo_number = 'MSKU-998822-1' LIMIT 1),
    (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1),
    'Gate-In-Lane-1',
    'Inbound_Delivery',
    'Validated',
    NOW()
)
ON CONFLICT (pass_number) DO NOTHING;

-- 9. Initial Customs Inspection
INSERT INTO public.customs_inspections (inspection_number, cargo_id, inspector_id, declaration_number, inspection_type, status, duty_amount_cents, findings)
VALUES (
    'INSP-2026-9041',
    (SELECT id FROM public.cargo WHERE cargo_number = 'MSKU-998822-1' LIMIT 1),
    (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1),
    'DEC-CUSTOMS-44810',
    'X-Ray_Scan',
    'Cleared',
    145000,
    'Scanned container density verified compliant with pharmaceutical cold cargo manifest.'
)
ON CONFLICT (inspection_number) DO NOTHING;

-- 10. Initial Bill / Tariff Invoice
INSERT INTO public.bills (invoice_number, ship_id, cargo_id, operation_id, customer_name, docking_fee, crane_usage_fee, storage_fee, total_amount, currency, payment_status, due_date)
VALUES (
    'INV-2026-0001',
    (SELECT id FROM public.ships WHERE imo_number = 'IMO9176187' LIMIT 1),
    (SELECT id FROM public.cargo WHERE cargo_number = 'MSKU-998822-1' LIMIT 1),
    (SELECT id FROM public.operations WHERE process_id = 'op-demo-101' LIMIT 1),
    'Evergreen Marine Shipping Lines',
    12500.0,
    3400.0,
    850.0,
    16750.0,
    'USD',
    'Issued',
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (invoice_number) DO NOTHING;

-- 11. Initial Equipment Incident Report
INSERT INTO public.issues (ticket_number, title, description, severity, status, reported_by_id, equipment_id)
VALUES (
    'TICK-2026-0001',
    'Hydraulic cable tension calibration alert on Crane A',
    'Telemetry sensor detected 4% variance in wire hoist speed during high-priority discharge cycle.',
    'Medium',
    'Open',
    (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1),
    (SELECT id FROM public.equipment WHERE equipment_id = 'CRANE-A' LIMIT 1)
)
ON CONFLICT (ticket_number) DO NOTHING;

-- 12. Initial System Logs
INSERT INTO public.system_logs (level, source, message, action, entity_type, user_id)
VALUES 
    ('INFO', 'Scheduler', 'CPU Scheduling Engine initialized with Non-Preemptive FCFS & SJF strategy.', 'INIT_SCHEDULER', 'SYSTEM', (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1)),
    ('INFO', 'DeadlockDetector', 'Wait-For Graph (WFG) cycle detection initialized with 0 active resource deadlocks.', 'INIT_DEADLOCK_WFG', 'SYSTEM', (SELECT id FROM public.users WHERE email = 'operator@portflow.com' LIMIT 1));
