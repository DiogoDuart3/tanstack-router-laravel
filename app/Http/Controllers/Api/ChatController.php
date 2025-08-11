<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class ChatController extends Controller
{
    /**
     * Get the authenticated user from the request, handling optional authentication
     */
    private function getAuthenticatedUser(Request $request): ?User
    {
        // First try the standard Auth facade
        if (Auth::check()) {
            return Auth::user();
        }

        // If not authenticated via middleware, try to authenticate manually
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken && !$accessToken->expires_at || $accessToken->expires_at->isFuture()) {
                return $accessToken->tokenable;
            }
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'integer|min:1|max:100',
            'before_id' => 'integer|exists:chats,id',
        ]);

        $limit = $request->input('limit', 50);
        $beforeId = $request->input('before_id');

        $query = Chat::with('user:id,name')
            ->orderBy('sent_at', 'desc')
            ->orderBy('id', 'desc');

        if ($beforeId) {
            $beforeChat = Chat::find($beforeId);
            if ($beforeChat) {
                $query->where(function ($q) use ($beforeChat) {
                    $q->where('sent_at', '<', $beforeChat->sent_at)
                      ->orWhere(function ($subQ) use ($beforeChat) {
                          $subQ->where('sent_at', '=', $beforeChat->sent_at)
                               ->where('id', '<', $beforeChat->id);
                      });
                });
            }
        }

        $messages = $query->limit($limit)->get();

        // Reverse to show oldest first
        $messages = $messages->reverse()->values();

        $currentUser = $this->getAuthenticatedUser($request);

        $formattedMessages = $messages->map(function (Chat $chat) use ($currentUser) {
            return [
                'id' => $chat->id,
                'message' => $chat->message,
                'display_name' => $chat->display_name,
                'sent_at' => $chat->sent_at->toISOString(),
                'is_own' => $currentUser && $currentUser->id === $chat->user_id,
            ];
        });

        return response()->json([
            'messages' => $formattedMessages,
            'has_more' => $messages->count() === $limit,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $user = $this->getAuthenticatedUser($request);
        $displayName = $user?->name ?: 'Anonymous';

        // Create a temporary chat instance for broadcasting
        $tempChat = new Chat([
            'user_id' => $user?->id,
            'username' => null,
            'message' => $request->input('message'),
            'sent_at' => now(),
        ]);

        // Set the user relationship for the temporary instance
        if ($user) {
            $tempChat->setRelation('user', $user);
        }

        // Broadcast the message to all connected clients first
        broadcast(new MessageSent($tempChat));

        // Now save the chat to the database
        $chat = Chat::create([
            'user_id' => $user?->id,
            'username' => null,
            'message' => $request->input('message'),
            'sent_at' => now(),
        ]);

        $chat->load('user:id,name');

        return response()->json([
            'message' => [
                'id' => $chat->id,
                'message' => $chat->message,
                'display_name' => $chat->display_name,
                'sent_at' => $chat->sent_at->toISOString(),
                'is_own' => true,
            ],
        ], 201);
    }

    public function recent(): JsonResponse
    {
        $messages = Chat::with('user:id,name')
            ->orderBy('sent_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->reverse()
            ->values();

        $currentUser = $this->getAuthenticatedUser(request());

        $formattedMessages = $messages->map(function (Chat $chat) use ($currentUser) {
            return [
                'id' => $chat->id,
                'message' => $chat->message,
                'display_name' => $chat->display_name,
                'sent_at' => $chat->sent_at->toISOString(),
                'is_own' => $currentUser && $currentUser->id === $chat->user_id,
            ];
        });

        return response()->json([
            'messages' => $formattedMessages,
        ]);
    }

    public function typing(Request $request): JsonResponse
    {
        $request->validate([
            'is_typing' => 'required|boolean',
        ]);

        $user = $this->getAuthenticatedUser($request);

        // Determine display name: use user name for authenticated users, Anonymous for guests
        $displayName = $user?->name ?: 'Anonymous';
        $isTyping = $request->boolean('is_typing');

        // Broadcast typing indicator
        broadcast(new UserTyping($displayName, $isTyping));

        return response()->json(['status' => 'ok']);
    }
}
