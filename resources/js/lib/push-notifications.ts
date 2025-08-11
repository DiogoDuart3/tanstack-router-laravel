/**
 * Push notification service for handling background notifications via Web Push API
 */

export class PushNotificationManager {
    private static vapidPublicKey: string | null = null;
    private static pushSubscription: PushSubscription | null = null;

    /**
     * Initialize push notifications
     */
    static async initialize(): Promise<boolean> {
        // Check basic support first
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('PushNotificationManager: Push notifications not supported');
            return false;
        }

        // Check iOS Safari specific requirements
        const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
        if (isIOS) {
            const versionMatch = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (versionMatch) {
                const major = parseInt(versionMatch[1], 10);
                const minor = parseInt(versionMatch[2], 10);
                if (major < 16 || (major === 16 && minor < 4)) {
                    console.warn(`PushNotificationManager: iOS ${major}.${minor} detected. Push notifications require iOS 16.4+`);
                    return false;
                }
            }

            // Check if running as standalone PWA
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                               (navigator as any).standalone === true;
            if (!isStandalone) {
                console.warn('PushNotificationManager: iOS Safari detected in browser mode. Install as PWA for best experience.');
            }

            // Add iOS Safari initialization delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            // Get VAPID public key from server
            await this.fetchVapidKey();

            // Check current permission status without requesting
            const permission = Notification.permission;
            console.log('PushNotificationManager: Permission status:', permission);

            // Only subscribe if permission is already granted
            if (permission === 'granted') {
                await this.subscribe();
            }

            console.log('PushNotificationManager: ✅ Successfully initialized');
            return true;
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to initialize:', error);

            // iOS Safari specific error messaging
            if (isIOS) {
                console.error('PushNotificationManager: iOS Safari issues. Ensure iOS 16.4+, PWA installation, and proper permissions.');
            }

            return false;
        }
    }

    /**
     * Request notification permission from user
     */
    static async requestPermission(): Promise<NotificationPermission> {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('PushNotificationManager: Permission status:', permission);
            return permission;
        }
        return 'denied';
    }

    /**
     * Fetch VAPID public key from server
     */
    private static async fetchVapidKey(): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/push/vapid-key', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch VAPID key');
            }

            const data = await response.json();
            this.vapidPublicKey = data.vapid_public_key;
            console.log('PushNotificationManager: ✅ VAPID key fetched');
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to fetch VAPID key:', error);
            throw error;
        }
    }

    /**
     * Subscribe to push notifications
     */
    static async subscribe(): Promise<PushSubscription | null> {
        if (!this.vapidPublicKey) {
            console.error('PushNotificationManager: VAPID key not available');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('PushNotificationManager: Already subscribed');
                this.pushSubscription = existingSubscription;
                await this.sendSubscriptionToServer(existingSubscription);
                return existingSubscription;
            }

            // Create new subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            console.log('PushNotificationManager: ✅ New subscription created');
            this.pushSubscription = subscription;

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);

            return subscription;
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to subscribe:', error);
            return null;
        }
    }

    /**
     * Send subscription details to server
     */
    private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }

            console.log('PushNotificationManager: ✅ Subscription sent to server');
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to send subscription to server:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    static async unsubscribe(): Promise<boolean> {
        try {
            if (this.pushSubscription) {
                await this.pushSubscription.unsubscribe();
                this.pushSubscription = null;

                // Notify server about unsubscription
                const token = localStorage.getItem('auth_token');
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    }
                });

                console.log('PushNotificationManager: ✅ Unsubscribed from push notifications');
                return true;
            }
            return false;
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to unsubscribe:', error);
            return false;
        }
    }

    /**
     * Check if user is subscribed to push notifications
     */
    static async isSubscribed(): Promise<boolean> {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            return subscription !== null;
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to check subscription status:', error);
            return false;
        }
    }

    /**
     * Get current push subscription
     */
    static async getSubscription(): Promise<PushSubscription | null> {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return null;
            }

            const registration = await navigator.serviceWorker.ready;
            return await registration.pushManager.getSubscription();
        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to get subscription:', error);
            return null;
        }
    }

    /**
     * Convert VAPID key from base64 to Uint8Array
     */
    private static urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Test push notification
     */
    static async testPushNotification(): Promise<void> {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/push/test', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    ...(token && { Authorization: `Bearer ${token}` }),
                }
            });

            if (!response.ok) {
                throw new Error('Failed to send test notification');
            }

            const result = await response.json();
            console.log('PushNotificationManager: ✅ Test notification sent:', result);

            // Show alert with the response for debugging
            alert(`Push notification sent! Response: ${JSON.stringify(result, null, 2)}`);

        } catch (error) {
            console.error('PushNotificationManager: ❌ Failed to send test notification:', error);
            alert(`Failed to send push notification: ${error.message}`);
        }
    }
}
