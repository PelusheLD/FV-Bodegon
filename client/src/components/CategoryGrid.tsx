import { 
  Coffee, Heart, Beef, Fish, Candy, 
  Apple, Home, Wine, PawPrint, Croissant,
  Dumbbell, ShoppingBasket
} from "lucide-react";
import CategoryCard from "./CategoryCard";
import type { Category } from "@shared/schema";

const iconMap: Record<string, any> = {
  Coffee, Heart, Beef, Fish, Candy, 
  Apple, Home, Wine, PawPrint, Croissant,
  Dumbbell, ShoppingBasket
};

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}

export default function CategoryGrid({ categories, onCategorySelect }: CategoryGridProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display font-semibold text-2xl md:text-3xl mb-6 md:mb-8">
          Categorías
        </h2>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay categorías disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                icon={iconMap.ShoppingBasket}
                onClick={() => onCategorySelect(category.id, category.name)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
