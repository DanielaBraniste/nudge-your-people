import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';

interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  timeWindow?: "morning" | "afternoon" | "evening";
  method: "call" | "text" | "dm" | "other";
}

// Store active timeouts
const activeTimeouts: { [key: string]: NodeJS.Timeout } = {};

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Check for pending notifications on mount and periodically
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check immediately
    checkAndFirePendingNotifications();

    // Check every minute for notifications that should have fired
    const interval = setInterval(checkAndFirePendingNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const checkAndFirePendingNotifications = useCallback(() => {
    const scheduledNotifications = JSON.parse(
      localStorage.getItem('scheduledNotifications') || '{}'
    );
    const now = Date.now();

    Object.entries(scheduledNotifications).forEach(([personId, notif]: [string, any]) => {
      const scheduledTime = notif.scheduledTime;
      
      // If notification time has passed and hasn't been fired yet
      if (scheduledTime <= now && !notif.fired) {
        showNotification(notif);
        
        // Mark as fired
        notif.fired = true;
        scheduledNotifications[personId] = notif;
        localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
        
        // Reschedule next occurrence
        const storedPeople = localStorage.getItem('catchUpPeople');
        if (storedPeople) {
          const people: Person[] = JSON.parse(storedPeople);
          const person = people.find(p => p.id === personId);
          if (person) {
            // Wait a bit before scheduling the next one
            setTimeout(() => scheduleNotification(person), 1000);
          }
        }
      }
    });
  }, []);

  const showNotification = (notif: any) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`Time to catch up with ${notif.personName}!`, {
        body: `Don't forget to ${getMethodText(notif.method)} ${notif.personName}`,
        icon: '/icon.png', // Add your icon path
        badge: '/badge.png', // Add your badge path
        tag: notif.personId,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // You could navigate to a specific page here
      };

      // Also show toast
      toast({
        title: `Time to catch up with ${notif.personName}!`,
        description: `Don't forget to ${getMethodText(notif.method)} them`,
        duration: 10000,
      });
    }
  };

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
    // Use current time in user's timezone
    const now = lastContactDate || new Date();
    let nextDate = new Date(now);

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

    // For non-daily schedules, check if the day already has 3+ catch-ups
    if (person.frequency !== 'daily') {
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        const dateStr = nextDate.toDateString();
        
        const catchUpsOnDate = Object.values(scheduledNotifications).filter((notif: any) => {
          if (notif.personId === person.id) return false;
          
          const notifDate = new Date(notif.scheduledTime);
          const storedPeople = localStorage.getItem('catchUpPeople');
          if (storedPeople) {
            const people: Person[] = JSON.parse(storedPeople);
            const notifPerson = people.find(p => p.id === notif.personId);
            if (notifPerson && notifPerson.frequency === 'daily') return false;
          }
          
          return notifDate.toDateString() === dateStr;
        }).length;
        
        if (catchUpsOnDate < 3) {
          break;
        }
        
        nextDate.setDate(nextDate.getDate() + 1);
        attempts++;
      }
    }

    // Set the time in local timezone
    if (person.timeType === 'fixed' && person.fixedTime) {
      const [hours, minutes] = person.fixedTime.split(':');
      nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
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
        default:
          minHour = 13;
          maxHour = 17;
      }
      
      const randomHour = Math.floor(Math.random() * (maxHour - minHour)) + minHour;
      const randomMinute = Math.floor(Math.random() * 60);
      nextDate.setHours(randomHour, randomMinute, 0, 0);
    }

    return nextDate;
  };

  const scheduleNotification = (person: Person) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const nextTime = getNextCatchUpTime(person);
    const now = new Date().getTime();
    const scheduledTime = nextTime.getTime();
    const delay = scheduledTime - now;
    
    const formattedTime = formatInTimeZone(nextTime, timezone, 'PPp');

    // Store scheduled notification
    const scheduledNotifications = JSON.parse(
      localStorage.getItem('scheduledNotifications') || '{}'
    );
    scheduledNotifications[person.id] = {
      personId: person.id,
      personName: person.name,
      method: person.method,
      scheduledTime: scheduledTime,
      formattedTime: formattedTime,
      timezone: timezone,
      fired: false,
    };
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));

    // Clear existing timeout for this person
    if (activeTimeouts[person.id]) {
      clearTimeout(activeTimeouts[person.id]);
    }

    // Schedule notification with setTimeout (max ~24.8 days due to setTimeout limit)
    if (delay > 0 && delay < 2147483647) {
      activeTimeouts[person.id] = setTimeout(() => {
        showNotification(scheduledNotifications[person.id]);
        
        // Mark as fired
        scheduledNotifications[person.id].fired = true;
        localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
        
        // Schedule next occurrence
        setTimeout(() => scheduleNotification(person), 1000);
        
      }, delay);
      
      console.log(`Scheduled notification for ${person.name} at ${formattedTime} (in ${Math.round(delay/1000/60)} minutes)`);
    } else if (delay > 0) {
      // For very long delays, the checkAndFirePendingNotifications will catch it
      console.log(`Notification for ${person.name} scheduled for ${formattedTime} (will be checked periodically)`);
    }
  };

  const cancelNotification = (personId: string) => {
    // Clear timeout
    if (activeTimeouts[personId]) {
      clearTimeout(activeTimeouts[personId]);
      delete activeTimeouts[personId];
    }

    // Remove from storage
    const scheduledNotifications = JSON.parse(
      localStorage.getItem('scheduledNotifications') || '{}'
    );
    delete scheduledNotifications[personId];
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
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

  const confirmCatchUp = (personId: string) => {
    const storedPeople = localStorage.getItem('catchUpPeople');
    if (!storedPeople) return;
    
    const people: Person[] = JSON.parse(storedPeople);
    const person = people.find(p => p.id === personId);
    if (!person) return;

    cancelNotification(personId);
    scheduleNotification(person);

    toast({
      title: "Catch-up confirmed! 🎉",
      description: `Great job staying in touch with ${person.name}`,
    });
  };

  return {
    permission,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    scheduleAllNotifications,
    getNextCatchUpTime,
    confirmCatchUp,
  };
};
