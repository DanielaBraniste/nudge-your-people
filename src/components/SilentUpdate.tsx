import { useEffect } from 'react';

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
 * Manually registers service worker in safe browsers only
 * Completely skips registration in Telegram/Instagram/Facebook
 */
export const SilentUpdate = () => {
  useEffect(() => {
    const isProblemBrowser = isProblematicBrowser();

    if (isProblemBrowser) {
      console.log('🔧 In-app browser detected - running without service worker');
      return;
    }

    // Only register in safe browsers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          console.log('✅ Service Worker registered');

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Auto-reload on update
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 Update available - reloading');
                window.location.reload();
              }
            });
          });
        } catch (error) {
          console.log('ℹ️ Service Worker registration skipped');
        }
      });
    }
  }, []);

  return null;
};
