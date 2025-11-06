import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, buildApiUrl } from "@/lib/queryClient";
import ImportProgress from "./ImportProgress";

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Generar sessionId único
      const newSessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      setIsImporting(true);

      const response = await fetch(buildApiUrl('/api/products/import-excel'), {
        method: 'POST',
        headers: {
          'X-Session-ID': newSessionId,
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la importación');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Importación exitosa",
        description: data.message,
      });
      setFile(null);
      setIsImporting(false);
      // Mantener sessionId para mostrar el progreso final
    },
    onError: (error: any) => {
      toast({
        title: "Error en la importación",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
      setIsImporting(false);
      setSessionId(null);
    },
  });

  const handleProgressComplete = (data: any) => {
    setIsImporting(false);
    // El toast ya se muestra en onSuccess de la mutation
  };

  const handleProgressError = (data: any) => {
    setIsImporting(false);
    setSessionId(null);
    toast({
      title: "Error durante la importación",
      description: data.message,
      variant: "destructive",
    });
  };

  const handleFileSelect = (selectedFile: File) => {
    console.log('File selected:', selectedFile.name, 'Type:', selectedFile.type);
    
    // Verificar por extensión también, no solo por MIME type
    const isExcel = selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   selectedFile.type === 'application/vnd.ms-excel' ||
                   selectedFile.type === 'application/excel' ||
                   selectedFile.type === 'application/x-excel' ||
                   selectedFile.type === 'application/x-msexcel' ||
                   selectedFile.name.toLowerCase().endsWith('.xlsx') ||
                   selectedFile.name.toLowerCase().endsWith('.xls');
    
    if (isExcel) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Archivo inválido",
        description: `Tipo de archivo: ${selectedFile.type}. Por favor selecciona un archivo Excel (.xlsx o .xls)`,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    console.log('Submitting file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const formData = new FormData();
    formData.append('excel', file);
    
    // Debug: verificar que el FormData tiene el archivo
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    importMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Importar Productos desde Excel</h2>
        <p className="text-muted-foreground">
          Importa productos desde un archivo Excel exportado de Valery
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archivo Excel</CardTitle>
          <CardDescription>
            El archivo debe contener las columnas: Código, Nombre, Existencia Actual, Precio Máximo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Arrastra tu archivo Excel aquí</p>
                    <p className="text-sm text-muted-foreground">o</p>
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>Seleccionar archivo</span>
                      </Button>
                    </label>
                    <input
                      id="file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) handleFileSelect(selectedFile);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Todos los productos se importarán con la categoría "OTROS". 
                Después de la importación, podrás editar cada producto para asignarle la categoría correcta.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!file || isImporting}
                data-testid="button-import"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Productos
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Barra de progreso */}
      {sessionId && (
        <ImportProgress
          sessionId={sessionId}
          onComplete={handleProgressComplete}
          onError={handleProgressError}
        />
      )}

      {importMutation.data && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importación completada:</strong> {importMutation.data.message}
            {importMutation.data.errors && importMutation.data.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Errores encontrados:</p>
                <ul className="list-disc list-inside text-sm">
                  {importMutation.data.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importMutation.data.errors.length > 5 && (
                    <li>... y {importMutation.data.errors.length - 5} errores más</li>
                  )}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}




