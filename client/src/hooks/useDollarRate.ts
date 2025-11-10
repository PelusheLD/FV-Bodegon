import { useState, useEffect } from 'react';

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
      
      const response = await fetch('https://ve.dolarapi.com/v1/dolares');
      
      if (!response.ok) {
        throw new Error('Error al obtener la tasa del dólar');
      }
      
      const data: DollarRateData[] = await response.json();
      
      // Buscar la tasa oficial (BCV o similar)
      const officialRate = data.find(rate => 
        rate.nombre.toLowerCase().includes('bcv') || 
        rate.nombre.toLowerCase().includes('oficial') ||
        rate.fuente.toLowerCase().includes('bcv')
      ) || data[0]; // Si no encuentra oficial, usar la primera
      
      setDollarRate(officialRate);
      
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





