import { useQuery, useMutation } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      siteDescription: formData.get('siteDescription') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactAddress: formData.get('contactAddress') as string,
      facebookUrl: formData.get('facebookUrl') as string,
      instagramUrl: formData.get('instagramUrl') as string,
      twitterUrl: formData.get('twitterUrl') as string,
    };

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
