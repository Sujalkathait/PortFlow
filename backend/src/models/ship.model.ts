export type VesselType = 'Container' | 'Bulk Carrier' | 'Tanker' | 'Ro-Ro' | 'General Cargo';
export type ShipStatus = 'Approaching' | 'Anchored' | 'Berthed' | 'Departed';

export interface ShipRecord {
    id: number;
    imo_number: string;
    name: string;
    vessel_type: VesselType | string;
    capacity_teu: number;
    status: ShipStatus | string;
    berth_id: string | null;
    created_by: string;
    created_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
}

export interface CreateShipDTO {
    name: string;
    imo_number?: string;
    vessel_type?: string;
    capacity_teu?: number;
    berth_id?: string | null;
    created_by: string;
}

export interface UpdateShipDTO {
    name?: string;
    imo_number?: string;
    vessel_type?: string;
    capacity_teu?: number;
    status?: string;
    berth_id?: string | null;
}
