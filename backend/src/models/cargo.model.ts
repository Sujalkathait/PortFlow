export type CargoSizeType = '20ft' | '40ft' | '45ft' | 'Reefer' | string;
export type CargoCategory = 'General' | 'Hazardous' | 'Perishable' | 'Fragile' | 'Liquid' | string;
export type CargoStatus = 'On Ship' | 'In Yard' | 'Cleared' | 'Dispatched' | string;

export interface CargoRecord {
    id: number;
    cargo_number: string;
    size_type: CargoSizeType;
    weight_tons: number;
    cargo_type: CargoCategory;
    current_location: string;
    ship_name: string;
    status: CargoStatus;
    created_by: string;
    created_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
}

export interface CreateCargoDTO {
    cargo_number: string;
    size_type?: string;
    weight_tons?: number;
    cargo_type?: string;
    current_location?: string;
    ship_name?: string;
    created_by: string;
}

export interface UpdateCargoDTO {
    cargo_number?: string;
    size_type?: string;
    weight_tons?: number;
    cargo_type?: string;
    current_location?: string;
    ship_name?: string;
    status?: string;
}
