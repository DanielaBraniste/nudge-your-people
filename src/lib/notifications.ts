interface ScheduledNotification {
  id: string;
  personName: string;
  scheduledTime: number; // timestamp
  method: string;
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const scheduleNotification = (
  id: string,
  personName: string,
  scheduledTime: Date,
  method: string
) => {
  const notifications = getScheduledNotifications();
  
  const newNotification: ScheduledNotification = {
    id,
    personName,
    scheduledTime: scheduledTime.getTime(),
    method
  };

  notifications.push(newNotification);
  localStorage.setItem("scheduledNotifications", JSON.stringify(notifications));
  
  // Set up check interval if not already running
  startNotificationChecker();
};

export const getScheduledNotifications = (): ScheduledNotification[] => {
  const stored = localStorage.getItem("scheduledNotifications");
  return stored ? JSON.parse(stored) : [];
};

export const clearScheduledNotifications = () => {
  localStorage.removeItem("scheduledNotifications");
};

export const removeNotification = (id: string) => {
  const notifications = getScheduledNotifications();
  const filtered = notifications.filter(n => n.id !== id);
  localStorage.setItem("scheduledNotifications", JSON.stringify(filtered));
};

let notificationInterval: number | null = null;

export const startNotificationChecker = () => {
  // Don't start multiple intervals
  if (notificationInterval !== null) return;

  // Check every minute
  notificationInterval = window.setInterval(() => {
    checkAndShowNotifications();
  }, 60000); // 60 seconds

  // Also check immediately
  checkAndShowNotifications();
};

export const stopNotificationChecker = () => {
  if (notificationInterval !== null) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};

const checkAndShowNotifications = () => {
  const notifications = getScheduledNotifications();
  const now = Date.now();
  const threshold = 5 * 60 * 1000; // 5 minutes threshold

  notifications.forEach(notification => {
    const timeDiff = notification.scheduledTime - now;
    
    // Show notification if within 5 minutes of scheduled time
    if (timeDiff > 0 && timeDiff <= threshold) {
      showNotification(notification);
      removeNotification(notification.id);
    }
    // Remove if time has passed
    else if (timeDiff < 0) {
      removeNotification(notification.id);
    }
  });
};

const showNotification = (notification: ScheduledNotification) => {
  if (Notification.permission !== "granted") return;

  const methodEmoji = {
    call: "📞",
    text: "💬",
    dm: "📱",
    other: "✨"
  }[notification.method] || "✨";

  new Notification(`Time to catch up with ${notification.personName}!`, {
    body: `${methodEmoji} Scheduled catch-up time`,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: notification.id,
    requireInteraction: true,
    vibrate: [200, 100, 200]
  });

  // Also try to show system notification via service worker if available
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      notification: {
        title: `Time to catch up with ${notification.personName}!`,
        options: {
          body: `${methodEmoji} Scheduled catch-up time`,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: notification.id,
          requireInteraction: true,
          vibrate: [200, 100, 200]
        }
      }
    });
  }
};

// Schedule all notifications from events
export const scheduleAllNotifications = (events: Array<{
  id: string;
  personName: string;
  date: Date;
  time: string;
  method: string;
}>) => {
  clearScheduledNotifications();
  
  events.forEach(event => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const scheduledDate = new Date(event.date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // Only schedule future notifications
    if (scheduledDate.getTime() > Date.now()) {
      scheduleNotification(event.id, event.personName, scheduledDate, event.method);
    }
  });
};
