class ServiceWorkerUpdater {
  private updateAvailable = false;
  private currentVersion: string | null = null;

  constructor() {
    this.setupServiceWorkerListeners();
  }

  private setupServiceWorkerListeners() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // A new service worker is now controlling the page
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
          this.updateAvailable = true;
          this.currentVersion = event.data.version;
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { version: event.data.version }
          }));
        }
      });
    }
  }

  getUpdateStatus() {
    return {
      updateAvailable: this.updateAvailable,
      currentVersion: this.currentVersion
    };
  }

  async forceUpdateCheck(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.warn('Force update check failed:', error);
      return false;
    }
  }

  async applyUpdate() {
    console.log('Applying PWA update...');
    
    // First try to use service worker update mechanism
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if there's a waiting service worker
        if (registration.waiting) {
          console.log('Using waiting service worker for update');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
        
        // Force service worker update check
        await registration.update();
        
        // If still no waiting worker after update check, force refresh with cache clearing
        if (!registration.waiting) {
          console.log('No waiting worker found, forcing hard refresh with cache clearing');
          await this.performHardRefresh();
          return;
        }
      } catch (error) {
        console.warn('Service worker update failed, falling back to hard refresh:', error);
        await this.performHardRefresh();
        return;
      }
    }
    
    // Fallback to hard refresh with cache clearing
    await this.performHardRefresh();
  }

  private async performHardRefresh() {
    // Clear all caches first
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Unregister current service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered service worker');
      }
    }

    // Force hard refresh
    window.location.reload();
  }
}

export const swUpdater = new ServiceWorkerUpdater();