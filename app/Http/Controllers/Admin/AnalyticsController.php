<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $range     = $request->input('range', 7);
        $startDate = Carbon::now()->subDays((int) $range);
        $today     = Carbon::today();

        $branches = Branch::orderBy('name')->get();

        // ─── Global Stats (aggregate over all branches) ───────────────────────
        $stats = [
            'total_revenue'   => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('total'),
            'total_profit'    => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('profit'),
            'total_orders'    => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->count(),
            'low_stock_items' => Ingredient::whereColumn('stock', '<=', 'low_stock_level')->count(),
        ];

        // ─── Per-Branch Stats (for the split dashboard view) ─────────────────
        $branchStats = $branches->map(function (Branch $branch) use ($startDate, $today) {
            $salesQuery = Sale::where('branch_id', $branch->id)->where('status', 'completed');

            $lowStockIngredients = Ingredient::where('branch_id', $branch->id)
                ->whereColumn('stock', '<=', 'low_stock_level')
                ->get(['name', 'stock', 'unit', 'low_stock_level']);

            return [
                'id'                   => $branch->id,
                'name'                 => $branch->name,
                'total_revenue'        => (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('total'),
                'total_profit'         => (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('profit'),
                'total_orders'         => (clone $salesQuery)->where('created_at', '>=', $startDate)->count(),
                'orders_today'         => (clone $salesQuery)->whereDate('created_at', $today)->count(),
                'revenue_today'        => (float) (clone $salesQuery)->whereDate('created_at', $today)->sum('total'),
                'inventory_count'      => Ingredient::where('branch_id', $branch->id)->count(),
                'low_stock_count'      => $lowStockIngredients->count(),
                'low_stock_ingredients'=> $lowStockIngredients,
            ];
        });

        // ─── Line Chart: Sales over time ──────────────────────────────────────
        $salesOverTime = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(profit) as profit'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // ─── Bar Chart: Top 10 selling products ───────────────────────────────
        $salesPerProduct = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $startDate)
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get();

        // ─── Pie Chart: Sales by payment method ───────────────────────────────
        $salesByPaymentMethod = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('payment_method')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats'                => $stats,
            'branchStats'          => $branchStats,
            'salesOverTime'        => $salesOverTime,
            'salesPerProduct'      => $salesPerProduct,
            'salesByPaymentMethod' => $salesByPaymentMethod,
            'range'                => (int) $range,
        ]);
    }
}
