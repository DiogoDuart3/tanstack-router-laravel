<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('endpoint');
            $table->string('p256dh_key');
            $table->string('auth_key');
            $table->string('user_agent')->nullable();
            $table->timestamps();

            // Ensure unique subscription per user per endpoint
            $table->unique(['user_id', 'endpoint']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
