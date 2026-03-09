<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            $table->decimal('low_stock_level', 15, 4)->default(5)->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'low_stock_level']);
        });
    }
};
