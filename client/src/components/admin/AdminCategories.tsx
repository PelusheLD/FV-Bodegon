import { useState } from "react";
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

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  enabled: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Bebidas', enabled: true },
    { id: '2', name: 'Salud y cuidado personal', enabled: true },
    { id: '3', name: 'Carnes, charcutería, aves, cerdo', enabled: false },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Coca Cola 2L', price: 3.50, categoryId: '1' },
    { id: '2', name: 'Pepsi 2L', price: 3.25, categoryId: '1' },
    { id: '3', name: 'Shampoo Herbal', price: 5.99, categoryId: '2' },
  ]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryForProduct, setSelectedCategoryForProduct] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const { toast } = useToast();

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

    if (editingCategory) {
      setCategories(prev =>
        prev.map(cat => (cat.id === editingCategory.id ? { ...cat, name, enabled } : cat))
      );
      toast({ title: "Categoría actualizada" });
    } else {
      setCategories(prev => [...prev, { 
        id: Date.now().toString(), 
        name, 
        enabled,
        imageUrl: categoryImageFile ? URL.createObjectURL(categoryImageFile) : undefined 
      }]);
      toast({ title: "Categoría creada" });
    }

    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryImageFile(null);
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const categoryId = selectedCategoryForProduct || '';

    if (editingProduct) {
      setProducts(prev =>
        prev.map(prod =>
          prod.id === editingProduct.id 
            ? { ...prod, name, price, imageUrl: productImageFile ? URL.createObjectURL(productImageFile) : prod.imageUrl } 
            : prod
        )
      );
      toast({ title: "Producto actualizado" });
    } else {
      setProducts(prev => [...prev, { 
        id: Date.now().toString(), 
        name, 
        price, 
        categoryId,
        imageUrl: productImageFile ? URL.createObjectURL(productImageFile) : undefined
      }]);
      toast({ title: "Producto creado" });
    }

    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setProductImageFile(null);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    setProducts(prev => prev.filter(prod => prod.categoryId !== id));
    toast({ title: "Categoría eliminada" });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(prod => prod.id !== id));
    toast({ title: "Producto eliminado" });
  };

  const toggleCategoryEnabled = (id: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, enabled: !cat.enabled } : cat))
    );
  };

  const getCategoryProducts = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId);
  };

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
                <div className="flex items-center justify-between gap-4">
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
                        onCheckedChange={() => toggleCategoryEnabled(category.id)}
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
                      onClick={() => handleDeleteCategory(category.id)}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="flex items-center justify-between mb-4 mt-4">
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
                          className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {product.imageUrl && (
                              <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              <div className="text-sm text-primary font-semibold">${product.price.toFixed(2)}</div>
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
                              onClick={() => handleDeleteProduct(product.id)}
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
              <Button type="submit" data-testid="button-save-category">
                Guardar
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
              <Button type="submit" data-testid="button-save-product">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
