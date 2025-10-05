import { Plus } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  onAddToCart: () => void;
}

export default function ProductCard({ id, name, price, imageUrl, onAddToCart }: ProductCardProps) {
  return (
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
            ${price.toFixed(2)}
          </p>
        </div>
        <Button 
          onClick={onAddToCart}
          className="w-full gap-2"
          data-testid={`button-add-to-cart-${id}`}
        >
          <Plus className="h-4 w-4" />
          Agregar al carrito
        </Button>
      </CardFooter>
    </Card>
  );
}
