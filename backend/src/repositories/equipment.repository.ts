import { prisma } from '../config/prisma';
export class EquipmentRepository {
    async findActive() { return prisma.equipment.findMany({ where: { deleted_at: null } }); }
    async create(data: any) { return prisma.equipment.create({ data }); }
    async update(id: number, data: any) { return prisma.equipment.update({ where: { id }, data }); }
    async softDelete(id: number, by: string) { return prisma.equipment.update({ where: { id }, data: { deleted_at: new Date(), deleted_by: by } }); }
    async restore(id: number) { return prisma.equipment.update({ where: { id }, data: { deleted_at: null, deleted_by: null } }); }
    async permanentDelete(id: number) { return prisma.equipment.delete({ where: { id } }); }
}
export const equipmentRepository = new EquipmentRepository();


