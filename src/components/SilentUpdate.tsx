import { useEffect } from 'react';

// Detect problematic in-app browsers
const isProblematicBrowser = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('instagram') || 
         ua.includes('fb') || 
         ua.includes('fbav') ||
         ua.includes('fban') ||
         ua.includes('facebook') ||
         ua.includes('telegram');
};

/**
 * PWA Registration Component (for normal browsers only)
 */
const PWARegistration = () => {
  const { useRegisterSW } = require('virtual:pwa-register/react');
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration) {
      console.log('Service Worker registered:', swUrl);
      
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: any) {
      console.log('Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

/**
 * Silent Update Component
 * Automatically updates the PWA when a new version is available
 * Skips PWA registration entirely in problematic in-app browsers
 */
export const SilentUpdate = () => {
  const isProblemBrowser = isProblematicBrowser();

  useEffect(() => {
    if (isProblemBrowser) {
      console.log('🔧 In-app browser detected (Telegram/Instagram/Facebook) - running in compatibility mode');
    }
  }, [isProblemBrowser]);

  // Don't render PWA logic at all in problematic browsers
  if (isProblemBrowser) {
    return null;
  }

  return <PWARegistration />;
};
