import { 
  Coffee, Heart, Beef, Fish, Candy, 
  Apple, Home, Wine, PawPrint, Croissant,
  Dumbbell, ShoppingBasket, Search
} from "lucide-react";
import CategoryCard from "./CategoryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@shared/schema";

const iconMap: Record<string, any> = {
  Coffee, Heart, Beef, Fish, Candy, 
  Apple, Home, Wine, PawPrint, Croissant,
  Dumbbell, ShoppingBasket
};

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onSearch?: (query: string) => void;
}

export default function CategoryGrid({ categories, onCategorySelect, onSearch }: CategoryGridProps) {
  return (
    <section id="categories" className="py-12 md:py-16 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Categorías
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
            Explora nuestra amplia variedad de productos organizados por categorías
          </p>
          
          {/* Barra de búsqueda */}
          {onSearch && (
            <div className="w-full max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  className="pl-10 h-12"
                  data-testid="input-search"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
              <Button 
                size="lg"
                onClick={() => {
                  const input = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
                  if (input && onSearch) {
                    onSearch(input.value);
                  }
                }}
                data-testid="button-search"
              >
                Buscar
              </Button>
            </div>
          )}
        </div>
        
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBasket className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No hay categorías disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                imageUrl={category.imageUrl || undefined}
                icon={iconMap.ShoppingBasket}
                leySeca={category.leySeca || false}
                onClick={() => onCategorySelect(category.id, category.name)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
