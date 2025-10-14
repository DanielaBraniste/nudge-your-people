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
// Keep SilentUpdate disabled for now
// import { SilentUpdate } from "./components/SilentUpdate";

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
      {/* <SilentUpdate /> - Keep disabled */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
