<?php

namespace Tests\Unit;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoTest extends TestCase
{
    use RefreshDatabase;

    public function test_todo_can_be_created_with_fillable_attributes()
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

        $this->assertInstanceOf(Todo::class, $todo);
        $this->assertEquals('Test Todo', $todo->title);
        $this->assertEquals('Test Description', $todo->description);
        $this->assertFalse($todo->completed);
        $this->assertEquals($user->id, $todo->user_id);
    }

    public function test_todo_belongs_to_user()
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

        $this->assertInstanceOf(User::class, $todo->user);
        $this->assertEquals($user->id, $todo->user->id);
        $this->assertEquals('Test User', $todo->user->name);
    }

    public function test_completed_is_casted_to_boolean()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $todo = Todo::create([
            'title' => 'Test Todo',
            'description' => 'Test Description',
            'completed' => 1, // Integer value
            'user_id' => $user->id,
        ]);

        $this->assertIsBool($todo->completed);
        $this->assertTrue($todo->completed);
    }

    public function test_images_is_casted_to_array()
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
            'images' => ['image1.jpg', 'image2.jpg'],
        ]);

        $this->assertIsArray($todo->images);
        $this->assertEquals(['image1.jpg', 'image2.jpg'], $todo->images);
    }

    public function test_get_image_urls_attribute_returns_empty_array_when_no_images()
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

        $this->assertEquals([], $todo->image_urls);
    }

    public function test_get_image_urls_attribute_returns_correct_urls()
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
            'images' => ['todos/image1.jpg', 'todos/image2.jpg'],
        ]);

        $expectedUrls = [
            asset('storage/todos/image1.jpg'),
            asset('storage/todos/image2.jpg'),
        ];

        $this->assertEquals($expectedUrls, $todo->image_urls);
    }

    public function test_get_primary_image_url_attribute_returns_null_when_no_primary_image()
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

        $this->assertNull($todo->primary_image_url);
    }

    public function test_get_primary_image_url_attribute_returns_correct_url()
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
            'primary_image' => 'todos/primary.jpg',
        ]);

        $expectedUrl = asset('storage/todos/primary.jpg');
        $this->assertEquals($expectedUrl, $todo->primary_image_url);
    }

    public function test_add_image_method_adds_image_to_images_array()
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

        $todo->addImage('new-image.jpg');

        $this->assertEquals(['new-image.jpg'], $todo->images);
    }

    public function test_add_image_method_sets_primary_image_when_is_primary_is_true()
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

        $todo->addImage('primary-image.jpg', true);

        $this->assertEquals('primary-image.jpg', $todo->primary_image);
        $this->assertEquals(['primary-image.jpg'], $todo->images);
    }

    public function test_add_image_method_sets_primary_image_when_no_primary_image_exists()
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

        $todo->addImage('first-image.jpg');

        $this->assertEquals('first-image.jpg', $todo->primary_image);
    }

    public function test_remove_image_method_removes_image_from_array()
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
            'images' => ['image1.jpg', 'image2.jpg', 'image3.jpg'],
            'primary_image' => 'image2.jpg',
        ]);

        $todo->removeImage('image2.jpg');

        $this->assertEquals(['image1.jpg', 'image3.jpg'], $todo->images);
    }

    public function test_remove_image_method_updates_primary_image_when_removed()
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
            'images' => ['image1.jpg', 'image2.jpg'],
            'primary_image' => 'image2.jpg',
        ]);

        $todo->removeImage('image2.jpg');

        $this->assertEquals('image1.jpg', $todo->primary_image);
    }

    public function test_remove_image_method_sets_primary_image_to_null_when_no_images_remain()
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
            'images' => ['image1.jpg'],
            'primary_image' => 'image1.jpg',
        ]);

        $todo->removeImage('image1.jpg');

        $this->assertNull($todo->primary_image);
        $this->assertEquals([], $todo->images);
    }
}
