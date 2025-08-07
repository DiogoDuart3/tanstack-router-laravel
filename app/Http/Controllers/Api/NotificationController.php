<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Notifications\PushNotificationDemo;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Trigger a demo notification that will be sent via queue after 3 seconds
     */
    public function sendDemo(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Get custom message or use default
            $title = $request->input('title', '🚀 Server Notification');
            $message = $request->input('message', 'This notification was sent from the Laravel server via the queue system!');
            $type = $request->input('type', 'server-demo');
            $icon = $request->input('icon', '🔔');

            // Send the notification (will be queued and delayed by 3 seconds)
            $notification = new PushNotificationDemo($title, $message, $type, $icon);
            $user->notify($notification);
            
            // Also send push notification
            $pushService = new PushNotificationService();
            $pushService->sendToUser($user, $title, $message, [
                'type' => $type,
                'icon' => $icon
            ]);

            Log::info('Demo notification queued for user', [
                'user_id' => $user->id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'delay' => '3 seconds'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification queued! It will be sent in 3 seconds.',
                'queued_at' => now()->toISOString(),
                'will_send_at' => now()->addSeconds(3)->toISOString(),
                'notification_data' => [
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'icon' => $icon
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to queue demo notification', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to queue notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send an immediate notification (useful for testing)
     */
    public function sendImmediate(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $title = $request->input('title', '⚡ Immediate Server Notification');
            $message = $request->input('message', 'This notification was sent immediately from the server!');
            $type = $request->input('type', 'server-immediate');
            $icon = $request->input('icon', '⚡');

            // Create notification without delay
            $notification = new PushNotificationDemo($title, $message, $type, $icon);
            $notification->delay = null; // Remove delay for immediate sending
            
            $user->notify($notification);

            // Also send push notification immediately
            $pushService = new PushNotificationService();
            $pushService->sendToUser($user, $title, $message, [
                'type' => $type,
                'icon' => $icon
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification sent immediately!',
                'sent_at' => now()->toISOString(),
                'notification_data' => [
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'icon' => $icon
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send immediate notification', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's recent notifications
     */
    public function getNotifications(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $limit = $request->input('limit', 10);
            
            $notifications = $user->notifications()
                ->latest()
                ->limit($limit)
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'notifications' => $notifications,
                'count' => $notifications->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch notifications', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get VAPID public key for push notifications
     */
    public function getVapidKey(): JsonResponse
    {
        return response()->json([
            'vapid_public_key' => config('webpush.vapid.public_key')
        ]);
    }

    /**
     * Subscribe user to push notifications
     */
    public function subscribe(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $request->validate([
                'endpoint' => 'required|string',
                'keys' => 'required|array',
                'keys.p256dh' => 'required|string',
                'keys.auth' => 'required|string',
            ]);

            // Store subscription using our PushSubscription model
            PushSubscription::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'endpoint' => $request->input('endpoint')
                ],
                [
                    'p256dh_key' => $request->input('keys.p256dh'),
                    'auth_key' => $request->input('keys.auth'),
                    'user_agent' => $request->header('User-Agent', 'Unknown'),
                ]
            );

            Log::info('Push subscription stored for user', [
                'user_id' => $user->id,
                'endpoint' => substr($request->input('endpoint'), -20) // Last 20 chars for privacy
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully subscribed to push notifications'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to store push subscription', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to subscribe: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unsubscribe user from push notifications
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Delete all subscriptions for the user
            $user->pushSubscriptions()->delete();

            Log::info('Push subscriptions removed for user', [
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully unsubscribed from push notifications'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to unsubscribe from push notifications', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to unsubscribe: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send test push notification
     */
    public function testPush(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $pushService = new PushNotificationService();
            $results = $pushService->sendTestNotification($user);

            if (empty($results)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No push subscriptions found for user'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Test push notification sent!',
                'subscription_count' => count($results),
                'results' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send test push notification', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send test push: ' . $e->getMessage()
            ], 500);
        }
    }
}
