<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name', 'address'];

    public function employees()
    {
        return $this->hasMany(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function ingredients()
    {
        return $this->hasMany(Ingredient::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
