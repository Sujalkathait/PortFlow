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

function DashboardLayout({ role, children }: { role: Role; children: React.ReactNode }) {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="app-layout">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 40,
                    }}
                />
            )}

            <Sidebar
                role={role}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="main-content">
                <header className="top-header">
                    <div className="top-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            type="button"
                            className="mobile-menu-btn icon-button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle Navigation Menu"
                            style={{ display: 'none' }}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <span className="breadcrumb">
                            {role} / {pageName}
                        </span>
                    </div>

                    <div className="top-header-right">
                        <span className="header-badge" title="Connected to PostgreSQL Database">
                            <ShieldCheck size={13} style={{ color: '#10b981' }} />
                            <span>Live Database</span>
                        </span>
                        <div className="user-info">
                            <div className="user-avatar">{userInitial}</div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{userName}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{role} · Online</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="signout-btn"
                            onClick={() => void handleSignOut()}
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </header>

                <main id="main-content-area" role="main">
                    {children}
                </main>
            </div>
        </div>
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

