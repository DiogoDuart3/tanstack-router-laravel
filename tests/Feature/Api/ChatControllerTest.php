<?php

use App\Models\User;
use App\Models\Chat;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Event;
use App\Events\MessageSent;
use App\Events\UserTyping;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Chat Index', function () {
    test('guests can fetch chat messages', function () {
        $user = User::factory()->create();
        Chat::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/chat');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'messages' => [
                    '*' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
                ],
                'has_more'
            ]);
    });

    test('authenticated users can fetch chat messages', function () {
        $user = User::factory()->create();
        Chat::factory()->count(3)->create(['user_id' => $user->id]);
        
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/chat');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'messages' => [
                    '*' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
                ],
                'has_more'
            ]);
    });

    test('messages are returned in chronological order', function () {
        $user = User::factory()->create();
        
        $firstChat = Chat::factory()->create([
            'user_id' => $user->id,
            'message' => 'First message',
            'sent_at' => now()->subMinutes(2)
        ]);
        
        $secondChat = Chat::factory()->create([
            'user_id' => $user->id,
            'message' => 'Second message',
            'sent_at' => now()->subMinute()
        ]);

        $response = $this->getJson('/api/chat');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect($messages[0]['message'])->toBe('First message');
        expect($messages[1]['message'])->toBe('Second message');
    });

    test('limit parameter controls number of messages returned', function () {
        $user = User::factory()->create();
        Chat::factory()->count(10)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/chat?limit=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'messages');
    });

    test('before_id parameter allows pagination', function () {
        $user = User::factory()->create();
        
        // Create chats with explicit timestamps to ensure predictable ordering
        $firstChat = Chat::factory()->create(['user_id' => $user->id, 'sent_at' => now()->subMinutes(5)]);
        $secondChat = Chat::factory()->create(['user_id' => $user->id, 'sent_at' => now()->subMinutes(4)]);
        $thirdChat = Chat::factory()->create(['user_id' => $user->id, 'sent_at' => now()->subMinutes(3)]);
        $fourthChat = Chat::factory()->create(['user_id' => $user->id, 'sent_at' => now()->subMinutes(2)]);
        $fifthChat = Chat::factory()->create(['user_id' => $user->id, 'sent_at' => now()->subMinutes(1)]);

        $response = $this->getJson("/api/chat?before_id={$thirdChat->id}");

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect(count($messages))->toBe(2); // Should return the 2 messages before the third one (first and second)
    });

    test('invalid limit parameter returns validation error', function () {
        $response = $this->getJson('/api/chat?limit=150'); // Above max of 100

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['limit']);
    });

    test('is_own flag is set correctly for authenticated users', function () {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        Chat::factory()->create(['user_id' => $user1->id, 'message' => 'My message']);
        Chat::factory()->create(['user_id' => $user2->id, 'message' => 'Other message']);
        
        Sanctum::actingAs($user1);

        $response = $this->getJson('/api/chat');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        $myMessage = collect($messages)->firstWhere('message', 'My message');
        $otherMessage = collect($messages)->firstWhere('message', 'Other message');
        
        expect($myMessage['is_own'])->toBe(true);
        expect($otherMessage['is_own'])->toBe(false);
    });
});

