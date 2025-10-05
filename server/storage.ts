import { 
  type Category, 
  type InsertCategory,
  type Product,
  type InsertProduct,
  type AdminUser,
  type InsertAdminUser,
  type SiteSettings,
  type InsertSiteSettings,
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
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

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
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();
  private siteSettings: SiteSettings | undefined;

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
}

export const storage = new MemStorage();
