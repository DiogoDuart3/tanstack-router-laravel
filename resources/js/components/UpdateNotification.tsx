import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateChecker, type UpdateCheckResult } from '@/lib/update-checker';
import { DownloadIcon, RefreshCwIcon, XIcon } from 'lucide-react';

export function UpdateNotification() {
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleUpdate = (result: UpdateCheckResult) => {
      setUpdateResult(result);
      setIsDismissed(false); // Reset dismissal when new update is available
    };

    updateChecker.onUpdateAvailable(handleUpdate);

    // Start periodic checks (every minute)
    updateChecker.startPeriodicChecks(60000);

    return () => {
      updateChecker.offUpdateAvailable(handleUpdate);
      updateChecker.stopPeriodicChecks();
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateChecker.forceUpdate();
    } catch (error) {
      console.error('Failed to update:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleCheckNow = async () => {
    setIsUpdating(true);
    const result = await updateChecker.checkForUpdates();
    setUpdateResult(result);
    setIsUpdating(false);
    
    if (!result.hasUpdate) {
      // Show a brief "up to date" message
      setUpdateResult({ ...result, hasUpdate: false });
      setTimeout(() => {
        setUpdateResult(null);
      }, 3000);
    }
  };

  if (!updateResult || isDismissed) {
    return null;
  }

  if (!updateResult.hasUpdate) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
        <RefreshCwIcon className="h-4 w-4" />
        <span>App is up to date!</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-start gap-3">
        <DownloadIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium">Update Available</h3>
          <p className="text-sm text-blue-100 mt-1">
            A new version of the app is available.
          </p>
          <div className="text-xs text-blue-200 mt-1">
            Current: {updateResult.currentVersion.substring(0, 8)}
            <br />
            Latest: {updateResult.latestVersion.substring(0, 8)}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-100 hover:text-white"
          aria-label="Dismiss"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleUpdate}
          disabled={isUpdating}
          size="sm"
          variant="secondary"
          className="flex-1"
        >
          {isUpdating ? (
            <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <DownloadIcon className="h-4 w-4 mr-2" />
          )}
          {isUpdating ? 'Updating...' : 'Update Now'}
        </Button>
        <Button
          onClick={handleCheckNow}
          disabled={isUpdating}
          size="sm"
          variant="outline"
          className="bg-transparent border-blue-400 text-blue-100 hover:bg-blue-500"
        >
          Check Again
        </Button>
      </div>
    </div>
  );
}