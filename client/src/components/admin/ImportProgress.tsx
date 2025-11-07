import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { buildApiUrl } from "@/lib/queryClient";

interface ProgressData {
  type: 'connected' | 'start' | 'progress' | 'complete' | 'error';
  message: string;
  total?: number;
  processed?: number;
  imported?: number;
  errors?: number;
}

interface ImportProgressProps {
  sessionId: string | null;
  onComplete?: (data: ProgressData) => void;
  onError?: (data: ProgressData) => void;
}

export default function ImportProgress({ sessionId, onComplete, onError }: ImportProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Crear conexión Server-Sent Events
    // Nota: EventSource no soporta headers personalizados, pero este endpoint no requiere autenticación
    const eventSource = new EventSource(buildApiUrl(`/api/products/import-progress/${sessionId}`));
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setProgress(data);

        if (data.type === 'complete') {
          onComplete?.(data);
          eventSource.close();
        } else if (data.type === 'error') {
          onError?.(data);
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, [sessionId, onComplete, onError]);

  if (!sessionId || !progress) return null;

  const percentage = progress.total && progress.processed 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  const getStatusIcon = () => {
    if (progress.type === 'complete') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (progress.type === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  };

  const getStatusColor = () => {
    if (progress.type === 'complete') return 'text-green-600';
    if (progress.type === 'error') return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className={`font-medium ${getStatusColor()}`}>
                {progress.message}
              </p>
              {progress.total && progress.processed && (
                <p className="text-sm text-muted-foreground">
                  {progress.processed} de {progress.total} productos procesados
                </p>
              )}
            </div>
          </div>

          {progress.total && progress.processed && (
            <div className="space-y-2">
              <Progress value={percentage} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{percentage}% completado</span>
                {progress.imported !== undefined && (
                  <span>{progress.imported} productos importados</span>
                )}
              </div>
            </div>
          )}

          {progress.errors !== undefined && progress.errors > 0 && (
            <div className="text-sm text-amber-600">
              ⚠️ {progress.errors} errores encontrados
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

