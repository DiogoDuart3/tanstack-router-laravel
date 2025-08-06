import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateChecker } from '@/lib/update-checker';

export function UpdateDemo() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<string>('');

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    const result = await updateChecker.checkForUpdates();
    
    setLastCheckResult(JSON.stringify(result, null, 2));
    setIsChecking(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium">PWA Update Test</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Current Version: {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__.substring(0, 8) : 'unknown'}
        </p>
        <p className="text-sm text-gray-600">
          Build Time: {typeof __BUILD_TIMESTAMP__ !== 'undefined' ? new Date(Number(__BUILD_TIMESTAMP__)).toLocaleString() : 'unknown'}
        </p>
      </div>

      <Button 
        onClick={handleCheckUpdate} 
        disabled={isChecking}
        size="sm"
      >
        {isChecking ? 'Checking...' : 'Check for Updates'}
      </Button>

      {lastCheckResult && (
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
          {lastCheckResult}
        </pre>
      )}
      
      <div className="text-xs text-gray-500">
        <p>To test updates:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make a git commit to change the version hash</li>
          <li>Run `npm run build` to rebuild with new version</li>
          <li>The update notification should appear automatically within 1 minute</li>
        </ol>
      </div>
    </div>
  );
}