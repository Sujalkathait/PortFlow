import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Receipt, CreditCard, Plus, Search, RefreshCw, Check, CheckCircle2,
    Clock, AlertCircle, Trash2, Pencil, Printer, Download,
    DollarSign, TrendingUp, Copy, X
} from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface BillItem {
    id: number;
    invoice_number: string;
    customer_name: string;
    ship_name?: string;
    docking_fee: number;
    crane_usage_fee: number;
    storage_fee: number;
    total_amount: number;
    currency: string;
    payment_status: 'Paid' | 'Pending' | 'Draft' | string;
    created_at: string;
    due_date?: string;
    paid_at?: string;
    operation_id?: number;
    ship_id?: number;
    cargo_id?: number;
}

export function TransactionsPage() {
    const [bills, setBills] = useState<BillItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search, Filter & Sort states
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);

    // Form states for Create/Edit
    const [formData, setFormData] = useState({
        customer_name: '',
        ship_name: '',
        docking_fee: 1250,
        crane_usage_fee: 850,
        storage_fee: 350,
        currency: 'USD',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        payment_status: 'Pending',
    });

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 4000);
    };

    const loadBills = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.bills.list();
            setBills(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Failed to retrieve billing transactions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBills();
    }, [loadBills]);

    // Copy invoice number to clipboard
    const handleCopy = (invoiceNum: string) => {
        navigator.clipboard.writeText(invoiceNum);
        setCopiedId(invoiceNum);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Mark as Paid
    const handleMarkAsPaid = async (id: number) => {
        try {
            await api.bills.pay(id);
            showSuccess(`Invoice #${id} settled and marked as Paid.`);
            await loadBills();
            if (selectedBill && selectedBill.id === id) {
                setSelectedBill(prev => prev ? { ...prev, payment_status: 'Paid', paid_at: new Date().toISOString() } : null);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to settle invoice.');
        }
    };

    // Delete Invoice
    const handleDelete = async (id: number, invoiceNum: string) => {
        if (!window.confirm(`Are you sure you want to cancel and delete invoice ${invoiceNum}?`)) return;
        try {
            await api.bills.delete(id);
            showSuccess(`Invoice ${invoiceNum} removed.`);
            await loadBills();
            if (receiptModalOpen && selectedBill?.id === id) {
                setReceiptModalOpen(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete invoice.');
        }
    };

    // Save New Invoice
    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.customer_name.trim()) {
                setError('Customer / Shipping Line name is required.');
                return;
            }
            await api.bills.generate({
                customer_name: formData.customer_name.trim(),
                docking_fee: Number(formData.docking_fee) || 0,
                crane_usage_fee: Number(formData.crane_usage_fee) || 0,
                storage_fee: Number(formData.storage_fee) || 0,
                currency: formData.currency,
                due_date: formData.due_date,
            });
            showSuccess(`Invoice issued for ${formData.customer_name}.`);
            setCreateModalOpen(false);
            setFormData({
                customer_name: '',
                ship_name: '',
                docking_fee: 1250,
                crane_usage_fee: 850,
                storage_fee: 350,
                currency: 'USD',
                due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                payment_status: 'Pending',
            });
            await loadBills();
        } catch (err: any) {
            setError(err.message || 'Failed to issue new invoice.');
        }
    };

    // Save Edited Invoice
    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBill) return;
        try {
            await api.bills.update(selectedBill.id, {
                customer_name: formData.customer_name.trim(),
                docking_fee: Number(formData.docking_fee) || 0,
                crane_usage_fee: Number(formData.crane_usage_fee) || 0,
                storage_fee: Number(formData.storage_fee) || 0,
                currency: formData.currency,
                due_date: formData.due_date,
                payment_status: formData.payment_status,
            });
            showSuccess(`Invoice ${selectedBill.invoice_number} updated.`);
            setEditModalOpen(false);
            await loadBills();
        } catch (err: any) {
            setError(err.message || 'Failed to update invoice.');
        }
    };

    // Open Edit Modal
    const openEdit = (bill: BillItem) => {
        setSelectedBill(bill);
        setFormData({
            customer_name: bill.customer_name || '',
            ship_name: bill.ship_name || '',
            docking_fee: Number(bill.docking_fee) || 0,
            crane_usage_fee: Number(bill.crane_usage_fee) || 0,
            storage_fee: Number(bill.storage_fee) || 0,
            currency: bill.currency || 'USD',
            due_date: bill.due_date ? new Date(bill.due_date).toISOString().split('T')[0] : '',
            payment_status: bill.payment_status || 'Pending',
        });
        setEditModalOpen(true);
    };

    // Open Receipt Modal
    const openReceipt = (bill: BillItem) => {
        setSelectedBill(bill);
        setReceiptModalOpen(true);
    };

    // Export CSV
    const handleExportCSV = () => {
        if (bills.length === 0) return;
        const headers = ['Invoice Number', 'Client', 'Docking Fee', 'Crane Fee', 'Storage Fee', 'Total Amount', 'Currency', 'Status', 'Issued Date', 'Due Date'];
        const rows = bills.map(b => [
            b.invoice_number,
            `"${(b.customer_name || '').replace(/"/g, '""')}"`,
            b.docking_fee || 0,
            b.crane_usage_fee || 0,
            b.storage_fee || 0,
            b.total_amount || 0,
            b.currency || 'USD',
            b.payment_status,
            b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '',
            b.due_date ? new Date(b.due_date).toISOString().split('T')[0] : '',
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `portflow-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Transactions exported to CSV.');
    };

    // Derived Statistics
    const totalCollected = useMemo(() => {
        return bills
            .filter(b => b.payment_status === 'Paid')
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    }, [bills]);

    const totalReceivables = useMemo(() => {
        return bills
            .filter(b => b.payment_status !== 'Paid')
            .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    }, [bills]);

    const settlementRate = useMemo(() => {
        if (bills.length === 0) return 0;
        const paidCount = bills.filter(b => b.payment_status === 'Paid').length;
        return Math.round((paidCount / bills.length) * 100);
    }, [bills]);

    const avgInvoiceAmount = useMemo(() => {
        if (bills.length === 0) return 0;
        const total = bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
        return Math.round(total / bills.length);
    }, [bills]);

    // Filter & Sort
    const filteredBills = useMemo(() => {
        return bills.filter(b => {
            const matchesSearch =
                (b.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (b.ship_name || '').toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'PAID') return b.payment_status === 'Paid';
            if (statusFilter === 'PENDING') return b.payment_status !== 'Paid';
            return true;
        }).sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            if (sortBy === 'oldest') {
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            }
            if (sortBy === 'amount-high') {
                return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
            }
            if (sortBy === 'amount-low') {
                return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
            }
            return 0;
        });
    }, [bills, search, statusFilter, sortBy]);

    const currentTotalCalculated = (Number(formData.docking_fee) || 0) + (Number(formData.crane_usage_fee) || 0) + (Number(formData.storage_fee) || 0);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        Transactions & Invoices
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Comprehensive ledger of vessel docking fees, crane handling tariffs, container storage, and payment settlements.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadBills()}
                        disabled={loading}
                        className="h-9 text-xs font-medium"
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={bills.length === 0}
                        className="h-9 text-xs font-medium"
                    >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setCreateModalOpen(true)}
                        className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        New Invoice
                    </Button>
                </div>
            </div>

            {/* Notification Messages */}
            {error && (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            {success && (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{success}</span>
                    </div>
                    <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* 4 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Collected Revenue */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Collected</span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2">
                        ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Settled & paid port invoices
                    </div>
                </div>

                {/* 2. Outstanding Receivables */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Receivables</span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-2">
                        ${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Awaiting carrier settlement
                    </div>
                </div>

                {/* 3. Settlement Rate */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Settlement Rate</span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                        {settlementRate}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {bills.filter(b => b.payment_status === 'Paid').length} of {bills.length} invoices cleared
                    </div>
                </div>

                {/* 4. Average Invoice */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Transaction</span>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
                        ${avgInvoiceAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Mean fee per calling vessel
                    </div>
                </div>
            </div>

            {/* Filter and Control Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search invoice number, client line, vessel..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-8 text-xs h-9 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs & Sort */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Tabs */}
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800/60 text-xs">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-md font-semibold transition ${
                                statusFilter === 'ALL'
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            All ({bills.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-3 py-1.5 rounded-md font-semibold transition ${
                                statusFilter === 'PENDING'
                                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            Pending ({bills.filter(b => b.payment_status !== 'Paid').length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('PAID')}
                            className={`px-3 py-1.5 rounded-md font-semibold transition ${
                                statusFilter === 'PAID'
                                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            Paid ({bills.filter(b => b.payment_status === 'Paid').length})
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        aria-label="Sort transactions"
                        className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount-high">Amount: High to Low</option>
                        <option value="amount-low">Amount: Low to High</option>
                    </select>
                </div>
            </div>

            {/* Transactions Full Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                            Transaction Ledger
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Showing {filteredBills.length} of {bills.length} recorded invoices
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Invoice #</th>
                                        <th className="py-3 px-4">Client / Shipping Line</th>
                                        <th className="py-3 px-4">Docking Fee</th>
                                        <th className="py-3 px-4">Crane Handling</th>
                                        <th className="py-3 px-4">Storage Fee</th>
                                        <th className="py-3 px-4">Total Amount</th>
                                        <th className="py-3 px-4">Due Date</th>
                                        <th className="py-3 px-4">Payment Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredBills.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400">
                                                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                                                <div className="font-semibold text-sm text-slate-600 dark:text-slate-300">
                                                    No transactions found
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {search ? 'Try clearing your search query.' : 'Generate an invoice to get started.'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBills.map(b => {
                                            const isPaid = b.payment_status === 'Paid';
                                            const isOverdue = !isPaid && b.due_date && new Date(b.due_date).getTime() < Date.now();
                                            const dueDateFormatted = b.due_date
                                                ? new Date(b.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Upon Receipt';

                                            return (
                                                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                                    {/* Invoice Number */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            <span>{b.invoice_number}</span>
                                                            <button
                                                                onClick={() => handleCopy(b.invoice_number)}
                                                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                                                title="Copy Invoice ID"
                                                            >
                                                                {copiedId === b.invoice_number ? (
                                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-3 w-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Client Name */}
                                                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                                                        <div>{b.customer_name}</div>
                                                        {b.ship_name && (
                                                            <div className="text-[11px] text-slate-400 font-normal">
                                                                Vessel: {b.ship_name}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Docking Fee */}
                                                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                                                        ${Number(b.docking_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>

                                                    {/* Crane Handling */}
                                                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                                                        ${Number(b.crane_usage_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>

                                                    {/* Storage Fee */}
                                                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                                                        ${Number(b.storage_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>

                                                    {/* Total Amount */}
                                                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                                                        ${Number(b.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {b.currency || 'USD'}
                                                    </td>

                                                    {/* Due Date */}
                                                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {dueDateFormatted}
                                                    </td>

                                                    {/* Payment Status */}
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                            isPaid
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : isOverdue
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                                        }`}>
                                                            {isPaid ? 'Paid & Settled' : isOverdue ? 'Overdue' : 'Pending'}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {!isPaid && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleMarkAsPaid(b.id)}
                                                                    className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                                                                    title="Settle Invoice"
                                                                >
                                                                    <Check className="mr-1 h-3 w-3" /> Settle
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openReceipt(b)}
                                                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                                title="View Official Receipt"
                                                            >
                                                                <Printer className="mr-1 h-3 w-3" /> Receipt
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openEdit(b)}
                                                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                                                                title="Edit Invoice"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDelete(b.id, b.invoice_number)}
                                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                title="Cancel / Delete Invoice"
                                                            >
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

            {/* Modal 1: Create New Invoice */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Issue Port Tariff Invoice
                        </DialogTitle>
                        <DialogDescription>
                            Create a billing transaction for vessel berthing, STS cranes, and yard storage.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Shipping Line / Client Name *
                            </label>
                            <Input
                                required
                                placeholder="e.g. Maersk Line, COSCO, MSC"
                                value={formData.customer_name}
                                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Docking Fee ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.docking_fee}
                                    onChange={e => setFormData({ ...formData, docking_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Crane Fee ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.crane_usage_fee}
                                    onChange={e => setFormData({ ...formData, crane_usage_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Storage Fee ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.storage_fee}
                                    onChange={e => setFormData({ ...formData, storage_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full mt-1 h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 text-xs"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Payment Due Date
                                </label>
                                <Input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>

                        {/* Calculated Total Bar */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Invoice Amount:</span>
                            <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
                                ${currentTotalCalculated.toFixed(2)} {formData.currency}
                            </span>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                Issue Invoice
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Edit Invoice */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-600" />
                            Update Invoice {selectedBill?.invoice_number}
                        </DialogTitle>
                        <DialogDescription>
                            Adjust billing amounts or payment status for this transaction.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateInvoice} className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Client Name
                            </label>
                            <Input
                                required
                                value={formData.customer_name}
                                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Docking ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.docking_fee}
                                    onChange={e => setFormData({ ...formData, docking_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Crane ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.crane_usage_fee}
                                    onChange={e => setFormData({ ...formData, crane_usage_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Storage ($)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.storage_fee}
                                    onChange={e => setFormData({ ...formData, storage_fee: parseFloat(e.target.value) || 0 })}
                                    className="mt-1 text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Payment Status
                                </label>
                                <select
                                    value={formData.payment_status}
                                    onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                                    className="w-full mt-1 h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-3 text-xs"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Due Date
                                </label>
                                <Input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between border">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Recalculated Total:</span>
                            <span className="text-base font-extrabold font-mono text-blue-600 dark:text-blue-400">
                                ${currentTotalCalculated.toFixed(2)} {formData.currency}
                            </span>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Official Printable Invoice / Receipt Modal */}
            <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
                <DialogContent className="max-w-lg">
                    {selectedBill && (
                        <div className="space-y-4 print:p-0">
                            {/* Receipt Top Header */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <div className="text-lg font-black tracking-tight text-[#0a2540] dark:text-white flex items-center gap-2">
                                        <div className="h-6 w-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                            PF
                                        </div>
                                        PORTFLOW TERMINAL AUTHORITY
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        Marine Logistics & Harbor Operations
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        selectedBill.payment_status === 'Paid'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                            : 'bg-amber-50 text-amber-700 border-amber-300'
                                    }`}>
                                        {selectedBill.payment_status === 'Paid' ? 'PAID & SETTLED' : 'PAYMENT PENDING'}
                                    </span>
                                </div>
                            </div>

                            {/* Metadata Details */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="text-slate-400 uppercase font-semibold text-[10px]">Invoice Number</div>
                                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                                        {selectedBill.invoice_number}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 uppercase font-semibold text-[10px]">Issued Date</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                                        {selectedBill.created_at ? new Date(selectedBill.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 uppercase font-semibold text-[10px]">Billed To (Carrier)</div>
                                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                                        {selectedBill.customer_name}
                                    </div>
                                    {selectedBill.ship_name && (
                                        <div className="text-slate-500 text-[11px]">Vessel: {selectedBill.ship_name}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-slate-400 uppercase font-semibold text-[10px]">Payment Due Date</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                                        {selectedBill.due_date ? new Date(selectedBill.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Due Upon Receipt'}
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Breakdown */}
                            <div className="border rounded-lg overflow-hidden mt-3">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b text-slate-600 dark:text-slate-300">
                                        <tr>
                                            <th className="p-2.5 text-left">Service Item</th>
                                            <th className="p-2.5 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                        <tr>
                                            <td className="p-2.5">Marine Berth Dockage & Pilotage</td>
                                            <td className="p-2.5 text-right">${Number(selectedBill.docking_fee || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5">STS Quay Crane Heavy Lift Handling</td>
                                            <td className="p-2.5 text-right">${Number(selectedBill.crane_usage_fee || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5">Container Yard Demurrage & Storage</td>
                                            <td className="p-2.5 text-right">${Number(selectedBill.storage_fee || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-bold text-sm">
                                            <td className="p-3 text-slate-900 dark:text-white">Total Amount Due ({selectedBill.currency || 'USD'})</td>
                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-extrabold">
                                                ${Number(selectedBill.total_amount || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Settlement timestamp */}
                            {selectedBill.paid_at && (
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Settled on {new Date(selectedBill.paid_at).toLocaleString()}
                                </div>
                            )}

                            <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.print()}
                                    className="text-xs font-semibold"
                                >
                                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                                    Print Receipt
                                </Button>
                                <div className="flex items-center gap-2">
                                    {selectedBill.payment_status !== 'Paid' && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => void handleMarkAsPaid(selectedBill.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                        >
                                            <Check className="mr-1.5 h-3.5 w-3.5" /> Mark Paid
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setReceiptModalOpen(false)}
                                        className="text-xs"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
