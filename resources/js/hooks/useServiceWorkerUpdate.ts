import { useEffect, useState } from 'react';
import { swUpdater } from '@/lib/serviceWorkerUpdater';

export function useServiceWorkerUpdate() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<string | null>(null);

    useEffect(() => {
        // Get initial status
        const status = swUpdater.getUpdateStatus();
        setUpdateAvailable(status.updateAvailable);
        setCurrentVersion(status.currentVersion);

        // Listen for update events
        const handleUpdateAvailable = (event: CustomEvent) => {
            setUpdateAvailable(true);
            setCurrentVersion(event.detail.version);
        };

        window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);

        return () => {
            window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
        };
    }, []);

    const applyUpdate = () => {
        swUpdater.applyUpdate();
        setUpdateAvailable(false);
    };

    const checkForUpdates = () => {
        return swUpdater.forceUpdateCheck();
    };

    return {
        updateAvailable,
        currentVersion,
        applyUpdate,
        checkForUpdates
    };
}