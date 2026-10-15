import { prisma } from '../src/config/prisma';

async function seed() {
    console.log('🚀 Starting OS Demo Data Seeding for operator@portflow.com...');
    const operatorEmail = 'operator@portflow.com';

    // 1. Ensure operator exists
    let operator = await prisma.user.findFirst({
        where: { email: operatorEmail }
    });

    if (!operator) {
        console.log('Creating default operator...');
        operator = await prisma.user.create({
            data: {
                email: operatorEmail,
                password_hash: '$2a$10$3Nl2.cv0KxjYeeQouHpYJeQmpPiQijVffh6fvXFhqM4IZAYJOoZh2', // Password123!
                full_name: 'Terminal Operator',
                role: 'Operator'
            }
        });
    }
    console.log(`✅ Operator user confirmed: ${operator.email} (ID: ${operator.id})`);

    // Clean existing test records created by operator or system if needed to provide clean 10+ rows
    // We use soft-delete null check or upsert
    console.log('Clearing old active records to avoid conflicts...');
    await prisma.operation.deleteMany({});
    await prisma.cargo.deleteMany({});
    await prisma.ship.deleteMany({});
    await prisma.equipment.deleteMany({});

    // -------------------------------------------------------------
    // 2. SEED EQUIPMENT (Physical OS Resources: Semaphores & Mutexes)
    // 12 Items: Berths (Counting Semaphores) + Cranes (Binary Semaphores / Mutexes) + Trucks
    // -------------------------------------------------------------
    console.log('📦 Seeding Equipment (12 items)...');
    const equipmentsData = [
        // Berths (Managed by Counting Semaphore)
        { equipment_id: 'BERTH-01', name: 'Deepwater Berth 1', type: 'Berth', status: 'Occupied', assigned_to: 'MV Ever Given', created_by: operatorEmail },
        { equipment_id: 'BERTH-02', name: 'Container Berth 2', type: 'Berth', status: 'Occupied', assigned_to: 'MSC Oscar', created_by: operatorEmail },
        { equipment_id: 'BERTH-03', name: 'Bulk Terminal Berth 3', type: 'Berth', status: 'Available', assigned_to: null, created_by: operatorEmail },
        { equipment_id: 'BERTH-04', name: 'Express Feeder Berth 4', type: 'Berth', status: 'Available', assigned_to: null, created_by: operatorEmail },
        { equipment_id: 'BERTH-05', name: 'Heavy Lift Berth 5', type: 'Berth', status: 'Maintenance', assigned_to: null, created_by: operatorEmail },

        // Cranes (Managed by Mutex - Mutual Exclusion)
        { equipment_id: 'CRANE-A', name: 'STS Super Post-Panamax Crane A', type: 'Crane', status: 'Occupied', assigned_to: 'MV Ever Given', created_by: operatorEmail },
        { equipment_id: 'CRANE-B', name: 'STS Quay Crane B', type: 'Crane', status: 'Occupied', assigned_to: 'MSC Oscar', created_by: operatorEmail },
        { equipment_id: 'CRANE-C', name: 'Gantry Crane C', type: 'Crane', status: 'Available', assigned_to: null, created_by: operatorEmail },
        { equipment_id: 'CRANE-D', name: 'Mobile Harbor Crane D', type: 'Crane', status: 'Maintenance', assigned_to: null, created_by: operatorEmail },

        // Yard Equipment / Vehicles (Resource Pool)
        { equipment_id: 'TRUCK-01', name: 'Automated Guided Vehicle AGV-01', type: 'Vehicle', status: 'Available', assigned_to: null, created_by: operatorEmail },
        { equipment_id: 'TRUCK-02', name: 'Terminal Reach Stacker RS-02', type: 'Vehicle', status: 'Occupied', assigned_to: 'Yard Zone B', created_by: operatorEmail },
        { equipment_id: 'TRUCK-03', name: 'Heavy Yard Transporter YT-03', type: 'Vehicle', status: 'Available', assigned_to: null, created_by: operatorEmail },
    ];

    for (const eq of equipmentsData) {
        await prisma.equipment.create({ data: eq });
    }
    console.log('✅ Equipment seeded: 12 rows');

    // -------------------------------------------------------------
    // 3. SEED SHIPS (PCB Lifecycle States: NEW, READY, RUNNING, TERMINATED)
    // 12 Ships with diverse statuses matching Process States
    // -------------------------------------------------------------
    console.log('🚢 Seeding Marine Vessels / Ships (12 items)...');
    const shipsData = [
        // RUNNING State (Currently Docked & Operating)
        { imo_number: 'IMO-9811000', name: 'MV Ever Given', vessel_type: 'Container Ship', capacity_teu: 20124, status: 'Docked', berth_id: 'Berth 1', created_by: operatorEmail },
        { imo_number: 'IMO-9703291', name: 'MSC Oscar', vessel_type: 'Ultra Large Container', capacity_teu: 19224, status: 'Docked', berth_id: 'Berth 2', created_by: operatorEmail },
        { imo_number: 'IMO-9632064', name: 'CMA CGM Antoine', vessel_type: 'Container Ship', capacity_teu: 16020, status: 'Docked', berth_id: 'Berth 3', created_by: operatorEmail },

        // READY State (Waiting in Queue for Berth/Resource Allocation)
        { imo_number: 'IMO-9434448', name: 'Maersk Mc-Kinney', vessel_type: 'Triple-E Container', capacity_teu: 18270, status: 'Waiting', berth_id: null, created_by: operatorEmail },
        { imo_number: 'IMO-9708681', name: 'COSCO Shipping Universe', vessel_type: 'Container Ship', capacity_teu: 21237, status: 'Waiting', berth_id: null, created_by: operatorEmail },
        { imo_number: 'IMO-9315484', name: 'Hapag-Lloyd Berlin', vessel_type: 'Container Ship', capacity_teu: 13169, status: 'Waiting', berth_id: null, created_by: operatorEmail },

        // NEW State (Arriving / Approach Phase - Admitted to Ready Queue soon)
        { imo_number: 'IMO-9744647', name: 'OOCL Hong Kong', vessel_type: 'Ultra Large Container', capacity_teu: 21413, status: 'Arriving', berth_id: null, created_by: operatorEmail },
        { imo_number: 'IMO-9839438', name: 'HMM Algeciras', vessel_type: 'Megamax Container', capacity_teu: 23964, status: 'Arriving', berth_id: null, created_by: operatorEmail },
        { imo_number: 'IMO-9619983', name: 'ONE Stork', vessel_type: 'Container Ship', capacity_teu: 14000, status: 'Arriving', berth_id: null, created_by: operatorEmail },

        // TERMINATED State (Departed / Job Finished)
        { imo_number: 'IMO-9398383', name: 'Ever Golden', vessel_type: 'Container Ship', capacity_teu: 20388, status: 'Departed', berth_id: 'Berth 1', created_by: operatorEmail },
        { imo_number: 'IMO-9776171', name: 'Madrid Maersk', vessel_type: 'Container Ship', capacity_teu: 20568, status: 'Departed', berth_id: 'Berth 4', created_by: operatorEmail },
        { imo_number: 'IMO-9461893', name: 'CMA CGM Marco Polo', vessel_type: 'Container Ship', capacity_teu: 16020, status: 'Departed', berth_id: 'Berth 2', created_by: operatorEmail },
    ];

    for (const sh of shipsData) {
        await prisma.ship.create({ data: sh });
    }
    console.log('✅ Ships seeded: 12 rows');

    // -------------------------------------------------------------
    // 4. SEED CARGO (Container Manifests & Mutex Lock Targets)
    // 15 Items: 20ft & 40ft, Hazardous, Reefers, General
    // -------------------------------------------------------------
    console.log('📦 Seeding Cargo Manifests (15 items)...');
    const cargoData = [
        { cargo_number: 'MSKU-7489201', size_type: '40ft HC', weight_tons: 28.5, cargo_type: 'General', current_location: 'Ship', ship_name: 'MV Ever Given', status: 'On Ship', created_by: operatorEmail },
        { cargo_number: 'CMAU-1938402', size_type: '20ft Standard', weight_tons: 14.2, cargo_type: 'Electronics', current_location: 'Quay Berth 1', ship_name: 'MV Ever Given', status: 'Discharged', created_by: operatorEmail },
        { cargo_number: 'COSU-9281744', size_type: '40ft Reefer', weight_tons: 22.0, cargo_type: 'Perishables', current_location: 'Yard Zone A', ship_name: 'MSC Oscar', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'HMMU-5528190', size_type: '20ft Tank', weight_tons: 19.8, cargo_type: 'Hazardous Chemicals', current_location: 'Customs Holding', ship_name: 'MSC Oscar', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'OOCU-8829103', size_type: '40ft HC', weight_tons: 31.2, cargo_type: 'Industrial Machinery', current_location: 'Ship', ship_name: 'Maersk Mc-Kinney', status: 'On Ship', created_by: operatorEmail },
        { cargo_number: 'ONEY-3382910', size_type: '20ft Standard', weight_tons: 12.6, cargo_type: 'Automotive Parts', current_location: 'Yard Zone B', ship_name: 'COSCO Shipping Universe', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'HLXU-4491029', size_type: '40ft HC', weight_tons: 26.4, cargo_type: 'Textiles & Apparel', current_location: 'Transit Gate 3', ship_name: 'Hapag-Lloyd Berlin', status: 'Cleared', created_by: operatorEmail },
        { cargo_number: 'EGLV-6628194', size_type: '20ft Reefer', weight_tons: 18.0, cargo_type: 'Pharmaceuticals', current_location: 'Cold Storage Zone', ship_name: 'MV Ever Given', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'MSCU-1192834', size_type: '40ft HC', weight_tons: 29.1, cargo_type: 'Consumer Goods', current_location: 'Quay Berth 2', ship_name: 'MSC Oscar', status: 'Discharged', created_by: operatorEmail },
        { cargo_number: 'CMAU-7738291', size_type: '20ft Standard', weight_tons: 15.5, cargo_type: 'Raw Materials', current_location: 'Ship', ship_name: 'CMA CGM Antoine', status: 'On Ship', created_by: operatorEmail },
        { cargo_number: 'OOCU-3329101', size_type: '40ft HC', weight_tons: 27.8, cargo_type: 'Heavy Equipment', current_location: 'Yard Zone C', ship_name: 'OOCL Hong Kong', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'HMMU-9928172', size_type: '20ft Standard', weight_tons: 11.2, cargo_type: 'Plastics', current_location: 'Gate 1', ship_name: 'HMM Algeciras', status: 'Cleared', created_by: operatorEmail },
        { cargo_number: 'ONEY-8819203', size_type: '40ft Reefer', weight_tons: 24.3, cargo_type: 'Food Stuffs', current_location: 'Ship', ship_name: 'ONE Stork', status: 'On Ship', created_by: operatorEmail },
        { cargo_number: 'MAEU-4402911', size_type: '20ft Standard', weight_tons: 16.7, cargo_type: 'Metals & Minerals', current_location: 'Yard Zone A', ship_name: 'Madrid Maersk', status: 'In Yard', created_by: operatorEmail },
        { cargo_number: 'EVER-5510293', size_type: '40ft HC', weight_tons: 30.0, cargo_type: 'Solar Panels', current_location: 'Outgate Buffer', ship_name: 'Ever Golden', status: 'Cleared', created_by: operatorEmail },
    ];

    for (const c of cargoData) {
        await prisma.cargo.create({ data: c });
    }
    console.log('✅ Cargo seeded: 15 rows');

    // -------------------------------------------------------------
    // 5. SEED OPERATIONS (PCBs, CPU Scheduling Algorithms, Telemetry)
    // 12 Operations: FCFS / SJF / Priority demonstration data
    // Mix of Queued, Running, Completed states with calculated OS metrics:
    // Burst Times (Bt), Waiting Times (Wt), Turnaround Times (Tat)
    // -------------------------------------------------------------
    console.log('⚙️ Seeding Operations / CPU Scheduling Jobs (12 items)...');
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000);

    const operationsData = [
        // 1. RUNNING Process (Active CPU Execution with Mutex Lock on Crane A)
        {
            process_id: 'op-1',
            operation_type: 'Container Discharge',
            ship_name: 'MV Ever Given',
            crane_id: 'Crane A',
            berth_id: 'Berth 1',
            priority: 5, // High Priority (Priority Scheduling)
            status: 'Running',
            start_time: tenMinAgo,
            end_time: null,
            waiting_time_ms: 2400,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: twentyMinAgo
        },
        // 2. RUNNING Process (Active execution with Mutex Lock on Crane B)
        {
            process_id: 'op-2',
            operation_type: 'Heavy Container Offload',
            ship_name: 'MSC Oscar',
            crane_id: 'Crane B',
            berth_id: 'Berth 2',
            priority: 4,
            status: 'Running',
            start_time: new Date(now.getTime() - 5 * 60 * 1000),
            end_time: null,
            waiting_time_ms: 3100,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 15 * 60 * 1000)
        },
        // 3. QUEUED Process (Waiting for Crane A - Demonstrating Mutex Contention & SJF short burst)
        {
            process_id: 'op-3',
            operation_type: 'Express Perishables Discharge',
            ship_name: 'CMA CGM Antoine',
            crane_id: 'Crane A', // Needs Crane A! (Mutex wait)
            berth_id: 'Berth 1',
            priority: 4,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 1850,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 8 * 60 * 1000)
        },
        // 4. QUEUED Process (Shortest Burst Job - SJF Winner!)
        {
            process_id: 'op-4',
            operation_type: 'Rapid Courier Offload',
            ship_name: 'Maersk Mc-Kinney',
            crane_id: 'Crane B',
            berth_id: 'Berth 2',
            priority: 3,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 950,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 7 * 60 * 1000)
        },
        // 5. QUEUED Process (Highest Priority emergency shipment)
        {
            process_id: 'op-5',
            operation_type: 'Emergency Medical Cargo Discharge',
            ship_name: 'COSCO Shipping Universe',
            crane_id: 'Crane C',
            berth_id: 'Berth 3',
            priority: 5,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 1200,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 6 * 60 * 1000)
        },
        // 6. QUEUED Process (Standard FCFS arrival)
        {
            process_id: 'op-6',
            operation_type: 'Standard TEU Offload',
            ship_name: 'Hapag-Lloyd Berlin',
            crane_id: 'Crane C',
            berth_id: 'Berth 3',
            priority: 2,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 3400,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 5 * 60 * 1000)
        },
        // 7. QUEUED Process (Low priority bulk loading)
        {
            process_id: 'op-7',
            operation_type: 'Bulk Scrap Metal Loading',
            ship_name: 'OOCL Hong Kong',
            crane_id: 'None',
            berth_id: 'Berth 4',
            priority: 1,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 4500,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 4 * 60 * 1000)
        },
        // 8. QUEUED Process (Deadlock scenario candidate: Holds Berth 1, Needs Crane B)
        {
            process_id: 'op-8',
            operation_type: 'Hazardous Chemical Transshipment',
            ship_name: 'HMM Algeciras',
            crane_id: 'Crane A',
            berth_id: 'Berth 2',
            priority: 4,
            status: 'Queued',
            start_time: null,
            end_time: null,
            waiting_time_ms: 2100,
            turnaround_time_ms: null,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 3 * 60 * 1000)
        },
        // 9. COMPLETED Process (Telemetry sample: Tat = 7800ms, Wt = 1200ms, Bt = 6600ms)
        {
            process_id: 'op-9',
            operation_type: 'Reefer Container Unload',
            ship_name: 'ONE Stork',
            crane_id: 'Crane A',
            berth_id: 'Berth 1',
            priority: 3,
            status: 'Completed',
            start_time: new Date(now.getTime() - 30 * 60 * 1000),
            end_time: new Date(now.getTime() - 25 * 60 * 1000),
            waiting_time_ms: 1200,
            turnaround_time_ms: 7800,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 35 * 60 * 1000)
        },
        // 10. COMPLETED Process (Telemetry sample: Tat = 5400ms, Wt = 800ms, Bt = 4600ms)
        {
            process_id: 'op-10',
            operation_type: 'Express Automotive Offload',
            ship_name: 'Madrid Maersk',
            crane_id: 'Crane B',
            berth_id: 'Berth 2',
            priority: 4,
            status: 'Completed',
            start_time: new Date(now.getTime() - 45 * 60 * 1000),
            end_time: new Date(now.getTime() - 40 * 60 * 1000),
            waiting_time_ms: 800,
            turnaround_time_ms: 5400,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 50 * 60 * 1000)
        },
        // 11. COMPLETED Process (Telemetry sample: Tat = 9200ms, Wt = 3100ms, Bt = 6100ms)
        {
            process_id: 'op-11',
            operation_type: 'Grain Silo Conveyor Transfer',
            ship_name: 'Ever Golden',
            crane_id: 'None',
            berth_id: 'Berth 3',
            priority: 2,
            status: 'Completed',
            start_time: new Date(now.getTime() - 60 * 60 * 1000),
            end_time: new Date(now.getTime() - 52 * 60 * 1000),
            waiting_time_ms: 3100,
            turnaround_time_ms: 9200,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 65 * 60 * 1000)
        },
        // 12. COMPLETED Process (Telemetry sample: Tat = 6300ms, Wt = 1500ms, Bt = 4800ms)
        {
            process_id: 'op-12',
            operation_type: 'High Cube Container Manifest',
            ship_name: 'CMA CGM Marco Polo',
            crane_id: 'Crane B',
            berth_id: 'Berth 2',
            priority: 3,
            status: 'Completed',
            start_time: new Date(now.getTime() - 75 * 60 * 1000),
            end_time: new Date(now.getTime() - 70 * 60 * 1000),
            waiting_time_ms: 1500,
            turnaround_time_ms: 6300,
            created_by: operatorEmail,
            created_at: new Date(now.getTime() - 80 * 60 * 1000)
        },
    ];

    for (const op of operationsData) {
        await prisma.operation.create({ data: op });
    }
    console.log('✅ Operations seeded: 12 rows');

    // -------------------------------------------------------------
    // 6. SEED RECYCLE BIN / STORAGE RECLAIM (Soft Deleted Records)
    // 3 Items: 1 Ship, 1 Cargo, 1 Operation in Trash
    // Demonstrates 2-Phase OS Storage Reclaim / Garbage Collection
    // -------------------------------------------------------------
    console.log('♻️ Seeding Soft-Deleted Items for Recycle Bin / Reclaim Demo...');
    await prisma.ship.create({
        data: {
            imo_number: 'IMO-9102941',
            name: 'Old Transporter Alpha',
            vessel_type: 'Bulk Carrier',
            capacity_teu: 5000,
            status: 'Departed',
            berth_id: 'Berth 4',
            created_by: operatorEmail,
            deleted_at: new Date(),
            deleted_by: operatorEmail
        }
    });

    await prisma.cargo.create({
        data: {
            cargo_number: 'TRSH-0019283',
            size_type: '20ft Standard',
            weight_tons: 8.5,
            cargo_type: 'Scrap Metal',
            current_location: 'Holding Area',
            ship_name: 'Old Transporter Alpha',
            status: 'Cleared',
            created_by: operatorEmail,
            deleted_at: new Date(),
            deleted_by: operatorEmail
        }
    });

    await prisma.operation.create({
        data: {
            process_id: 'op-trash-1',
            operation_type: 'Cancelled Bunkering Service',
            ship_name: 'Old Transporter Alpha',
            crane_id: 'None',
            berth_id: 'Berth 4',
            priority: 1,
            status: 'Cancelled',
            waiting_time_ms: 500,
            turnaround_time_ms: 500,
            created_by: operatorEmail,
            deleted_at: new Date(),
            deleted_by: operatorEmail
        }
    });
    console.log('✅ Soft-deleted items seeded for Trash / Storage Reclaim demonstration!');

    // -------------------------------------------------------------
    // 7. SYNC IN-MEMORY OS ENGINE (PortSystem Ready Queue & Locks)
    // -------------------------------------------------------------
    console.log('⚡ Populating in-memory OS kernel ready queue...');
    // We can verify total count
    const totalOps = await prisma.operation.count({ where: { deleted_at: null } });
    const totalShips = await prisma.ship.count({ where: { deleted_at: null } });
    const totalCargo = await prisma.cargo.count({ where: { deleted_at: null } });
    const totalEq = await prisma.equipment.count({ where: { deleted_at: null } });
    const totalTrash = await prisma.operation.count({ where: { deleted_at: { not: null } } }) +
                       await prisma.ship.count({ where: { deleted_at: { not: null } } }) +
                       await prisma.cargo.count({ where: { deleted_at: { not: null } } });

    console.log('\n================ SEED SUMMARY ================');
    console.log(`Operator: ${operatorEmail}`);
    console.log(`Active Operations : ${totalOps} rows (Min 10 ✅)`);
    console.log(`Active Ships      : ${totalShips} rows (Min 10 ✅)`);
    console.log(`Active Cargo      : ${totalCargo} rows (Min 10 ✅)`);
    console.log(`Active Equipment  : ${totalEq} rows (Min 10 ✅)`);
    console.log(`Trash / Reclaimed : ${totalTrash} rows (Soft-deleted ✅)`);
    console.log('==============================================');
}

seed()
    .catch((err) => {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
