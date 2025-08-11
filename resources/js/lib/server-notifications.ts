/**
 * Server notifications service for handling WebSocket notifications globally
 */
import { PushNotificationManager } from './push-notifications';

export class ServerNotificationService {
    private static initialized = false;

    /**
     * Initialize the server notification service
     */
    static initialize() {
        if (this.initialized) {
            console.log('ServerNotificationService already initialized');
            return;
        }

        console.log('ServerNotificationService: Initializing...');

        // Wait for both Echo AND user authentication to be available
        const checkEchoAndAuth = async () => {
            console.log('ServerNotificationService: Checking for Echo and auth...', !!window.Echo, 'Context:', typeof window, typeof document);

            if (window.Echo && window.Echo !== null) {
                console.log('ServerNotificationService: Echo found, checking authentication...');

                // Check if user is authenticated before setting up WebSocket
                const isAuthenticated = await this.checkAuthentication();

                if (isAuthenticated) {
                    console.log('ServerNotificationService: User authenticated, setting up listener');
                    this.setupNotificationListener();

                    // Initialize push notifications for background support
                    PushNotificationManager.initialize().then((success) => {
                        if (success) {
                            console.log('ServerNotificationService: ✅ Push notifications initialized');
                        } else {
                            console.warn('ServerNotificationService: ⚠️ Push notifications failed to initialize');
                        }
                    });

                    this.initialized = true;
                    console.log('ServerNotificationService: ✅ Initialized with Echo and auth');
                } else {
                    console.log('ServerNotificationService: User not authenticated, retrying in 2 seconds...');
                    setTimeout(checkEchoAndAuth, 2000);
                }
            } else {
                console.log('ServerNotificationService: Echo not available, retrying in 1 second...');
                setTimeout(checkEchoAndAuth, 1000);
            }
        };

        checkEchoAndAuth();
    }

    /**
     * Setup the global notification listener
     */
    private static setupNotificationListener() {
        if (!window.Echo) {
            console.error('ServerNotificationService: Echo is not available');
            return;
        }

        try {
            console.log('ServerNotificationService: Setting up private channel listener...');
            const channel = window.Echo.private('notifications');

            // Add connection status logging
            if (window.Echo.connector && window.Echo.connector.pusher) {
                const pusher = window.Echo.connector.pusher;
                console.log('ServerNotificationService: Pusher connection state:', pusher.connection.state);

                pusher.connection.bind('connected', () => {
                    console.log('ServerNotificationService: ✅ Pusher connected');
                });

                pusher.connection.bind('error', (err: Record<string, unknown>) => {
                    console.error('ServerNotificationService: ❌ Pusher connection error:', err);
                });
            }

            // Listen for notifications
            channel.notification((event: ServerNotificationEvent) => {
                console.log('ServerNotificationService: 🔔 Global server notification received:', event);
                this.handleServerNotification(event);
            });

            // Add channel binding success/error logging
            channel.subscribed(() => {
                console.log('ServerNotificationService: ✅ Successfully subscribed to notifications channel');
            });

            channel.error((error: Record<string, unknown>) => {
                console.error('ServerNotificationService: ❌ Channel subscription error:', error);
            });

            console.log('ServerNotificationService: ✅ Server notification listener attached to private channel');
        } catch (error) {
            console.error('ServerNotificationService: ❌ Failed to setup server notification listener:', error);
        }
    }

    /**
     * Handle incoming server notifications
     */
    private static async handleServerNotification(event: ServerNotificationEvent) {
        console.log('ServerNotificationService: 📨 Processing notification event:', event);

        if (event.notification) {
            const { title, message, icon, type } = event.notification;
            console.log('ServerNotificationService: 📋 Notification data:', { title, message, icon, type });

            // Try multiple methods to show the notification
            const notificationShown = await this.tryShowServerNotification({
                title: title || 'Server Notification',
                body: message,
                icon: '/favicon.ico',
                tag: type || 'server-notification',
                data: event.notification as Record<string, unknown>,
            });

            if (notificationShown) {
                console.log('ServerNotificationService: ✅ Notification shown successfully:', title);
            } else {
                console.warn('ServerNotificationService: ❌ Failed to show notification:', title);
            }
        } else {
            console.warn('ServerNotificationService: ⚠️ No notification data in event:', event);
        }
    }

    /**
     * Try multiple methods to show server notification
     */
    private static async tryShowServerNotification(notificationData: {
        title: string;
        body: string;
        icon: string;
        tag: string;
        data: Record<string, unknown>;
    }): Promise<boolean> {
        // Method 1: Try service worker controller
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            try {
                console.log('ServerNotificationService: 📤 Sending to service worker controller...');
                navigator.serviceWorker.controller.postMessage({
                    type: 'SERVER_NOTIFICATION',
                    payload: notificationData
                });
                console.log('ServerNotificationService: ✅ Notification sent to service worker');
                return true;
            } catch (error) {
                console.error('ServerNotificationService: ❌ Failed to send to service worker:', error);
            }
        }

        // Method 2: Try service worker registration directly
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration && registration.showNotification) {
                    console.log('ServerNotificationService: 📤 Using service worker registration...');
                    await registration.showNotification(notificationData.title, {
                        body: notificationData.body,
                        icon: notificationData.icon,
                        tag: notificationData.tag,
                        data: notificationData.data,
                        requireInteraction: false,
                    });
                    console.log('ServerNotificationService: ✅ Notification shown via registration');
                    return true;
                }
            } catch (error) {
                console.error('ServerNotificationService: ❌ Failed to use service worker registration:', error);
            }
        }

        // Method 3: Fallback to browser notification
        try {
            console.log('ServerNotificationService: 📢 Using fallback browser notification...');
            const { NotificationManager } = await import('./notifications');

            const success = await NotificationManager.showNotification({
                title: notificationData.title,
                body: notificationData.body,
                icon: notificationData.icon,
                tag: notificationData.tag,
                requireInteraction: false,
                vibrate: [200, 100, 200],
            });

            if (success) {
                console.log('ServerNotificationService: ✅ Fallback notification shown');
                return true;
            }
        } catch (error) {
            console.error('ServerNotificationService: ❌ Failed to show fallback notification:', error);
        }

        console.warn('ServerNotificationService: ❌ All notification methods failed');
        return false;
    }

    /**
     * Check if user is authenticated
     */
    private static async checkAuthentication(): Promise<boolean> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/auth/user', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                }
            });

            console.log('ServerNotificationService: Auth check response:', response.status);
            return response.ok;
        } catch (error) {
            console.error('ServerNotificationService: Auth check failed:', error);
            return false;
        }
    }

    /**
     * Check if the service is initialized
     */
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Force re-initialization (useful after user login)
     */
    static forceReInitialize() {
        console.log('ServerNotificationService: Force re-initialization requested');
        this.initialized = false;
        this.initialize();
    }

    /**
     * Test function to manually trigger a service worker notification
     */
    static testServiceWorkerNotification() {
        console.log('ServerNotificationService: 🧪 Testing service worker notification...');

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SERVER_NOTIFICATION',
                payload: {
                    title: '🧪 Test Server Notification',
                    body: 'This is a test notification from the service worker to verify it works',
                    icon: '/favicon.ico',
                    tag: 'test-server-notification',
                    data: { test: true },
                }
            });
            console.log('ServerNotificationService: ✅ Test notification sent to service worker');
        } else {
            console.error('ServerNotificationService: ❌ Service worker not available for test');
        }
    }
}
