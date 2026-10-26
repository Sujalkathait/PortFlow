// PortFlow API Client

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
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
    
    auth: {
        register: (body: { email: string; password: string; fullName: string; role?: 'Operator' | string }) =>
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
        deleteAccount: () =>
            request<{ success: boolean; message: string }>('/auth/account', {
                method: 'DELETE',
            }),
        forgotPassword: (email: string) =>
            request<{ success: boolean; message: string; debugOtp?: string }>('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            }),
        verifyOTP: (email: string, otp: string) =>
            request<{ success: boolean; message: string }>('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            }),
        resetPassword: (body: { email: string; otp: string; newPassword: string }) =>
            request<{ success: boolean; message: string }>('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
    },

    
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

    
    Cargos: {
        list: () => request<any[]>('/cargos'),
        create: (body: any) =>
            request<any>('/cargos', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/cargos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/cargos/${id}`, {
                method: 'DELETE',
            }),
    },
    get cargos() { return this.Cargos; },
    get cargo() { return this.Cargos; },

    Equipments: {
        list: () => request<any[]>('/equipments'),
        create: (body: any) =>
            request<any>('/equipments', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        update: (id: number, body: any) =>
            request<any>(`/equipments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        delete: (id: number) =>
            request<any>(`/equipments/${id}`, {
                method: 'DELETE',
            }),
    },
    get equipments() { return this.Equipments; },
    get equipment() { return this.Equipments; },

    system: {
        logs: () => request<any[]>('/system/logs'),
        audit: () => request<any[]>('/system/audit'),
        reports: () => request<any>('/system/reports'),
        dbAnalytics: () => request<any>('/system/db-analytics'),
        reportIssue: (body: { title: string; description: string; severity?: string }) =>
            request<any>('/system/report-issue', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
    },

    
    os: {
        state: () => request<any>('/os/state'),
        setAlgorithm: (algorithm: string) =>
            request<any>('/os/algorithm', {
                method: 'PUT',
                body: JSON.stringify({ algorithm }),
            }),
    },

    
    analytics: {
        get: () => request<any>('/analytics'),
    },

    
    trash: {
        list: () => request<any[]>('/trash'),
        restore: (collection: string, id: number) =>
            request<{ success: boolean; message: string; data: any }>(`/trash/restore/${collection}/${id}`, {
                method: 'POST',
            }),
        permanentDelete: (collection: string, id: number) =>
            request<{ success: boolean; message: string }>(`/trash/${collection}/${id}`, {
                method: 'DELETE',
            }),
        empty: () =>
            request<{ success: boolean; message: string; details: any }>('/trash/empty', {
                method: 'DELETE',
            }),
    },

    graphql: {
        query: async <T>(query: string, variables?: Record<string, any>): Promise<T> => {
            const token = localStorage.getItem('portflow_auth_token');
            const graphqlUrl = `${API_BASE_URL.replace(/\/api$/, '')}/graphql`;
            const res = await fetch(graphqlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ query, variables })
            });
            const json = await res.json();
            if (json.errors && json.errors.length > 0) {
                throw new Error(json.errors[0].message || 'GraphQL execution failed');
            }
            return json.data as T;
        }
    },
};

