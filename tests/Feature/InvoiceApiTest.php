<?php

namespace Tests\Feature;

use App\Models\DailySequence;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_next_number_preview_does_not_increment_sequence(): void
    {
        $this->getJson('/api/invoices/next-number?issueDate=2026-02-22')
            ->assertOk()
            ->assertJson([
                'invoiceNumber' => '2026022201',
                'issueDate' => '2026-02-22',
            ]);

        $this->assertDatabaseCount('daily_sequences', 0);

        $this->postJson('/api/invoices', [
            'invoice_number' => '',
            'language' => 'en',
            'issue_date' => '2026-02-22',
            'due_date' => '2026-03-22',
            'client_name' => 'Acme',
            'items' => [
                ['description' => 'Work', 'qty' => 1, 'unitPrice' => 100, 'taxable' => true],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('invoice_number', '2026022201');

        $this->assertDatabaseHas('daily_sequences', [
            'sequence_date' => '20260222',
            'last_seq' => 1,
        ]);

        $this->getJson('/api/invoices/next-number?issueDate=2026-02-22')
            ->assertOk()
            ->assertJsonPath('invoiceNumber', '2026022202');
    }

    public function test_invoice_number_sequence_extends_after_ninety_nine(): void
    {
        DailySequence::query()->create([
            'sequence_date' => '20260222',
            'last_seq' => 99,
        ]);

        $this->getJson('/api/invoices/next-number?issueDate=2026-02-22')
            ->assertOk()
            ->assertJsonPath('invoiceNumber', '20260222100');

        $this->postJson('/api/invoices', [
            'invoice_number' => '',
            'language' => 'en',
            'issue_date' => '2026-02-22',
            'items' => [
                ['description' => 'Service', 'qty' => 1, 'unitPrice' => 1, 'taxable' => true],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('invoice_number', '20260222100');

        $this->assertDatabaseHas('daily_sequences', [
            'sequence_date' => '20260222',
            'last_seq' => 100,
        ]);
    }

    public function test_invoice_totals_are_recalculated_server_side(): void
    {
        $response = $this->postJson('/api/invoices', [
            'invoice_number' => 'MANUAL-1',
            'language' => 'en',
            'issue_date' => '2026-02-22',
            'items' => [
                ['description' => 'Taxable item', 'qty' => 2, 'unitPrice' => 10, 'taxable' => true],
                ['description' => 'Non-taxable item', 'qty' => 1, 'unitPrice' => 10, 'taxable' => false],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('subtotal', '30.00')
            ->assertJsonPath('gst', '1.00')
            ->assertJsonPath('qst', '2.00')
            ->assertJsonPath('total', '33.00')
            ->assertJsonPath('items.0.lineTotal', '23.00')
            ->assertJsonPath('items.1.lineTotal', '10.00');
    }

    public function test_provided_invoice_number_still_advances_daily_sequence(): void
    {
        $preview = $this->getJson('/api/invoices/next-number?issueDate=2026-02-22')
            ->assertOk()
            ->json('invoiceNumber');

        $this->assertSame('2026022201', $preview);

        $this->postJson('/api/invoices', [
            'invoice_number' => $preview,
            'language' => 'en',
            'issue_date' => '2026-02-22',
            'items' => [
                ['description' => 'Service', 'qty' => 1, 'unitPrice' => 50, 'taxable' => true],
            ],
        ])->assertCreated();

        $this->getJson('/api/invoices/next-number?issueDate=2026-02-22')
            ->assertOk()
            ->assertJsonPath('invoiceNumber', '2026022202');
    }

    public function test_invoice_can_be_deleted_with_hard_delete(): void
    {
        $created = $this->postJson('/api/invoices', [
            'invoice_number' => 'DEL-1',
            'language' => 'en',
            'issue_date' => '2026-02-22',
            'items' => [
                ['description' => 'Service', 'qty' => 1, 'unitPrice' => 50, 'taxable' => true],
            ],
        ])->assertCreated();

        $invoiceId = $created->json('id');

        $this->deleteJson('/api/invoices/'.$invoiceId)
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseMissing('invoices', ['id' => $invoiceId]);
        $this->assertDatabaseMissing('invoice_items', ['invoice_id' => $invoiceId]);
    }
}
