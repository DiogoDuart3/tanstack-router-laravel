import '../css/app.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
// import Loader from './components/loader';
import { queryClient } from './lib/api';
import { routeTree } from './routeTree.gen';
import echo from './lib/echo';
import { ServerNotificationService } from './lib/server-notifications';
import { AuthDebugger } from './lib/debug-auth';
import { swUpdater } from './lib/serviceWorkerUpdater';

// Register service worker for offline support immediately
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js', {
            scope: '/'
        })
        .then((registration) => {
            console.log('✅ SW registered successfully: ', registration);
            console.log('✅ SW scope: ', registration.scope);
            console.log('✅ SW state:', registration.active?.state || 'not active');

            // Wait for the service worker to control this page
            if (!navigator.serviceWorker.controller) {
                console.log('SW: Waiting for service worker to take control...');
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('✅ SW: Service worker now controlling the page');
                });
            }
        })
        .catch((registrationError) => {
            console.error('❌ SW registration failed: ', registrationError);
        });
}

// Delay Echo and notification service initialization to allow authentication to complete
setTimeout(() => {
    // Make Echo globally available for server notifications (only if created)
    if (echo) {
        window.Echo = echo;
        console.log('App: Echo assigned to window (delayed)');
    } else {
        console.log('App: Echo is null, skipping global assignment');
    }

    // Initialize global server notification service after delay
    ServerNotificationService.initialize();
}, 1000); // 1 second delay to allow auth to complete

// Make test functions globally available for debugging
window.testServerNotification = ServerNotificationService.testServiceWorkerNotification;
window.reinitNotifications = ServerNotificationService.forceReInitialize;
window.checkForUpdates = () => swUpdater.forceUpdateCheck();
window.applyUpdate = () => swUpdater.applyUpdate();

// Initialize auth debugger
AuthDebugger.logCurrentState();

const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPendingComponent: () => (
        <div className="flex h-full items-center justify-center pt-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-current"></div>
        </div>
    ),
    context: { queryClient },
    Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('Root element not found');
}

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<RouterProvider router={router} />);
}
