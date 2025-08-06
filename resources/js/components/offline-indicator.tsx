import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-16 right-0 left-0 z-40 bg-yellow-500 px-4 py-2 text-center text-sm text-white">
            <div className="flex items-center justify-center space-x-2">
                <WifiOff className="h-4 w-4" />
                <span>You're offline. Changes will sync when you're back online.</span>
            </div>
        </div>
    );
}
