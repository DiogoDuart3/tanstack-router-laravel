<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PulseAuthController extends Controller
{
    /**
     * Show the login form for Pulse access
     */
    public function showLogin()
    {
        // If already authenticated, redirect to Pulse
        if (Auth::check()) {
            return redirect('/pulse');
        }

        return view('pulse-login');
    }

    /**
     * Handle login for Pulse access
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended('/pulse');
    }

    /**
     * Handle logout for Pulse access
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/pulse/login');
    }
}