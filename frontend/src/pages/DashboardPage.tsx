import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship, Settings2, Activity,
  Warehouse, Truck, Ticket, ShieldCheck, CreditCard, ShieldAlert,
  Users, ScrollText, ArrowRight, RefreshCw,
  Plus, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';

interface DashboardPageProps {
  role?: string;
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

  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, sh, eq, ca, iss, bl] = await Promise.all([
        api.operations.list().catch(() => []),
        api.ships.list().catch(() => []),
        api.Equipments.list().catch(() => []),
        api.Cargos.list().catch(() => []),
        api.issues.list().catch(() => []),
        api.bills.list().catch(() => [])
      ]);

      setOperations(Array.isArray(ops) ? ops : []);
      setShips(Array.isArray(sh) ? sh : []);
      setEquipments(Array.isArray(eq) ? eq : []);
      setCargos(Array.isArray(ca) ? ca : []);
      setIssues(Array.isArray(iss) ? iss : []);
      setBills(Array.isArray(bl) ? bl : []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Derived metrics
  const activeOpsCount = operations.filter(o => {
    const s = o.status?.toLowerCase();
    return s === 'running' || s === 'in progress';
  }).length;
  const completedOps = operations.filter(o => o.status?.toLowerCase() === 'completed').length;

  const dockedShipsCount = ships.filter(s => {
    const sStatus = s.status?.toLowerCase();
    return sStatus === 'docked' || sStatus === 'arrived';
  }).length;

  const availableEqCount = equipments.filter(e => e.status === 'Available').length;
  const totalEqCount = equipments.length;

  const activeIssues = issues.filter(i => i.status !== 'Resolved');
  const pendingBills = bills.filter(b => b.payment_status !== 'Paid');
  const recentOperations = operations.slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Port Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of vessels, container moves, equipment, and gate traffic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={loading}
            className="h-9 text-xs font-medium"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`${basePath}/operations`)}
            className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Operation
          </Button>
        </div>
      </div>

      {/* 2. Key Operational Statistics (4 Clean KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Operations */}
        <div
          onClick={() => navigate(`${basePath}/operations`)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Operations</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {activeOpsCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{completedOps} completed</span>
            <span>•</span>
            <span>{operations.length} scheduled</span>
          </div>
        </div>

        {/* Card 2: Docked Vessels */}
        <div
          onClick={() => navigate(`${basePath}/ships`)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-600 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vessels in Port</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {dockedShipsCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ships.length} vessels registered on file
          </div>
        </div>

        {/* Card 3: Containers in Yard */}
        <div
          onClick={() => navigate(`${basePath}/cargos`)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Yard Containers</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ContainerIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {cargos.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            20ft & 40ft TEU freight inventory
          </div>
        </div>

        {/* Card 4: Equipment Availability */}
        <div
          onClick={() => navigate(`${basePath}/equipments`)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Equipment Available</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Settings2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {availableEqCount} / {totalEqCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Berths & STS cranes operational
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Operations (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Recent Operations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest jobs dispatched through the port scheduler.
              </p>
            </div>
            <button
              onClick={() => navigate(`${basePath}/operations`)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Vessel</th>
                  <th className="py-2.5 px-3">Job Type</th>
                  <th className="py-2.5 px-3">Berth / Crane</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOperations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No operations recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOperations.map((op: any) => (
                    <tr
                      key={op.id}
                      onClick={() => navigate(`${basePath}/operations`)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {op.ship_name || 'Vessel'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {op.operation_type}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {op.berth_id} / {op.crane_id || 'None'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          op.priority >= 3
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : op.priority === 2
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          P{op.priority || 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          op.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : op.status === 'Running' || op.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Notifications (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Alerts & Notices
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {activeIssues.length} Active
              </span>
            </div>

            {/* Active alerts list */}
            <div className="space-y-3">
              {activeIssues.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">All Systems Operational</div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                      No mechanical breakdowns or high-severity incidents reported.
                    </div>
                  </div>
                </div>
              ) : (
                activeIssues.slice(0, 3).map((iss: any) => (
                  <div
                    key={iss.id}
                    onClick={() => navigate(`${basePath}/logistics?tab=issues`)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {iss.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        iss.severity === 'Critical' || iss.severity === 'High'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {iss.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {iss.description}
                    </p>
                  </div>
                ))
              )}

              {/* Billing notice card */}
              <div
                onClick={() => navigate(`${basePath}/logistics?tab=bills`)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 transition cursor-pointer mt-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Invoices Pending
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {pendingBills.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Automated tariff invoices awaiting client settlement.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePath}/logistics?tab=issues`)}
            className="w-full mt-4 text-xs font-semibold"
          >
            Open Logistics Hub <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 4. Bottom Section: Quick Access to All 12 Port Tables */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Port System Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct access to all 12 port operations, physical asset, and logistics tables.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* 1. users */}
          <div
            onClick={() => navigate(`${basePath}/profile`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Users className="h-4 w-4 text-blue-500" />
              <span>1. users</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Staff & RBAC
            </p>
          </div>

          {/* 2. equipment */}
          <div
            onClick={() => navigate(`${basePath}/equipments`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Settings2 className="h-4 w-4 text-sky-500" />
              <span>2. equipment</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Berths & Cranes
            </p>
          </div>

          {/* 3. ships */}
          <div
            onClick={() => navigate(`${basePath}/ships`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Ship className="h-4 w-4 text-cyan-500" />
              <span>3. ships</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Visiting Vessels
            </p>
          </div>

          {/* 4. warehouses */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=warehouses`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Warehouse className="h-4 w-4 text-emerald-500" />
              <span>4. warehouses</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              CFS & Reefer Yards
            </p>
          </div>

          {/* 5. cargo */}
          <div
            onClick={() => navigate(`${basePath}/cargos`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ContainerIcon className="h-4 w-4 text-amber-500" />
              <span>5. cargo</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Container TEUs
            </p>
          </div>

          {/* 6. operations */}
          <div
            onClick={() => navigate(`${basePath}/operations`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Activity className="h-4 w-4 text-purple-500" />
              <span>6. operations</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              CPU Scheduler
            </p>
          </div>

          {/* 7. trucks */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=trucks`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Truck className="h-4 w-4 text-indigo-500" />
              <span>7. trucks</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Drayage Fleet
            </p>
          </div>

          {/* 8. gate_passes */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=gate-passes`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Ticket className="h-4 w-4 text-teal-500" />
              <span>8. gate_passes</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Security Access
            </p>
          </div>

          {/* 9. customs */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=customs`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-yellow-500" />
              <span>9. customs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Inspections & Duty
            </p>
          </div>

          {/* 10. bills */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=bills`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>10. bills</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Automated Invoices
            </p>
          </div>

          {/* 11. issues */}
          <div
            onClick={() => navigate(`${basePath}/logistics?tab=issues`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <span>11. issues</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Incident Tickets
            </p>
          </div>

          {/* 12. system_logs */}
          <div
            onClick={() => navigate(`${basePath}/logs`)}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ScrollText className="h-4 w-4 text-slate-500" />
              <span>12. system_logs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              Immutable Audit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
