import { createFileRoute } from "@tanstack/react-router";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

export const Route = createFileRoute("/go/install-pwa")({
  component: InstallPWAComponent,
});

function InstallPWAComponent() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Install PWA</h1>
        <p className="text-muted-foreground">Install this app on your device for a better experience</p>
      </div>

      <div className="space-y-6">
        <PWAInstallPrompt />
        
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Why install this app?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center">
              <span className="mr-2">📱</span>
              Access the app directly from your home screen
            </li>
            <li className="flex items-center">
              <span className="mr-2">⚡</span>
              Faster loading and better performance
            </li>
            <li className="flex items-center">
              <span className="mr-2">📴</span>
              Works offline when you don't have internet
            </li>
            <li className="flex items-center">
              <span className="mr-2">🔔</span>
              Receive push notifications (coming soon)
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">How to install</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">On Chrome/Edge (Desktop)</h3>
              <p className="text-sm text-muted-foreground">
                Click the install button in the address bar or use the button above
              </p>
            </div>
            <div>
              <h3 className="font-medium">On Safari (iOS)</h3>
              <p className="text-sm text-muted-foreground">
                Tap the share button and select "Add to Home Screen"
              </p>
            </div>
            <div>
              <h3 className="font-medium">On Chrome (Android)</h3>
              <p className="text-sm text-muted-foreground">
                Tap the menu button and select "Add to Home screen"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}