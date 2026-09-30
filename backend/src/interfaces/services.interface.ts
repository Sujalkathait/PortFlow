import {
    OperationRecord,
    CreateOperationDTO,
    UpdateOperationDTO,
    OperationMetricsDTO,
    ShipRecord,
    CreateShipDTO,
    UpdateShipDTO,
    CargoRecord,
    CreateCargoDTO,
    UpdateCargoDTO,
    EquipmentRecord,
    CreateEquipmentDTO,
    UpdateEquipmentDTO,
    TrashedRecord,
    RegisterUserDTO,
    LoginDTO,
    AuthResponseDTO
} from '../models';

export interface IOperationsService {
    getOperations(userFilter?: { role?: string; email?: string }): Promise<OperationRecord[]>;
    getOperationById(id: number): Promise<OperationRecord | null>;
    submitOperation(data: CreateOperationDTO): Promise<OperationRecord>;
    updateOperation(id: number, updates: UpdateOperationDTO): Promise<OperationRecord | null>;
    deleteOperation(id: number, deletedBy: string): Promise<OperationRecord | null>;
    dispatchNext(): Promise<{ operationId: number; process: any } | null>;
    getMetrics(): Promise<OperationMetricsDTO>;
}

export interface IShipsService {
    getShips(): Promise<ShipRecord[]>;
    getShipById(id: number): Promise<ShipRecord | null>;
    createShip(data: CreateShipDTO): Promise<ShipRecord>;
    updateShip(id: number, data: UpdateShipDTO): Promise<ShipRecord | null>;
    deleteShip(id: number, deletedBy: string): Promise<ShipRecord | null>;
}

export interface ICargoService {
    getCargos(): Promise<CargoRecord[]>;
    getCargoById(id: number): Promise<CargoRecord | null>;
    createCargo(data: CreateCargoDTO): Promise<CargoRecord>;
    updateCargo(id: number, data: UpdateCargoDTO): Promise<CargoRecord | null>;
    deleteCargo(id: number, deletedBy: string): Promise<CargoRecord | null>;
}

export interface IEquipmentService {
    getEquipments(): Promise<EquipmentRecord[]>;
    getEquipmentById(id: number): Promise<EquipmentRecord | null>;
    createEquipment(data: CreateEquipmentDTO): Promise<EquipmentRecord>;
    updateEquipment(id: number, data: UpdateEquipmentDTO): Promise<EquipmentRecord | null>;
    deleteEquipment(id: number, deletedBy: string): Promise<EquipmentRecord | null>;
}

export interface ITrashService {
    getTrash(): Promise<TrashedRecord[]>;
    restoreItem(collection: string, id: number): Promise<any>;
    permanentlyDeleteItem(collection: string, id: number): Promise<boolean>;
    emptyAllTrash(): Promise<{ count: number; total: number; details: Record<string, number> }>;
}

export interface IAuthService {
    register(data: RegisterUserDTO): Promise<AuthResponseDTO>;
    login(data: LoginDTO): Promise<AuthResponseDTO>;
    getCurrentUser(userId: number): Promise<any>;
}
