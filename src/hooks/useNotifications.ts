import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  timeWindow?: "morning" | "afternoon" | "evening";
  method: "call" | "text" | "dm" | "other";
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "This browser doesn't support notifications",
        variant: "destructive",
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: "Notifications enabled!",
        description: "You'll receive reminders for your catch-ups",
      });
      return true;
    } else {
      toast({
        title: "Notifications blocked",
        description: "You won't receive catch-up reminders",
        variant: "destructive",
      });
      return false;
    }
  };

  const getNextCatchUpTime = (person: Person, lastContactDate?: Date): Date => {
    const now = lastContactDate || new Date();
    const nextDate = new Date(now);

    // Calculate next date based on frequency
    switch (person.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'random':
        // Random between 3-14 days
        const randomDays = Math.floor(Math.random() * 12) + 3;
        nextDate.setDate(nextDate.getDate() + randomDays);
        break;
    }

    // Set the time
    if (person.timeType === 'fixed' && person.fixedTime) {
      const [hours, minutes] = person.fixedTime.split(':');
      nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      // Random time within window
      const timeWindow = person.timeWindow || 'afternoon';
      let minHour, maxHour;
      
      switch (timeWindow) {
        case 'morning':
          minHour = 7;
          maxHour = 11;
          break;
        case 'afternoon':
          minHour = 13;
          maxHour = 17;
          break;
        case 'evening':
          minHour = 18;
          maxHour = 22;
          break;
      }
      
      const randomHour = Math.floor(Math.random() * (maxHour - minHour)) + minHour;
      const randomMinute = Math.floor(Math.random() * 60);
      nextDate.setHours(randomHour, randomMinute, 0, 0);
    }

    return nextDate;
  };

  const scheduleNotification = (person: Person) => {
    if (permission !== 'granted') return;

    const nextTime = getNextCatchUpTime(person);
    const now = new Date().getTime();
    const scheduledTime = nextTime.getTime();
    const delay = scheduledTime - now;

    // Store scheduled notification in localStorage
    const scheduledNotifications = JSON.parse(
      localStorage.getItem('scheduledNotifications') || '{}'
    );
    scheduledNotifications[person.id] = {
      personId: person.id,
      personName: person.name,
      method: person.method,
      scheduledTime: scheduledTime,
    };
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));

    if (delay > 0) {
      // Schedule via service worker if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: {
            id: person.id,
            title: `Time to catch up with ${person.name}!`,
            body: `Don't forget to ${getMethodText(person.method)} ${person.name}`,
            scheduledTime: scheduledTime,
          },
        });
      }
    }
  };

  const cancelNotification = (personId: string) => {
    const scheduledNotifications = JSON.parse(
      localStorage.getItem('scheduledNotifications') || '{}'
    );
    delete scheduledNotifications[personId];
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_NOTIFICATION',
        data: { id: personId },
      });
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'call':
        return 'call';
      case 'text':
        return 'text';
      case 'dm':
        return 'message';
      default:
        return 'reach out to';
    }
  };

  const scheduleAllNotifications = (people: Person[]) => {
    people.forEach(person => scheduleNotification(person));
  };

  return {
    permission,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    scheduleAllNotifications,
    getNextCatchUpTime,
  };
};
