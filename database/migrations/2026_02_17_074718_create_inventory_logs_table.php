<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('change_qty');       // positive for restock, negative for sale
            $table->string('reason');            // 'sale', 'restock', etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};

