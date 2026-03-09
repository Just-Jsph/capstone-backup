<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use App\Models\PosOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Services\SaleService;
use App\Models\Sale;
use Illuminate\Support\Facades\Auth;

class PosController extends Controller
{
    protected $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index()
    {
        $user     = Auth::user();
        $branchId = $user->branch_id;

        // Load products scoped to the cashier's branch
        $productsQuery = Product::with(['category', 'ingredients']);

if ($branchId) {
    $productsQuery->where(function ($query) use ($branchId) {
        $query->where('branch_id', $branchId)
              ->orWhereNull('branch_id');
    });
}

        $products = $productsQuery->get()->map(function ($product) {
            $product->stock    = $product->computed_stock;
            $product->image_url = $product->image_path
                ? Storage::disk('public')->url($product->image_path)
                : null;
            return $product;
        });

        // Load categories scoped to the cashier's branch
        $categoriesQuery = Category::orderBy('name');
        if ($branchId) {
            $categoriesQuery->where('branch_id', $branchId);
        }

        $categories = $categoriesQuery->get()->map(function ($category) {
            $category->image_url = $category->image_path
                ? Storage::disk('public')->url($category->image_path)
                : null;
            return $category;
        });

        $recentOrders = Sale::with('items.product')
            ->where('user_id', Auth::id())
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Pos/Index', [
            'products'     => $products,
            'categories'   => $categories,
            'recentOrders' => $recentOrders,
            'branch'       => $user->branch,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'          => 'required|string',
            'items'         => 'required|array|min:1',
            'items.*.id'    => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'total'         => 'required|numeric',
            'payment_method'=> 'required|string',
            'paid_amount'   => 'required|numeric',
            'change_amount' => 'nullable|numeric',
        ]);

        try {
            $orderNumber = 'POS-' . strtoupper(uniqid());
            $this->saleService->processSale(array_merge($validated, [
                'order_number' => $orderNumber,
                'status'       => 'completed',
            ]));

            return redirect()->back()->with('success', 'Order processed successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
