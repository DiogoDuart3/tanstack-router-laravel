<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Chat>
 */
class ChatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => fake()->optional(0.7)->randomElement([\App\Models\User::factory()]), // 70% chance of having a user
            'username' => function (array $attributes) {
                return $attributes['user_id'] ? null : fake()->userName();
            },
            'message' => fake()->sentence(),
            'sent_at' => fake()->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
