import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Preserves all user data in localStorage
 */
export const SilentUpdate = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Silently update and reload
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // This component doesn't render anything - it works silently in the background
  return null;
};
