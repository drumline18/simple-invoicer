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
        $tax = $service->taxConfig($settings);
        $tax1Label = $tax['tax_1']['label'].' ('.$tax['tax_1']['rate_percent'].'%)';
        $tax2Label = $tax['tax_2']['label'].' ('.$tax['tax_2']['rate_percent'].'%)';
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
                'gst' => $tax1Label,
                'qst' => $tax2Label,
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
                'gst' => $tax1Label,
                'qst' => $tax2Label,
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
            'tax' => $tax,
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
