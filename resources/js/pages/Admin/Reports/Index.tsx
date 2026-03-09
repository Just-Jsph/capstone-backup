import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiFilter, FiDownload, FiSearch, FiFileText, FiDatabase } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ReportsIndex({ sales, cashiers, filters }: any) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [cashierId, setCashierId] = useState(filters.cashier_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = () => {
        router.get('/reports', {
            date_from: dateFrom,
            date_to: dateTo,
            cashier_id: cashierId === 'all' ? '' : cashierId,
            status: status === 'all' ? '' : status,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setCashierId('all');
        setStatus('all');
        router.get('/reports');
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        const params = new URLSearchParams({
            date_from: dateFrom,
            date_to: dateTo,
            cashier_id: cashierId === 'all' ? '' : cashierId,
            status: status === 'all' ? '' : status,
        }).toString();
        window.open(`/reports/${type}?${params}`, '_blank');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Sales Reports" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
                        <p className="text-muted-foreground">Monitor performance and export detailed sales data.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
                            <FiFileText /> Export PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('excel')} className="gap-2">
                            <FiDatabase /> Export Excel
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date From</label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date To</label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cashier</label>
                                <Select value={cashierId} onValueChange={setCashierId}>
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="All Cashiers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cashiers</SelectItem>
                                        {cashiers.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="preparing">Preparing</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1 h-10 rounded-xl gap-2 font-bold">
                                    <FiFilter className="size-4" /> Filter
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="h-10 rounded-xl px-3">
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Table */}
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Order #</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Cashier</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Revenue</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.data.map((sale: any) => (
                                        <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                            <td className="p-4">
                                                <span className="font-bold text-sm tracking-tight">{sale.order_number}</span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {sale.cashier?.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium">{sale.cashier?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={cn(
                                                    "capitalize",
                                                    sale.status === 'completed' && "bg-green-50 text-green-700 border-green-200",
                                                    sale.status === 'cancelled' && "bg-red-50 text-red-700 border-red-200",
                                                    sale.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
                                                )}>
                                                    {sale.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right font-bold text-sm">
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="p-4 text-right font-bold text-sm text-green-600">
                                                {formatCurrency(sale.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                    {sales.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                                No sales found for the selected criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Placeholder (Inertia handles this usually but we can show simple links) */}
                        <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">Showing {sales.from} to {sales.to} of {sales.total} results</p>
                            <div className="flex gap-1">
                                {sales.links.map((link: any, i: number) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="h-8 min-w-[32px] px-2 text-[10px]"
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


