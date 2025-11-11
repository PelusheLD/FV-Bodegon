import { db } from './db';
import fs from 'fs';
import { eq, desc, sql, and, like, asc } from 'drizzle-orm';
import { 
  categories,
  products,
  adminUsers,
  siteSettings,
  orders,
  orderItems,
  sponsors,
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
import { IStorage } from './storage';

export class PostgresStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      console.log("Attempting to delete category with ID:", id);
      
      // First check if category exists
      const existingCategory = await db.select().from(categories).where(eq(categories.id, id));
      if (existingCategory.length === 0) {
        throw new Error(`Category with ID ${id} not found`);
      }

      // Get all products in this category
      const productsInCategory = await db.select().from(products).where(eq(products.categoryId, id));
      console.log(`Found ${productsInCategory.length} products in category`);

      // Delete order_items that reference products in this category
      if (productsInCategory.length > 0) {
        const productIds = productsInCategory.map(p => p.id);
        console.log("Deleting order_items for products:", productIds);
        
        // Delete order_items in batches to avoid potential issues
        for (const productId of productIds) {
          await db.delete(orderItems).where(eq(orderItems.productId, productId));
        }
        console.log("Order items deleted successfully");
      }
      
      // Now delete the category (this will cascade delete the products)
      const result = await db.delete(categories).where(eq(categories.id, id));
      console.log("Category deleted successfully:", result);
    } catch (error) {
      console.error("Database error in deleteCategory:", error);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getFeaturedProducts(limit: number = 12): Promise<Product[]> {
    const result = await db.select().from(products)
      .where(eq(products.featured, true))
      .limit(limit);
    return result;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getProductsByCategoryPaginated(categoryId: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    
    // Obtener productos paginados
    const productsResult = await db.select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .limit(limit)
      .offset(offset);
    
    // Contar total de productos
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    
    const total = totalResult[0]?.count || 0;
    const hasMore = offset + productsResult.length < total;
    
    return { products: productsResult, total, hasMore };
  }

  async getProductCountsByCategory(): Promise<Record<string, number>> {
    const result = await db.select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)`
    })
    .from(products)
    .groupBy(products.categoryId);
    
    const counts: Record<string, number> = {};
    result.forEach(row => {
      counts[row.categoryId] = row.count;
    });
    
    return counts;
  }

  async searchProductsByCategory(categoryId: string, searchTerm: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    console.log('PostgresStorage: searchProductsByCategory called with:', { categoryId, searchTerm, page, limit });
    
    const offset = (page - 1) * limit;
    
    // Dividir el término de búsqueda en palabras individuales
    const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0);
    console.log('PostgresStorage: searchWords:', searchWords);
    
    if (searchWords.length === 0) {
      // Si no hay palabras de búsqueda, devolver productos paginados normales
      console.log('PostgresStorage: No search words, returning paginated products');
      return this.getProductsByCategoryPaginated(categoryId, page, limit);
    }
    
    try {
      console.log('PostgresStorage: Starting search with words:', searchWords);
      
      // Obtener todos los productos de la categoría primero
      const allProducts = await db.select()
        .from(products)
        .where(eq(products.categoryId, categoryId));
      
      console.log('PostgresStorage: Total products in category:', allProducts.length);
      
      // Filtrar productos que contengan todas las palabras (en cualquier orden)
      const filteredProducts = allProducts.filter(product => {
        const productNameLower = product.name.toLowerCase();
        
        // Verificar que todas las palabras estén presentes en el nombre del producto
        return searchWords.every(word => 
          productNameLower.includes(word.toLowerCase())
        );
      });
      
      console.log('PostgresStorage: Filtered products count:', filteredProducts.length);
      
      // Ordenar alfabéticamente
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      
      // Aplicar paginación
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);
      const hasMore = offset + paginatedProducts.length < total;
      
      console.log('PostgresStorage: Paginated products:', paginatedProducts.length);
      console.log('PostgresStorage: Total matches:', total);
      
      return { products: paginatedProducts, total, hasMore };
    } catch (error) {
      console.error('PostgresStorage: Error in searchProductsByCategory:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const productData = {
      ...product,
      price: product.price.toString(),
    };
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const productData: any = { ...product };
    if (productData.price !== undefined) {
      productData.price = productData.price.toString();
    }
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  async getAdminUserById(id: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return result[0];
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return result[0];
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const result = await db.insert(adminUsers).values(user).returning();
    return result[0];
  }

  async updateAdminUser(id: string, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const result = await db.update(adminUsers)
      .set(user)
      .where(eq(adminUsers.id, id))
      .returning();
    return result[0];
  }

  async deleteAdminUser(id: string): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const result = await db.select().from(siteSettings).limit(1);
    return result[0];
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    
    if (existing) {
      const result = await db.update(siteSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(siteSettings).values(settings).returning();
      return result[0];
    }
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderData = {
      ...order,
      total: order.total.toString(),
      totalInBolivares: order.totalInBolivares ? order.totalInBolivares.toString() : null,
    };
    const result = await db.insert(orders).values(orderData).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const itemData = {
      ...item,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      subtotal: item.subtotal.toString(),
    };
    const result = await db.insert(orderItems).values(itemData).returning();
    return result[0];
  }

  // Importación desde Excel (.xls/.xlsx) con progreso
  async importProductsFromExcel(filePath: string, sessionId?: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    // Función para enviar progreso
    const sendProgress = (data: any) => {
      if (sessionId && global.importProgress?.has(sessionId)) {
        global.importProgress.get(sessionId)!(data);
      }
    };

    try {
      sendProgress({ type: 'start', message: 'Iniciando lectura del archivo Excel...' });
      
      const xlsxModule: any = await import('xlsx');
      const XLSX: any = xlsxModule?.default ?? xlsxModule;

      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      sendProgress({ 
        type: 'progress', 
        message: `Archivo leído exitosamente. Procesando ${data.length} filas...`,
        total: data.length,
        processed: 0
      });

      // Asegurar categoría OTROS
      let otros = await this.getCategoryByName('OTROS');
      if (!otros) {
        otros = await this.createCategory({ name: 'OTROS', enabled: true });
      }

      const norm = (s: string) => s
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const kv: Record<string, any> = {};
          for (const [k, v] of Object.entries(row)) kv[norm(k)] = v;

          const codigo = kv['codigo'] ?? kv['código'] ?? kv['cod'] ?? '';
          const nombre = kv['nombre'] ?? kv['producto'] ?? '';
          const existenciaRaw = kv['existencia actual'] ?? kv['existencia'] ?? kv['stock'] ?? '0';
          const precioRaw = kv['precio maximo'] ?? kv['precio máximo'] ?? kv['precio maximoo'] ?? kv['precio'] ?? '0';

          const stock = parseFloat(String(existenciaRaw).replace(/,/g, '.')) || 0;
          const price = parseFloat(String(precioRaw).replace(/,/g, '.')) || 0;
          const isWeight = typeof nombre === 'string' && nombre.toLowerCase().includes('por peso');

          if (!codigo || !nombre || price <= 0) {
            errors.push(`Fila ${i + 1} inválida: ${JSON.stringify(row)}`);
            continue;
          }

          const existing = await this.getProductByExternalCode(codigo);
          if (existing) {
            const update: any = { price, stock };
            if (isWeight && existing.measurementType !== 'weight') update.measurementType = 'weight';
            await this.updateProduct(existing.id, update);
          } else {
            await this.createProduct({
              name: nombre,
              price,
              categoryId: otros.id,
              externalCode: codigo,
              stock,
              measurementType: isWeight ? 'weight' : 'unit',
            } as any);
          }
          imported++;

          // Enviar progreso cada 10 productos o al final
          if ((i + 1) % 10 === 0 || i === data.length - 1) {
            sendProgress({
              type: 'progress',
              message: `Procesando producto ${i + 1} de ${data.length}...`,
              total: data.length,
              processed: i + 1,
              imported,
              errors: errors.length
            });
          }
        } catch (e: any) {
          errors.push(`Fila ${i + 1}: ${e?.message || 'Error procesando fila'}`);
        }
      }

      sendProgress({
        type: 'complete',
        message: `Importación completada. ${imported} productos importados, ${errors.length} errores.`,
        imported,
        errors: errors.length
      });

    } catch (e: any) {
      errors.push(e?.message || 'Error leyendo archivo');
      sendProgress({
        type: 'error',
        message: `Error durante la importación: ${e?.message || 'Error desconocido'}`,
        errors: errors.length
      });
    }

    return { imported, errors };
  }

  private async getCategoryByName(name: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.name, name));
    return result[0];
  }

  private async getProductByExternalCode(externalCode: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.externalCode, externalCode));
    return result[0];
  }

  // Sponsors
  async getSponsors(includeDisabled: boolean = false): Promise<Sponsor[]> {
    if (includeDisabled) {
      const result = await db.select().from(sponsors).orderBy(asc(sponsors.order));
      return result;
    } else {
      const result = await db.select().from(sponsors)
        .where(eq(sponsors.enabled, true))
        .orderBy(asc(sponsors.order));
      return result;
    }
  }

  async getSponsorById(id: string): Promise<Sponsor | undefined> {
    const result = await db.select().from(sponsors).where(eq(sponsors.id, id));
    return result[0];
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const result = await db.insert(sponsors).values(sponsor).returning();
    return result[0];
  }

  async updateSponsor(id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const result = await db.update(sponsors)
      .set(sponsor)
      .where(eq(sponsors.id, id))
      .returning();
    return result[0];
  }

  async deleteSponsor(id: string): Promise<void> {
    await db.delete(sponsors).where(eq(sponsors.id, id));
  }
}

export const storage = new PostgresStorage();
