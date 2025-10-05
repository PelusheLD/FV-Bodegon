import { useState } from "react";
import { X, Minus, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface CartItem extends Product {
  quantity: number;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const { toast } = useToast();

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/orders', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ 
        title: "¡Pedido realizado!", 
        description: "Tu pedido ha sido registrado exitosamente" 
      });
      setIsCheckoutDialogOpen(false);
      onCheckout();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo procesar tu pedido. Intenta nuevamente.",
        variant: "destructive"
      });
    },
  });

  const handleEditWeight = (item: CartItem) => {
    setEditingItem(item);
    setEditWeight(item.quantity.toString());
  };

  const handleConfirmEdit = () => {
    if (editingItem) {
      const newWeight = parseFloat(editWeight);
      if (newWeight > 0) {
        onUpdateQuantity(editingItem.id, newWeight);
      }
      setEditingItem(null);
    }
  };

  const handleSubmitCheckout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const orderItems = items.map(item => ({
      productId: item.id,
      productName: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      measurementType: item.measurementType,
      subtotal: calculateItemPrice(item),
    }));

    const orderData = {
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string || undefined,
      customerAddress: formData.get('customerAddress') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      total: total,
      status: 'pending',
      items: orderItems,
    };

    createOrderMutation.mutate(orderData);
  };

  const formatQuantity = (item: CartItem) => {
    if (item.measurementType === 'weight') {
      if (item.quantity >= 1000) {
        return `${(item.quantity / 1000).toFixed(2)} kg`;
      }
      return `${item.quantity} g`;
    }
    return item.quantity.toString();
  };

  const calculateItemPrice = (item: CartItem) => {
    const price = parseFloat(item.price);
    if (item.measurementType === 'weight') {
      return (item.quantity / 1000) * price;
    }
    return price * item.quantity;
  };

  const total = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
        data-testid="overlay-cart"
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-card border-l z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-display font-semibold text-xl">Carrito de Compras</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-2">Agrega productos para comenzar</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0" data-testid={`cart-item-${item.id}`}>
                    <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-2 mb-1">{item.name}</h3>
                      <p className="text-sm font-semibold text-primary mb-2">
                        ${parseFloat(item.price).toFixed(2)}{item.measurementType === 'weight' ? '/kg' : ''}
                      </p>
                      
                      {item.measurementType === 'unit' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 ml-auto"
                            onClick={() => onRemoveItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                            <span className="text-sm font-medium" data-testid={`text-quantity-${item.id}`}>
                              {formatQuantity(item)}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleEditWeight(item)}
                            data-testid={`button-edit-weight-${item.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 ml-auto"
                            onClick={() => onRemoveItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        Subtotal: ${calculateItemPrice(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-primary text-xl" data-testid="text-cart-total">
                  ${total.toFixed(2)}
                </span>
              </div>
              <Button 
                onClick={() => setIsCheckoutDialogOpen(true)}
                className="w-full"
                size="lg"
                data-testid="button-checkout"
              >
                Finalizar Compra
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cantidad</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium mb-2">{editingItem.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Precio: ${parseFloat(editingItem.price).toFixed(2)}/kg
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-weight-input">Cantidad en gramos</Label>
                <Input
                  id="edit-weight-input"
                  type="number"
                  min="1"
                  step="1"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  data-testid="input-edit-weight"
                />
                <p className="text-xs text-muted-foreground">
                  {parseFloat(editWeight) >= 1000 
                    ? `${(parseFloat(editWeight) / 1000).toFixed(2)} kg` 
                    : `${editWeight} gramos`}
                  {' - '}
                  Precio total: ${((parseFloat(editWeight) / 1000) * parseFloat(editingItem.price)).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditWeight("250")}
                >
                  250g
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditWeight("500")}
                >
                  500g
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditWeight("1000")}
                >
                  1kg
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditWeight("2000")}
                >
                  2kg
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingItem(null)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmEdit}
              data-testid="button-confirm-edit"
            >
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
            <DialogDescription>
              Completa tus datos para procesar el pedido
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCheckout}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre completo *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  placeholder="Juan Pérez"
                  data-testid="input-customer-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Teléfono *</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  required
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-customer-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Correo electrónico</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  data-testid="input-customer-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Dirección de entrega</Label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  placeholder="Calle Principal #123, Ciudad"
                  rows={2}
                  data-testid="input-customer-address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Instrucciones especiales para tu pedido"
                  rows={2}
                  data-testid="input-order-notes"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="font-medium">Total a pagar:</span>
                <span className="font-bold text-lg text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsCheckoutDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? "Procesando..." : "Confirmar Pedido"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
