export interface AppVersion {
  version: string;
  build_timestamp: number | null;
  server_time: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  error?: string;
}

class UpdateChecker {
  private currentVersion: string;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(result: UpdateCheckResult) => void> = [];

  constructor() {
    this.currentVersion = __APP_VERSION__ || 'unknown';
    console.log('UpdateChecker initialized with version:', this.currentVersion.substring(0, 8));
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const response = await fetch('/api/version', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const serverVersion: AppVersion = await response.json();
      const hasUpdate = serverVersion.version !== this.currentVersion && 
                       serverVersion.version !== 'unknown' && 
                       this.currentVersion !== 'unknown';

      const result: UpdateCheckResult = {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion: serverVersion.version,
      };

      console.log('Update check result:', {
        hasUpdate,
        current: this.currentVersion.substring(0, 8),
        latest: serverVersion.version.substring(0, 8),
      });

      return result;
    } catch (error) {
      const result: UpdateCheckResult = {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      console.warn('Update check failed:', error);
      return result;
    }
  }

  startPeriodicChecks(intervalMs: number = 60000) { // Default: 1 minute
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log(`Starting periodic update checks every ${intervalMs / 1000}s`);
    
    this.checkInterval = setInterval(async () => {
      const result = await this.checkForUpdates();
      this.notifyListeners(result);
    }, intervalMs);

    // Also check immediately
    setTimeout(async () => {
      const result = await this.checkForUpdates();
      this.notifyListeners(result);
    }, 2000); // Small delay to allow app to initialize
  }

  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Stopped periodic update checks');
    }
  }

  onUpdateAvailable(callback: (result: UpdateCheckResult) => void) {
    this.listeners.push(callback);
  }

  offUpdateAvailable(callback: (result: UpdateCheckResult) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(result: UpdateCheckResult) {
    if (result.hasUpdate) {
      this.listeners.forEach(callback => callback(result));
    }
  }

  async forceUpdate() {
    console.log('Forcing PWA update...');
    
    // Unregister current service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered service worker');
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Force hard refresh
    window.location.reload();
  }
}

export const updateChecker = new UpdateChecker();