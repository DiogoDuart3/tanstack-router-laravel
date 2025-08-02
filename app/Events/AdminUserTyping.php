<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class AdminUserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $isTyping;

    /**
     * Create a new event instance.
     */
    public function __construct(string $displayName, bool $isTyping = true)
    {
        $this->user = [
            'display_name' => $displayName,
            'user_id' => Auth::id(),
        ];
        $this->isTyping = $isTyping;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('admin-chat-typing'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'user' => $this->user,
            'is_typing' => $this->isTyping,
        ];
    }
}
