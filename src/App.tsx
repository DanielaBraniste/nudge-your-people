import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Setup from "./pages/Setup";
import CalendarView from "./pages/CalendarView";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { NotificationPermission } from "./components/NotificationPermission";
import { ConfirmCatchUpDialog } from "./components/ConfirmCatchUpDialog";
import { AnalyticsForm } from "./components/AnalyticsForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <NotificationPermission />
      <ConfirmCatchUpDialog />
      <AnalyticsForm />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/calendar" element={<CalendarView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
