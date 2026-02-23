<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AppLockController extends Controller
{
    public function show(Request $request): View|RedirectResponse
    {
        if (! config('app.lock_enabled')) {
            return redirect('/');
        }

        $sessionKey = (string) config('app.lock_session_key', 'app_unlocked');
        if ($request->session()->get($sessionKey) === true) {
            return redirect('/');
        }

        return view('lock');
    }

    public function unlock(Request $request): RedirectResponse
    {
        if (! config('app.lock_enabled')) {
            return redirect('/');
        }

        $data = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $configured = (string) config('app.lock_password', '');
        if ($configured === '' || ! $this->passwordMatches($data['password'], $configured)) {
            return back()->withInput()->withErrors([
                'password' => 'Invalid password.',
            ]);
        }

        $request->session()->put((string) config('app.lock_session_key', 'app_unlocked'), true);

        return redirect('/');
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget((string) config('app.lock_session_key', 'app_unlocked'));

        return redirect()->route('lock.show');
    }

    private function passwordMatches(string $input, string $configured): bool
    {
        if (str_starts_with($configured, '$2y$') || str_starts_with($configured, '$argon2')) {
            return password_verify($input, $configured);
        }

        return hash_equals($configured, $input);
    }
}
