import { 
  Coffee, Heart, Beef, Fish, Candy, 
  Apple, Home, Wine, PawPrint, Croissant,
  Dumbbell, ShoppingBasket
} from "lucide-react";
import CategoryCard from "./CategoryCard";

const categories = [
  { id: '1', name: 'Bebidas', icon: Coffee },
  { id: '2', name: 'Salud y cuidado personal', icon: Heart },
  { id: '3', name: 'Carnes, charcutería, aves, cerdo', icon: Beef },
  { id: '4', name: 'Congelados / pescadería', icon: Fish },
  { id: '5', name: 'Dulces, snacks y cereales', icon: Candy },
  { id: '6', name: 'Enlatados y condimentos', icon: ShoppingBasket },
  { id: '7', name: 'Frutas y verduras', icon: Apple },
  { id: '8', name: 'Hogar y limpieza', icon: Home },
  { id: '9', name: 'Licores', icon: Wine },
  { id: '10', name: 'Mascotas', icon: PawPrint },
  { id: '11', name: 'Panes', icon: Croissant },
  { id: '12', name: 'Productos fitness', icon: Dumbbell },
  { id: '13', name: 'Víveres', icon: ShoppingBasket },
];

interface CategoryGridProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}

export default function CategoryGrid({ onCategorySelect }: CategoryGridProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-display font-semibold text-2xl md:text-3xl mb-6 md:mb-8">
          Categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              icon={category.icon}
              onClick={() => onCategorySelect(category.id, category.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
