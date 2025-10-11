import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ManagePeopleSheet from "@/components/ManagePeopleSheet";
import { useNotifications } from "@/hooks/useNotifications";

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
  scheduledTime: number;
}

const CalendarView = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CatchUpEvent[]>([]);
  const { scheduleNotification } = useNotifications();

  const cleanupAndLoadEvents = () => {
    try {
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      const storedPeople = localStorage.getItem('catchUpPeople');
      
      if (!storedPeople) {
        navigate("/");
        return;
      }

      const people: Person[] = JSON.parse(storedPeople);
      const now = Date.now();
      let needsUpdate = false;

      // Clean up past notifications
      Object.entries(scheduledNotifications).forEach(([personId, notif]: [string, any]) => {
        if (notif.scheduledTime < now && !notif.fired) {
          // Delete the old notification
          delete scheduledNotifications[personId];
          needsUpdate = true;
          
          // Find the person and reschedule
          const person = people.find(p => p.id === personId);
          if (person) {
            setTimeout(() => {
              scheduleNotification(person);
              loadEvents(); // Reload after rescheduling
            }, 100);
          }
        }
      });

      if (needsUpdate) {
        localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
      }

      // Load events after cleanup
      setTimeout(() => loadEvents(), needsUpdate ? 200 : 0);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      loadEvents();
    }
  };

  const loadEvents = () => {
    try {
      const scheduledNotifications = JSON.parse(
        localStorage.getItem('scheduledNotifications') || '{}'
      );
      const storedPeople = localStorage.getItem('catchUpPeople');
      
      if (!storedPeople) {
        navigate("/");
        return;
      }

      const people: Person[] = JSON.parse(storedPeople);
      const now = Date.now();
      const upcomingEvents: CatchUpEvent[] = [];

      // Create events from scheduled notifications
      Object.entries(scheduledNotifications).forEach(([personId, notif]: [string, any]) => {
        // Only include future notifications that haven't fired
        if (notif.scheduledTime > now && !notif.fired) {
          const person = people.find(p => p.id === personId);
          if (person) {
            const scheduledDate = new Date(notif.scheduledTime);
            
            upcomingEvents.push({
              id: personId,
              personName: notif.personName,
              date: scheduledDate,
              time: scheduledDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              frequency: person.frequency,
              method: notif.method,
              scheduledTime: notif.scheduledTime,
            });
          }
        }
      });

      // Sort by scheduled time
      upcomingEvents.sort((a, b) => a.scheduledTime - b.scheduledTime);

      // Take only the next 5
      setEvents(upcomingEvents.slice(0, 5));
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  useEffect(() => {
    // Run cleanup first, then load events
    cleanupAndLoadEvents();
  }, []);

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();

    if (eventDateStr === todayStr) {
      return "Today";
    } else if (eventDateStr === tomorrowStr) {
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
      <ManagePeopleSheet onUpdate={cleanupAndLoadEvents} />
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
            Your next {events.length} scheduled connections
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
