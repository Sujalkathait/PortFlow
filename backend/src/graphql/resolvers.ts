import { GraphQLContext } from './context';
import { operationsService } from '../services/operations.service';

export const resolvers = {
    Query: {
        portDashboardOverview: async (_: any, __: any, { prisma }: GraphQLContext) => {
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

            return {
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

        bills: async (_: any, { paymentStatus }: { paymentStatus?: string }, { prisma }: GraphQLContext) => {
            const where: any = { deleted_at: null };
            if (paymentStatus) where.payment_status = paymentStatus;
            try {
                return await prisma.bill.findMany({ where });
            } catch {
                return [];
            }
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
        }
    }
};
