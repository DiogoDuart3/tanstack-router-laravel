<?php

namespace App\Events;

use App\Models\AdminChat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class AdminMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(AdminChat $adminChat)
    {
        $this->message = [
            'id' => $adminChat->id,
            'message' => $adminChat->message,
            'display_name' => $adminChat->display_name,
            'sent_at' => $adminChat->sent_at->toISOString(),
            'is_own' => Auth::check() && Auth::id() === $adminChat->user_id,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('admin-chat'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}