describe('Chat Store', function () {
    test('guests can send messages with username', function () {
        Event::fake();

        $response = $this->postJson('/api/chat', [
            'message' => 'Hello from guest',
            'username' => 'GuestUser'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
            ])
            ->assertJson([
                'message' => [
                    'message' => 'Hello from guest',
                    'display_name' => 'GuestUser',
                    'is_own' => true,
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'message' => 'Hello from guest',
            'username' => 'GuestUser',
            'user_id' => null,
        ]);

        Event::assertDispatched(MessageSent::class);
    });

    test('guests can send messages without username (defaults to Anonymous)', function () {
        Event::fake();

        $response = $this->postJson('/api/chat', [
            'message' => 'Hello anonymously'
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => [
                    'message' => 'Hello anonymously',
                    'display_name' => 'Anonymous',
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'message' => 'Hello anonymously',
            'username' => 'Anonymous',
            'user_id' => null,
        ]);
    });

    test('authenticated users can send messages', function () {
        Event::fake();
        
        $user = User::factory()->create(['name' => 'John Doe']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/chat', [
            'message' => 'Hello from authenticated user'
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => [
                    'message' => 'Hello from authenticated user',
                    'display_name' => 'John Doe',
                    'is_own' => true,
                ]
            ]);

        $this->assertDatabaseHas('chats', [
            'message' => 'Hello from authenticated user',
            'user_id' => $user->id,
            'username' => null,
        ]);

        Event::assertDispatched(MessageSent::class);
    });

    test('message is required', function () {
        $response = $this->postJson('/api/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    });

    test('message cannot exceed maximum length', function () {
        $longMessage = str_repeat('a', 1001); // 1001 characters, above max of 1000

        $response = $this->postJson('/api/chat', [
            'message' => $longMessage
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    });

    test('username cannot exceed maximum length', function () {
        $longUsername = str_repeat('a', 51); // 51 characters, above max of 50

        $response = $this->postJson('/api/chat', [
            'message' => 'Test message',
            'username' => $longUsername
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
    });
});

describe('Chat Recent', function () {
    test('returns recent messages', function () {
        $user = User::factory()->create();
        Chat::factory()->count(15)->create(['user_id' => $user->id]);

        $response = $this->getJson('/api/chat/recent');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'messages' => [
                    '*' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
                ]
            ])
            ->assertJsonCount(10, 'messages'); // Should return only 10 most recent
    });

    test('recent messages are in chronological order', function () {
        $user = User::factory()->create();
        
        $firstChat = Chat::factory()->create([
            'user_id' => $user->id,
            'message' => 'Older message',
            'sent_at' => now()->subHour()
        ]);
        
        $secondChat = Chat::factory()->create([
            'user_id' => $user->id,
            'message' => 'Newer message',
            'sent_at' => now()
        ]);

        $response = $this->getJson('/api/chat/recent');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect($messages[0]['message'])->toBe('Older message');
        expect($messages[1]['message'])->toBe('Newer message');
    });
});

describe('Chat Typing', function () {
    test('guests can send typing indicator', function () {
        Event::fake();

        $response = $this->postJson('/api/chat/typing', [
            'is_typing' => true,
            'username' => 'GuestUser'
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);

        Event::assertDispatched(UserTyping::class, function ($event) {
            return $event->user['display_name'] === 'GuestUser' && $event->isTyping === true;
        });
    });

    test('authenticated users can send typing indicator', function () {
        Event::fake();
        
        $user = User::factory()->create(['name' => 'John Doe']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/chat/typing', [
            'is_typing' => false
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);

        Event::assertDispatched(UserTyping::class, function ($event) {
            return $event->user['display_name'] === 'John Doe' && $event->isTyping === false;
        });
    });

    test('typing indicator defaults to Anonymous for guests without username', function () {
        Event::fake();

        $response = $this->postJson('/api/chat/typing', [
            'is_typing' => true
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(UserTyping::class, function ($event) {
            return $event->user['display_name'] === 'Anonymous';
        });
    });

    test('is_typing is required', function () {
        $response = $this->postJson('/api/chat/typing', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_typing']);
    });

    test('is_typing must be boolean', function () {
        $response = $this->postJson('/api/chat/typing', [
            'is_typing' => 'not-boolean'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_typing']);
    });

    test('username cannot exceed maximum length for typing', function () {
        $longUsername = str_repeat('a', 51); // 51 characters, above max of 50

        $response = $this->postJson('/api/chat/typing', [
            'is_typing' => true,
            'username' => $longUsername
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username']);
    });
});