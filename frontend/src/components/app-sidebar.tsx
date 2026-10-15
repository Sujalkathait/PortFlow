import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Ship, Truck, Settings,
  LogOut, Cpu, Boxes, User, Trash2, ScrollText, AlertTriangle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function AppSidebar(_props: { role?: string } = {}) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = '/operator';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const getActivePage = () => {
    const path = location.pathname.replace(basePath, '').replace(/^\//, '').toLowerCase();
    if (!path || path === 'dashboard') return 'dashboard';
    return path;
  };

  const activePage = getActivePage();

  // Navigation items
  const items = [
    { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'ships', label: 'Ships', icon: Ship },
    { page: 'cargos', label: 'Containers', icon: Boxes },
    { page: 'equipments', label: 'Equipment', icon: Truck },
    { page: 'operations', label: 'Operations', icon: Settings },
    { page: 'scheduling', label: 'OS Scheduler', icon: Cpu },
    { page: 'trash', label: 'Trash', icon: Trash2 },
    { page: 'report-issue', label: 'Report Issue', icon: AlertTriangle },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <SidebarHeader className="border-b border-slate-100 dark:border-slate-800/80 px-4 py-3.5">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate(basePath)}
        >
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Ship className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#0a2540] dark:text-white">
            PORTFLOW
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map(({ page, label, icon: Icon }) => {
                const isActive = activePage === page;
                return (
                  <SidebarMenuItem key={page}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(page === 'dashboard' ? basePath : `${basePath}/${page}`)}
                      tooltip={label}
                      className={`w-full rounded-xl text-sm font-medium transition-colors px-3 py-2.5 flex items-center gap-3 ${isActive
                          ? 'bg-[#e0f2fe] text-[#0284c7] font-bold hover:bg-[#e0f2fe] dark:bg-sky-950/60 dark:text-sky-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#0284c7] dark:text-sky-300' : 'text-slate-400'}`} />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 p-3 flex flex-col gap-2">
        {/* System Online Status */}
        <div className="px-2 py-1 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>
        <SidebarMenu className="mt-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate(`${basePath}/profile`)}
              tooltip="Profile"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => void handleSignOut()}
              tooltip="Logout"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
