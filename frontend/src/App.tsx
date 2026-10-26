import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown } from 'lucide-react';
import { AuthProvider, useAuth, type Role } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { CommandMenu } from "./components/command-menu";
import { ThemeToggle } from './components/theme-toggle';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const Login = lazy(async () => ({ default: (await import('./pages/Login')).Login }));
const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }));
const OperationsPage = lazy(async () => ({ default: (await import('./pages/OperationsPage')).OperationsPage }));
const ShipsPage = lazy(async () => ({ default: (await import('./pages/ShipsPage')).ShipsPage }));
const CargoPage = lazy(async () => ({ default: (await import('./pages/CargoPage')).CargoPage }));
const EquipmentPage = lazy(async () => ({ default: (await import('./pages/EquipmentPage')).EquipmentPage }));
const SchedulingPage = lazy(async () => ({ default: (await import('./pages/SchedulingPage')).SchedulingPage }));
const TrashPage = lazy(async () => ({ default: (await import('./pages/TrashPage')).TrashPage }));
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }));
const ReportIssuePage = lazy(async () => ({ default: (await import('./pages/ReportIssuePage')).ReportIssuePage }));
const LogsPage = lazy(async () => ({ default: (await import('./pages/LogsPage')).LogsPage }));
const ReportsPage = lazy(async () => ({ default: (await import('./pages/ReportsPage')).ReportsPage }));

function RouteLoading() {
    return <main className="page-loader" aria-live="polite">Loading workspace…</main>;
}

function DashboardLayout({ children }: { role?: Role; children: React.ReactNode }) {
    const { profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const userName = profile?.full_name || profile?.email || 'Operator';
    const userInitial = userName.charAt(0).toUpperCase();
    const [dark, setDark] = useState(() => localStorage.getItem('portflow-theme') === 'dark');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('portflow-theme', dark ? 'dark' : 'light');
    }, [dark]);

    // Clock update
    const [nowString, setNowString] = useState('');
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayName = days[now.getDay()];
            const monthName = months[now.getMonth()];
            const dayNum = now.getDate();
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            setNowString(`${dayName}, ${monthName} ${dayNum}, ${year}  ${hours}:${mins}`);
        };
        updateTime();
        const t = setInterval(updateTime, 30000);
        return () => clearInterval(t);
    }, []);

    // Breadcrumb text mapping
    const pathPart = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
    const titleMap: Record<string, string> = {
        dashboard: 'Dashboard Overview',
        operations: 'Operations Management',
        ships: 'Vessels & Berthing',
        cargos: 'Containers & Manifests',
        cargo: 'Containers & Manifests',
        equipments: 'Equipment & Cranes',
        equipment: 'Equipment & Cranes',
        scheduling: 'OS CPU Scheduling',
        reports: 'Analytics & Reports',
        logs: 'System & Audit Logs',
        trash: 'Recycle Bin & Trash',
        'report-issue': 'Report Incident',
        profile: 'Operator Profile',
    };
    const pageName = titleMap[pathPart.toLowerCase()] || (pathPart.charAt(0).toUpperCase() + pathPart.slice(1).replace('-', ' '));

    return (
        <SidebarProvider>
            <AppSidebar />
            <a className="skip-link" href="#main-content-area">Skip to main content</a>
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-background overflow-hidden h-screen">
                <header className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-background/95 px-4 sm:px-6 lg:px-8 gap-3">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <span className="text-sm font-medium text-slate-500 hidden md:block">
                            PortFlow / <span className="font-semibold text-slate-900 dark:text-white">{pageName}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end max-w-xl">
                        <CommandMenu />
                        <ThemeToggle dark={dark} onToggle={() => setDark(value => !value)} />

                        {/* Clock widget */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{nowString}</span>
                        </div>

                        {/* Profile dropdown */}
                        <button
                            type="button"
                            onClick={() => navigate('/operator/profile')}
                            className="flex items-center gap-2.5 pl-2 hover:opacity-85 transition text-left cursor-pointer bg-transparent border-none"
                            title="View My Profile"
                        >
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {userInitial || 'T'}
                            </div>
                            <div className="hidden md:block text-left">
                                <div className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
                                    {userName || 'Operator'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                    Port Operations
                                </div>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-7" id="main-content-area" role="main" tabIndex={-1}>
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}

function App() {
    return (
        <AppErrorBoundary>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteLoading />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />

                    {/* Legacy redirects */}
                    <Route path="/admin/*" element={<Navigate to="/operator" replace />} />

                    {/* Protected Routes */}
                    <Route path="/operator" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <DashboardPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/dashboard" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <DashboardPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/operations" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <OperationsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/ships" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ShipsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/cargos" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <CargoPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/cargo" element={<Navigate to="/operator/cargos" replace />} />
                    <Route path="/operator/Cargos" element={<Navigate to="/operator/cargos" replace />} />

                    <Route path="/operator/equipments" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <EquipmentPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/equipment" element={<Navigate to="/operator/equipments" replace />} />
                    <Route path="/operator/Equipments" element={<Navigate to="/operator/equipments" replace />} />

                    <Route path="/operator/scheduling" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <SchedulingPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/trash" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <TrashPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/profile" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ProfilePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/report-issue" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ReportIssuePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/logs" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <LogsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/reports" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ReportsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    {/* Root Aliases */}
                    <Route path="/dashboard" element={<Navigate to="/operator/dashboard" replace />} />
                    <Route path="/operations" element={<Navigate to="/operator/operations" replace />} />
                    <Route path="/ships" element={<Navigate to="/operator/ships" replace />} />
                    <Route path="/cargos" element={<Navigate to="/operator/cargos" replace />} />
                    <Route path="/cargo" element={<Navigate to="/operator/cargos" replace />} />
                    <Route path="/equipments" element={<Navigate to="/operator/equipments" replace />} />
                    <Route path="/equipment" element={<Navigate to="/operator/equipments" replace />} />
                    <Route path="/scheduling" element={<Navigate to="/operator/scheduling" replace />} />
                    <Route path="/trash" element={<Navigate to="/operator/trash" replace />} />
                    <Route path="/report-issue" element={<Navigate to="/operator/report-issue" replace />} />
                    <Route path="/logs" element={<Navigate to="/operator/logs" replace />} />
                    <Route path="/reports" element={<Navigate to="/operator/reports" replace />} />
                    <Route path="/profile" element={<Navigate to="/operator/profile" replace />} />

                    {/* 404 Catch-All Fallback */}
                    <Route path="*" element={<Navigate to="/operator" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </AppErrorBoundary>
    );
}

export default App;

