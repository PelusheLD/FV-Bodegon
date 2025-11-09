import { useState, useEffect } from 'react';

interface ExchangeRateResponse {
  current: {
    usd: number;
    eur: number;
    date: string;
  };
  previous: {
    usd: number;
    eur: number;
    date: string;
  };
  changePercentage: {
    usd: number;
    eur: number;
  };
}

interface DollarRateData {
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
}

export const useDollarRate = () => {
  const [dollarRate, setDollarRate] = useState<DollarRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDollarRate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.dolarvzla.com/public/exchange-rate');
      
      if (!response.ok) {
        throw new Error('Error al obtener la tasa del dólar');
      }
      
      const data: any = await response.json();
      
      // Validar que la respuesta tenga la estructura esperada y que la tasa sea válida
      let usdRate: number | null = null;
      
      // Intentar diferentes estructuras de respuesta
      if (data?.current?.usd && typeof data.current.usd === 'number') {
        usdRate = data.current.usd;
      } else if (data?.usd && typeof data.usd === 'number') {
        usdRate = data.usd;
      } else if (data?.rate && typeof data.rate === 'number') {
        usdRate = data.rate;
      } else if (typeof data === 'number' && data > 0) {
        usdRate = data;
      }
      
      if (!usdRate || usdRate <= 0 || isNaN(usdRate)) {
        console.error('Invalid exchange rate data:', data);
        throw new Error('La tasa de cambio recibida no es válida');
      }
      
      // Adaptar la respuesta de la nueva API al formato esperado por el componente
      const adaptedRate: DollarRateData = {
        fuente: 'DolarVzla',
        nombre: 'Tasa Oficial',
        compra: usdRate,
        venta: usdRate,
        promedio: usdRate,
        fechaActualizacion: data?.current?.date || data?.date || new Date().toISOString(),
      };
      
      console.log('Exchange rate fetched successfully:', adaptedRate);
      setDollarRate(adaptedRate);
      
    } catch (err) {
      setError('No se pudo obtener la tasa del dólar');
      console.error('Error fetching dollar rate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDollarRate();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDollarRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertToBolivares = (usdAmount: number): number => {
    if (!dollarRate || !dollarRate.promedio || dollarRate.promedio <= 0) {
      return 0;
    }
    if (!usdAmount || usdAmount <= 0 || isNaN(usdAmount)) {
      return 0;
    }
    const result = usdAmount * dollarRate.promedio;
    // Validar que el resultado sea un número válido
    if (isNaN(result) || !isFinite(result)) {
      console.error('Invalid conversion result:', { usdAmount, promedio: dollarRate.promedio, result });
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

  return {
    dollarRate,
    loading,
    error,
    convertToBolivares,
    formatCurrency,
    refetch: fetchDollarRate
  };
};





