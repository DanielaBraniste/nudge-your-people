import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

interface ManagePeopleSheetProps {
  onUpdate?: () => void;
}

const ManagePeopleSheet = ({ onUpdate }: ManagePeopleSheetProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Person | null>(null);
  const { scheduleNotification, cancelNotification } = useNotifications();

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = () => {
    const storedPeople = localStorage.getItem("catchUpPeople");
    if (storedPeople) {
      setPeople(JSON.parse(storedPeople));
    }
  };

  const savePeople = (updatedPeople: Person[]) => {
    localStorage.setItem("catchUpPeople", JSON.stringify(updatedPeople));
    setPeople(updatedPeople);
    if (onUpdate) onUpdate();
  };

  const handleDelete = (id: string) => {
    const person = people.find(p => p.id === id);
    const updatedPeople = people.filter(p => p.id !== id);
    savePeople(updatedPeople);
    
    // Cancel notification
    cancelNotification(id);
    
    toast({
      title: "Person removed",
      description: `${person?.name} has been removed from your catch-up list`,
    });
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setEditForm({ ...person });
  };

  const handleSave = () => {
    if (!editForm) return;

    const updatedPeople = people.map(p => 
      p.id === editForm.id ? editForm : p
    );
    savePeople(updatedPeople);
    
    // Reschedule notification with updated details
    cancelNotification(editForm.id);
    scheduleNotification(editForm);
    
    setEditingId(null);
    setEditForm(null);
    toast({
      title: "Updated",
      description: `${editForm.name}'s catch-up schedule has been updated`,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50 shadow-lg">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Your Catch-Ups</SheetTitle>
          <SheetDescription>
            View, edit, or delete your scheduled catch-ups
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {people.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No catch-ups scheduled yet</p>
              <p className="text-sm mt-2">Add someone to get started!</p>
            </div>
          ) : (
            people.map((person, index) => (
              <div key={person.id}>
                {editingId === person.id && editForm ? (
                  <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-name-${person.id}`}>Name</Label>
                      <Input
                        id={`edit-name-${person.id}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`edit-frequency-${person.id}`}>Frequency</Label>
                      <Select
                        value={editForm.frequency}
                        onValueChange={(value) => setEditForm({ ...editForm, frequency: value })}
                      >
                        <SelectTrigger id={`edit-frequency-${person.id}`}>
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

                    <div className="space-y-2">
                      <Label htmlFor={`edit-method-${person.id}`}>Method</Label>
                      <Select
                        value={editForm.method}
                        onValueChange={(value: "call" | "text" | "dm" | "other") =>
                          setEditForm({ ...editForm, method: value })
                        }
                      >
                        <SelectTrigger id={`edit-method-${person.id}`}>
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
                      <Label>Time Preference</Label>
                      <RadioGroup
                        value={editForm.timeType}
                        onValueChange={(value: "fixed" | "random") =>
                          setEditForm({ ...editForm, timeType: value })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id={`edit-fixed-${person.id}`} />
                          <Label htmlFor={`edit-fixed-${person.id}`} className="font-normal cursor-pointer">
                            Fixed Time
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="random" id={`edit-random-${person.id}`} />
                          <Label htmlFor={`edit-random-${person.id}`} className="font-normal cursor-pointer">
                            Random Window
                          </Label>
                        </div>
                      </RadioGroup>

                      {editForm.timeType === "fixed" ? (
                        <Input
                          type="time"
                          value={editForm.fixedTime}
                          onChange={(e) => setEditForm({ ...editForm, fixedTime: e.target.value })}
                        />
                      ) : (
                        <Select
                          value={editForm.timeWindow}
                          onValueChange={(value: "morning" | "afternoon" | "evening") =>
                            setEditForm({ ...editForm, timeWindow: value })
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
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.frequency.charAt(0).toUpperCase() + person.frequency.slice(1)}
                        {" • "}
                        {person.timeType === "fixed"
                          ? `At ${person.fixedTime}`
                          : `${person.timeWindow?.charAt(0).toUpperCase() + person.timeWindow?.slice(1)}`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {person.method === "call" ? "📞 Call" :
                         person.method === "text" ? "💬 Text" :
                         person.method === "dm" ? "📱 DM" : "✨ Other"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(person)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(person.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
                {index < people.length - 1 && <Separator className="my-4" />}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ManagePeopleSheet;
