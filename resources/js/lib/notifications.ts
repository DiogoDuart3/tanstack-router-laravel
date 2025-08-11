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
     * Check if this is iOS Safari and get version info
     */
    static getIOSInfo(): { isIOS: boolean; version?: { major: number; minor: number; patch?: number }; isStandalone: boolean } {
        const userAgent = navigator.userAgent;
        const isIOS = /iP(ad|hone|od)/.test(userAgent) && !(window as any).MSStream;

        if (!isIOS) {
            return { isIOS: false, isStandalone: false };
        }

        // Check if running as standalone PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (navigator as any).standalone === true;

        // Extract iOS version
        const versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        let version;
        if (versionMatch) {
            version = {
                major: parseInt(versionMatch[1], 10),
                minor: parseInt(versionMatch[2], 10),
                patch: versionMatch[3] ? parseInt(versionMatch[3], 10) : 0
            };
        }

        return { isIOS, version, isStandalone };
    }

    /**
     * Check if iOS Safari supports push notifications
     */
    static isIOSPushSupported(): boolean {
        const iosInfo = this.getIOSInfo();

        if (!iosInfo.isIOS) {
            return true; // Not iOS, assume supported if other checks pass
        }

        // iOS Safari 16.4+ is required for push notifications
        if (iosInfo.version) {
            const { major, minor } = iosInfo.version;
            const supportsNotifications = major > 16 || (major === 16 && minor >= 4);

            if (!supportsNotifications) {
                console.warn(`iOS ${major}.${minor} detected. Push notifications require iOS 16.4+`);
                return false;
            }
        }

        // For full push notification support, the app should be installed as PWA
        if (!iosInfo.isStandalone) {
            console.warn('iOS Safari: For best notification experience, install this app to your home screen');
            // Still return true to allow basic notifications, but warn about limitations
        }

        return true;
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

        const iosInfo = this.getIOSInfo();

        // Request permission with iOS Safari specific handling
        try {
            // iOS Safari requires user gesture and has stricter timing
            if (iosInfo.isIOS) {
                console.log('iOS Safari: Requesting notification permission...');

                // Ensure we're in a user gesture context
                if (!iosInfo.isStandalone) {
                    console.warn('iOS Safari: Permission request may fail if not triggered by user interaction');
                }

                // iOS Safari specific permission request
                const permission = await new Promise<NotificationPermission>((resolve) => {
                    const result = Notification.requestPermission((perm) => {
                        resolve(perm);
                    });

                    // Handle promise-based API (newer iOS)
                    if (result && typeof result.then === 'function') {
                        result.then(resolve);
                    }
                });

                return permission as NotificationPermissionStatus;
            } else {
                // Standard permission request for other browsers
                const permission = await Notification.requestPermission();
                return permission as NotificationPermissionStatus;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);

            // iOS Safari specific error handling
            if (iosInfo.isIOS) {
                console.error('iOS Safari: Permission request failed. Ensure this is triggered by user interaction.');
            }

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

        const iosInfo = this.getIOSInfo();

        try {
            // iOS Safari specific notification handling
            if (iosInfo.isIOS) {
                console.log('iOS Safari: Attempting to show notification');

                // For iOS Safari, prefer service worker notifications when in PWA mode
                if (iosInfo.isStandalone && this.isServiceWorkerSupported() && 'serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        if (registration && registration.showNotification) {
                            await registration.showNotification(options.title, {
                                body: options.body,
                                icon: options.icon || '/favicon.ico',
                                badge: options.badge,
                                tag: options.tag,
                                data: options.data,
                                requireInteraction: options.requireInteraction,
                                silent: options.silent,
                            });
                            console.log('iOS Safari: Service worker notification shown');
                            return true;
                        }
                    } catch (swError) {
                        console.warn('iOS Safari: Service worker notification failed, falling back to browser notification:', swError);
                    }
                }

                // Fallback to browser notification for iOS Safari
                try {
                    const notification = new Notification(options.title, {
                        body: options.body,
                        icon: options.icon || '/favicon.ico',
                        tag: options.tag,
                        data: options.data,
                    });

                    // iOS Safari handles notification lifecycle differently
                    if (!options.requireInteraction) {
                        setTimeout(() => {
                            try {
                                notification.close();
                            } catch (e) {
                                // iOS Safari may not allow programmatic close
                                console.debug('iOS Safari: Could not programmatically close notification');
                            }
                        }, 5000);
                    }

                    console.log('iOS Safari: Browser notification shown');
                    return true;
                } catch (browserError) {
                    console.error('iOS Safari: Browser notification failed:', browserError);
                    return false;
                }
            }

            // Standard notification handling for other browsers
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
                    });
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
            });

            // Auto-close after 5 seconds unless requireInteraction is true
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }

            return true;
        } catch (error) {
            console.error('Error showing notification:', error);

            // iOS Safari specific error handling
            if (iosInfo.isIOS) {
                console.error('iOS Safari: Notification failed. Ensure permission is granted and app is installed as PWA for best experience.');
            }

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
        const basicSupport = (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );

        if (!basicSupport) {
            return false;
        }

        // Check iOS-specific requirements
        return this.isIOSPushSupported();
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

        const iosInfo = this.getIOSInfo();

        try {
            console.log('Starting push subscription process...');

            // iOS Safari specific handling
            if (iosInfo.isIOS) {
                console.log(`iOS Safari ${iosInfo.version?.major}.${iosInfo.version?.minor} detected`);

                if (!iosInfo.isStandalone) {
                    console.warn('iOS Safari: Running in browser mode. Install as PWA for full notification support.');
                }

                // Add delay for iOS Safari to ensure proper initialization
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Request notification permission first
            console.log('Requesting notification permission...');
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission not granted:', permission);
                return false;
            }
            console.log('✅ Permission granted');

                                    // Get service worker registration with improved handling
            console.log('Getting service worker registration...');

            // Check service worker state first
            console.log('SW Controller:', navigator.serviceWorker.controller);
            console.log('SW Ready state available:', 'ready' in navigator.serviceWorker);

            // Check for service worker registration at root scope
            let registration = await navigator.serviceWorker.getRegistration('/');
            console.log('Root scope registration:', registration);

            // If not found, check for any registration as fallback
            if (!registration) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('All registrations:', registrations);
                if (registrations.length > 0) {
                    registration = registrations[0]; // Use the first available registration
                    console.log(`Found service worker registration at scope: ${registration.scope}`);
                }
            }

            if (!registration) {
                console.log('No existing service worker registration found, trying navigator.serviceWorker.ready...');

                // Try using navigator.serviceWorker.ready as fallback
                try {
                    const readyRegistration = await navigator.serviceWorker.ready;
                    console.log('Got registration from ready:', readyRegistration);
                    if (readyRegistration) {
                        registration = readyRegistration;
                    }
                } catch (readyError) {
                    console.warn('navigator.serviceWorker.ready failed:', readyError);
                }
            }

            if (!registration) {
                console.log('Still no registration found, waiting for registration...');

                // Wait for service worker to register with timeout
                const registrationPromise = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
                    const checkRegistration = async () => {
                        // Check all possible scopes (prefer root scope for page control)
                        let reg = await navigator.serviceWorker.getRegistration('/');
                        if (!reg) {
                            const regs = await navigator.serviceWorker.getRegistrations();
                            if (regs.length > 0) {
                                reg = regs[0];
                            }
                        }

                        if (reg) {
                            console.log(`Service worker registration found at scope: ${reg.scope}`);
                            resolve(reg);
                        } else {
                            setTimeout(checkRegistration, 100);
                        }
                    };
                    checkRegistration();

                    // Timeout after reasonable time
                    setTimeout(() => reject(new Error('Service worker registration timeout - service worker may not be properly configured')), iosInfo.isIOS ? 15000 : 10000);
                });

                registration = await registrationPromise;
            }

                        // Now wait for the service worker to be ready with enhanced debugging
            console.log('Service worker found, waiting for it to be ready...');
            console.log('Registration state:', {
                installing: !!registration.installing,
                waiting: !!registration.waiting,
                active: !!registration.active,
                scope: registration.scope
            });

            // Check if service worker is already active and ready
            let readyRegistration: ServiceWorkerRegistration;

            if (registration.active && registration.active.state === 'activated') {
                console.log('✅ Service worker already active and ready');
                readyRegistration = registration;
            } else {
                console.log('Service worker not yet active, waiting for ready state...');

                const readyPromise = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
                    let resolved = false;

                    const resolveOnce = (reg: ServiceWorkerRegistration) => {
                        if (!resolved) {
                            resolved = true;
                            console.log('✅ Service worker ready event fired');
                            resolve(reg);
                        }
                    };

                    // Method 1: Use navigator.serviceWorker.ready
                    navigator.serviceWorker.ready.then(resolveOnce).catch(error => {
                        console.error('Service worker ready promise rejected:', error);
                        if (!resolved) {
                            resolved = true;
                            reject(error);
                        }
                    });

                    // Method 2: Check if current registration becomes active
                    const checkActivation = () => {
                        if (registration.active && registration.active.state === 'activated') {
                            resolveOnce(registration);
                        }
                    };

                    // Check immediately
                    checkActivation();

                    // Method 3: Listen for state changes
                    if (registration.installing) {
                        registration.installing.addEventListener('statechange', () => {
                            console.log('Installing service worker state changed:', registration.installing?.state);
                            checkActivation();
                        });
                    }

                    if (registration.waiting) {
                        registration.waiting.addEventListener('statechange', () => {
                            console.log('Waiting service worker state changed:', registration.waiting?.state);
                            checkActivation();
                        });
                    }

                    // Method 4: Poll for activation (fallback)
                    const pollInterval = setInterval(() => {
                        if (resolved) {
                            clearInterval(pollInterval);
                            return;
                        }

                        console.log('Polling service worker state...');
                        checkActivation();

                        // Check for new registrations at root scope
                        navigator.serviceWorker.getRegistration('/').then(reg => {
                            if (reg && reg.active && reg.active.state === 'activated') {
                                clearInterval(pollInterval);
                                resolveOnce(reg);
                            }
                        });
                    }, 500);

                    // Timeout with extended time for iOS
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        if (!resolved) {
                            console.error('Service worker ready timeout - current state:', {
                                installing: registration.installing?.state,
                                waiting: registration.waiting?.state,
                                active: registration.active?.state
                            });
                            resolved = true;
                            reject(new Error('Service worker ready timeout'));
                        }
                    }, iosInfo.isIOS ? 20000 : 15000);
                });

                readyRegistration = await readyPromise;
                console.log('✅ Service worker ready');
            }

            // Get VAPID key
            console.log('Fetching VAPID key from server...');
            const vapidKey = await this.getVapidKey();
            if (!vapidKey) {
                console.error('Could not get VAPID key');
                return false;
            }
            console.log('✅ VAPID key received');

            // Check if already subscribed
            console.log('Checking existing subscription...');
            const existingSubscription = await readyRegistration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Already subscribed to push notifications, sending to server...');
                await this.sendSubscriptionToServer(existingSubscription);
                console.log('✅ Existing subscription synced with server');
                return true;
            }

            // Subscribe to push notifications with iOS Safari specific options
            console.log('Creating new push subscription...');
            const subscriptionOptions: PushSubscriptionOptions = {
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
            };

            // iOS Safari requires the applicationServerKey as ArrayBuffer
            if (iosInfo.isIOS) {
                subscriptionOptions.applicationServerKey = this.urlBase64ToUint8Array(vapidKey).buffer;
            }

            const subscription = await readyRegistration.pushManager.subscribe(subscriptionOptions);
            console.log('✅ New subscription created:', subscription);

            // Send subscription to server
            console.log('Sending subscription to server...');
            await this.sendSubscriptionToServer(subscription);
            console.log('✅ Push subscription complete!');
            return true;

        } catch (error) {
            console.error('Error subscribing to push notifications:', error);

            // iOS Safari specific error handling
            if (iosInfo.isIOS && error instanceof Error) {
                if (error.message.includes('not supported')) {
                    console.error('iOS Safari: Push notifications not supported. Ensure iOS 16.4+ and PWA installation.');
                } else if (error.message.includes('permission')) {
                    console.error('iOS Safari: Permission denied. User must grant permission manually.');
                }
            }

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
        try {
            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
                }
            };

            await pushApi.subscribe(subscriptionData);
            console.log('Subscription sent to server');
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
            throw error; // Re-throw so caller can handle it
        }
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
