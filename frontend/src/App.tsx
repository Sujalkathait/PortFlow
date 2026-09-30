import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, type Role } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Bell, ChevronDown, ShieldCheck } from 'lucide-react';

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
const LogsPage = lazy(async () => ({ default: (await import('./pages/LogsPage')).LogsPage }));
const ReportsPage = lazy(async () => ({ default: (await import('./pages/ReportsPage')).ReportsPage }));
const ReportIssuePage = lazy(async () => ({ default: (await import('./pages/ReportIssuePage')).ReportIssuePage }));

function RouteLoading() {
    return <main className="page-loader" aria-live="polite">Loading workspace…</main>;
}

function DashboardLayout({ role, children }: { role: Role; children: React.ReactNode }) {
    const { profile } = useAuth();
    const location = useLocation();

    const userName = profile?.full_name || profile?.email || role;
    const userInitial = userName.charAt(0).toUpperCase();
    const [dark, setDark] = useState(() => localStorage.getItem('portflow-theme') === 'dark');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('portflow-theme', dark ? 'dark' : 'light');
    }, [dark]);

    // Determine current breadcrumb name
    const pathPart = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
    const pageName = pathPart.charAt(0).toUpperCase() + pathPart.slice(1).replace('-', ' ');

    return (
        <SidebarProvider>
            <AppSidebar role={role} />
            <a className="skip-link" href="#main-content-area">Skip to main content</a>
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-screen">
                <header className="flex h-16 items-center justify-between border-b bg-background/95 px-3 sm:px-4 lg:px-6 gap-3">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <span className="text-sm font-medium text-muted-foreground hidden md:block">
                            {role} / <span className="text-foreground">{pageName}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end max-w-xl">
                        <CommandMenu role={role} />
                        
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck size={14} />
                            Live
                        </div>
                        <ThemeToggle dark={dark} onToggle={() => setDark(value => !value)} />
                        <button type="button" className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Notifications: none unread" title="Notifications">
                            <Bell aria-hidden="true" className="size-4" />
                        </button>
                        <div className="flex items-center gap-2.5 pl-2 border-l">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                {userInitial}
                            </div>
                            <div className="hidden lg:block text-left">
                                <div className="text-xs font-semibold leading-none">{userName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">{role}</div>
                            </div>
                            <ChevronDown aria-hidden="true" className="hidden lg:block size-3.5 text-muted-foreground" />
                        </div>
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

                    {/* Admin Protected Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <DashboardPage role="Admin" />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <DashboardPage role="Admin" />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/operations" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <OperationsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/ships" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <ShipsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/Cargos" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <CargoPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/Equipments" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <EquipmentPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/scheduling" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <SchedulingPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/logs" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <LogsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/reports" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <ReportsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/trash" element={
                        <ProtectedRoute role="Admin">
                            <DashboardLayout role="Admin">
                                <TrashPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    {/* Operator Protected Routes */}
                    <Route path="/operator" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <DashboardPage role="Operator" />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/dashboard" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <DashboardPage role="Operator" />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/operations" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <OperationsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/ships" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <ShipsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/Cargos" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <CargoPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/Equipments" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <EquipmentPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/scheduling" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <SchedulingPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/reports" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <ReportsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />
                    <Route path="/operator/report-issue" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <ReportIssuePage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    {/* Fallback Catch-All */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </AppErrorBoundary>
    );
}

export default App;

