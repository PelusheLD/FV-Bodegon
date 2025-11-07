import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, Heart, Upload as UploadIcon, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, buildApiUrl, getToken } from "@/lib/queryClient";
import type { Sponsor } from "@shared/schema";

export default function AdminSponsors() {
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors?includeDisabled=true'],
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const createSponsorMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/sponsors', { method: 'POST', body: data }),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con sponsors (incluyendo variantes con parámetros)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return typeof key === 'string' && key.startsWith('/api/sponsors');
        }
      });
      toast({ title: "Patrocinador creado" });
      setIsDialogOpen(false);
      setEditingSponsor(null);
      resetForm();
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/sponsors/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con sponsors (incluyendo variantes con parámetros)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return typeof key === 'string' && key.startsWith('/api/sponsors');
        }
      });
      toast({ title: "Patrocinador actualizado" });
      setIsDialogOpen(false);
      setEditingSponsor(null);
      resetForm();
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/sponsors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con sponsors (incluyendo variantes con parámetros)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return typeof key === 'string' && key.startsWith('/api/sponsors');
        }
      });
      toast({ title: "Patrocinador eliminado" });
    },
  });

  const resetForm = () => {
    setImageMode('url');
    setImageFile(null);
    setImageUrl('');
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSponsor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const websiteUrl = formData.get('websiteUrl') as string;
    const order = parseInt(formData.get('order') as string) || 0;
    const enabled = formData.get('enabled') === 'on';

    let logoUrl = imageUrl || editingSponsor?.logoUrl || null;

    if (imageMode === 'upload' && imageFile) {
      const uploadedUrl = await handleImageUpload();
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      } else {
        return; // Error already handled in handleImageUpload
      }
    }

    const data = {
      name,
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
      enabled,
      order,
    };

    if (editingSponsor) {
      updateSponsorMutation.mutate({ id: editingSponsor.id, data });
    } else {
      createSponsorMutation.mutate(data);
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setImageUrl(sponsor.logoUrl || '');
    setImageMode(sponsor.logoUrl ? 'url' : 'url');
    setIsDialogOpen(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    if (confirm(`¿Estás seguro de eliminar el patrocinador "${sponsor.name}"?`)) {
      deleteSponsorMutation.mutate(sponsor.id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Patrocinadores</h2>
          <p className="text-muted-foreground">Gestiona los patrocinadores que aparecen en el sitio</p>
        </div>
        <Button
          onClick={() => {
            setEditingSponsor(null);
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Patrocinador
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay patrocinadores registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                    <CardDescription>
                      Orden: {sponsor.order}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {sponsor.enabled ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sponsor.logoUrl && (
                  <div className="mb-4 flex items-center justify-center bg-gray-50 rounded-lg p-4 h-24">
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="max-w-full max-h-20 object-contain"
                    />
                  </div>
                )}
                {sponsor.websiteUrl && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link className="h-4 w-4" />
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline"
                    >
                      {sponsor.websiteUrl}
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sponsor)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sponsor)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? 'Editar Patrocinador' : 'Nuevo Patrocinador'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSponsor}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSponsor?.name || ''}
                  required
                />
              </div>

              <div>
                <Label>Logo</Label>
                <div className="flex gap-4 mb-4">
                  <Button
                    type="button"
                    variant={imageMode === 'url' ? 'default' : 'outline'}
                    onClick={() => setImageMode('url')}
                  >
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageMode === 'upload' ? 'default' : 'outline'}
                    onClick={() => setImageMode('upload')}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Subir
                  </Button>
                </div>

                {imageMode === 'url' ? (
                  <div>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      type="url"
                      placeholder="https://ejemplo.com/logo.png"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <div className="mt-2 flex items-center justify-center bg-gray-50 rounded-lg p-4 h-24">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="max-w-full max-h-20 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          className="max-w-full max-h-32 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="websiteUrl">URL del Sitio Web</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  placeholder="https://ejemplo.com"
                  defaultValue={editingSponsor?.websiteUrl || ''}
                />
              </div>

              <div>
                <Label htmlFor="order">Orden (menor número aparece primero)</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="0"
                  defaultValue={editingSponsor?.order || 0}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  defaultChecked={editingSponsor?.enabled !== false}
                  className="rounded"
                />
                <Label htmlFor="enabled">Habilitado</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingSponsor(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Subiendo...' : editingSponsor ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

