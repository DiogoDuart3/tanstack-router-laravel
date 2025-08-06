import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Only initialize Echo in the main thread, not in service workers
if (typeof window !== 'undefined') {
    // Make Pusher globally available for Laravel Echo  
    window.Pusher = Pusher;
}

// Only create Echo instance in main thread context
let echo: Echo | null = null;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.log('Echo: Initializing with config:', {
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    });

    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        // Authentication configuration for Sanctum
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
            },
        },
        authEndpoint: '/broadcasting/auth',
    });

    console.log('Echo: Instance created:', echo);
} else {
    console.log('Echo: Skipped initialization (not in main thread context)');
}

export default echo;
