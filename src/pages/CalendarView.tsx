import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ManagePeopleSheet from "@/components/ManagePeopleSheet";
import { scheduleNotifications, requestNotificationPermission } from "@/utils/notifications";

interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  timeWindow?: "morning" | "afternoon" | "evening";
  method: "call" | "text" | "dm" | "other";
}

interface CatchUpEvent {
  id: string;
  personName: string;
  date: Date;
  time: string;
  frequency: string;
  method: "call" | "text" | "dm" | "other";
}

const CalendarView = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CatchUpEvent[]>([]);

  const loadEvents = () => {
    const storedPeople = localStorage.getItem("catchUpPeople");
    
    if (!storedPeople) {
      navigate("/");
      return;
    }

    const people: Person[] = JSON.parse(storedPeople);
    const generatedEvents: CatchUpEvent[] = [];
    const today = new Date();

    people.forEach((person) => {
      let currentDate = new Date(today);
      
      for (let i = 0; i < 5; i++) {
        const time = person.timeType === "fixed" 
          ? person.fixedTime! 
          : getRandomTimeInWindow(person.timeWindow!);

        generatedEvents.push({
          id: `${person.id}-${i}`,
          personName: person.name,
          date: new Date(currentDate),
          time,
          frequency: person.frequency,
          method: person.method,
        });

        currentDate = getNextDate(person.frequency, currentDate);
      }
    });

    generatedEvents.sort((a, b) => {
      const dateA = new Date(a.date.toDateString() + ' ' + a.time);
      const dateB = new Date(b.date.toDateString() + ' ' + b.time);
      return dateA.getTime() - dateB.getTime();
    });

    setEvents(generatedEvents.slice(0, 5));
  };

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

  useEffect(() => {
    loadEvents();

    // Request notification permission and schedule notifications
    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleNotifications();
        toast({
          title: "Notifications enabled",
          description: "You'll receive reminders when it's time to catch up",
        });
      }
    });
  }, []);

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4 md:p-8">
      <ManagePeopleSheet onUpdate={loadEvents} />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Bell className="h-3 w-3" />
            Notifications Active
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Upcoming Catch-Ups
          </h1>
          <p className="text-muted-foreground">
            Your next 5 scheduled connections
          </p>
        </div>

        <div className="space-y-4">
          {events.map((event, index) => (
            <Card 
              key={event.id}
              className="shadow-md border-0 bg-card/80 backdrop-blur hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{event.personName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.date)} at {event.time}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"}
                    className={index === 0 ? "bg-gradient-to-r from-primary to-accent" : ""}
                  >
                    {event.frequency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    <span>Notification scheduled</span>
                  </div>
                  <Badge variant="outline">
                    {event.method === "call" ? "📞 Call" :
                     event.method === "text" ? "💬 Text" :
                     event.method === "dm" ? "📱 DM" : "✨ Other"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
            <CardContent className="py-12 text-center space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No catch-ups scheduled</h3>
                <p className="text-muted-foreground">
                  Go back to setup and add some people to get started
                </p>
              </div>
              <Button onClick={() => navigate("/")} variant="default">
                Add People
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
