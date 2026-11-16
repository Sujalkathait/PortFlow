import { prisma } from '../config/prisma';
import { ITrashRepository } from '../interfaces/repositories.interface';
import { TrashedRecord, TrashCollection } from '../models/trash.model';
import { operationsRepository } from './operations.repository';
import { shipsRepository } from './ships.repository';
import { cargoRepository } from './cargo.repository';
import { equipmentRepository } from './equipment.repository';

export { TrashedRecord };

export class TrashRepository implements ITrashRepository {
    async getTrash(): Promise<TrashedRecord[]> {
        try {
            // Optimized: Selective field projection + B-Tree index scan across all 10 soft-deletable tables
            const [ops, ships, Cargos, Equipments, warehouses, trucks, gatePasses, customs, bills, issues] = await Promise.all([
                prisma.operation.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, operation_type: true, ship_name: true, status: true, created_by: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.ship.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, name: true, imo_number: true, status: true, created_by: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.cargo.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, cargo_number: true, ship_name: true, status: true, created_by: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.equipment.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, name: true, type: true, status: true, created_by: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.warehouse.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, code: true, name: true, zone_type: true, status: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.truck.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, license_plate: true, driver_name: true, transport_company: true, status: true, created_at: true, deleted_at: true, deleted_by: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.gatePass.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, pass_number: true, gate_lane: true, pass_type: true, status: true, created_at: true, deleted_at: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.customsInspection.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, inspection_number: true, declaration_number: true, inspection_type: true, status: true, created_at: true, deleted_at: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.bill.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, invoice_number: true, customer_name: true, total_amount: true, currency: true, payment_status: true, created_at: true, deleted_at: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => []),
                prisma.issue.findMany({
                    where: { deleted_at: { not: null } },
                    select: { id: true, ticket_number: true, title: true, severity: true, status: true, created_at: true, deleted_at: true },
                    orderBy: { deleted_at: 'desc' },
                    take: 100
                }).catch(() => [])
            ]);

            const all: TrashedRecord[] = [
                ...ops.map(o => ({
                    id: o.id,
                    _collection: 'operations' as const,
                    label: o.operation_type,
                    ship_name: o.ship_name,
                    status: o.status,
                    created_by: o.created_by,
                    created_at: o.created_at.toISOString(),
                    deleted_at: o.deleted_at!.toISOString(),
                    deleted_by: o.deleted_by || undefined
                })),
                ...ships.map(s => ({
                    id: s.id,
                    _collection: 'ships' as const,
                    label: s.name,
                    ship_name: s.imo_number,
                    status: s.status,
                    created_by: s.created_by,
                    created_at: s.created_at.toISOString(),
                    deleted_at: s.deleted_at!.toISOString(),
                    deleted_by: s.deleted_by || undefined
                })),
                ...Cargos.map(c => ({
                    id: c.id,
                    _collection: 'Cargos' as const,
                    label: c.cargo_number,
                    ship_name: c.ship_name,
                    status: c.status,
                    created_by: c.created_by,
                    created_at: c.created_at.toISOString(),
                    deleted_at: c.deleted_at!.toISOString(),
                    deleted_by: c.deleted_by || undefined
                })),
                ...Equipments.map(r => ({
                    id: r.id,
                    _collection: 'Equipments' as const,
                    label: r.name,
                    ship_name: r.type,
                    status: r.status,
                    created_by: r.created_by,
                    created_at: r.created_at.toISOString(),
                    deleted_at: r.deleted_at!.toISOString(),
                    deleted_by: r.deleted_by || undefined
                })),
                ...warehouses.map(w => ({
                    id: w.id,
                    _collection: 'warehouses' as const,
                    label: `${w.code} — ${w.name}`,
                    ship_name: w.zone_type,
                    status: w.status,
                    created_by: 'system',
                    created_at: w.created_at.toISOString(),
                    deleted_at: w.deleted_at!.toISOString(),
                    deleted_by: w.deleted_by || undefined
                })),
                ...trucks.map(t => ({
                    id: t.id,
                    _collection: 'trucks' as const,
                    label: `${t.license_plate} (${t.driver_name})`,
                    ship_name: t.transport_company,
                    status: t.status,
                    created_by: 'system',
                    created_at: t.created_at.toISOString(),
                    deleted_at: t.deleted_at!.toISOString(),
                    deleted_by: t.deleted_by || undefined
                })),
                ...gatePasses.map(gp => ({
                    id: gp.id,
                    _collection: 'gate_passes' as const,
                    label: gp.pass_number,
                    ship_name: `${gp.gate_lane} (${gp.pass_type})`,
                    status: gp.status,
                    created_by: 'security',
                    created_at: gp.created_at.toISOString(),
                    deleted_at: gp.deleted_at!.toISOString(),
                    deleted_by: undefined
                })),
                ...customs.map(ci => ({
                    id: ci.id,
                    _collection: 'customs_inspections' as const,
                    label: ci.inspection_number,
                    ship_name: `${ci.declaration_number} — ${ci.inspection_type}`,
                    status: ci.status,
                    created_by: 'customs',
                    created_at: ci.created_at.toISOString(),
                    deleted_at: ci.deleted_at!.toISOString(),
                    deleted_by: undefined
                })),
                ...bills.map(b => ({
                    id: b.id,
                    _collection: 'bills' as const,
                    label: `${b.invoice_number} ($${b.total_amount.toFixed(2)} ${b.currency})`,
                    ship_name: b.customer_name,
                    status: b.payment_status,
                    created_by: 'billing',
                    created_at: b.created_at.toISOString(),
                    deleted_at: b.deleted_at!.toISOString(),
                    deleted_by: undefined
                })),
                ...issues.map(iss => ({
                    id: iss.id,
                    _collection: 'issues' as const,
                    label: iss.ticket_number,
                    ship_name: iss.title,
                    status: `${iss.severity} / ${iss.status}`,
                    created_by: 'operations',
                    created_at: iss.created_at.toISOString(),
                    deleted_at: iss.deleted_at!.toISOString(),
                    deleted_by: undefined
                }))
            ];

            return all.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
        } catch (err: any) {
            console.error('[TrashRepository] DB getTrash error:', err.message);
            throw err;
        }
    }

    async restore(collection: TrashCollection | string, id: number): Promise<any | null> {
        try {
            switch (collection) {
                case 'operations': return !!(await operationsRepository.restore(id));
                case 'ships': return !!(await shipsRepository.restore(id));
                case 'Cargos': return !!(await cargoRepository.restore(id));
                case 'Equipments': return !!(await equipmentRepository.restore(id));
                case 'warehouses': {
                    const res = await prisma.warehouse.update({ where: { id }, data: { deleted_at: null, deleted_by: null } }).catch(() => null);
                    return !!res;
                }
                case 'trucks': {
                    const res = await prisma.truck.update({ where: { id }, data: { deleted_at: null, deleted_by: null } }).catch(() => null);
                    return !!res;
                }
                case 'gate_passes': {
                    const res = await prisma.gatePass.update({ where: { id }, data: { deleted_at: null } }).catch(() => null);
                    return !!res;
                }
                case 'customs_inspections': {
                    const res = await prisma.customsInspection.update({ where: { id }, data: { deleted_at: null } }).catch(() => null);
                    return !!res;
                }
                case 'bills': {
                    const res = await prisma.bill.update({ where: { id }, data: { deleted_at: null } }).catch(() => null);
                    return !!res;
                }
                case 'issues': {
                    const res = await prisma.issue.update({ where: { id }, data: { deleted_at: null } }).catch(() => null);
                    return !!res;
                }
                default: return null;
            }
        } catch {
            return false;
        }
    }

    async permanentDelete(collection: TrashCollection | string, id: number): Promise<boolean> {
        try {
            switch (collection) {
                case 'operations': return !!(await operationsRepository.permanentDelete(id));
                case 'ships': return !!(await shipsRepository.permanentDelete(id));
                case 'Cargos': return !!(await cargoRepository.permanentDelete(id));
                case 'Equipments': return !!(await equipmentRepository.permanentDelete(id));
                case 'warehouses': {
                    await prisma.warehouse.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                case 'trucks': {
                    await prisma.truck.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                case 'gate_passes': {
                    await prisma.gatePass.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                case 'customs_inspections': {
                    await prisma.customsInspection.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                case 'bills': {
                    await prisma.bill.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                case 'issues': {
                    await prisma.issue.delete({ where: { id } }).catch(() => null);
                    return true;
                }
                default: return false;
            }
        } catch {
            return false;
        }
    }

    async emptyTrash(): Promise<{ count: number; total: number; details: Record<string, number> }> {
        try {
            const [ops, ships, Cargos, Equipments, warehouses, trucks, gatePasses, customs, bills, issues] = await Promise.all([
                prisma.operation.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.ship.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.cargo.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.equipment.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.warehouse.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.truck.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.gatePass.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.customsInspection.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.bill.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
                prisma.issue.deleteMany({ where: { deleted_at: { not: null } } }).catch(() => ({ count: 0 })),
            ]);

            const total = ops.count + ships.count + Cargos.count + Equipments.count +
                warehouses.count + trucks.count + gatePasses.count + customs.count + bills.count + issues.count;

            return {
                count: total,
                total,
                details: {
                    operations: ops.count,
                    ships: ships.count,
                    Cargos: Cargos.count,
                    Equipments: Equipments.count,
                    warehouses: warehouses.count,
                    trucks: trucks.count,
                    gate_passes: gatePasses.count,
                    customs_inspections: customs.count,
                    bills: bills.count,
                    issues: issues.count,
                }
            };
        } catch (err: any) {
            console.error('[TrashRepository] DB emptyTrash error:', err.message);
            throw err;
        }
    }
}

export const trashRepository = new TrashRepository();
