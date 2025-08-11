import { NotificationManager } from '@/lib/notifications';
import { notificationApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function NotificationDemo() {
    const [status, setStatus] = useState(() => NotificationManager.getStatus());
    const [isLoading, setIsLoading] = useState(false);
    const [lastNotificationResult, setLastNotificationResult] = useState<string | null>(null);
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);

    const refreshStatus = async () => {
        setStatus(NotificationManager.getStatus());
        setPushSupported(NotificationManager.isPushSupported());
        setIsPushSubscribed(await NotificationManager.isSubscribedToPush());
    };

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            // First request permission
            const permission = await NotificationManager.requestPermission();
            if (permission !== 'granted') {
                setLastNotificationResult(`Permission ${permission === 'denied' ? 'denied' : 'not granted'}`);
                await refreshStatus();
                return;
            }

            // If permission granted and push is supported, also subscribe to push
            if (NotificationManager.isPushSupported()) {
                const pushSuccess = await NotificationManager.subscribeToPush();
                if (pushSuccess) {
                    setLastNotificationResult('✅ Notifications enabled with push support!');
                } else {
                    setLastNotificationResult('✅ Notifications enabled (push subscription failed)');
                }
            } else {
                setLastNotificationResult('✅ Notifications enabled (push not supported)');
            }

            await refreshStatus();
        } catch (error) {
            setLastNotificationResult('Error enabling notifications: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowWelcome = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.showWelcomeNotification();
            setLastNotificationResult(success ? 'Welcome notification sent!' : 'Failed to send notification');
        } catch (error) {
            setLastNotificationResult('Error sending notification: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowTodoReminder = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.showTodoReminder('Complete your daily tasks');
            setLastNotificationResult(success ? 'Todo reminder sent!' : 'Failed to send notification');
        } catch (error) {
            setLastNotificationResult('Error sending notification');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowChatMessage = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.showChatNotification('Demo User', 'Hey there! This is a test chat notification 👋');
            setLastNotificationResult(success ? 'Chat notification sent!' : 'Failed to send notification');
        } catch (error) {
            setLastNotificationResult('Error sending notification');
        } finally {
            setIsLoading(false);
        }
    };

    const handleServerDemo = async () => {
        setIsLoading(true);
        try {
            const response = await notificationApi.sendDemo({
                title: '🚀 Server Notification',
                message: 'This notification was sent from the Laravel server via the queue system! It was delayed by 3 seconds.',
                type: 'server-demo',
                icon: '🚀'
            });
            setLastNotificationResult(`Server notification queued! ${response.message} Will send at: ${new Date(response.will_send_at).toLocaleTimeString()}`);
        } catch (error) {
            setLastNotificationResult('Error queuing server notification: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleServerImmediate = async () => {
        setIsLoading(true);
        try {
            const response = await notificationApi.sendImmediate({
                title: '⚡ Immediate Server Notification',
                message: 'This notification was sent immediately from the Laravel server!',
                type: 'server-immediate',
                icon: '⚡'
            });
            setLastNotificationResult(`Server notification sent immediately! ${response.message}`);
        } catch (error) {
            setLastNotificationResult('Error sending immediate notification: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribeToPush = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.subscribeToPush();
            if (success) {
                setLastNotificationResult('✅ Successfully subscribed to push notifications!');
                await refreshStatus(); // Refresh status after successful subscription
            } else {
                setLastNotificationResult('❌ Failed to subscribe to push notifications');
            }
        } catch (error) {
            setLastNotificationResult('Error subscribing to push notifications: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribeFromPush = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.unsubscribeFromPush();
            if (success) {
                setLastNotificationResult('✅ Successfully unsubscribed from push notifications!');
                await refreshStatus(); // Refresh status after successful unsubscription
            } else {
                setLastNotificationResult('❌ Failed to unsubscribe from push notifications');
            }
        } catch (error) {
            setLastNotificationResult('Error unsubscribing from push notifications: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestPushNotification = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationManager.testPushNotification();
            if (success) {
                setLastNotificationResult('🧪 Test push notification sent! Check your device.');
            } else {
                setLastNotificationResult('❌ Failed to send test push notification');
            }
        } catch (error) {
            setLastNotificationResult('Error sending test push notification: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize push notification status
    useEffect(() => {
        refreshStatus();
    }, []);

    // Listen for server notifications (handled globally now, this is just for UI feedback)
    useEffect(() => {
        const handleServerNotificationFeedback = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SERVER_NOTIFICATION_RECEIVED') {
                setLastNotificationResult(`🔔 Server notification received: ${event.data.title}`);
            }
        };

        // Listen for service worker messages about notifications
        navigator.serviceWorker?.addEventListener('message', handleServerNotificationFeedback);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServerNotificationFeedback);
        };
    }, []);

    // Query for recent server notifications
    const { data: serverNotifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationApi.getNotifications(5),
        refetchInterval: 10000, // Refetch every 10 seconds
    });

    const getPermissionBadgeColor = (permission: string) => {
        switch (permission) {
            case 'granted':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'denied':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Notification Status</h2>
                    <button onClick={refreshStatus} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        🔄 Refresh
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Browser Support:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                status.isSupported
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                        >
                            {status.isSupported ? '✅ Supported' : '❌ Not Supported'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Service Worker:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                status.isServiceWorkerSupported
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                        >
                            {status.isServiceWorkerSupported ? '✅ Available' : '❌ Not Available'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Permission:</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPermissionBadgeColor(status.permission)}`}>
                            {status.permission.charAt(0).toUpperCase() + status.permission.slice(1)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">App Type:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                status.isPWA
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}
                        >
                            {status.isPWA ? '📱 PWA (Installed)' : '🌐 Browser'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Push Support:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                pushSupported
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                        >
                            {pushSupported ? '✅ Supported' : '❌ Not Supported'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Push Subscription:</span>
                        <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                isPushSubscribed
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}
                        >
                            {isPushSubscribed ? '🔔 Subscribed' : '🔕 Not Subscribed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Demo Actions */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Try Notifications</h2>

                {!status.isSupported && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-sm text-red-800 dark:text-red-300">❌ Notifications are not supported in this browser.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {status.permission !== 'granted' && (
                        <button
                            onClick={handleEnableNotifications}
                            disabled={isLoading || !status.isSupported}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isLoading ? '⏳' : '🔔'} Enable Notifications
                        </button>
                    )}

                    <button
                        onClick={handleShowWelcome}
                        disabled={isLoading || !status.isSupported || status.permission !== 'granted'}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isLoading ? '⏳' : '🎉'} Show Welcome Notification
                    </button>

                    <button
                        onClick={handleShowTodoReminder}
                        disabled={isLoading || !status.isSupported || status.permission !== 'granted'}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700 disabled:bg-gray-400"
                    >
                        {isLoading ? '⏳' : '📝'} Show Todo Reminder
                    </button>

                    <button
                        onClick={handleShowChatMessage}
                        disabled={isLoading || !status.isSupported || status.permission !== 'granted'}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-gray-400"
                    >
                        {isLoading ? '⏳' : '💬'} Show Chat Notification
                    </button>

                    <div className="mt-4 border-t pt-4">
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Server Notifications (Requires Login)</h3>

                        <button
                            onClick={handleServerDemo}
                            disabled={isLoading || !status.isSupported || status.permission !== 'granted'}
                            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {isLoading ? '⏳' : '🚀'} Queue Server Notification (3s delay)
                        </button>

                        <button
                            onClick={handleServerImmediate}
                            disabled={isLoading || !status.isSupported || status.permission !== 'granted'}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-700 disabled:bg-gray-400"
                        >
                            {isLoading ? '⏳' : '⚡'} Send Immediate Server Notification
                        </button>
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Advanced Push Management</h3>
                        <p className="mb-3 text-xs text-muted-foreground">Push notifications are automatically enabled with the main "Enable Notifications" button above.</p>

                        {isPushSubscribed ? (
                            <>
                                <button
                                    onClick={handleTestPushNotification}
                                    disabled={isLoading}
                                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {isLoading ? '⏳' : '🧪'} Test Push Notification
                                </button>
                                <button
                                    onClick={handleUnsubscribeFromPush}
                                    disabled={isLoading}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {isLoading ? '⏳' : '🔕'} Unsubscribe from Push
                                </button>
                            </>
                        ) : pushSupported && status.permission === 'granted' ? (
                            <button
                                onClick={handleSubscribeToPush}
                                disabled={isLoading}
                                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isLoading ? '⏳' : '🔔'} Manual Push Subscribe
                            </button>
                        ) : (
                            <p className="text-xs text-muted-foreground">Push notifications not available or permission not granted.</p>
                        )}
                    </div>
                </div>

                {lastNotificationResult && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-800 dark:text-blue-300">💡 {lastNotificationResult}</p>
                    </div>
                )}
            </div>

            {/* Recent Server Notifications */}
            {serverNotifications && serverNotifications.notifications.length > 0 && (
                <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold">📨 Recent Server Notifications</h2>
                    <div className="space-y-3">
                        {serverNotifications.notifications.map((notification) => (
                            <div key={notification.id} className="flex items-start space-x-3 rounded-lg bg-muted/50 p-3">
                                <div className="text-lg">{notification.data.icon || '🔔'}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="text-sm font-medium">{notification.data.title}</div>
                                    <div className="text-xs text-muted-foreground">{notification.data.message}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleString()}
                                        {notification.read_at && ' • Read'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">💡 Tips</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>Client notifications</strong> work in both browser and PWA modes</p>
                    <p>• <strong>Server notifications</strong> use Laravel's queue system and WebSocket broadcasting</p>
                    <p>• <strong>Push notifications</strong> work even when the app is completely closed</p>
                    <p>• PWA notifications can appear even when the app is closed</p>
                    <p>• Browser notifications only work when the tab is open</p>
                    <p>• The queued server notification will arrive 3 seconds after clicking</p>
                    <p>• Push notifications require subscription and work on iOS 16.4+ Safari</p>
                    <p>• Install the app for the best notification experience</p>
                    <p>• Server and push notifications require user authentication</p>
                </div>
            </div>
        </div>
    );
}
