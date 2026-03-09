import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    FiSearch,
    FiFilter,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiXCircle,
    FiMoreHorizontal,
    FiShoppingCart,
    FiPrinter,
    FiEye
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SaleItem = {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product: {
        name: string;
    };
};

type Sale = {
    id: number;
    order_number: string;
    type: 'dine-in' | 'take-out' | 'delivery';
    total: number;
    paid_amount: number;
    change_amount: number;
    payment_method: string;
    status: 'pending' | 'preparing' | 'completed' | 'cancelled';
    created_at: string;
    items: SaleItem[];
    cashier: {
        name: string;
    };
};

export default function SalesIndex() {
    const { sales: paginatedSales, filters, stats, branches, isAdmin } = usePage().props as any;
    const sales: Sale[] = paginatedSales.data;

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');

    // --- Sync Logic ---
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'sales-updated' || e.data.type === 'inventory-updated') {
                router.reload();
            }
        };
        stateChannel.addEventListener('message', handleMessage);

        const handleFocus = () => {
            router.reload();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            stateChannel.removeEventListener('message', handleMessage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [stateChannel]);

    const handleFilterChange = (value: string) => {
        setStatusFilter(value);
        router.get('/sales', { status: value, search, branch_id: branchFilter !== 'all' ? branchFilter : '' }, { preserveState: true, replace: true });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        router.get('/sales', { status: statusFilter, search: val, branch_id: branchFilter !== 'all' ? branchFilter : '' }, { preserveState: true, replace: true, preserveScroll: true });
    };

    const handleBranchFilter = (value: string) => {
        setBranchFilter(value);
        router.get('/sales', { status: statusFilter, search, branch_id: value !== 'all' ? value : '' }, { preserveState: true, replace: true });
    };

    const updateStatus = (saleId: number, newStatus: string) => {
        router.put(`/sales/${saleId}/status`, { status: newStatus }, {
            preserveScroll: true
        });
    };

    const getStatusBadge = (status: Sale['status']) => {
        const styles = {
            pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            preparing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
            completed: "bg-green-500/10 text-green-600 border-green-500/20",
            cancelled: "bg-destructive/10 text-destructive border-destructive/20"
        };
        return (
            <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", styles[status])}>
                {status}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales & Orders', href: '/sales' }]}>
            <Head title="Sales & Orders" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                {/* Header Bar */}
                <div className="h-16 border-b bg-background/50 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <FiShoppingCart className="text-primary" />
                            Sales & Orders
                        </h1>
                        <div className="flex items-center bg-muted/50 rounded-lg p-1">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >All</button>
                            <button
                                onClick={() => handleFilterChange('pending')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'pending' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >Pending</button>
                            <button
                                onClick={() => handleFilterChange('preparing')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'preparing' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >Preparing</button>
                            <button
                                onClick={() => handleFilterChange('completed')}
                                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statusFilter === 'completed' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >Completed</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Select value={branchFilter} onValueChange={handleBranchFilter}>
                                <SelectTrigger className="w-44 h-9 bg-background/50 border-none ring-1 ring-black/5">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches?.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                            <Input
                                placeholder="Search order ID..."
                                className="pl-9 w-64 h-9 bg-background/50 border-none ring-1 ring-black/5"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <FiFilter className="size-4" /> Filter
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <FiClock className="text-amber-600 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pending Orders</p>
                                    <p className="text-xl font-black">{stats.pending}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <FiAlertCircle className="text-blue-600 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">In Preparation</p>
                                    <p className="text-xl font-black">{stats.preparing}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-500/5 border-green-500/20 shadow-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <FiCheckCircle className="text-green-600 size-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Completed Today</p>
                                    <p className="text-xl font-black">{stats.completed_today}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orders Table */}
                    <Card className="flex-1 overflow-hidden border-none shadow-xl ring-1 ring-black/5 flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b">
                                    <tr className="bg-muted/30">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Info</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Items</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <AnimatePresence mode="popLayout">
                                        {sales.map((sale) => (
                                            <motion.tr
                                                key={sale.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-foreground">#{sale.order_number}</div>
                                                    <div className="text-[11px] text-muted-foreground font-medium uppercase mt-1">
                                                        {format(new Date(sale.created_at), 'MMM dd, HH:mm')} • {sale.cashier.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="capitalize text-[10px]">{sale.type}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(sale.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-medium">
                                                    {sale.items.reduce((sum, i) => sum + i.quantity, 0)} items
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-black text-primary">{formatCurrency(sale.total)}</div>
                                                    <div className="text-[9px] uppercase font-bold text-muted-foreground">{sale.payment_method}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {sale.status === 'pending' && (
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => updateStatus(sale.id, 'preparing')}>
                                                                Prepare
                                                            </Button>
                                                        )}
                                                        {sale.status === 'preparing' && (
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider bg-green-500/5 text-green-600 border-green-500/20 hover:bg-green-500/10" onClick={() => updateStatus(sale.id, 'completed')}>
                                                                Complete
                                                            </Button>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="size-8">
                                                            <FiEye className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Placeholder */}
                        {paginatedSales.total > paginatedSales.per_page && (
                            <div className="p-4 border-t flex justify-between items-center bg-muted/10">
                                <p className="text-xs text-muted-foreground font-medium">Showing {paginatedSales.from} to {paginatedSales.to} of {paginatedSales.total} orders</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!paginatedSales.prev_page_url}
                                        onClick={() => router.get(paginatedSales.prev_page_url)}
                                    >Prev</Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!paginatedSales.next_page_url}
                                        onClick={() => router.get(paginatedSales.next_page_url)}
                                    >Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
