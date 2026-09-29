import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

export type Role = 'Admin' | 'Operator';

export type Profile = {
    id: number | string;
    email: string;
    full_name: string;
    role: Role;
};

type AuthState = {
    user: Profile | null;
    profile: Profile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<Profile>;
    register: (email: string, password: string, fullName: string, role?: Role) => Promise<Profile>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'portflow_auth_token';
const USER_KEY = 'portflow_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Profile | null>(() => {
        const saved = localStorage.getItem(USER_KEY);
        if (!saved) return null;
        try {
            return JSON.parse(saved) as Profile;
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.auth.me();
                if (res?.user) {
                    const verifiedUser: Profile = {
                        id: res.user.id,
                        email: res.user.email,
                        full_name: res.user.fullName || res.user.full_name || res.user.email,
                        role: res.user.role,
                    };
                    setUser(verifiedUser);
                    localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
                }
            } catch {
                // Token expired or invalid
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        void verifySession();

        const handleUnauthorized = () => {
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        };

        window.addEventListener('portflow-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('portflow-unauthorized', handleUnauthorized);
    }, []);

    const login = async (email: string, password: string): Promise<Profile> => {
        setLoading(true);
        try {
            const res = await api.auth.login({ email, password });
            const loggedUser: Profile = {
                id: res.user.id,
                email: res.user.email,
                full_name: res.user.full_name || res.user.email,
                role: res.user.role,
            };
            localStorage.setItem(TOKEN_KEY, res.token);
            localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
            setUser(loggedUser);
            return loggedUser;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, fullName: string, role?: Role): Promise<Profile> => {
        setLoading(true);
        try {
            const res = await api.auth.register({ email, password, fullName, role });
            const registeredUser: Profile = {
                id: res.user.id,
                email: res.user.email,
                full_name: res.user.full_name,
                role: res.user.role,
            };
            localStorage.setItem(TOKEN_KEY, res.token);
            localStorage.setItem(USER_KEY, JSON.stringify(registeredUser));
            setUser(registeredUser);
            return registeredUser;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile: user,
                loading,
                login,
                register,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const value = useContext(AuthContext);
    if (!value) throw new Error('useAuth must be used inside AuthProvider');
    return value;
};
