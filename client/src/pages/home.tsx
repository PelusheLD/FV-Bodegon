import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  // TODO: Remove mock data - replace with real data from Supabase
  const mockProducts: Product[] = [
    { id: '1', name: 'Coca Cola 2L', price: 3.50, categoryId: '1' },
    { id: '2', name: 'Pepsi 2L', price: 3.25, categoryId: '1' },
    { id: '3', name: 'Agua Mineral 1.5L', price: 1.50, categoryId: '1' },
    { id: '4', name: 'Jugo de Naranja 1L', price: 2.75, categoryId: '1' },
    { id: '5', name: 'Shampoo Herbal 400ml', price: 5.99, categoryId: '2' },
    { id: '6', name: 'Jabón Antibacterial', price: 2.50, categoryId: '2' },
    { id: '7', name: 'Bistec de Res 1kg', price: 12.50, categoryId: '3' },
    { id: '8', name: 'Pechuga de Pollo 1kg', price: 8.75, categoryId: '3' },
    { id: '9', name: 'Filete de Salmón', price: 15.00, categoryId: '4' },
    { id: '10', name: 'Camarones 500g', price: 11.50, categoryId: '4' },
  ];

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó al carrito`,
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

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const categoryProducts = selectedCategory
    ? mockProducts.filter(p => p.categoryId === selectedCategory.id)
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
            <CategoryGrid onCategorySelect={handleCategorySelect} />
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
