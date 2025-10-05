import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

function Router() {
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
      
      <Button
        size="icon"
        variant="default"
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40"
        onClick={() => setShowAdmin(true)}
        data-testid="button-admin"
      >
        <Settings className="h-6 w-6" />
      </Button>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
