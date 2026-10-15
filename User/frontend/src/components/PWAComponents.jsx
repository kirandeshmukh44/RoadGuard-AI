import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * PWA Update Notification Component
 * Handles service worker updates and prompts user to refresh
 */
export function PWAUpdateNotification() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      setOfflineReady(true);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
    setNeedRefresh(false);
  };

  const handleOfflineReady = () => {
    setOfflineReady(false);
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      {needRefresh && (
        <div className="alert alert-info shadow-lg glass-card border-cyan-400 max-w-sm">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-white">Update Available</h3>
              <p className="text-sm text-gray-300">A new version of the app is ready.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="btn btn-sm btn-primary bg-cyan-400 text-navy-900"
              >
                Refresh
              </button>
              <button
                onClick={() => setNeedRefresh(false)}
                className="btn btn-sm btn-ghost text-gray-400"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {offlineReady && (
        <div className="alert alert-success shadow-lg glass-card border-green-400 max-w-sm mt-2">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-white">Ready for Offline Use</h3>
              <p className="text-sm text-gray-300">App cached for offline access.</p>
            </div>
            <button
              onClick={handleOfflineReady}
              className="btn btn-sm btn-ghost text-gray-400"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Install Prompt Component
 * Handles beforeinstallprompt event for PWA installation
 */
export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up md:left-auto md:right-4">
      <div className="alert alert-info shadow-lg glass-card border-cyan-400 max-w-sm">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 002 2v14a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-bold text-white">Install App</h3>
            <p className="text-sm text-gray-300">Add Pothole Detection to your home screen for quick access.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="btn btn-sm btn-primary bg-cyan-400 text-navy-900"
            >
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="btn btn-sm btn-ghost text-gray-400"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Combined PWA component with both update and install prompts
 */
export function PWAComponents() {
  return (
    <>
      <PWAUpdateNotification />
      <PWAInstallPrompt />
    </>
  );
}