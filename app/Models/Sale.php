<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'branch_id',
        'type',
        'total',
        'cost_total',
        'profit',
        'paid_amount',
        'change_amount',
        'payment_method',
        'status',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
