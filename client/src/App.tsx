import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DollarRateProvider } from "@/contexts/DollarRateContext";
import HomePage from "@/pages/home";
import AdminLoginPage from "@/pages/admin-login";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { apiRequest, getToken, removeToken } from "./lib/queryClient";

function Router() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [location, setLocation] = useLocation();

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      const token = getToken();
      if (!token) {
        setIsAdminAuthenticated(false);
        setIsCheckingSession(false);
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
          setLocation('/admin/login');
        }
        return;
      }

      try {
        const user = await apiRequest('/api/auth/session');
        if (user && user.id) {
          setIsAdminAuthenticated(true);
          // Si estamos en /admin/login y estamos autenticados, redirigir a /admin
          const currentPath = window.location.pathname;
          if (currentPath === '/admin/login') {
            setLocation('/admin');
          }
        } else {
          setIsAdminAuthenticated(false);
          removeToken();
        }
      } catch (error: any) {
        // Si es un error 401, eliminar el token y redirigir a login
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          setIsAdminAuthenticated(false);
          removeToken();
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
            setLocation('/admin/login');
          }
        }
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [setLocation]);

  // Verificar sesión también cuando cambia la ruta a /admin (después de la verificación inicial)
  useEffect(() => {
    if (!isCheckingSession && location.startsWith('/admin')) {
      const token = getToken();
      if (!token) {
        setIsAdminAuthenticated(false);
        if (location !== '/admin/login') {
          setLocation('/admin/login');
        }
        return;
      }

      const verifySession = async () => {
        try {
          const user = await apiRequest('/api/auth/session');
          if (user && user.id) {
            setIsAdminAuthenticated(true);
            // Si estamos en /admin/login y estamos autenticados, redirigir
            if (location === '/admin/login') {
              setLocation('/admin');
            }
          } else {
            setIsAdminAuthenticated(false);
            removeToken();
            if (location !== '/admin/login') {
              setLocation('/admin/login');
            }
          }
        } catch (error: any) {
          // Si es un error 401, eliminar el token y redirigir a login
          if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            setIsAdminAuthenticated(false);
            removeToken();
            if (location !== '/admin/login') {
              setLocation('/admin/login');
            }
          }
        }
      };
      verifySession();
    }
  }, [location, isCheckingSession, setLocation]);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setLocation("/admin");
  };

  const handleAdminLogout = async () => {
    // Limpiar estado inmediatamente
    setIsAdminAuthenticated(false);
    removeToken();
    
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignorar errores en logout, pero continuar con la limpieza
    }
    
    // Limpiar todas las queries del cache
    queryClient.clear();
    
    // Redirigir a la página principal
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
      <DollarRateProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </DollarRateProvider>
    </QueryClientProvider>
  );
}

export default App;
