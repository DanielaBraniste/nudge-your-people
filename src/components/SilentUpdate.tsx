import { useEffect } from 'react';

// Detect problematic in-app browsers
const isProblematicBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('instagram') || ua.includes('fb') || ua.includes('facebook');
};

/**
 * Silent Update Component
 * Handles PWA registration and updates
 * Disables service worker in problematic in-app browsers
 */
export const SilentUpdate = () => {
  useEffect(() => {
    const isProblemBrowser = isProblematicBrowser();

    if (isProblemBrowser) {
      console.log('🔧 In-app browser detected - service worker disabled for compatibility');
      return;
    }

    // Register service worker for normal browsers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw',
            { type: import.meta.env.MODE === 'production' ? 'classic' : 'module' }
          );
          
          console.log('✅ Service Worker registered successfully');

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available, reload silently
                console.log('🔄 New version available, updating...');
                window.location.reload();
              }
            });
          });
        } catch (error) {
          console.log('ℹ️ Service Worker registration skipped:', error);
        }
      });
    }
  }, []);

  return null;
};
