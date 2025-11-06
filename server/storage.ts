import { 
  type Category, 
  type InsertCategory,
  type Product,
  type InsertProduct,
  type AdminUser,
  type InsertAdminUser,
  type SiteSettings,
  type InsertSiteSettings,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Sponsor,
  type InsertSponsor,
} from "@shared/schema";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  // Featured products
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProductsByCategoryPaginated(categoryId: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }>;
  searchProductsByCategory(categoryId: string, searchTerm: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }>;
  getProductCountsByCategory(): Promise<Record<string, number>>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Excel Import
  importProductsFromExcel(filePath: string, sessionId?: string): Promise<{ imported: number; errors: string[] }>;

  // Admin Users
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUserById(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<void>;

  // Site Settings
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Sponsors
  getSponsors(includeDisabled?: boolean): Promise<Sponsor[]>;
  getSponsorById(id: string): Promise<Sponsor | undefined>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();
  private siteSettings: SiteSettings | undefined;
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const defaultAdminId = crypto.randomUUID();
    this.adminUsers.set(defaultAdminId, {
      id: defaultAdminId,
      username: 'admin',
      email: 'admin@fvbodegones.com',
      password: 'admin123',
      role: 'superadmin',
      createdAt: new Date(),
    });

    this.siteSettings = {
      id: crypto.randomUUID(),
      siteName: 'FV BODEGONES',
      siteDescription: 'Tu bodega de confianza para productos de consumo diario',
      contactPhone: '+1 (555) 123-4567',
      contactEmail: 'contacto@fvbodegones.com',
      contactAddress: 'Calle Principal #123, Ciudad',
      facebookUrl: '#',
      instagramUrl: '#',
      twitterUrl: '#',
      updatedAt: new Date(),
    };
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      ...category,
      imageUrl: category.imageUrl ?? null,
      enabled: category.enabled ?? true,
      createdAt: new Date(),
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
    Array.from(this.products.values())
      .filter(p => p.categoryId === id)
      .forEach(p => this.products.delete(p.id));
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
  }

  async getProductsByCategoryPaginated(categoryId: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const allProducts = Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
    const total = allProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = allProducts.slice(startIndex, endIndex);
    const hasMore = endIndex < total;
    
    return { products, total, hasMore };
  }

  async searchProductsByCategory(categoryId: string, searchTerm: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const allProducts = Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
    
    // Dividir el término de búsqueda en palabras individuales
    const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (searchWords.length === 0) {
      // Si no hay palabras de búsqueda, devolver productos paginados normales
      return this.getProductsByCategoryPaginated(categoryId, page, limit);
    }
    
    // Filtrar productos que contengan TODAS las palabras (sin importar el orden)
    const searchWordsLower = searchWords.map(word => word.toLowerCase());
    const filteredProducts = allProducts.filter(p => {
      const productNameLower = p.name.toLowerCase();
      // Todas las palabras deben estar presentes en el nombre del producto
      return searchWordsLower.every(word => productNameLower.includes(word));
    });
    
    // Ordenar alfabéticamente
    filteredProducts.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    
    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const products = filteredProducts.slice(startIndex, endIndex);
    const hasMore = endIndex < total;
    
    return { products, total, hasMore };
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      ...product,
      price: product.price.toString(),
      imageUrl: product.imageUrl ?? null,
      createdAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...product,
      price: product.price ? product.price.toString() : existing.price,
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return Array.from(this.adminUsers.values());
  }

  async getAdminUserById(id: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(u => u.username === username);
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const newUser: AdminUser = {
      id: crypto.randomUUID(),
      ...user,
      createdAt: new Date(),
    };
    this.adminUsers.set(newUser.id, newUser);
    return newUser;
  }

  async updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const existing = this.adminUsers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...user };
    this.adminUsers.set(id, updated);
    return updated;
  }

  async deleteAdminUser(id: string): Promise<void> {
    this.adminUsers.delete(id);
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettings;
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const updated: SiteSettings = {
      id: this.siteSettings?.id || crypto.randomUUID(),
      ...settings,
      facebookUrl: settings.facebookUrl ?? null,
      instagramUrl: settings.instagramUrl ?? null,
      twitterUrl: settings.twitterUrl ?? null,
      updatedAt: new Date(),
    };
    this.siteSettings = updated;
    return updated;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      ...order,
      customerEmail: order.customerEmail ?? null,
      customerAddress: order.customerAddress ?? null,
      notes: order.notes ?? null,
      total: order.total.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      status,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      ...item,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      subtotal: item.subtotal.toString(),
    };
    this.orderItems.set(newItem.id, newItem);
    return newItem;
  }

  async importProductsFromExcel(filePath: string, sessionId?: string): Promise<{ imported: number; errors: string[] }> {
    // Implementación básica para desarrollo sin DB
    return { imported: 0, errors: ['Excel import not available in memory storage'] };
  }

  // Sponsors
  private sponsors: Map<string, Sponsor> = new Map();

  async getSponsors(includeDisabled: boolean = false): Promise<Sponsor[]> {
    const allSponsors = Array.from(this.sponsors.values());
    const filtered = includeDisabled 
      ? allSponsors 
      : allSponsors.filter(s => s.enabled);
    return filtered.sort((a, b) => a.order - b.order);
  }

  async getSponsorById(id: string): Promise<Sponsor | undefined> {
    return this.sponsors.get(id);
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const newSponsor: Sponsor = {
      id: crypto.randomUUID(),
      ...sponsor,
      logoUrl: sponsor.logoUrl ?? null,
      websiteUrl: sponsor.websiteUrl ?? null,
      enabled: sponsor.enabled ?? true,
      order: sponsor.order ?? 0,
      createdAt: new Date(),
    };
    this.sponsors.set(newSponsor.id, newSponsor);
    return newSponsor;
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const existing = this.sponsors.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...sponsor };
    this.sponsors.set(id, updated);
    return updated;
  }

  async deleteSponsor(id: string): Promise<void> {
    this.sponsors.delete(id);
  }
}

// Conditionally initialize storage without importing Postgres code
// unless DATABASE_URL is present. This allows dev mode without a DB.
export const storage: IStorage = (() => {
  if (process.env.DATABASE_URL) {
    // Dynamic import at runtime to avoid evaluating db.ts when not needed
    const modPromise = import('./storage-pg');
    // Create a lightweight proxy that delays actual instantiation
    // until a method is called (so top-level stays synchronous).
    const handler: ProxyHandler<any> = {
      get: (_target, prop) => {
        return async (...args: any[]) => {
          const mod = await modPromise;
          const impl = new mod.PostgresStorage();
          // @ts-expect-error dynamic access
          return impl[prop](...args);
        };
      },
    };
    // The proxy type matches IStorage's async methods usage in routes
    // (all methods are awaited).
    // @ts-expect-error proxy for async methods
    return new Proxy({}, handler);
  }
  return new MemStorage();
})();
