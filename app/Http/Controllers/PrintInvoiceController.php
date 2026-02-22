<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Setting;
use App\Services\InvoiceService;
use Illuminate\Http\Response;

class PrintInvoiceController extends Controller
{
    public function __invoke(int $id, InvoiceService $service): Response
    {
        $invoice = Invoice::query()->with(['items' => fn ($query) => $query->orderBy('position')])->find($id);

        if (! $invoice) {
            abort(404, 'Invoice not found.');
        }

        $settings = Setting::query()->firstOrCreate(['id' => 1]);
        $language = $service->normalizeLanguage($invoice->language);
        $labels = $language === 'fr'
            ? [
                'invoice' => 'Facture',
                'issueDate' => "Date d'emission",
                'dueDate' => "Date d'echeance",
                'from' => 'De',
                'billTo' => 'Facture a',
                'description' => 'Description',
                'qty' => 'Qte',
                'unitCad' => 'Unite (CAD)',
                'lineTotal' => 'Total ligne',
                'subtotal' => 'Sous-total',
                'gst' => 'TPS (5%)',
                'qst' => 'TVQ (9.975%)',
                'total' => 'Total',
                'notes' => 'Notes',
                'terms' => 'Modalites',
            ]
            : [
                'invoice' => 'Invoice',
                'issueDate' => 'Issue date',
                'dueDate' => 'Due date',
                'from' => 'From',
                'billTo' => 'Bill to',
                'description' => 'Description',
                'qty' => 'Qty',
                'unitCad' => 'Unit (CAD)',
                'lineTotal' => 'Line total',
                'subtotal' => 'Subtotal',
                'gst' => 'GST (5%)',
                'qst' => 'QST (9.975%)',
                'total' => 'Total',
                'notes' => 'Notes',
                'terms' => 'Terms',
            ];

        $rows = $invoice->items->map(function ($item) use ($service) {
            return [
                'description' => $item->description,
                'qty' => $item->qty,
                'unitPrice' => $service->dollarsFromCents((int) $item->unit_price_cents),
                'lineTotal' => $service->dollarsFromCents((int) $item->line_subtotal_cents),
            ];
        });

        return response()->view('print.invoice', [
            'invoice' => $invoice,
            'settings' => $settings,
            'labels' => $labels,
            'rows' => $rows,
            'subtotal' => $service->dollarsFromCents((int) $invoice->subtotal_cents),
            'gst' => $service->dollarsFromCents((int) $invoice->gst_cents),
            'qst' => $service->dollarsFromCents((int) $invoice->qst_cents),
            'total' => $service->dollarsFromCents((int) $invoice->total_cents),
            'autoPrint' => request()->query('autoprint') === '1',
        ]);
    }
}
