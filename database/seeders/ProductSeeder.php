<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->insert([
            ['name' => 'Burger', 'sku' => 'BRG001', 'price' => 120, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Fries', 'sku' => 'FRS001', 'price' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Coke', 'sku' => 'CK001', 'price' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pizza', 'sku' => 'PZ001', 'price' => 250, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
