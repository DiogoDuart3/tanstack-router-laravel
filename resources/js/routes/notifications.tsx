import NotificationDemo from '@/components/notification-demo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notifications')({
    component: NotificationsPage,
});

function NotificationsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Notification Demo</h1>
                <p className="mt-2 text-muted-foreground">
                    Test push notifications in both browser and PWA modes. Click the buttons below to try different notification types.
                </p>
            </div>

            <div className="space-y-8">
                <NotificationDemo />
            </div>
        </div>
    );
}
