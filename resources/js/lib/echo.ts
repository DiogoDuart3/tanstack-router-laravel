import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Only initialize Echo in the main thread, not in service workers
if (typeof window !== 'undefined') {
    // Make Pusher globally available for Laravel Echo
    window.Pusher = Pusher;
}

// Only create Echo instance in main thread context
// @ts-expect-error - Echo type is complex and we need to avoid strict typing here
let echo: Echo | null = null;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const config = {
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    };

    console.log('Echo: Initializing with config:', config);

    // Get the authentication token
    const token = localStorage.getItem('auth_token');

    echo = new Echo({
        ...config,
        enabledTransports: ['ws', 'wss'],
        // Authentication configuration with both session and token support
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        },
        authEndpoint: '/broadcasting/auth',
    } as ConstructorParameters<typeof Echo>[0]);

    console.log('Echo: Instance created:', echo);
} else {
    console.log('Echo: Skipped initialization (not in main thread context)');
}

export default echo;
