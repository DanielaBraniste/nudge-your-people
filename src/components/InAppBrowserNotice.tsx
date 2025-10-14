import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, X } from 'lucide-react';
import { isInAppBrowser, getBrowserInfo } from '@/lib/browserDetection';
import { Button } from '@/components/ui/button';

export const InAppBrowserNotice = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed before
    const wasDismissed = localStorage.getItem('in-app-browser-notice-dismissed');
    
    if (isInAppBrowser() && !wasDismissed) {
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('in-app-browser-notice-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <Alert className="border-primary/20 bg-card/95 backdrop-blur">
        <ExternalLink className="h-4 w-4" />
        <AlertDescription className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium mb-1">For the best experience</p>
            <p className="text-sm text-muted-foreground">
              You're viewing this in {getBrowserInfo()}. For full functionality, 
              tap the menu (⋯) and select "Open in Browser".
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
