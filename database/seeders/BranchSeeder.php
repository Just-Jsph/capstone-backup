<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('branches')->insert([
            [
                'id'         => 1,
                'name'       => 'Maki Desu Victoria',
                'address'    => 'Victoria, Laguna',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => 2,
                'name'       => 'Maki Desu Sta Cruz',
                'address'    => 'Sta Cruz, Laguna',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
