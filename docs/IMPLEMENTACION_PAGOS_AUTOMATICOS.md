# Implementación del Sistema de Pagos Automáticos

Este documento recopila todos los cambios necesarios para implementar el sistema de pagos automáticos (pago móvil) en el sistema FV-Bodegon.

## 📋 Tabla de Contenidos

1. [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
2. [Cambios en el Esquema (Schema)](#cambios-en-el-esquema-schema)
3. [Cambios en el Backend](#cambios-en-el-backend)
4. [Cambios en el Frontend](#cambios-en-el-frontend)
5. [Lista de Bancos Venezolanos](#lista-de-bancos-venezolanos)
6. [Instrucciones de Implementación](#instrucciones-de-implementación)

---

## 1. Migraciones de Base de Datos

### 1.1. Agregar campos de pago a `site_settings`

**Archivo:** `migrations/0008_add_payment_fields.sql`

```sql
-- Agregar campos de datos bancarios para pagos
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS payment_bank TEXT,
ADD COLUMN IF NOT EXISTS payment_ci TEXT,
ADD COLUMN IF NOT EXISTS payment_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Insertar valores por defecto si no existen
UPDATE site_settings
SET 
  payment_bank = 'Banplus',
  payment_ci = 'J-503280280',
  payment_phone = '04245775917',
  payment_instructions = 'IMPORTANTE: Indicar número de teléfono, banco, cédula titular del pago móvil para confirmar.'
WHERE payment_bank IS NULL;
```

### 1.2. Agregar campos de pago a `orders`

**Archivo:** `migrations/0009_add_payment_fields_to_orders.sql`

```sql
ALTER TABLE "orders" ADD COLUMN "total_in_bolivares" numeric(10, 2);
ALTER TABLE "orders" ADD COLUMN "payment_bank" text;
ALTER TABLE "orders" ADD COLUMN "payment_ci" text;
ALTER TABLE "orders" ADD COLUMN "payment_phone" text;
ALTER TABLE "orders" ADD COLUMN "payment_confirmed" boolean NOT NULL DEFAULT false;
```

### 1.3. Cambiar `payment_confirmed` a `payment_status`

**Archivo:** `migrations/0010_change_payment_confirmed_to_status.sql`

```sql
ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_confirmed";
ALTER TABLE "orders" ADD COLUMN "payment_status" text NOT NULL DEFAULT 'pending';
```

**Nota:** Si ya existe `payment_confirmed`, migrar los datos:

```sql
-- Si necesitas migrar datos existentes:
UPDATE "orders" SET "payment_status" = 'approved' WHERE "payment_confirmed" = true;
UPDATE "orders" SET "payment_status" = 'pending' WHERE "payment_confirmed" = false;
```

---

## 2. Cambios en el Esquema (Schema)

### 2.1. Actualizar `siteSettings` en `shared/schema.ts`

```typescript
export const siteSettings = pgTable("site_settings", {
  // ... campos existentes ...
  
  // Datos bancarios para pagos
  paymentBank: text("payment_bank"),
  paymentCI: text("payment_ci"),
  paymentPhone: text("payment_phone"),
  paymentInstructions: text("payment_instructions"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});
```

### 2.2. Actualizar `orders` en `shared/schema.ts`

```typescript
export const orders = pgTable("orders", {
  // ... campos existentes ...
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  totalInBolivares: decimal("total_in_bolivares", { precision: 10, scale: 2 }),
  status: text("status").notNull().default('pending'),
  notes: text("notes"),
  
  // Datos de confirmación de pago
  paymentBank: text("payment_bank"),
  paymentCI: text("payment_ci"),
  paymentPhone: text("payment_phone"),
  paymentStatus: text("payment_status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  total: z.string().or(z.number()),
  totalInBolivares: z.string().or(z.number()).optional(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).default('pending'),
  paymentStatus: z.enum(['pending', 'approved', 'rejected']).default('pending').optional(),
});
```

---

## 3. Cambios en el Backend

### 3.1. Actualizar `server/storage.ts` (Interfaz)

```typescript
export interface IStorage {
  // ... métodos existentes ...
  
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined>;
  
  // ... otros métodos ...
}
```

### 3.2. Implementar en `server/storage.ts` (MemStorage)

```typescript
async createOrder(order: InsertOrder): Promise<Order> {
  const newOrder: Order = {
    id: crypto.randomUUID(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? null,
    customerAddress: order.customerAddress ?? null,
    status: order.status || 'pending',
    notes: order.notes ?? null,
    total: order.total.toString(),
    totalInBolivares: order.totalInBolivares ? order.totalInBolivares.toString() : null,
    paymentBank: order.paymentBank ?? null,
    paymentCI: order.paymentCI ?? null,
    paymentPhone: order.paymentPhone ?? null,
    paymentStatus: order.paymentStatus ?? 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  this.orders.set(newOrder.id, newOrder);
  return newOrder;
}

async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined> {
  const existing = this.orders.get(id);
  if (!existing) return undefined;
  
  const updated = { 
    ...existing, 
    paymentStatus,
    updatedAt: new Date(),
  };
  this.orders.set(id, updated);
  return updated;
}
```

### 3.3. Implementar en `server/storage-pg.ts` (PostgreSQL)

```typescript
async createOrder(order: InsertOrder): Promise<Order> {
  const orderData = {
    ...order,
    total: order.total.toString(),
    totalInBolivares: order.totalInBolivares ? order.totalInBolivares.toString() : null,
  };
  const result = await db.insert(orders).values(orderData).returning();
  return result[0];
}

async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined> {
  const result = await db.update(orders)
    .set({ paymentStatus, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return result[0];
}
```

### 3.4. Agregar endpoint en `server/routes.ts`

```typescript
// Endpoint para actualizar el estado de pago de una orden
app.patch("/api/orders/:id/payment", authMiddleware, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus || !['pending', 'approved', 'rejected'].includes(paymentStatus)) {
      return res.status(400).json({ error: "paymentStatus must be 'pending', 'approved', or 'rejected'" });
    }
    
    const order = await storage.updateOrderPaymentStatus(req.params.id, paymentStatus);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: error.message || "Failed to update payment status" });
  }
});
```

### 3.5. Actualizar endpoint de creación de orden en `server/routes.ts`

Asegúrate de que el endpoint `POST /api/orders` acepte los nuevos campos:

```typescript
app.post("/api/orders", async (req, res) => {
  try {
    const validatedData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(validatedData);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});
```

---

## 4. Cambios en el Frontend

### 4.1. Lista de Bancos Venezolanos

**Archivo:** `client/src/components/ShoppingCart.tsx` y `client/src/components/admin/AdminOrders.tsx`

```typescript
const BANKS = [
  { code: '0102', name: 'BANCO DE VENEZUELA' },
  { code: '0104', name: 'BANCO VENEZOLANO DE CREDITO' },
  { code: '0105', name: 'BANCO MERCANTIL' },
  { code: '0108', name: 'BBVA PROVINCIAL' },
  { code: '0114', name: 'BANCARIBE' },
  { code: '0115', name: 'BANCO EXTERIOR' },
  { code: '0128', name: 'BANCO CARONI' },
  { code: '0134', name: 'BANESCO' },
  { code: '0137', name: 'BANCO SOFITASA' },
  { code: '0138', name: 'BANCO PLAZA' },
  { code: '0146', name: 'BANGENTE' },
  { code: '0151', name: 'BANCO FONDO COMUN' },
  { code: '0156', name: '100% BANCO' },
  { code: '0157', name: 'DELSUR BANCO UNIVERSAL' },
  { code: '0163', name: 'BANCO DEL TESORO' },
  { code: '0168', name: 'BANCRECER' },
  { code: '0169', name: 'R4 BANCO MICROFINANCIERO C.A.' },
  { code: '0171', name: 'BANCO ACTIVO' },
  { code: '0172', name: 'BANCAMIGA BANCO UNIVERSAL, C.A.' },
  { code: '0173', name: 'BANCO INTERNACIONAL DE DESARROLLO' },
  { code: '0174', name: 'BANPLUS' },
  { code: '0175', name: 'BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL' },
  { code: '0177', name: 'BANFANB' },
  { code: '0178', name: 'N58 BANCO DIGITAL BANCO MICROFINANCIERO S A' },
  { code: '0191', name: 'BANCO NACIONAL DE CREDITO' },
];

// Función helper para obtener el nombre del banco desde el código
const getBankName = (code: string | null | undefined): string => {
  if (!code) return code || '';
  const bank = BANKS.find(b => b.code === code);
  return bank ? bank.name : code;
};
```

### 4.2. Actualizar `ShoppingCart.tsx` - Formulario de Checkout

**Importaciones necesarias:**

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDollarRate } from "@/contexts/DollarRateContext";
```

**En el componente, agregar cálculo de total en bolívares:**

```typescript
const { convertToBolivares, formatCurrency } = useDollarRate();
const totalInBolivares = convertToBolivares(total);
```

**Actualizar el handler de submit del formulario:**

```typescript
const handleCheckoutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  // ... código existente para calcular items ...
  
  // Obtener tipo de documento y número, concatenarlos
  const docType = formData.get('paymentCIDocType') as string || '';
  const docNumber = formData.get('paymentCI') as string || '';
  const paymentCI = docType && docNumber ? `${docType}${docNumber}` : undefined;

  const orderData = {
    customerName: formData.get('customerName') as string,
    customerPhone: formData.get('customerPhone') as string,
    customerAddress: formData.get('customerAddress') as string || undefined,
    notes: formData.get('notes') as string || undefined,
    total: total,
    totalInBolivares: totalInBolivares,
    paymentBank: formData.get('paymentBank') as string || undefined,
    paymentCI: paymentCI,
    paymentPhone: formData.get('paymentPhone') as string || undefined,
    status: 'pending',
    items: orderItems,
  };

  createOrderMutation.mutate(orderData);
};
```

**JSX del formulario de checkout (layout de dos columnas):**

```tsx
<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Finalizar Compra</DialogTitle>
  </DialogHeader>
  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna Izquierda: Formulario del Cliente y Resumen */}
      <div className="space-y-4">
        {/* Campos del cliente */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Nombre completo *</Label>
          <Input id="customerName" name="customerName" required />
        </div>
        {/* ... otros campos del cliente ... */}
        
        {/* Resumen del pedido */}
        <div className="space-y-2 p-4 bg-muted rounded-md">
          <h3 className="font-semibold">Resumen del Pedido</h3>
          {/* ... items del carrito ... */}
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium">Total a pagar en $:</span>
            <span className="font-bold text-lg text-primary">
              {formatCurrency(total, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium">Total a pagar en Bs.:</span>
            <span className="font-bold text-lg text-primary">
              Bs. {formatCurrency(totalInBolivares, 'BS')}
            </span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Datos Bancarios y Confirmación */}
      <div className="space-y-4">
        {/* Datos para Pago Móvil */}
        {settings?.paymentBank && settings?.paymentCI && settings?.paymentPhone && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Datos para Pago Móvil
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banco:</span>
                <span className="font-medium">{settings.paymentBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documento:</span>
                <span className="font-medium">{settings.paymentCI}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefono:</span>
                <span className="font-medium">{settings.paymentPhone}</span>
              </div>
              {settings.paymentInstructions && (
                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                    {settings.paymentInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monto a pagar en BS */}
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-900 dark:text-green-100">
              Monto a pagar en Bs.:
            </span>
            <span className="font-bold text-lg text-green-700 dark:text-green-300">
              Bs. {formatCurrency(totalInBolivares, 'BS')}
            </span>
          </div>
        </div>

        {/* Inputs de confirmación de pago */}
        <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Datos para Confirmación de Pago
          </h4>
          
          {/* Banco emisor */}
          <div className="space-y-2">
            <Label htmlFor="paymentBank">Banco emisor *</Label>
            <Select name="paymentBank" required>
              <SelectTrigger id="paymentBank">
                <SelectValue placeholder="Seleccione un banco" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.code} - {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de documento */}
          <div className="space-y-2">
            <Label htmlFor="paymentCIDocType">Tipo de documento *</Label>
            <Select name="paymentCIDocType" required>
              <SelectTrigger id="paymentCIDocType">
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V-">V-</SelectItem>
                <SelectItem value="E-">E-</SelectItem>
                <SelectItem value="J-">J-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documento afiliado */}
          <div className="space-y-2">
            <Label htmlFor="paymentCI">Documento afiliado *</Label>
            <Input
              id="paymentCI"
              name="paymentCI"
              required
              placeholder="Ej: 12345678"
            />
          </div>

          {/* Telefono afiliado */}
          <div className="space-y-2">
            <Label htmlFor="paymentPhone">Telefono afiliado *</Label>
            <Input
              id="paymentPhone"
              name="paymentPhone"
              type="tel"
              required
              placeholder="Ej: 04241234567"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
        Cancelar
      </Button>
      <Button type="submit">Confirmar Pedido</Button>
    </div>
  </form>
</DialogContent>
```

### 4.3. Actualizar `AdminSettings.tsx` - Configuración de Pagos

```tsx
<Card>
  <CardHeader>
    <CardTitle>Datos Bancarios para Pagos</CardTitle>
    <CardDescription>Información de cuenta para pagos móviles</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="paymentBank">Banco</Label>
      <Input
        id="paymentBank"
        name="paymentBank"
        placeholder="Banplus"
        defaultValue={settings?.paymentBank || ''}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="paymentCI">Documento</Label>
      <Input
        id="paymentCI"
        name="paymentCI"
        placeholder="J-503280280"
        defaultValue={settings?.paymentCI || ''}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="paymentPhone">Telefono</Label>
      <Input
        id="paymentPhone"
        name="paymentPhone"
        type="tel"
        placeholder="04245775917"
        defaultValue={settings?.paymentPhone || ''}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="paymentInstructions">Instrucciones de Pago</Label>
      <Textarea
        id="paymentInstructions"
        name="paymentInstructions"
        placeholder="IMPORTANTE: Indicar número de teléfono, banco, cédula titular del pago móvil para confirmar."
        rows={3}
        defaultValue={settings?.paymentInstructions || ''}
      />
      <p className="text-xs text-muted-foreground">
        Instrucciones que se mostrarán a los clientes al realizar el pago
      </p>
    </div>
  </CardContent>
</Card>
```

**Actualizar el handler de guardado:**

```typescript
const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  const data = {
    // ... otros campos ...
    paymentBank: (formData.get('paymentBank') as string) || undefined,
    paymentCI: (formData.get('paymentCI') as string) || undefined,
    paymentPhone: (formData.get('paymentPhone') as string) || undefined,
    paymentInstructions: (formData.get('paymentInstructions') as string) || undefined,
  };
  
  updateSettingsMutation.mutate(data);
};
```

### 4.4. Actualizar `AdminOrders.tsx` - Gestión de Pedidos

**Importaciones necesarias:**

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
```

**Agregar constante de bancos y función helper:**

```typescript
const BANKS = [
  // ... lista completa de bancos (ver sección 4.1) ...
];

const getBankName = (code: string | null | undefined): string => {
  if (!code) return code || '';
  const bank = BANKS.find(b => b.code === code);
  return bank ? bank.name : code;
};
```

**Agregar mutación para actualizar estado de pago:**

```typescript
const updatePaymentStatusMutation = useMutation({
  mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
    apiRequest(`/api/orders/${id}/payment`, { method: 'PATCH', body: { paymentStatus } }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    toast({
      title: "Estado de pago actualizado",
      description: "El estado de pago ha sido actualizado correctamente",
    });
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "No se pudo actualizar el estado de pago",
      variant: "destructive",
    });
  },
});
```

**JSX para mostrar datos de confirmación de pago en cada pedido:**

```tsx
{/* Sección de Confirmación de Pago */}
{(order.paymentBank || order.paymentCI || order.paymentPhone) && (
  <div className={`mt-4 p-4 rounded-md space-y-3 border ${
    order.paymentStatus === 'approved' 
      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
      : order.paymentStatus === 'rejected'
      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      : 'bg-muted border-border'
  }`}>
    <div className="flex items-center justify-between">
      <h4 className={`font-semibold ${
        order.paymentStatus === 'approved'
          ? 'text-green-900 dark:text-green-100'
          : order.paymentStatus === 'rejected'
          ? 'text-red-900 dark:text-red-100'
          : 'text-foreground'
      }`}>
        Datos de Confirmación de Pago
      </h4>
      <Select
        value={order.paymentStatus || 'pending'}
        onValueChange={(value) => {
          updatePaymentStatusMutation.mutate({
            id: order.id,
            paymentStatus: value,
          });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">No confirmado</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="rejected">Rechazado</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2 text-sm">
      {order.paymentBank && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Banco emisor:</span>
          <span className="font-medium">{getBankName(order.paymentBank)}</span>
        </div>
      )}
      {order.paymentCI && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Documento afiliado:</span>
          <span className="font-medium">{order.paymentCI}</span>
        </div>
      )}
      {order.paymentPhone && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Telefono afiliado:</span>
          <span className="font-medium">{order.paymentPhone}</span>
        </div>
      )}
      {order.totalInBolivares && (
        <div className={`flex justify-between pt-2 border-t ${
          order.paymentStatus === 'approved'
            ? 'border-green-200 dark:border-green-800'
            : order.paymentStatus === 'rejected'
            ? 'border-red-200 dark:border-red-800'
            : 'border-border'
        }`}>
          <span className="text-muted-foreground">Total en Bs.:</span>
          <span className={`font-bold text-lg ${
            order.paymentStatus === 'approved'
              ? 'text-green-700 dark:text-green-300'
              : order.paymentStatus === 'rejected'
              ? 'text-red-700 dark:text-red-300'
              : 'text-foreground'
          }`}>
            Bs. {parseFloat(order.totalInBolivares).toLocaleString('es-VE', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

**Paginación (opcional, para listas grandes):**

```typescript
const ITEMS_PER_PAGE = 15;
const [currentPage, setCurrentPage] = useState(1);

const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const paginatedOrders = orders.slice(startIndex, endIndex);

// En el JSX, usar paginatedOrders en lugar de orders
// Agregar controles de paginación al final de la lista
```

---

## 5. Lista de Bancos Venezolanos

Lista completa de códigos y nombres de bancos venezolanos para usar en los selects:

```typescript
const BANKS = [
  { code: '0102', name: 'BANCO DE VENEZUELA' },
  { code: '0104', name: 'BANCO VENEZOLANO DE CREDITO' },
  { code: '0105', name: 'BANCO MERCANTIL' },
  { code: '0108', name: 'BBVA PROVINCIAL' },
  { code: '0114', name: 'BANCARIBE' },
  { code: '0115', name: 'BANCO EXTERIOR' },
  { code: '0128', name: 'BANCO CARONI' },
  { code: '0134', name: 'BANESCO' },
  { code: '0137', name: 'BANCO SOFITASA' },
  { code: '0138', name: 'BANCO PLAZA' },
  { code: '0146', name: 'BANGENTE' },
  { code: '0151', name: 'BANCO FONDO COMUN' },
  { code: '0156', name: '100% BANCO' },
  { code: '0157', name: 'DELSUR BANCO UNIVERSAL' },
  { code: '0163', name: 'BANCO DEL TESORO' },
  { code: '0168', name: 'BANCRECER' },
  { code: '0169', name: 'R4 BANCO MICROFINANCIERO C.A.' },
  { code: '0171', name: 'BANCO ACTIVO' },
  { code: '0172', name: 'BANCAMIGA BANCO UNIVERSAL, C.A.' },
  { code: '0173', name: 'BANCO INTERNACIONAL DE DESARROLLO' },
  { code: '0174', name: 'BANPLUS' },
  { code: '0175', name: 'BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL' },
  { code: '0177', name: 'BANFANB' },
  { code: '0178', name: 'N58 BANCO DIGITAL BANCO MICROFINANCIERO S A' },
  { code: '0191', name: 'BANCO NACIONAL DE CREDITO' },
];
```

---

## 6. Instrucciones de Implementación

### Paso 1: Ejecutar Migraciones

```bash
# Ejecutar las migraciones en orden
psql -U postgres -d fv_bodegon -f migrations/0008_add_payment_fields.sql
psql -U postgres -d fv_bodegon -f migrations/0009_add_payment_fields_to_orders.sql
psql -U postgres -d fv_bodegon -f migrations/0010_change_payment_confirmed_to_status.sql
```

O si usas Drizzle:

```bash
npx drizzle-kit push
```

### Paso 2: Actualizar el Esquema

1. Actualizar `shared/schema.ts` con los campos de pago en `siteSettings` y `orders`
2. Asegurarse de que `insertOrderSchema` incluya los nuevos campos

### Paso 3: Actualizar el Backend

1. Actualizar `server/storage.ts` (interfaz y MemStorage)
2. Actualizar `server/storage-pg.ts` (PostgreSQL)
3. Agregar endpoint `PATCH /api/orders/:id/payment` en `server/routes.ts`
4. Verificar que `POST /api/orders` acepte los nuevos campos

### Paso 4: Actualizar el Frontend

1. Agregar lista de bancos y función `getBankName` en `ShoppingCart.tsx` y `AdminOrders.tsx`
2. Actualizar formulario de checkout en `ShoppingCart.tsx`:
   - Agregar cálculo de `totalInBolivares`
   - Agregar campos de confirmación de pago
   - Actualizar layout a dos columnas
   - Concatenar tipo de documento con número
3. Actualizar `AdminSettings.tsx` para configurar datos bancarios
4. Actualizar `AdminOrders.tsx` para mostrar y gestionar estados de pago

### Paso 5: Verificar Funcionalidad

1. **Configurar datos bancarios:**
   - Ir a `/admin` → Configuración
   - Llenar "Datos Bancarios para Pagos"
   - Guardar

2. **Probar checkout:**
   - Agregar productos al carrito
   - Ir a checkout
   - Verificar que se muestren los datos bancarios
   - Completar formulario con datos de confirmación de pago
   - Enviar pedido

3. **Verificar en admin:**
   - Ir a `/admin` → Pedidos
   - Verificar que se muestren los datos de pago
   - Cambiar estado de pago (Aprobado/Rechazado/No confirmado)
   - Verificar colores condicionales

### Paso 6: Dependencias Necesarias

Asegúrate de tener estos componentes UI disponibles:

- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Input`, `Label`, `Textarea`
- `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Badge` (para estados)

Y estos hooks/contextos:

- `useDollarRate` (para conversión a bolívares)
- `useQuery`, `useMutation` (React Query)

---

## 📝 Notas Importantes

1. **Conversión a Bolívares:** El sistema requiere un contexto o hook `useDollarRate` que proporcione la función `convertToBolivares()`. Asegúrate de tenerlo implementado.

2. **Validación:** El backend valida que `paymentStatus` sea uno de: `'pending'`, `'approved'`, `'rejected'`.

3. **Tipo de Documento:** El sistema concatena el tipo (V-, E-, J-) con el número de documento antes de guardarlo.

4. **Colores Condicionales:** 
   - Verde: Pago aprobado
   - Rojo: Pago rechazado
   - Sin color especial: Pendiente

5. **Paginación:** La paginación en `AdminOrders` es opcional pero recomendada para listas grandes.

---

## ✅ Checklist de Implementación

- [ ] Migraciones ejecutadas
- [ ] Esquema actualizado (`siteSettings` y `orders`)
- [ ] Backend actualizado (storage, routes)
- [ ] Frontend actualizado (ShoppingCart, AdminSettings, AdminOrders)
- [ ] Lista de bancos agregada
- [ ] Función `getBankName` implementada
- [ ] Conversión a bolívares funcionando
- [ ] Formulario de checkout con dos columnas
- [ ] Datos bancarios configurados en admin
- [ ] Estados de pago funcionando
- [ ] Colores condicionales aplicados
- [ ] Pruebas realizadas

---

**Fecha de creación:** 2025-01-27  
**Última actualización:** 2025-01-27


