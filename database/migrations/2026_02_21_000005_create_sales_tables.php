<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Cashier
            $table->enum('type', ['dine-in', 'take-out', 'delivery'])->default('dine-in');
            $table->decimal('total', 10, 2);
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->string('payment_method')->default('cash');
            $table->enum('status', ['pending', 'preparing', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
