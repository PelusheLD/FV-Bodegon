import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  categoryName: string;
  products: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductGrid({ categoryName, products, onBack, onAddToCart }: ProductGridProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-display font-semibold text-2xl md:text-3xl">
            {categoryName}
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay productos en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                measurementType={product.measurementType}
                onAddToCart={(quantity) => onAddToCart(product, quantity)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
