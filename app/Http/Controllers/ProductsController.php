<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItemIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ProductsController extends Controller
{
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();

        // Determine branch filter
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id');
        } else {
            $branchId = $user->branch_id;
        }

        $query = Product::query()->with(['category', 'ingredients']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('filter_category')) {
            $query->where('category_id', $request->filter_category);
        }

        $products = $query->orderBy('name')->get()->map(function ($product) {
            $product->stock = $product->computed_stock;
            $product->status = $this->getStockStatus($product->stock);
            $product->image_url = $product->image_path
                ? Storage::disk('public')->url($product->image_path)
                : null;
            return $product;
        });

        $summary = [
            'total_products' => $products->count(),
            'low_stock'      => $products->filter(fn($p) => $p->stock > 0 && $p->stock <= 5)->count(),
            'out_of_stock'   => $products->filter(fn($p) => $p->stock <= 0)->count(),
        ];

        // Ingredients scoped to the selected branch for the recipe builder
        $ingredientsQuery = Ingredient::orderBy('name');
        if ($branchId) {
            $ingredientsQuery->where('branch_id', $branchId);
        }

        // Categories scoped to the selected branch
        $categoriesQuery = Category::orderBy('name');
        if ($branchId) {
            $categoriesQuery->where('branch_id', $branchId);
        }

        return Inertia::render('Products/Index', [
            'products'        => $products,
            'categories'      => $categoriesQuery->get(),
            'ingredients'     => $ingredientsQuery->get(),
            'summary'         => $summary,
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'filters'         => $request->only(['search', 'filter_category', 'branch_id']),
        ]);
    }

    private function getStockStatus($stock)
    {
        if ($stock <= 0) return 'Out of Stock';
        if ($stock <= 5) return 'Low Stock';
        return 'In Stock';
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'                        => 'required|string|max:255',
            'sku'                         => 'nullable|string|unique:products,sku',
            'category_id'                 => 'required|exists:categories,id',
            'cost_price'                  => 'required|numeric|min:0',
            'selling_price'               => 'required|numeric|min:0',
            'image'                       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'recipe'                      => 'required|array|min:1',
            'recipe.*.ingredient_id'      => 'required|exists:ingredients,id',
            'recipe.*.quantity_required'  => 'required|numeric|min:0.0001',
            'branch_id'                   => 'nullable|exists:branches,id',
        ], [
            'recipe.required' => 'At least one ingredient is required to create a product recipe.',
            'recipe.min'      => 'At least one ingredient is required to create a product recipe.',
        ]);

        $branchId = $user->isAdmin()
            ? ($validated['branch_id'] ?? $user->branch_id)
            : $user->branch_id;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        DB::transaction(function () use ($validated, $imagePath, $branchId) {
            $product = Product::create([
                'name'          => $validated['name'],
                'sku'           => $validated['sku'] ?? null,
                'category_id'   => $validated['category_id'],
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'branch_id'     => $branchId,
            ]);

            foreach ($validated['recipe'] as $item) {
                MenuItemIngredient::create([
                    'menu_item_id'      => $product->id,
                    'ingredient_id'     => $item['ingredient_id'],
                    'quantity_required' => $item['quantity_required'],
                ]);
            }
        });

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'                        => 'required|string|max:255',
            'sku'                         => 'nullable|string|unique:products,sku,' . $id,
            'category_id'                 => 'required|exists:categories,id',
            'cost_price'                  => 'required|numeric|min:0',
            'selling_price'               => 'required|numeric|min:0',
            'image'                       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'recipe'                      => 'required|array|min:1',
            'recipe.*.ingredient_id'      => 'required|exists:ingredients,id',
            'recipe.*.quantity_required'  => 'required|numeric|min:0.0001',
        ], [
            'recipe.required' => 'At least one ingredient is required.',
            'recipe.min'      => 'At least one ingredient is required.',
        ]);

        $imagePath = $product->image_path;

        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $imagePath = $request->file('image')->store('products', 'public');
        }

        DB::transaction(function () use ($product, $validated, $imagePath) {
            $product->update([
                'name'          => $validated['name'],
                'sku'           => $validated['sku'] ?? null,
                'category_id'   => $validated['category_id'],
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
            ]);

            MenuItemIngredient::where('menu_item_id', $product->id)->delete();
            foreach ($validated['recipe'] as $item) {
                MenuItemIngredient::create([
                    'menu_item_id'      => $product->id,
                    'ingredient_id'     => $item['ingredient_id'],
                    'quantity_required' => $item['quantity_required'],
                ]);
            }
        });

        return redirect()->back();
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        MenuItemIngredient::where('menu_item_id', $id)->delete();
        $product->delete();

        return redirect()->back();
    }
}
