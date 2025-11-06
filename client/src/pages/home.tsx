import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import ShoppingCart from "@/components/ShoppingCart";
import DollarRate from "@/components/DollarRate";
import Footer from "@/components/Footer";
import FeaturedProducts from "@/components/FeaturedProducts";
import ContactSection from "@/components/ContactSection";
import MultimediaSection from "@/components/MultimediaSection";
import SponsorsSection from "@/components/SponsorsSection";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { searchProducts } from "@/lib/searchUtils";
import type { Category, Product, SiteSettings } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { toast } = useToast();
  const categoriesRef = useRef<HTMLElement | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: settings } = useQuery<SiteSettings | undefined>({
    queryKey: ['/api/settings'],
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
    setCartItems([]);
    setIsCartOpen(false);
  };

  const handleSearch = (query: string) => {
    if (query.trim() === "") {
      setIsSearchMode(false);
      setSearchQuery("");
      return;
    }
    
    setSearchQuery(query.trim());
    setIsSearchMode(true);
    setSelectedCategory(null);
    
    toast({
      title: "Buscando",
      description: `Buscando: "${query}"`,
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

  // Filtrar productos según la búsqueda inteligente
  const filteredProducts = isSearchMode && searchQuery 
    ? searchProducts(allProducts, searchQuery)
    : [];

  const handleBackFromSearch = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    // Esperar a que se pinte la grilla de categorías y luego hacer scroll
    setTimeout(() => {
      const el = document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };


  return (
    <CurrencyProvider>
    <div className="min-h-screen flex flex-col">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCartClick={() => setIsCartOpen(true)}
        siteName={settings?.siteName || undefined}
      />

      <main className="flex-1">
        {!selectedCategory && !isSearchMode ? (
          <>
            <Hero 
              carouselData={{
                enableCarousel1: settings?.enableCarousel1 ?? true,
                enableCarousel2: settings?.enableCarousel2 ?? true,
                enableCarousel3: settings?.enableCarousel3 ?? true,
                title1: settings?.carouselTitle1 ?? undefined,
                subtitle1: settings?.carouselSubtitle1 ?? undefined,
                description1: settings?.carouselDescription1 ?? undefined,
                image1: settings?.carouselImage1 ?? undefined,
                background1: settings?.carouselBackground1 ?? undefined,
                button1: settings?.carouselButton1 ?? undefined,
                url1: settings?.carouselUrl1 ?? undefined,
                title2: settings?.carouselTitle2 ?? undefined,
                subtitle2: settings?.carouselSubtitle2 ?? undefined,
                description2: settings?.carouselDescription2 ?? undefined,
                image2: settings?.carouselImage2 ?? undefined,
                background2: settings?.carouselBackground2 ?? undefined,
                button2: settings?.carouselButton2 ?? undefined,
                url2: settings?.carouselUrl2 ?? undefined,
                title3: settings?.carouselTitle3 ?? undefined,
                subtitle3: settings?.carouselSubtitle3 ?? undefined,
                description3: settings?.carouselDescription3 ?? undefined,
                image3: settings?.carouselImage3 ?? undefined,
                background3: settings?.carouselBackground3 ?? undefined,
                button3: settings?.carouselButton3 ?? undefined,
                url3: settings?.carouselUrl3 ?? undefined,
              }}
            />
            {/* Productos Destacados */}
            <FeaturedProducts onAddToCart={handleAddToCart} />
            <CategoryGrid 
              categories={enabledCategories} 
              onCategorySelect={handleCategorySelect}
              onSearch={handleSearch}
            />
            {/* Sección de Contacto */}
            <ContactSection />
            {/* Sección de Multimedia */}
            <MultimediaSection instagramUrl={settings?.instagramUrl} />
            {/* Sección de Patrocinadores */}
            <SponsorsSection />
          </>
        ) : isSearchMode ? (
          <ProductGrid
            categoryName={`Resultados para "${searchQuery}"`}
            categoryId="search"
            products={filteredProducts}
            onBack={handleBackFromSearch}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <ProductGrid
            categoryName={selectedCategory?.name || ""}
            categoryId={selectedCategory?.id || ""}
            onBack={() => {
              setSelectedCategory(null);
              // Esperar a que se pinte la grilla de categorías y luego hacer scroll
              setTimeout(() => {
                const el = document.getElementById('categories');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 50);
            }}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      <Footer settings={settings} />

      {/* Sidebar con Carrito y Tasa del Dólar */}
      <div className="fixed right-4 top-20 z-40 flex flex-col gap-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <DollarRate />
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
      </div>
    </CurrencyProvider>
  );
}
