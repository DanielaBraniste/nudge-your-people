/**
 * Detects if the app is running in an in-app browser
 * (Instagram, Facebook, Telegram, etc.)
 */
export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for common in-app browser identifiers
  const inAppBrowsers = [
    'FBAN', // Facebook App
    'FBAV', // Facebook App
    'Instagram', // Instagram
    'FB_IAB', // Facebook In-App Browser
    'FB4A', // Facebook for Android
    'FBIOS', // Facebook for iOS
    'Twitter', // Twitter
    'Line/', // LINE
    'Snapchat', // Snapchat
    'TelegramBot', // Telegram
    'Telegram', // Telegram (some versions)
  ];
  
  return inAppBrowsers.some(browser => ua.indexOf(browser) > -1);
};

/**
 * Checks if service workers are properly supported
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator && !isInAppBrowser();
};

/**
 * Gets a user-friendly browser name
 */
export const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Instagram') > -1) return 'Instagram Browser';
  if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) return 'Facebook Browser';
  if (ua.indexOf('Telegram') > -1) return 'Telegram Browser';
  if (ua.indexOf('Twitter') > -1) return 'Twitter Browser';
  if (ua.indexOf('Line') > -1) return 'LINE Browser';
  
  return 'Browser';
};
