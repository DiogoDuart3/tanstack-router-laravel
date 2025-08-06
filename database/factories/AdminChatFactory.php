<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdminChat>
 */
class AdminChatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(['is_admin' => true]),
            'message' => fake()->sentence(),
            'sent_at' => fake()->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
