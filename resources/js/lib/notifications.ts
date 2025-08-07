/**
 * Notification utilities for PWA and browser notifications
 */
import { pushApi } from './api';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
}

export class NotificationManager {
    /**
     * Check if notifications are supported in this browser
     */
    static isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Check if service worker is available for background notifications
     */
    static isServiceWorkerSupported(): boolean {
        return 'serviceWorker' in navigator;
    }

    /**
     * Get current notification permission status
     */
    static getPermission(): NotificationPermissionStatus {
        if (!this.isSupported()) {
            return 'denied';
        }
        return Notification.permission as NotificationPermissionStatus;
    }

    /**
     * Request notification permission from user
     */
    static async requestPermission(): Promise<NotificationPermissionStatus> {
        if (!this.isSupported()) {
            console.warn('Notifications are not supported in this browser');
            return 'denied';
        }

        if (this.getPermission() === 'granted') {
            return 'granted';
        }

        try {
            const permission = await Notification.requestPermission();
            return permission as NotificationPermissionStatus;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Show a simple notification (works in both browser and PWA)
     */
    static async showNotification(options: NotificationOptions): Promise<boolean> {
        const permission = await this.requestPermission();

        if (permission !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }

        try {
            // Try to use service worker for PWA notifications first
            if (this.isServiceWorkerSupported() && 'serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration) {
                    await registration.showNotification(options.title, {
                        body: options.body,
                        icon: options.icon || '/favicon.ico',
                        badge: options.badge,
                        tag: options.tag,
                        data: options.data,
                        requireInteraction: options.requireInteraction,
                        silent: options.silent,
                    } as any);
                    return true;
                }
            }

            // Fallback to regular browser notification
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/favicon.ico',
                tag: options.tag,
                data: options.data,
                requireInteraction: options.requireInteraction,
                silent: options.silent,
            } as any);

            // Auto-close after 5 seconds unless requireInteraction is true
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }

    /**
     * Show a welcome notification (good for testing)
     */
    static async showWelcomeNotification(): Promise<boolean> {
        return this.showNotification({
            title: '🎉 Welcome to Laravel App!',
            body: 'Notifications are working perfectly! You can now receive updates even when the app is closed.',
            icon: '/favicon.ico',
            tag: 'welcome',
            requireInteraction: false,
            vibrate: [200, 100, 200],
        });
    }

    /**
     * Show a todo reminder notification
     */
    static async showTodoReminder(todoText: string): Promise<boolean> {
        return this.showNotification({
            title: '📝 Todo Reminder',
            body: `Don't forget: ${todoText}`,
            icon: '/favicon.ico',
            tag: 'todo-reminder',
            requireInteraction: true,
        });
    }

    /**
     * Show a chat notification
     */
    static async showChatNotification(sender: string, message: string): Promise<boolean> {
        return this.showNotification({
            title: `💬 New message from ${sender}`,
            body: message,
            icon: '/favicon.ico',
            tag: 'chat',
            requireInteraction: false,
            vibrate: [100, 50, 100],
        });
    }

    /**
     * Check if running as PWA (installed)
     */
    static isPWA(): boolean {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            (window.navigator as any).standalone === true
        );
    }

    /**
     * Get installation status and capabilities
     */
    static getStatus() {
        return {
            isSupported: this.isSupported(),
            isServiceWorkerSupported: this.isServiceWorkerSupported(),
            permission: this.getPermission(),
            isPWA: this.isPWA(),
        };
    }

    /**
     * Check if push notifications are supported
     */
    static isPushSupported(): boolean {
        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    }

    /**
     * Convert VAPID key from base64 to Uint8Array
     */
    static urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    }

    /**
     * Get VAPID public key from server
     */
    static async getVapidKey(): Promise<string | null> {
        try {
            const response = await pushApi.getVapidKey();
            return response.vapid_public_key;
        } catch (error) {
            console.error('Error getting VAPID key:', error);
            return null;
        }
    }

    /**
     * Subscribe to push notifications
     */
    static async subscribeToPush(): Promise<boolean> {
        if (!this.isPushSupported()) {
            console.warn('Push notifications are not supported');
            return false;
        }

        try {
            // Request notification permission first
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission not granted');
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;
            if (!registration) {
                console.error('Service worker not ready');
                return false;
            }

            // Get VAPID key
            const vapidKey = await this.getVapidKey();
            if (!vapidKey) {
                console.error('Could not get VAPID key');
                return false;
            }

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Already subscribed to push notifications');
                // Send to server anyway in case it's not stored
                await this.sendSubscriptionToServer(existingSubscription);
                return true;
            }

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidKey).buffer,
            });

            console.log('Subscribed to push notifications:', subscription);

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            return true;

        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    static async unsubscribeFromPush(): Promise<boolean> {
        if (!this.isPushSupported()) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('Unsubscribed from push notifications');
            }

            // Remove from server
            await pushApi.unsubscribe();
            return true;

        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            return false;
        }
    }

    /**
     * Send subscription details to server
     */
    private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
            }
        };

        await pushApi.subscribe(subscriptionData);
        console.log('Subscription sent to server');
    }

    /**
     * Check if user is subscribed to push notifications
     */
    static async isSubscribedToPush(): Promise<boolean> {
        if (!this.isPushSupported()) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            console.error('Error checking push subscription:', error);
            return false;
        }
    }

    /**
     * Test push notifications by sending a test notification from server
     */
    static async testPushNotification(): Promise<boolean> {
        try {
            const response = await pushApi.test();
            console.log('Test push notification sent:', response);
            return response.success;
        } catch (error) {
            console.error('Error testing push notification:', error);
            return false;
        }
    }
}
