import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FiTrendingUp, FiDollarSign, FiShoppingBag, FiAlertTriangle,
    FiCalendar, FiLoader, FiPackage, FiMapPin
} from 'react-icons/fi';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

// ── Branch Stats Card ─────────────────────────────────────────────────────────
function BranchStatCard({ branch, range }: { branch: any; range: number }) {
    const cards = [
        { label: 'Revenue', value: formatCurrency(branch.total_revenue), icon: FiDollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Profit', value: formatCurrency(branch.total_profit), icon: FiTrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Orders', value: branch.total_orders, icon: FiShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Today Orders', value: branch.orders_today, icon: FiCalendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Inventory Items', value: branch.inventory_count, icon: FiPackage, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Low Stock', value: branch.low_stock_count, icon: FiAlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <Card className="border-none shadow-md bg-white/60 backdrop-blur-sm flex-1 min-w-0">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <FiMapPin className="text-primary size-4" />
                    {branch.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    {cards.map((c, i) => (
                        <div key={i} className={cn("flex items-center gap-2 rounded-xl p-3", c.bg)}>
                            <c.icon className={cn("size-4 shrink-0", c.color)} />
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">{c.label}</p>
                                <p className={cn("text-sm font-black", c.color)}>{c.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Low Stock Alerts */}
                {branch.low_stock_ingredients?.length > 0 && (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1">
                        <p className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1">
                            <FiAlertTriangle className="size-3" /> Low Stock Alerts
                        </p>
                        {branch.low_stock_ingredients.map((ing: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-xs font-medium text-amber-800">{ing.name}</span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                    {Number(ing.stock).toLocaleString()} {ing.unit} remaining
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ stats, branchStats, salesOverTime, salesPerProduct, salesByPaymentMethod, range }: any) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRangeChange = (value: string) => {
        setIsLoading(true);
        router.get('/dashboard', { range: value }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const getRangeLabel = (r: number) => {
        if (r === 7) return 'Last 7 Days';
        if (r === 30) return 'Last 30 Days';
        if (r === 365) return 'Last Year';
        return `Last ${r} Days`;
    };

    const statCards = [
        { title: 'Total Revenue',  value: formatCurrency(stats.total_revenue),  icon: FiDollarSign,   color: 'text-blue-600',   bg: 'bg-blue-100'   },
        { title: 'Total Profit',   value: formatCurrency(stats.total_profit),   icon: FiTrendingUp,   color: 'text-green-600',  bg: 'bg-green-100'  },
        { title: 'Total Orders',   value: stats.total_orders,                   icon: FiShoppingBag,  color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Low Stock Items',value: stats.low_stock_items,               icon: FiAlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-100'  },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Admin Dashboard" />

            <div className="p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Real-time overview of all branches.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading && (
                            <div className="flex items-center gap-2 text-primary animate-pulse">
                                <FiLoader className="size-4 animate-spin" />
                                <span className="text-xs font-medium">Updating...</span>
                            </div>
                        )}
                        <Select disabled={isLoading} defaultValue={range.toString()} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-[180px] bg-white/50 backdrop-blur-sm border-none shadow-sm focus:ring-primary h-10 rounded-xl font-medium">
                                <FiCalendar className="size-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="365">Last 365 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Global Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                    <stat.icon className={cn("size-6", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                    <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">{getRangeLabel(range)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Split Branch Dashboard ── */}
                <div>
                    <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                        <FiMapPin className="text-primary size-5" />
                        Branch Performance ({getRangeLabel(range)})
                    </h2>
                    <div className="flex gap-6 flex-col md:flex-row">
                        {branchStats?.map((branch: any) => (
                            <BranchStatCard key={branch.id} branch={branch} range={range} />
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Sales & Profit ({getRangeLabel(range)})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <LineChart data={salesOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => formatCurrency(value)}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Top 10 Selling Products ({getRangeLabel(range)})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <BarChart data={salesPerProduct} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total_sold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Methods + Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1 border-none shadow-md bg-white/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Payment Methods ({getRangeLabel(range)})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <PieChart>
                                        <Pie
                                            data={salesByPaymentMethod}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80} paddingAngle={5}
                                            dataKey="revenue" nameKey="payment_method"
                                        >
                                            {salesByPaymentMethod.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Branch Revenue Today</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Branch</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Orders Today</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Revenue Today</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branchStats?.map((b: any) => (
                                            <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="p-4 font-semibold flex items-center gap-2">
                                                    <FiMapPin className="size-3 text-primary" /> {b.name}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold">{b.orders_today}</td>
                                                <td className="p-4 text-right font-black text-primary">{formatCurrency(b.revenue_today)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
