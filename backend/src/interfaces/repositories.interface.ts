import {
    OperationRecord,
    ShipRecord,
    CargoRecord,
    EquipmentRecord,
    TrashedRecord,
    TrashCollection,
    UserRecord,
    CreateOperationDTO,
    UpdateOperationDTO,
    CreateShipDTO,
    UpdateShipDTO,
    CreateCargoDTO,
    UpdateCargoDTO,
    CreateEquipmentDTO,
    UpdateEquipmentDTO
} from '../models';

export interface IOperationsRepository {
    findActive(): Promise<OperationRecord[]>;
    findById(id: number): Promise<OperationRecord | null>;
    findByProcessId(processId: string): Promise<OperationRecord | null>;
    create(data: CreateOperationDTO): Promise<OperationRecord>;
    update(id: number, data: UpdateOperationDTO): Promise<OperationRecord | null>;
    softDelete(id: number, deletedBy: string): Promise<OperationRecord | null>;
    restore(id: number): Promise<OperationRecord | null>;
    permanentDelete(id: number): Promise<boolean>;
}

export interface IShipsRepository {
    findActive(): Promise<ShipRecord[]>;
    findById(id: number): Promise<ShipRecord | null>;
    findByImo(imo: string): Promise<ShipRecord | null>;
    create(data: CreateShipDTO): Promise<ShipRecord>;
    update(id: number, data: UpdateShipDTO): Promise<ShipRecord | null>;
    softDelete(id: number, deletedBy: string): Promise<ShipRecord | null>;
    restore(id: number): Promise<ShipRecord | null>;
    permanentDelete(id: number): Promise<boolean>;
}

export interface ICargoRepository {
    findActive(): Promise<CargoRecord[]>;
    findById(id: number): Promise<CargoRecord | null>;
    findByCargoNumber(cargoNumber: string): Promise<CargoRecord | null>;
    create(data: CreateCargoDTO): Promise<CargoRecord>;
    update(id: number, data: UpdateCargoDTO): Promise<CargoRecord | null>;
    softDelete(id: number, deletedBy: string): Promise<CargoRecord | null>;
    restore(id: number): Promise<CargoRecord | null>;
    permanentDelete(id: number): Promise<boolean>;
}

export interface IEquipmentRepository {
    findActive(): Promise<EquipmentRecord[]>;
    findById(id: number): Promise<EquipmentRecord | null>;
    findByEquipmentId(equipmentId: string): Promise<EquipmentRecord | null>;
    create(data: CreateEquipmentDTO): Promise<EquipmentRecord>;
    update(id: number, data: UpdateEquipmentDTO): Promise<EquipmentRecord | null>;
    softDelete(id: number, deletedBy: string): Promise<EquipmentRecord | null>;
    restore(id: number): Promise<EquipmentRecord | null>;
    permanentDelete(id: number): Promise<boolean>;
}

export interface ITrashRepository {
    getTrash(): Promise<TrashedRecord[]>;
    restore(collection: TrashCollection | string, id: number): Promise<any>;
    permanentDelete(collection: TrashCollection | string, id: number): Promise<boolean>;
    emptyTrash(): Promise<{ count: number; total: number; details: Record<string, number> }>;
}

export interface IUserRepository {
    findByEmail(email: string): Promise<UserRecord | null>;
    findById(id: number): Promise<UserRecord | null>;
    create(data: { email: string; password_hash: string; full_name: string; role: string }): Promise<UserRecord>;
}
