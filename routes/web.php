<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BroadcastAuthController;

// Custom broadcasting authentication route - exclude from CSRF verification
Route::match(['GET', 'POST'], '/broadcasting/auth', [BroadcastAuthController::class, 'authenticate'])
    ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

// Pulse authentication routes
Route::prefix('pulse')->group(function () {
    Route::get('login', [\App\Http\Controllers\PulseAuthController::class, 'showLogin'])->name('pulse.login');
    Route::post('login', [\App\Http\Controllers\PulseAuthController::class, 'login']);
    Route::post('logout', [\App\Http\Controllers\PulseAuthController::class, 'logout'])->name('pulse.logout');
});

// Serve the TanStack Router SPA for all web routes (excluding pulse routes)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!pulse).*$');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
