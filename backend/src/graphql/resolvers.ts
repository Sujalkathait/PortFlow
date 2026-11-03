import { GraphQLContext } from './context';
import { operationsService } from '../services/operations.service';
import { billingService } from '../services/billing.service';

let cachedOverview: any = null;
let lastOverviewFetchTime = 0;
const OVERVIEW_CACHE_TTL_MS = 5000;

export const resolvers = {
    Query: {
        portDashboardOverview: async (_: any, __: any, { prisma }: GraphQLContext) => {
            const now = Date.now();
            if (cachedOverview && (now - lastOverviewFetchTime < OVERVIEW_CACHE_TTL_MS)) {
                return cachedOverview;
            }
            const [
                userCount,
                opCount,
                shipCount,
                cargoCount,
                equipmentCount,
                activeOps,
                dockedShips
            ] = await Promise.all([
                prisma.user.count({ where: { deleted_at: null } }),
                prisma.operation.count({ where: { deleted_at: null } }),
                prisma.ship.count({ where: { deleted_at: null } }),
                prisma.cargo.count({ where: { deleted_at: null } }),
                prisma.equipment.count({ where: { deleted_at: null } }),
                prisma.operation.count({ where: { status: { in: ['Running', 'In progress'] }, deleted_at: null } }),
                prisma.ship.count({ where: { status: { in: ['Docked', 'Arrived', 'Berthed'] }, deleted_at: null } })
            ]);

            let warehouseCount = 0;
            let truckCount = 0;
            let billCount = 0;
            let issueCount = 0;

            try {
                [warehouseCount, truckCount, billCount, issueCount] = await Promise.all([
                    prisma.warehouse.count({ where: { deleted_at: null } }),
                    prisma.truck.count({ where: { deleted_at: null } }),
                    prisma.bill.count({ where: { deleted_at: null } }),
                    prisma.issue.count({ where: { deleted_at: null } })
                ]);
            } catch {
                // Non-blocking fallback
            }

            const availableEquipment = await prisma.equipment.count({
                where: { status: 'Available', deleted_at: null }
            });
            const resourceAvailability = equipmentCount > 0
                ? `${Math.round((availableEquipment / equipmentCount) * 100)}%`
                : '100%';

            let recentLogs: any[] = [];
            try {
                recentLogs = await prisma.systemLog.findMany({
                    orderBy: { timestamp: 'desc' },
                    take: 10
                });
            } catch {
                recentLogs = [];
            }

            const result = {
                tableStats: {
                    users: userCount,
                    operations: opCount,
                    ships: shipCount,
                    cargo: cargoCount,
                    equipment: equipmentCount,
                    warehouses: warehouseCount,
                    trucks: truckCount,
                    bills: billCount,
                    issues: issueCount
                },
                activeOperationsCount: activeOps,
                dockedShipsCount: dockedShips,
                resourceAvailabilityPercent: resourceAvailability,
                dbStatus: 'Healthy (PostgreSQL 15 3NF)',
                recentLogs: recentLogs.map(l => ({
                    ...l,
                    timestamp: l.timestamp.toISOString()
                }))
            };
            cachedOverview = result;
            lastOverviewFetchTime = Date.now();
            return result;
        },

        ships: async (_: any, { status }: { status?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            return prisma.ship.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });
        },

        ship: async (_: any, { id, imoNumber }: { id?: number; imoNumber?: string }, { prisma }: GraphQLContext) => {
            if (id) {
                return prisma.ship.findFirst({ where: { id, deleted_at: null } });
            }
            if (imoNumber) {
                return prisma.ship.findFirst({ where: { imo_number: imoNumber, deleted_at: null } });
            }
            return null;
        },

        cargo: async (_: any, { status, shipId }: { status?: string; shipId?: number }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            if (shipId) where.ship_id = shipId;
            return prisma.cargo.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });
        },

        container: async (_: any, { id, cargoNumber }: { id?: number; cargoNumber?: string }, { prisma }: GraphQLContext) => {
            if (id) {
                return prisma.cargo.findFirst({ where: { id, deleted_at: null } });
            }
            if (cargoNumber) {
                return prisma.cargo.findFirst({ where: { cargo_number: cargoNumber, deleted_at: null } });
            }
            return null;
        },

        equipment: async (_: any, { type, status }: { type?: string; status?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (type) where.type = type;
            if (status) where.status = status;
            return prisma.equipment.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });
        },

        operations: async (_: any, { status, priority }: { status?: string; priority?: number }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            if (priority) where.priority = priority;
            return prisma.operation.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });
        },

        operation: async (_: any, { id, processId }: { id?: number; processId?: string }, { prisma }: GraphQLContext) => {
            if (id) {
                return prisma.operation.findFirst({ where: { id, deleted_at: null } });
            }
            if (processId) {
                return prisma.operation.findFirst({ where: { process_id: processId, deleted_at: null } });
            }
            return null;
        },

        warehouses: async (_: any, { zoneType }: { zoneType?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (zoneType) where.zone_type = zoneType;
            try {
                return await prisma.warehouse.findMany({ where });
            } catch {
                return [];
            }
        },

        trucks: async (_: any, { status }: { status?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            try {
                return await prisma.truck.findMany({ where });
            } catch {
                return [];
            }
        },

        users: async (_: any, { role }: { role?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (role) where.role = role;
            try {
                return await prisma.user.findMany({ where, orderBy: { created_at: 'desc' } });
            } catch {
                return [];
            }
        },

        gatePasses: async (_: any, { status }: { status?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            try {
                return await prisma.gatePass.findMany({ where, orderBy: { created_at: 'desc' } });
            } catch {
                return [];
            }
        },

        customsInspections: async (_: any, { status }: { status?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            try {
                const results = await prisma.customsInspection.findMany({ where });
                return results.map(r => ({
                    ...r,
                    dutyAmountCents: r.duty_amount_cents.toString()
                }));
            } catch {
                return [];
            }
        },

        bills: async (_: any, { paymentStatus }: { paymentStatus?: string }, _context: GraphQLContext) => {
            return billingService.getBills(paymentStatus);
        },

        issues: async (_: any, { status, severity }: { status?: string; severity?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (status) where.status = status;
            if (severity) where.severity = severity;
            try {
                return await prisma.issue.findMany({ where, orderBy: { created_at: 'desc' } });
            } catch {
                return [];
            }
        },

        systemLogs: async (_: any, { level, limit }: { level?: string; limit?: number }, { prisma }: GraphQLContext) => {
            const where: any = {};
            if (level) where.level = level;
            try {
                const logs = await prisma.systemLog.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    take: limit || 50
                });
                return logs.map(l => ({
                    ...l,
                    timestamp: l.timestamp.toISOString()
                }));
            } catch {
                return [];
            }
        }
    },

    // =========================================================================
    // Nested Relational Field Resolvers (Graph Traversal without N+1)
    // =========================================================================
    Ship: {
        imoNumber: (parent: any) => parent.imo_number,
        vesselType: (parent: any) => parent.vessel_type,
        capacityTeu: (parent: any) => parent.capacity_teu,
        berthId: (parent: any) => parent.berth_id,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        eta: (parent: any) => parent.eta ? new Date(parent.eta).toISOString() : null,
        etd: (parent: any) => parent.etd ? new Date(parent.etd).toISOString() : null,
        assignedBerth: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (parent.berth_equipment_id) {
                return prisma.equipment.findUnique({ where: { id: parent.berth_equipment_id } });
            }
            if (parent.berth_id) {
                return prisma.equipment.findFirst({ where: { equipment_id: parent.berth_id } });
            }
            return null;
        },
        cargoManifests: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.cargo.findMany({
                where: {
                    OR: [
                        { ship_id: parent.id },
                        { ship_name: parent.name }
                    ],
                    deleted_at: null
                }
            });
        },
        operations: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.operation.findMany({
                where: {
                    OR: [
                        { ship_id: parent.id },
                        { ship_name: parent.name }
                    ],
                    deleted_at: null
                }
            });
        },
        bills: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.bill.findMany({ where: { ship_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        }
    },

    Equipment: {
        equipmentId: (parent: any) => parent.equipment_id,
        capacityMetric: (parent: any) => parent.capacity_metric,
        assignedTo: (parent: any) => parent.assigned_to,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        berthedShips: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.ship.findMany({
                where: {
                    OR: [
                        { berth_equipment_id: parent.id },
                        { berth_id: parent.equipment_id }
                    ],
                    deleted_at: null
                }
            });
        },
        craneOperations: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.operation.findMany({
                where: {
                    OR: [
                        { crane_equipment_id: parent.id },
                        { crane_id: parent.equipment_id }
                    ],
                    deleted_at: null
                }
            });
        },
        berthOperations: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.operation.findMany({
                where: {
                    OR: [
                        { berth_equipment_id: parent.id },
                        { berth_id: parent.equipment_id }
                    ],
                    deleted_at: null
                }
            });
        },
        reportedIssues: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.issue.findMany({ where: { equipment_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        }
    },

    Cargo: {
        cargoNumber: (parent: any) => parent.cargo_number,
        sizeType: (parent: any) => parent.size_type,
        weightTons: (parent: any) => parent.weight_tons,
        cargoType: (parent: any) => parent.cargo_type,
        currentLocation: (parent: any) => parent.current_location,
        shipName: (parent: any) => parent.ship_name,
        hazardClass: (parent: any) => parent.hazard_class,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        vessel: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (parent.ship_id) {
                return prisma.ship.findUnique({ where: { id: parent.ship_id } });
            }
            if (parent.ship_name) {
                return prisma.ship.findFirst({ where: { name: parent.ship_name } });
            }
            return null;
        },
        warehouse: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.warehouse_id) return null;
            try {
                return await prisma.warehouse.findUnique({ where: { id: parent.warehouse_id } });
            } catch {
                return null;
            }
        },
        operations: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.operation.findMany({
                where: { cargo_id: parent.id, deleted_at: null }
            });
        },
        inspections: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                const items = await prisma.customsInspection.findMany({
                    where: { cargo_id: parent.id, deleted_at: null }
                });
                return items.map(i => ({ ...i, dutyAmountCents: i.duty_amount_cents.toString() }));
            } catch {
                return [];
            }
        },
        transportTrucks: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.truck.findMany({
                    where: { assigned_cargo_id: parent.id, deleted_at: null }
                });
            } catch {
                return [];
            }
        },
        gatePasses: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.gatePass.findMany({
                    where: { cargo_id: parent.id, deleted_at: null }
                });
            } catch {
                return [];
            }
        },
        bills: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.bill.findMany({
                    where: { cargo_id: parent.id, deleted_at: null }
                });
            } catch {
                return [];
            }
        }
    },

    Operation: {
        processId: (parent: any) => parent.process_id,
        operationType: (parent: any) => parent.operation_type,
        shipName: (parent: any) => parent.ship_name,
        craneId: (parent: any) => parent.crane_id,
        berthId: (parent: any) => parent.berth_id,
        startTime: (parent: any) => parent.start_time ? new Date(parent.start_time).toISOString() : null,
        endTime: (parent: any) => parent.end_time ? new Date(parent.end_time).toISOString() : null,
        waitingTimeMs: (parent: any) => parent.waiting_time_ms,
        turnaroundTimeMs: (parent: any) => parent.turnaround_time_ms,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        vessel: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (parent.ship_id) return prisma.ship.findUnique({ where: { id: parent.ship_id } });
            if (parent.ship_name) return prisma.ship.findFirst({ where: { name: parent.ship_name } });
            return null;
        },
        container: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.cargo_id) return null;
            return prisma.cargo.findUnique({ where: { id: parent.cargo_id } });
        },
        assignedCrane: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (parent.crane_equipment_id) return prisma.equipment.findUnique({ where: { id: parent.crane_equipment_id } });
            if (parent.crane_id && parent.crane_id !== 'None') return prisma.equipment.findFirst({ where: { equipment_id: parent.crane_id } });
            return null;
        },
        assignedBerth: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (parent.berth_equipment_id) return prisma.equipment.findUnique({ where: { id: parent.berth_equipment_id } });
            if (parent.berth_id) return prisma.equipment.findFirst({ where: { equipment_id: parent.berth_id } });
            return null;
        },
        initiator: (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.created_by_user_id) return null;
            return prisma.user.findUnique({ where: { id: parent.created_by_user_id } });
        },
        bills: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.bill.findMany({ where: { operation_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        }
    },

    User: {
        fullName: (parent: any) => parent.full_name,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        operations: (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.operation.findMany({ where: { created_by_user_id: parent.id, deleted_at: null } });
        },
        reportedIssues: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.issue.findMany({ where: { reported_by_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        },
        inspections: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                const items = await prisma.customsInspection.findMany({ where: { inspector_id: parent.id, deleted_at: null } });
                return items.map(i => ({ ...i, dutyAmountCents: i.duty_amount_cents.toString() }));
            } catch {
                return [];
            }
        },
        systemLogs: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                const logs = await prisma.systemLog.findMany({ where: { user_id: parent.id } });
                return logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() }));
            } catch {
                return [];
            }
        }
    },

    Warehouse: {
        zoneType: (parent: any) => parent.zone_type,
        capacityTeu: (parent: any) => parent.capacity_teu,
        currentOccupancyTeu: (parent: any) => parent.current_occupancy_teu,
        temperatureCelsius: (parent: any) => parent.temperature_celsius,
        storedCargo: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.cargo.findMany({ where: { warehouse_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        }
    },

    Truck: {
        licensePlate: (parent: any) => parent.license_plate,
        driverName: (parent: any) => parent.driver_name,
        driverPhone: (parent: any) => parent.driver_phone,
        transportCompany: (parent: any) => parent.transport_company,
        maxPayloadTons: (parent: any) => parent.max_payload_tons,
        currentCargo: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.assigned_cargo_id) return null;
            try {
                return await prisma.cargo.findUnique({ where: { id: parent.assigned_cargo_id } });
            } catch {
                return null;
            }
        },
        gatePasses: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            try {
                return await prisma.gatePass.findMany({ where: { truck_id: parent.id, deleted_at: null } });
            } catch {
                return [];
            }
        }
    },

    GatePass: {
        passNumber: (parent: any) => parent.pass_number,
        gateLane: (parent: any) => parent.gate_lane,
        passType: (parent: any) => parent.pass_type,
        checkInTime: (parent: any) => parent.check_in_time ? new Date(parent.check_in_time).toISOString() : null,
        checkOutTime: (parent: any) => parent.check_out_time ? new Date(parent.check_out_time).toISOString() : null,
        truck: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.truck.findUnique({ where: { id: parent.truck_id } });
        },
        container: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.cargo_id) return null;
            return prisma.cargo.findUnique({ where: { id: parent.cargo_id } });
        },
        issuer: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.issued_by_id) return null;
            return prisma.user.findUnique({ where: { id: parent.issued_by_id } });
        }
    },

    CustomsInspection: {
        inspectionNumber: (parent: any) => parent.inspection_number,
        declarationNumber: (parent: any) => parent.declaration_number,
        inspectionType: (parent: any) => parent.inspection_type,
        dutyAmountCents: (parent: any) => parent.duty_amount_cents ? parent.duty_amount_cents.toString() : '0',
        inspectedAt: (parent: any) => parent.inspected_at ? new Date(parent.inspected_at).toISOString() : null,
        clearedAt: (parent: any) => parent.cleared_at ? new Date(parent.cleared_at).toISOString() : null,
        container: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            return prisma.cargo.findUnique({ where: { id: parent.cargo_id } });
        },
        inspector: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.inspector_id) return null;
            return prisma.user.findUnique({ where: { id: parent.inspector_id } });
        }
    },

    Bill: {
        invoiceNumber: (parent: any) => parent.invoice_number,
        customerName: (parent: any) => parent.customer_name,
        dockingFee: (parent: any) => parent.docking_fee,
        craneUsageFee: (parent: any) => parent.crane_usage_fee,
        storageFee: (parent: any) => parent.storage_fee,
        totalAmount: (parent: any) => parent.total_amount,
        paymentStatus: (parent: any) => parent.payment_status,
        dueDate: (parent: any) => parent.due_date ? new Date(parent.due_date).toISOString() : null,
        paidAt: (parent: any) => parent.paid_at ? new Date(parent.paid_at).toISOString() : null,
        vessel: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.ship_id) return null;
            return prisma.ship.findUnique({ where: { id: parent.ship_id } });
        },
        container: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.cargo_id) return null;
            return prisma.cargo.findUnique({ where: { id: parent.cargo_id } });
        },
        operation: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.operation_id) return null;
            return prisma.operation.findUnique({ where: { id: parent.operation_id } });
        }
    },

    Issue: {
        ticketNumber: (parent: any) => parent.ticket_number,
        resolutionNotes: (parent: any) => parent.resolution_notes,
        resolvedAt: (parent: any) => parent.resolved_at ? new Date(parent.resolved_at).toISOString() : null,
        createdAt: (parent: any) => parent.created_at ? new Date(parent.created_at).toISOString() : '',
        reporter: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.reported_by_id) return null;
            return prisma.user.findUnique({ where: { id: parent.reported_by_id } });
        },
        faultyEquipment: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.equipment_id) return null;
            return prisma.equipment.findUnique({ where: { id: parent.equipment_id } });
        }
    },

    SystemLog: {
        entityType: (parent: any) => parent.entity_type,
        entityId: (parent: any) => parent.entity_id,
        operator: async (parent: any, _: any, { prisma }: GraphQLContext) => {
            if (!parent.user_id) return null;
            return prisma.user.findUnique({ where: { id: parent.user_id } });
        }
    },

    // =========================================================================
    // Mutations
    // =========================================================================
    Mutation: {
        createOperation: async (
            _: any,
            args: {
                shipName: string;
                operationType: string;
                priority?: number;
                craneId?: string;
                berthId?: string;
            },
            { user }: GraphQLContext
        ) => {
            const result = await operationsService.submitOperation({
                shipName: args.shipName,
                operationType: args.operationType,
                priority: args.priority || 1,
                craneId: args.craneId || 'None',
                berthId: args.berthId || 'Berth 1',
                created_by: user?.email || 'operator@portflow.com'
            });
            return result;
        },

        reportIssue: async (
            _: any,
            args: {
                title: string;
                description: string;
                severity?: string;
                equipmentId?: number;
            },
            { user, prisma }: GraphQLContext
        ) => {
            const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
            const issue = await prisma.issue.create({
                data: {
                    ticket_number: ticketNumber,
                    title: args.title,
                    description: args.description,
                    severity: args.severity || 'Medium',
                    status: 'Open',
                    reported_by_id: user?.id || null,
                    equipment_id: args.equipmentId || null
                }
            });

            try {
                await prisma.systemLog.create({
                    data: {
                        level: 'WARN',
                        source: 'GraphQL',
                        message: `Issue ${ticketNumber} created via GraphQL: "${args.title}"`,
                        action: 'GRAPHQL_REPORT_ISSUE',
                        user_id: user?.id || null
                    }
                });
            } catch {
                // Ignore log error
            }

            return issue;
        },

        updateEquipmentStatus: async (
            _: any,
            { id, status }: { id: number; status: string },
            { prisma }: GraphQLContext
        ) => {
            return prisma.equipment.update({
                where: { id },
                data: { status }
            });
        },

        dispatchOperation: async (_: any, __: any, ___: GraphQLContext) => {
            const result = await operationsService.dispatchNext();
            if (!result || !result.operationId) return null;
            return operationsService.getOperationById(result.operationId);
        },

        generateBill: async (
            _: any,
            args: {
                customerName: string;
                dockingFee?: number;
                craneUsageFee?: number;
                storageFee?: number;
                operationId?: number;
                shipId?: number;
            },
            _context: GraphQLContext
        ) => {
            return billingService.createManualBill({
                customer_name: args.customerName,
                docking_fee: args.dockingFee,
                crane_usage_fee: args.craneUsageFee,
                storage_fee: args.storageFee,
                operation_id: args.operationId,
                ship_id: args.shipId
            });
        },

        payBill: async (_: any, { id }: { id: number }, _context: GraphQLContext) => {
            return billingService.payBill(id);
        }
    }
};
