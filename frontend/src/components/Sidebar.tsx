import {
    LayoutDashboard, Ship, Anchor, Truck, Settings,
    LogOut, Trash2, Cpu, Boxes, Database, ScrollText, AlertTriangle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthProvider';

export type Page = 'dashboard' | 'operations' | 'ships' | 'Cargos' | 'Equipments' | 'scheduling' | 'trash' | 'logs' | 'reports' | 'report-issue';

export function Sidebar({ role, isOpen, onClose }: {
    role: Role;
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const basePath = role === 'Admin' ? '/admin' : '/operator';

    const getActivePage = (): Page => {
        const path = location.pathname.replace(basePath, '').replace(/^\//, '');
        if (!path || path === 'dashboard') return 'dashboard';
        return path as Page;
    };

    const activePage = getActivePage();

    const handleNavigate = (page: Page) => {
        const target = page === 'dashboard' ? basePath : `${basePath}/${page}`;
        navigate(target);
        if (onClose) onClose();
    };

    const adminItems: { page: Page; label: string; icon: any }[] = [
        { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { page: 'operations', label: 'Operations', icon: Settings },
        { page: 'ships', label: 'Ships', icon: Ship },
        { page: 'Cargos', label: 'Cargo', icon: Boxes },
        { page: 'Equipments', label: 'Berths & Cranes', icon: Truck },
        { page: 'scheduling', label: 'Scheduling', icon: Cpu },
        { page: 'logs', label: 'System Logs', icon: ScrollText },
        { page: 'reports', label: 'Reports', icon: Database },
        { page: 'trash', label: 'Trash Bin', icon: Trash2 },
    ];

    const operatorItems: { page: Page; label: string; icon: any }[] = [
        { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { page: 'operations', label: 'My Operations', icon: Settings },
        { page: 'Cargos', label: 'Cargo', icon: Boxes },
        { page: 'report-issue', label: 'Report Issue', icon: AlertTriangle },
    ];

    const items = role === 'Admin' ? adminItems : operatorItems;

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-logo">
                <div className="logo-icon"><Anchor size={18} /></div>
                <span>PORTFLOW</span>
            </div>

            <nav className="sidebar-section">
                <div className="sidebar-section-label">
                    {role === 'Admin' ? 'ADMIN PANEL' : 'OPERATOR TERMINAL'}
                </div>
                {items.map(({ page, label, icon: Icon }) => (
                    <button
                        key={page}
                        type="button"
                        className={`sidebar-item${activePage === page ? ' active' : ''}`}
                        onClick={() => handleNavigate(page)}
                    >
                        <Icon size={18} /> {label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-brand">
                    <div className="logo-icon"><Anchor size={12} /></div>
                    <span>PORTFLOW</span>
                </div>
                <p>Operate · Manage · Flow</p>
                <button
                    type="button"
                    className="sidebar-item"
                    style={{ marginTop: '0.5rem', color: '#f87171' }}
                    onClick={() => void signOut()}
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </aside>
    );
}

