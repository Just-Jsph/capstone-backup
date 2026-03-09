<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $fillable = ['product_id', 'change_qty', 'reason'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
