import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  enabled: boolean("enabled").notNull().default(true),
  leySeca: boolean("ley_seca").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url"),
  measurementType: text("measurement_type").notNull().default('unit'),
  externalCode: text("external_code"), // Código del sistema Valery
  stock: decimal("stock", { precision: 10, scale: 2 }).default('0'),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.string().or(z.number()),
  stock: z.string().or(z.number()).optional(),
  measurementType: z.enum(['unit', 'weight']),
  featured: z.boolean().optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('admin'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(['admin', 'superadmin']),
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: text("site_name").notNull(),
  siteDescription: text("site_description").notNull(),
  heroTitle: text("hero_title"),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactAddress: text("contact_address").notNull(),
  whatsappNumber: text("whatsapp_number"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  instagramAccessToken: text("instagram_access_token"),
  twitterUrl: text("twitter_url"),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).notNull().default('16.00'),
  enableCarousel1: boolean("enable_carousel_1").notNull().default(true),
  enableCarousel2: boolean("enable_carousel_2").notNull().default(true),
  enableCarousel3: boolean("enable_carousel_3").notNull().default(true),
  // Carrusel Hero - Vista 1 (FV BODEGONES)
  carouselTitle1: text("carousel_title_1"),
  carouselSubtitle1: text("carousel_subtitle_1"),
  carouselDescription1: text("carousel_description_1"),
  carouselImage1: text("carousel_image_1"),
  carouselBackground1: text("carousel_background_1"),
  carouselButton1: text("carousel_button_1"),
  carouselUrl1: text("carousel_url_1"),
  // Carrusel Hero - Vista 2 (ZONA LONNGE)
  carouselTitle2: text("carousel_title_2"),
  carouselSubtitle2: text("carousel_subtitle_2"),
  carouselDescription2: text("carousel_description_2"),
  carouselImage2: text("carousel_image_2"),
  carouselBackground2: text("carousel_background_2"),
  carouselButton2: text("carousel_button_2"),
  carouselUrl2: text("carousel_url_2"),
  // Carrusel Hero - Vista 3 (FV FARMACIA)
  carouselTitle3: text("carousel_title_3"),
  carouselSubtitle3: text("carousel_subtitle_3"),
  carouselDescription3: text("carousel_description_3"),
  carouselImage3: text("carousel_image_3"),
  carouselBackground3: text("carousel_background_3"),
  carouselButton3: text("carousel_button_3"),
  carouselUrl3: text("carousel_url_3"),
  // Coordenadas para el mapa de contacto
  latitude: decimal("latitude", { precision: 18, scale: 15 }).notNull().default('9.552533674221890'),
  longitude: decimal("longitude", { precision: 19, scale: 15 }).notNull().default('-69.205197603437410'),
  // Datos bancarios para pagos
  paymentBank: text("payment_bank"),
  paymentCI: text("payment_ci"),
  paymentPhone: text("payment_phone"),
  paymentInstructions: text("payment_instructions"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  total: z.string().or(z.number()),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).default('pending'),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  measurementType: text("measurement_type").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
}).extend({
  price: z.string().or(z.number()),
  quantity: z.string().or(z.number()),
  subtotal: z.string().or(z.number()),
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  enabled: boolean("enabled").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;
