import { useQuery, useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteSettings } from "@shared/schema";

export default function AdminSettings() {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/settings'],
  });

  const { toast } = useToast();

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/settings', { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({ 
        title: "Configuración guardada", 
        description: "Los cambios se verán reflejados en el sitio web" 
      });
    },
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      siteName: formData.get('siteName') as string,
      heroTitle: (formData.get('heroTitle') as string) || undefined,
      siteDescription: formData.get('siteDescription') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactAddress: formData.get('contactAddress') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
      facebookUrl: formData.get('facebookUrl') as string,
      instagramUrl: formData.get('instagramUrl') as string,
      instagramAccessToken: formData.get('instagramAccessToken') as string,
      twitterUrl: formData.get('twitterUrl') as string,
      taxPercentage: formData.get('taxPercentage') as string,
      latitude: formData.get('latitude') as string,
      longitude: formData.get('longitude') as string,
      paymentBank: (formData.get('paymentBank') as string) || undefined,
      paymentCI: (formData.get('paymentCI') as string) || undefined,
      paymentPhone: (formData.get('paymentPhone') as string) || undefined,
      paymentInstructions: (formData.get('paymentInstructions') as string) || undefined,
      enableCarousel1: formData.get('enableCarousel1') === 'on',
      enableCarousel2: formData.get('enableCarousel2') === 'on',
      enableCarousel3: formData.get('enableCarousel3') === 'on',
      // Carrusel Hero
      carouselTitle1: (formData.get('carouselTitle1') as string) || undefined,
      carouselSubtitle1: (formData.get('carouselSubtitle1') as string) || undefined,
      carouselDescription1: (formData.get('carouselDescription1') as string) || undefined,
      carouselImage1: (formData.get('carouselImage1') as string) || undefined,
      carouselBackground1: (formData.get('carouselBackground1') as string) || undefined,
      carouselButton1: (formData.get('carouselButton1') as string) || undefined,
      carouselUrl1: (formData.get('carouselUrl1') as string) || undefined,
      carouselTitle2: (formData.get('carouselTitle2') as string) || undefined,
      carouselSubtitle2: (formData.get('carouselSubtitle2') as string) || undefined,
      carouselDescription2: (formData.get('carouselDescription2') as string) || undefined,
      carouselImage2: (formData.get('carouselImage2') as string) || undefined,
      carouselBackground2: (formData.get('carouselBackground2') as string) || undefined,
      carouselButton2: (formData.get('carouselButton2') as string) || undefined,
      carouselUrl2: (formData.get('carouselUrl2') as string) || undefined,
      carouselTitle3: (formData.get('carouselTitle3') as string) || undefined,
      carouselSubtitle3: (formData.get('carouselSubtitle3') as string) || undefined,
      carouselDescription3: (formData.get('carouselDescription3') as string) || undefined,
      carouselImage3: (formData.get('carouselImage3') as string) || undefined,
      carouselBackground3: (formData.get('carouselBackground3') as string) || undefined,
      carouselButton3: (formData.get('carouselButton3') as string) || undefined,
      carouselUrl3: (formData.get('carouselUrl3') as string) || undefined,
    };

    console.log("Frontend sending data:", data);
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold">Configuración del Sitio</h2>
        <p className="text-muted-foreground">Personaliza la información de tu bodega</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Información básica del sitio web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nombre del Sitio</Label>
              <Input
                id="siteName"
                name="siteName"
                defaultValue={settings?.siteName}
                required
                data-testid="input-site-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroTitle">Título del Hero (opcional)</Label>
              <Input
                id="heroTitle"
                name="heroTitle"
                placeholder="Texto grande del encabezado en la portada"
                defaultValue={(settings as any)?.heroTitle || ''}
                data-testid="input-hero-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">Descripción</Label>
              <Textarea
                id="siteDescription"
                name="siteDescription"
                defaultValue={settings?.siteDescription}
                required
                data-testid="input-site-description"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription>Datos que se mostrarán en el footer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Teléfono</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                defaultValue={settings?.contactPhone}
                required
                data-testid="input-contact-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Correo Electrónico</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings?.contactEmail}
                required
                data-testid="input-contact-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactAddress">Dirección</Label>
              <Input
                id="contactAddress"
                name="contactAddress"
                defaultValue={settings?.contactAddress}
                required
                data-testid="input-contact-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                placeholder="+58 412 123 4567"
                defaultValue={settings?.whatsappNumber || ''}
                data-testid="input-whatsapp-number"
              />
              <p className="text-xs text-muted-foreground">
                Número de WhatsApp para el botón flotante de contacto (incluye código de país)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxPercentage">Porcentaje de IVA (%)</Label>
              <Input
                id="taxPercentage"
                name="taxPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={settings?.taxPercentage || '16.00'}
                required
                data-testid="input-tax-percentage"
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje de IVA incluido en los precios de los productos (ej: 16.00 para 16%)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos Bancarios para Pagos</CardTitle>
            <CardDescription>Información de cuenta para pagos móviles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentBank">Banco</Label>
              <Input
                id="paymentBank"
                name="paymentBank"
                placeholder="Banplus"
                defaultValue={settings?.paymentBank || ''}
                data-testid="input-payment-bank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentCI">Cédula del Titular</Label>
              <Input
                id="paymentCI"
                name="paymentCI"
                placeholder="J-503280280"
                defaultValue={settings?.paymentCI || ''}
                data-testid="input-payment-ci"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPhone">Teléfono para Pago Móvil</Label>
              <Input
                id="paymentPhone"
                name="paymentPhone"
                type="tel"
                placeholder="04245775917"
                defaultValue={settings?.paymentPhone || ''}
                data-testid="input-payment-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInstructions">Instrucciones de Pago</Label>
              <Textarea
                id="paymentInstructions"
                name="paymentInstructions"
                placeholder="IMPORTANTE: Indicar número de teléfono, banco, cédula titular del pago móvil para confirmar."
                rows={3}
                defaultValue={settings?.paymentInstructions || ''}
                data-testid="input-payment-instructions"
              />
              <p className="text-xs text-muted-foreground">
                Instrucciones que se mostrarán a los clientes al realizar el pago
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
            <CardDescription>Coordenadas para el mapa de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitud</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="0.000000000000001"
                  min="-90"
                  max="90"
                  placeholder="9.552533674221890"
                  defaultValue={settings?.latitude || '9.552533674221890'}
                  required
                  data-testid="input-latitude"
                />
                <p className="text-xs text-muted-foreground">
                  Coordenada de latitud para el mapa de contacto (15 decimales de precisión)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitud</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="0.000000000000001"
                  min="-180"
                  max="180"
                  placeholder="-69.205197603437410"
                  defaultValue={settings?.longitude || '-69.205197603437410'}
                  required
                  data-testid="input-longitude"
                />
                <p className="text-xs text-muted-foreground">
                  Coordenada de longitud para el mapa de contacto (15 decimales de precisión)
                </p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Cómo obtener las coordenadas:</strong><br />
                1. Ve a <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">Google Maps</a><br />
                2. Busca tu ubicación<br />
                3. Haz clic derecho en el punto exacto<br />
                4. Selecciona las coordenadas que aparecen<br />
                5. Copia y pega aquí
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
            <CardDescription>Enlaces a tus perfiles sociales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                placeholder="https://facebook.com/..."
                defaultValue={settings?.facebookUrl || ''}
                data-testid="input-facebook-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                placeholder="https://instagram.com/..."
                defaultValue={settings?.instagramUrl || ''}
                data-testid="input-instagram-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramAccessToken">Instagram Access Token</Label>
              <Input
                id="instagramAccessToken"
                name="instagramAccessToken"
                type="password"
                placeholder="Token de acceso de Instagram..."
                defaultValue={settings?.instagramAccessToken || ''}
                data-testid="input-instagram-access-token"
              />
              <p className="text-xs text-muted-foreground">
                Token de acceso para mostrar las últimas publicaciones de Instagram en la página
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter URL</Label>
              <Input
                id="twitterUrl"
                name="twitterUrl"
                type="url"
                placeholder="https://twitter.com/..."
                defaultValue={settings?.twitterUrl || ''}
                data-testid="input-twitter-url"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrusel Hero</CardTitle>
            <CardDescription>Configura las 3 vistas del carrusel principal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vista 1 - FV BODEGONES */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Vista 1 - FV BODEGONES</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enableCarousel1" className="text-sm">Habilitar</Label>
                  <Switch
                    id="enableCarousel1"
                    name="enableCarousel1"
                    defaultChecked={settings?.enableCarousel1 ?? true}
                    data-testid="switch-enable-carousel-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carouselTitle1">Título</Label>
                  <Input
                    id="carouselTitle1"
                    name="carouselTitle1"
                    placeholder="FV BODEGONES"
                    defaultValue={settings?.carouselTitle1 || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carouselSubtitle1">Subtítulo</Label>
                  <Input
                    id="carouselSubtitle1"
                    name="carouselSubtitle1"
                    placeholder="Tu tienda de confianza"
                    defaultValue={settings?.carouselSubtitle1 || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselDescription1">Descripción</Label>
                <Textarea
                  id="carouselDescription1"
                  name="carouselDescription1"
                  placeholder="Productos de consumo diario, Abierto las 24 horas, los 365 días del año"
                  defaultValue={settings?.carouselDescription1 || ''}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselImage1">URL de la Imagen</Label>
                <Input
                  id="carouselImage1"
                  name="carouselImage1"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  defaultValue={settings?.carouselImage1 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselBackground1">URL de la Imagen de Fondo</Label>
                <Input
                  id="carouselBackground1"
                  name="carouselBackground1"
                  type="url"
                  placeholder="https://ejemplo.com/fondo.jpg"
                  defaultValue={settings?.carouselBackground1 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselButton1">Texto del Botón</Label>
                <Input
                  id="carouselButton1"
                  name="carouselButton1"
                  placeholder="Ir a Bodega"
                  defaultValue={settings?.carouselButton1 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselUrl1">URL del Botón</Label>
                <Input
                  id="carouselUrl1"
                  name="carouselUrl1"
                  type="url"
                  placeholder="https://ejemplo.com/bodega"
                  defaultValue={settings?.carouselUrl1 || ''}
                />
              </div>
            </div>

            {/* Vista 2 - ZONA LONNGE */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Vista 2 - ZONA LONNGE</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enableCarousel2" className="text-sm">Habilitar</Label>
                  <Switch
                    id="enableCarousel2"
                    name="enableCarousel2"
                    defaultChecked={settings?.enableCarousel2 ?? true}
                    data-testid="switch-enable-carousel-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carouselTitle2">Título</Label>
                  <Input
                    id="carouselTitle2"
                    name="carouselTitle2"
                    placeholder="ZONA LONNGE"
                    defaultValue={settings?.carouselTitle2 || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carouselSubtitle2">Subtítulo</Label>
                  <Input
                    id="carouselSubtitle2"
                    name="carouselSubtitle2"
                    placeholder="Tu zona de entretenimiento"
                    defaultValue={settings?.carouselSubtitle2 || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselDescription2">Descripción</Label>
                <Textarea
                  id="carouselDescription2"
                  name="carouselDescription2"
                  placeholder="Productos para tu diversión y entretenimiento, siempre disponibles"
                  defaultValue={settings?.carouselDescription2 || ''}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselImage2">URL de la Imagen</Label>
                <Input
                  id="carouselImage2"
                  name="carouselImage2"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  defaultValue={settings?.carouselImage2 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselBackground2">URL de la Imagen de Fondo</Label>
                <Input
                  id="carouselBackground2"
                  name="carouselBackground2"
                  type="url"
                  placeholder="https://ejemplo.com/fondo.jpg"
                  defaultValue={settings?.carouselBackground2 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselButton2">Texto del Botón</Label>
                <Input
                  id="carouselButton2"
                  name="carouselButton2"
                  placeholder="Ir a Lounge"
                  defaultValue={settings?.carouselButton2 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselUrl2">URL del Botón</Label>
                <Input
                  id="carouselUrl2"
                  name="carouselUrl2"
                  type="url"
                  placeholder="https://ejemplo.com/lounge"
                  defaultValue={settings?.carouselUrl2 || ''}
                />
              </div>
            </div>

            {/* Vista 3 - FV FARMACIA */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Vista 3 - FV FARMACIA</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enableCarousel3" className="text-sm">Habilitar</Label>
                  <Switch
                    id="enableCarousel3"
                    name="enableCarousel3"
                    defaultChecked={settings?.enableCarousel3 ?? true}
                    data-testid="switch-enable-carousel-3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carouselTitle3">Título</Label>
                  <Input
                    id="carouselTitle3"
                    name="carouselTitle3"
                    placeholder="FV FARMACIA"
                    defaultValue={settings?.carouselTitle3 || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carouselSubtitle3">Subtítulo</Label>
                  <Input
                    id="carouselSubtitle3"
                    name="carouselSubtitle3"
                    placeholder="Tu farmacia de confianza"
                    defaultValue={settings?.carouselSubtitle3 || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselDescription3">Descripción</Label>
                <Textarea
                  id="carouselDescription3"
                  name="carouselDescription3"
                  placeholder="Medicamentos y productos de salud, cuidado personal y bienestar"
                  defaultValue={settings?.carouselDescription3 || ''}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselImage3">URL de la Imagen</Label>
                <Input
                  id="carouselImage3"
                  name="carouselImage3"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  defaultValue={settings?.carouselImage3 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselBackground3">URL de la Imagen de Fondo</Label>
                <Input
                  id="carouselBackground3"
                  name="carouselBackground3"
                  type="url"
                  placeholder="https://ejemplo.com/fondo.jpg"
                  defaultValue={settings?.carouselBackground3 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselButton3">Texto del Botón</Label>
                <Input
                  id="carouselButton3"
                  name="carouselButton3"
                  placeholder="Ir a Farmacia"
                  defaultValue={settings?.carouselButton3 || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carouselUrl3">URL del Botón</Label>
                <Input
                  id="carouselUrl3"
                  name="carouselUrl3"
                  type="url"
                  placeholder="https://ejemplo.com/farmacia"
                  defaultValue={settings?.carouselUrl3 || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" data-testid="button-save-settings" disabled={updateSettingsMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
