# 🏪 FV Bodegones - Sistema de Gestión de Tienda

Sistema completo de gestión de tienda con catálogo de productos, carrito de compras, administración y conversión automática a bolívares usando la tasa oficial del dólar.

## ✨ Características Principales

- 🛒 **Carrito de Compras** con cálculo automático de IVA
- 💱 **Conversión a Bolívares** usando tasa oficial del dólar
- 📱 **Diseño Responsivo** para móviles y desktop
- 🎠 **Carrusel Dinámico** configurable desde admin
- 🔍 **Búsqueda de Productos** con paginación infinita
- 📊 **Panel de Administración** completo
- 🚫 **Modo "Ley Seca"** para categorías
- 📱 **Integración WhatsApp** para pedidos
- 🎨 **UI Moderna** con Tailwind CSS y Shadcn/ui

## 🚀 Instalación Rápida

### Prerrequisitos

Asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **PostgreSQL** (versión 14 o superior)
- **Git**

### Verificar Instalaciones

```bash
node --version    # Debe ser v18+
npm --version     # Debe ser v8+
psql --version    # Debe ser PostgreSQL 14+
git --version     # Cualquier versión reciente
```

### 1. Clonar el Repositorio

```bash
git clone https://github.com/PelusheLD/FV-Bodegon.git
cd FV-Bodegon
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos
psql -U postgres -c "CREATE DATABASE fv_bodegon;"

# Crear archivo .env
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fv_bodegon" > .env
```

### 4. Configurar Esquema de Base de Datos

```bash
# Ejecutar migraciones
npx drizzle-kit push
```

### 5. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📁 Estructura del Proyecto

```
FV-Bodegon/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   │   ├── DollarRate.tsx      # Tasa del dólar
│   │   │   ├── ProductCard.tsx     # Tarjeta de producto
│   │   │   ├── ShoppingCart.tsx    # Carrito de compras
│   │   │   └── admin/              # Componentes de admin
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Hooks personalizados
│   │   │   └── useDollarRate.ts   # Hook para tasa del dólar
│   │   ├── contexts/      # Contextos React
│   │   │   └── CurrencyContext.tsx # Contexto de moneda
│   │   └── lib/           # Utilidades
├── server/                # Backend Express
│   ├── routes.ts         # Rutas API
│   ├── storage.ts        # Interfaz de almacenamiento
│   └── storage-pg.ts     # Implementación PostgreSQL
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas Drizzle ORM
├── migrations/           # Migraciones de base de datos
└── drizzle.config.ts     # Configuración Drizzle
```

## ⚙️ Configuración Detallada

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fv_bodegon
NODE_ENV=development
PORT=5000
```

### Configuración de Base de Datos

#### Crear Usuario de Base de Datos (Opcional)

```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear usuario específico
CREATE USER fv_user WITH PASSWORD 'tu_password_seguro';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE fv_bodegon TO fv_user;

