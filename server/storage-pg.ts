import { db } from './db';
import fs from 'fs';
import { eq, desc, sql } from 'drizzle-orm';
import { 
  categories,
  products,
  adminUsers,
  siteSettings,
  orders,
  orderItems,
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
    await db.delete(categories).where(eq(categories.id, id));
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

  async searchProductsByCategory(categoryId: string, searchTerm: string, page: number, limit: number): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    
    // Obtener productos que coincidan con la búsqueda (case insensitive)
    const productsResult = await db.select()
      .from(products)
      .where(
        sql`${products.categoryId} = ${categoryId} AND LOWER(${products.name}) LIKE LOWER(${'%' + searchTerm + '%'})`
      )
      .limit(limit)
      .offset(offset);
    
    // Contar total de productos que coincidan con la búsqueda
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        sql`${products.categoryId} = ${categoryId} AND LOWER(${products.name}) LIKE LOWER(${'%' + searchTerm + '%'})`
      );
    
    const total = totalResult[0]?.count || 0;
    const hasMore = offset + productsResult.length < total;
    
    return { products: productsResult, total, hasMore };
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

  // Importación desde Excel (.xls/.xlsx)
  async importProductsFromExcel(filePath: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      const xlsxModule: any = await import('xlsx');
      const XLSX: any = xlsxModule?.default ?? xlsxModule;

      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

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

      for (const row of data) {
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
            errors.push(`Fila inválida: ${JSON.stringify(row)}`);
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
        } catch (e: any) {
          errors.push(e?.message || 'Error procesando fila');
        }
      }
    } catch (e: any) {
      errors.push(e?.message || 'Error leyendo archivo');
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
}

export const storage = new PostgresStorage();
