<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Carbon\Carbon;

class PushNotificationDemo extends Notification implements ShouldQueue
{
    use Queueable;

    public string $title;
    public string $message;
    public string $type;
    public string $icon;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        string $title = '🚀 Server Notification',
        string $message = 'This notification was sent from the Laravel server via the queue system!',
        string $type = 'server-demo',
        string $icon = '🔔'
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->icon = $icon;
        
        // Delay the notification by 3 seconds
        $this->delay = now()->addSeconds(3);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['broadcast', 'database'];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon,
            'timestamp' => now()->toISOString(),
            'user_id' => $notifiable->id,
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return ['private-notifications'];
    }

    /**
     * Get the data to broadcast with the notification.
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->id,
                'type' => $this->type,
                'title' => $this->title,
                'message' => $this->message,
                'icon' => $this->icon,
                'timestamp' => now()->toISOString(),
            ],
        ];
    }

}
