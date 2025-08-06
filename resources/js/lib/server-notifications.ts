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

        // Wait for Echo to be available
        const checkEcho = () => {
            if (window.Echo) {
                this.setupNotificationListener();
                this.initialized = true;
                console.log('ServerNotificationService initialized with Echo');
            } else {
                console.log('Echo not available, retrying in 1 second...');
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
            console.error('Echo is not available');
            return;
        }

        try {
            const channel = window.Echo.private('notifications');
            
            channel.notification((event: any) => {
                console.log('Global server notification received:', event);
                this.handleServerNotification(event);
            });

            console.log('Server notification listener attached to private channel');
        } catch (error) {
            console.error('Failed to setup server notification listener:', error);
        }
    }

    /**
     * Handle incoming server notifications
     */
    private static handleServerNotification(event: any) {
        if (event.notification) {
            const { title, message, icon, type } = event.notification;
            
            // Send to service worker for system notification (works when app is not in focus)
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
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
                console.log('Notification sent to service worker:', title);
            } else {
                console.warn('Service worker not available, notification may not show when app is not in focus');
                
                // Fallback: try to show browser notification directly (only works when app is in focus)
                import('./notifications').then(({ NotificationManager }) => {
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
        }
    }

    /**
     * Check if the service is initialized
     */
    static isInitialized(): boolean {
        return this.initialized;
    }
}