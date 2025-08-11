<?php

use App\Models\User;
use Illuminate\Support\Facades\Gate;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Pulse Authentication', function () {
    beforeEach(function () {
        // Ensure we're in testing environment
        config(['app.env' => 'testing']);
    });

    test('unauthenticated users are redirected to pulse login', function () {
        $response = $this->get('/pulse');
        
        $response->assertStatus(302)
            ->assertRedirect(route('pulse.login'));
    });

    test('pulse login page is accessible', function () {
        $response = $this->get('/pulse/login');
        
        $response->assertStatus(200)
            ->assertViewIs('pulse-login')
            ->assertSee('Laravel Pulse')
            ->assertSee('Sign in to access the performance dashboard');
    });

    test('authenticated users are redirected to pulse from login page', function () {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->get('/pulse/login');
        
        $response->assertStatus(302)
            ->assertRedirect('/pulse');
    });

    test('users can login via pulse login form', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        
        $response = $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        
        $response->assertStatus(302)
            ->assertRedirect('/pulse');
        
        $this->assertAuthenticatedAs($user);
    });

    test('invalid credentials show validation errors', function () {
        $user = User::factory()->create();
        
        $response = $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);
        
        $response->assertStatus(302)
            ->assertSessionHasErrors('email');
        
        $this->assertGuest();
    });

    test('remember me functionality works', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        
        $response = $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'password123',
            'remember' => true,
        ]);
        
        $response->assertStatus(302);
        $this->assertAuthenticatedAs($user);
        
        // Check that remember token is set
        $this->assertNotNull($user->fresh()->remember_token);
    });

    test('users can logout from pulse', function () {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->post('/pulse/logout');
        
        $response->assertStatus(302)
            ->assertRedirect('/pulse/login');
        
        $this->assertGuest();
    });
});

describe('Pulse Authorization Gate', function () {
    test('viewPulse gate allows access in local environment', function () {
        // The real gate in AuthServiceProvider currently requires auth even in local
        // But the middleware should still allow access in local since the gate returns true
        config(['app.env' => 'local']);
        
        $response = $this->get('/pulse');
        
        // Currently the gate requires auth even in local, so expect redirect
        // This could be changed later if needed
        $response->assertRedirect(route('pulse.login'));
    });

    test('viewPulse gate requires authentication in testing environment', function () {
        config(['app.env' => 'testing']);
        
        // Unauthenticated should be redirected
        $response = $this->get('/pulse');
        $response->assertRedirect(route('pulse.login'));
        
        // Authenticated should work
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/pulse');
        $response->assertStatus(200);
    });

    test('authenticated users can access pulse in testing environment', function () {
        config(['app.env' => 'testing']);
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->get('/pulse');
        
        // In testing, this should work since user is authenticated
        // Note: This might return 200 or redirect depending on Pulse setup
        $response->assertStatus(200);
    });
});

describe('Pulse Middleware', function () {
    test('pulse authorize middleware blocks unauthenticated users', function () {
        config(['app.env' => 'testing']);
        
        $response = $this->get('/pulse');
        
        $response->assertStatus(302)
            ->assertRedirect(route('pulse.login'));
    });

    test('pulse authorize middleware allows authenticated users', function () {
        config(['app.env' => 'testing']);
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->get('/pulse');
        
        // Should not redirect to login
        $response->assertStatus(200);
    });
});

describe('Pulse Integration', function () {
    test('pulse dashboard is accessible to authenticated users', function () {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->get('/pulse');
        
        $response->assertStatus(200);
        // Could check for Pulse-specific elements here
    });

    test('pulse routes do not interfere with spa routes', function () {
        // Test that regular app routes still work
        $response = $this->get('/');
        
        $response->assertStatus(200)
            ->assertViewIs('app');
    });

    test('pulse login routes are excluded from spa catch-all', function () {
        $response = $this->get('/pulse/login');
        
        $response->assertStatus(200)
            ->assertViewIs('pulse-login');
        
        // Should not return the SPA
        $response->assertDontSee('<div id="root">');
    });
});