<?php

use Illuminate\Support\Facades\Route;

// Serve the TanStack Router SPA for all web routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
