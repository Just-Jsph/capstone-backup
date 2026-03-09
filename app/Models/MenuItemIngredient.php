<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class MenuItemIngredient extends Pivot
{
    protected $table = 'menu_item_ingredients';

    protected $fillable = [
        'menu_item_id',
        'ingredient_id',
        'quantity_required',
    ];

    public $incrementing = true;
}
