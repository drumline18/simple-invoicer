<?php

use App\Http\Controllers\Api\ClientsController;
use App\Http\Controllers\Api\InvoicesController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/settings', [SettingsController::class, 'show']);
Route::put('/settings', [SettingsController::class, 'update']);

Route::get('/clients', [ClientsController::class, 'index']);
Route::get('/clients/{id}', [ClientsController::class, 'show']);
Route::post('/clients', [ClientsController::class, 'store']);
Route::put('/clients/{id}', [ClientsController::class, 'update']);
Route::post('/clients/{id}/archive', [ClientsController::class, 'archive']);
Route::post('/clients/{id}/restore', [ClientsController::class, 'restore']);

Route::get('/invoices/next-number', [InvoicesController::class, 'nextNumber']);
Route::get('/invoices', [InvoicesController::class, 'index']);
Route::get('/invoices/{id}', [InvoicesController::class, 'show']);
Route::post('/invoices', [InvoicesController::class, 'store']);
Route::put('/invoices/{id}', [InvoicesController::class, 'update']);
