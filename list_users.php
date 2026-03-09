<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (App\Models\User::all() as $u) {
    echo "ID: {$u->id} | Email: {$u->email} | Role: {$u->role} | Verified: " . ($u->email_verified_at ? 'Yes' : 'No') . "\n";
}
