import CategoryGrid from '../CategoryGrid';

export default function CategoryGridExample() {
  return (
    <CategoryGrid 
      onCategorySelect={(id, name) => console.log('Selected category:', id, name)}
    />
  );
}
