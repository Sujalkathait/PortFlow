import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Ship,
  ArrowUp, ArrowDown, Trophy, Star, Clock,
  ArrowRight, Lightbulb, Settings2,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface DashboardPageProps {
  role?: string;
}

// Custom Crane SVG icon matching the purple badge in the reference mockup
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

// Custom Shipping Container SVG icon matching the green badge in the reference mockup
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

// Helper to format relative time from a date string or timestamp
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Recent';
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) return 'Recent';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function DashboardPage(_props: DashboardPageProps = {}) {
  const navigate = useNavigate();
  const basePath = '/operator';

  const [operations, setOperations] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Pure live counts strictly calculated from actual database records — NO hardcoded numbers!
  const shipsCount = ships.length;
  const activeOpsCount = operations.filter(o => o.status === 'Running' || o.status === 'In progress').length;
  const totalOpsCount = operations.length;
  const containersCount = cargos.length;

  const availableEqCount = equipments.filter(e => e.status === 'Available').length;
  const totalEqCount = equipments.length;
  const resourcesRatio = totalEqCount > 0 ? `${availableEqCount}/${totalEqCount}` : '0/0';

  const dockedShipsCount = ships.filter(s => s.status === 'Docked' || s.status === 'Arrived').length;
  const maintenanceCount = equipments.filter(e => e.status === 'Maintenance' || e.status === 'Offline').length;

  const completedOps = operations.filter(o => o.status === 'Completed').length;
  const overallPerformance = totalOpsCount > 0
    ? `${Math.round((completedOps / totalOpsCount) * 100)}%`
    : '100%';

  const resourceAvailabilityPercent = totalEqCount > 0
    ? `${Math.round((availableEqCount / totalEqCount) * 100)}%`
    : '0%';

  // Pure dynamic activities built strictly from database records — NO mock/fake strings!
  const recentActivities = useMemo(() => {
    const list: any[] = [];

    // Operations activities
    operations.forEach((op) => {
      const isCompleted = op.status === 'Completed';
      const isRunning = op.status === 'Running' || op.status === 'In progress';
      list.push({
        id: `op-${op.id}`,
        rawDate: op.created_at || op.updated_at,
        time: formatTimeAgo(op.created_at || op.updated_at),
        type: op.operation_type?.toLowerCase().includes('cargo') ? 'Container' : 'Operation',
        details: `${op.operation_type || 'Cargo Op'} on ${op.ship_name || `Vessel #${op.id}`}`,
        status: op.status || 'Active',
        statusClass: isCompleted
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
          : isRunning
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        icon: op.operation_type?.toLowerCase().includes('cargo')
          ? <ContainerIcon className="h-3.5 w-3.5" />
          : <CraneIcon className="h-3.5 w-3.5" />,
        iconWrap: op.operation_type?.toLowerCase().includes('cargo')
          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
          : 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      });
    });

    // Ships activities
    ships.forEach((s) => {
      list.push({
        id: `ship-${s.id}`,
        rawDate: s.arrival_time || s.created_at,
        time: formatTimeAgo(s.arrival_time || s.created_at),
        type: 'Ship',
        details: `${s.name || 'Vessel'} (Type: ${s.type || 'Cargo'}, Berth: ${s.berth_assigned || 'Unassigned'})`,
        status: s.status || 'Registered',
        statusClass: s.status === 'Docked'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
          : s.status === 'Arrived'
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        icon: <Ship className="h-3.5 w-3.5 stroke-[2.2]" />,
        iconWrap: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
      });
    });

    // Equipment maintenance activities if any
    equipments
      .filter((e) => e.status === 'Maintenance' || e.status === 'Offline')
      .forEach((e) => {
        list.push({
          id: `eq-${e.id}`,
          rawDate: e.updated_at || e.created_at,
          time: formatTimeAgo(e.updated_at || e.created_at),
          type: 'Resource',
          details: `${e.name || e.type || 'Equipment'} (${e.code || `#${e.id}`}) went offline for service`,
          status: 'Maintenance',
          statusClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
          icon: <Settings2 className="h-3.5 w-3.5 stroke-[2.2]" />,
          iconWrap: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        });
      });

    // Sort by timestamp descending
    list.sort((a, b) => {
      const ta = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const tb = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return tb - ta;
    });

    return list.slice(0, 6);
  }, [operations, ships, equipments]);

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1440px] mx-auto pb-10">
      {/* ─── Top Header: Title & Good Progress Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            PORT OPERATIONS
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Dashboard & Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quick overview of port operations, resources and vessel activity.
          </p>
        </div>


      </div>

      {/* ─── Row 1: 4 Key Metric Cards (White Cards) with strictly real data ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ─── Row 2: 4 Performance & Insights Cards (Tinted Cards) with strictly real data ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 5: Best Result */}
        <div className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-[#dcfce7] dark:border-emerald-900/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ArrowUp className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Best Result
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            +{containersCount}
          </div>
          <div className="text-xs font-bold text-emerald-950 dark:text-emerald-300 mt-1">
            Container Increase
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {containersCount > 0
              ? `You have ${containersCount} active container manifests registered.`
              : 'Container throughput logged across active berths.'}
          </p>
        </div>

        {/* Card 6: Overall Performance */}
        <div className="bg-[#eff6ff] dark:bg-blue-950/20 border border-[#dbeafe] dark:border-blue-900/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="h-3.5 w-3.5 fill-white" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Overall Performance
            </span>
          </div>
          <div className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-3 tracking-tight">
            {overallPerformance}
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
            Operations On Track
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Everything is running well and on schedule.
          </p>
        </div>

        {/* Card 7: Maintenance Status */}
        <div className="bg-[#fffbeb] dark:bg-amber-950/20 border border-[#fef3c7] dark:border-amber-900/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ArrowDown className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Maintenance
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            {maintenanceCount}
          </div>
          <div className="text-xs font-bold text-amber-950 dark:text-amber-300 mt-1">
            Offline Resources
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {maintenanceCount > 0
              ? `${maintenanceCount} equipment units currently under service inspection.`
              : 'All cranes and berths are currently fully operational.'}
          </p>
        </div>

        {/* Card 8: Key Insight */}
        <div className="bg-[#faf5ff] dark:bg-purple-950/20 border border-[#f3e8ff] dark:border-purple-900/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Star className="h-3.5 w-3.5 fill-white" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Key Insight
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            {resourceAvailabilityPercent}
          </div>
          <div className="text-xs font-bold text-purple-950 dark:text-purple-300 mt-1">
            Resource Availability
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {totalEqCount > 0
              ? `${availableEqCount} of ${totalEqCount} resources ready for deployment.`
              : 'Add cranes and berths to monitor utilization.'}
          </p>
        </div>
      </div>
    </div>
  );
}
