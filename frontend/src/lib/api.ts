// PortFlow API Client

const rawBase = import.meta.env.VITE_API_BASE_URL;
// If user sets 'https://api.domain.com', append '/api' if not already present
let resolvedBase = (rawBase || 'http://localhost:10000/api').trim().replace(/\/$/, '');
if (!resolvedBase.endsWith('/api') && !resolvedBase.includes('/api/')) {
    resolvedBase = `${resolvedBase}/api`;
}

export const API_BASE_URL = resolvedBase;

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('portflow_auth_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        ...getAuthHeaders(),
        ...(options?.headers || {}),
    };

    let res: Response;
    try {
        res = await fetch(url, { ...options, headers });
    } catch {
        throw new Error(
            `Unable to connect to PortFlow backend API (${API_BASE_URL}). Please verify backend is running and CORS is configured.`
        );
    }

    // Try to parse json
    let data: any;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await res.json();
    } else {
        const text = await res.text();
        if (!res.ok) throw new Error(text || `Request failed with HTTP status ${res.status}`);
        return text as unknown as T;
    }

    if (!res.ok) {
        const message = data?.message || data?.error || `API request failed with status ${res.status}`;
        if (res.status === 401 && !endpoint.includes('/auth/')) {
            // Expired or invalid session
            localStorage.removeItem('portflow_auth_token');
            localStorage.removeItem('portflow_auth_user');
            window.dispatchEvent(new Event('portflow-unauthorized'));
        }
        throw new Error(message);
    }

    return data as T;
}

export const api = {
    // ─── Authentication ───
    auth: {
        register: (body: { email: string; password: string; fullName: string; role?: 'Admin' | 'Operator' }) =>
            request<{ success: boolean; message: string; token: string; user: any }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        login: (body: { email: string; password: string }) =>
            request<{ success: boolean; message: string; token: string; user: any }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        me: () => request<{ success: boolean; user: any }>('/auth/me'),
    },

    // ─── Operations CRUD ───
    operations: {
        list: () => request<any[]>('/operations'),
        get: (id: number) => request<any>(`/operations/${id}`),
        create: (body: any) =>
            request<any>('/operations', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/operations/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/operations/${id}`, {
                method: 'DELETE',
            }),
        dispatch: () =>
            request<any>('/operations/dispatch', {
                method: 'POST',
            }),
    },

    // ─── Ships CRUD ───
    ships: {
        list: () => request<any[]>('/ships'),
        get: (id: number) => request<any>(`/ships/${id}`),
        create: (body: any) =>
            request<any>('/ships', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/ships/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/ships/${id}`, {
                method: 'DELETE',
            }),
    },

    // ─── Cargos CRUD ───
    Cargos: {
        list: () => request<any[]>('/Cargos'),
        create: (body: any) =>
            request<any>('/Cargos', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/Cargos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/Cargos/${id}`, {
                method: 'DELETE',
            }),
    },

    // ─── Equipments CRUD ───
    Equipments: {
        list: () => request<any[]>('/Equipments'),
        create: (body: any) =>
            request<any>('/Equipments', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/Equipments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/Equipments/${id}`, {
                method: 'DELETE',
            }),
    },

    // ─── Scheduling ───
    os: {
        state: () => request<any>('/os/state'),
    },

    // ─── Analytics ───
    analytics: {
        get: () => request<any>('/analytics'),
    },

    // ─── Trash Bin ───
    trash: {
        list: () => request<any[]>('/trash'),
        restore: (collection: string, id: number) =>
            request<any>(`/trash/${collection}/${id}/restore`, {
                method: 'POST',
            }),
        permanentDelete: (collection: string, id: number) =>
            request<any>(`/trash/${collection}/${id}`, {
                method: 'DELETE',
            }),
        emptyAll: () =>
            request<{ success: boolean; message: string; details: any }>('/trash', {
                method: 'DELETE',
            }),
    },
};

