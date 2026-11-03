import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * PortFlow 12-Table Enterprise Relational Database Seeder
 * Populates all 12 relational tables in PostgreSQL with realistic operational records:
 * 1. users
 * 2. equipment (Berths, STS Quay Cranes, Yard Gantries)
 * 3. ships
 * 4. warehouses (Dry Storage & Cold Chain Reefer Units)
 * 5. cargo (20ft, 40ft containers with TEU & tare weights)
 * 6. operations (PCBs with OS scheduling priorities)
 * 7. trucks (Land logistics drayage fleet)
 * 8. gate_passes (Security lanes & access timestamps)
 * 9. customs_inspections (Regulatory tariff checks & duty rates)
 * 10. bills (Itemized docking, crane, and storage fee invoices)
 * 11. issues (Fault tickets & mechanical breakdown alerts)
 * 12. system_logs (Immutable audit trail & OS kernel events)
 */
export async function seedDatabase(force: boolean = false): Promise<void> {
    try {
        const existingShips = await prisma.ship.count({ where: { deleted_at: null } }).catch(() => -1);
        if (existingShips > 0 && !force) {
            console.log(`[Seed] Database already contains ${existingShips} vessels. Skipping automatic re-seed.`);
            return;
        }

        console.log('[Seed] Populating PortFlow 12-Table Relational Schema...');

        // 1. Users
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const usersData = [
            { email: 'admin@portflow.com', full_name: 'System Administrator', role: 'Admin', password_hash: passwordHash },
            { email: 'operator@portflow.com', full_name: 'Terminal Operator', role: 'Operator', password_hash: passwordHash },
            { email: 'customs@portflow.com', full_name: 'Customs Officer Sarah Chen', role: 'Inspector', password_hash: passwordHash },
            { email: 'dispatch@portflow.com', full_name: 'Logistics Dispatcher Mike Ross', role: 'Operator', password_hash: passwordHash },
        ];

        for (const u of usersData) {
            await prisma.user.upsert({
                where: { email: u.email },
                update: {},
                create: u
            }).catch(() => {});
        }

        const adminUser = await prisma.user.findFirst({ where: { email: 'admin@portflow.com' } });
        const operatorUser = await prisma.user.findFirst({ where: { email: 'operator@portflow.com' } });
        const customsUser = await prisma.user.findFirst({ where: { email: 'customs@portflow.com' } });

        // 2. Equipment (Berths & Cranes)
        const equipmentData = [
            { equipment_id: 'BERTH-01', name: 'Quay Berth 01 (Deepwater)', type: 'Berth', status: 'Occupied', capacity_metric: 250000, assigned_to: 'MV Ever Given' },
            { equipment_id: 'BERTH-02', name: 'Quay Berth 02 (Standard)', type: 'Berth', status: 'Available', capacity_metric: 180000, assigned_to: null },
            { equipment_id: 'BERTH-03', name: 'Quay Berth 03 (Feeder)', type: 'Berth', status: 'Available', capacity_metric: 120000, assigned_to: null },
            { equipment_id: 'CRANE-STS-01', name: 'Super Post-Panamax STS Crane 01', type: 'Crane', status: 'Busy', capacity_metric: 65, assigned_to: 'MV Ever Given' },
            { equipment_id: 'CRANE-STS-02', name: 'Post-Panamax STS Crane 02', type: 'Crane', status: 'Available', capacity_metric: 50, assigned_to: null },
            { equipment_id: 'CRANE-STS-03', name: 'Heavy Lift STS Crane 03', type: 'Crane', status: 'Maintenance', capacity_metric: 80, assigned_to: null },
            { equipment_id: 'WH-EQ-01', name: 'Yard Gantry Transporter 01', type: 'Warehouse', status: 'Available', capacity_metric: 40, assigned_to: null },
        ];

        for (const eq of equipmentData) {
            await prisma.equipment.upsert({
                where: { equipment_id: eq.equipment_id },
                update: {},
                create: eq
            }).catch(() => {});
        }

        const berth1 = await prisma.equipment.findFirst({ where: { equipment_id: 'BERTH-01' } });
        const crane1 = await prisma.equipment.findFirst({ where: { equipment_id: 'CRANE-STS-01' } });

        // 3. Ships
        const shipsData = [
            {
                imo_number: 'IMO9811000',
                name: 'MV Ever Given',
                vessel_type: 'Container Ship',
                capacity_teu: 20124,
                status: 'Docked',
                berth_id: 'BERTH-01',
                berth_equipment_id: berth1?.id || null,
                eta: new Date(Date.now() - 86400000),
                etd: new Date(Date.now() + 86400000 * 2)
            },
            {
                imo_number: 'IMO9708693',
                name: 'MSC Oscar',
                vessel_type: 'Ultra Large Container Vessel',
                capacity_teu: 19224,
                status: 'Arriving',
                berth_id: 'BERTH-02',
                eta: new Date(Date.now() + 3600000 * 4),
                etd: new Date(Date.now() + 86400000 * 3)
            },
            {
                imo_number: 'IMO9839272',
                name: 'CMA CGM Jacques Saadé',
                vessel_type: 'LNG Powered Container Vessel',
                capacity_teu: 23000,
                status: 'Docked',
                berth_id: 'BERTH-03',
                eta: new Date(Date.now() - 43200000),
                etd: new Date(Date.now() + 86400000)
            },
            {
                imo_number: 'IMO9632064',
                name: 'Maersk Mc-Kinney Moller',
                vessel_type: 'Triple-E Class Container Ship',
                capacity_teu: 18270,
                status: 'Departed',
                berth_id: null,
                eta: new Date(Date.now() - 86400000 * 3),
                etd: new Date(Date.now() - 86400000)
            }
        ];

        for (const s of shipsData) {
            await prisma.ship.upsert({
                where: { imo_number: s.imo_number },
                update: {},
                create: s
            }).catch(() => {});
        }

        const ship1 = await prisma.ship.findFirst({ where: { imo_number: 'IMO9811000' } });

        // 4. Warehouses
        const warehousesData = [
            { code: 'WH-CFS-01', name: 'Central CFS Dry Storage Yard', zone_type: 'Dry_Storage', capacity_teu: 500, current_occupancy_teu: 142, status: 'Active' },
            { code: 'WH-REEFER-01', name: 'Cold Chain Reefer Storage Unit', zone_type: 'Reefer_Cold_Storage', capacity_teu: 200, current_occupancy_teu: 45, temperature_celsius: -18.5, status: 'Active' },
            { code: 'WH-HAZ-01', name: 'Hazmat Hazardous Freight Enclosure', zone_type: 'Dangerous_Goods', capacity_teu: 100, current_occupancy_teu: 12, status: 'Active' },
            { code: 'WH-INSP-01', name: 'Customs Examination Warehouse', zone_type: 'Inspection_Shed', capacity_teu: 150, current_occupancy_teu: 28, status: 'Active' }
        ];

        for (const w of warehousesData) {
            await prisma.warehouse.upsert({
                where: { code: w.code },
                update: {},
                create: w
            }).catch(() => {});
        }

        const dryWh = await prisma.warehouse.findFirst({ where: { code: 'WH-CFS-01' } });
        const reeferWh = await prisma.warehouse.findFirst({ where: { code: 'WH-REEFER-01' } });

        // 5. Cargo Containers
        const cargoData = [
            { cargo_number: 'MSKU-902148', size_type: '40ft', weight_tons: 28.5, cargo_type: 'Electronics', current_location: 'Yard A-04', ship_name: 'MV Ever Given', ship_id: ship1?.id, warehouse_id: dryWh?.id, hazard_class: 'None', status: 'In Yard' },
            { cargo_number: 'CMAU-332194', size_type: '20ft', weight_tons: 14.2, cargo_type: 'Perishables', current_location: 'Reefer Zone R-02', ship_name: 'MV Ever Given', ship_id: ship1?.id, warehouse_id: reeferWh?.id, hazard_class: 'None', status: 'Cleared' },
            { cargo_number: 'COSU-771239', size_type: '40ft', weight_tons: 31.0, cargo_type: 'Industrial Machinery', current_location: 'Vessel Bay 12', ship_name: 'MV Ever Given', ship_id: ship1?.id, warehouse_id: dryWh?.id, hazard_class: 'None', status: 'On Ship' },
            { cargo_number: 'EVER-114920', size_type: '20ft', weight_tons: 18.7, cargo_type: 'Chemical Products', current_location: 'Hazmat Enclosure', ship_name: 'CMA CGM Jacques Saadé', warehouse_id: dryWh?.id, hazard_class: 'Class 3 (Flammable Liquid)', status: 'In Yard' },
            { cargo_number: 'HLCU-552910', size_type: '40ft', weight_tons: 24.0, cargo_type: 'Consumer Goods', current_location: 'Truck Interchange', ship_name: 'MSC Oscar', warehouse_id: dryWh?.id, hazard_class: 'None', status: 'In Transit' }
        ];

        for (const c of cargoData) {
            await prisma.cargo.upsert({
                where: { cargo_number: c.cargo_number },
                update: {},
                create: c
            }).catch(() => {});
        }

        const cargo1 = await prisma.cargo.findFirst({ where: { cargo_number: 'MSKU-902148' } });
        const cargo2 = await prisma.cargo.findFirst({ where: { cargo_number: 'CMAU-332194' } });

        // 6. Operations (PCBs)
        const operationsData = [
            {
                process_id: 'OP-PROC-101',
                operation_type: 'Cargo Discharge',
                ship_name: 'MV Ever Given',
                ship_id: ship1?.id,
                cargo_id: cargo1?.id,
                crane_id: 'CRANE-STS-01',
                crane_equipment_id: crane1?.id,
                berth_id: 'BERTH-01',
                berth_equipment_id: berth1?.id,
                created_by_user_id: operatorUser?.id,
                priority: 3,
                status: 'Running',
                start_time: new Date(Date.now() - 1800000),
                waiting_time_ms: 1240,
                turnaround_time_ms: 0,
                created_by: 'operator@portflow.com'
            },
            {
                process_id: 'OP-PROC-102',
                operation_type: 'Cargo Loading',
                ship_name: 'MV Ever Given',
                ship_id: ship1?.id,
                cargo_id: cargo2?.id,
                crane_id: 'CRANE-STS-01',
                crane_equipment_id: crane1?.id,
                berth_id: 'BERTH-01',
                berth_equipment_id: berth1?.id,
                created_by_user_id: operatorUser?.id,
                priority: 2,
                status: 'Queued',
                waiting_time_ms: 850,
                turnaround_time_ms: 0,
                created_by: 'operator@portflow.com'
            },
            {
                process_id: 'OP-PROC-103',
                operation_type: 'Berthing Assist',
                ship_name: 'CMA CGM Jacques Saadé',
                crane_id: 'None',
                berth_id: 'BERTH-03',
                priority: 1,
                status: 'Completed',
                start_time: new Date(Date.now() - 7200000),
                end_time: new Date(Date.now() - 3600000),
                waiting_time_ms: 450,
                turnaround_time_ms: 3600000,
                created_by: 'system'
            }
        ];

        for (const op of operationsData) {
            await prisma.operation.upsert({
                where: { process_id: op.process_id },
                update: {},
                create: op
            }).catch(() => {});
        }

        const op1 = await prisma.operation.findFirst({ where: { process_id: 'OP-PROC-101' } });

        // 7. Trucks (Drayage fleet)
        const trucksData = [
            { license_plate: 'TRK-9821', driver_name: 'John Miller', driver_phone: '+1-555-0192', transport_company: 'Pacific Haulage Ltd', status: 'In Transit', max_payload_tons: 32.5, assigned_cargo_id: cargo1?.id },
            { license_plate: 'TRK-4412', driver_name: 'David Vance', driver_phone: '+1-555-0188', transport_company: 'Harbor Drayage Corp', status: 'Idle', max_payload_tons: 30.0, assigned_cargo_id: null },
            { license_plate: 'TRK-7734', driver_name: 'Carlos Ruiz', driver_phone: '+1-555-0144', transport_company: 'Maritime Express Freight', status: 'Loading', max_payload_tons: 35.0, assigned_cargo_id: cargo2?.id },
            { license_plate: 'TRK-5520', driver_name: 'Robert Hayes', driver_phone: '+1-555-0163', transport_company: 'Interstate Freightway', status: 'Checked In', max_payload_tons: 28.0, assigned_cargo_id: null }
        ];

        for (const t of trucksData) {
            await prisma.truck.upsert({
                where: { license_plate: t.license_plate },
                update: {},
                create: t
            }).catch(() => {});
        }

        const truck1 = await prisma.truck.findFirst({ where: { license_plate: 'TRK-9821' } });
        const truck3 = await prisma.truck.findFirst({ where: { license_plate: 'TRK-7734' } });

        // 8. Gate Passes
        if (truck1 && truck3) {
            const gatePassesData = [
                {
                    pass_number: 'GP-2026-0089',
                    truck_id: truck1.id,
                    cargo_id: cargo1?.id,
                    issued_by_id: operatorUser?.id,
                    gate_lane: 'Gate-In-Lane-1',
                    pass_type: 'Inbound_Delivery',
                    status: 'Checked_In',
                    check_in_time: new Date(Date.now() - 3600000)
                },
                {
                    pass_number: 'GP-2026-0090',
                    truck_id: truck3.id,
                    cargo_id: cargo2?.id,
                    issued_by_id: operatorUser?.id,
                    gate_lane: 'Gate-Out-Lane-2',
                    pass_type: 'Outbound_Dispatch',
                    status: 'Completed',
                    check_in_time: new Date(Date.now() - 7200000),
                    check_out_time: new Date(Date.now() - 1800000)
                }
            ];

            for (const gp of gatePassesData) {
                await prisma.gatePass.upsert({
                    where: { pass_number: gp.pass_number },
                    update: {},
                    create: gp
                }).catch(() => {});
            }
        }

        // 9. Customs Inspections
        if (cargo1 && cargo2) {
            const customsData = [
                {
                    inspection_number: 'CUST-INSP-4401',
                    cargo_id: cargo1.id,
                    inspector_id: customsUser?.id,
                    declaration_number: 'DEC-2026-991',
                    inspection_type: 'X-Ray_Scan',
                    status: 'Cleared',
                    duty_amount_cents: BigInt(450000),
                    findings: 'No anomalies detected. Seal verified intact.',
                    cleared_at: new Date(Date.now() - 5400000)
                },
                {
                    inspection_number: 'CUST-INSP-4402',
                    cargo_id: cargo2.id,
                    inspector_id: customsUser?.id,
                    declaration_number: 'DEC-2026-992',
                    inspection_type: 'Physical_Inspection',
                    status: 'Under_Review',
                    duty_amount_cents: BigInt(1200000),
                    findings: 'Physical cargo count verification in progress at CFS-01.',
                    inspected_at: new Date(Date.now() - 1800000)
                }
            ];

            for (const ci of customsData) {
                await prisma.customsInspection.upsert({
                    where: { inspection_number: ci.inspection_number },
                    update: {},
                    create: ci
                }).catch(() => {});
            }
        }

        // 10. Bills & Invoices
        const billsData = [
            {
                invoice_number: 'INV-2026-0012',
                ship_id: ship1?.id,
                cargo_id: cargo1?.id,
                operation_id: op1?.id,
                customer_name: 'Evergreen Marine Corp',
                docking_fee: 1450.0,
                crane_usage_fee: 800.0,
                storage_fee: 250.0,
                total_amount: 2500.0,
                currency: 'USD',
                payment_status: 'Paid',
                paid_at: new Date(Date.now() - 86400000)
            },
            {
                invoice_number: 'INV-2026-0013',
                ship_id: ship1?.id,
                cargo_id: cargo2?.id,
                operation_id: null,
                customer_name: 'Maersk Logistics Alliance',
                docking_fee: 2200.0,
                crane_usage_fee: 1200.0,
                storage_fee: 450.0,
                total_amount: 3850.0,
                currency: 'USD',
                payment_status: 'Pending',
                due_date: new Date(Date.now() + 86400000 * 7)
            }
        ];

        for (const b of billsData) {
            await prisma.bill.upsert({
                where: { invoice_number: b.invoice_number },
                update: {},
                create: b
            }).catch(() => {});
        }

        // 11. Issues (Incident tickets)
        const issuesData = [
            {
                ticket_number: 'TICK-801294',
                title: 'STS Crane 02 Hoist Sensor Calibration Warning',
                description: 'Encoder sensor jittering on load hoist 40ft spreader. Mechanical team dispatched.',
                severity: 'High',
                status: 'Open',
                reported_by_id: operatorUser?.id,
                equipment_id: crane1?.id
            },
            {
                ticket_number: 'TICK-801295',
                title: 'Berth 3 Mooring Bollard Maintenance Scheduled',
                description: 'Routine integrity check on marine bollard 3B completed.',
                severity: 'Low',
                status: 'Resolved',
                reported_by_id: adminUser?.id,
                equipment_id: berth1?.id,
                resolution_notes: 'Bolts tightened to 450Nm. Safe for vessel docking.',
                resolved_at: new Date(Date.now() - 43200000)
            }
        ];

        for (const iss of issuesData) {
            await prisma.issue.upsert({
                where: { ticket_number: iss.ticket_number },
                update: {},
                create: iss
            }).catch(() => {});
        }

        // 12. System Logs
        const logsData = [
            { level: 'INFO', source: 'Scheduler', message: 'CPU Scheduling Engine initialized with Non-Preemptive FCFS queue.', action: 'INIT_SCHEDULER', user_id: adminUser?.id },
            { level: 'INFO', source: 'DeadlockDetector', message: 'Cycle detection scan ran on Resource Allocation Graph: 0 cycles detected.', action: 'CYCLE_CHECK', user_id: null },
            { level: 'WARN', source: 'CraneLock', message: 'Resource contention: Crane STS-01 requested while held by OP-PROC-101. Process queued.', action: 'MUTEX_ACQUIRE', user_id: operatorUser?.id },
            { level: 'INFO', source: 'GateControl', message: 'Truck TRK-9821 successfully scanned at Gate-In Lane 1 (Pass GP-2026-0089).', action: 'GATE_CHECKIN', user_id: operatorUser?.id }
        ];

        for (const lg of logsData) {
            await prisma.systemLog.create({
                data: lg
            }).catch(() => {});
        }

        console.log('✓ PortFlow 12-Table Relational Schema successfully seeded!');
    } catch (err: any) {
        console.warn('[Seed] Warning during database seed:', err.message);
    }
}
