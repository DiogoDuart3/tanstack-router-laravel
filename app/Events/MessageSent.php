<?php

namespace App\Events;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Get the authenticated user from the request, handling optional authentication
     */
    private function getAuthenticatedUser(): ?User
    {
        // First try the standard Auth facade
        if (Auth::check()) {
            return Auth::user();
        }

        // If not authenticated via middleware, try to authenticate manually
        $request = request();
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken && !$accessToken->expires_at || $accessToken->expires_at->isFuture()) {
                return $accessToken->tokenable;
            }
        }

        return null;
    }

    /**
     * Create a new event instance.
     */
    public function __construct(Chat $chat)
    {
        // Determine display name: use user name for authenticated users, Anonymous for guests
        $displayName = $chat->user?->name ?: 'Anonymous';

        $currentUser = $this->getAuthenticatedUser();

        $this->message = [
            'id' => $chat->id,
            'message' => $chat->message,
            'display_name' => $displayName,
            'sent_at' => $chat->sent_at->toISOString(),
            'is_own' => $currentUser && $currentUser->id === $chat->user_id,
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
            new Channel('public-chat'),
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
