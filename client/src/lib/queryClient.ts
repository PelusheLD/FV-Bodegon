import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

// Función helper para construir URLs de API
export function buildApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  
  // Si no hay baseUrl configurado, mostrar error en desarrollo
  if (!baseUrl && import.meta.env.DEV) {
    console.error('VITE_API_URL no está configurado. Las peticiones API fallarán.');
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

export async function apiRequest(
  url: string,
  options: ApiRequestOptions = {},
): Promise<any> {
  const { method = 'GET', body, headers = {} } = options;
  
  // Construir la URL completa usando buildApiUrl
  const fullUrl = buildApiUrl(url);
  
  // Obtener el token del localStorage
  const token = getToken();
  const authHeaders: Record<string, string> = {};
  
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  await throwIfResNotOk(res);
  
  if (res.status === 204) {
    return null;
  }
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  return await res.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildApiUrl(queryKey.join("/") as string);
    const token = getToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
