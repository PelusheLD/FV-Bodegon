import ProductCard from '../ProductCard';

export default function ProductCardExample() {
  return (
    <div className="p-4 max-w-xs">
      <ProductCard
        id="1"
        name="Coca Cola 2L"
        price={3.50}
        onAddToCart={() => console.log('Added to cart')}
      />
    </div>
  );
}
