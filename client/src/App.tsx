import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Rewards from "./pages/rewards";
import Leaderboard from "./pages/leaderboard";
import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";

function HomeOrDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  if (user) {
    setLocation("/dashboard");
    return null;
  }
  
  return <Home />;
}

import AuthPage from "./pages/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeOrDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Navbar />
        <Router />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
