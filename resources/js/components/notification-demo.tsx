import { NotificationManager } from '@/lib/notifications';
import { useState } from 'react';

export default function NotificationDemo() {
    const [status, setStatus] = useState(() => NotificationManager.getStatus());
    const [isLoading, setIsLoading] = useState(false);
    const [lastNotificationResult, setLastNotificationResult] = useState<string | null>(null);

    const refreshStatus = () => {
        setStatus(NotificationManager.getStatus());
    };

    const handleRequestPermission = async () => {
        setIsLoading(true);
        try {
            const permission = await NotificationManager.requestPermission();
            setLastNotificationResult(`Permission ${permission === 'granted' ? 'granted' : 'denied'}`);
            refreshStatus();
        } catch (error) {
            setLastNotificationResult('Error requesting permission');
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
            setLastNotificationResult('Error sending notification');
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
                            onClick={handleRequestPermission}
                            disabled={isLoading || !status.isSupported}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isLoading ? '⏳' : '🔔'} Request Permission
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
                </div>

                {lastNotificationResult && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                        <p className="text-sm text-blue-800 dark:text-blue-300">💡 {lastNotificationResult}</p>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">💡 Tips</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Notifications work in both browser and PWA modes</p>
                    <p>• PWA notifications can appear even when the app is closed</p>
                    <p>• Browser notifications only work when the tab is open</p>
                    <p>• Install the app for the best notification experience</p>
                    <p>• Some browsers may block notifications on localhost</p>
                </div>
            </div>
        </div>
    );
}
