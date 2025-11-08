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
      
      const data: ExchangeRateResponse = await response.json();
      
      // Adaptar la respuesta de la nueva API al formato esperado por el componente
      const adaptedRate: DollarRateData = {
        fuente: 'DolarVzla',
        nombre: 'Tasa Oficial',
        compra: data.current.usd,
        venta: data.current.usd,
        promedio: data.current.usd,
        fechaActualizacion: data.current.date,
      };
      
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
    if (!dollarRate) return 0;
    return usdAmount * dollarRate.promedio;
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





