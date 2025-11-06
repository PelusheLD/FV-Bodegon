import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "./ProductCard";
import { buildApiUrl } from "@/lib/queryClient";
import type { Product, Category, SiteSettings } from "@shared/schema";

interface ProductGridProps {
  categoryName: string;
  categoryId: string;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  products?: Product[]; // Productos pre-filtrados para búsqueda global
}

export default function ProductGrid({ categoryName, categoryId, onBack, onAddToCart, products: preFilteredProducts }: ProductGridProps) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Si tenemos productos pre-filtrados (búsqueda global), usarlos directamente
  const isSearchMode = preFilteredProducts !== undefined;

  // Cargar productos paginados
  const loadProducts = useCallback(async (page: number, append: boolean = false, search: string = "") => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Construir URL con parámetros de búsqueda si existe
      const url = search.trim() 
        ? buildApiUrl(`/api/products/category/${categoryId}?page=${page}&limit=100&search=${encodeURIComponent(search)}`)
        : buildApiUrl(`/api/products/category/${categoryId}?page=${page}&limit=100`);
      
      console.log('ProductGrid: Loading products from:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('ProductGrid: Received data:', { url, dataType: Array.isArray(data) ? 'array' : 'object', data });
      
      // Manejar diferentes formatos de respuesta
      let productsArray: Product[] = [];
      let hasMoreData = false;
      
      if (Array.isArray(data)) {
        // Respuesta directa de productos (sin paginación)
        productsArray = data;
        hasMoreData = false;
      } else if (data.products && Array.isArray(data.products)) {
        // Respuesta con estructura { products, total, hasMore }
        productsArray = data.products;
        hasMoreData = data.hasMore || false;
      } else {
        console.warn('ProductGrid: Unexpected data format:', data);
      }
      
      console.log('ProductGrid: Processed products:', { count: productsArray.length, hasMore: hasMoreData });
      
      if (append) {
        setProducts(prev => [...prev, ...productsArray]);
      } else {
        setProducts(productsArray);
      }
      
      setHasMore(hasMoreData);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [categoryId, loading]);

  // Cargar información de la categoría y settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías
        const categoriesResponse = await fetch(buildApiUrl('/api/categories'), {
          credentials: 'include',
        });
        const categories = await categoriesResponse.json();
        const currentCategory = categories.find((c: Category) => c.id === categoryId);
        setCategory(currentCategory || null);

        // Cargar settings
        const settingsResponse = await fetch(buildApiUrl('/api/settings'), {
          credentials: 'include',
        });
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [categoryId]);

  // Cargar productos iniciales
  useEffect(() => {
    if (isSearchMode) {
      // En modo búsqueda global, usar productos pre-filtrados
      const safeProducts = Array.isArray(preFilteredProducts) ? preFilteredProducts : [];
      setProducts(safeProducts);
      setInitialLoading(false);
      setHasMore(false); // No hay más productos para cargar en búsqueda global
    } else {
      // Modo normal de categoría - cargar productos iniciales
      setProducts([]);
      setCurrentPage(1);
      setHasMore(true);
      setInitialLoading(true);
      setQuery("");
      setSearchTerm("");
      
      // Cargar productos directamente sin usar loadProducts para evitar loops
      const loadInitialProducts = async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || '';
          const url = `${baseUrl}/api/products/category/${categoryId}?page=1&limit=100`;
          console.log('ProductGrid: Loading initial products from:', url);
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('ProductGrid: Initial data received:', { dataType: Array.isArray(data) ? 'array' : 'object', data });
          
          let productsArray: Product[] = [];
          let hasMoreData = false;
          
          if (Array.isArray(data)) {
            productsArray = data;
            hasMoreData = false;
          } else if (data.products && Array.isArray(data.products)) {
            productsArray = data.products;
            hasMoreData = data.hasMore || false;
          }
          
          console.log('ProductGrid: Initial products loaded:', { count: productsArray.length });
          setProducts(productsArray);
          setHasMore(hasMoreData);
          setCurrentPage(1);
        } catch (error) {
          console.error('Error loading initial products:', error);
        } finally {
          setLoading(false);
          setInitialLoading(false);
        }
      };
      
      loadInitialProducts();
    }
  }, [categoryId, isSearchMode, preFilteredProducts]);

  // Debounce para la búsqueda (solo en modo categoría)
  useEffect(() => {
    if (isSearchMode) return; // No hacer búsqueda en modo global
    
    const timeoutId = setTimeout(() => {
      if (query !== searchTerm) {
        setSearchTerm(query);
        setProducts([]);
        setCurrentPage(1);
        setHasMore(true);
        setInitialLoading(true);
        loadProducts(1, false, query);
      }
    }, 500); // 500ms de debounce

    return () => clearTimeout(timeoutId);
  }, [query, searchTerm, loadProducts, isSearchMode]);

  // Scroll al top cuando cambia la categoría
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [categoryId]);

  // Detectar scroll para cargar más productos (solo en modo categoría)
  useEffect(() => {
    if (isSearchMode) return; // No cargar más en modo global
    
    const handleScroll = () => {
      if (loading || !hasMore) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.offsetHeight;
      
      // Cargar más cuando esté cerca del final (600px antes)
      if (scrollTop + windowHeight >= docHeight - 600) {
        loadProducts(currentPage + 1, true, searchTerm);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, currentPage, loadProducts, searchTerm, isSearchMode]);

  // Ya no necesitamos filtrado local, se hace en el backend
  const filtered = products || [];

  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Banner de Ley Seca */}
        {category?.leySeca && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg border-2 border-red-500">
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl font-bold">🚫</div>
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold">LEY SECA</h3>
                <p className="text-sm md:text-base opacity-90">
                  Esta categoría está temporalmente deshabilitada por restricciones legales
                </p>
              </div>
              <div className="text-2xl font-bold">🚫</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-display font-semibold text-2xl md:text-3xl">
            {categoryName}
          </h2>
          <div className="ml-auto w-full max-w-xs relative">
            {!isSearchMode && (
              <Input
                placeholder="Buscar en esta categoría..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            )}
            {!isSearchMode && loading && query !== searchTerm ? (
              <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            ) : !isSearchMode ? (
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            ) : null}
          </div>
        </div>

        {initialLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {isSearchMode 
                ? 'No se encontraron productos con ese término de búsqueda' 
                : query 
                  ? 'No hay resultados para tu búsqueda' 
                  : 'No hay productos en esta categoría'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-3">
              {filtered.map((product) => (
                <div key={product.id} className="relative">
                  {category?.leySeca && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg z-10 flex items-center justify-center">
                      <div className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold">
                        LEY SECA
                      </div>
                    </div>
                  )}
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                measurementType={product.measurementType}
                    stock={category?.leySeca ? "0" : product.stock}
                    taxPercentage={settings?.taxPercentage ? parseFloat(settings.taxPercentage) : 16}
                onAddToCart={(quantity) => onAddToCart(product, quantity)}
              />
                </div>
            ))}
          </div>
            
            {/* Indicador de carga al final */}
            {loading && !isSearchMode && (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Cargando más productos...</p>
              </div>
            )}
            
            {/* Mensaje cuando no hay más productos */}
            {!hasMore && products.length > 0 && !isSearchMode && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Has visto todos los productos ({products.length} total)
                </p>
              </div>
            )}
            
            {/* Mensaje para búsqueda global */}
            {isSearchMode && products.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Mostrando {products.length} resultado{products.length !== 1 ? 's' : ''} de búsqueda global
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
