<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'sku', 'selling_price', 'cost_price', 'category_id', 'image_path', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients', 'menu_item_id', 'ingredient_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * Compute available stock based on ingredient availability (branch-scoped).
     * If branch_id is set, only considers that branch's ingredient stock.
     */
    public function getComputedStockAttribute()
    {
        $productBranchId = $this->branch_id;

        // Use branchIngredients() if branch is set.
        $ingredients = $this->ingredients;

        if ($ingredients->isEmpty()) {
            return 0;
        }

        $possibleAmounts = [];

        foreach ($ingredients as $ingredient) {
            $required = (float) $ingredient->pivot->quantity_required;
            if ($required <= 0) continue;

            // If product has a branch, find matching ingredient by name in the same branch
            if ($productBranchId) {
                $branchIngredient = Ingredient::where('branch_id', $productBranchId)
                    ->where('id', $ingredient->id)
                    ->first();
                $available = $branchIngredient ? (float) $branchIngredient->stock : 0;
            } else {
                $available = (float) $ingredient->stock;
            }

            $possibleAmounts[] = floor($available / $required);
        }

        return empty($possibleAmounts) ? 0 : (int) min($possibleAmounts);
    }
}
