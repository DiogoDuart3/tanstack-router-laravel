import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    
    interface Window {
        Echo?: {
            private: (channel: string) => {
                notification: (callback: (e: any) => void) => void;
                stopListening: (event: string, callback: (e: any) => void) => void;
            };
        };
    }
}
