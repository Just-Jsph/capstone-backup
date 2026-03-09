<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IngredientLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'ingredient_id',
        'change_qty',
        'reason',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}
