import { prisma } from '../config/prisma';
export class CargoRepository {
    async findActive() { return prisma.cargo.findMany({ where: { deleted_at: null } }); }
    async create(data: any) { return prisma.cargo.create({ data }); }
    async update(id: number, data: any) { return prisma.cargo.update({ where: { id }, data }); }
    async softDelete(id: number, by: string) { return prisma.cargo.update({ where: { id }, data: { deleted_at: new Date(), deleted_by: by } }); }
    async restore(id: number) { return prisma.cargo.update({ where: { id }, data: { deleted_at: null, deleted_by: null } }); }
    async permanentDelete(id: number) { return prisma.cargo.delete({ where: { id } }); }
}
export const cargoRepository = new CargoRepository();


