import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/home";
import AdminLoginPage from "@/pages/admin-login";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [, setLocation] = useLocation();

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      try {
        await apiRequest('/api/auth/session');
        setIsAdminAuthenticated(true);
        // Si estamos en una ruta de admin pero no estábamos autenticados, ya no necesitamos redirigir
        // porque ahora estamos autenticados
      } catch (error) {
        setIsAdminAuthenticated(false);
        // Si estamos en /admin y no hay sesión, redirigir a login
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) {
          setLocation('/admin/login');
        }
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [setLocation]);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setLocation("/admin");
  };

  const handleAdminLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignorar errores en logout
    }
    setIsAdminAuthenticated(false);
    setLocation("/");
  };

  // Mostrar loading mientras se verifica la sesión
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      
      <Route path="/admin/login">
        {isAdminAuthenticated ? (
          <AdminPage onLogout={handleAdminLogout} />
        ) : (
          <AdminLoginPage onLogin={handleAdminLogin} />
        )}
      </Route>

      <Route path="/admin">
        {isAdminAuthenticated ? (
          <AdminPage onLogout={handleAdminLogout} />
        ) : (
          <AdminLoginPage onLogin={handleAdminLogin} />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
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
