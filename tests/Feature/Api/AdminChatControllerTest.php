<?php

use App\Models\User;
use App\Models\AdminChat;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Event;
use App\Events\AdminMessageSent;
use App\Events\AdminUserTyping;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

describe('Admin Chat Authorization', function () {
    test('unauthenticated users cannot access admin chat', function () {
        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(401);
    });

    test('non-admin users cannot access admin chat', function () {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(403)
            ->assertJson(['message' => 'Access denied. Admin privileges required.']);
    });

    test('admin users can access admin chat', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        AdminChat::factory()->create(['user_id' => $admin->id]);
        
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(200);
    });
});

describe('Admin Chat Index', function () {
    test('admin can fetch chat messages', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        AdminChat::factory()->count(3)->create(['user_id' => $admin->id]);
        
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'messages' => [
                    '*' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
                ],
                'has_more'
            ]);
    });

    test('admin chat messages are returned in chronological order', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        
        $firstChat = AdminChat::factory()->create([
            'user_id' => $admin->id,
            'message' => 'First admin message',
            'sent_at' => now()->subMinutes(2)
        ]);
        
        $secondChat = AdminChat::factory()->create([
            'user_id' => $admin->id,
            'message' => 'Second admin message',
            'sent_at' => now()->subMinute()
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect($messages[0]['message'])->toBe('First admin message');
        expect($messages[1]['message'])->toBe('Second admin message');
    });

    test('limit parameter controls number of admin messages returned', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        AdminChat::factory()->count(10)->create(['user_id' => $admin->id]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat?limit=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'messages');
    });

    test('before_id parameter allows pagination for admin chat', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        
        // Create chats with explicit timestamps to ensure predictable ordering
        $firstChat = AdminChat::factory()->create(['user_id' => $admin->id, 'sent_at' => now()->subMinutes(5)]);
        $secondChat = AdminChat::factory()->create(['user_id' => $admin->id, 'sent_at' => now()->subMinutes(4)]);
        $thirdChat = AdminChat::factory()->create(['user_id' => $admin->id, 'sent_at' => now()->subMinutes(3)]);
        $fourthChat = AdminChat::factory()->create(['user_id' => $admin->id, 'sent_at' => now()->subMinutes(2)]);
        $fifthChat = AdminChat::factory()->create(['user_id' => $admin->id, 'sent_at' => now()->subMinutes(1)]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/admin/chat?before_id={$thirdChat->id}");

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect(count($messages))->toBe(2); // Should return the 2 messages before the third one (first and second)
    });

    test('is_own flag is set correctly for admin messages', function () {
        $admin1 = User::factory()->create(['is_admin' => true]);
        $admin2 = User::factory()->create(['is_admin' => true]);
        
        AdminChat::factory()->create(['user_id' => $admin1->id, 'message' => 'My admin message']);
        AdminChat::factory()->create(['user_id' => $admin2->id, 'message' => 'Other admin message']);
        
        Sanctum::actingAs($admin1);

        $response = $this->getJson('/api/admin/chat');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        $myMessage = collect($messages)->firstWhere('message', 'My admin message');
        $otherMessage = collect($messages)->firstWhere('message', 'Other admin message');
        
        expect($myMessage['is_own'])->toBe(true);
        expect($otherMessage['is_own'])->toBe(false);
    });
});

describe('Admin Chat Store', function () {
    test('admin can send messages', function () {
        Event::fake();
        
        $admin = User::factory()->create(['name' => 'Admin User', 'is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/chat', [
            'message' => 'Hello from admin'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
            ])
            ->assertJson([
                'message' => [
                    'message' => 'Hello from admin',
                    'display_name' => 'Admin User',
                    'is_own' => true,
                ]
            ]);

        $this->assertDatabaseHas('admin_chats', [
            'message' => 'Hello from admin',
            'user_id' => $admin->id,
        ]);

        Event::assertDispatched(AdminMessageSent::class);
    });

    test('non-admin cannot send admin messages', function () {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/admin/chat', [
            'message' => 'Trying to send admin message'
        ]);

        $response->assertStatus(403);
    });

    test('admin message is required', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    });

    test('admin message cannot exceed maximum length', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);
        
        $longMessage = str_repeat('a', 1001); // 1001 characters, above max of 1000

        $response = $this->postJson('/api/admin/chat', [
            'message' => $longMessage
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    });
});

describe('Admin Chat Recent', function () {
    test('admin can fetch recent messages', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        AdminChat::factory()->count(15)->create(['user_id' => $admin->id]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat/recent');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'messages' => [
                    '*' => ['id', 'message', 'display_name', 'sent_at', 'is_own']
                ]
            ])
            ->assertJsonCount(10, 'messages'); // Should return only 10 most recent
    });

    test('non-admin cannot fetch recent admin messages', function () {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/admin/chat/recent');

        $response->assertStatus(403);
    });

    test('admin recent messages are in chronological order', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        
        $firstChat = AdminChat::factory()->create([
            'user_id' => $admin->id,
            'message' => 'Older admin message',
            'sent_at' => now()->subHour()
        ]);
        
        $secondChat = AdminChat::factory()->create([
            'user_id' => $admin->id,
            'message' => 'Newer admin message',
            'sent_at' => now()
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/chat/recent');

        $response->assertStatus(200);
        
        $messages = $response->json('messages');
        expect($messages[0]['message'])->toBe('Older admin message');
        expect($messages[1]['message'])->toBe('Newer admin message');
    });
});

describe('Admin Chat Typing', function () {
    test('admin can send typing indicator', function () {
        Event::fake();
        
        $admin = User::factory()->create(['name' => 'Admin User', 'is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/chat/typing', [
            'is_typing' => true
        ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'ok']);

        Event::assertDispatched(AdminUserTyping::class, function ($event) {
            return $event->user['display_name'] === 'Admin User' && $event->isTyping === true;
        });
    });

    test('non-admin cannot send admin typing indicator', function () {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/admin/chat/typing', [
            'is_typing' => true
        ]);

        $response->assertStatus(403);
    });

    test('admin typing indicator requires is_typing field', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/chat/typing', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_typing']);
    });

    test('admin typing indicator is_typing must be boolean', function () {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/chat/typing', [
            'is_typing' => 'not-boolean'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['is_typing']);
    });
});