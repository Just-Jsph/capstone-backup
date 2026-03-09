<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();
        $status   = $request->input('status', 'all');
        $search   = $request->input('search', '');

        $query = Sale::with(['items.product', 'cashier', 'branch'])
            ->when($status !== 'all', function ($q) use ($status) {
                return $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where('order_number', 'like', "%{$search}%");
            })
            ->latest();

        // Cashier: only their own branch sales
        if ($user->isCashier()) {
            $query->where('branch_id', $user->branch_id);
        } else {
            // Admin: optional branch filter
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
        }

        return Inertia::render('Sales/Index', [
            'sales'    => $query->paginate(15)->withQueryString(),
            'branches' => $branches,
            'filters'  => [
                'status'    => $status,
                'search'    => $search,
                'branch_id' => $request->input('branch_id'),
            ],
            'isAdmin'  => $user->isAdmin(),
            'stats'    => [
                'pending'         => Sale::where('status', 'pending')->count(),
                'preparing'       => Sale::where('status', 'preparing')->count(),
                'completed_today' => Sale::where('status', 'completed')->whereDate('created_at', today())->count(),
            ],
        ]);
    }

    public function updateStatus(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,completed,cancelled',
        ]);

        $sale->update($validated);

        return back()->with('success', "Order #{$sale->order_number} status updated to {$validated['status']}");
    }
}
