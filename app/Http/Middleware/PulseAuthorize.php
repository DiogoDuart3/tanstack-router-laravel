<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PulseAuthorize
{
    /**
     * Create a new middleware instance.
     */
    public function __construct(protected Gate $gate)
    {
        //
    }

    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        // Check if user is authenticated and authorized to view Pulse
        if (!Auth::check()) {
            return redirect()->route('pulse.login');
        }

        if (!$this->gate->allows('viewPulse', Auth::user())) {
            return redirect()->route('pulse.login');
        }

        return $next($request);
    }
}