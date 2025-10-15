import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Preserves all user data in localStorage
 * Gracefully handles in-app browsers that don't support service workers
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
      // Service worker registration failed - this is expected in some browsers
      // (like Instagram in-app browser) and the app will still work fine
      const ua = navigator.userAgent.toLowerCase();
      const isInAppBrowser = ua.includes('instagram') || ua.includes('fb') || ua.includes('facebook');
      
      if (isInAppBrowser) {
        console.log('ℹ️ In-app browser detected - PWA features unavailable (this is normal)');
      } else {
        console.log('Service Worker registration failed:', error);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Silently update and reload
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};
