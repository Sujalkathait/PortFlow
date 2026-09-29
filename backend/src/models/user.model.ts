export type UserRole = 'Admin' | 'Operator';

export interface UserRecord {
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    role: UserRole | string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
}

export interface RegisterUserDTO {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole | string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponseDTO {
    token: string;
    user: {
        id: number;
        email: string;
        full_name: string;
        role: string;
    };
}
