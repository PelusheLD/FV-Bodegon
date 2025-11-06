import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertProductSchema, insertAdminUserSchema, insertSiteSettingsSchema, insertOrderSchema, insertOrderItemSchema, insertSponsorSchema } from "@shared/schema";
import { z } from "zod";
import { upload, uploadExcel } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al subir la imagen" });
    }
  });
  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: "Invalid category ID format" });
      }

      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      
      // Handle specific database constraint errors
      if (error.code === '23503') {
        return res.status(409).json({ 
          error: "No se puede eliminar la categoría porque tiene productos asociados con pedidos existentes",
          details: "Esta categoría contiene productos que han sido incluidos en pedidos anteriores. Para eliminar la categoría, primero debe eliminar todos los pedidos relacionados."
        });
      }
      
      res.status(500).json({ 
        error: "Error al eliminar la categoría", 
        details: error.message || "Error desconocido",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Featured products (debe ir antes de /api/products/:id)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const search = req.query.search as string;
      
      // Si hay búsqueda, usar el endpoint de búsqueda
      if (search && search.trim()) {
        console.log('Routes: Search request:', { categoryId, search: search.trim(), page, limit });
        const result = await storage.searchProductsByCategory(categoryId, search.trim(), page, limit);
        console.log('Routes: Search result:', result);
        res.json(result);
      }
      // Si no hay parámetros de paginación, devolver todos los productos (compatibilidad)
      else if (!req.query.page && !req.query.limit) {
        const products = await storage.getProductsByCategory(categoryId);
        res.json(products);
      } else {
        const result = await storage.getProductsByCategoryPaginated(categoryId, page, limit);
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Endpoint paginado para admin
  app.get("/api/admin/products/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 200;
      
      const result = await storage.getProductsByCategoryPaginated(categoryId, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Endpoint para conteos de productos por categoría
  app.get("/api/admin/products/counts", async (req, res) => {
    try {
      const counts = await storage.getProductCountsByCategory();
      res.json(counts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product counts" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Server-Sent Events para progreso de importación
  app.get("/api/products/import-progress/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Función para enviar progreso
    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Almacenar la función de envío para esta sesión
    if (!global.importProgress) {
      global.importProgress = new Map();
    }
    global.importProgress.set(sessionId, sendProgress);

    // Enviar evento inicial
    sendProgress({ type: 'connected', message: 'Conectado al progreso de importación' });

    // Limpiar cuando se cierre la conexión
    req.on('close', () => {
      global.importProgress?.delete(sessionId);
    });
  });

  // Excel Import con progreso
  app.post("/api/products/import-excel", uploadExcel.single('excel'), async (req, res) => {
    const sessionId = req.headers['x-session-id'] as string || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se proporcionó archivo Excel" });
      }

      const result = await storage.importProductsFromExcel(req.file.path, sessionId);
      res.json({ 
        message: `Se importaron ${result.imported} productos exitosamente`,
        imported: result.imported,
        errors: result.errors,
        sessionId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al importar productos" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin Users
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getAdminUsers();
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const validatedData = insertAdminUserSchema.parse(req.body);
      const user = await storage.createAdminUser(validatedData);
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      const validatedData = insertAdminUserSchema.partial().parse(req.body);
      const user = await storage.updateAdminUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await storage.deleteAdminUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Site Settings
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Instagram Posts
  app.get("/api/instagram/posts", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      
      if (!settings?.instagramAccessToken) {
        return res.json([]);
      }

      // Fetch Instagram posts using the access token
      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,caption,timestamp,thumbnail_url,like_count,comments_count&limit=4&access_token=${settings.instagramAccessToken}`
      );

      if (!response.ok) {
        console.error('Instagram API error:', response.status, response.statusText);
        return res.json([]);
      }

      const data = await response.json();
      res.json(data.data || []);
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      res.json([]);
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      console.log("Settings update request body:", req.body);
      
      // Verificar si los campos del carrusel están presentes
      const carouselFields = [
        'carouselTitle1', 'carouselSubtitle1', 'carouselDescription1', 'carouselImage1',
        'carouselTitle2', 'carouselSubtitle2', 'carouselDescription2', 'carouselImage2',
        'carouselTitle3', 'carouselSubtitle3', 'carouselDescription3', 'carouselImage3'
      ];
      
      console.log("Carousel fields present:", carouselFields.map(field => ({
        field,
        value: req.body[field],
        present: field in req.body
      })));
      
      const validatedData = insertSiteSettingsSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const settings = await storage.updateSiteSettings(validatedData);
      console.log("Updated settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Settings update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getAdminUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }

      const { password: _, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    return new Promise<void>((resolve) => {
      if (req.session) {
        const sessionCookieName = req.session.cookie.name || 'connect.sid';
        req.session.destroy((err: Error | null) => {
          if (err) {
            res.status(500).json({ error: "Logout failed" });
            resolve();
            return;
          }
          // Limpiar la cookie de sesión usando el nombre correcto y la misma configuración
          res.clearCookie(sessionCookieName, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
            path: '/'
          });
          res.status(204).send();
          resolve();
        });
      } else {
        // Si no hay sesión, limpiar la cookie por si acaso
        res.clearCookie('connect.sid', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
          path: '/'
        });
        res.status(204).send();
        resolve();
      }
    });
  });

  app.get("/api/auth/session", async (req, res) => {
    if (req.session?.userId) {
      const user = await storage.getAdminUserById(req.session.userId);
      if (user) {
        const { password, ...sanitizedUser } = user;
        return res.json(sanitizedUser);
      }
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  // Orders
  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const validatedOrder = insertOrderSchema.parse(orderData);
      
      const order = await storage.createOrder(validatedOrder);
      
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const validatedItem = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(validatedItem);
        }
      }
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  // Sponsors
  app.get("/api/sponsors", async (req, res) => {
    try {
      const includeDisabled = req.query.includeDisabled === 'true';
      const sponsors = await storage.getSponsors(includeDisabled);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsors" });
    }
  });

  app.get("/api/sponsors/:id", async (req, res) => {
    try {
      const sponsor = await storage.getSponsorById(req.params.id);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      res.json(sponsor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsor" });
    }
  });

  app.post("/api/sponsors", async (req, res) => {
    try {
      const validatedData = insertSponsorSchema.parse(req.body);
      const sponsor = await storage.createSponsor(validatedData);
      res.status(201).json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create sponsor" });
    }
  });

  app.put("/api/sponsors/:id", async (req, res) => {
    try {
      const validatedData = insertSponsorSchema.partial().parse(req.body);
      const sponsor = await storage.updateSponsor(req.params.id, validatedData);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      res.json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update sponsor" });
    }
  });

  app.delete("/api/sponsors/:id", async (req, res) => {
    try {
      await storage.deleteSponsor(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sponsor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
