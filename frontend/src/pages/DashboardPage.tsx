import { useEffect, useState, useCallback } from 'react';
import {
  Ship, Settings2, ArrowUp,
  Warehouse, Truck, Ticket, ShieldCheck, CreditCard, ShieldAlert,
  Users, ScrollText, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface DashboardPageProps {
  role?: string;
}

// Custom Crane SVG icon
function CraneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 22h16" />
      <path d="M10 22V5l7-3" />
      <path d="M10 5h10v3H10" />
      <path d="M17 8v6" />
      <path d="M15 14h4" />
      <path d="M17 14v3" />
    </svg>
  );
}

// Custom Shipping Container SVG icon
function ContainerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 6v12" />
      <path d="M11 6v12" />
      <path d="M15 6v12" />
      <path d="M19 6v12" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export function DashboardPage(_props: DashboardPageProps = {}) {
  const navigate = useNavigate();
  const basePath = '/operator';

  const [operations, setOperations] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [ops, sh, eq, ca] = await Promise.all([
        api.operations.list().catch(() => []),
        api.ships.list().catch(() => []),
        api.Equipments.list().catch(() => []),
        api.Cargos.list().catch(() => []),
      ]);

      setOperations(Array.isArray(ops) ? ops : []);
      setShips(Array.isArray(sh) ? sh : []);
      setEquipments(Array.isArray(eq) ? eq : []);
      setCargos(Array.isArray(ca) ? ca : []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Live counts
  const shipsCount = ships.length;
  const activeOpsCount = operations.filter(o => {
    const s = o.status?.toLowerCase();
    return s === 'running' || s === 'in progress';
  }).length;
  const totalOpsCount = operations.length;
  const containersCount = cargos.length;

  const availableEqCount = equipments.filter(e => e.status === 'Available').length;
  const totalEqCount = equipments.length;
  const resourcesRatio = totalEqCount > 0 ? `${availableEqCount}/${totalEqCount}` : '0/0';

  const dockedShipsCount = ships.filter(s => s.status === 'Docked' || s.status === 'Arrived').length;
  const completedOps = operations.filter(o => o.status === 'Completed').length;

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1440px] mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            PORT OPERATIONS
          </span>
          <h1 className="text-2xl xs:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Dashboard & Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quick overview of port operations, resources and vessel activity.
          </p>
        </div>


      </div>

      {/* Row 1: Key Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Ships */}
        <div
          onClick={() => navigate(`${basePath}/ships`)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Ship className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Ships
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {shipsCount}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <ArrowUp className="h-3 w-3 stroke-[3]" />
                <span>{dockedShipsCount} docked</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            Registered vessels monitored in port terminal.
          </p>
        </div>

        {/* 2. Active Operations */}
        <div
          onClick={() => navigate(`${basePath}/operations`)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CraneIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Active Operations
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {activeOpsCount > 0 ? activeOpsCount : totalOpsCount}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <ArrowUp className="h-3 w-3 stroke-[3]" />
                <span>{completedOps} completed</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            Operations currently scheduled or in progress.
          </p>
        </div>

        {/* 3. Containers */}
        <div
          onClick={() => navigate(`${basePath}/cargos`)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ContainerIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Containers
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {containersCount}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                <ArrowUp className="h-3 w-3 stroke-[3]" />
                <span>tracked</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            Total cargo containers managed in terminal yard.
          </p>
        </div>

        {/* 4. Equipment Usage */}
        <div
          onClick={() => navigate(`${basePath}/equipments`)}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Settings2 className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Equipment Usage
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {resourcesRatio}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                available
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            {totalEqCount > 0
              ? `${availableEqCount} of ${totalEqCount} cranes & berths operational.`
              : 'Equipment resources registered in port.'}
          </p>
        </div>
      </div>

      {/* Row 2: 12-Table Enterprise Relational Schema Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              PortFlow 12-Table Enterprise Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Normalized 3NF relational data model covering port operations, physical infrastructure, logistics, and billing. Click any card to navigate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/logistics?tab=warehouses`)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Open Logistics & Compliance Hub <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. users */}
          <div
            onClick={() => navigate(`${basePath}/profile`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Users className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span>1. users</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Authenticated staff & RBAC operators
            </p>
          </div>

          {/* 2. equipment */}
          <div
            onClick={() => navigate(`${basePath}/equipments`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Settings2 className="h-4 w-4 text-sky-500 group-hover:scale-110 transition-transform" />
              <span>2. equipment</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Berths & STS Quay Cranes
            </p>
          </div>

          {/* 3. ships */}
          <div
            onClick={() => navigate(`${basePath}/ships`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Ship className="h-4 w-4 text-cyan-500 group-hover:scale-110 transition-transform" />
              <span>3. ships</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Visiting container cargo vessels
            </p>
          </div>

          {/* 4. warehouses */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=warehouses`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Warehouse className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>4. warehouses</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              CFS Dry Yards & Reefer Units
            </p>
          </div>

          {/* 5. cargo */}
          <div
            onClick={() => navigate(`${basePath}/cargos`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ContainerIcon className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>5. cargo</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              20ft / 40ft TEU freight inventory
            </p>
          </div>

          {/* 6. operations */}
          <div
            onClick={() => navigate(`${basePath}/operations`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CraneIcon className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <span>6. operations</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Central PCB scheduling jobs
            </p>
          </div>

          {/* 7. trucks */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=trucks`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Truck className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span>7. trucks</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Ground drayage transport fleet
            </p>
          </div>

          {/* 8. gate_passes */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=gate-passes`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Ticket className="h-4 w-4 text-teal-500 group-hover:scale-110 transition-transform" />
              <span>8. gate_passes</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Security lane access passes
            </p>
          </div>

          {/* 9. customs_inspections */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=customs`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
              <span>9. customs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Regulatory scans & duty tariffs
            </p>
          </div>

          {/* 10. bills */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=bills`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CreditCard className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>10. bills</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Itemized docking & crane invoices
            </p>
          </div>

          {/* 11. issues */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=issues`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldAlert className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>11. issues</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Incident breakdown alerts
            </p>
          </div>

          {/* 12. system_logs */}
          <div
            onClick={() => navigate(`${basePath}/logs`)}
            className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ScrollText className="h-4 w-4 text-slate-500 group-hover:scale-110 transition-transform" />
              <span>12. system_logs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Immutable OS & audit logs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
