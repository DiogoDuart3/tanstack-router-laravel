<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BroadcastAuthController;

// Custom broadcasting authentication route - exclude from CSRF verification
Route::match(['GET', 'POST'], '/broadcasting/auth', [BroadcastAuthController::class, 'authenticate'])
    ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

// Serve the TanStack Router SPA for all web routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
