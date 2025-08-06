<?php

use App\Models\User;
use App\Models\Todo;
use Laravel\Sanctum\Sanctum;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('unauthenticated users cannot access dashboard API', function () {
    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(401);
});

test('authenticated users can access dashboard API', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'stats' => ['total_todos', 'completed_todos', 'pending_todos'],
            'recent_activity'
        ]);
});

test('dashboard returns correct todo statistics', function () {
    $user = User::factory()->create();
    
    // Create some todos
    Todo::factory()->count(3)->create(['user_id' => $user->id, 'completed' => true]);
    Todo::factory()->count(2)->create(['user_id' => $user->id, 'completed' => false]);
    
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(200)
        ->assertJson([
            'stats' => [
                'total_todos' => 5,
                'completed_todos' => 3,
                'pending_todos' => 2,
            ]
        ]);
});

test('dashboard returns recent activity', function () {
    $user = User::factory()->create();
    
    // Create some todos
    $todos = Todo::factory()->count(7)->create(['user_id' => $user->id]);
    
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(200);
    
    $recentActivity = $response->json('recent_activity');
    
    // Should return only the 5 most recent todos
    expect($recentActivity)->toHaveCount(5);
    
    // Should be ordered by latest first
    $receivedIds = collect($recentActivity)->pluck('id')->toArray();
    $expectedIds = $todos->sortByDesc('created_at')->take(5)->pluck('id')->toArray();
    
    expect($receivedIds)->toEqual($expectedIds);
});

test('dashboard works correctly for users with no todos', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/dashboard');

    $response->assertStatus(200)
        ->assertJson([
            'stats' => [
                'total_todos' => 0,
                'completed_todos' => 0,
                'pending_todos' => 0,
            ],
            'recent_activity' => []
        ]);
});