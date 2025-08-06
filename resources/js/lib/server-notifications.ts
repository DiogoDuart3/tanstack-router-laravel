/**
 * Server notifications service for handling WebSocket notifications globally
 */

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
        
        // Wait for Echo to be available
        const checkEcho = () => {
            console.log('ServerNotificationService: Checking for Echo...', !!window.Echo, 'Context:', typeof window, typeof document);
            if (window.Echo && window.Echo !== null) {
                console.log('ServerNotificationService: Echo found, setting up listener');
                this.setupNotificationListener();
                this.initialized = true;
                console.log('ServerNotificationService: ✅ Initialized with Echo');
            } else {
                console.log('ServerNotificationService: Echo not available, retrying in 1 second...');
                setTimeout(checkEcho, 1000);
            }
        };

        checkEcho();
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
                
                pusher.connection.bind('error', (err: any) => {
                    console.error('ServerNotificationService: ❌ Pusher connection error:', err);
                });
            }
            
            // Listen for notifications
            channel.notification((event: any) => {
                console.log('ServerNotificationService: 🔔 Global server notification received:', event);
                this.handleServerNotification(event);
            });

            // Add channel binding success/error logging
            channel.subscribed(() => {
                console.log('ServerNotificationService: ✅ Successfully subscribed to notifications channel');
            });

            channel.error((error: any) => {
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
    private static handleServerNotification(event: any) {
        console.log('ServerNotificationService: 📨 Processing notification event:', event);
        
        if (event.notification) {
            const { title, message, icon, type } = event.notification;
            console.log('ServerNotificationService: 📋 Notification data:', { title, message, icon, type });
            
            // Send to service worker for system notification (works when app is not in focus)
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                console.log('ServerNotificationService: 📤 Sending to service worker...');
                navigator.serviceWorker.controller.postMessage({
                    type: 'SERVER_NOTIFICATION',
                    payload: {
                        title: title || 'Server Notification',
                        body: message,
                        icon: '/favicon.ico',
                        tag: type || 'server-notification',
                        data: event.notification,
                    }
                });
                console.log('ServerNotificationService: ✅ Notification sent to service worker:', title);
            } else {
                console.warn('ServerNotificationService: ⚠️ Service worker not available, using fallback notification');
                console.log('ServerNotificationService: SW status:', {
                    hasServiceWorker: !!navigator.serviceWorker,
                    hasController: !!navigator.serviceWorker?.controller
                });
                
                // Fallback: try to show browser notification directly (only works when app is in focus)
                import('./notifications').then(({ NotificationManager }) => {
                    console.log('ServerNotificationService: 📢 Showing fallback notification');
                    NotificationManager.showNotification({
                        title: title || 'Server Notification',
                        body: message,
                        icon: '/favicon.ico',
                        tag: 'server-notification',
                        requireInteraction: false,
                        vibrate: [200, 100, 200],
                    });
                });
            }
        } else {
            console.warn('ServerNotificationService: ⚠️ No notification data in event:', event);
        }
    }

    /**
     * Check if the service is initialized
     */
    static isInitialized(): boolean {
        return this.initialized;
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