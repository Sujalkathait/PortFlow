export type EquipmentType = 'Berth' | 'Crane' | 'Truck' | 'Warehouse';
export type EquipmentStatus = 'Available' | 'In Use' | 'Maintenance' | 'Offline';

export interface EquipmentRecord {
    id: number;
    equipment_id: string;
    name: string;
    type: EquipmentType | string;
    status: EquipmentStatus | string;
    assigned_to: string | null;
    created_by: string;
    created_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
}

export interface CreateEquipmentDTO {
    equipment_id?: string;
    name: string;
    type: string;
    status?: string;
    created_by: string;
}

export interface UpdateEquipmentDTO {
    name?: string;
    type?: string;
    status?: string;
    assigned_to?: string | null;
}
