import CategoryCard from '../CategoryCard';
import { Coffee } from 'lucide-react';

export default function CategoryCardExample() {
  return (
    <div className="p-4 max-w-xs">
      <CategoryCard 
        name="Bebidas" 
        icon={Coffee}
        onClick={() => console.log('Category clicked')}
      />
    </div>
  );
}
