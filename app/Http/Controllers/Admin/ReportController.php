<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesExport;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['cashier', 'items.product'])
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->cashier_id, fn($q) => $q->where('user_id', $request->cashier_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest();

        return Inertia::render('Admin/Reports/Index', [
            'sales' => $query->paginate(20)->withQueryString(),
            'cashiers' => User::where('role', 'cashier')->get(),
            'filters' => $request->only(['date_from', 'date_to', 'cashier_id', 'status']),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $sales = Sale::with(['cashier', 'items.product'])
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->cashier_id, fn($q) => $q->where('user_id', $request->cashier_id))
            ->latest()
            ->get();

        $pdf = Pdf::loadView('reports.sales_pdf', compact('sales'));
        return $pdf->download('sales_report_' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        // This requires an Export class which we'll define next
        return Excel::download(new SalesExport($request->all()), 'sales_report_' . now()->format('Y-m-d') . '.xlsx');
    }
}
