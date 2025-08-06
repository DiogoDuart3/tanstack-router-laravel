<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

class BroadcastAuthController extends Controller
{
    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        $channelName = $request->input('channel_name');
        
        // Try to authenticate via session first
        if (Auth::guard('web')->check()) {
            return $this->authorizeChannel($request, Auth::guard('web')->user());
        }

        // Try to authenticate via Sanctum token
        if ($request->bearerToken()) {
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                return $this->authorizeChannel($request, $user);
            }
        }

        // For public channels, allow access without authentication
        if (in_array($channelName, ['public-chat', 'public-chat-typing'])) {
            return response()->json(true);
        }

        // If no authentication and not a public channel, deny access
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    /**
     * Authorize the authenticated user for the channel
     */
    private function authorizeChannel(Request $request, $user)
    {
        $channelName = $request->input('channel_name');
        
        // Handle different channel types
        switch (true) {
            case $channelName === 'private-notifications':
                // Any authenticated user can access general notifications
                return response()->json(true);
                
            case str_starts_with($channelName, 'private-notifications.'):
                // Extract user ID from channel name like "private-notifications.1"
                $userId = (int) str_replace('private-notifications.', '', $channelName);
                return response()->json($user->id === $userId);
                
            case $channelName === 'admin-chat':
            case $channelName === 'admin-chat-typing':
                // Only admins can access admin channels
                return response()->json($user->isAdmin() ?? false);
                
            case in_array($channelName, ['public-chat', 'public-chat-typing']):
                // Public channels - always allow
                return response()->json(true);
                
            default:
                // For any other private channels, use Laravel's default authorization
                try {
                    return Broadcast::auth($request);
                } catch (\Exception $e) {
                    return response()->json(['error' => 'Channel not authorized'], 403);
                }
        }
    }
}