-- Salir
\q
```

#### Verificar Tablas Creadas

```bash
psql -U postgres -d fv_bodegon -c "\dt"
```

Deberías ver las siguientes tablas:
- `admin_users`
- `categories`
- `products`
- `orders`
- `order_items`
- `site_settings`

### Crear Usuario Administrador

```bash
node -e "
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/fv_bodegon';
const client = postgres(connectionString);
const db = drizzle(client);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.execute(sql\`INSERT INTO admin_users (username, email, password) VALUES ('admin', 'admin@fv.com', \${hashedPassword})\`);
  console.log('✅ Admin creado: admin@fv.com / admin123');
  await client.end();
}

createAdmin();
"
```

## 🎯 Scripts Disponibles

```bash
npm run dev          # Desarrollo (frontend + backend)
npm run build        # Build de producción
npm run start        # Ejecutar build de producción
npx drizzle-kit push # Aplicar cambios de DB
npx drizzle-kit generate # Generar migraciones
npx drizzle-kit studio # Abrir Drizzle Studio
```

## 🔧 Funcionalidades Principales

### 💱 Conversión de Moneda

- **Tasa Automática**: Obtiene la tasa oficial del dólar desde DolarAPI
- **Conversión en Tiempo Real**: Todos los precios se convierten automáticamente
- **Toggle de Moneda**: Botón para alternar entre USD y Bolívares
- **Referencias**: Muestra equivalencias cuando está en Bolívares

### 🛒 Carrito de Compras

- **Cálculo de IVA**: IVA incluido configurable (por defecto 16%)
- **Productos por Peso**: Selección de cantidad en gramos/kg
- **Desglose Detallado**: Subtotal, IVA y total
- **Integración WhatsApp**: Mensaje pre-formateado con pedido

### 🎠 Carrusel Dinámico

- **3 Slides Configurables**: Desde panel de administración
- **Contenido Personalizable**: Títulos, imágenes, fondos, botones
- **URLs Externas**: Botones pueden dirigir a páginas externas
- **Control Individual**: Activar/desactivar cada slide

### 🔍 Búsqueda Avanzada

- **Búsqueda por Categoría**: Filtra productos dentro de categorías
- **Paginación Infinita**: Carga productos mientras haces scroll
- **Debounce**: Optimiza las consultas de búsqueda
- **Backend Search**: Busca en toda la base de datos, no solo productos cargados

### 🚫 Modo "Ley Seca"

- **Control por Categoría**: Deshabilitar categorías completas
- **Indicador Visual**: Banner "LEY SECA" en categorías deshabilitadas
- **Prevención de Compra**: Productos no se pueden agregar al carrito

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté ejecutándose
sudo service postgresql start  # Linux
net start postgresql-x64-14    # Windows

# Verificar conexión
psql -U postgres -d fv_bodegon -c "SELECT 1;"
```

### Error de Puerto en Uso

```bash
# Verificar puertos disponibles
netstat -tulpn | grep :5000
netstat -tulpn | grep :5173

# Matar proceso si es necesario
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5173)
```

### Error de Dependencias

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de Migraciones

```bash
# Regenerar migraciones
rm -rf migrations/
npx drizzle-kit generate
npx drizzle-kit push
```

## 📱 Uso de la Aplicación

### Para Clientes

1. **Navegar**: Explora categorías y productos
2. **Buscar**: Usa la barra de búsqueda en categorías
3. **Agregar al Carrito**: Haz clic en productos disponibles
4. **Configurar Cantidad**: Para productos por peso, selecciona cantidad
5. **Ver Carrito**: Haz clic en el ícono del carrito
6. **Cambiar Moneda**: Usa el botón ↔ en la tasa del dólar
7. **Finalizar Compra**: Completa datos y envía por WhatsApp

### Para Administradores

1. **Acceder**: Ve a `/admin` y usa credenciales de admin
2. **Gestionar Categorías**: Crear, editar, activar/desactivar
3. **Gestionar Productos**: Agregar, editar, configurar stock
4. **Configurar Sitio**: Ajustar IVA, carrusel, información de contacto
5. **Ver Pedidos**: Revisar pedidos recibidos por WhatsApp

## 🚀 Despliegue en Producción

### Variables de Entorno de Producción

```env
DATABASE_URL=postgresql://user:password@host:5432/fv_bodegon
NODE_ENV=production
PORT=5000
```

### Build de Producción

```bash
npm run build
npm run start
```

### Consideraciones de Seguridad

- Cambiar contraseñas por defecto
- Usar HTTPS en producción
- Configurar firewall para base de datos
- Implementar rate limiting
- Usar variables de entorno seguras

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Busca en los [Issues](https://github.com/PelusheLD/FV-Bodegon/issues)
3. Crea un nuevo issue si no encuentras solución

## 🎉 Agradecimientos

- [Drizzle ORM](https://orm.drizzle.team/) - ORM para TypeScript
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [DolarAPI](https://dolarapi.com/) - API de tasa del dólar
- [React Query](https://tanstack.com/query) - Manejo de estado del servidor

---

**¡Disfruta usando FV Bodegones! 🛒✨**