<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $labels['invoice'] }} {{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: "Palatino Linotype", "Book Antiqua", Palatino, "URW Palladio L", serif; margin: 24px; color: #1a1a1a; }
        .top { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; width: 100%; }
        h1 { margin: 0 0 10px; font-size: 24px; }
        h2 { margin: 0 0 8px; font-size: 16px; }
        p { margin: 3px 0; white-space: pre-wrap; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
        th { background: #f6f6f6; text-align: left; }
        .num { text-align: right; }
        .totals { margin-top: 16px; margin-left: auto; width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .grand { border-top: 1px solid #999; margin-top: 6px; padding-top: 8px; font-weight: bold; }
        .meta { margin-bottom: 12px; }
        .small { font-size: 13px; color: #555; }
        @media print { body { margin: 0.5in; } }
    </style>
</head>
<body>
<h1>{{ $labels['invoice'] }} {{ $invoice->invoice_number }}</h1>
<div class="meta small">
    <div>{{ $labels['issueDate'] }}: {{ optional($invoice->issue_date)->format('Y-m-d') }}</div>
    <div>{{ $labels['dueDate'] }}: {{ optional($invoice->due_date)->format('Y-m-d') }}</div>
</div>

<div class="top">
    <div class="card">
        <h2>{{ $labels['from'] }}</h2>
        <p>{{ $settings->business_name }}</p>
        <p>{{ $settings->business_address }}</p>
        <p>{{ $settings->business_email }}</p>
        <p>{{ $settings->business_phone }}</p>
        <p class="small">GST: {{ $settings->gst_number }}</p>
        <p class="small">QST: {{ $settings->qst_number }}</p>
    </div>
    <div class="card">
        <h2>{{ $labels['billTo'] }}</h2>
        <p>{{ $invoice->client_name }}</p>
        <p>{{ $invoice->client_address }}</p>
        <p>{{ $invoice->client_email }}</p>
        <p>{{ $invoice->client_phone }}</p>
    </div>
</div>

<table>
    <thead>
    <tr>
        <th>{{ $labels['description'] }}</th>
        <th class="num">{{ $labels['qty'] }}</th>
        <th class="num">{{ $labels['unitCad'] }}</th>
        <th class="num">{{ $labels['lineTotal'] }}</th>
    </tr>
    </thead>
    <tbody>
    @foreach($rows as $row)
        <tr>
            <td>{{ $row['description'] }}</td>
            <td class="num">{{ $row['qty'] }}</td>
            <td class="num">${{ $row['unitPrice'] }}</td>
            <td class="num">${{ $row['lineTotal'] }}</td>
        </tr>
    @endforeach
    </tbody>
</table>

<div class="totals">
    <div class="totals-row"><span>{{ $labels['subtotal'] }}</span><span>${{ $subtotal }}</span></div>
    <div class="totals-row"><span>{{ $labels['gst'] }}</span><span>${{ $gst }}</span></div>
    <div class="totals-row"><span>{{ $labels['qst'] }}</span><span>${{ $qst }}</span></div>
    <div class="totals-row grand"><span>{{ $labels['total'] }}</span><span>${{ $total }}</span></div>
</div>

@if(trim((string) $invoice->notes) !== '' || trim((string) $invoice->terms) !== '')
    <div style="margin-top: 18px;">
        @if(trim((string) $invoice->notes) !== '')
            <p><strong>{{ $labels['notes'] }}</strong></p>
            <p>{{ $invoice->notes }}</p>
        @endif
        @if(trim((string) $invoice->terms) !== '')
            <p><strong>{{ $labels['terms'] }}</strong></p>
            <p>{{ $invoice->terms }}</p>
        @endif
    </div>
@endif

@if($autoPrint)
    <script>window.print();</script>
@endif
</body>
</html>
