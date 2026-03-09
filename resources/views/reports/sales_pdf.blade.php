<!DOCTYPE html>
<html>
<head>
    <title>Sales Report</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; }
        .totals { margin-top: 20px; text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sales Report</h1>
        <p>Generated on: {{ now()->format('Y-m-d H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Total</th>
                <th>Profit</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sales as $sale)
            <tr>
                <td>{{ $sale->order_number }}</td>
                <td>{{ $sale->created_at->format('Y-m-d H:i') }}</td>
                <td>{{ $sale->cashier->name ?? 'N/A' }}</td>
                <td>₱{{ number_format($sale->total, 2) }}</td>
                <td>₱{{ number_format($sale->profit, 2) }}</td>
                <td>{{ ucfirst($sale->status) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <p>Total Revenue: ₱{{ number_format($sales->sum('total'), 2) }}</p>
        <p>Total Profit: ₱{{ number_format($sales->sum('profit'), 2) }}</p>
    </div>

    <div class="footer">
        <p>Page 1 of 1</p>
    </div>
</body>
</html>
