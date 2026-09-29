import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, type Role } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { OperationsPage } from './pages/OperationsPage';
import { ShipsPage } from './pages/ShipsPage';
import { CargoPage } from './pages/CargoPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { TrashPage } from './pages/TrashPage';
import { LogsPage } from './pages/LogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { LogOut, Menu, X, ShieldCheck } from 'lucide-react';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { CommandMenu } from "./components/command-menu";

function DashboardLayout({ role, children }: { role: Role; children: React.ReactNode }) {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const userName = profile?.full_name || profile?.email || role;
    const userInitial = userName.charAt(0).toUpperCase();

    // Determine current breadcrumb name
    const pathPart = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
    const pageName = pathPart.charAt(0).toUpperCase() + pathPart.slice(1).replace('-', ' ');

    return (
        <SidebarProvider>
            <AppSidebar role={role} />
            
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-screen">
                <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6 gap-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <span className="text-sm font-medium text-muted-foreground hidden md:block">
                            {role} / <span className="text-foreground">{pageName}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end max-w-xl">
                        <CommandMenu role={role} />
                        
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck size={14} />
                            Live
                        </div>
                        <div className="flex items-center gap-2.5 pl-1 border-l">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                {userInitial}
                            </div>
                            <div className="hidden lg:block text-left">
                                <div className="text-xs font-semibold leading-none">{userName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">{role}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6" id="main-content-area" role="main">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
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
                    <Route path="/operator/scheduling" element={
                        <ProtectedRoute role="Operator">
                            <DashboardLayout role="Operator">
                                <SchedulingPage />
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
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

