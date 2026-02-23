<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAppUnlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('app.lock_enabled')) {
            return $next($request);
        }

        if (! $request->hasSession()) {
            if ($request->expectsJson() || str_starts_with($request->path(), 'api/')) {
                return new JsonResponse([
                    'error' => 'App is locked. Enter password first.',
                    'code' => 'APP_LOCKED',
                ], 401);
            }

            return new RedirectResponse(route('lock.show'));
        }

        $sessionKey = (string) config('app.lock_session_key', 'app_unlocked');
        if ($request->session()->get($sessionKey) === true) {
            return $next($request);
        }

        if ($request->expectsJson() || str_starts_with($request->path(), 'api/')) {
            return new JsonResponse([
                'error' => 'App is locked. Enter password first.',
                'code' => 'APP_LOCKED',
            ], 401);
        }

        return new RedirectResponse(route('lock.show'));
    }
}
