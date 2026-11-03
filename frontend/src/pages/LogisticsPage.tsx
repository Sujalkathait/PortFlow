import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Warehouse, Truck, Ticket, ShieldAlert,
  CreditCard, RefreshCw, AlertCircle, CheckCircle2,
  Thermometer, ShieldCheck, Search, Plus,
  Pencil, Trash2, Check
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function LogisticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(
    tabParam && ['warehouses', 'trucks', 'gate-passes', 'customs', 'bills', 'issues'].includes(tabParam)
      ? tabParam
      : 'warehouses'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Data states for the 6 logistics & compliance tables
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [customs, setCustoms] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  // Modal Dialog States
  const [warehouseModal, setWarehouseModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: null });
  const [truckModal, setTruckModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: null });
  const [gatePassModal, setGatePassModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [customsModal, setCustomsModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: null });
  const [billModal, setBillModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [issueModal, setIssueModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: null });

  // Sync tab change with searchParams
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  useEffect(() => {
    if (tabParam && ['warehouses', 'trucks', 'gate-passes', 'customs', 'bills', 'issues'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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

  // Flash message helper
  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  // =========================================================================
  // CRUD HANDLERS
  // =========================================================================

  // Table 4: Warehouses
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (warehouseModal.mode === 'create') {
        await api.warehouses.create(warehouseModal.data);
        showSuccessMsg(`Warehouse ${warehouseModal.data.code} created successfully.`);
      } else {
        await api.warehouses.update(warehouseModal.data.id, warehouseModal.data);
        showSuccessMsg(`Warehouse ${warehouseModal.data.code} updated successfully.`);
      }
      setWarehouseModal({ open: false, mode: 'create', data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save warehouse.');
    }
  };

  const handleDeleteWarehouse = async (id: number, code: string) => {
    if (!window.confirm(`Delete warehouse ${code}?`)) return;
    try {
      await api.warehouses.delete(id);
      showSuccessMsg(`Warehouse ${code} deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete warehouse.');
    }
  };

  // Table 7: Trucks
  const handleSaveTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (truckModal.mode === 'create') {
        await api.trucks.create(truckModal.data);
        showSuccessMsg(`Truck ${truckModal.data.license_plate} registered successfully.`);
      } else {
        await api.trucks.update(truckModal.data.id, truckModal.data);
        showSuccessMsg(`Truck ${truckModal.data.license_plate} updated.`);
      }
      setTruckModal({ open: false, mode: 'create', data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save truck.');
    }
  };

  const handleDeleteTruck = async (id: number, plate: string) => {
    if (!window.confirm(`Delete truck ${plate}?`)) return;
    try {
      await api.trucks.delete(id);
      showSuccessMsg(`Truck ${plate} deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete truck.');
    }
  };

  // Table 8: Gate Passes
  const handleSaveGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.gatePasses.create(gatePassModal.data);
      showSuccessMsg('Gate pass issued successfully.');
      setGatePassModal({ open: false, data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to issue gate pass.');
    }
  };

  const handleCheckoutGatePass = async (id: number) => {
    try {
      await api.gatePasses.update(id, { status: 'Completed' });
      showSuccessMsg(`Gate pass #${id} marked as Completed/Checked-Out.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update gate pass.');
    }
  };

  const handleDeleteGatePass = async (id: number) => {
    if (!window.confirm(`Delete gate pass #${id}?`)) return;
    try {
      await api.gatePasses.delete(id);
      showSuccessMsg(`Gate pass #${id} deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete gate pass.');
    }
  };

  // Table 9: Customs Inspections
  const handleSaveCustoms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customsModal.mode === 'create') {
        await api.customs.create(customsModal.data);
        showSuccessMsg('Customs inspection registered.');
      } else {
        await api.customs.update(customsModal.data.id, customsModal.data);
        showSuccessMsg('Customs inspection updated.');
      }
      setCustomsModal({ open: false, mode: 'create', data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save customs inspection.');
    }
  };

  const handleClearCustoms = async (id: number) => {
    try {
      await api.customs.update(id, { status: 'Cleared' });
      showSuccessMsg(`Customs inspection #${id} marked as Cleared.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to clear customs inspection.');
    }
  };

  const handleDeleteCustoms = async (id: number) => {
    if (!window.confirm(`Delete customs inspection #${id}?`)) return;
    try {
      await api.customs.delete(id);
      showSuccessMsg(`Customs inspection #${id} deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete customs inspection.');
    }
  };

  // Table 10: Bills
  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.bills.generate(billModal.data);
      showSuccessMsg('Invoice generated successfully.');
      setBillModal({ open: false, data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice.');
    }
  };

  const handlePayBill = async (id: number) => {
    try {
      await api.bills.pay(id);
      showSuccessMsg(`Invoice #${id} settled and marked as Paid.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to settle bill payment.');
    }
  };

  // Table 11: Issues
  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (issueModal.mode === 'create') {
        await api.issues.create(issueModal.data);
        showSuccessMsg('Incident breakdown ticket reported.');
      } else {
        await api.issues.update(issueModal.data.id, issueModal.data);
        showSuccessMsg('Incident ticket updated.');
      }
      setIssueModal({ open: false, mode: 'create', data: null });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save issue.');
    }
  };

  const handleResolveIssue = async (id: number) => {
    try {
      await api.issues.update(id, { status: 'Resolved', resolution_notes: 'Inspected and certified by maintenance team.' });
      showSuccessMsg(`Issue #${id} resolved.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve issue.');
    }
  };

  const handleDeleteIssue = async (id: number) => {
    if (!window.confirm(`Delete issue ticket #${id}?`)) return;
    try {
      await api.issues.delete(id);
      showSuccessMsg(`Issue ticket #${id} deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue.');
    }
  };

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
            Real-time tracking and full CRUD control over Warehouses, Drayage Fleet, Gate Passes, Customs Inspections, Billing Invoices, and Fault Tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 6 Summary Metric Cards (Interactive Tab Indexing) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => handleTabChange('warehouses')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'warehouses'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Warehouse className="h-4 w-4 text-blue-600" />
            <span>4. Warehouses</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {warehouses.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">CFS & Reefer</p>
        </div>

        <div
          onClick={() => handleTabChange('trucks')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'trucks'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Truck className="h-4 w-4 text-indigo-600" />
            <span>7. Trucks</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {trucks.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Drayage Fleet</p>
        </div>

        <div
          onClick={() => handleTabChange('gate-passes')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'gate-passes'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Ticket className="h-4 w-4 text-emerald-600" />
            <span>8. Gate Passes</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {gatePasses.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Security Lanes</p>
        </div>

        <div
          onClick={() => handleTabChange('customs')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'customs'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>9. Customs</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {customs.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Scans & Tariffs</p>
        </div>

        <div
          onClick={() => handleTabChange('bills')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'bills'
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <CreditCard className="h-4 w-4 text-cyan-600" />
            <span>10. Invoices</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {bills.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Docking & Cranes</p>
        </div>

        <div
          onClick={() => handleTabChange('issues')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'issues'
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>11. Issues</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
            {issues.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fault Tickets</p>
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

      {/* Interactive Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="warehouses">4. Warehouses</TabsTrigger>
          <TabsTrigger value="trucks">7. Trucks</TabsTrigger>
          <TabsTrigger value="gate-passes">8. Gate Passes</TabsTrigger>
          <TabsTrigger value="customs">9. Customs</TabsTrigger>
          <TabsTrigger value="bills">10. Invoices</TabsTrigger>
          <TabsTrigger value="issues">11. Fault Tickets</TabsTrigger>
        </TabsList>

        {/* 1. Warehouses Tab (Table 4) */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  Table 4: Warehouses & Storage Facilities
                </CardTitle>
                <CardDescription>
                  CFS Dry Storage, Reefer Cold Chain, Dangerous Goods, and Inspection Sheds.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setWarehouseModal({ open: true, mode: 'create', data: { code: '', name: '', zone_type: 'Dry_Storage', capacity_teu: 250, temperature_celsius: '' } })}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Facility
              </Button>
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
                        <th className="p-3">Facility Code</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Zone Type</th>
                        <th className="p-3">Capacity</th>
                        <th className="p-3">Climate Control</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWarehouses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No warehouses found.
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
                                    <span className="font-mono">{w.current_occupancy_teu || 0} / {w.capacity_teu} TEU</span>
                                    <span className="font-semibold text-muted-foreground">{pct}%</span>
                                  </div>
                                  <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
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
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  {w.status || 'Active'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWarehouseModal({ open: true, mode: 'edit', data: { ...w } })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => handleDeleteWarehouse(w.id, w.code)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
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

        {/* 2. Trucks Tab (Table 7) */}
        <TabsContent value="trucks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-600" />
                  Table 7: Ground Logistics Drayage Fleet
                </CardTitle>
                <CardDescription>
                  Registered transport carriers, assigned payloads, and driver gate dispatching.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setTruckModal({ open: true, mode: 'create', data: { license_plate: '', driver_name: '', driver_phone: '', transport_company: '', max_payload_tons: 32, status: 'Idle' } })}>
                <Plus className="mr-1.5 h-4 w-4" /> Register Truck
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">License Plate</th>
                        <th className="p-3">Driver Name</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Haulage Carrier</th>
                        <th className="p-3">Payload</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
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
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setTruckModal({ open: true, mode: 'edit', data: { ...t } })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => handleDeleteTruck(t.id, t.license_plate)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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

        {/* 3. Gate Passes Tab (Table 8) */}
        <TabsContent value="gate-passes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-emerald-600" />
                  Table 8: Gate Passes & Terminal Access Control
                </CardTitle>
                <CardDescription>
                  Lane access control, physical security logging, and check-in / check-out timestamps.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setGatePassModal({ open: true, data: { gate_lane: 'Gate-In-Lane-1', pass_type: 'Inbound_Delivery', truck_id: 1, status: 'Checked_In' } })}>
                <Plus className="mr-1.5 h-4 w-4" /> Issue Gate Pass
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
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
                        <th className="p-3">Check-In</th>
                        <th className="p-3">Check-Out</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredGatePasses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No gate passes found.
                          </td>
                        </tr>
                      ) : (
                        filteredGatePasses.map((g: any) => (
                          <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{g.pass_number}</td>
                            <td className="p-3 font-medium text-foreground">{g.gate_lane}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800">
                                {g.pass_type?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground font-mono">
                              {g.check_in_time ? new Date(g.check_in_time).toLocaleTimeString() : '—'}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground font-mono">
                              {g.check_out_time ? new Date(g.check_out_time).toLocaleTimeString() : '—'}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                g.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                              }`}>
                                {g.status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {g.status !== 'Completed' && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCheckoutGatePass(g.id)}>
                                    <Check className="mr-1 h-3 w-3" /> Check Out
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => handleDeleteGatePass(g.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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

        {/* 4. Customs Inspections Tab (Table 9) */}
        <TabsContent value="customs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  Table 9: Customs Compliance & Regulatory Inspections
                </CardTitle>
                <CardDescription>
                  X-Ray scans, physical container holds, and regulatory tariff assessments.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCustomsModal({ open: true, mode: 'create', data: { declaration_number: '', inspection_type: 'X-Ray_Scan', duty_amount_dollars: 450, findings: '', status: 'Under_Review' } })}>
                <Plus className="mr-1.5 h-4 w-4" /> New Inspection
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Inspection ID</th>
                        <th className="p-3">Declaration</th>
                        <th className="p-3">Inspection Type</th>
                        <th className="p-3">Duty Tariff</th>
                        <th className="p-3">Findings</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCustoms.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
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
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {c.status !== 'Cleared' && (
                                    <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-300" onClick={() => handleClearCustoms(c.id)}>
                                      <Check className="mr-1 h-3 w-3" /> Clear
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCustomsModal({ open: true, mode: 'edit', data: { ...c, duty_amount_dollars: Number(c.duty_amount_cents || 0) / 100 } })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => handleDeleteCustoms(c.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
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

        {/* 5. Bills & Invoices Tab (Table 10) */}
        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cyan-600" />
                  Table 10: Automated Billing Engine & Invoices
                </CardTitle>
                <CardDescription>
                  Invoices auto-generated on operation completion, plus manual billing for marine docking, cranes, and storage.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setBillModal({ open: true, data: { customer_name: '', docking_fee: 1250, crane_usage_fee: 850, storage_fee: 350 } })}>
                <Plus className="mr-1.5 h-4 w-4" /> Generate Invoice
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
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
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-muted-foreground">
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
                            <td className="p-3 text-right">
                              {b.payment_status !== 'Paid' ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300" onClick={() => handlePayBill(b.id)}>
                                  <Check className="mr-1 h-3 w-3" /> Mark Paid
                                </Button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                                </span>
                              )}
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

        {/* 6. Issues & Breakdown Tickets Tab (Table 11) */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Table 11: Mechanical Incidents & Breakdown Alerts
                </CardTitle>
                <CardDescription>
                  STS Quay Crane malfunctions, berth maintenance tickets, and equipment telemetry warnings.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIssueModal({ open: true, mode: 'create', data: { title: '', description: '', severity: 'Medium', status: 'Open' } })}>
                <Plus className="mr-1.5 h-4 w-4" /> Report Incident
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Title & Issue</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Logged</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No active incident tickets found.
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((iss: any) => (
                          <tr key={iss.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-rose-600 dark:text-rose-400">{iss.ticket_number}</td>
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{iss.title}</div>
                              <div className="text-xs text-muted-foreground max-w-sm truncate">{iss.description}</div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                iss.severity === 'Critical' || iss.severity === 'High'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {iss.severity}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                iss.status === 'Resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}>
                                {iss.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground font-mono">
                              {iss.created_at ? new Date(iss.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {iss.status !== 'Resolved' && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-300" onClick={() => handleResolveIssue(iss.id)}>
                                    <Check className="mr-1 h-3 w-3" /> Resolve
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIssueModal({ open: true, mode: 'edit', data: { ...iss } })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600" onClick={() => handleDeleteIssue(iss.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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
      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL DIALOGS FOR ALL CRUD ACTIONS */}
      {/* ========================================================================= */}

      {/* Warehouse Modal */}
      <Dialog open={warehouseModal.open} onOpenChange={open => setWarehouseModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleSaveWarehouse}>
            <DialogHeader>
              <DialogTitle>{warehouseModal.mode === 'create' ? 'Add Warehouse Facility' : 'Edit Warehouse'}</DialogTitle>
              <DialogDescription>Configure dry yard storage, CFS sheds, or cold chain reefers.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Facility Code</label>
                <Input
                  required
                  placeholder="WH-CFS-05"
                  value={warehouseModal.data?.code || ''}
                  onChange={e => setWarehouseModal(prev => ({ ...prev, data: { ...prev.data, code: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Facility Name</label>
                <Input
                  required
                  placeholder="Container Freight Station 05"
                  value={warehouseModal.data?.name || ''}
                  onChange={e => setWarehouseModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Zone Type</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={warehouseModal.data?.zone_type || 'Dry_Storage'}
                  onChange={e => setWarehouseModal(prev => ({ ...prev, data: { ...prev.data, zone_type: e.target.value } }))}
                >
                  <option value="Dry_Storage">Dry Storage Yard</option>
                  <option value="Reefer_Cold_Storage">Reefer Cold Chain Unit</option>
                  <option value="Dangerous_Goods">Dangerous Goods (Hazmat)</option>
                  <option value="Inspection_Shed">Customs Inspection Shed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Capacity (TEU)</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={warehouseModal.data?.capacity_teu || ''}
                  onChange={e => setWarehouseModal(prev => ({ ...prev, data: { ...prev.data, capacity_teu: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Climate (°C, optional)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. -18.5"
                  value={warehouseModal.data?.temperature_celsius ?? ''}
                  onChange={e => setWarehouseModal(prev => ({ ...prev, data: { ...prev.data, temperature_celsius: e.target.value === '' ? null : Number(e.target.value) } }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWarehouseModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Save Facility</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Truck Modal */}
      <Dialog open={truckModal.open} onOpenChange={open => setTruckModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleSaveTruck}>
            <DialogHeader>
              <DialogTitle>{truckModal.mode === 'create' ? 'Register Drayage Truck' : 'Edit Truck Info'}</DialogTitle>
              <DialogDescription>Commercial transport vehicle registered for terminal yard access.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">License Plate</label>
                <Input
                  required
                  placeholder="TRK-9825"
                  value={truckModal.data?.license_plate || ''}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, license_plate: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Driver Name</label>
                <Input
                  required
                  placeholder="Carlos Ruiz"
                  value={truckModal.data?.driver_name || ''}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, driver_name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Driver Phone</label>
                <Input
                  placeholder="+1-555-0144"
                  value={truckModal.data?.driver_phone || ''}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, driver_phone: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Transport Company</label>
                <Input
                  placeholder="Pacific Haulage Ltd"
                  value={truckModal.data?.transport_company || ''}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, transport_company: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Max Payload (Tons)</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="32.5"
                  value={truckModal.data?.max_payload_tons || ''}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, max_payload_tons: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={truckModal.data?.status || 'Idle'}
                  onChange={e => setTruckModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value } }))}
                >
                  <option value="Idle">Idle</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Loading">Loading</option>
                  <option value="Checked In">Checked In</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTruckModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Save Truck</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gate Pass Modal */}
      <Dialog open={gatePassModal.open} onOpenChange={open => setGatePassModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleSaveGatePass}>
            <DialogHeader>
              <DialogTitle>Issue Security Gate Pass</DialogTitle>
              <DialogDescription>Create a terminal entry or exit authorization for a drayage truck.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Gate Lane</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={gatePassModal.data?.gate_lane || 'Gate-In-Lane-1'}
                  onChange={e => setGatePassModal(prev => ({ ...prev, data: { ...prev.data, gate_lane: e.target.value } }))}
                >
                  <option value="Gate-In-Lane-1">Gate In — Lane 1 (Heavy Freight)</option>
                  <option value="Gate-In-Lane-2">Gate In — Lane 2 (Standard)</option>
                  <option value="Gate-Out-Lane-1">Gate Out — Lane 1</option>
                  <option value="Gate-Out-Lane-2">Gate Out — Lane 2 (Express)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Pass Type</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={gatePassModal.data?.pass_type || 'Inbound_Delivery'}
                  onChange={e => setGatePassModal(prev => ({ ...prev, data: { ...prev.data, pass_type: e.target.value } }))}
                >
                  <option value="Inbound_Delivery">Inbound Delivery (Discharge Drop)</option>
                  <option value="Outbound_Dispatch">Outbound Dispatch (Gate Pick)</option>
                  <option value="Empty_Return">Empty Container Return</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGatePassModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Authorize Pass</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customs Modal */}
      <Dialog open={customsModal.open} onOpenChange={open => setCustomsModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleSaveCustoms}>
            <DialogHeader>
              <DialogTitle>{customsModal.mode === 'create' ? 'New Customs Inspection' : 'Update Customs Assessment'}</DialogTitle>
              <DialogDescription>Regulatory cargo inspection and duty tariff calculation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Declaration Number</label>
                <Input
                  required
                  placeholder="DEC-2026-995"
                  value={customsModal.data?.declaration_number || ''}
                  onChange={e => setCustomsModal(prev => ({ ...prev, data: { ...prev.data, declaration_number: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Inspection Type</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={customsModal.data?.inspection_type || 'X-Ray_Scan'}
                  onChange={e => setCustomsModal(prev => ({ ...prev, data: { ...prev.data, inspection_type: e.target.value } }))}
                >
                  <option value="X-Ray_Scan">X-Ray Gantry Scan</option>
                  <option value="Physical_Inspection">Physical Container Examination</option>
                  <option value="Document_Verification">Manifest & Tariff Audit</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Assessed Duty ($ USD)</label>
                <Input
                  type="number"
                  step="10"
                  placeholder="450"
                  value={customsModal.data?.duty_amount_dollars || ''}
                  onChange={e => setCustomsModal(prev => ({ ...prev, data: { ...prev.data, duty_amount_dollars: Number(e.target.value) } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Findings & Notes</label>
                <Input
                  placeholder="Seal verified intact. No contraband."
                  value={customsModal.data?.findings || ''}
                  onChange={e => setCustomsModal(prev => ({ ...prev, data: { ...prev.data, findings: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={customsModal.data?.status || 'Under_Review'}
                  onChange={e => setCustomsModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value } }))}
                >
                  <option value="Under_Review">Under Review</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Hold">Customs Hold</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustomsModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Save Assessment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bill Invoice Modal */}
      <Dialog open={billModal.open} onOpenChange={open => setBillModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleGenerateBill}>
            <DialogHeader>
              <DialogTitle>Generate Port Tariff Invoice</DialogTitle>
              <DialogDescription>Itemize marine vessel docking duration, crane hours, and yard storage.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Customer / Shipping Line</label>
                <Input
                  required
                  placeholder="Maersk Line Global"
                  value={billModal.data?.customer_name || ''}
                  onChange={e => setBillModal(prev => ({ ...prev, data: { ...prev.data, customer_name: e.target.value } }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Docking Fee ($)</label>
                  <Input
                    type="number"
                    value={billModal.data?.docking_fee || 0}
                    onChange={e => setBillModal(prev => ({ ...prev, data: { ...prev.data, docking_fee: Number(e.target.value) } }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Crane Fee ($)</label>
                  <Input
                    type="number"
                    value={billModal.data?.crane_usage_fee || 0}
                    onChange={e => setBillModal(prev => ({ ...prev, data: { ...prev.data, crane_usage_fee: Number(e.target.value) } }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Storage Fee ($)</label>
                  <Input
                    type="number"
                    value={billModal.data?.storage_fee || 0}
                    onChange={e => setBillModal(prev => ({ ...prev, data: { ...prev.data, storage_fee: Number(e.target.value) } }))}
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm flex justify-between font-bold">
                <span>Total Amount:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  ${((Number(billModal.data?.docking_fee) || 0) + (Number(billModal.data?.crane_usage_fee) || 0) + (Number(billModal.data?.storage_fee) || 0)).toFixed(2)} USD
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBillModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Issue Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Modal */}
      <Dialog open={issueModal.open} onOpenChange={open => setIssueModal(prev => ({ ...prev, open }))}>
        <DialogContent>
          <form onSubmit={handleSaveIssue}>
            <DialogHeader>
              <DialogTitle>{issueModal.mode === 'create' ? 'Report Incident / Fault Ticket' : 'Update Incident Ticket'}</DialogTitle>
              <DialogDescription>Submit hardware breakdown or operational alert to maintenance engineering.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Incident Title</label>
                <Input
                  required
                  placeholder="STS Crane 02 Hoist Sensor Warning"
                  value={issueModal.data?.title || ''}
                  onChange={e => setIssueModal(prev => ({ ...prev, data: { ...prev.data, title: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Description & Symptoms</label>
                <Input
                  required
                  placeholder="Spreader encoder jitter detected during load cycle."
                  value={issueModal.data?.description || ''}
                  onChange={e => setIssueModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Severity Level</label>
                <select
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={issueModal.data?.severity || 'Medium'}
                  onChange={e => setIssueModal(prev => ({ ...prev, data: { ...prev.data, severity: e.target.value } }))}
                >
                  <option value="Low">Low — Routine Non-blocking Maintenance</option>
                  <option value="Medium">Medium — Operational Delay Risk</option>
                  <option value="High">High — Single Equipment Offline</option>
                  <option value="Critical">Critical — Berth or Quay Stoppage</option>
                </select>
              </div>
              {issueModal.mode === 'edit' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <select
                      className="w-full p-2 border rounded-md text-sm bg-background"
                      value={issueModal.data?.status || 'Open'}
                      onChange={e => setIssueModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value } }))}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Resolution Notes</label>
                    <Input
                      placeholder="Maintenance engineer inspection notes..."
                      value={issueModal.data?.resolution_notes || ''}
                      onChange={e => setIssueModal(prev => ({ ...prev, data: { ...prev.data, resolution_notes: e.target.value } }))}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIssueModal(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit">Save Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
