<?php

namespace App\Http\Controllers\Api;

use App\Events\AdminMessageSent;
use App\Events\AdminUserTyping;
use App\Http\Controllers\Controller;
use App\Models\AdminChat;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AdminChatController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'admin']);
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'integer|min:1|max:100',
            'before_id' => 'integer|exists:admin_chats,id',
        ]);

        $limit = $request->input('limit', 50);
        $beforeId = $request->input('before_id');

        $query = AdminChat::with('user:id,name')
            ->orderBy('sent_at', 'desc')
            ->orderBy('id', 'desc');

        if ($beforeId) {
            $beforeChat = AdminChat::find($beforeId);
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

        $formattedMessages = $messages->map(function (AdminChat $adminChat) {
            return [
                'id' => $adminChat->id,
                'message' => $adminChat->message,
                'display_name' => $adminChat->display_name,
                'sent_at' => $adminChat->sent_at->toISOString(),
                'is_own' => Auth::id() === $adminChat->user_id,
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

        $user = Auth::user();
        
        $adminChat = AdminChat::create([
            'user_id' => $user->id,
            'message' => $request->input('message'),
            'sent_at' => now(),
        ]);

        $adminChat->load('user:id,name');

        // Broadcast the message to all connected admin clients
        broadcast(new AdminMessageSent($adminChat));

        return response()->json([
            'message' => [
                'id' => $adminChat->id,
                'message' => $adminChat->message,
                'display_name' => $adminChat->display_name,
                'sent_at' => $adminChat->sent_at->toISOString(),
                'is_own' => true,
            ],
        ], 201);
    }

    public function recent(): JsonResponse
    {
        $messages = AdminChat::with('user:id,name')
            ->orderBy('sent_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->reverse()
            ->values();

        $formattedMessages = $messages->map(function (AdminChat $adminChat) {
            return [
                'id' => $adminChat->id,
                'message' => $adminChat->message,
                'display_name' => $adminChat->display_name,
                'sent_at' => $adminChat->sent_at->toISOString(),
                'is_own' => Auth::id() === $adminChat->user_id,
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

        $user = Auth::user();
        $displayName = $user->name;
        $isTyping = $request->boolean('is_typing');

        // Broadcast typing indicator
        broadcast(new AdminUserTyping($displayName, $isTyping));

        return response()->json(['status' => 'ok']);
    }
}
