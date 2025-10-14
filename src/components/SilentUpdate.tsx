import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { isServiceWorkerSupported, isInAppBrowser, getBrowserInfo } from '@/lib/browserDetection';

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Skips service worker registration in in-app browsers for compatibility
 */
export const SilentUpdate = () => {
  const shouldRegister = isServiceWorkerSupported();
  
  useEffect(() => {
    if (isInAppBrowser()) {
      console.log(`Running in ${getBrowserInfo()} - Service Worker disabled for compatibility`);
    }
  }, []);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!shouldRegister) return;
      
      console.log('Service Worker registered:', swUrl);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('Service Worker registration error (OK in in-app browsers):', error);
    },
    // Only register if not in an in-app browser
    immediate: shouldRegister,
  });

  useEffect(() => {
    if (needRefresh && shouldRegister) {
      // Silently update and reload
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker, shouldRegister]);

  return null;
};
