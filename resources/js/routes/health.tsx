import { createFileRoute } from "@tanstack/react-router";
import { healthApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/health")({
  component: HealthComponent,
});

function HealthComponent() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <p className="text-muted-foreground">Check the status of the application</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">API Status</h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  healthQuery.isLoading
                    ? "bg-yellow-500"
                    : healthQuery.data
                      ? "bg-green-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                {healthQuery.isLoading
                  ? "Checking..."
                  : healthQuery.data
                    ? "Online"
                    : "Offline"}
              </span>
            </div>
          </div>

          {healthQuery.data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-mono">{healthQuery.data.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span className="font-mono">{new Date(healthQuery.data.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Request Time:</span>
                <span className="font-mono">{healthQuery.data.request_time_ms}ms</span>
              </div>
            </div>
          )}

          {healthQuery.error && (
            <div className="text-red-500 text-sm">
              Error: {healthQuery.error.message}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Online:</span>
              <span className={`font-mono ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
                {navigator.onLine ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className="font-mono">
                {(navigator as Navigator & { connection?: { effectiveType: string } }).connection?.effectiveType || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span className={`font-mono ${'serviceWorker' in navigator ? 'text-green-600' : 'text-red-600'}`}>
                {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Performance</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>API Response Time:</span>
              <span className="font-mono">
                {healthQuery.data?.request_time_ms
                  ? `${healthQuery.data.request_time_ms}ms`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="font-mono">
                {(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
                  ? `${Math.round((performance as Performance & { memory?: { usedJSHeapSize: number } }).memory!.usedJSHeapSize / 1024 / 1024)}MB`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
