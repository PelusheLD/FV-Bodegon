import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDollarRate } from "@/hooks/useDollarRate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  measurementType: string;
  stock?: string | null;
  taxPercentage?: number;
  onAddToCart: (quantity: number) => void;
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  imageUrl, 
  measurementType,
  stock,
  taxPercentage = 16,
  onAddToCart 
}: ProductCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weight, setWeight] = useState("1000");
  const available = stock === undefined ? true : parseFloat(String(stock)) > 0;
  
  const { currency } = useCurrency();
  const { convertToBolivares, formatCurrency } = useDollarRate();

  // El precio ya incluye IVA, solo lo mostramos tal como está
  const displayPrice = parseFloat(price);
  const priceInBolivares = convertToBolivares(displayPrice);

  const handleAddClick = () => {
    if (!available) return;
    if (measurementType === 'weight') {
      setIsDialogOpen(true);
    } else {
      onAddToCart(1);
    }
  };

  const handleConfirmWeight = () => {
    const weightInGrams = parseFloat(weight);
    if (weightInGrams > 0) {
      onAddToCart(weightInGrams);
      setIsDialogOpen(false);
      setWeight("1000");
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col" data-testid={`card-product-${id}`}>
        <CardContent className="p-0">
          <div className="relative w-full h-32 sm:h-36 md:h-40 lg:h-44 bg-muted flex items-center justify-center overflow-hidden">
            {typeof stock !== 'undefined' && (
              <span
                className={`absolute top-1.5 left-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold shadow-sm ${parseFloat(String(stock)) > 0 ? 'bg-[#5ab535] text-white' : 'bg-red-600 text-white'}`}
              >
                {parseFloat(String(stock)) > 0 ? 'Disponible' : 'No disponible'}
              </span>
            )}
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground text-sm">Sin imagen</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-3 flex-1">
          <div className="w-full">
            <h3 className="font-medium mb-1 text-xs leading-tight" data-testid={`text-product-name-${id}`}>
              {name}
            </h3>
            <p className="text-sm font-bold text-primary" data-testid={`text-product-price-${id}`}>
              {currency === 'USD' 
                ? `$${formatCurrency(displayPrice)}${measurementType === 'weight' ? '/kg' : ''}`
                : `Bs. ${formatCurrency(priceInBolivares, 'BS')}${measurementType === 'weight' ? '/kg' : ''}`
              }
            </p>
            {currency === 'USD' && (
              <p className="text-xs text-muted-foreground">
                ≈ Bs. {formatCurrency(priceInBolivares, 'BS')}
              </p>
            )}
            {currency === 'BS' && (
              <p className="text-xs text-muted-foreground">
                ≈ ${formatCurrency(displayPrice)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Incluye IVA ({taxPercentage}%)
            </p>
            {measurementType === 'weight' && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Precio por kilogramo
              </p>
            )}
          </div>
          <Button 
            onClick={handleAddClick}
            className="w-full gap-1 h-8 text-[11px] whitespace-nowrap mt-auto"
            disabled={!available}
            data-testid={`button-add-to-cart-${id}`}
          >
            <Plus className="h-3 w-3" />
            {available ? 'Agregar al carrito' : 'Agotado'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar cantidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium mb-2">{name}</h3>
              <p className="text-sm text-muted-foreground">
                Precio: {currency === 'USD' 
                  ? `$${formatCurrency(displayPrice)}/kg (incluye IVA ${taxPercentage}%)`
                  : `Bs. ${formatCurrency(priceInBolivares, 'BS')}/kg (incluye IVA ${taxPercentage}%)`
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-input">Cantidad en gramos</Label>
              <Input
                id="weight-input"
                type="number"
                min="1"
                step="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                data-testid="input-weight"
              />
              <p className="text-xs text-muted-foreground">
                {parseFloat(weight) >= 1000 
                  ? `${(parseFloat(weight) / 1000).toFixed(2)} kg` 
                  : `${weight} gramos`}
                {' - '}
                Precio total: {currency === 'USD' 
                  ? `$${formatCurrency((parseFloat(weight) / 1000) * displayPrice)}`
                  : `Bs. ${formatCurrency((parseFloat(weight) / 1000) * priceInBolivares, 'BS')}`
                }
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setWeight("250")}
                data-testid="button-quick-250"
              >
                250g
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setWeight("500")}
                data-testid="button-quick-500"
              >
                500g
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setWeight("1000")}
                data-testid="button-quick-1000"
              >
                1kg
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setWeight("2000")}
                data-testid="button-quick-2000"
              >
                2kg
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmWeight}
              data-testid="button-confirm-weight"
            >
              Agregar al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
