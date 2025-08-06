/**
 * Notification utilities for PWA and browser notifications
 */

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
}
