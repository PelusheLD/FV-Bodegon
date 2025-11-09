import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import type { Product, SiteSettings } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useDollarRate } from "@/hooks/useDollarRate";

interface FeaturedProductsProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function FeaturedProducts({ onAddToCart }: FeaturedProductsProps) {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: settings } = useQuery<SiteSettings | undefined>({
    queryKey: ["/api/settings"],
  });

  // Esperar a que la tasa de cambio esté disponible antes de mostrar productos
  // Si hay error, permitir mostrar productos sin conversión a BS
  const { dollarRate, loading: dollarRateLoading, error: dollarRateError } = useDollarRate();

  return (
    <section className="py-10 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display font-bold text-2xl md:text-3xl mb-6 text-center">
          PRODUCTOS DESTACADOS
        </h2>
        
        {(isLoading || (dollarRateLoading && !dollarRateError)) ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isLoading ? "Cargando productos destacados..." : "Cargando tasa de cambio..."}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay productos destacados disponibles
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Los administradores pueden marcar productos como destacados desde el panel de administración
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                measurementType={product.measurementType}
                stock={product.stock}
                taxPercentage={settings?.taxPercentage ? parseFloat(settings.taxPercentage) : 16}
                onAddToCart={(quantity) => onAddToCart(product, quantity)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


