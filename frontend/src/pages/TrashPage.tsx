import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAutoDismiss } from '@/hooks/use-auto-dismiss';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trash2, RotateCcw, AlertCircle, CheckCircle2,
  RefreshCw, Ship, Boxes, Truck, Settings,
  AlertTriangle, Filter, Search
} from 'lucide-react';

interface TrashedItem {
  id: number;
  _collection: 'operations' | 'ships' | 'Cargos' | 'Equipments';
  label: string;
  ship_name?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  deleted_at: string;
  deleted_by?: string;
}

export function TrashPage() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoDismiss(6000);
  const [success, setSuccess] = useAutoDismiss(5000);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.trash.list();
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load trash items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrash();
  }, [loadTrash]);

  // 1-Click Restore Action
  const handleRestore = async (collection: string, id: number, label: string) => {
    setActionBusy(true);
    setError('');
    try {
      await api.trash.restore(collection, id);
      setSuccess(`Successfully restored "${label}" to active operations.`);
      setItems(prev => prev.filter(item => !(item._collection === collection && item.id === id)));
    } catch (err: any) {
      setError(err.message || 'Failed to restore record.');
    } finally {
      setActionBusy(false);
    }
  };

  // Permanent Delete Action
  const handlePermanentDelete = async (collection: string, id: number, label: string) => {
    if (!window.confirm(`Permanently delete "${label}"? This cannot be undone.`)) return;

    setActionBusy(true);
    setError('');
    try {
      await api.trash.permanentDelete(collection, id);
      setSuccess(`Permanently purged "${label}".`);
      setItems(prev => prev.filter(item => !(item._collection === collection && item.id === id)));
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete record.');
    } finally {
      setActionBusy(false);
    }
  };

  // Empty All Trash
  const handleEmptyTrash = async () => {
    setActionBusy(true);
    setError('');
    try {
      const res = await api.trash.empty();
      setSuccess(res.message || 'Trash emptied successfully.');
      setItems([]);
      setConfirmEmpty(false);
    } catch (err: any) {
      setError(err.message || 'Failed to empty trash.');
    } finally {
      setActionBusy(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesType = filterType === 'all' || item._collection.toLowerCase() === filterType.toLowerCase();
      const matchesSearch = !search.trim() ||
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        (item.ship_name && item.ship_name.toLowerCase().includes(search.toLowerCase())) ||
        (item.deleted_by && item.deleted_by.toLowerCase().includes(search.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [items, filterType, search]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      operations: items.filter(i => i._collection === 'operations').length,
      ships: items.filter(i => i._collection === 'ships').length,
      cargos: items.filter(i => i._collection === 'Cargos').length,
      equipments: items.filter(i => i._collection === 'Equipments').length,
    };
  }, [items]);

  const getCollectionBadge = (collection: string) => {
    switch (collection) {
      case 'operations':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Settings className="w-3.5 h-3.5" /> Operation
          </span>
        );
      case 'ships':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Ship className="w-3.5 h-3.5" /> Ship
          </span>
        );
      case 'Cargos':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Boxes className="w-3.5 h-3.5" /> Cargo
          </span>
        );
      case 'Equipments':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Truck className="w-3.5 h-3.5" /> Equipment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {collection}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-[1400px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Recovery Bin</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Restore soft-deleted records or permanently purge terminal data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadTrash()}
            disabled={loading}
            className="shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {items.length > 0 && !confirmEmpty && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmEmpty(true)}
              className="shadow-sm font-semibold"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Empty Trash ({items.length})
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Empty Trash */}
      {confirmEmpty && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:bg-red-950/20 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Empty entire Recovery Bin?</h4>
              <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">
                This will permanently delete all {items.length} soft-deleted records from the database. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmEmpty(false)} disabled={actionBusy} className="bg-white hover:bg-slate-50 text-slate-700 dark:bg-transparent dark:text-slate-300">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleEmptyTrash} disabled={actionBusy} className="font-bold">
              {actionBusy ? 'Purging...' : 'Yes, Empty All'}
            </Button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 shadow-sm transition-all">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300 shadow-sm transition-all">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'operations', label: 'Operations', count: counts.operations },
              { id: 'ships', label: 'Ships', count: counts.ships },
              { id: 'cargos', label: 'Cargo', count: counts.cargos },
              { id: 'equipments', label: 'Equipment', count: counts.equipments },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label} <span className="ml-1.5 opacity-60 text-xs">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search records by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/20 px-6 py-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              Deleted Records ({filteredItems.length})
            </CardTitle>
            <CardDescription className="text-sm">
              Restoring an item will immediately return it to terminal workflows.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-400" />
              <p className="text-sm font-medium">Loading recovery bin...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trash is empty</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {search ? 'No items match your active search filters.' : 'All terminal records are active and accounted for.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                    <TableHead className="w-[140px] pl-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Record Name / ID</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold hidden sm:table-cell">Details</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold hidden md:table-cell">Deleted Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold hidden lg:table-cell">Deleted By</TableHead>
                    <TableHead className="text-right pr-6 text-xs uppercase tracking-wider text-slate-500 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={`${item._collection}-${item.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-800">
                      <TableCell className="pl-6 py-3">{getCollectionBadge(item._collection)}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 hidden sm:table-cell">
                        {item.ship_name || item.status || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                        {new Date(item.deleted_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 hidden lg:table-cell font-mono">
                        {item.deleted_by || item.created_by || 'system'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(item._collection, item.id, item.label)}
                            disabled={actionBusy}
                            className="h-8 gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePermanentDelete(item._collection, item.id, item.label)}
                            disabled={actionBusy}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
