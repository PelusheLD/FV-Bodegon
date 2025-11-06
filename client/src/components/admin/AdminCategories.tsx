import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, Upload as UploadIcon, Link, Package, Hash, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, buildApiUrl } from "@/lib/queryClient";
import type { Category, Product } from "@shared/schema";

export default function AdminCategories() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Cargar conteos de productos por categoría
  const { data: productCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/admin/products/counts'],
  });

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [allProducts, setAllProducts] = useState<Record<string, Product[]>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  const [categoryImageMode, setCategoryImageMode] = useState<'url' | 'upload'>('url');
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [categoryUploading, setCategoryUploading] = useState(false);

  const [productImageMode, setProductImageMode] = useState<'url' | 'upload'>('url');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productUploading, setProductUploading] = useState(false);

  const { toast } = useToast();

  // Función para cargar productos paginados
  const loadProductsForCategory = async (categoryId: string, page: number = 1, append: boolean = false) => {
    try {
      setLoadingMore(prev => ({ ...prev, [categoryId]: true }));
      
      const response = await fetch(buildApiUrl(`/api/admin/products/category/${categoryId}?page=${page}&limit=200`), {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (append) {
        setAllProducts(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), ...data.products]
        }));
      } else {
        setAllProducts(prev => ({
          ...prev,
          [categoryId]: data.products
        }));
      }
      
      setHasMore(prev => ({ ...prev, [categoryId]: data.hasMore }));
      setCurrentPage(prev => ({ ...prev, [categoryId]: page }));
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Cargar productos cuando se expande una categoría
  useEffect(() => {
    expandedCategories.forEach(categoryId => {
      if (!allProducts[categoryId] || allProducts[categoryId].length === 0) {
        loadProductsForCategory(categoryId, 1, false);
      }
    });
  }, [expandedCategories]);

  // Función para cargar más productos
  const loadMoreProducts = (categoryId: string) => {
    if (hasMore[categoryId] && !loadingMore[categoryId]) {
      const nextPage = (currentPage[categoryId] || 1) + 1;
      loadProductsForCategory(categoryId, nextPage, true);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen');
    }

    const data = await response.json();
    return data.url;
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/categories', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Categoría creada" });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryImageState();
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
      resetCategoryImageState();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/counts'] });
      setCategoryToDelete(null);
      toast({ title: "Categoría eliminada" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/products', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/counts'] });
      toast({ title: "Producto creado" });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductImageState();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/products/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/counts'] });
      toast({ title: "Producto actualizado" });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductImageState();
    },
  });

  // Mutación específica para toggle de productos destacados
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/products/${id}`, { method: 'PUT', body: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/counts'] });
      const isFeatured = variables.data.featured;
      toast({
        title: "Producto actualizado",
        description: `El producto ha sido ${isFeatured ? 'marcado como destacado' : 'desmarcado de destacados'}`,
      });
    },
    onError: (error, variables) => {
      // Revertir el estado en caso de error
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products/counts'] });
      toast({ title: "Producto eliminado" });
    },
  });

  const resetCategoryImageState = () => {
    setCategoryImageFile(null);
    setCategoryImageUrl('');
    setCategoryImageMode('url');
  };

  const resetProductImageState = () => {
    setProductImageFile(null);
    setProductImageUrl('');
    setProductImageMode('url');
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const enabled = formData.get('enabled') === 'on';

    let imageUrl = categoryImageUrl;

    if (categoryImageMode === 'upload' && categoryImageFile) {
      setCategoryUploading(true);
      try {
        imageUrl = await uploadImage(categoryImageFile);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo subir la imagen",
          variant: "destructive"
        });
        setCategoryUploading(false);
        return;
      }
      setCategoryUploading(false);
    }

    const dataToSend: any = {
      name,
      enabled,
    };

    if (imageUrl || categoryImageMode === 'url' || categoryImageMode === 'upload') {
      dataToSend.imageUrl = imageUrl || null;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: dataToSend });
    } else {
      createCategoryMutation.mutate(dataToSend);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const measurementType = formData.get('measurementType') as 'unit' | 'weight';
    const featured = formData.get('featured') === 'on';

    let imageUrl = productImageUrl;

    if (productImageMode === 'upload' && productImageFile) {
      setProductUploading(true);
      try {
        imageUrl = await uploadImage(productImageFile);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo subir la imagen",
          variant: "destructive"
        });
        setProductUploading(false);
        return;
      }
      setProductUploading(false);
    }

    const dataToSend: any = {
      name,
      price,
      measurementType,
      categoryId: selectedCategoryForProduct || editingProduct?.categoryId || '',
      featured,
    };

    // Incluir stock si está presente
    const stock = formData.get('stock') as string;
    if (stock !== null && stock !== '') {
      dataToSend.stock = stock;
    }

    if (imageUrl || productImageMode === 'url' || productImageMode === 'upload') {
      dataToSend.imageUrl = imageUrl || null;
    }

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: dataToSend });
    } else {
      createProductMutation.mutate(dataToSend);
    }
  };

  const toggleCategoryEnabled = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category.id,
      data: { ...category, enabled: !category.enabled },
    });
  };

  const toggleCategoryLeySeca = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category.id,
      data: { ...category, leySeca: !category.leySeca },
    });
  };

  const toggleProductFeatured = (product: Product) => {
    const newFeaturedState = !(product as any).featured;
    
    // Actualización optimista removida - ya no cargamos todos los productos
    // queryClient.setQueryData(['/api/products'], (oldData: any) => {
    //   if (!oldData) return oldData;
    //   return oldData.map((p: any) => 
    //     p.id === product.id ? { ...p, featured: newFeaturedState } : p
    //   );
    // });

    // Actualización optimista del cache local allProducts
    if (allProducts[product.categoryId]) {
      setAllProducts(prev => ({
        ...prev,
        [product.categoryId]: prev[product.categoryId].map((p: any) => 
          p.id === product.id ? { ...p, featured: newFeaturedState } : p
        )
      }));
    }

    toggleFeaturedMutation.mutate({
      id: product.id,
      data: { ...product, featured: newFeaturedState },
    });
  };

  const getCategoryProducts = (categoryId: string) => {
    // Solo usar productos paginados - no hay fallback a todos los productos
    return allProducts[categoryId] || [];
  };

  const openCategoryDialog = (category: Category | null) => {
    setEditingCategory(category);
    setCategoryImageFile(null);
    setCategoryImageMode('url');
    if (category?.imageUrl) {
      setCategoryImageUrl(category.imageUrl);
    } else {
      setCategoryImageUrl('');
    }
    setIsCategoryDialogOpen(true);
  };

  const openProductDialog = (product: Product | null, categoryId: string | null) => {
    setEditingProduct(product);
    setSelectedCategoryForProduct(categoryId);
    setProductImageFile(null);
    setProductImageMode('url');
    if (product?.imageUrl) {
      setProductImageUrl(product.imageUrl);
    } else {
      setProductImageUrl('');
    }
    setIsProductDialogOpen(true);
  };

  if (categoriesLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-semibold">Categorías y Productos</h2>
        <Button
          onClick={() => openCategoryDialog(null)}
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
                        {productCounts[category.id] || 0} producto{(productCounts[category.id] || 0) !== 1 ? 's' : ''}
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

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.leySeca || false}
                        onCheckedChange={() => toggleCategoryLeySeca(category)}
                        data-testid={`switch-ley-seca-${category.id}`}
                        className="data-[state=checked]:bg-red-600"
                      />
                      <span className="text-sm text-muted-foreground">
                        {category.leySeca ? (
                          <span className="text-red-600 font-semibold text-xs">LEY SECA</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Normal</span>
                        )}
                      </span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openCategoryDialog(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCategoryToDelete(category)}
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
                      onClick={() => openProductDialog(null, category.id)}
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
                                {(product as any).externalCode && (
                                  <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    {(product as any).externalCode}
                                  </span>
                                )}
                                {(product as any).stock && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    Stock: {(product as any).stock}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={(product as any).featured || false}
                                onCheckedChange={() => toggleProductFeatured(product)}
                                data-testid={`switch-product-featured-${product.id}`}
                                className="data-[state=checked]:bg-yellow-500 transition-all duration-200"
                              />
                              <span className="text-sm text-muted-foreground">
                                {(product as any).featured ? (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 transition-colors duration-200" />
                                ) : (
                                  <Star className="h-4 w-4 text-gray-400 transition-colors duration-200" />
                                )}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openProductDialog(product, product.categoryId)}
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
                      
                      {/* Botón para cargar más productos */}
                      {hasMore[category.id] && (
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => loadMoreProducts(category.id)}
                            disabled={loadingMore[category.id]}
                            className="w-full"
                          >
                            {loadingMore[category.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                Cargando...
                              </>
                            ) : (
                              `Cargar más productos (${allProducts[category.id]?.length || 0} de ${categoryProducts.length})`
                            )}
                          </Button>
                        </div>
                      )}
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

              <div className="space-y-3">
                <Label>Imagen de la Categoría</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={categoryImageMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryImageMode('url')}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={categoryImageMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryImageMode('upload')}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Subir archivo
                  </Button>
                </div>

                {categoryImageMode === 'url' ? (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={categoryImageUrl}
                      onChange={(e) => setCategoryImageUrl(e.target.value)}
                      data-testid="input-category-image-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega la URL de una imagen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCategoryImageFile(e.target.files?.[0] || null)}
                      data-testid="input-category-image-file"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen (JPG, PNG, WEBP, GIF - máximo 5MB)
                    </p>
                  </div>
                )}

                {(categoryImageUrl || categoryImageFile) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Vista previa:</p>
                    <div className="h-32 w-32 rounded-md bg-muted overflow-hidden">
                      <img 
                        src={categoryImageFile ? URL.createObjectURL(categoryImageFile) : categoryImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
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
              <Button 
                type="submit" 
                data-testid="button-save-category" 
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending || categoryUploading}
              >
                {(createCategoryMutation.isPending || updateCategoryMutation.isPending || categoryUploading) ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product-category">Categoría</Label>
                <Select
                  value={selectedCategoryForProduct || editingProduct?.categoryId || ''}
                  onValueChange={setSelectedCategoryForProduct}
                >
                  <SelectTrigger data-testid="select-product-category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Cambia la categoría del producto
                </p>
              </div>

              {(editingProduct as any)?.externalCode && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product-external-code">Código Externo (Valery)</Label>
                  <Input
                    id="product-external-code"
                    value={(editingProduct as any)?.externalCode || ''}
                    disabled
                    className="bg-muted"
                    data-testid="input-product-external-code"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código del sistema Valery (no editable)
                  </p>
                </div>
              )}

              {(editingProduct as any)?.stock !== undefined && (
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock Actual</Label>
                  <Input
                    id="product-stock"
                    name="stock"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(editingProduct as any)?.stock || '0'}
                    data-testid="input-product-stock"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad disponible en inventario
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-featured" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Producto Destacado
                  </Label>
                  <Switch
                    id="product-featured"
                    name="featured"
                    defaultChecked={(editingProduct as any)?.featured || false}
                    data-testid="switch-product-featured"
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Los productos destacados aparecen en la sección principal del sitio
                </p>
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label>Imagen del Producto</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={productImageMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductImageMode('url')}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={productImageMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductImageMode('upload')}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Subir archivo
                  </Button>
                </div>

                {productImageMode === 'url' ? (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={productImageUrl}
                      onChange={(e) => setProductImageUrl(e.target.value)}
                      data-testid="input-product-image-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega la URL de una imagen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                      data-testid="input-product-image-file"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen (JPG, PNG, WEBP, GIF - máximo 5MB)
                    </p>
                  </div>
                )}

                {(productImageUrl || productImageFile) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Vista previa:</p>
                    <div className="h-32 w-32 rounded-md bg-muted overflow-hidden">
                      <img 
                        src={productImageFile ? URL.createObjectURL(productImageFile) : productImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                data-testid="button-save-product" 
                disabled={createProductMutation.isPending || updateProductMutation.isPending || productUploading}
              >
                {(createProductMutation.isPending || updateProductMutation.isPending || productUploading) ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar categoría */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {categoryToDelete && (
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas eliminar la categoría <strong>"{categoryToDelete.name}"</strong>?
                {productCounts[categoryToDelete.id] > 0 && (
                  <span className="block mt-2 text-destructive">
                    Esta categoría tiene {productCounts[categoryToDelete.id]} producto(s). 
                    Todos los productos de esta categoría también serán eliminados.
                  </span>
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCategoryToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete.id);
                }
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
