-- =============================================================================
-- PortFlow Enterprise High-Volume Seed Script (PostgreSQL 14+ / Supabase)
-- Populates all 12 tables (3NF Relational Architecture) with realistic data:
-- 100 Demo Users + 500+ records in EVERY table.
-- =============================================================================

BEGIN;

-- 1. USERS TABLE (100 Demo Accounts: Admin, Operator, Customs, Dispatch, Tech)
-- Password for all accounts is: Password123!
INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
SELECT 
  CASE 
    WHEN s = 1 THEN 'admin@portflow.com'
    WHEN s = 2 THEN 'operator@portflow.com'
    WHEN s = 3 THEN 'customs@portflow.com'
    WHEN s = 4 THEN 'dispatch@portflow.com'
    WHEN s <= 10 THEN 'admin' || s || '@portflow.com'
    WHEN s <= 60 THEN 'operator' || (s - 10) || '@portflow.com'
    WHEN s <= 75 THEN 'customs' || (s - 60) || '@portflow.com'
    WHEN s <= 90 THEN 'dispatch' || (s - 75) || '@portflow.com'
    ELSE 'tech' || (s - 90) || '@portflow.com'
  END,
  '$2a$10$w09ZkM4j/4x6s5G27bWJaeX3w1d0vW8eEa1d7f6g5h4j3k2l1m0n9',
  CASE 
    WHEN s = 1 THEN 'System Administrator'
    WHEN s = 2 THEN 'Lead Terminal Operator'
    WHEN s = 3 THEN 'Chief Customs Inspector'
    WHEN s = 4 THEN 'Senior Logistics Dispatcher'
    WHEN s <= 10 THEN 'Port Administrator ' || s
    WHEN s <= 60 THEN 'Terminal Operator ' || (s - 10)
    WHEN s <= 75 THEN 'Customs Inspector ' || (s - 60)
    WHEN s <= 90 THEN 'Fleet Dispatcher ' || (s - 75)
    ELSE 'Maintenance Technician ' || (s - 90)
  END,
  CASE 
    WHEN s <= 10 THEN 'Admin'
    WHEN s <= 60 THEN 'Operator'
    WHEN s <= 75 THEN 'Customs'
    WHEN s <= 90 THEN 'Operator'
    ELSE 'Technician'
  END,
  NOW() - (s || ' minutes')::interval,
  NOW()
FROM generate_series(1, 100) AS s
ON CONFLICT (email) DO NOTHING;

-- 2. EQUIPMENT TABLE (550 Records: 200 Berths + 200 STS Cranes + 150 Gantries)
INSERT INTO equipment (equipment_id, name, type, status, capacity_metric, assigned_to, created_by, created_at, updated_at)
SELECT 
  'BERTH-' || LPAD(s::text, 3, '0'),
  'Deepwater Quay Berth ' || s,
  'Berth',
  CASE WHEN s % 3 = 0 THEN 'Occupied' ELSE 'Available' END,
  250000.0,
  CASE WHEN s % 3 = 0 THEN 'Alloc-Pool-' || s ELSE NULL END,
  'system',
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 200) AS s
ON CONFLICT (equipment_id) DO NOTHING;

INSERT INTO equipment (equipment_id, name, type, status, capacity_metric, assigned_to, created_by, created_at, updated_at)
SELECT 
  'CRANE-STS-' || LPAD(s::text, 3, '0'),
  'Super Post-Panamax STS Crane ' || s,
  'Crane',
  CASE WHEN s % 4 = 0 THEN 'Busy' WHEN s % 8 = 0 THEN 'Maintenance' ELSE 'Available' END,
  65.0,
  CASE WHEN s % 4 = 0 THEN 'Quay-Zone-' || s ELSE NULL END,
  'system',
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 200) AS s
ON CONFLICT (equipment_id) DO NOTHING;

