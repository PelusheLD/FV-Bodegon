import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, ArrowLeftRight } from 'lucide-react';
import { useDollarRate } from '@/contexts/DollarRateContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface DollarRateData {
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
}

const DollarRate: React.FC = () => {
  const { dollarRate, loading, error, formatCurrency, refetch } = useDollarRate();
  const { currency, toggleCurrency } = useCurrency();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Tasa no disponible</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Dólar Oficial</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCurrency}
                className="h-6 w-6 p-0"
                title={`Cambiar a ${currency === 'USD' ? 'Bolívares' : 'Dólares'}`}
              >
                <ArrowLeftRight className="h-3 w-3" />
              </Button>
              <button
                onClick={refetch}
                disabled={loading}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Rate Display */}
          {dollarRate ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tasa:</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  Bs. {formatCurrency(dollarRate.promedio)}
                </Badge>
              </div>

              {/* Currency Toggle Info */}
              <div className="text-xs text-muted-foreground text-center">
                Priorizar {currency === 'USD' ? 'Dólares' : 'Bolívares'}
              </div>

              {/* Source and Update Time */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dollarRate.nombre}</span>
                  <span>Actualizado: {formatTime(new Date())}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DollarRate;
