<?php

use App\Http\Controllers\AppLockController;
use App\Http\Controllers\PrintInvoiceController;
use Illuminate\Support\Facades\Route;

Route::get('/lock', [AppLockController::class, 'show'])->name('lock.show');
Route::post('/lock', [AppLockController::class, 'unlock'])->name('lock.unlock');
Route::post('/lock/logout', [AppLockController::class, 'lock'])->name('lock.logout');

Route::middleware('app.lock')->group(function () {
    Route::get('/print/invoice/{id}', PrintInvoiceController::class)->whereNumber('id');

    Route::get('/{any?}', function () {
        return view('app');
    })->where('any', '^(?!api|print|lock).*$');
});
