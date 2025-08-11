<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Define who can view Pulse
        Gate::define('viewPulse', function ($user = null) {
            // In local development, allow access without authentication
            if (app()->environment('local')) {
                return true;
            }

            // In production, require any authenticated user
            // You can customize this to require specific roles like:
            // return $user?->is_admin ?? false;
            return $user !== null;
        });
    }
}
