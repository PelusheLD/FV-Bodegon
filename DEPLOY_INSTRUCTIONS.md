# 🚀 Instrucciones de Despliegue en Render

## 📋 Orden de Creación de Servicios

### 1️⃣ **Crear Base de Datos PostgreSQL** (PRIMERO)

1. Ve a https://render.com/dashboard
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `fv-bodegon-database`
   - **Database**: `fv_bodegon`
   - **User**: `fv_bodegon_user`
   - **Region**: Elige el más cercano
   - **Plan**: Free (para empezar)
4. Click **"Create Database"**
5. **IMPORTANTE**: Guarda la **Internal Database URL** que aparece (será algo como `postgresql://...`)

---

### 2️⃣ **Crear Backend (Web Service)** (SEGUNDO)

1. Ve a https://render.com/dashboard
2. Click en **"New +"** → **"Web Service"**
3. Selecciona tu repositorio: **PelusheLD/FV-Bodegon**
4. Configura:

   **Settings:**
   - **Name**: `fv-bodegon-backend`
   - **Runtime**: Node
   - **Region**: Mismo que la base de datos
   - **Branch**: `main`
   - **Root Directory**: `./` (dejar vacío)
   
   **Build & Deploy:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   
   **Environment Variables** (Click en "Advanced"):
   ```
   NODE_ENV=production
   DATABASE_URL=<pega la Internal Database URL de la base de datos>
   SESSION_SECRET=<genera una clave secreta aleatoria>
   PORT=10000
   ```
5. Click **"Create Web Service"**
6. Espera a que se despliegue (5-10 minutos)
7. **IMPORTANTE**: Copia la URL del backend (ej: `https://fv-bodegon-backend.onrender.com`)

---

### 3️⃣ **Crear Frontend (Static Site)** (TERCERO)

1. Ve a https://render.com/dashboard
2. Click en **"New +"** → **"Static Site"**
3. Conecta tu repositorio: **PelusheLD/FV-Bodegon**
4. Configura:

   **Settings:**
   - **Name**: `fv-bodegon-frontend`
   - **Branch**: `main`
   
   **Build:**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist/public`
   
   **Environment Variables**:
   ```
   VITE_API_URL=https://fv-bodegon-backend.onrender.com
   ```
   ⚠️ **Usa la URL del backend que creaste en el paso 2**
   
5. Click **"Create Static Site"**
6. Espera a que se despliegue (3-5 minutos)

---

## ✅ Verificar que Todo Funcione

1. **Frontend**: Deberías tener una URL como `https://fv-bodegon-frontend.onrender.com`
2. **Backend**: Deberías tener una URL como `https://fv-bodegon-backend.onrender.com`
3. Prueba accediendo al frontend y verifica que:
   - Se conecta correctamente al backend
   - Las categorías cargan
   - Los productos se muestran

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correcto en el backend
- Usa la **Internal Database URL** (no la externa)

### Error: "CORS"
- El backend debe permitir requests desde el dominio del frontend
- Verifica la configuración de CORS en `server/routes.ts`

### El frontend no se conecta al backend
- Verifica que `VITE_API_URL` en el frontend apunte al backend correcto
- Asegúrate de que el backend esté "live" (no en sleep)

---

## 📝 Próximos Pasos

1. Configurar dominio personalizado (opcional)
2. Migrar datos de producción
3. Configurar backups automáticos
4. Monitorear logs y métricas

