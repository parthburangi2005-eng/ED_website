import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Equipment from "./pages/Equipment";
import Labs from "./pages/Labs";
import Alerts from "./pages/Alerts";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SignedIn>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/labs" element={<Labs />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <SignIn />
        </div>
      </SignedOut>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
