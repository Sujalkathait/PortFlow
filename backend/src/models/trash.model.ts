export type TrashCollection =
    | 'operations'
    | 'ships'
    | 'Cargos'
    | 'Equipments'
    | 'warehouses'
    | 'trucks'
    | 'gate_passes'
    | 'customs_inspections'
    | 'bills'
    | 'issues';

export interface TrashedRecord {
    id: number;
    _collection: TrashCollection;
    label?: string;
    name?: string;
    operation_type?: string;
    cargo_number?: string;
    ship_name?: string;
    status?: string;
    created_by?: string;
    created_at: string;
    deleted_at: string;
    deleted_by?: string;
}
