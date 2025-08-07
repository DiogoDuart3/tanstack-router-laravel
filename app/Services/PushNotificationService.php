<?php

namespace App\Services;

use App\Models\User;
use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ]);
    }

    /**
     * Send push notification to all user's subscriptions
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): array
    {
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            Log::info('No push subscriptions found for user', ['user_id' => $user->id]);
            return [];
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => '/favicon.ico',
            'tag' => 'notification-' . time(),
            'data' => $data,
            'timestamp' => time() * 1000,
        ]);

        $results = [];

        foreach ($subscriptions as $subscription) {
            try {
                $webPushSubscription = Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->p256dh_key,
                    'authToken' => $subscription->auth_key,
                ]);

                $result = $this->webPush->sendOneNotification($webPushSubscription, $payload);
                
                $results[] = [
                    'subscription_id' => $subscription->id,
                    'success' => $result->isSuccess(),
                    'reason' => $result->getReason()
                ];

                // Remove invalid subscriptions
                if (!$result->isSuccess() && in_array($result->getResponse()->getStatusCode(), [400, 404, 410, 413])) {
                    Log::info('Removing invalid push subscription', [
                        'subscription_id' => $subscription->id,
                        'reason' => $result->getReason()
                    ]);
                    $subscription->delete();
                }

            } catch (\Exception $e) {
                Log::error('Error sending push notification', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage()
                ]);
                
                $results[] = [
                    'subscription_id' => $subscription->id,
                    'success' => false,
                    'reason' => $e->getMessage()
                ];
            }
        }

        Log::info('Push notifications sent', [
            'user_id' => $user->id,
            'subscription_count' => count($subscriptions),
            'results' => $results
        ]);

        return $results;
    }

    /**
     * Send test push notification to user
     */
    public function sendTestNotification(User $user): array
    {
        return $this->sendToUser(
            $user,
            '🧪 Test Push Notification',
            'This is a test push notification sent from the Laravel server! Time: ' . now()->format('H:i:s'),
            [
                'type' => 'test-push',
                'timestamp' => now()->toISOString(),
            ]
        );
    }
}