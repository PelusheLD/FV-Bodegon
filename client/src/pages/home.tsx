import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import type { Category, Product } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const enabledCategories = categories.filter(c => c.enabled);

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: product.measurementType === 'unit' ? item.quantity + quantity : quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    const price = parseFloat(product.price);
    const quantityText = product.measurementType === 'weight' 
      ? quantity >= 1000 ? `${(quantity / 1000).toFixed(2)} kg` : `${quantity} g`
      : `${quantity} unidad${quantity > 1 ? 'es' : ''}`;

    toast({
      title: "Producto agregado",
      description: `${product.name} (${quantityText}) se agregó al carrito`,
      duration: 2000,
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev =>
        prev.map(item => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    toast({
      title: "Procesando compra",
      description: "Tu pedido está siendo procesado",
    });
    setIsCartOpen(false);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    toast({
      title: "Buscando",
      description: `Buscando: ${query}`,
    });
  };

  const calculateItemPrice = (item: CartItem) => {
    const price = parseFloat(item.price);
    if (item.measurementType === 'weight') {
      return (item.quantity / 1000) * price;
    }
    return price * item.quantity;
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const cartCount = cartItems.length;

  const categoryProducts = selectedCategory
    ? allProducts.filter(p => p.categoryId === selectedCategory.id)
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="flex-1">
        {!selectedCategory ? (
          <>
            <Hero onSearch={handleSearch} />
            <CategoryGrid categories={enabledCategories} onCategorySelect={handleCategorySelect} />
          </>
        ) : (
          <ProductGrid
            categoryName={selectedCategory.name}
            products={categoryProducts}
            onBack={() => setSelectedCategory(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