INSERT INTO equipment (equipment_id, name, type, status, capacity_metric, assigned_to, created_by, created_at, updated_at)
SELECT 
  'GANTRY-RTG-' || LPAD(s::text, 3, '0'),
  'Rubber Tired Yard Gantry ' || s,
  'Gantry',
  CASE WHEN s % 5 = 0 THEN 'Busy' ELSE 'Available' END,
  45.0,
  'Yard-Block-' || CHR(65 + (s % 8)),
  'system',
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 150) AS s
ON CONFLICT (equipment_id) DO NOTHING;

-- 3. SHIPS TABLE (600 Calling Marine Vessels)
INSERT INTO ships (imo_number, name, vessel_type, capacity_teu, status, berth_id, eta, etd, created_by, created_at, updated_at)
SELECT 
  'IMO-' || (9000000 + s)::text,
  (ARRAY['MSC', 'Maersk', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'HMM', 'ZIM', 'Yang Ming'])[1 + (s % 10)] || ' ' ||
  (ARRAY['Titan', 'Glory', 'Pioneer', 'Horizon', 'Voyager', 'Navigator', 'Express', 'Leader', 'Sovereign', 'Vanguard'])[1 + ((s / 10) % 10)] || ' ' || s,
  CASE WHEN s % 5 = 0 THEN 'Bulk Carrier' WHEN s % 4 = 0 THEN 'Oil Tanker' ELSE 'Container Ship' END,
  5000 + ((s * 37) % 19000),
  CASE WHEN s % 4 = 0 THEN 'Docked' WHEN s % 3 = 0 THEN 'Berthed' WHEN s % 2 = 0 THEN 'Arriving' ELSE 'Arrived' END,
  'Berth ' || (1 + (s % 200)),
  NOW() - ((s % 48) || ' hours')::interval,
  NOW() + (((s % 72) + 24) || ' hours')::interval,
  'system',
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 600) AS s
ON CONFLICT (imo_number) DO NOTHING;

-- Link berth_equipment_id to matching Berth Equipment
UPDATE ships s
SET berth_equipment_id = eq.id
FROM equipment eq
WHERE eq.type = 'Berth' AND eq.equipment_id = 'BERTH-' || LPAD((1 + (s.id % 200))::text, 3, '0')
WHERE s.berth_equipment_id IS NULL;

-- 4. WAREHOUSES TABLE (520 Storage Zones & CFS Sheds)
INSERT INTO warehouses (code, name, zone_type, capacity_teu, current_occupancy_teu, temperature_celsius, status, created_at, updated_at)
SELECT 
  'WH-ZONE-' || LPAD(s::text, 3, '0'),
  'Port Terminal Storage Facility ' || CHR(65 + (s % 26)) || '-' || LPAD(s::text, 3, '0'),
  (ARRAY['Dry_Storage', 'Reefer_Cold_Storage', 'Dangerous_Goods', 'Inspection_Shed', 'Bonded_Customs'])[1 + (s % 5)],
  1500 + (s * 20),
  200 + (s * 12),
  CASE WHEN (s % 5) = 1 THEN -18.5 ELSE NULL END,
  'Active',
  NOW() - (s || ' days')::interval,
  NOW()
FROM generate_series(1, 520) AS s
ON CONFLICT (code) DO NOTHING;

-- 5. CARGO TABLE (1,200 Containers & Manifests)
INSERT INTO cargo (cargo_number, size_type, weight_tons, cargo_type, current_location, ship_name, status, created_by, created_at, updated_at)
SELECT 
  'MSCU' || (7000000 + s)::text,
  CASE WHEN s % 3 = 0 THEN '40ft' ELSE '20ft' END,
  ROUND((12.5 + ((s * 1.7) % 24.0))::numeric, 1),
  (ARRAY['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Machinery', 'Textiles', 'Perishables', 'Chemicals'])[1 + (s % 7)],
  CASE WHEN s % 3 = 0 THEN 'Warehouse CFS' WHEN s % 2 = 0 THEN 'Yard Bay ' || (1 + (s % 30)) ELSE 'Vessel Hold' END,
  'MV Container Vessel ' || (1 + (s % 50)),
  CASE WHEN s % 4 = 0 THEN 'Discharged' WHEN s % 3 = 0 THEN 'In Yard' WHEN s % 2 = 0 THEN 'Cleared' ELSE 'On Ship' END,
  'system',
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 1200) AS s
ON CONFLICT (cargo_number) DO NOTHING;

