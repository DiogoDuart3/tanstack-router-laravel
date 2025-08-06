<?php

use App\Models\User;
use App\Models\Todo;
use Laravel\Sanctum\Sanctum;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

describe('Todo Index', function () {
    test('unauthenticated users cannot access todos', function () {
        $response = $this->getJson('/api/todos');

        $response->assertStatus(401);
    });

    test('authenticated users can fetch their todos', function () {
        $user = User::factory()->create();
        $todos = Todo::factory()->count(3)->create(['user_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/todos');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'todos' => [
                    '*' => ['id', 'title', 'description', 'completed', 'created_at']
                ]
            ])
            ->assertJsonCount(3, 'todos');
    });

    test('users only see their own todos', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        Todo::factory()->count(2)->create(['user_id' => $user1->id]);
        Todo::factory()->count(3)->create(['user_id' => $user2->id]);
        
        Sanctum::actingAs($user1);

        $response = $this->getJson('/api/todos');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'todos');
    });

    test('todos are returned in descending order by creation date', function () {
        $user = User::factory()->create();
        
        $firstTodo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'First']);
        sleep(1);
        $secondTodo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'Second']);
        
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/todos');

        $response->assertStatus(200);
        
        $todos = $response->json('todos');
        expect($todos[0]['title'])->toBe('Second');
        expect($todos[1]['title'])->toBe('First');
    });
});

describe('Todo Store', function () {
    test('authenticated users can create todos', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos', [
            'title' => 'Test Todo',
            'description' => 'Test description',
            'completed' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'todo' => ['id', 'title', 'description', 'completed', 'created_at']
            ])
            ->assertJson([
                'todo' => [
                    'title' => 'Test Todo',
                    'description' => 'Test description',
                    'completed' => false,
                ]
            ]);

        $this->assertDatabaseHas('todos', [
            'title' => 'Test Todo',
            'user_id' => $user->id,
        ]);
    });

    test('title is required when creating todo', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos', [
            'description' => 'Test description',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    });

    test('completed defaults to false if not provided', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos', [
            'title' => 'Test Todo',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'todo' => ['completed' => false]
            ]);
    });

    test('users can create todos with images', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $image1 = UploadedFile::fake()->image('test1.jpg');
        $image2 = UploadedFile::fake()->image('test2.png');

        $response = $this->postJson('/api/todos', [
            'title' => 'Test Todo',
            'images' => [$image1, $image2],
        ]);

        $response->assertStatus(201);
        
        $todo = $response->json('todo');
        expect($todo['images'])->toHaveCount(2);
        expect($todo['primary_image'])->not->toBeNull();
        
        // Verify images were stored
        Storage::disk('public')->assertExists('todos/' . basename($todo['images'][0]));
        Storage::disk('public')->assertExists('todos/' . basename($todo['images'][1]));
    });
});

describe('Todo Update', function () {
    test('users can update their own todos', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id, 'title' => 'Original Title']);
        
        Sanctum::actingAs($user);

        $response = $this->putJson("/api/todos/{$todo->id}", [
            'title' => 'Updated Title',
            'description' => 'Updated description',
            'completed' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'todo' => [
                    'title' => 'Updated Title',
                    'description' => 'Updated description',
                    'completed' => true,
                ]
            ]);

        $this->assertDatabaseHas('todos', [
            'id' => $todo->id,
            'title' => 'Updated Title',
        ]);
    });

    test('users cannot update other users todos', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user1->id]);
        
        Sanctum::actingAs($user2);

        $response = $this->putJson("/api/todos/{$todo->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertStatus(403);
    });

    test('updating todo requires valid data', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $response = $this->putJson("/api/todos/{$todo->id}", [
            'title' => '', // Empty title should fail
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    });

    test('users can add images when updating todos', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $image = UploadedFile::fake()->image('new_image.jpg');

        $response = $this->putJson("/api/todos/{$todo->id}", [
            'title' => $todo->title,
            'description' => $todo->description,
            'completed' => $todo->completed,
            'images' => [$image],
        ]);

        $response->assertStatus(200);
        
        $updatedTodo = $response->json('todo');
        expect($updatedTodo['images'])->toHaveCount(1);
        
        Storage::disk('public')->assertExists('todos/' . basename($updatedTodo['images'][0]));
    });
});

describe('Todo Delete', function () {
    test('users can delete their own todos', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/todos/{$todo->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Todo deleted successfully']);

        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
    });

    test('users cannot delete other users todos', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $todo = Todo::factory()->create(['user_id' => $user1->id]);
        
        Sanctum::actingAs($user2);

        $response = $this->deleteJson("/api/todos/{$todo->id}");

        $response->assertStatus(403);
    });

    test('deleting todo removes associated images from storage', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create([
            'user_id' => $user->id,
            'images' => ['todos/test1.jpg', 'todos/test2.jpg']
        ]);
        
        // Create fake files in storage
        Storage::disk('public')->put('todos/test1.jpg', 'fake content');
        Storage::disk('public')->put('todos/test2.jpg', 'fake content');
        
        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/todos/{$todo->id}");

        $response->assertStatus(200);
        
        Storage::disk('public')->assertMissing('todos/test1.jpg');
        Storage::disk('public')->assertMissing('todos/test2.jpg');
    });
});

describe('Todo Sync', function () {
    test('users can sync their todos', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos/sync', [
            'todos' => [
                [
                    'id' => null,
                    'title' => 'New Todo',
                    'description' => 'Description',
                    'completed' => false,
                    'client_id' => 'client-1',
                    'updated_at' => now()->toISOString(),
                ]
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'synced_todos',
                'all_todos'
            ]);

        $this->assertDatabaseHas('todos', [
            'title' => 'New Todo',
            'user_id' => $user->id,
        ]);
    });

    test('sync updates existing todos if they are newer', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create([
            'user_id' => $user->id,
            'title' => 'Original Title',
            'updated_at' => now()->subHour(),
        ]);
        
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos/sync', [
            'todos' => [
                [
                    'id' => (string) $todo->id,
                    'title' => 'Updated Title',
                    'description' => 'Updated Description',
                    'completed' => true,
                    'client_id' => 'client-1',
                    'updated_at' => now()->toISOString(),
                ]
            ]
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('todos', [
            'id' => $todo->id,
            'title' => 'Updated Title',
        ]);
    });

    test('sync ignores older updates', function () {
        $user = User::factory()->create();
        $todo = Todo::factory()->create([
            'user_id' => $user->id,
            'title' => 'Current Title',
            'updated_at' => now(),
        ]);
        
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos/sync', [
            'todos' => [
                [
                    'id' => (string) $todo->id,
                    'title' => 'Old Title',
                    'description' => 'Old Description',
                    'completed' => true,
                    'client_id' => 'client-1',
                    'updated_at' => now()->subHour()->toISOString(),
                ]
            ]
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('todos', [
            'id' => $todo->id,
            'title' => 'Current Title', // Should remain unchanged
        ]);
    });

    test('sync requires valid data', function () {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/todos/sync', [
            'todos' => [
                [
                    'title' => 'Missing required fields',
                ]
            ]
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['todos.0.client_id', 'todos.0.updated_at']);
    });
});