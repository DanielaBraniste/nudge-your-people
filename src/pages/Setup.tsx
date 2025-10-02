import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Person {
  id: string;
  name: string;
  frequency: string;
  timeType: "fixed" | "random";
  fixedTime?: string;
  timeWindow?: "morning" | "afternoon" | "evening";
}

const Setup = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPerson, setCurrentPerson] = useState({
    name: "",
    frequency: "weekly",
    timeType: "random" as "fixed" | "random",
    fixedTime: "12:00",
    timeWindow: "afternoon" as "morning" | "afternoon" | "evening",
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
      ...(currentPerson.timeType === "fixed" 
        ? { fixedTime: currentPerson.fixedTime }
        : { timeWindow: currentPerson.timeWindow }
      ),
    };

    setPeople([...people, newPerson]);
    setCurrentPerson({
      name: "",
      frequency: "weekly",
      timeType: "random",
      fixedTime: "12:00",
      timeWindow: "afternoon",
    });

    toast({
      title: "Person added!",
      description: `${newPerson.name} has been added to your catch-up list`,
    });
  };

  const handleRemovePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Catch-Up Reminder
          </h1>
          <p className="text-muted-foreground text-lg">
            Never miss an opportunity to connect with the people who matter
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Someone to Catch Up With
            </CardTitle>
            <CardDescription>
              Set up reminders for the people you want to stay in touch with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter person's name"
                value={currentPerson.name}
                onChange={(e) => setCurrentPerson({ ...currentPerson, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Frequency
              </Label>
              <Select
                value={currentPerson.frequency}
                onValueChange={(value) => setCurrentPerson({ ...currentPerson, frequency: value })}
              >
                <SelectTrigger id="frequency">
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

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Preference
              </Label>
              <RadioGroup
                value={currentPerson.timeType}
                onValueChange={(value: "fixed" | "random") => 
                  setCurrentPerson({ ...currentPerson, timeType: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal cursor-pointer">
                    Fixed Time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random" className="font-normal cursor-pointer">
                    Random Within Time Window
                  </Label>
                </div>
              </RadioGroup>

              {currentPerson.timeType === "fixed" ? (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="fixedTime">Select Time</Label>
                  <Input
                    id="fixedTime"
                    type="time"
                    value={currentPerson.fixedTime}
                    onChange={(e) => setCurrentPerson({ ...currentPerson, fixedTime: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="timeWindow">Time Window</Label>
                  <Select
                    value={currentPerson.timeWindow}
                    onValueChange={(value: "morning" | "afternoon" | "evening") =>
                      setCurrentPerson({ ...currentPerson, timeWindow: value })
                    }
                  >
                    <SelectTrigger id="timeWindow">
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

            <Button onClick={handleAddPerson} className="w-full" size="lg">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </CardContent>
        </Card>

        {people.length > 0 && (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Your Catch-Up List ({people.length})</CardTitle>
              <CardDescription>People you're staying in touch with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.frequency.charAt(0).toUpperCase() + person.frequency.slice(1)}
                      {" • "}
                      {person.timeType === "fixed" 
                        ? `At ${person.fixedTime}`
                        : `${person.timeWindow.charAt(0).toUpperCase() + person.timeWindow.slice(1)}`
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePerson(person.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button onClick={handleViewCalendar} className="w-full mt-6" size="lg" variant="default">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Setup;
