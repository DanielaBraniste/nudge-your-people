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
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      // Just log it - don't let it break anything
      console.log('Service Worker not available in this browser (this is normal for in-app browsers)');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      try {
        updateServiceWorker(true);
      } catch (e) {
        console.log('Update skipped');
      }
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};
