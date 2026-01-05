import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import RegisterPage from "@/pages/register";
import LeaderboardPage from "@/pages/leaderboard";
import HistoryPage from "@/pages/history";
import GalleryPage from "@/pages/gallery";
import AuthPage from "@/pages/auth-page";

import AdminDashboard from "@/pages/admin/index";
import AdminCategories from "@/pages/admin/categories";
import AdminRegistrations from "@/pages/admin/registrations";
import AdminRace from "@/pages/admin/race";
import AdminLeaderboard from "@/pages/admin/admin-leaderboard";
import AdminHistory from "@/pages/admin/admin-history";
import AdminGallery from "@/pages/admin/gallery";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Route {...rest} component={AuthPage} />;
  }

  return <Route {...rest} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/gallery" component={GalleryPage} />

      <Route path="/auth" component={AuthPage} />

      {/* Protected Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/categories" component={AdminCategories} />
      <ProtectedRoute path="/admin/registrations" component={AdminRegistrations} />
      <ProtectedRoute path="/admin/race" component={AdminRace} />
      <ProtectedRoute path="/admin/leaderboard" component={AdminLeaderboard} />
      <ProtectedRoute path="/admin/history" component={AdminHistory} />
      <ProtectedRoute path="/admin/gallery" component={AdminGallery} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bull-race-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
