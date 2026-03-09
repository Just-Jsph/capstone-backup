<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'type',
        'items',
        'total',
        'status',
        'payment_method',
        'paid_amount',
    ];

    protected $casts = [
        'items' => 'array',
    ];
}
