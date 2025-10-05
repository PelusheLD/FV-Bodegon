import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, Product } from "@shared/schema";

export default function AdminCategories() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const { toast } = useToast();

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/categories', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Categoría creada" });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryImageFile(null);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/categories/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Categoría actualizada" });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryImageFile(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Categoría eliminada" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/products', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Producto creado" });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductImageFile(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/products/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Producto actualizado" });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductImageFile(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Producto eliminado" });
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const enabled = formData.get('enabled') === 'on';

    const data = {
      name,
      enabled,
      imageUrl: categoryImageFile ? URL.createObjectURL(categoryImageFile) : editingCategory?.imageUrl,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const measurementType = formData.get('measurementType') as 'unit' | 'weight';

    const data = {
      name,
      price,
      measurementType,
      categoryId: selectedCategoryForProduct || editingProduct?.categoryId || '',
      imageUrl: productImageFile ? URL.createObjectURL(productImageFile) : editingProduct?.imageUrl,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const toggleCategoryEnabled = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category.id,
      data: { ...category, enabled: !category.enabled },
    });
  };

  const getCategoryProducts = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId);
  };

  if (categoriesLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold">Categorías y Productos</h2>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsCategoryDialogOpen(true);
          }}
          data-testid="button-add-category"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const categoryProducts = getCategoryProducts(category.id);

          return (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleCategory(category.id)}
                      className="flex-shrink-0"
                      data-testid={`button-toggle-category-${category.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {category.imageUrl && (
                      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.enabled}
                        onCheckedChange={() => toggleCategoryEnabled(category)}
                        data-testid={`switch-category-${category.id}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {category.enabled ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsCategoryDialogOpen(true);
                      }}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="flex items-center justify-between mb-4 mt-4 flex-wrap gap-2">
                    <h3 className="font-semibold">Productos</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryForProduct(category.id);
                        setEditingProduct(null);
                        setIsProductDialogOpen(true);
                      }}
                      data-testid={`button-add-product-${category.id}`}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {categoryProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay productos en esta categoría
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {categoryProducts.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-md border hover-elevate flex-wrap gap-2"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {product.imageUrl && (
                              <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-primary font-semibold">
                                  ${parseFloat(product.price).toFixed(2)}
                                  {product.measurementType === 'weight' ? '/kg' : ''}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.measurementType === 'weight' ? '(Por peso)' : '(Por unidad)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingProduct(product);
                                setSelectedCategoryForProduct(product.categoryId);
                                setIsProductDialogOpen(true);
                              }}
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nombre</Label>
                <Input
                  id="category-name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  data-testid="input-category-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-image">Imagen de la Categoría</Label>
                <Input
                  id="category-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCategoryImageFile(e.target.files?.[0] || null)}
                  data-testid="input-category-image"
                />
                <p className="text-xs text-muted-foreground">
                  Esta imagen se mostrará en la página principal
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="category-enabled">Categoría habilitada</Label>
                <Switch
                  id="category-enabled"
                  name="enabled"
                  defaultChecked={editingCategory?.enabled ?? true}
                  data-testid="switch-category-enabled"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-save-category" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre</Label>
                <Input
                  id="product-name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  data-testid="input-product-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-measurement">Tipo de medida</Label>
                <select
                  id="product-measurement"
                  name="measurementType"
                  defaultValue={editingProduct?.measurementType || 'unit'}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  data-testid="select-measurement-type"
                >
                  <option value="unit">Por unidad</option>
                  <option value="weight">Por peso (kg/gramos)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Productos por unidad: bebidas, jabones. Por peso: carnes, frutas.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-price">Precio</Label>
                <Input
                  id="product-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingProduct?.price}
                  required
                  data-testid="input-product-price"
                />
                <p className="text-xs text-muted-foreground">
                  Si es por peso, indica el precio por kilogramo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-image">Imagen del Producto</Label>
                <Input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                  data-testid="input-product-image"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-save-product" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                {createProductMutation.isPending || updateProductMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
