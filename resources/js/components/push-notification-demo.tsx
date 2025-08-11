import { useState, useEffect } from 'react';
import { NotificationManager } from '../lib/notifications';

export function PushNotificationDemo() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkSupport = async () => {
            const basicSupport = 'serviceWorker' in navigator && 'PushManager' in window;

            // Check iOS-specific support
            let iosSupported = true;
            if (basicSupport) {
                const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
                if (isIOS) {
                    const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
                    if (versionMatch) {
                        const major = parseInt(versionMatch[1], 10);
                        const minor = parseInt(versionMatch[2], 10);
                        iosSupported = major > 16 || (major === 16 && minor >= 4);

                        if (!iosSupported) {
                            console.warn(`iOS ${major}.${minor} detected. Push notifications require iOS 16.4+`);
                        }
                    }
                }
            }

            const supported = basicSupport && iosSupported;
            setIsSupported(supported);

            if (supported) {
                // Check if already subscribed
                const subscribed = await NotificationManager.isSubscribedToPush();
                setIsSubscribed(subscribed);
                setPermission(Notification.permission);
            }
        };

        checkSupport();
    }, []);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const success = await NotificationManager.subscribeToPush();
            if (success) {
                setIsSubscribed(true);
                setPermission('granted');
                console.log('Successfully subscribed to push notifications');
            } else {
                console.error('Failed to subscribe to push notifications');
            }
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const success = await NotificationManager.unsubscribeFromPush();
            if (success) {
                setIsSubscribed(false);
                console.log('Successfully unsubscribed from push notifications');
            } else {
                console.error('Failed to unsubscribe from push notifications');
            }
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestPush = async () => {
        setLoading(true);
        try {
            const success = await NotificationManager.testPushNotification();
            if (success) {
                console.log('Test push notification sent!');
            } else {
                console.error('Failed to send test push notification');
            }
        } catch (error) {
            console.error('Failed to send test push notification:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestLocalNotification = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🧪 Local Test Notification', {
                body: 'This is a local notification to test if notifications work at all',
                icon: '/favicon.ico',
                tag: 'local-test'
            });
            console.log('Local test notification shown');
        } else {
            console.error('Notifications not available or permission not granted');
            console.log('Notification support:', 'Notification' in window);
            console.log('Permission status:', Notification.permission);
        }
    };

    const handleDebugServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker Debug Info:', {
                active: !!registration.active,
                installing: !!registration.installing,
                waiting: !!registration.waiting,
                scope: registration.scope,
                pushManager: !!registration.pushManager,
                showNotification: typeof registration.showNotification
            });

            // Test service worker notification directly
            try {
                await registration.showNotification('🔧 SW Direct Test', {
                    body: 'This notification was called directly from the service worker registration',
                    icon: '/favicon.ico',
                    tag: 'sw-direct-test'
                });
                console.log('Direct service worker notification sent');
            } catch (error) {
                console.error('Direct SW notification failed:', error);
            }
        }
    };

    if (!isSupported) {
        const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        return (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 mb-2">
                    Push notifications are not supported in this browser.
                </p>
                {isIOS && (
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                        <p className="font-medium mb-1">For iPhone users:</p>
                        <ul className="list-disc ml-4 space-y-1">
                            <li>iOS 16.4+ is required for push notifications</li>
                            {!isStandalone && (
                                <li>Install this app to your home screen for full notification support</li>
                            )}
                            <li>Tap the Share button → "Add to Home Screen"</li>
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Background Push Notifications
            </h3>

            <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {isSubscribed ? '✅ Subscribed' : '❌ Not subscribed'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permission: {permission}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {!isSubscribed ? (
                    <button
                        onClick={handleSubscribe}
                        disabled={loading || permission === 'denied'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Subscribing...' : 'Enable Push Notifications'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleUnsubscribe}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Unsubscribing...' : 'Disable Push Notifications'}
                        </button>
                        <button
                            onClick={handleTestPush}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Test Background Notification'}
                        </button>
                        <button
                            onClick={handleTestLocalNotification}
                            disabled={permission !== 'granted'}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            Test Local Notification
                        </button>
                        <button
                            onClick={handleDebugServiceWorker}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                            Debug Service Worker
                        </button>
                    </>
                )}
            </div>

            {permission === 'denied' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400">
                        Push notifications are blocked. Please enable them in your browser settings and refresh the page.
                    </p>
                </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>How to test:</strong>
                    <br />
                    1. Click "Enable Push Notifications" and grant permission
                    <br />
                    2. Close this PWA or switch to another app
                    <br />
                    3. Click "Test Background Notification" - you should receive a notification even when the app is closed
                </p>
            </div>
        </div>
    );
}
