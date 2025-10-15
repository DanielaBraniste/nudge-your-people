import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Detect problematic in-app browsers
const isProblematicBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('instagram') || ua.includes('fb') || ua.includes('facebook');
};

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Preserves all user data in localStorage
 * Disables service worker in problematic in-app browsers
 */
export const SilentUpdate = () => {
  const isProblemBrowser = isProblematicBrowser();

  // Only use the hook if not in a problematic browser
  const shouldRegister = !isProblemBrowser && 'serviceWorker' in navigator;

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: shouldRegister,
    onRegisteredSW(swUrl, registration) {
      if (isProblemBrowser) {
        console.log('In-app browser detected - service worker disabled');
        return;
      }
      
      console.log('Service Worker registered:', swUrl);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      if (!isProblemBrowser) {
        console.error('Service Worker registration error:', error);
      }
    },
  });

  useEffect(() => {
    if (needRefresh && shouldRegister) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker, shouldRegister]);

  useEffect(() => {
    if (isProblemBrowser) {
      console.log('🔧 Running in compatibility mode (in-app browser detected)');
    }
  }, [isProblemBrowser]);

  return null;
};
