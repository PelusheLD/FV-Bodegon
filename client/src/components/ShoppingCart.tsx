import { useState } from "react";
import { X, Minus, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product, SiteSettings } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDollarRate } from "@/contexts/DollarRateContext";
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

const BANKS = [
  { code: '0102', name: 'BANCO DE VENEZUELA' },
  { code: '0104', name: 'BANCO VENEZOLANO DE CREDITO' },
  { code: '0105', name: 'BANCO MERCANTIL' },
  { code: '0108', name: 'BBVA PROVINCIAL' },
  { code: '0114', name: 'BANCARIBE' },
  { code: '0115', name: 'BANCO EXTERIOR' },
  { code: '0128', name: 'BANCO CARONI' },
  { code: '0134', name: 'BANESCO' },
  { code: '0137', name: 'BANCO SOFITASA' },
  { code: '0138', name: 'BANCO PLAZA' },
  { code: '0146', name: 'BANGENTE' },
  { code: '0151', name: 'BANCO FONDO COMUN' },
  { code: '0156', name: '100% BANCO' },
  { code: '0157', name: 'DELSUR BANCO UNIVERSAL' },
  { code: '0163', name: 'BANCO DEL TESORO' },
  { code: '0168', name: 'BANCRECER' },
  { code: '0169', name: 'R4 BANCO MICROFINANCIERO C.A.' },
  { code: '0171', name: 'BANCO ACTIVO' },
  { code: '0172', name: 'BANCAMIGA BANCO UNIVERSAL, C.A.' },
  { code: '0173', name: 'BANCO INTERNACIONAL DE DESARROLLO' },
  { code: '0174', name: 'BANPLUS' },
  { code: '0175', name: 'BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL' },
  { code: '0177', name: 'BANFANB' },
  { code: '0178', name: 'N58 BANCO DIGITAL BANCO MICROFINANCIERO S A' },
  { code: '0191', name: 'BANCO NACIONAL DE CREDITO' },
];

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

  const { currency } = useCurrency();
  const { convertToBolivares, formatCurrency } = useDollarRate();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['/api/settings'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/orders', { method: 'POST', body: data }),
    onSuccess: (_, orderData) => {
      toast({ 
        title: "¡Pedido realizado!", 
        description: "Tu pedido ha sido registrado exitosamente" 
      });
      
      setIsCheckoutDialogOpen(false);
      onCheckout();
      
      const whatsappNumber = settings?.contactPhone?.replace(/[^0-9]/g, '') || '';
      
      if (whatsappNumber) {
        const whatsappMessage = createWhatsAppMessage(orderData);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      } else {
        toast({
          title: "Advertencia",
          description: "No se pudo redirigir a WhatsApp. El número de contacto no está configurado.",
          variant: "destructive"
        });
      }
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

    const docType = formData.get('paymentCIDocType') as string || '';
    const docNumber = formData.get('paymentCI') as string || '';
    const paymentCI = docType && docNumber ? `${docType}${docNumber}` : undefined;

    const orderData = {
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerAddress: formData.get('customerAddress') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      total: total,
      totalInBolivares: totalInBolivares,
      paymentBank: formData.get('paymentBank') as string || undefined,
      paymentCI: paymentCI,
      paymentPhone: formData.get('paymentPhone') as string || undefined,
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

  // Calcular total (los precios ya incluyen IVA)
  const total = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const totalInBolivares = convertToBolivares(total);
  
  // Calcular desglose de IVA incluido
  const taxPercentage = settings?.taxPercentage ? parseFloat(settings.taxPercentage) : 16;
  const subtotal = total / (1 + taxPercentage / 100); // Precio sin IVA
  const subtotalInBolivares = convertToBolivares(subtotal);
  const taxAmount = total - subtotal; // IVA incluido
  const taxAmountInBolivares = convertToBolivares(taxAmount);

  const createWhatsAppMessage = (orderData: any) => {
    let message = ` *NUEVO PEDIDO* \n\n`;
    message += `*Cliente:* ${orderData.customerName}\n`;
    message += `*Teléfono:* ${orderData.customerPhone}\n`;
    
    if (orderData.customerAddress) {
      message += `*Dirección:* ${orderData.customerAddress}\n`;
    }
    
    message += `\n*PRODUCTOS:*\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    
    items.forEach((item, index) => {
      const quantity = item.measurementType === 'weight' 
        ? formatQuantity(item)
        : `${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}`;
      
      const itemTotal = calculateItemPrice(item);
      message += `\n${index + 1}. *${item.name}*\n`;
      message += `   Cantidad: ${quantity}\n`;
      message += `   Precio: $${parseFloat(item.price).toFixed(2)}${item.measurementType === 'weight' ? '/kg' : ''}\n`;
      message += `   Subtotal: $${itemTotal.toFixed(2)}\n`;
    });
    
    message += `\n━━━━━━━━━━━━━━━━\n`;
    message += `Subtotal (sin IVA): $${formatCurrency(subtotal)}\n`;
    message += `IVA incluido (${taxPercentage}%): $${formatCurrency(taxAmount)}\n`;
    message += `*TOTAL: $${formatCurrency(total)}*\n`;
    message += `*TOTAL EN BOLÍVARES: Bs. ${formatCurrency(totalInBolivares, 'BS')}*\n`;
    
    if (orderData.notes) {
      message += `\n*Notas:* ${orderData.notes}\n`;
    }
    
    message += `\n¡Gracias por tu pedido! `;
    
    return message;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="w-full md:w-80 bg-card border rounded-lg shadow-lg flex flex-col">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal (sin IVA):</span>
                  <span>
                    {currency === 'USD' 
                      ? `$${formatCurrency(subtotal)}`
                      : `Bs. ${formatCurrency(subtotalInBolivares, 'BS')}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>IVA incluido ({taxPercentage}%):</span>
                  <span>
                    {currency === 'USD' 
                      ? `$${formatCurrency(taxAmount)}`
                      : `Bs. ${formatCurrency(taxAmountInBolivares, 'BS')}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary text-xl" data-testid="text-cart-total">
                    {currency === 'USD' 
                      ? `$${formatCurrency(total)}`
                      : `Bs. ${formatCurrency(totalInBolivares, 'BS')}`
                    }
                  </span>
                </div>
                {currency === 'BS' && (
                  <div className="text-xs text-muted-foreground text-center">
                    ≈ ${formatCurrency(total)}
                  </div>
                )}
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
                  Precio total: {currency === 'USD' 
                    ? `$${formatCurrency((parseFloat(editWeight) / 1000) * parseFloat(editingItem.price))}`
                    : `Bs. ${formatCurrency((parseFloat(editWeight) / 1000) * convertToBolivares(parseFloat(editingItem.price)), 'BS')}`
                  }
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
            <DialogDescription>
              Completa tus datos para procesar el pedido
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCheckout}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Columna Izquierda: Formulario y Resumen */}
              <div className="space-y-4">
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
                    placeholder="+58 424-5551570"
                    data-testid="input-customer-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Dirección de entrega</Label>
                  <Textarea
                    id="customerAddress"
                    name="customerAddress"
                    placeholder="Calle 31 entre avenida 37 y 38 Sector El Palito, Acarigua 3301"
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

                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal (sin IVA):</span>
                    <span>
                      {currency === 'USD' 
                        ? `$${formatCurrency(subtotal)}`
                        : `Bs. ${formatCurrency(subtotalInBolivares, 'BS')}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>IVA incluido ({taxPercentage}%):</span>
                    <span>
                      {currency === 'USD' 
                        ? `$${formatCurrency(taxAmount)}`
                        : `Bs. ${formatCurrency(taxAmountInBolivares, 'BS')}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg border-t pt-2">
                    <span className="font-medium">Total a pagar en $:</span>
                    <span className="font-bold text-lg text-primary">
                      ${formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Total a pagar en Bs.:</span>
                    <span className="font-bold text-lg text-primary">
                      Bs. {formatCurrency(totalInBolivares, 'BS')}
                    </span>
                  </div>
                </div>

                
              </div>

              {/* Columna Derecha: Datos Bancarios */}
              <div className="space-y-4">
                {settings?.paymentBank && settings?.paymentCI && settings?.paymentPhone ? (
                  <>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md space-y-3 top-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Datos para Pago Móvil</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Banco:</span>
                          <span className="font-medium">{settings.paymentBank}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Documento:</span>
                          <span className="font-medium">{settings.paymentCI}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefono:</span>
                          <span className="font-medium">{settings.paymentPhone}</span>
                        </div>
                        {settings.paymentInstructions && (
                          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                              {settings.paymentInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Monto a pagar en BS debajo del teléfono */}
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-900 dark:text-green-100">Monto a pagar en Bs.:</span>
                    <span className="font-bold text-lg text-green-700 dark:text-green-300">
                      Bs. {formatCurrency(totalInBolivares, 'BS')}
                    </span>
                  </div>
                </div>

                    {/* Inputs de confirmación de pago */}
                    <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Datos para Confirmación de Pago</h4>
                      <div className="space-y-2">
                        <Label htmlFor="paymentBank">Banco emisor *</Label>
                        <Select name="paymentBank" required>
                          <SelectTrigger id="paymentBank" data-testid="input-payment-bank">
                            <SelectValue placeholder="Seleccione un banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {BANKS.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code}>
                                {bank.code} - {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentCIDocType">Tipo de documento *</Label>
                        <Select name="paymentCIDocType" required>
                          <SelectTrigger id="paymentCIDocType" data-testid="input-payment-ci-doc-type">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="V-">V-</SelectItem>
                            <SelectItem value="E-">E-</SelectItem>
                            <SelectItem value="J-">J-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentCI">Documento afiliado *</Label>
                        <Input
                          id="paymentCI"
                          name="paymentCI"
                          required
                          placeholder="Ej: 12345678"
                          data-testid="input-payment-ci"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentPhone">Telefono afiliado *</Label>
                        <Input
                          id="paymentPhone"
                          name="paymentPhone"
                          type="tel"
                          required
                          placeholder="Ej: 04241234567"
                          data-testid="input-payment-phone"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground text-center">
                    Los datos bancarios no están configurados
                  </div>
                )}
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
                {createOrderMutation.isPending ? "Procesando..." : "Confirmar Pedido por WhatsApp"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
