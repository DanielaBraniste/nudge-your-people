import { useEffect, useMemo } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Detect problematic in-app browsers
const isProblematicBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('instagram') || 
         ua.includes('fb') || 
         ua.includes('fbav') ||
         ua.includes('fban') ||
         ua.includes('facebook') ||
         ua.includes('telegram');
};

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Preserves all user data in localStorage
 * Skips service worker registration in problematic in-app browsers
 */
export const SilentUpdate = () => {
  // Check if we're in a problematic browser BEFORE registering
  const shouldSkipRegistration = useMemo(() => isProblematicBrowser(), []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: !shouldSkipRegistration, // Don't register in problematic browsers
    onRegisteredSW(swUrl, registration) {
      if (shouldSkipRegistration) return;
      
      console.log('Service Worker registered:', swUrl);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      if (shouldSkipRegistration) {
        console.log('ℹ️ In-app browser detected - service worker registration skipped');
        return;
      }
      console.log('Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (shouldSkipRegistration) {
      console.log('🔧 Running in compatibility mode (Telegram/Instagram/Facebook in-app browser)');
      return;
    }

    if (needRefresh) {
      // Silently update and reload
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker, shouldSkipRegistration]);

  return null;
};
