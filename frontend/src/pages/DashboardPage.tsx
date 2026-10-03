import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Ship, Anchor, Boxes, Activity, Calendar,
    Search, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, AlertCircle,
    Clock, Settings2,
    Wrench, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DashboardPageProps {
    role?: string;
}

export function DashboardPage({ role = 'Operator' }: DashboardPageProps) {
    const navigate = useNavigate();
    const basePath = role === 'Admin' ? '/admin' : '/operator';

    const [operations, setOperations] = useState<any[]>([]);
    const [ships, setShips] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = useCallback(async () => {
        setError('');
        try {
            const [ops, sh, eq, ca] = await Promise.all([
                api.operations.list().catch(() => []),
                api.ships.list().catch(() => []),
                api.Equipments.list().catch(() => []),
                api.Cargos.list().catch(() => []),
            ]);

            setOperations(ops);
            setShips(sh);
            setEquipments(eq);
            setCargos(ca);
        } catch (e: any) {
            setError(e.message || 'Failed to refresh dashboard');
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Live counts from real data — no fallback demo numbers
    const shipsCount = ships.length;
    const opsCount = operations.length;
    const containersCount = cargos.length;
    
    const availableEqCount = equipments.filter(e => e.status === 'Available').length;
    const totalEqCount = equipments.length;
    const resourcesText = totalEqCount > 0 ? `${availableEqCount}/${totalEqCount}` : '0';

    // Equipment availability Breakdown
    const cranes = equipments.filter(e => e.type === 'Crane');
    const availableCranes = cranes.filter(e => e.status === 'Available').length;
    const cranesText = cranes.length > 0 ? `${availableCranes}/${cranes.length}` : '0';

    const berths = equipments.filter(e => e.type === 'Berth');
    const availableBerths = berths.filter(e => e.status === 'Available').length;
    const berthsText = berths.length > 0 ? `${availableBerths}/${berths.length}` : '0';

    const dockedShips = ships.filter(s => s.status === 'Docked' || s.status === 'Arrived').length;
    const shipsAvailabilityText = ships.length > 0 ? `${dockedShips}/${ships.length}` : '0';

    const otherEquipment = equipments.filter(e => e.type !== 'Crane' && e.type !== 'Berth');
    const availableOther = otherEquipment.filter(e => e.status === 'Available').length;
    const otherEquipmentText = otherEquipment.length > 0 ? `${availableOther}/${otherEquipment.length}` : '0';

    // Filter operations by ship name or ref
    const filteredOps = useMemo(() => {
        if (!searchQuery.trim()) return operations;
        const q = searchQuery.toLowerCase();
        return operations.filter(op =>
            (op.ship_name && op.ship_name.toLowerCase().includes(q)) ||
            (op.operation_type && op.operation_type.toLowerCase().includes(q)) ||
            (op.process_id && op.process_id.toLowerCase().includes(q)) ||
            String(op.id).includes(q)
        );
    }, [operations, searchQuery]);

    // Live clock string matching Image 1 format "Mon, Sep 29, 2025 21:42"
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
            setNowString(`${dayName}, ${monthName} ${dayNum}, ${year} ${hours}:${mins}`);
        };
        updateTime();
        const t = setInterval(updateTime, 30000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="flex flex-col space-y-6 w-full max-w-[1440px] mx-auto pb-12">
            {/* ─── Top Header Section (Matching Image 1) ─── */}
            <div 
                className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                style={{
                    backgroundImage: 'url(/image/dashboard-banner-bg.jpg)',
                    backgroundPosition: 'right center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-900/90" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-sm dark:bg-sky-500/20 dark:text-sky-400">
                        <Ship className="h-7 w-7 stroke-[2]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Dashboard
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                            Monitor live operations, schedule tasks and manage port resources.
                        </p>
                    </div>
                </div>

                {/* Date & Time Pill (Matching Image 1) */}
                <div className="relative z-10 flex items-center gap-2.5 px-4 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="h-4 w-4 text-sky-500" />
                    <span>{nowString || 'Loading...'}</span>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="flex items-center justify-between p-3.5 text-xs rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void loadData()} className="h-7 text-xs">
                        Retry
                    </Button>
                </div>
            )}

            {/* ─── 4 Top KPI Cards (Matching Image 1) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Ships */}
                <Card
                    onClick={() => navigate(`${basePath}/ships`)}
                    className="p-5 border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                <Ship className="h-5 w-5 stroke-[2]" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Ships
                                </span>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                                    {shipsCount}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                    <span>registered</span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                </Card>

                {/* 2. Operations */}
                <Card
                    onClick={() => navigate(`${basePath}/operations`)}
                    className="p-5 border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <Activity className="h-5 w-5 stroke-[2]" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Operations
                                </span>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                                    {opsCount}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                    <span>{operations.filter(o => o.status === 'Running').length} active</span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                </Card>

                {/* 3. Containers */}
                <Card
                    onClick={() => navigate(`${basePath}/Cargos`)}
                    className="p-5 border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <Boxes className="h-5 w-5 stroke-[2]" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Containers
                                </span>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                                    {containersCount}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                    <span>tracked</span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                </Card>

                {/* 4. Resources */}
                <Card
                    onClick={() => navigate(`${basePath}/Equipments`)}
                    className="p-5 border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Settings2 className="h-5 w-5 stroke-[2]" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Resources
                                </span>
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                                    {resourcesText}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                                    <span>available</span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                </Card>
            </div>

            {/* ─── Main Content Split Row (Active Operations + Quick Stats & Recent Activity) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ─── Left Side: Active Port Operations (8 Cols) ─── */}
                <div className="lg:col-span-8 flex flex-col space-y-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
                        <CardHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <Anchor className="h-5 w-5 text-sky-500 shrink-0" />
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                            Active Port Operations
                                        </CardTitle>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Search by ship name, filter, or reorder table headers.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`${basePath}/operations`)}
                                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 h-8 shadow-none"
                                >
                                    <span>View All Operations</span>
                                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>

                            {/* Search Filter Input (Matching Image 1) */}
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter operations by ship..."
                                    className="pl-9 h-8 text-xs bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-md"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 flex-1 flex flex-col justify-between">
                            {filteredOps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center my-auto">
                                    <div className="h-12 w-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
                                        <Ship className="h-6 w-6 stroke-[2]" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        No live operations
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                                        Operations will appear here once ships are assigned or port activities begin.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`${basePath}/operations`)}
                                        className="mt-4 text-xs h-7 font-medium"
                                    >
                                        Register Operation
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                                <th className="py-2.5 px-4 font-semibold">Ref</th>
                                                <th className="py-2.5 px-4 font-semibold">TYPE</th>
                                                <th className="py-2.5 px-4 font-semibold">SHIP</th>
                                                <th className="py-2.5 px-4 font-semibold">BERTH / CRANE</th>
                                                <th className="py-2.5 px-4 font-semibold text-center">PRIORITY</th>
                                                <th className="py-2.5 px-4 font-semibold">STATUS</th>
                                                <th className="py-2.5 px-4 font-semibold">TIMING</th>
                                                <th className="py-2.5 px-4 font-semibold text-right">ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {filteredOps.slice(0, 6).map((op) => (
                                                <tr
                                                    key={op.id}
                                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="py-2.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                                                        {op.process_id || `OP-${op.id}`}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                                                        {op.operation_type || 'Cargo Transfer'}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                                        {op.ship_name}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                                                        {op.berth_id || 'Berth 1'} {op.crane_id && op.crane_id !== 'None' ? `· ${op.crane_id}` : ''}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <span
                                                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                op.priority === 1
                                                                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                                                                    : op.priority === 2
                                                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            P{op.priority || 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                                op.status === 'Running'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                                    : op.status === 'Ready' || op.status === 'Queued'
                                                                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    op.status === 'Running'
                                                                        ? 'bg-emerald-500 animate-pulse'
                                                                        : op.status === 'Ready' || op.status === 'Queued'
                                                                        ? 'bg-sky-500'
                                                                        : 'bg-slate-400'
                                                                }`}
                                                            />
                                                            {op.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                                                        {op.waiting_time_ms ? `${Math.round(op.waiting_time_ms / 1000)}s wait` : 'Live'}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`${basePath}/operations`)}
                                                            className="h-6 px-2 text-[11px] text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                                                        >
                                                            Details
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Table Pagination Footer (Matching Image 1) */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 text-xs text-slate-500 mt-auto">
                                <span>
                                    Showing {filteredOps.length > 0 ? 1 : 0} to {Math.min(filteredOps.length, 6)} of {filteredOps.length} records
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled>
                                        <ChevronsLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled>
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="text-[11px] font-medium px-2">Page 1 of 1</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled>
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled>
                                        <ChevronsRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── Right Side: Quick Stats & Recent Activity (4 Cols) ─── */}
                <div className="lg:col-span-4 flex flex-col space-y-4">
                    {/* Quick Stats Card (Matching Image 1) */}
                    <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-card">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="h-4 w-4 text-sky-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Quick Stats
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Total Ships */}
                            <div className="flex items-start gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Ship className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                                        Total Ships
                                    </span>
                                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {shipsCount}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 block">
                                        registered
                                    </span>
                                </div>
                            </div>

                            {/* Active Operations */}
                            <div className="flex items-start gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Settings2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                                        Active Operations
                                    </span>
                                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {opsCount}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 block">
                                        ● {operations.filter(o => o.status === 'Running').length} running
                                    </span>
                                </div>
                            </div>

                            {/* Containers */}
                            <div className="flex items-start gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Boxes className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                                        Containers
                                    </span>
                                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {containersCount}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 block">
                                        tracked
                                    </span>
                                </div>
                            </div>

                            {/* Available Resources */}
                            <div className="flex items-start gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <Anchor className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                                        Available Resources
                                    </span>
                                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                                        {resourcesText}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 block">
                                        ready
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Recent Activity Card (Matching Image 1) */}
                    <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-card flex-1">
                        <div className="flex items-center justify-between mb-3.5">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-sky-500" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                    Recent Activity
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`${basePath}/operations`)}
                                className="h-6 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 p-0 font-medium"
                            >
                                <span>View All</span>
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            {operations.length === 0 ? (
                                <div className="py-6 text-center text-sm text-slate-500 italic">
                                    No activity yet. Create operations to see recent activity here.
                                </div>
                            ) : (
                                operations.slice(0, 4).map((op, idx) => {
                                    const colors = ['sky', 'emerald', 'purple', 'amber'];
                                    const c = colors[idx % colors.length];
                                    const timeAgo = op.created_at
                                        ? (() => {
                                            const diff = Date.now() - new Date(op.created_at).getTime();
                                            const mins = Math.floor(diff / 60000);
                                            if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
                                            const hrs = Math.floor(mins / 60);
                                            if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
                                            return `${Math.floor(hrs / 24)}d ago`;
                                          })()
                                        : 'Just now';
                                    return (
                                        <div key={op.id} className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5">
                                                <span className={`h-2 w-2 rounded-full bg-${c}-500 mt-1.5 shrink-0`} />
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                                        {op.ship_name || `OP-${op.id}`}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 block">
                                                        {op.operation_type} — {op.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {timeAgo}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ─── Bottom Full-Width Section: Equipment Availability (Matching Image 1) ─── */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-card">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <Wrench className="h-4 w-4 text-sky-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            Equipment Availability
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`${basePath}/Equipments`)}
                        className="h-6 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 p-0 font-medium"
                    >
                        <span>View All</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Cranes */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                            <Anchor className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block leading-tight font-medium">Cranes</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{cranesText}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Berths */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                            <Anchor className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block leading-tight font-medium">Berths</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{berthsText}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Ships */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Ship className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block leading-tight font-medium">Ships</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{shipsAvailabilityText}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Other Equipment */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block leading-tight font-medium">Other Equipment</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{otherEquipmentText}</span>
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
