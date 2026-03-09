<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SaleService
{
    /**
     * Process a new sale.
     *
     * @param array $data
     * @return Sale
     */
    public function processSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $branchId = Auth::user()->branch_id;

            // 1. Validate and calculate ingredient requirements
            $ingredientRequirements = $this->calculateIngredientRequirements($data['items']);

            // 2. Verify stock availability (branch-scoped)
            $this->verifyStockAvailability($ingredientRequirements, $branchId);

            // 3. Deduct stock and log changes (branch-scoped)
            $this->deductStock($ingredientRequirements, $data['order_number'] ?? 'POS Order', $branchId);

            // 4. Calculate Totals and Profit
            $costTotal     = 0;
            $saleProfit    = 0;
            $saleItemsData = [];

            foreach ($data['items'] as $item) {
                $product     = Product::findOrFail($item['id']);
                $itemCost    = $product->cost_price * $item['quantity'];
                $itemSelling = $product->selling_price * $item['quantity'];
                $itemProfit  = $itemSelling - $itemCost;

                $costTotal  += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->selling_price,
                    'cost_price' => $product->cost_price,
                    'subtotal'   => $itemSelling,
                    'profit'     => $itemProfit,
                ];
            }

            // 5. Create Sale Record (with branch_id)
            $sale = Sale::create([
                'order_number'   => $data['order_number'] ?? 'SALE-' . strtoupper(uniqid()),
                'user_id'        => Auth::id(),
                'branch_id'      => $branchId,
                'type'           => $data['type'] ?? 'dine-in',
                'total'          => $data['total'],
                'cost_total'     => $costTotal,
                'profit'         => $saleProfit,
                'paid_amount'    => $data['paid_amount'],
                'change_amount'  => $data['change_amount'] ?? 0,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status'         => $data['status'] ?? 'completed',
            ]);

            // 6. Create Sale Items
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            return $sale;
        });
    }

    protected function calculateIngredientRequirements(array $items): array
    {
        $requirements = [];
        foreach ($items as $item) {
            $product = Product::with('ingredients')->findOrFail($item['id']);
            foreach ($product->ingredients as $ingredient) {
                $id     = $ingredient->id;
                $needed = (float) $ingredient->pivot->quantity_required * (float) $item['quantity'];
                $requirements[$id] = ($requirements[$id] ?? 0) + $needed;
            }
        }
        return $requirements;
    }

    /**
     * Verify stock availability — checks the ingredient in the correct branch.
     */
    protected function verifyStockAvailability(array $requirements, ?int $branchId): void
    {
        foreach ($requirements as $id => $totalNeeded) {
            // Find ingredient scoped to branch if branch_id is set
            $ingredient = $branchId
                ? Ingredient::where('id', $id)->where('branch_id', $branchId)->first()
                : Ingredient::find($id);

            if (!$ingredient) {
                $fallback = Ingredient::findOrFail($id);
                throw new \Exception("Ingredient '{$fallback->name}' not found in this branch's inventory.");
            }

            if ($ingredient->stock < $totalNeeded) {
                throw new \Exception(
                    "Insufficient stock for {$ingredient->name}. Needed {$totalNeeded} {$ingredient->unit}, available {$ingredient->stock} {$ingredient->unit}."
                );
            }
        }
    }

    /**
     * Deduct stock — updates ingredient row for the correct branch.
     */
    protected function deductStock(array $requirements, string $reference, ?int $branchId): void
    {
        foreach ($requirements as $id => $totalNeeded) {
            $ingredient = $branchId
                ? Ingredient::where('id', $id)->where('branch_id', $branchId)->firstOrFail()
                : Ingredient::findOrFail($id);

            $ingredient->decrement('stock', $totalNeeded);

            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'change_qty'    => -$totalNeeded,
                'reason'        => "Sale: {$reference}",
            ]);
        }
    }
}
