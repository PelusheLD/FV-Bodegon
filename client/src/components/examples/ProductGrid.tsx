import ProductGrid from '../ProductGrid';

const mockProducts = [
  { id: '1', name: 'Coca Cola 2L', price: 3.50, categoryId: '1' },
  { id: '2', name: 'Pepsi 2L', price: 3.25, categoryId: '1' },
  { id: '3', name: 'Agua Mineral 1.5L', price: 1.50, categoryId: '1' },
  { id: '4', name: 'Jugo de Naranja 1L', price: 2.75, categoryId: '1' },
];

export default function ProductGridExample() {
  return (
    <ProductGrid
      categoryName="Bebidas"
      products={mockProducts}
      onBack={() => console.log('Back clicked')}
      onAddToCart={(product) => console.log('Added to cart:', product)}
    />
  );
}