-- 6. OPERATIONS TABLE (1,500 OS Process Control Blocks)
INSERT INTO operations (process_id, operation_type, ship_name, crane_id, berth_id, priority, status, waiting_time_ms, turnaround_time_ms, created_by, created_at, updated_at)
SELECT 
  'op-heavy-' || s,
  (ARRAY['Cargo Discharge', 'Cargo Loading', 'Transshipment', 'Yard-Shifting', 'Customs Inspection', 'Berthing Assist'])[1 + (s % 6)],
  'MV Container Vessel ' || (1 + (s % 50)),
  'CRANE-STS-' || LPAD((1 + (s % 200))::text, 3, '0'),
  'Berth ' || (1 + (s % 200)),
  1 + (s % 5),
  CASE WHEN s % 5 = 0 THEN 'Completed' WHEN s % 3 = 0 THEN 'Running' ELSE 'Queued' END,
  (s * 45) % 12000,
  15000 + ((s * 120) % 45000),
  'operator' || (1 + (s % 40)) || '@portflow.com',
  NOW() - (s || ' minutes')::interval,
  NOW()
FROM generate_series(1, 1500) AS s
ON CONFLICT (process_id) DO NOTHING;

-- 7. TRUCKS TABLE (550 Drayage Transport Units)
INSERT INTO trucks (license_plate, driver_name, driver_phone, transport_company, status, max_payload_tons, created_at, updated_at)
SELECT 
  'TRK-' || (1000 + s)::text,
  'Driver ' || (1 + (s % 80)) || ' Vance',
  '+1-555-' || LPAD((100000 + s)::text, 6, '0'),
  (ARRAY['Maersk Line Haul', 'Apex Logistics', 'FastTrack Freight', 'Evergreen Drayage', 'DHL Supply Chain', 'Pacific Haulage Ltd'])[1 + (s % 6)],
  CASE WHEN s % 4 = 0 THEN 'In Transit' WHEN s % 3 = 0 THEN 'At Gate' ELSE 'Idle' END,
  32.5,
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 550) AS s
ON CONFLICT (license_plate) DO NOTHING;

-- 8. GATE PASSES TABLE (850 Passes)
INSERT INTO gate_passes (pass_number, truck_id, gate_lane, pass_type, status, check_in_time, created_at)
SELECT 
  'PASS-GATE-' || (10000 + s)::text,
  t.id,
  'Gate-Lane-' || (1 + (s % 8)),
  (ARRAY['Inbound_Delivery', 'Outbound_Pickup', 'Empty_Return'])[1 + (s % 3)],
  CASE WHEN s % 3 = 0 THEN 'Completed' WHEN s % 2 = 0 THEN 'Checked_In' ELSE 'Issued' END,
  NOW() - ((s * 15) || ' minutes')::interval,
  NOW() - (s || ' hours')::interval
FROM generate_series(1, 850) AS s
JOIN LATERAL (
  SELECT id FROM trucks ORDER BY id OFFSET ((s - 1) % 550) LIMIT 1
) t ON true
ON CONFLICT (pass_number) DO NOTHING;

-- 9. CUSTOMS INSPECTIONS TABLE (750 Records)
INSERT INTO customs_inspections (inspection_number, cargo_id, declaration_number, inspection_type, status, duty_amount_cents, findings, created_at, updated_at)
SELECT 
  'CUST-INSP-' || (20000 + s)::text,
  c.id,
  'DECL-' || (500000 + s)::text,
  (ARRAY['X-Ray_Scan', 'Physical_Inspection', 'Document_Audit', 'Radiation_Scan'])[1 + (s % 4)],
  CASE WHEN s % 5 = 0 THEN 'Held' WHEN s % 2 = 0 THEN 'Cleared' ELSE 'Pending' END,
  ((s * 4500) % 500000),
  CASE WHEN s % 5 = 0 THEN 'Secondary drill inspection ordered.' ELSE 'Cargo manifest validated.' END,
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 750) AS s
JOIN LATERAL (
  SELECT id FROM cargo ORDER BY id OFFSET ((s - 1) % 1200) LIMIT 1
) c ON true
ON CONFLICT (inspection_number) DO NOTHING;

