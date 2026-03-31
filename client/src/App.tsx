import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient, getToken, clearToken, setToken } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import SegmentDetail from "@/pages/segment-detail";
import CreativePlaybook from "@/pages/creative-playbook";
import Connectors from "@/pages/connectors";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import { useState, useEffect, createContext, useContext } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setDark(d => !d)}
      data-testid="button-theme-toggle"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/connectors" component={Connectors} />
      <Route path="/segment/creative-playbook" component={CreativePlaybook} />
      <Route path="/segment/:slug" component={SegmentDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp({ user, logout }: { user: AuthUser; logout: () => Promise<void> }) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-y-auto">
              <Router hook={useHashLocation}>
                <AppRouter />
              </Router>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthContext.Provider>
  );
}

function App() {
  const token = getToken();

  const { data: user, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const currentToken = getToken();
      if (!currentToken) return null;
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.status === 401) {
        clearToken();
        return null;
      }
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const handleLogin = () => {
    refetch();
  };

  const handleLogout = async () => {
    clearToken();
    queryClient.clear();
    refetch();
  };

  if (token && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AuthenticatedApp user={user} logout={handleLogout} />;
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;
