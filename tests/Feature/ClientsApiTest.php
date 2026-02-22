<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_client_requires_overwrite_to_update(): void
    {
        Client::query()->create([
            'name' => 'Acme',
            'email' => 'old@example.com',
            'phone' => '',
            'address' => '',
        ]);

        $this->postJson('/api/clients', [
            'name' => 'acme',
            'email' => 'new@example.com',
            'phone' => '',
            'address' => '',
            'overwrite' => false,
        ])
            ->assertStatus(409)
            ->assertJsonPath('code', 'CLIENT_EXISTS');

        $this->postJson('/api/clients', [
            'name' => 'acme',
            'email' => 'new@example.com',
            'phone' => '',
            'address' => '',
            'overwrite' => true,
        ])
            ->assertOk()
            ->assertJsonPath('name', 'acme')
            ->assertJsonPath('email', 'new@example.com');
    }

    public function test_archived_duplicate_name_blocks_client_creation(): void
    {
        $archived = Client::query()->create([
            'name' => 'Dormant Co',
            'email' => '',
            'phone' => '',
            'address' => '',
            'is_archived' => true,
            'archived_at' => now(),
        ]);

        $this->postJson('/api/clients', [
            'name' => 'dormant co',
            'email' => 'x@example.com',
            'phone' => '',
            'address' => '',
            'overwrite' => false,
        ])
            ->assertStatus(409)
            ->assertJsonPath('code', 'CLIENT_ARCHIVED')
            ->assertJsonPath('existing_client_id', $archived->id);
    }

    public function test_client_listing_excludes_archived_by_default(): void
    {
        Client::query()->create([
            'name' => 'Active Co',
            'email' => '',
            'phone' => '',
            'address' => '',
            'is_archived' => false,
        ]);
        Client::query()->create([
            'name' => 'Archived Co',
            'email' => '',
            'phone' => '',
            'address' => '',
            'is_archived' => true,
            'archived_at' => now(),
        ]);

        $defaultRows = $this->getJson('/api/clients')->assertOk()->json();
        $allRows = $this->getJson('/api/clients?include_archived=1')->assertOk()->json();

        $this->assertCount(1, $defaultRows);
        $this->assertSame('Active Co', $defaultRows[0]['name']);

        $this->assertCount(2, $allRows);
    }
}