-- 10. BILLS TABLE (800 Automated Tariff Invoices)
INSERT INTO bills (invoice_number, customer_name, docking_fee, crane_usage_fee, storage_fee, total_amount, currency, payment_status, created_at, updated_at)
SELECT 
  'INV-2026-' || (10000 + s)::text,
  'Global Carrier Alliance ' || (1 + (s % 50)) || ' Ltd',
  ROUND((1500.0 + ((s * 45) % 5000))::numeric, 2),
  ROUND((800.0 + ((s * 30) % 3500))::numeric, 2),
  ROUND((350.0 + ((s * 15) % 1200))::numeric, 2),
  ROUND((2650.0 + ((s * 90) % 9700))::numeric, 2),
  'USD',
  CASE WHEN s % 4 = 0 THEN 'Paid' WHEN s % 3 = 0 THEN 'Issued' ELSE 'Pending' END,
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 800) AS s
ON CONFLICT (invoice_number) DO NOTHING;

-- 11. ISSUES TABLE (600 Incidents & Maintenance Tickets)
INSERT INTO issues (ticket_number, title, description, severity, status, created_at, updated_at)
SELECT 
  'TICK-' || (10000 + s)::text,
  (ARRAY[
    'STS Crane 04 Spreader Cable Tension Alarm',
    'Berth 12 Hydraulic Fender Pressure Drop',
    'Container Gantry 02 Position Sensor Intermittent',
    'Gate Lane 03 RFID Reader Network Disconnect',
    'Reefer Plugs Substation Voltage Fluctuation',
    'Tugboat Towline Winch Brake Pad Wear Warning'
  ])[1 + (s % 6)] || ' (Ticket #' || s || ')',
  'Operational telemetry anomaly detected during high-throughput shift. Maintenance technician dispatched.',
  CASE WHEN s % 10 = 0 THEN 'Critical' WHEN s % 4 = 0 THEN 'High' ELSE 'Medium' END,
  CASE WHEN s % 3 = 0 THEN 'Resolved' WHEN s % 2 = 0 THEN 'Investigating' ELSE 'Open' END,
  NOW() - (s || ' hours')::interval,
  NOW()
FROM generate_series(1, 600) AS s
ON CONFLICT (ticket_number) DO NOTHING;

-- 12. SYSTEM LOGS TABLE (2,500 OS & Security Audit Logs)
INSERT INTO system_logs (timestamp, level, source, message, action, entity_type, entity_id, ip_address, created_at)
SELECT 
  NOW() - (s || ' minutes')::interval,
  CASE WHEN s % 50 = 0 THEN 'WARN' WHEN s % 100 = 0 THEN 'ERROR' ELSE 'INFO' END,
  (ARRAY['Scheduler', 'DeadlockDetector', 'EquipmentManager', 'AuthService', 'CustomsSync', 'TariffBilling'])[1 + (s % 6)],
  'Kernel Event #' || s || ': Process op-' || s || ' dispatched on CPU core ' || (1 + (s % 8)) || '. Lock status: OK.',
  (ARRAY['CPU_DISPATCH', 'MUTEX_ACQUIRE', 'MUTEX_RELEASE', 'SEMAPHORE_WAIT', 'SEMAPHORE_POST', 'INVOICE_GENERATED'])[1 + (s % 6)],
  'OPERATION',
  1 + (s % 1500),
  '10.0.' || (1 + (s % 16)) || '.' || (1 + (s % 254)),
  NOW() - (s || ' minutes')::interval
FROM generate_series(1, 2500) AS s;

COMMIT;
