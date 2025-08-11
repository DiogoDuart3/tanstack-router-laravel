import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    
    interface Window {
        Echo?: {
            private: (channel: string) => EchoChannel;
            connector?: {
                pusher?: {
                    connection: {
                        bind: (event: string, callback: (data: Record<string, unknown>) => void) => void;
                        state: string;
                    };
                };
            };
        };
        testServerNotification?: () => void;
        reinitNotifications?: () => void;
        checkForUpdates?: () => void;
        applyUpdate?: () => void;
        debugAuth?: typeof import('../lib/debug-auth').AuthDebugger;
    }
    
    interface NotificationEvent {
        [key: string]: unknown;
    }
    
    interface EchoChannel {
        notification: (callback: (e: ServerNotificationEvent) => void) => void;
        subscribed: (callback: () => void) => void;
        error: (callback: (error: Record<string, unknown>) => void) => void;
        stopListening: (event: string, callback: (e: NotificationEvent) => void) => void;
    }
    
    interface ServerNotificationEvent {
        notification: {
            title: string;
            message: string;
            icon: string;
            type: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }
}
