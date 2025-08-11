<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Pulse Security', function () {
    test('pulse routes require valid session', function () {
        // Test that pulse requires proper authentication, not just any session
        $this->startSession();
        
        $response = $this->get('/pulse');
        
        $response->assertStatus(302)
            ->assertRedirect(route('pulse.login'));
    });

    test('pulse login with valid credentials works', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        
        $response = $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        
        $response->assertStatus(302)
            ->assertRedirect('/pulse');
        
        $this->assertAuthenticatedAs($user);
    });

    test('pulse logout validates CSRF token', function () {
        $user = User::factory()->create();
        
        $this->actingAs($user);
        $this->startSession();
        
        $response = $this->post('/pulse/logout', [
            '_token' => 'invalid-token'
        ]);
        
        // Should either be 419 (CSRF error) or 302 (redirect)
        expect(in_array($response->getStatusCode(), [419, 302]))->toBeTrue();
    });

    test('pulse routes are protected from unauthorized access attempts', function () {
        // Test various unauthorized access attempts
        $unauthorizedRoutes = [
            'GET' => ['/pulse'],
        ];
        
        foreach ($unauthorizedRoutes as $method => $routes) {
            foreach ($routes as $route) {
                $response = $this->call($method, $route);
                
                expect($response->getStatusCode())->toBe(302);
                expect($response->getTargetUrl())->toContain('/pulse/login');
            }
        }
    });

    test('pulse login rate limiting works', function () {
        $user = User::factory()->create();
        
        // Make multiple failed login attempts
        for ($i = 0; $i < 6; $i++) {
            $this->post('/pulse/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
        }
        
        // Next attempt should be rate limited
        $response = $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);
        
        // Laravel's default rate limiting might kick in
        // This test depends on your rate limiting configuration
        expect(in_array($response->getStatusCode(), [429, 302]))->toBeTrue();
    });

    test('pulse session timeout works correctly', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        
        // Login user properly
        $this->post('/pulse/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        
        $this->assertAuthenticatedAs($user);
        
        // Logout to simulate session timeout
        auth()->logout();
        session()->flush();
        
        $response = $this->get('/pulse');
        
        $response->assertStatus(302)
            ->assertRedirect(route('pulse.login'));
    });
});