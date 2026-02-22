<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_french_print_export_and_hidden_empty_notes_and_terms(): void
    {
        Setting::query()->create([
            'id' => 1,
            'business_name' => 'My Shop',
            'business_email' => 'shop@example.com',
            'business_phone' => '555-0100',
            'business_address' => '123 Main',
            'gst_number' => 'GST-1',
            'qst_number' => 'QST-1',
            'default_terms' => '',
        ]);

        $invoice = Invoice::query()->create([
            'invoice_number' => '2026022201',
            'language' => 'fr',
            'issue_date' => '2026-02-22',
            'due_date' => '2026-03-22',
            'client_name' => 'Client Name',
            'client_email' => '',
            'client_phone' => '',
            'client_address' => '',
            'notes' => '',
            'terms' => '',
            'subtotal_cents' => 1000,
            'gst_cents' => 50,
            'qst_cents' => 100,
            'total_cents' => 1150,
        ]);

        InvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'position' => 0,
            'description' => 'Service',
            'qty' => 1,
            'unit_price_cents' => 1000,
            'taxable' => true,
            'line_subtotal_cents' => 1000,
            'gst_cents' => 50,
            'qst_cents' => 100,
            'line_total_cents' => 1150,
        ]);

        $response = $this->get('/print/invoice/'.$invoice->id);

        $response->assertOk();
        $response->assertSee('Facture '.$invoice->invoice_number, false);
        $response->assertSee('Date d&#039;emission', false);
        $response->assertDontSee('<strong>Notes</strong>', false);
        $response->assertDontSee('<strong>Modalites</strong>', false);
    }
}
