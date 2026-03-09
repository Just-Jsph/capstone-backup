<?php

namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        return Sale::with(['cashier'])
            ->when($this->filters['date_from'] ?? null, fn($q) => $q->whereDate('created_at', '>=', $this->filters['date_from']))
            ->when($this->filters['date_to'] ?? null, fn($q) => $q->whereDate('created_at', '<=', $this->filters['date_to']))
            ->when($this->filters['cashier_id'] ?? null, fn($q) => $q->where('user_id', $this->filters['cashier_id']))
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return [
            'Order Number',
            'Cashier',
            'Type',
            'Total',
            'Cost Total',
            'Profit',
            'Payment Method',
            'Status',
            'Date',
        ];
    }

    public function map($sale): array
    {
        return [
            $sale->order_number,
            $sale->cashier->name ?? 'N/A',
            $sale->type,
            $sale->total,
            $sale->cost_total,
            $sale->profit,
            $sale->payment_method,
            $sale->status,
            $sale->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
