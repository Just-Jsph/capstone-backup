<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Add initial stock for products
        DB::table('inventory_logs')->insert([
            [
                'product_id' => 1, 
                'change_qty' => 50, 
                'reason' => 'initial stock', 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'product_id' => 2, 
                'change_qty' => 100, 
                'reason' => 'initial stock', 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'product_id' => 3, 
                'change_qty' => 80, 
                'reason' => 'initial stock', 
                'created_at' => now(), 
                'updated_at' => now()
            ],
            [
                'product_id' => 4, 
                'change_qty' => 20, 
                'reason' => 'initial stock', 
                'created_at' => now(), 
                'updated_at' => now()
            ],
        ]);
    }
}
