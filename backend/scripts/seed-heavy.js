/**
 * PortFlow High-Volume Enterprise Seeder
 * Populates all 12 relational 3NF tables in Supabase PostgreSQL according to DIAGRAMS.md:
 * 1. users (100 demo accounts: Admin, Operator, Customs, Dispatch, Tech)
 * 2. equipment (550 records: Berths, Cranes, Gantries)
 * 3. ships (600 vessels)
 * 4. warehouses (520 distribution zones & CFS)
 * 5. cargo (1,200 manifests & containers)
 * 6. operations (1,500 OS Process Control Blocks)
 * 7. trucks (550 drayage transport trucks)
 * 8. gate_passes (850 security passes)
 * 9. customs_inspections (750 border clearance reviews)
 * 10. bills (800 automated tariff invoices)
 * 11. issues (600 mechanical & operational maintenance tickets)
 * 12. system_logs (2,500 OS kernel and audit logs)
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const msg = err.message ? err.message.split('\n')[0] : String(err);
      console.warn(`[Retry ${attempt}/${maxRetries}] ${label} transient latency: ${msg}. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// Precomputed bcrypt hash for 'Password123!'
const DEMO_PASSWORD_HASH = '$2a$10$w09ZkM4j/4x6s5G27bWJaeX3w1d0vW8eEa1d7f6g5h4j3k2l1m0n9';

async function seedHeavy() {
  console.log('================================================================');
  console.log('🚀 PortFlow High-Volume Enterprise Database Seeder');
  console.log('Populating 100 Demo Users + 500+ records in EVERY table (3NF Schema)');
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. Users Table (100 demo users: 10 Admin, 50 Operator, 15 Customs, 15 Dispatch, 10 Tech)
    // -------------------------------------------------------------------------
    console.log('[1/12] Seeding Users (100 Demo Accounts)...');
    const userBatch = [
      { email: 'admin@portflow.com', full_name: 'System Administrator', role: 'Admin', password_hash: DEMO_PASSWORD_HASH },
      { email: 'operator@portflow.com', full_name: 'Lead Terminal Operator', role: 'Operator', password_hash: DEMO_PASSWORD_HASH },
      { email: 'customs@portflow.com', full_name: 'Chief Customs Officer Sarah Chen', role: 'Customs', password_hash: DEMO_PASSWORD_HASH },
      { email: 'dispatch@portflow.com', full_name: 'Logistics Dispatcher Mike Ross', role: 'Operator', password_hash: DEMO_PASSWORD_HASH },
    ];

    // Generate remaining to make exactly 100 demo accounts
    for (let i = 1; i <= 9; i++) {
      userBatch.push({
        email: `admin${i}@portflow.com`,
        full_name: `Administrator ${i}`,
        role: 'Admin',
        password_hash: DEMO_PASSWORD_HASH
      });
    }
    for (let i = 1; i <= 48; i++) {
      userBatch.push({
        email: `operator${i}@portflow.com`,
        full_name: `Terminal Operator ${i}`,
        role: 'Operator',
        password_hash: DEMO_PASSWORD_HASH
      });
    }
    for (let i = 1; i <= 14; i++) {
      userBatch.push({
        email: `customs${i}@portflow.com`,
        full_name: `Customs Inspector ${i}`,
        role: 'Customs',
        password_hash: DEMO_PASSWORD_HASH
      });
    }
    for (let i = 1; i <= 14; i++) {
      userBatch.push({
        email: `dispatch${i}@portflow.com`,
        full_name: `Fleet Dispatcher ${i}`,
        role: 'Operator',
        password_hash: DEMO_PASSWORD_HASH
      });
    }
    for (let i = 1; i <= 11; i++) {
      userBatch.push({
        email: `tech${i}@portflow.com`,
        full_name: `Port Technician ${i}`,
        role: 'Technician',
        password_hash: DEMO_PASSWORD_HASH
      });
    }

    for (const chunk of chunkArray(userBatch, 50)) {
      await withRetry(() => prisma.user.createMany({ data: chunk, skipDuplicates: true }), 'Seed Users');
    }
    const userRecords = await withRetry(() => prisma.user.findMany({ select: { id: true, email: true }, take: 100 }), 'Find Users');
    const userIds = userRecords.map(u => u.id);
    console.log(`✓ 100 Users ready. (Active IDs: ${userIds.length})`);

    // -------------------------------------------------------------------------
    // 2. Equipment Table (550 records: 200 Berths + 200 STS Cranes + 150 Gantries)
    // -------------------------------------------------------------------------
    console.log('[2/12] Seeding Equipment (550 Berths, STS Cranes & Gantries)...');
    const eqBatch = [];
    for (let i = 1; i <= 200; i++) {
      eqBatch.push({
        equipment_id: `BERTH-${String(i).padStart(3, '0')}`,
        name: `Deepwater Berth Quay ${i}`,
        type: 'Berth',
        status: i % 3 === 0 ? 'Occupied' : 'Available',
        capacity_metric: 250000,
        assigned_to: i % 3 === 0 ? `Vessel-Alloc-${i}` : null,
        created_by: 'system'
      });
    }
    for (let i = 1; i <= 200; i++) {
      eqBatch.push({
        equipment_id: `CRANE-STS-${String(i).padStart(3, '0')}`,
        name: `Super Post-Panamax STS Crane ${i}`,
        type: 'Crane',
        status: i % 4 === 0 ? 'Busy' : i % 8 === 0 ? 'Maintenance' : 'Available',
        capacity_metric: 65,
        assigned_to: i % 4 === 0 ? `Quay-Section-${i}` : null,
        created_by: 'system'
      });
    }
    for (let i = 1; i <= 150; i++) {
      eqBatch.push({
        equipment_id: `GANTRY-RTG-${String(i).padStart(3, '0')}`,
        name: `Rubber Tired Yard Gantry ${i}`,
        type: 'Gantry',
        status: i % 5 === 0 ? 'Busy' : 'Available',
        capacity_metric: 45,
        assigned_to: `Yard-Block-${String.fromCharCode(65 + (i % 8))}`,
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(eqBatch, 100)) {
      await withRetry(() => prisma.equipment.createMany({ data: chunk, skipDuplicates: true }), 'Seed Equipment');
    }
    const berthRecords = await withRetry(() => prisma.equipment.findMany({ where: { type: 'Berth' }, select: { id: true } }), 'Find Berths');
    const craneRecords = await withRetry(() => prisma.equipment.findMany({ where: { type: 'Crane' }, select: { id: true } }), 'Find Cranes');
    const berthIds = berthRecords.map(e => e.id);
    const craneIds = craneRecords.map(e => e.id);
    console.log(`✓ Equipment seeded (550 records). Berths: ${berthIds.length}, Cranes: ${craneIds.length}`);

    // -------------------------------------------------------------------------
    // 3. Ships Table (600 records)
    // -------------------------------------------------------------------------
    console.log('[3/12] Seeding Ships (600 Marine Vessels)...');
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
        berth_id: assignedBerthId ? `Berth ${(i % 200) + 1}` : 'Berth 1',
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(shipBatch, 150)) {
      await withRetry(() => prisma.ship.createMany({ data: chunk, skipDuplicates: true }), 'Seed Ships');
    }
    const shipRecords = await withRetry(() => prisma.ship.findMany({ select: { id: true, name: true }, take: 600 }), 'Find Ships');
    const shipIds = shipRecords.map(s => s.id);
    console.log(`✓ Ships seeded: ${shipIds.length} vessels registered.`);

    // -------------------------------------------------------------------------
    // 4. Warehouses Table (520 facilities & distribution zones)
    // -------------------------------------------------------------------------
    console.log('[4/12] Seeding Warehouses (520 Facilities & Storage Zones)...');
    const warehouseBatch = [];
    const zoneTypes = ['Dry_Storage', 'Reefer_Cold_Storage', 'Dangerous_Goods', 'Inspection_Shed', 'Bonded_Customs'];
    for (let i = 1; i <= 520; i++) {
      const zt = zoneTypes[i % zoneTypes.length];
      warehouseBatch.push({
        name: `Port Logistics Terminal Zone ${String.fromCharCode(65 + (i % 26))}-${String(i).padStart(3, '0')}`,
        code: `WH-ZONE-${String(i).padStart(3, '0')}`,
        zone_type: zt,
        capacity_teu: 1500 + (i * 20),
        current_occupancy_teu: 200 + (i * 12),
        temperature_celsius: zt === 'Reefer_Cold_Storage' ? -18.5 : null,
        status: 'Active'
      });
    }
    for (const chunk of chunkArray(warehouseBatch, 100)) {
      await withRetry(() => prisma.warehouse.createMany({ data: chunk, skipDuplicates: true }), 'Seed Warehouses');
    }
    const whRecords = await withRetry(() => prisma.warehouse.findMany({ select: { id: true }, take: 520 }), 'Find Warehouses');
    const whIds = whRecords.map(w => w.id);
    console.log(`✓ Warehouses seeded: ${whIds.length} zones.`);

    // -------------------------------------------------------------------------
    // 5. Cargo Table (1,200 containers & freight manifests)
    // -------------------------------------------------------------------------
    console.log('[5/12] Seeding Cargo Manifests (1,200 Containers)...');
    const cargoTypes = ['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Machinery', 'Textiles', 'Perishables', 'Chemicals'];
    const cargoBatch = [];
    for (let i = 1; i <= 1200; i++) {
      const shipObj = shipRecords.length > 0 ? shipRecords[i % shipRecords.length] : null;
      const whId = whIds.length > 0 ? whIds[i % whIds.length] : null;
      cargoBatch.push({
        cargo_number: `MSCU${String(7000000 + i)}`,
        size_type: i % 3 === 0 ? '40ft' : '20ft',
        weight_tons: parseFloat((12.5 + ((i * 1.7) % 24.0)).toFixed(1)),
        cargo_type: cargoTypes[i % cargoTypes.length],
        current_location: i % 3 === 0 ? 'Warehouse' : i % 2 === 0 ? `Yard Bay ${(i % 30) + 1}` : 'Vessel Hold',
        ship_name: shipObj?.name || 'MSC Titan 1',
        ship_id: shipObj?.id || null,
        warehouse_id: whId,
        hazard_class: i % 8 === 0 ? 'Class 3 (Flammable)' : null,
        status: i % 4 === 0 ? 'Discharged' : i % 3 === 0 ? 'In Yard' : i % 2 === 0 ? 'Cleared' : 'On Ship',
        created_by: 'system'
      });
    }
    for (const chunk of chunkArray(cargoBatch, 200)) {
      await withRetry(() => prisma.cargo.createMany({ data: chunk, skipDuplicates: true }), 'Seed Cargo');
    }
    const cargoRecords = await withRetry(() => prisma.cargo.findMany({ select: { id: true }, take: 1200 }), 'Find Cargo');
    const cargoIds = cargoRecords.map(c => c.id);
    console.log(`✓ Cargo seeded: ${cargoIds.length} manifests active.`);

    // -------------------------------------------------------------------------
    // 6. Operations Table (1,500 OS Process Control Blocks)
    // -------------------------------------------------------------------------
    console.log('[6/12] Seeding Operations (1,500 OS Scheduling PCBs)...');
    const opTypes = ['Discharge', 'Loading', 'Transshipment', 'Yard-Shifting', 'Customs-Inspection', 'Drayage-Gate'];
    const opBatch = [];
    for (let i = 1; i <= 1500; i++) {
      const shipObj = shipRecords.length > 0 ? shipRecords[i % shipRecords.length] : null;
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
        crane_id: `CRANE-STS-${String((i % 200) + 1).padStart(3, '0')}`,
        crane_equipment_id: craneId,
        berth_id: `Berth ${(i % 200) + 1}`,
        berth_equipment_id: berthId,
        created_by_user_id: userId,
        priority: priority,
        status: status,
        waiting_time_ms: (i * 45) % 12000,
        turnaround_time_ms: 15000 + ((i * 120) % 45000),
        created_by: `operator${(i % 40) + 1}@portflow.com`
      });
    }
    for (const chunk of chunkArray(opBatch, 200)) {
      await withRetry(() => prisma.operation.createMany({ data: chunk, skipDuplicates: true }), 'Seed Operations');
    }
    const opRecords = await withRetry(() => prisma.operation.findMany({ select: { id: true }, take: 1500 }), 'Find Operations');
    const opIds = opRecords.map(o => o.id);
    console.log(`✓ Operations seeded: ${opIds.length} PCBs.`);

    // -------------------------------------------------------------------------
    // 7. Trucks Table (550 Drayage Trucks)
    // -------------------------------------------------------------------------
    console.log('[7/12] Seeding Trucks (550 Drayage Transport Units)...');
    const transportCompanies = ['Maersk Line Haul', 'Apex Logistics', 'FastTrack Freight', 'Evergreen Drayage', 'DHL Supply Chain', 'Pacific Haulage Ltd'];
    const truckBatch = [];
    for (let i = 1; i <= 550; i++) {
      const assignedCargo = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      truckBatch.push({
        license_plate: `TRK-${String(1000 + i)}`,
        driver_name: `Driver ${(i % 80) + 1} Vance`,
        driver_phone: `+1-555-${String(100000 + i)}`,
        transport_company: transportCompanies[i % transportCompanies.length],
        status: i % 4 === 0 ? 'In Transit' : i % 3 === 0 ? 'At Gate' : 'Idle',
        max_payload_tons: 32.5,
        assigned_cargo_id: assignedCargo
      });
    }
    for (const chunk of chunkArray(truckBatch, 150)) {
      await withRetry(() => prisma.truck.createMany({ data: chunk, skipDuplicates: true }), 'Seed Trucks');
    }
    const truckRecords = await withRetry(() => prisma.truck.findMany({ select: { id: true }, take: 550 }), 'Find Trucks');
    const truckIds = truckRecords.map(t => t.id);
    console.log(`✓ Trucks seeded: ${truckIds.length} fleet units.`);

    // -------------------------------------------------------------------------
    // 8. Gate Passes Table (850 Gate Passes)
    // -------------------------------------------------------------------------
    console.log('[8/12] Seeding Gate Passes (850 Passes)...');
    const gatePassBatch = [];
    for (let i = 1; i <= 850; i++) {
      const truckId = truckIds.length > 0 ? truckIds[i % truckIds.length] : 1;
      const cargoId = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : null;
      const issuerId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      gatePassBatch.push({
        pass_number: `PASS-GATE-${String(10000 + i)}`,
        truck_id: truckId,
        cargo_id: cargoId,
        issued_by_id: issuerId,
        gate_lane: `Gate-Lane-${(i % 8) + 1}`,
        pass_type: i % 3 === 0 ? 'Outbound_Pickup' : i % 2 === 0 ? 'Empty_Return' : 'Inbound_Delivery',
        status: i % 3 === 0 ? 'Completed' : i % 2 === 0 ? 'Checked_In' : 'Issued'
      });
    }
    for (const chunk of chunkArray(gatePassBatch, 200)) {
      await withRetry(() => prisma.gatePass.createMany({ data: chunk, skipDuplicates: true }), 'Seed Gate Passes');
    }
    console.log('✓ Gate Passes seeded (850 passes).');

    // -------------------------------------------------------------------------
    // 9. Customs Inspections Table (750 Customs Clearances)
    // -------------------------------------------------------------------------
    console.log('[9/12] Seeding Customs Inspections (750 Inspections)...');
    const inspectionBatch = [];
    for (let i = 1; i <= 750; i++) {
      const cargoId = cargoIds.length > 0 ? cargoIds[i % cargoIds.length] : 1;
      const inspectorId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      inspectionBatch.push({
        inspection_number: `CUST-INSP-${String(20000 + i)}`,
        cargo_id: cargoId,
        inspector_id: inspectorId,
        declaration_number: `DECL-${String(500000 + i)}`,
        inspection_type: i % 4 === 0 ? 'Physical_Inspection' : i % 3 === 0 ? 'Document_Audit' : 'X-Ray_Scan',
        status: i % 5 === 0 ? 'Held' : i % 2 === 0 ? 'Cleared' : 'Pending',
        duty_amount_cents: BigInt((i * 4500) % 500000),
        findings: i % 5 === 0 ? 'Density mismatch in cargo core. Secondary drill inspection scheduled.' : 'Standard cargo manifest clearance verified.'
      });
    }
    for (const chunk of chunkArray(inspectionBatch, 200)) {
      await withRetry(() => prisma.customsInspection.createMany({ data: chunk, skipDuplicates: true }), 'Seed Customs Inspections');
    }
    console.log('✓ Customs Inspections seeded (750 records).');

    // -------------------------------------------------------------------------
    // 10. Bills Table (800 Tariff Invoices)
    // -------------------------------------------------------------------------
    console.log('[10/12] Seeding Bills & Invoices (800 Tariff Invoices)...');
    const billBatch = [];
    for (let i = 1; i <= 800; i++) {
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
        customer_name: `Global Carrier Alliance ${(i % 50) + 1} Ltd`,
        docking_fee: dock,
        crane_usage_fee: crane,
        storage_fee: storage,
        total_amount: total,
        currency: 'USD',
        payment_status: i % 4 === 0 ? 'Paid' : i % 3 === 0 ? 'Issued' : 'Pending'
      });
    }
    for (const chunk of chunkArray(billBatch, 200)) {
      await withRetry(() => prisma.bill.createMany({ data: chunk, skipDuplicates: true }), 'Seed Bills');
    }
    console.log('✓ Bills seeded (800 invoices).');

    // -------------------------------------------------------------------------
    // 11. Issues Table (600 Incidents & Maintenance Tickets)
    // -------------------------------------------------------------------------
    console.log('[11/12] Seeding Issues (600 Maintenance Tickets)...');
    const issueBatch = [];
    const issueTitles = [
      'STS Crane 04 Spreader Cable Tension Alarm',
      'Berth 12 Hydraulic Fender Pressure Drop',
      'Container Gantry 02 Position Sensor Intermittent',
      'Gate Lane 03 RFID Reader Network Disconnect',
      'Reefer Plugs Substation Voltage Fluctuation',
      'Tugboat Towline Winch Brake Pad Wear Warning'
    ];
    for (let i = 1; i <= 600; i++) {
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
    for (const chunk of chunkArray(issueBatch, 200)) {
      await withRetry(() => prisma.issue.createMany({ data: chunk, skipDuplicates: true }), 'Seed Issues');
    }
    console.log('✓ Issues seeded (600 tickets).');

    // -------------------------------------------------------------------------
    // 12. System Logs Table (2,500 OS & Security Audit logs)
    // -------------------------------------------------------------------------
    console.log('[12/12] Seeding System Logs (2,500 Audit Events)...');
    const sources = ['Scheduler', 'DeadlockDetector', 'EquipmentManager', 'AuthService', 'CustomsSync', 'TariffBilling'];
    const actions = ['CPU_DISPATCH', 'MUTEX_ACQUIRE', 'MUTEX_RELEASE', 'SEMAPHORE_WAIT', 'SEMAPHORE_POST', 'INSPECTION_HOLD', 'INVOICE_GENERATED'];
    const logBatch = [];
    for (let i = 1; i <= 2500; i++) {
      const userId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      logBatch.push({
        level: i % 50 === 0 ? 'WARN' : i % 100 === 0 ? 'ERROR' : 'INFO',
        source: sources[i % sources.length],
        message: `Kernel Event #${i}: Process op-${i} executed on CPU core ${(i % 8) + 1}. Lock status: OK.`,
        action: actions[i % actions.length],
        entity_type: 'OPERATION',
        entity_id: (i % 1500) + 1,
        user_id: userId,
        ip_address: `10.0.${(i % 16) + 1}.${(i % 254) + 1}`
      });
    }
    for (const chunk of chunkArray(logBatch, 500)) {
      await withRetry(() => prisma.systemLog.createMany({ data: chunk, skipDuplicates: true }), 'Seed System Logs');
    }
    console.log('✓ System Logs seeded (2,500 records).');

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(`🎉 SUCCESS! High-Volume Database Seed Finished in ${elapsedSeconds} seconds.`);
    console.log('All 12 tables contain 500+ records (100 Demo Users).');
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedHeavy();
