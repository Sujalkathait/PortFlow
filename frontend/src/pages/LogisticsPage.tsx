import { useEffect, useState, useCallback } from 'react';
import {
  Warehouse, Truck, Ticket, ShieldAlert,
  CreditCard, RefreshCw, AlertCircle,
  Thermometer, ShieldCheck, Search
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('warehouses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Data states for the 6 logistics & compliance tables
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [customs, setCustoms] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [wh, trk, gp, cust, bl, iss] = await Promise.all([
        api.warehouses.list().catch(() => []),
        api.trucks.list().catch(() => []),
        api.gatePasses.list().catch(() => []),
        api.customs.list().catch(() => []),
        api.bills.list().catch(() => []),
        api.issues.list().catch(() => [])
      ]);

      setWarehouses(Array.isArray(wh) ? wh : []);
      setTrucks(Array.isArray(trk) ? trk : []);
      setGatePasses(Array.isArray(gp) ? gp : []);
      setCustoms(Array.isArray(cust) ? cust : []);
      setBills(Array.isArray(bl) ? bl : []);
      setIssues(Array.isArray(iss) ? iss : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch terminal logistics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter helpers
  const filterBySearch = (items: any[], fields: string[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      fields.some(f => String(item[f] || '').toLowerCase().includes(q))
    );
  };

  const filteredWarehouses = filterBySearch(warehouses, ['code', 'name', 'zone_type']);
  const filteredTrucks = filterBySearch(trucks, ['license_plate', 'driver_name', 'transport_company', 'status']);
  const filteredGatePasses = filterBySearch(gatePasses, ['pass_number', 'gate_lane', 'pass_type', 'status']);
  const filteredCustoms = filterBySearch(customs, ['inspection_number', 'declaration_number', 'inspection_type', 'status']);
  const filteredBills = filterBySearch(bills, ['invoice_number', 'customer_name', 'payment_status']);
  const filteredIssues = filterBySearch(issues, ['ticket_number', 'title', 'severity', 'status']);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            PORT LOGISTICS & COMPLIANCE
          </span>
          <h1 className="text-2xl xs:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Logistics, Gate & Billing Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of Warehouses, Drayage Trucks, Gate Passes, Customs Clearances, Invoices, and Fault Tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('warehouses')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'warehouses'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Warehouse className="h-4 w-4 text-blue-600" />
            <span>Warehouses</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {warehouses.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">CFS & Reefer Units</p>
        </div>

        <div
          onClick={() => setActiveTab('trucks')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'trucks'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Truck className="h-4 w-4 text-indigo-600" />
            <span>Drayage Trucks</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {trucks.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active Fleet</p>
        </div>

        <div
          onClick={() => setActiveTab('gate-passes')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'gate-passes'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Ticket className="h-4 w-4 text-emerald-600" />
            <span>Gate Passes</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {gatePasses.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Lanes & Security</p>
        </div>

        <div
          onClick={() => setActiveTab('customs')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'customs'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>Customs</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {customs.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Inspections & Duty</p>
        </div>

        <div
          onClick={() => setActiveTab('bills')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'bills'
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <CreditCard className="h-4 w-4 text-cyan-600" />
            <span>Invoices</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {bills.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tariff Billing</p>
        </div>

        <div
          onClick={() => setActiveTab('issues')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'issues'
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>Fault Tickets</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {issues.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Incident Reports</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Filter ${activeTab.replace('-', ' ')}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Interactive Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="trucks">Trucks</TabsTrigger>
          <TabsTrigger value="gate-passes">Gate Passes</TabsTrigger>
          <TabsTrigger value="customs">Customs</TabsTrigger>
          <TabsTrigger value="bills">Invoices</TabsTrigger>
          <TabsTrigger value="issues">Fault Tickets</TabsTrigger>
        </TabsList>

        {/* 1. Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                Table 4: Warehouses & Storage Facilities
              </CardTitle>
              <CardDescription>
                Container Freight Stations (CFS), Dangerous Goods (Hazmat) enclosures, and Cold Chain Reefer units.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Facility Code</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Zone Type</th>
                        <th className="p-3">Occupancy / Capacity</th>
                        <th className="p-3">Climate Control</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWarehouses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No warehouses match query.
                          </td>
                        </tr>
                      ) : (
                        filteredWarehouses.map((w: any) => {
                          const pct = Math.round(((w.current_occupancy_teu || 0) / (w.capacity_teu || 1)) * 100);
                          return (
                            <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{w.code}</td>
                              <td className="p-3 font-semibold text-foreground">{w.name}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {w.zone_type?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-mono">{w.current_occupancy_teu} / {w.capacity_teu} TEU</span>
                                    <span className="font-semibold text-muted-foreground">{pct}%</span>
                                  </div>
                                  <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {w.temperature_celsius !== null && w.temperature_celsius !== undefined ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                                    <Thermometer className="h-3.5 w-3.5" />
                                    {w.temperature_celsius}°C
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Ambient</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                  {w.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Trucks Tab */}
        <TabsContent value="trucks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                Table 7: Ground Logistics Drayage Fleet
              </CardTitle>
              <CardDescription>
                Commercial freight trucks transporting container loads across port gates and storage yards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">License Plate</th>
                        <th className="p-3">Driver Name</th>
                        <th className="p-3">Driver Contact</th>
                        <th className="p-3">Transport Company</th>
                        <th className="p-3">Max Payload</th>
                        <th className="p-3">Assigned Cargo</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTrucks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No trucks found.
                          </td>
                        </tr>
                      ) : (
                        filteredTrucks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.license_plate}</td>
                            <td className="p-3 font-medium text-foreground">{t.driver_name}</td>
                            <td className="p-3 font-mono text-muted-foreground">{t.driver_phone}</td>
                            <td className="p-3 text-foreground">{t.transport_company}</td>
                            <td className="p-3 font-mono">{t.max_payload_tons} Tons</td>
                            <td className="p-3">
                              {t.assigned_cargo_id ? (
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border">
                                  CRG-{t.assigned_cargo_id}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">None (Empty)</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                t.status === 'In Transit'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                                  : t.status === 'Loading'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Gate Passes Tab */}
        <TabsContent value="gate-passes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-600" />
                Table 8: Gate Passes & Terminal Access Control
              </CardTitle>
              <CardDescription>
                Security inspection lane passes, gate timestamps, and automated check-in/out logging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Pass Number</th>
                        <th className="p-3">Gate Lane</th>
                        <th className="p-3">Pass Type</th>
                        <th className="p-3">Check-In Time</th>
                        <th className="p-3">Check-Out Time</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredGatePasses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No gate passes found.
                          </td>
                        </tr>
                      ) : (
                        filteredGatePasses.map((g: any) => (
                          <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{g.pass_number}</td>
                            <td className="p-3 font-medium text-foreground">{g.gate_lane}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-foreground">
                                {g.pass_type?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {g.check_in_time ? new Date(g.check_in_time).toLocaleString() : 'Pending'}
                            </td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {g.check_out_time ? new Date(g.check_out_time).toLocaleString() : 'In Terminal'}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                g.status === 'Completed'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                              }`}>
                                {g.status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Customs Inspections Tab */}
        <TabsContent value="customs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Table 9: Customs Compliance & Regulatory Inspections
              </CardTitle>
              <CardDescription>
                Border inspections, X-ray scans, tariff duty assessments, and legal cargo clearance logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Inspection ID</th>
                        <th className="p-3">Declaration Number</th>
                        <th className="p-3">Inspection Type</th>
                        <th className="p-3">Duty Tariff Assessment</th>
                        <th className="p-3">Findings</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCustoms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No customs inspections recorded.
                          </td>
                        </tr>
                      ) : (
                        filteredCustoms.map((c: any) => {
                          const dutyFormatted = `$${(Number(c.duty_amount_cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{c.inspection_number}</td>
                              <td className="p-3 font-mono text-foreground font-semibold">{c.declaration_number}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-foreground">
                                  {c.inspection_type?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {dutyFormatted}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                                {c.findings || 'No anomalies recorded.'}
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                  c.status === 'Cleared'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                }`}>
                                  {c.status?.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Bills & Invoices Tab */}
        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-600" />
                Table 10: Automated Billing Engine & Invoices
              </CardTitle>
              <CardDescription>
                Itemized invoices itemizing berth docking duration, STS crane usage hours, and yard storage fees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Invoice Number</th>
                        <th className="p-3">Shipping Line / Client</th>
                        <th className="p-3">Docking Fee</th>
                        <th className="p-3">Crane Usage Fee</th>
                        <th className="p-3">Storage Fee</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No billing invoices recorded.
                          </td>
                        </tr>
                      ) : (
                        filteredBills.map((b: any) => (
                          <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{b.invoice_number}</td>
                            <td className="p-3 font-semibold text-foreground">{b.customer_name}</td>
                            <td className="p-3 font-mono">${Number(b.docking_fee || 0).toFixed(2)}</td>
                            <td className="p-3 font-mono">${Number(b.crane_usage_fee || 0).toFixed(2)}</td>
                            <td className="p-3 font-mono">${Number(b.storage_fee || 0).toFixed(2)}</td>
                            <td className="p-3 font-mono font-extrabold text-slate-900 dark:text-white">
                              ${Number(b.total_amount || 0).toFixed(2)} {b.currency || 'USD'}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                b.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}>
                                {b.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Issues & Breakdown Tickets Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                Table 11: Mechanical Incidents & Breakdown Alerts
              </CardTitle>
              <CardDescription>
                Equipment maintenance tickets, hardware sensor breakdown reports, and resolution logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIssues.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border rounded-lg">
                      No incident tickets reported.
                    </div>
                  ) : (
                    filteredIssues.map((iss: any) => (
                      <div
                        key={iss.id}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 mb-2 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                              {iss.ticket_number}
                            </span>
                            <span className="font-semibold text-sm text-foreground">{iss.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              iss.severity === 'High'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400'
                                : iss.severity === 'Low'
                                ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              Severity: {iss.severity}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              iss.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {iss.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {iss.description}
                        </p>

                        {iss.resolution_notes && (
                          <div className="mt-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded text-emerald-900 dark:text-emerald-300">
                            <strong>Resolution:</strong> {iss.resolution_notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default LogisticsPage;
