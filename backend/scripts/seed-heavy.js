/**
 * PortFlow High-Volume Demo Data Bulk Seeder
 * Populates all 12 relational 3NF tables in Supabase PostgreSQL:
 * 1. users
 * 2. equipment (Berths, Cranes, Gantries)
 * 3. ships
 * 4. warehouses
 * 5. cargo
 * 6. operations (PCBs)
 * 7. trucks
 * 8. gate_passes
 * 9. customs_inspections
 * 10. bills
 * 11. issues
 * 12. system_logs
 *
 * Utilizes prisma.createMany() with automatic transient retry for Supabase pooler resilience.
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Helper to chunk arrays
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Resilient retry wrapper for cloud database pooler
async function withRetry(fn, label, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const msg = err.message ? err.message.split('\n')[0] : String(err);
      console.warn(`[Retry ${attempt}/${maxRetries}] ${label} transient latency: ${msg}. Retrying in 2.5s...`);
      await new Promise(r => setTimeout(r, 2500));
    }
  }
}

// Precomputed bcrypt hash for "operator123"
const DEMO_PASSWORD_HASH = '$2a$10$iKz5yYF9xVpU6mR0j2x4fO1u4x/7yO9vW3b8x2f1a6d0c4e8f2a1b';

async function seedHeavy() {
  console.log('================================================================');
  console.log('🚀 PortFlow High-Volume Enterprise Seeder Starting...');
  console.log('Target: Populating all 12 tables in Supabase PostgreSQL (~80% DB capacity)');
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. Users Table (200 records)
    // -------------------------------------------------------------------------
    console.log('[1/12] Seeding Users (200 rows)...');
    const userBatch = [];
    for (let i = 1; i <= 200; i++) {
      userBatch.push({
        email: `operator${i}@portflow.io`,
        password_hash: DEMO_PASSWORD_HASH,
        full_name: `Terminal Operator ${i}`,
        role: i <= 20 ? 'Admin' : 'Operator',
      });
    }
    for (const chunk of chunkArray(userBatch, 100)) {
      await withRetry(() => prisma.user.createMany({ data: chunk, skipDuplicates: true }), 'Seed Users');
    }
    const userRecords = await withRetry(() => prisma.user.findMany({ select: { id: true, email: true }, take: 200 }), 'Find Users');
    const userIds = userRecords.map(u => u.id);
    console.log(`✓ Users seeded. Available IDs count: ${userIds.length}`);

    // -------------------------------------------------------------------------
    // 2. Equipment Table (80 records: 40 Berths + 40 Quay Cranes)
    // -------------------------------------------------------------------------
    console.log('[2/12] Seeding Equipment (80 rows: Berths & Cranes)...');
    const eqBatch = [];
    for (let i = 1; i <= 40; i++) {
      eqBatch.push({
        equipment_id: `BERTH-${String(i).padStart(2, '0')}`,
        name: `Deepwater Berth Quay ${i}`,
        type: 'Berth',
        status: i % 3 === 0 ? 'Occupied' : 'Available',
        capacity_metric: 250000,
        assigned_to: `Vessel-Allocation-Pool-${(i % 5) + 1}`,
        created_by: 'system'
      });
    }
    for (let i = 1; i <= 40; i++) {
      eqBatch.push({
        equipment_id: `CRANE-STS-${String(i).padStart(2, '0')}`,
        name: `Super Post-Panamax STS Crane ${i}`,
        type: 'Crane',
        status: i % 4 === 0 ? 'Busy' : i % 7 === 0 ? 'Maintenance' : 'Available',
        capacity_metric: 65,
        assigned_to: `Quay-Section-${(i % 4) + 1}`,
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(eqBatch, 50)) {
      await withRetry(() => prisma.equipment.createMany({ data: chunk, skipDuplicates: true }), 'Seed Equipment');
    }
    const berthRecords = await withRetry(() => prisma.equipment.findMany({ where: { type: 'Berth' }, select: { id: true } }), 'Find Berths');
    const craneRecords = await withRetry(() => prisma.equipment.findMany({ where: { type: 'Crane' }, select: { id: true } }), 'Find Cranes');
    const berthIds = berthRecords.map(e => e.id);
    const craneIds = craneRecords.map(e => e.id);
    console.log(`✓ Equipment seeded. Berths: ${berthIds.length}, Cranes: ${craneIds.length}`);

    // -------------------------------------------------------------------------
    // 3. Ships Table (600 records)
    // -------------------------------------------------------------------------
    console.log('[3/12] Seeding Ships (600 vessels)...');
    const vesselPrefixes = ['MSC', 'Maersk', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'HMM', 'ZIM', 'Yang Ming'];
    const vesselSuffixes = ['Titan', 'Glory', 'Pioneer', 'Horizon', 'Voyager', 'Navigator', 'Express', 'Leader', 'Sovereign', 'Vanguard'];
    const shipBatch = [];
    for (let i = 1; i <= 600; i++) {
      const pfx = vesselPrefixes[i % vesselPrefixes.length];
      const sfx = vesselSuffixes[Math.floor(i / 10) % vesselSuffixes.length];
      const assignedBerthId = berthIds.length > 0 ? berthIds[i % berthIds.length] : null;
      shipBatch.push({
        imo_number: `IMO-${String(9000000 + i)}`,
        name: `${pfx} ${sfx} ${i}`,
        vessel_type: i % 5 === 0 ? 'Bulk Carrier' : i % 4 === 0 ? 'Oil Tanker' : 'Container Ship',
        capacity_teu: 5000 + ((i * 37) % 19000),
        status: i % 4 === 0 ? 'Docked' : i % 3 === 0 ? 'Berthed' : i % 2 === 0 ? 'Arriving' : 'Arrived',
        berth_equipment_id: assignedBerthId,
        berth_id: assignedBerthId ? `Berth ${(i % 40) + 1}` : 'Berth 1',
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(shipBatch, 200)) {
      await withRetry(() => prisma.ship.createMany({ data: chunk, skipDuplicates: true }), 'Seed Ships');
    }
    const shipRecords = await withRetry(() => prisma.ship.findMany({ select: { id: true, name: true }, take: 600 }), 'Find Ships');
    const shipIds = shipRecords.map(s => s.id);
    console.log(`✓ Ships seeded: ${shipIds.length} vessels registered.`);

    // -------------------------------------------------------------------------
    // 4. Warehouses Table (40 records)
    // -------------------------------------------------------------------------
    console.log('[4/12] Seeding Warehouses (40 distribution zones)...');
    const warehouseBatch = [];
    for (let i = 1; i <= 40; i++) {
      warehouseBatch.push({
        name: `Port Logistics Facility ${String.fromCharCode(65 + (i % 26))}-${Math.ceil(i / 26)}`,
        code: `WH-ZONE-${String(i).padStart(3, '0')}`,
        zone_type: i % 4 === 0 ? 'Cold_Storage' : i % 3 === 0 ? 'Hazardous_Material' : i % 2 === 0 ? 'Bonded_Customs' : 'General_Dry',
        capacity_teu: 2000 + (i * 150),
        current_occupancy_teu: 500 + (i * 80),
        status: 'Active'
      });
    }
    for (const chunk of chunkArray(warehouseBatch, 40)) {
      await withRetry(() => prisma.warehouse.createMany({ data: chunk, skipDuplicates: true }), 'Seed Warehouses');
    }
    const whRecords = await withRetry(() => prisma.warehouse.findMany({ select: { id: true }, take: 40 }), 'Find Warehouses');
    const whIds = whRecords.map(w => w.id);
    console.log(`✓ Warehouses seeded: ${whIds.length} zones.`);

    // -------------------------------------------------------------------------
    // 5. Cargo Table (3,500 containers)
    // -------------------------------------------------------------------------
    console.log('[5/12] Seeding Cargo Manifests (3,500 containers)...');
    const cargoTypes = ['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Machinery', 'Textiles', 'Perishables', 'Chemicals'];
    const cargoBatch = [];
    for (let i = 1; i <= 3500; i++) {
      const shipObj = shipRecords[i % shipRecords.length];
      const whId = whIds.length > 0 ? whIds[i % whIds.length] : null;
      cargoBatch.push({
        cargo_number: `MSCU${String(7000000 + i)}`,
        size_type: i % 3 === 0 ? '40ft' : '20ft',
        weight_tons: parseFloat((12.5 + ((i * 1.7) % 24.0)).toFixed(1)),
        cargo_type: cargoTypes[i % cargoTypes.length],
        current_location: i % 3 === 0 ? 'Warehouse' : i % 2 === 0 ? 'Yard Bay 14' : 'Vessel Hold',
        ship_name: shipObj?.name || 'MSC Titan 1',
        ship_id: shipObj?.id || null,
        warehouse_id: whId,
        hazard_class: i % 8 === 0 ? 'Class 3 (Flammable)' : null,
        status: i % 4 === 0 ? 'Discharged' : i % 3 === 0 ? 'In Yard' : i % 2 === 0 ? 'Cleared' : 'On Ship',
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(cargoBatch, 500)) {
      await withRetry(() => prisma.cargo.createMany({ data: chunk, skipDuplicates: true }), 'Seed Cargo');
    }
    const cargoRecords = await withRetry(() => prisma.cargo.findMany({ select: { id: true, cargo_number: true }, take: 3500 }), 'Find Cargo');
    const cargoIds = cargoRecords.map(c => c.id);
    console.log(`✓ Cargo seeded: ${cargoIds.length} manifests active.`);

    // -------------------------------------------------------------------------
    // 6. Operations Table (5,000 OS Process Control Blocks)
    // -------------------------------------------------------------------------
    console.log('[6/12] Seeding Operations (5,000 OS PCB operations)...');
    const opTypes = ['Discharge', 'Loading', 'Transshipment', 'Yard-Shifting', 'Customs-Inspection', 'Drayage-Gate'];
    const opBatch = [];
    for (let i = 1; i <= 5000; i++) {
      const shipObj = shipRecords[i % shipRecords.length];
      const cargoId = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      const craneId = craneIds.length > 0 ? craneIds[i % craneIds.length] : null;
      const berthId = berthIds.length > 0 ? berthIds[i % berthIds.length] : null;
      const userId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      const priority = (i % 5) + 1;
      const status = i % 5 === 0 ? 'Completed' : i % 3 === 0 ? 'Running' : 'Queued';

      opBatch.push({
        process_id: `op-heavy-${i}`,
        operation_type: opTypes[i % opTypes.length],
        ship_name: shipObj?.name || 'MSC Titan 1',
        ship_id: shipObj?.id || null,
        cargo_id: cargoId,
        crane_id: `CRANE-STS-${String((i % 40) + 1).padStart(2, '0')}`,
        crane_equipment_id: craneId,
        berth_id: `Berth ${(i % 40) + 1}`,
        berth_equipment_id: berthId,
        created_by_user_id: userId,
        priority: priority,
        status: status,
        waiting_time_ms: (i * 45) % 12000,
        turnaround_time_ms: 15000 + ((i * 120) % 45000),
        created_by: `operator${(i % 50) + 1}@portflow.io`
      });
    }
    for (const chunk of chunkArray(opBatch, 500)) {
      await withRetry(() => prisma.operation.createMany({ data: chunk, skipDuplicates: true }), 'Seed Operations');
    }
    const opRecords = await withRetry(() => prisma.operation.findMany({ select: { id: true }, take: 5000 }), 'Find Operations');
    const opIds = opRecords.map(o => o.id);
    console.log(`✓ Operations seeded: ${opIds.length} PCBs.`);

    // -------------------------------------------------------------------------
    // 7. Trucks Table (400 drayage trucks)
    // -------------------------------------------------------------------------
    console.log('[7/12] Seeding Trucks (400 land drayage vehicles)...');
    const transportCompanies = ['Maersk Line Haul', 'Apex Logistics', 'FastTrack Freight', 'Evergreen Drayage', 'DHL Supply Chain'];
    const truckBatch = [];
    for (let i = 1; i <= 400; i++) {
      const assignedCargo = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      truckBatch.push({
        license_plate: `TRK-${String(1000 + i)}`,
        driver_name: `Driver ${(i % 50) + 1} Singh`,
        driver_phone: `+1-555-${String(100000 + i)}`,
        transport_company: transportCompanies[i % transportCompanies.length],
        status: i % 4 === 0 ? 'En_Route' : i % 3 === 0 ? 'At_Gate' : 'Idle',
        max_payload_tons: 32.5,
        assigned_cargo_id: assignedCargo
      });
    }
    for (const chunk of chunkArray(truckBatch, 200)) {
      await withRetry(() => prisma.truck.createMany({ data: chunk, skipDuplicates: true }), 'Seed Trucks');
    }
    const truckRecords = await withRetry(() => prisma.truck.findMany({ select: { id: true }, take: 400 }), 'Find Trucks');
    const truckIds = truckRecords.map(t => t.id);
    console.log(`✓ Trucks seeded: ${truckIds.length} fleet units.`);

    // -------------------------------------------------------------------------
    // 8. Gate Passes Table (1,500 security passes)
    // -------------------------------------------------------------------------
    console.log('[8/12] Seeding Gate Passes (1,500 gate passes)...');
    const gatePassBatch = [];
    for (let i = 1; i <= 1500; i++) {
      const truckId = truckIds[i % truckIds.length];
      const cargoId = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      const issuerId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      gatePassBatch.push({
        pass_number: `PASS-GATE-${String(10000 + i)}`,
        truck_id: truckId,
        cargo_id: cargoId,
        issued_by_id: issuerId,
        gate_lane: `Gate-Lane-${(i % 6) + 1}`,
        pass_type: i % 3 === 0 ? 'Outbound_Pickup' : i % 2 === 0 ? 'Empty_Return' : 'Inbound_Delivery',
        status: i % 3 === 0 ? 'Completed' : i % 2 === 0 ? 'Validated' : 'Issued'
      });
    }
    for (const chunk of chunkArray(gatePassBatch, 500)) {
      await withRetry(() => prisma.gatePass.createMany({ data: chunk, skipDuplicates: true }), 'Seed Gate Passes');
    }
    console.log('✓ Gate Passes seeded.');

    // -------------------------------------------------------------------------
    // 9. Customs Inspections Table (2,500 regulatory inspections)
    // -------------------------------------------------------------------------
    console.log('[9/12] Seeding Customs Inspections (2,500 border clearances)...');
    const inspectionBatch = [];
    for (let i = 1; i <= 2500; i++) {
      const cargoId = cargoIds[i % cargoIds.length];
      const inspectorId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      inspectionBatch.push({
        inspection_number: `CUST-INSP-${String(20000 + i)}`,
        cargo_id: cargoId,
        inspector_id: inspectorId,
        declaration_number: `DECL-${String(500000 + i)}`,
        inspection_type: i % 4 === 0 ? 'Physical_Inspection' : i % 3 === 0 ? 'Document_Audit' : 'X-Ray_Scan',
        status: i % 5 === 0 ? 'Held' : i % 2 === 0 ? 'Cleared' : 'Pending',
        duty_amount_cents: BigInt((i * 4500) % 500000),
        findings: i % 5 === 0 ? 'Density mismatch in cargo core. Secondary physical drill ordered.' : 'Standard manifest clearance satisfied.'
      });
    }
    for (const chunk of chunkArray(inspectionBatch, 500)) {
      await withRetry(() => prisma.customsInspection.createMany({ data: chunk, skipDuplicates: true }), 'Seed Customs Inspections');
    }
    console.log('✓ Customs Inspections seeded.');

    // -------------------------------------------------------------------------
    // 10. Bills Table (3,000 tariff invoices)
    // -------------------------------------------------------------------------
    console.log('[10/12] Seeding Bills & Invoices (3,000 automated tariff invoices)...');
    const billBatch = [];
    for (let i = 1; i <= 3000; i++) {
      const shipId = shipIds.length > 0 ? shipIds[i % shipIds.length] : null;
      const cargoId = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      const opId = opIds.length > 0 ? opIds[i % opIds.length] : null;
      const dock = parseFloat((1500 + ((i * 45) % 5000)).toFixed(2));
      const crane = parseFloat((800 + ((i * 30) % 3500)).toFixed(2));
      const storage = parseFloat((350 + ((i * 15) % 1200)).toFixed(2));
      const total = parseFloat((dock + crane + storage).toFixed(2));

      billBatch.push({
        invoice_number: `INV-2026-${String(10000 + i)}`,
        ship_id: shipId,
        cargo_id: cargoId,
        operation_id: opId,
        customer_name: `Global Logistics Client ${(i % 80) + 1} Ltd`,
        docking_fee: dock,
        crane_usage_fee: crane,
        storage_fee: storage,
        total_amount: total,
        currency: 'USD',
        payment_status: i % 4 === 0 ? 'Paid' : i % 3 === 0 ? 'Issued' : 'Draft'
      });
    }
    for (const chunk of chunkArray(billBatch, 500)) {
      await withRetry(() => prisma.bill.createMany({ data: chunk, skipDuplicates: true }), 'Seed Bills');
    }
    console.log('✓ Bills & Invoices seeded.');

    // -------------------------------------------------------------------------
    // 11. Issues Table (800 incidents & maintenance tickets)
    // -------------------------------------------------------------------------
    console.log('[11/12] Seeding Issues (800 maintenance & operational incidents)...');
    const issueBatch = [];
    const issueTitles = [
      'STS Crane 04 Spreader Cable Tension Alarm',
      'Berth 12 Hydraulic Fender Pressure Drop',
      'Container Gantry 02 Position Sensor Intermittent',
      'Gate Lane 03 RFID Reader Network Disconnect',
      'Reefer Plugs Substation Voltage Fluctuation',
      'Tugboat Towline Winch Brake Pad Wear Warning'
    ];
    for (let i = 1; i <= 800; i++) {
      const reporterId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      const eqId = craneIds.length > 0 ? craneIds[i % craneIds.length] : null;
      issueBatch.push({
        ticket_number: `TICK-${String(10000 + i)}`,
        title: `${issueTitles[i % issueTitles.length]} (#${i})`,
        description: `Operational telemetry anomaly detected during high-throughput shift. Maintenance technician dispatched for physical inspection.`,
        severity: i % 10 === 0 ? 'Critical' : i % 4 === 0 ? 'High' : 'Medium',
        status: i % 3 === 0 ? 'Resolved' : i % 2 === 0 ? 'Investigating' : 'Open',
        reported_by_id: reporterId,
        equipment_id: eqId
      });
    }
    for (const chunk of chunkArray(issueBatch, 400)) {
      await withRetry(() => prisma.issue.createMany({ data: chunk, skipDuplicates: true }), 'Seed Issues');
    }
    console.log('✓ Issues seeded.');

    // -------------------------------------------------------------------------
    // 12. System Logs Table (10,000 OS & Security Audit logs)
    // -------------------------------------------------------------------------
    console.log('[12/12] Seeding System Logs (10,000 telemetry & audit events)...');
    const sources = ['Scheduler', 'DeadlockDetector', 'EquipmentManager', 'AuthService', 'CustomsSync', 'TariffBilling'];
    const actions = ['CPU_DISPATCH', 'MUTEX_ACQUIRE', 'MUTEX_RELEASE', 'SEMAPHORE_WAIT', 'SEMAPHORE_POST', 'INSPECTION_HOLD', 'INVOICE_GENERATED'];
    const logBatch = [];
    for (let i = 1; i <= 10000; i++) {
      const userId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      logBatch.push({
        level: i % 50 === 0 ? 'WARN' : i % 100 === 0 ? 'ERROR' : 'INFO',
        source: sources[i % sources.length],
        message: `Kernel Event #${i}: Process op-${i} executed on CPU core ${(i % 8) + 1}. Lock status: OK.`,
        action: actions[i % actions.length],
        entity_type: 'OPERATION',
        entity_id: (i % 5000) + 1,
        user_id: userId,
        ip_address: `10.0.${(i % 16) + 1}.${(i % 254) + 1}`
      });
    }
    for (const chunk of chunkArray(logBatch, 1000)) {
      await withRetry(() => prisma.systemLog.createMany({ data: chunk, skipDuplicates: true }), 'Seed System Logs');
    }
    console.log('✓ System Logs seeded.');

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(`🎉 SUCCESS! High-Volume Seed Finished in ${elapsedSeconds} seconds.`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedHeavy();
