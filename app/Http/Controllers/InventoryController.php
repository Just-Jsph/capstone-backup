<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InventoryController extends Controller
{
    // Show inventory
    public function index(Request $request)
    {
        $user      = Auth::user();
        $branches  = Branch::orderBy('name')->get();

        // Determine branch filter
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id'); // null = all branches
        } else {
            $branchId = $user->branch_id; // Cashier: locked to their branch
        }

        $query = Ingredient::orderBy('name');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $inventory = $query->get()->map(function ($ingredient) {
            return [
                'id'              => $ingredient->id,
                'name'            => $ingredient->name,
                'stock'           => (float) $ingredient->stock,
                'unit'            => $ingredient->unit,
                'branch_id'       => $ingredient->branch_id,
                'low_stock_level' => (float) $ingredient->low_stock_level,
                'is_low_stock'    => $ingredient->isLowStock(),
            ];
        });

        return Inertia::render('Inventory/Index', [
            'inventory'       => $inventory,
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
        ]);
    }

    // Store new ingredient
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'unit'            => 'required|string|max:20',
            'initial_stock'   => 'nullable|numeric|min:0',
            'low_stock_level' => 'nullable|numeric|min:0',
            'branch_id'       => 'nullable|exists:branches,id',
        ]);

        // Cashiers use their own branch; admins can specify
        $branchId = $user->isAdmin()
            ? ($validated['branch_id'] ?? $user->branch_id)
            : $user->branch_id;

        $ingredient = Ingredient::create([
            'name'            => $validated['name'],
            'unit'            => $validated['unit'],
            'stock'           => $validated['initial_stock'] ?? 0,
            'low_stock_level' => $validated['low_stock_level'] ?? 5,
            'branch_id'       => $branchId,
        ]);

        if ($ingredient->stock > 0) {
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'change_qty'    => $ingredient->stock,
                'reason'        => 'initial stock',
            ]);
        }

        return redirect()->back();
    }

    // Update ingredient
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'unit'            => 'required|string|max:20',
            'stock'           => 'nullable|numeric|min:0',
            'low_stock_level' => 'nullable|numeric|min:0',
        ]);

        $oldStock = (float) $ingredient->stock;
        $newStock = (float) ($validated['stock'] ?? $oldStock);

        $ingredient->update([
            'name'            => $validated['name'],
            'unit'            => $validated['unit'],
            'stock'           => $newStock,
            'low_stock_level' => $validated['low_stock_level'] ?? $ingredient->low_stock_level,
        ]);

        if ($newStock != $oldStock) {
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'change_qty'    => $newStock - $oldStock,
                'reason'        => 'manual adjustment',
            ]);
        }

        return redirect()->back();
    }

    // Delete ingredient
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $ingredient->delete();

        return redirect()->back();
    }
}
