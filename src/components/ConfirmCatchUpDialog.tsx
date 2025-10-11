import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export const ConfirmCatchUpDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [personId, setPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState<string>("");
  const { confirmCatchUp } = useNotifications();

  useEffect(() => {
    // Check URL for confirmation parameter
    const urlParams = new URLSearchParams(window.location.search);
    const confirmParam = urlParams.get('confirm');
    
    if (confirmParam) {
      handleConfirmRequest(confirmParam);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CONFIRM_CATCHUP' && event.data.personId) {
        handleConfirmRequest(event.data.personId);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleConfirmRequest = (id: string) => {
    // Get person name from localStorage
    const storedPeople = localStorage.getItem('catchUpPeople');
    if (storedPeople) {
      const people: Person[] = JSON.parse(storedPeople);
      const person = people.find(p => p.id === id);
      if (person) {
        setPersonId(id);
        setPersonName(person.name);
        setIsOpen(true);
      }
    }
  };

  const handleConfirm = () => {
    if (personId) {
      confirmCatchUp(personId);
      setIsOpen(false);
      setPersonId(null);
      setPersonName("");
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPersonId(null);
    setPersonName("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Catch-Up</AlertDialogTitle>
          <AlertDialogDescription>
            Did you catch up with {personName}? Confirming will schedule your next reminder.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Not Yet</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Yes, Confirmed!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
