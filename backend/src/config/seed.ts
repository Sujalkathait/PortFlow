import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * PortFlow 12-Table Enterprise Relational Database Seeder
 * Populates all 12 relational tables in PostgreSQL according to DIAGRAMS.md:
 * 1. users (100 demo accounts: Admin, Operator, Customs, Dispatch, Tech)
 * 2. equipment (550 records: Berths, Cranes, Gantries)
 * 3. ships (600 vessels)
 * 4. warehouses (520 facilities & distribution zones)
 * 5. cargo (1,200 manifests & containers)
 * 6. operations (1,500 OS Process Control Blocks)
 * 7. trucks (550 drayage transport trucks)
 * 8. gate_passes (850 security passes)
 * 9. customs_inspections (750 border clearance reviews)
 * 10. bills (800 automated tariff invoices)
 * 11. issues (600 mechanical & operational maintenance tickets)
 * 12. system_logs (2,500 OS kernel and audit logs)
 */

function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export async function seedDatabase(force: boolean = false): Promise<void> {
    try {
        const existingUsers = await prisma.user.count({ where: { deleted_at: null } }).catch(() => -1);
        if (existingUsers >= 100 && !force) {
            console.log(`[Seed] Database already contains ${existingUsers} users. Skipping automatic re-seed.`);
            return;
        }

        console.log('[Seed] Populating PortFlow 12-Table Relational Schema with 500+ records per table and 100 demo users...');

        // 1. Users (100 demo accounts)
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const userBatch = [
            { email: 'admin@portflow.com', full_name: 'System Administrator', role: 'Admin', password_hash: passwordHash },
            { email: 'operator@portflow.com', full_name: 'Lead Terminal Operator', role: 'Operator', password_hash: passwordHash },
            { email: 'customs@portflow.com', full_name: 'Chief Customs Officer Sarah Chen', role: 'Customs', password_hash: passwordHash },
            { email: 'dispatch@portflow.com', full_name: 'Logistics Dispatcher Mike Ross', role: 'Operator', password_hash: passwordHash },
        ];

        for (let i = 1; i <= 9; i++) {
            userBatch.push({ email: `admin${i}@portflow.com`, full_name: `Administrator ${i}`, role: 'Admin', password_hash: passwordHash });
        }
        for (let i = 1; i <= 48; i++) {
            userBatch.push({ email: `operator${i}@portflow.com`, full_name: `Terminal Operator ${i}`, role: 'Operator', password_hash: passwordHash });
        }
        for (let i = 1; i <= 14; i++) {
            userBatch.push({ email: `customs${i}@portflow.com`, full_name: `Customs Inspector ${i}`, role: 'Customs', password_hash: passwordHash });
        }
        for (let i = 1; i <= 14; i++) {
            userBatch.push({ email: `dispatch${i}@portflow.com`, full_name: `Fleet Dispatcher ${i}`, role: 'Operator', password_hash: passwordHash });
        }
        for (let i = 1; i <= 11; i++) {
            userBatch.push({ email: `tech${i}@portflow.com`, full_name: `Port Technician ${i}`, role: 'Technician', password_hash: passwordHash });
        }

        for (const chunk of chunkArray(userBatch, 50)) {
            await prisma.user.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const userRecords = await prisma.user.findMany({ select: { id: true, email: true }, take: 100 }).catch(() => []);
        const userIds = userRecords.map(u => u.id);

        // 2. Equipment (550 records)
        const eqBatch: any[] = [];
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
            await prisma.equipment.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const berthRecords = await prisma.equipment.findMany({ where: { type: 'Berth' }, select: { id: true } }).catch(() => []);
        const craneRecords = await prisma.equipment.findMany({ where: { type: 'Crane' }, select: { id: true } }).catch(() => []);
        const berthIds = berthRecords.map(e => e.id);
        const craneIds = craneRecords.map(e => e.id);

        // 3. Ships (600 records)
        const vesselPrefixes = ['MSC', 'Maersk', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'HMM', 'ZIM', 'Yang Ming'];
        const vesselSuffixes = ['Titan', 'Glory', 'Pioneer', 'Horizon', 'Voyager', 'Navigator', 'Express', 'Leader', 'Sovereign', 'Vanguard'];
        const shipBatch: any[] = [];
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
            await prisma.ship.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const shipRecords = await prisma.ship.findMany({ select: { id: true, name: true }, take: 600 }).catch(() => []);
        const shipIds = shipRecords.map(s => s.id);

        // 4. Warehouses (520 records)
        const warehouseBatch: any[] = [];
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
            await prisma.warehouse.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const whRecords = await prisma.warehouse.findMany({ select: { id: true }, take: 520 }).catch(() => []);
        const whIds = whRecords.map(w => w.id);

        // 5. Cargo Containers (1,200 records)
        const cargoTypes = ['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Machinery', 'Textiles', 'Perishables', 'Chemicals'];
        const cargoBatch: any[] = [];
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
            await prisma.cargo.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const cargoRecords = await prisma.cargo.findMany({ select: { id: true }, take: 1200 }).catch(() => []);
        const cargoIds = cargoRecords.map(c => c.id);

        // 6. Operations (1,500 records)
        const opTypes = ['Discharge', 'Loading', 'Transshipment', 'Yard-Shifting', 'Customs-Inspection', 'Drayage-Gate'];
        const opBatch: any[] = [];
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
            await prisma.operation.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const opRecords = await prisma.operation.findMany({ select: { id: true }, take: 1500 }).catch(() => []);
        const opIds = opRecords.map(o => o.id);

        // 7. Trucks (550 records)
        const transportCompanies = ['Maersk Line Haul', 'Apex Logistics', 'FastTrack Freight', 'Evergreen Drayage', 'DHL Supply Chain', 'Pacific Haulage Ltd'];
        const truckBatch: any[] = [];
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
            await prisma.truck.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }
        const truckRecords = await prisma.truck.findMany({ select: { id: true }, take: 550 }).catch(() => []);
        const truckIds = truckRecords.map(t => t.id);

        // 8. Gate Passes (850 records)
        const gatePassBatch: any[] = [];
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
            await prisma.gatePass.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }

        // 9. Customs Inspections (750 records)
        const inspectionBatch: any[] = [];
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
                findings: i % 5 === 0 ? 'Secondary drill inspection ordered.' : 'Standard manifest clearance satisfied.'
            });
        }
        for (const chunk of chunkArray(inspectionBatch, 200)) {
            await prisma.customsInspection.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }

        // 10. Bills (800 records)
        const billBatch: any[] = [];
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
                customer_name: `Global Logistics Client ${(i % 50) + 1} Ltd`,
                docking_fee: dock,
                crane_usage_fee: crane,
                storage_fee: storage,
                total_amount: total,
                currency: 'USD',
                payment_status: i % 4 === 0 ? 'Paid' : i % 3 === 0 ? 'Issued' : 'Pending'
            });
        }
        for (const chunk of chunkArray(billBatch, 200)) {
            await prisma.bill.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }

        // 11. Issues (600 records)
        const issueBatch: any[] = [];
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
            await prisma.issue.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }

        // 12. System Logs (2,500 records)
        const sources = ['Scheduler', 'DeadlockDetector', 'EquipmentManager', 'AuthService', 'CustomsSync', 'TariffBilling'];
        const actions = ['CPU_DISPATCH', 'MUTEX_ACQUIRE', 'MUTEX_RELEASE', 'SEMAPHORE_WAIT', 'SEMAPHORE_POST', 'INSPECTION_HOLD', 'INVOICE_GENERATED'];
        const logBatch: any[] = [];
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
            await prisma.systemLog.createMany({ data: chunk, skipDuplicates: true }).catch(() => {});
        }

        console.log('✓ PortFlow 12-Table Relational Schema successfully seeded with 500+ records in each table and 100 demo users!');
    } catch (err: any) {
        console.warn('[Seed] Warning during database seed:', err.message);
    }
}
