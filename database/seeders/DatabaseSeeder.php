<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run branch seeder first
        $this->call(BranchSeeder::class);

        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'jmbautista0228@gmail.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('09475591719'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
