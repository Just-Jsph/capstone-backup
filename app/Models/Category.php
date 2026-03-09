<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'image_path', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
