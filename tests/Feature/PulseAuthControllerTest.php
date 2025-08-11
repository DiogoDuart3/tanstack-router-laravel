<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('PulseAuthController', function () {
    describe('showLogin', function () {
        test('displays login form for guests', function () {
            $response = $this->get(route('pulse.login'));
            
            $response->assertStatus(200)
                ->assertViewIs('pulse-login')
                ->assertSee('Laravel Pulse')
                ->assertSee('Sign in to access the performance dashboard');
        });

        test('redirects authenticated users to pulse dashboard', function () {
            $user = User::factory()->create();
            
            $response = $this->actingAs($user)->get(route('pulse.login'));
            
            $response->assertStatus(302)
                ->assertRedirect('/pulse');
        });
    });

    describe('login', function () {
        test('authenticates user with valid credentials', function () {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => Hash::make('password123'),
            ]);
            
            $response = $this->post('/pulse/login', [
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);
            
            $response->assertStatus(302)
                ->assertRedirect('/pulse');
            
            $this->assertAuthenticatedAs($user);
            expect(Auth::check())->toBeTrue();
        });

        test('regenerates session on successful login', function () {
            $user = User::factory()->create([
                'password' => Hash::make('password123'),
            ]);
            
            // Start a session
            $this->startSession();
            $oldSessionId = session()->getId();
            
            $this->post('/pulse/login', [
                'email' => $user->email,
                'password' => 'password123',
            ]);
            
            // Session should be regenerated
            expect(session()->getId())->not->toBe($oldSessionId);
        });

        test('sets remember token when remember is checked', function () {
            $user = User::factory()->create([
                'password' => Hash::make('password123'),
            ]);
            
            $this->post('/pulse/login', [
                'email' => $user->email,
                'password' => 'password123',
                'remember' => true,
            ]);
            
            // Check that remember token was set
            expect($user->fresh()->remember_token)->not->toBeNull();
        });

        test('rejects invalid credentials', function () {
            $user = User::factory()->create([
                'password' => Hash::make('correct-password'),
            ]);
            
            $response = $this->post('/pulse/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
            
            $response->assertStatus(302)
                ->assertSessionHasErrors(['email']);
            
            $this->assertGuest();
        });

        test('validates required fields', function () {
            $response = $this->post('/pulse/login', []);
            
            $response->assertStatus(302)
                ->assertSessionHasErrors(['email', 'password']);
        });

        test('validates email format', function () {
            $response = $this->post('/pulse/login', [
                'email' => 'invalid-email',
                'password' => 'password123',
            ]);
            
            $response->assertStatus(302)
                ->assertSessionHasErrors(['email']);
        });
    });

    describe('logout', function () {
        test('logs out authenticated user', function () {
            $user = User::factory()->create();
            
            $response = $this->actingAs($user)->post(route('pulse.logout'));
            
            $response->assertStatus(302)
                ->assertRedirect('/pulse/login');
            
            $this->assertGuest();
        });

        test('invalidates session on logout', function () {
            $user = User::factory()->create();
            
            $this->actingAs($user);
            $this->startSession();
            $oldSessionId = session()->getId();
            
            $this->post(route('pulse.logout'));
            
            // Session should be invalidated
            expect(session()->getId())->not->toBe($oldSessionId);
        });

        test('regenerates csrf token on logout', function () {
            $user = User::factory()->create();
            
            $this->actingAs($user);
            $this->startSession();
            $oldToken = csrf_token();
            
            $this->post(route('pulse.logout'));
            
            // CSRF token should be regenerated
            expect(csrf_token())->not->toBe($oldToken);
        });

        test('can logout even when not authenticated', function () {
            $response = $this->post(route('pulse.logout'));
            
            $response->assertStatus(302)
                ->assertRedirect('/pulse/login');
        });
    });
});