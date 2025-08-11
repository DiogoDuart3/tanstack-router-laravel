<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Laravel\Pulse\Facades\Pulse;

class PulseServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Add custom header to Pulse dashboard
        if (class_exists(\Laravel\Pulse\Facades\Pulse::class)) {
            Pulse::user(function ($request) {
                if (Auth::check()) {
                    return [
                        'id' => Auth::id(),
                        'name' => Auth::user()->name,
                        'email' => Auth::user()->email,
                    ];
                }
                return null;
            });
        }
    }
}