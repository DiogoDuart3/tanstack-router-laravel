<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ChatController extends Controller
{
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

        $formattedMessages = $messages->map(function (Chat $chat) {
            return [
                'id' => $chat->id,
                'message' => $chat->message,
                'display_name' => $chat->display_name,
                'sent_at' => $chat->sent_at->toISOString(),
                'is_own' => Auth::check() && Auth::id() === $chat->user_id,
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
            'username' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();

        // Create a temporary chat instance for broadcasting
        $tempChat = new Chat([
            'user_id' => $user?->id,
            'username' => $user ? null : ($request->input('username') ?: 'Anonymous'),
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
            'username' => $user ? null : ($request->input('username') ?: 'Anonymous'),
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

        $formattedMessages = $messages->map(function (Chat $chat) {
            return [
                'id' => $chat->id,
                'message' => $chat->message,
                'display_name' => $chat->display_name,
                'sent_at' => $chat->sent_at->toISOString(),
                'is_own' => Auth::check() && Auth::id() === $chat->user_id,
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
            'username' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();
        $displayName = $user?->name ?? ($request->input('username') ?: 'Anonymous');
        $isTyping = $request->boolean('is_typing');

        // Broadcast typing indicator
        broadcast(new UserTyping($displayName, $isTyping));

        return response()->json(['status' => 'ok']);
    }
}
