export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const inAppBrowsers = ['instagram', 'fb', 'fbav', 'fban', 'fb_iab', 'telegram'];
  return inAppBrowsers.some(browser => ua.includes(browser));
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator && !isInAppBrowser();
};

export const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Instagram')) return 'Instagram';
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook';
  if (ua.includes('Telegram')) return 'Telegram';
  return 'Browser';
};
