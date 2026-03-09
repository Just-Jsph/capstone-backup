<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'stock',
        'unit',
        'branch_id',
        'low_stock_level',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The menu items (products) that use this ingredient.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'menu_item_ingredients', 'ingredient_id', 'menu_item_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * The logs for this ingredient.
     */
    public function logs()
    {
        return $this->hasMany(IngredientLog::class);
    }

    /**
     * Check if ingredient is low stock.
     */
    public function isLowStock(): bool
    {
        return (float) $this->stock <= (float) $this->low_stock_level;
    }
}
