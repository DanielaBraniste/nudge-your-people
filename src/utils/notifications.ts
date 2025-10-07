interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  timeWindow?: "morning" | "afternoon" | "evening";
  method: "call" | "text" | "dm" | "other";
}

const getRandomTimeInWindow = (window: "morning" | "afternoon" | "evening"): string => {
  const windows = {
    morning: { start: 7, end: 11 },
    afternoon: { start: 13, end: 17 },
    evening: { start: 18, end: 22 },
  };

  const { start, end } = windows[window];
  const hour = Math.floor(Math.random() * (end - start)) + start;
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const getNextDate = (frequency: string, lastDate: Date): Date => {
  const next = new Date(lastDate);
  
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "random":
      next.setDate(next.getDate() + Math.floor(Math.random() * 7) + 1);
      break;
  }
  
  return next;
};

export const scheduleNotifications = () => {
  const storedPeople = localStorage.getItem("catchUpPeople");
  if (!storedPeople) return;

  const people: Person[] = JSON.parse(storedPeople);
  
  // Clear existing scheduled notifications
  const existingTimers = localStorage.getItem("notificationTimers");
  if (existingTimers) {
    const timers = JSON.parse(existingTimers);
    timers.forEach((timerId: number) => clearTimeout(timerId));
  }

  const timers: number[] = [];

  people.forEach((person) => {
    scheduleNextNotification(person, timers);
  });

  localStorage.setItem("notificationTimers", JSON.stringify(timers));
};

const scheduleNextNotification = (person: Person, timers: number[]) => {
  const now = new Date();
  let nextDate = new Date(now);
  
  const time = person.timeType === "fixed" 
    ? person.fixedTime! 
    : getRandomTimeInWindow(person.timeWindow!);

  const [hours, minutes] = time.split(':').map(Number);
  nextDate.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for next occurrence
  if (nextDate <= now) {
    nextDate = getNextDate(person.frequency, nextDate);
  }

  const delay = nextDate.getTime() - now.getTime();

  if (delay > 0 && delay < 2147483647) { // Max timeout value
    const timerId = window.setTimeout(() => {
      showNotification(person);
      // Schedule the next one
      const newNextDate = getNextDate(person.frequency, nextDate);
      scheduleNextNotification(person, timers);
    }, delay);

    timers.push(timerId);
  }
};

const showNotification = (person: Person) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const methodEmoji = {
      call: "📞",
      text: "💬",
      dm: "📱",
      other: "✨"
    }[person.method];

    new Notification("Time to Catch Up! 🎉", {
      body: `${methodEmoji} Reach out to ${person.name}`,
      icon: "/placeholder.svg",
      badge: "/placeholder.svg",
      tag: person.id,
      requireInteraction: true,
    });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
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
