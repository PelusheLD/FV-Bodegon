import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface DollarRateData {
  fuente?: string;
  nombre?: string;
  compra?: number;
  venta?: number;
  promedio: number;
  fechaActualizacion?: string;
}

interface DollarRateContextType {
  dollarRate: DollarRateData | null;
  loading: boolean;
  error: string | null;
  convertToBolivares: (usdAmount: number) => number;
  formatCurrency: (amount: number, currency?: 'USD' | 'BS') => string;
  refetch: () => Promise<void>;
}

const DollarRateContext = createContext<DollarRateContextType | undefined>(undefined);

// Clave para localStorage
const CACHE_KEY = 'dollar_rate_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface CachedRate {
  data: DollarRateData;
  timestamp: number;
}

export const DollarRateProvider = ({ children }: { children: ReactNode }) => {
  const [dollarRate, setDollarRate] = useState<DollarRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false); // Evitar múltiples solicitudes simultáneas
  const lastFetchRef = useRef<number>(0);
  const minIntervalRef = useRef(1000); // Mínimo 1 segundo entre solicitudes (60/min = 1/seg)

  // Cargar desde caché al iniciar
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedRate = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        // Si el caché es válido (menos de 5 minutos), usarlo
        if (age < CACHE_DURATION && parsed.data?.promedio) {
          setDollarRate(parsed.data);
          setLoading(false);
          // Si el caché es viejo pero existe, hacer fetch en background
          if (age > 2 * 60 * 1000) { // Más de 2 minutos
            fetchDollarRate();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Error loading cached rate:', err);
    }
    
    // Si no hay caché válido, hacer fetch
    fetchDollarRate();
  }, []);

  const saveToCache = (data: DollarRateData) => {
    try {
      const cache: CachedRate = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.warn('Error saving to cache:', err);
    }
  };

  const fetchDollarRate = async () => {
    // Evitar múltiples solicitudes simultáneas
    if (fetchingRef.current) {
      return;
    }

    // Respetar el límite de 60 solicitudes/minuto (1 por segundo)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (timeSinceLastFetch < minIntervalRef.current) {
      const waitTime = minIntervalRef.current - timeSinceLastFetch;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    fetchingRef.current = true;
    lastFetchRef.current = Date.now();

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
        // Agregar headers para evitar caché del navegador
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        // Si es 429 (Too Many Requests), esperar más tiempo
        if (response.status === 429) {
          minIntervalRef.current = 2000; // Aumentar a 2 segundos
          throw new Error('Límite de solicitudes excedido. Esperando...');
        }
        throw new Error('Error al obtener la tasa del dólar');
      }
      
      const data: DollarRateData[] = await response.json();
      
      // Buscar la tasa oficial (BCV o similar)
      const officialRate = data.find(rate => 
        rate.nombre?.toLowerCase().includes('bcv') || 
        rate.nombre?.toLowerCase().includes('oficial') ||
        rate.fuente?.toLowerCase().includes('bcv')
      ) || data[0]; // Si no encuentra oficial, usar la primera
      
      // Validar que tenemos un promedio válido
      if (officialRate && typeof officialRate.promedio === 'number' && officialRate.promedio > 0) {
        setDollarRate(officialRate);
        saveToCache(officialRate);
        // Si todo va bien, volver al intervalo normal
        minIntervalRef.current = 1000;
      } else {
        throw new Error('Tasa inválida recibida');
      }
      
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener la tasa del dólar');
      console.error('Error fetching dollar rate:', err);
      
      // Si hay error, intentar usar caché aunque sea viejo
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedRate = JSON.parse(cached);
          if (parsed.data?.promedio) {
            setDollarRate(parsed.data);
            setError('Usando tasa en caché (última actualización disponible)');
          }
        }
      } catch (cacheErr) {
        // Ignorar errores de caché
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Actualizar cada 10 minutos (reducido de 5 para evitar límites)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDollarRate();
    }, 10 * 60 * 1000); // 10 minutos
    
    return () => clearInterval(interval);
  }, []);

  const convertToBolivares = (usdAmount: number): number => {
    if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
      return 0;
    }
    
    if (!dollarRate || !dollarRate.promedio) {
      return 0;
    }
    
    const rate = dollarRate.promedio;
    if (isNaN(rate) || rate <= 0) {
      return 0;
    }
    
    const result = usdAmount * rate;
    
    if (isNaN(result) || !isFinite(result)) {
      return 0;
    }
    
    return result;
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'BS' = 'USD') => {
    if (currency === 'BS') {
      return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <DollarRateContext.Provider
      value={{
        dollarRate,
        loading,
        error,
        convertToBolivares,
        formatCurrency,
        refetch: fetchDollarRate
      }}
    >
      {children}
    </DollarRateContext.Provider>
  );
};

export const useDollarRate = () => {
  const context = useContext(DollarRateContext);
  if (context === undefined) {
    throw new Error('useDollarRate must be used within a DollarRateProvider');
  }
  return context;
};

