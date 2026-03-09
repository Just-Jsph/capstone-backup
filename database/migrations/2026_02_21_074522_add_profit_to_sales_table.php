<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('cost_total', 10, 2)->default(0)->after('total');
            $table->decimal('profit', 10, 2)->default(0)->after('cost_total');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->default(0)->after('unit_price');
            $table->decimal('profit', 10, 2)->default(0)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['cost_total', 'profit']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'profit']);
        });
    }
};
