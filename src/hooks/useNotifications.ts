import { useEffect, useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';

interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  fixedDay?: string;
  fixedDayOfMonth?: number;
  timeWindow?: "morning" | "afternoon" | "evening";
  method: "call" | "text" | "dm" | "other";
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const activeTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check for pending notifications every minute
    const checkInterval = setInterval(() => {
      checkAndFirePendingNotifications();
    }, 60000);

    // Check immediately on mount
    checkAndFirePendingNotifications();

    return () => {
      clearInterval(checkInterval);
      // Clear all timeouts on unmount
      Object.values(activeTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const checkAndFirePendingNotifications = () => {
    try {
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      const now = Date.now();

      Object.entries(scheduledNotifications).forEach(([personId, notif]: [string, any]) => {
        if (!notif) return;
        
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
            try {
              const people: Person[] = JSON.parse(storedPeople);
              const person = people.find(p => p.id === personId);
              if (person) {
                setTimeout(() => scheduleNotification(person), 2000);
              }
            } catch (e) {
              console.error('Error rescheduling notification:', e);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  };

  const showNotification = (notif: any) => {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(`Time to catch up with ${notif.personName}!`, {
          body: `Don't forget to ${getMethodText(notif.method)} ${notif.personName}`,
          tag: notif.personId,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      // Also show toast
      toast({
        title: `Time to catch up with ${notif.personName}!`,
        description: `Don't forget to ${getMethodText(notif.method)} them`,
        duration: 10000,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const requestPermission = async () => {
    try {
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
          description: "You won't receive catch-up reminders. Enable them in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const getDayOfWeekNumber = (dayName: string): number => {
    const days: { [key: string]: number } = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return days[dayName.toLowerCase()] || 1; // Default to Monday if not found
  };

  const getNextOccurrenceOfDay = (targetDay: number, targetTime: string, weeksToAdd: number = 1): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    
    // If it's the same day, check if the target time has already passed
    if (daysUntilTarget === 0 && targetTime) {
      const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
      const targetDateTime = new Date();
      targetDateTime.setHours(targetHours, targetMinutes, 0, 0);
      
      // If the target time has already passed today, schedule for next occurrence
      if (now.getTime() >= targetDateTime.getTime()) {
        daysUntilTarget = 7 * weeksToAdd;
      }
      // Otherwise, schedule for today (daysUntilTarget stays 0)
    } else if (daysUntilTarget < 0) {
      daysUntilTarget += 7 * weeksToAdd;
    }
    
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilTarget);
    return nextDate;
  };

  const getNextOccurrenceOfDayOfMonth = (targetDay: number): Date => {
    const now = new Date();
    let nextDate = new Date(now);
    
    // Try current month first
    nextDate.setDate(targetDay);
    
    // If the date is in the past or doesn't exist in current month, try next month
    if (nextDate <= now || nextDate.getDate() !== targetDay) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
      
      // If day doesn't exist in next month either (e.g., Feb 30), use last day of month
      if (nextDate.getDate() !== targetDay) {
        nextDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
      }
    }
    
    return nextDate;
  };

  const getNextCatchUpTime = (person: Person, lastContactDate?: Date): Date => {
    const now = lastContactDate || new Date();
    let nextDate = new Date(now);

    // Handle fixed day scheduling for weekly/biweekly - WITH TIME CHECK
    if (person.timeType === 'fixed' && person.fixedDay && 
        (person.frequency === 'weekly' || person.frequency === 'biweekly')) {
      const targetDayNumber = getDayOfWeekNumber(person.fixedDay);
      const weeksToAdd = person.frequency === 'biweekly' ? 2 : 1;
      
      // Get next occurrence of the day, considering the time
      nextDate = getNextOccurrenceOfDay(targetDayNumber, person.fixedTime || '12:00', weeksToAdd);
      
      // Set the time immediately after getting the day
      if (person.fixedTime) {
        const [hours, minutes] = person.fixedTime.split(':');
        nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      // If this is scheduled for today and time hasn't passed, return immediately
      // This prevents the 3+ catch-ups check from moving it to tomorrow
      if (nextDate.toDateString() === now.toDateString() && nextDate.getTime() > now.getTime()) {
        return nextDate;
      }
    }
    // Handle fixed day of month for monthly
    else if (person.timeType === 'fixed' && person.fixedDayOfMonth && 
             person.frequency === 'monthly') {
      nextDate = getNextOccurrenceOfDayOfMonth(person.fixedDayOfMonth);
      
      // Set the time
      if (person.timeType === 'fixed' && person.fixedTime) {
        const [hours, minutes] = person.fixedTime.split(':');
        nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    }
    // Handle other frequency patterns
    else {
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
          const randomDays = Math.floor(Math.random() * 12) + 3;
          nextDate.setDate(nextDate.getDate() + randomDays);
          break;
      }
      
      // Set the time for non-fixed-day schedules
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
    }

    // For non-daily schedules, check if the day already has 3+ catch-ups
    // Skip this check if we already determined this is same-day scheduling above
    if (person.frequency !== 'daily' && !(nextDate.toDateString() === now.toDateString() && nextDate.getTime() > now.getTime())) {
      try {
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
              try {
                const people: Person[] = JSON.parse(storedPeople);
                const notifPerson = people.find(p => p.id === notif.personId);
                if (notifPerson && notifPerson.frequency === 'daily') return false;
              } catch (e) {
                return false;
              }
            }
            
            return notifDate.toDateString() === dateStr;
          }).length;
          
          if (catchUpsOnDate < 3) {
            break;
          }
          
          // Move to next occurrence
          if (person.timeType === 'fixed' && person.fixedDay && 
              (person.frequency === 'weekly' || person.frequency === 'biweekly')) {
            const weeksToAdd = person.frequency === 'biweekly' ? 2 : 1;
            nextDate.setDate(nextDate.getDate() + (7 * weeksToAdd));
            // Re-set the time after moving the date
            if (person.fixedTime) {
              const [hours, minutes] = person.fixedTime.split(':');
              nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }
          } else if (person.timeType === 'fixed' && person.fixedDayOfMonth && 
                     person.frequency === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
            // Re-set the time after moving the date
            if (person.fixedTime) {
              const [hours, minutes] = person.fixedTime.split(':');
              nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }
          } else {
            nextDate.setDate(nextDate.getDate() + 1);
          }
          
          attempts++;
        }
      } catch (error) {
        console.error('Error checking date availability:', error);
      }
    }

    return nextDate;
  };

  const scheduleNotification = (person: Person) => {
    try {
      const nextTime = getNextCatchUpTime(person);
      const now = new Date().getTime();
      const scheduledTime = nextTime.getTime();
      const delay = scheduledTime - now;
      
      console.log(`DEBUG: Person: ${person.name}, Day: ${person.fixedDay}, Time: ${person.fixedTime}`);
      console.log(`DEBUG: Next scheduled date: ${nextTime.toString()}`);
      console.log(`DEBUG: Delay in minutes: ${Math.round(delay/1000/60)}`);
      
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
      if (activeTimeoutsRef.current[person.id]) {
        clearTimeout(activeTimeoutsRef.current[person.id]);
        delete activeTimeoutsRef.current[person.id];
      }

      // Schedule notification with setTimeout (max ~24.8 days due to setTimeout limit)
      if (delay > 0 && delay < 2147483647) {
        activeTimeoutsRef.current[person.id] = setTimeout(() => {
          const currentNotifications = JSON.parse(
            localStorage.getItem('scheduledNotifications') || '{}'
          );
          
          if (currentNotifications[person.id]) {
            showNotification(currentNotifications[person.id]);
            
            // Mark as fired
            currentNotifications[person.id].fired = true;
            localStorage.setItem('scheduledNotifications', JSON.stringify(currentNotifications));
            
            // Schedule next occurrence
            setTimeout(() => scheduleNotification(person), 2000);
          }
        }, delay);
        
        console.log(`Scheduled notification for ${person.name} at ${formattedTime} (in ${Math.round(delay/1000/60)} minutes)`);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelNotification = (personId: string) => {
    try {
      // Clear timeout
      if (activeTimeoutsRef.current[personId]) {
        clearTimeout(activeTimeoutsRef.current[personId]);
        delete activeTimeoutsRef.current[personId];
      }

      // Remove from storage
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      delete scheduledNotifications[personId];
      localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
    } catch (error) {
      console.error('Error canceling notification:', error);
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

  const confirmCatchUp = (personId: string) => {
    try {
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
    } catch (error) {
      console.error('Error confirming catch-up:', error);
    }
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
