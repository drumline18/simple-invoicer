<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmokeFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_invoice_flow_create_edit_list_and_print(): void
    {
        $this->putJson('/api/settings', [
            'business_name' => 'Simple Invoicer Inc',
            'business_email' => 'owner@example.com',
            'default_terms' => 'Net 30',
        ])->assertOk()->assertJsonPath('business_name', 'Simple Invoicer Inc');

        $this->postJson('/api/clients', [
            'name' => 'Acme Co',
            'email' => 'billing@acme.test',
            'phone' => '555-0101',
            'address' => '100 Client St',
            'overwrite' => false,
        ])->assertCreated()->assertJsonPath('name', 'Acme Co');

        $created = $this->postJson('/api/invoices', [
            'issue_date' => '2026-02-22',
            'due_date' => '2026-03-22',
            'language' => 'fr',
            'client_name' => 'Acme Co',
            'client_email' => 'billing@acme.test',
            'client_phone' => '555-0101',
            'client_address' => '100 Client St',
            'notes' => '',
            'terms' => 'Net 30',
            'items' => [
                ['description' => 'Design', 'qty' => 2, 'unitPrice' => 125, 'taxable' => true],
            ],
        ])->assertCreated();

        $invoiceId = $created->json('id');

        $this->putJson('/api/invoices/'.$invoiceId, [
            'invoice_number' => $created->json('invoice_number'),
            'issue_date' => '2026-02-22',
            'due_date' => '2026-03-25',
            'language' => 'fr',
            'client_name' => 'Acme Co',
            'client_email' => 'accounts@acme.test',
            'client_phone' => '555-0101',
            'client_address' => '100 Client St',
            'notes' => 'Merci',
            'terms' => 'Net 30',
            'items' => [
                ['description' => 'Design', 'qty' => 2, 'unitPrice' => 125, 'taxable' => true],
                ['description' => 'Hosting', 'qty' => 1, 'unitPrice' => 10, 'taxable' => false],
            ],
        ])->assertOk()->assertJsonPath('client_email', 'accounts@acme.test');

        $this->getJson('/api/invoices?search=Acme')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.client_name', 'Acme Co');

        $this->get('/print/invoice/'.$invoiceId.'?autoprint=1')
            ->assertOk()
            ->assertSee('Facture', false)
            ->assertSee('window.print()', false);
    }
}
