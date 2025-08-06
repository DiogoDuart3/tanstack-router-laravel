<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('User Profile', function () {
    test('unauthenticated users cannot access profile', function () {
        $response = $this->getJson('/api/profile');

        $response->assertStatus(401);
    });

    test('authenticated users can access their profile', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/profile');

        $response->assertStatus(200)
            ->assertJsonStructure(['user' => ['id', 'name', 'email']])
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ]);
    });
});

describe('Update Profile', function () {
    test('unauthenticated users cannot update profile', function () {
        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(401);
    });

    test('authenticated users can update their profile', function () {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
        ]);
        
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'name' => 'Updated Name',
                    'email' => 'updated@example.com',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    });

    test('users can update password along with profile', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    });

    test('users can update profile without changing password', function () {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'password' => Hash::make('originalpassword'),
        ]);
        
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => $user->email,
        ]);

        $response->assertStatus(200);

        $user->refresh();
        expect($user->name)->toBe('Updated Name');
        $this->assertTrue(Hash::check('originalpassword', $user->password));
    });

    test('name is required when updating profile', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    test('email is required when updating profile', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    test('email must be valid format', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    test('email must be unique except for current user', function () {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);
        
        Sanctum::actingAs($user1);

        $response = $this->putJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'user2@example.com', // Already taken by user2
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    test('user can keep their own email when updating', function () {
        $user = User::factory()->create(['email' => 'user@example.com']);
        
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'user@example.com', // Same email as current
        ]);

        $response->assertStatus(200);
    });

    test('password must be at least 8 characters', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'password' => '123', // Too short
            'password_confirmation' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    test('password confirmation must match', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword', // Doesn't match
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    test('name cannot exceed maximum length', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $longName = str_repeat('a', 256); // 256 characters, above max of 255

        $response = $this->putJson('/api/profile', [
            'name' => $longName,
            'email' => $user->email,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    });

    test('email cannot exceed maximum length', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $longEmail = str_repeat('a', 250) . '@example.com'; // Over 255 characters

        $response = $this->putJson('/api/profile', [
            'name' => $user->name,
            'email' => $longEmail,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });
});