<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PosController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\EmployeeController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (auth()->check()) {
        return auth()->user()->isAdmin()
            ? redirect()->route('dashboard')
            : redirect()->route('pos.index');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    // Admin ONLY Routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('dashboard', [AnalyticsController::class, 'index'])->name('dashboard');

        Route::get('suppliers', fn() => Inertia::render('Suppliers/Index'))->name('suppliers.index');
        Route::get('delivery', fn() => Inertia::render('Delivery/Index'))->name('delivery.index');

        // Employee Management (Admin only)
        Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    });

    // POS Routes (Cashier ONLY)
    Route::middleware(['role:cashier'])->group(function () {
        Route::get('pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('pos', [PosController::class, 'store'])->name('pos.store');
    });

    // Shared Routes (Admin and Cashier — Full Access)
    Route::middleware(['role:admin,cashier'])->group(function () {

        // Products
        Route::get('products', [App\Http\Controllers\ProductsController::class, 'index'])->name('products.index');
        Route::post('products', [App\Http\Controllers\ProductsController::class, 'store'])->name('products.store');
        Route::put('products/{id}', [App\Http\Controllers\ProductsController::class, 'update'])->name('products.update');
        Route::delete('products/{id}', [App\Http\Controllers\ProductsController::class, 'destroy'])->name('products.destroy');

        // Categories
        Route::get('categories', [CategoriesController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
        Route::put('/categories/{id}', [CategoriesController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{id}', [CategoriesController::class, 'destroy'])->name('categories.destroy');

        // Inventory
        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
        Route::put('/inventory/{id}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::delete('/inventory/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

        // Reports
        Route::get('reports', [App\Http\Controllers\Admin\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/pdf', [App\Http\Controllers\Admin\ReportController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('reports/excel', [App\Http\Controllers\Admin\ReportController::class, 'exportExcel'])->name('reports.excel');

        // Sales
        Route::get('sales', [App\Http\Controllers\SalesController::class, 'index'])->name('sales.index');
        Route::put('sales/{sale}/status', [App\Http\Controllers\SalesController::class, 'updateStatus'])->name('sales.updateStatus');

        Route::get('customers', fn() => Inertia::render('Customers/Index'))->name('customers.index');

        // Branches (for dropdowns)
        Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
    });
});

require __DIR__.'/settings.php';
