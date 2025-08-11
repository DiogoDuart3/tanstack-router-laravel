<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Todo;
use App\Models\PushSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_be_created_with_fillable_attributes()
    {
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'is_admin' => false,
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
        $this->assertFalse($user->is_admin);
    }

    public function test_user_is_admin_returns_correct_boolean()
    {
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'is_admin' => true,
        ]);

        $regularUser = User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => 'password123',
            'is_admin' => false,
        ]);

        $this->assertTrue($adminUser->isAdmin());
        $this->assertFalse($regularUser->isAdmin());
    }

    public function test_user_has_todos_relationship()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $todo = Todo::create([
            'title' => 'Test Todo',
            'description' => 'Test Description',
            'completed' => false,
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(Todo::class, $user->todos->first());
        $this->assertEquals('Test Todo', $user->todos->first()->title);
        $this->assertCount(1, $user->todos);
    }

    public function test_user_has_push_subscriptions_relationship()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push',
            'p256dh_key' => 'test_p256dh_key',
            'auth_key' => 'test_auth_key',
        ]);

        $this->assertInstanceOf(PushSubscription::class, $user->pushSubscriptions->first());
        $this->assertEquals('https://example.com/push', $user->pushSubscriptions->first()->endpoint);
        $this->assertCount(1, $user->pushSubscriptions);
    }

    public function test_password_is_hidden_from_serialization()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $userArray = $user->toArray();

        $this->assertArrayNotHasKey('password', $userArray);
        $this->assertArrayNotHasKey('remember_token', $userArray);
        $this->assertArrayHasKey('name', $userArray);
        $this->assertArrayHasKey('email', $userArray);
    }

    public function test_is_admin_is_casted_to_boolean()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'is_admin' => 1, // Integer value
        ]);

        $this->assertIsBool($user->is_admin);
        $this->assertTrue($user->is_admin);
    }
}
