import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
    LayoutDashboard, Ship, Anchor, Truck, Settings,
    LogOut, Trash2, Cpu, Boxes, Database, ScrollText, AlertTriangle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function AppSidebar({ role }: { role: string }) {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const basePath = role === 'Admin' ? '/admin' : '/operator';

    const getActivePage = () => {
        const path = location.pathname.replace(basePath, '').replace(/^\//, '');
        if (!path || path === 'dashboard') return 'dashboard';
        return path;
    };

    const activePage = getActivePage();

    const adminItems = [
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

    const operatorItems = [
        { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { page: 'operations', label: 'My Operations', icon: Settings },
        { page: 'ships', label: 'Ships', icon: Ship },
        { page: 'Cargos', label: 'Cargo', icon: Boxes },
        { page: 'scheduling', label: 'Scheduling', icon: Cpu },
        { page: 'report-issue', label: 'Report Issue', icon: AlertTriangle },
    ];

    const items = role === 'Admin' ? adminItems : operatorItems;

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Anchor size={20} className="text-primary" />
                    <span className="font-bold text-lg">PORTFLOW</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{role === 'Admin' ? 'ADMIN PANEL' : 'OPERATOR TERMINAL'}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map(({ page, label, icon: Icon }) => (
                                <SidebarMenuItem key={page}>
                                    <SidebarMenuButton 
                                        isActive={activePage === page}
                                        onClick={() => navigate(page === 'dashboard' ? basePath : `${basePath}/${page}`)}
                                    >
                                        <Icon />
                                        <span>{label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => void signOut()} className="text-red-500 hover:text-red-600">
                            <LogOut />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
