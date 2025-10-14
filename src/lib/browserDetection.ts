export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || '';
  const inAppBrowsers = ['FBAN', 'FBAV', 'Instagram', 'FB_IAB', 'Telegram'];
  return inAppBrowsers.some(browser => ua.includes(browser));
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator && !isInAppBrowser();
};

export const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Instagram')) return 'Instagram Browser';
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook Browser';
  if (ua.includes('Telegram')) return 'Telegram Browser';
  return 'Browser';
};
