import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';

export default function UpdateIndicator() {
    const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

    if (!updateAvailable) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 animate-slide-in-right">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-sm">🔄</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-sm">App Update Available</h3>
                        <p className="text-xs opacity-90 mt-1">
                            A new version of the app is ready to install.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={applyUpdate}
                                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                                Update Now
                            </button>
                            <button
                                onClick={() => document.getElementById('update-indicator')?.remove()}
                                className="text-white/70 hover:text-white text-xs px-2 py-1 transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add CSS for animation
const styles = `
@keyframes slide-in-right {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}