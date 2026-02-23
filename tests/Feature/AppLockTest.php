<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppLockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('app.lock_enabled', true);
        config()->set('app.lock_password', 'secret-pass');
    }

    public function test_locked_app_redirects_to_lock_screen(): void
    {
        $this->get('/')
            ->assertRedirect(route('lock.show'));
    }

    public function test_locked_api_returns_unauthorized_json(): void
    {
        $this->getJson('/api/settings')
            ->assertStatus(401)
            ->assertJsonPath('code', 'APP_LOCKED');
    }

    public function test_unlock_with_password_allows_access(): void
    {
        $this->post(route('lock.unlock'), [
            'password' => 'secret-pass',
        ])->assertRedirect('/');

        $this->get('/')
            ->assertOk();

        $this->getJson('/api/settings')
            ->assertOk();
    }
}
