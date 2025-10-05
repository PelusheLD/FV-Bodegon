import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  price: number;
  imageUrl?: string;
  measurementType: 'unit' | 'weight';
  onAddToCart: (quantity: number) => void;
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  imageUrl, 
  measurementType,
  onAddToCart 
}: ProductCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weight, setWeight] = useState("1000");

  const handleAddClick = () => {
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-product-${id}`}>
        <CardContent className="p-0">
          <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
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
        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <div className="w-full">
            <h3 className="font-medium line-clamp-2 mb-2 min-h-[2.5rem]" data-testid={`text-product-name-${id}`}>
              {name}
            </h3>
            <p className="text-xl font-bold text-primary" data-testid={`text-product-price-${id}`}>
              ${price.toFixed(2)}{measurementType === 'weight' ? '/kg' : ''}
            </p>
            {measurementType === 'weight' && (
              <p className="text-xs text-muted-foreground mt-1">
                Precio por kilogramo
              </p>
            )}
          </div>
          <Button 
            onClick={handleAddClick}
            className="w-full gap-2"
            data-testid={`button-add-to-cart-${id}`}
          >
            <Plus className="h-4 w-4" />
            Agregar al carrito
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
                Precio: ${price.toFixed(2)}/kg
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
                Precio total: ${((parseFloat(weight) / 1000) * price).toFixed(2)}
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
