import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Calendar, Clock, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ManagePeopleSheet from "@/components/ManagePeopleSheet";
import { useNotifications } from "@/hooks/useNotifications";
import { useAnalytics } from "@/hooks/useAnalytics";
import { format } from "date-fns";

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

const Setup = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { scheduleNotification, cancelNotification, scheduleAllNotifications, requestPermission } = useNotifications();
  const { trackPersonAdded } = useAnalytics();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load people on mount
  useEffect(() => {
    loadPeople();
  }, []);

  // Request notification permission once on mount
  useEffect(() => {
    if (requestPermission && Notification.permission === 'default') {
      requestPermission();
    }
  }, []); // Empty dependency array - only run once

  // Clean up past notifications on mount
  useEffect(() => {
    const cleanupPastNotifications = () => {
      try {
        const scheduledNotifications = JSON.parse(
          localStorage.getItem('scheduledNotifications') || '{}'
        );
        const storedPeople = localStorage.getItem('catchUpPeople');
        
        if (!storedPeople) return;
        
        const people: Person[] = JSON.parse(storedPeople);
        const now = Date.now();
        let needsUpdate = false;

        Object.entries(scheduledNotifications).forEach(([personId, notif]: [string, any]) => {
          if (notif.scheduledTime < now && !notif.fired) {
            // Delete the old notification
            delete scheduledNotifications[personId];
            needsUpdate = true;
            
            // Find the person and reschedule
            const person = people.find(p => p.id === personId);
            if (person) {
              // Reschedule after a short delay
              setTimeout(() => {
                scheduleNotification(person);
                // Trigger a refresh of the display
                loadPeople();
              }, 100);
            }
          }
        });

        if (needsUpdate) {
          // Save the cleaned up notifications
          localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
        }
      } catch (error) {
        console.error('Error cleaning up past notifications:', error);
      }
    };

    // Only run cleanup after a short delay to ensure everything is loaded
    const cleanupTimer = setTimeout(cleanupPastNotifications, 500);
    return () => clearTimeout(cleanupTimer);
  }, []); // Empty dependency array - only run once on mount

  const loadPeople = () => {
    const storedPeople = localStorage.getItem("catchUpPeople");
    if (storedPeople) {
      setPeople(JSON.parse(storedPeople));
    }
  };

  const [currentPerson, setCurrentPerson] = useState({
    name: "",
    frequency: "weekly",
    timeType: "random" as "fixed" | "random",
    fixedTime: "12:00",
    fixedDay: "monday",
    fixedDayOfMonth: 1,
    timeWindow: "afternoon" as "morning" | "afternoon" | "evening",
    method: "call" as "call" | "text" | "dm" | "other",
  });

  const handleAddPerson = () => {
    if (!currentPerson.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a person's name",
        variant: "destructive",
      });
      return;
    }

    const newPerson: Person = {
      id: Date.now().toString(),
      name: currentPerson.name,
      frequency: currentPerson.frequency,
      timeType: currentPerson.timeType,
      method: currentPerson.method,
      ...(currentPerson.timeType === "fixed" 
        ? { 
            fixedTime: currentPerson.fixedTime,
            ...(currentPerson.frequency === "weekly" || currentPerson.frequency === "biweekly"
              ? { fixedDay: currentPerson.fixedDay }
              : currentPerson.frequency === "monthly"
              ? { fixedDayOfMonth: currentPerson.fixedDayOfMonth }
              : {}
            )
          }
        : { timeWindow: currentPerson.timeWindow }
      ),
    };

    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);
    localStorage.setItem("catchUpPeople", JSON.stringify(updatedPeople));
    
    // Schedule notification for this person
    scheduleNotification(newPerson);
    
    // Track when person is added
    trackPersonAdded();
    
    setCurrentPerson({
      name: "",
      frequency: "weekly",
      timeType: "random",
      fixedTime: "12:00",
      fixedDay: "monday",
      fixedDayOfMonth: 1,
      timeWindow: "afternoon",
      method: "call",
    });

    toast({
      title: "Person added!",
      description: `${newPerson.name} has been added to your catch-up list`,
    });
  };

  const handleRemovePerson = (id: string) => {
    const updatedPeople = people.filter(p => p.id !== id);
    setPeople(updatedPeople);
    localStorage.setItem("catchUpPeople", JSON.stringify(updatedPeople));
    
    // Cancel notification for this person
    cancelNotification(id);
  };

  const handleViewCalendar = () => {
    if (people.length === 0) {
      toast({
        title: "Add some people first",
        description: "You need to add at least one person before viewing the calendar",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("catchUpPeople", JSON.stringify(people));
    navigate("/calendar");
  };

  const shouldShowDayOfWeekSelector = () => {
    return currentPerson.timeType === "fixed" && 
           (currentPerson.frequency === "weekly" || 
            currentPerson.frequency === "biweekly");
  };

  const shouldShowDayOfMonthSelector = () => {
    return currentPerson.timeType === "fixed" && 
           currentPerson.frequency === "monthly";
  };

  const getDisplayText = (person: Person) => {
    if (person.timeType === "fixed") {
      if (person.fixedDay) {
        return `${person.fixedDay.charAt(0).toUpperCase() + person.fixedDay.slice(1)}s at ${person.fixedTime}`;
      } else if (person.fixedDayOfMonth) {
        const suffix = person.fixedDayOfMonth === 1 ? 'st' : 
                       person.fixedDayOfMonth === 2 ? 'nd' : 
                       person.fixedDayOfMonth === 3 ? 'rd' : 'th';
        return `${person.fixedDayOfMonth}${suffix} of month at ${person.fixedTime}`;
      } else {
        return `At ${person.fixedTime}`;
      }
    } else {
      return `${person.timeWindow!.charAt(0).toUpperCase() + person.timeWindow!.slice(1)}`;
    }
  };

  // Generate day of month options (1-31)
  const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Catch-Up Reminder
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Never miss an opportunity to connect with the people who matter
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            {timezone} • {format(currentTime, 'PPp')}
          </div>
        </div>

        {/* YOUR CATCH-UP LIST CARD - SHOWS FIRST WHEN PEOPLE EXIST */}
        {people.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Catch-Up List ({people.length})</CardTitle>
              <CardDescription>People you're staying in touch with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {people.map((person) => {
                const scheduledNotifications = JSON.parse(
                  localStorage.getItem('scheduledNotifications') || '{}'
                );
                const notification = scheduledNotifications[person.id];
                
                return (
                  <div key={person.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{person.name}</p>
                      <p className="text-sm text-gray-600">
                        {person.frequency.charAt(0).toUpperCase() + person.frequency.slice(1)}
                        {" • "}
                        {getDisplayText(person)}
                        {" • "}
                        {person.method === "call" ? "📞 Call" : 
                         person.method === "text" ? "💬 Text" :
                         person.method === "dm" ? "📱 DM" : "✨ Other"}
                      </p>
                      {notification && (
                        <p className="text-xs text-purple-600 mt-1">
                          Next reminder: {notification.formattedTime}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemovePerson(person.id)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
             <Button onClick={handleViewCalendar} className="w-full mt-6" size="lg" variant="default">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ADD SOMEONE CARD - NOW APPEARS SECOND (OR FIRST IF NO PEOPLE) */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Someone to Catch Up With
            </CardTitle>
            <CardDescription>
              Set up reminders for the people you want to stay in touch with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={currentPerson.name}
                onChange={(e) => setCurrentPerson({ ...currentPerson, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">
                <Clock className="w-4 h-4 inline mr-2" />
                Frequency
              </Label>
              <Select
                value={currentPerson.frequency}
                onValueChange={(value) => setCurrentPerson({ ...currentPerson, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="random">Random Intervals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Catch-up Method</Label>
              <Select
                value={currentPerson.method}
                onValueChange={(value: "call" | "text" | "dm" | "other") =>
                  setCurrentPerson({ ...currentPerson, method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="text">💬 Text</SelectItem>
                  <SelectItem value="dm">📱 DM</SelectItem>
                  <SelectItem value="other">✨ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base">
                <Clock className="w-4 h-4 inline mr-2" />
                Time Preference
              </Label>
              <RadioGroup
                value={currentPerson.timeType}
                onValueChange={(value: "fixed" | "random") =>
                  setCurrentPerson({ ...currentPerson, timeType: value })
                }
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="flex-1 cursor-pointer">
                    Fixed Day & Time
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random" className="flex-1 cursor-pointer">
                    Random Within Time Window
                  </Label>
                </div>
              </RadioGroup>

              {currentPerson.timeType === "fixed" ? (
                <div className="space-y-3 mt-3">
                  {shouldShowDayOfWeekSelector() && (
                    <div>
                      <Label>Day of Week</Label>
                      <Select
                        value={currentPerson.fixedDay}
                        onValueChange={(value) =>
                          setCurrentPerson({ ...currentPerson, fixedDay: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {shouldShowDayOfMonthSelector() && (
                    <div>
                      <Label>Day of Month</Label>
                      <Select
                        value={currentPerson.fixedDayOfMonth.toString()}
                        onValueChange={(value) =>
                          setCurrentPerson({ ...currentPerson, fixedDayOfMonth: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOfMonthOptions.map((day) => {
                            const suffix = day === 1 ? 'st' : 
                                         day === 2 ? 'nd' : 
                                         day === 3 ? 'rd' : 
                                         day === 21 ? 'st' :
                                         day === 22 ? 'nd' :
                                         day === 23 ? 'rd' :
                                         day === 31 ? 'st' : 'th';
                            return (
                              <SelectItem key={day} value={day.toString()}>
                                {day}{suffix}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="mb-2 block">Select Time</Label>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={currentPerson.fixedTime.split(':')[0]}
                          onChange={(e) => {
                            let hour = parseInt(e.target.value) || 0;
                            hour = Math.max(0, Math.min(23, hour));
                            const currentMinute = currentPerson.fixedTime.split(':')[1];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${hour.toString().padStart(2, '0')}:${currentMinute}` 
                            });
                          }}
                          onBlur={(e) => {
                            let hour = parseInt(e.target.value) || 0;
                            hour = Math.max(0, Math.min(23, hour));
                            const currentMinute = currentPerson.fixedTime.split(':')[1];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${hour.toString().padStart(2, '0')}:${currentMinute}` 
                            });
                          }}
                          placeholder="HH"
                          className="text-center text-lg font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-1">Hour</p>
                      </div>
                      
                      <span className="text-2xl font-bold">:</span>
                      
                      <div className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={currentPerson.fixedTime.split(':')[1]}
                          onChange={(e) => {
                            let minute = parseInt(e.target.value) || 0;
                            minute = Math.max(0, Math.min(59, minute));
                            const currentHour = currentPerson.fixedTime.split(':')[0];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${currentHour}:${minute.toString().padStart(2, '0')}` 
                            });
                          }}
                          onBlur={(e) => {
                            let minute = parseInt(e.target.value) || 0;
                            minute = Math.max(0, Math.min(59, minute));
                            const currentHour = currentPerson.fixedTime.split(':')[0];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${currentHour}:${minute.toString().padStart(2, '0')}` 
                            });
                          }}
                          placeholder="MM"
                          className="text-center text-lg font-semibold"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minute</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Time Window</Label>
                  <Select
                    value={currentPerson.timeWindow}
                    onValueChange={(value: "morning" | "afternoon" | "evening") =>
                      setCurrentPerson({ ...currentPerson, timeWindow: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (7am - 11am)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (1pm - 5pm)</SelectItem>
                      <SelectItem value="evening">Evening (6pm - 10pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              onClick={handleAddPerson} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
