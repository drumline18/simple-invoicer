<?php

use App\Http\Controllers\PrintInvoiceController;
use Illuminate\Support\Facades\Route;

Route::get('/print/invoice/{id}', PrintInvoiceController::class)->whereNumber('id');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|print).*$');
