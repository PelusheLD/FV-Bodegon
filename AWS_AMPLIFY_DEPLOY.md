# Guía de Despliegue en AWS Amplify

Esta guía te ayudará a desplegar el sistema FV Bodegon en AWS Amplify.

## 📋 Arquitectura del Despliegue

Para este proyecto, necesitarás desplegar **3 componentes principales**:

1. **Frontend (React/Vite)** → AWS Amplify
2. **Backend (Express/Node.js)** → AWS Elastic Beanstalk o AWS Lambda
3. **Base de Datos (PostgreSQL)** → AWS RDS

---

## 🚀 Paso 1: Desplegar el Frontend en AWS Amplify

### 1.1 Preparar el Repositorio

✅ El archivo `amplify.yml` ya está creado y configurado para el proyecto.

### 1.2 Conectar con AWS Amplify

1. **Abre la consola de AWS Amplify**:
   - Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Asegúrate de estar en la región correcta (recomendado: us-east-1 o us-east-2)

2. **Conecta tu repositorio de GitHub**:
   - Click en **"New app"** → **"Host web app"**
   - Selecciona **"GitHub"** como proveedor
   - Autoriza AWS Amplify a acceder a tu GitHub
   - Selecciona el repositorio: `PelusheLD/FV-Bodegon-aws`
   - Selecciona la rama: `main`

3. **Configura el build**:
   - AWS Amplify detectará automáticamente el archivo `amplify.yml`
   - Si no lo detecta, verifica que el archivo esté en la raíz del repositorio

4. **Configura las Variables de Entorno**:
   - En la sección **"Environment variables"**, agrega:
     ```
     VITE_API_URL=https://tu-backend-url.aws.com
     ```
   - ⚠️ **Nota**: Por ahora deja una URL temporal. La actualizarás después de desplegar el backend.

5. **Revisa la configuración de Build**:
   - **Build command**: `npm ci && npm run build` (ya está en amplify.yml)
   - **Output directory**: `dist/public` (ya está en amplify.yml)

6. **Guarda y despliega**:
   - Click en **"Save and deploy"**
   - Espera a que termine el build (5-10 minutos)

### 1.3 Obtener la URL del Frontend

Una vez desplegado, obtendrás una URL como:
```
https://main.xxxxxxxxxxxxx.amplifyapp.com
```

**Guarda esta URL** porque la necesitarás para configurar CORS en el backend.

---

## 🖥️ Paso 2: Configurar Base de Datos PostgreSQL en AWS RDS

### 2.1 Crear una instancia de RDS

1. **Abre la consola de AWS RDS**:
   - Ve a [AWS RDS Console](https://console.aws.amazon.com/rds/)

2. **Crear base de datos**:
   - Click en **"Create database"**
   - Selecciona **"Standard create"** ⚠️ **NO uses "Easy create"** (te llevará a Aurora)
   - **Engine type**: PostgreSQL ⚠️ **NO selecciones Aurora PostgreSQL** (es mucho más caro)
   - **Version**: 15.x o 14.x (recomendado)
   - **Template**: 
     - ✅ **"Test environment"** (recomendado para empezar) - Usa free tier, más económico
     - ⚠️ "Development and testing" - También económico, pero puede no usar free tier
     - ❌ "Production" - Más caro, tiene alta disponibilidad y características premium

3. **Configuración básica**:
   - **DB instance identifier**: `fv-bodegon-db`
   - **Master username**: `postgres` (o el que prefieras)
   - **Master password**: ⚠️ **Genera una contraseña segura y guárdala**

4. **Configuración de instancia** ⚠️ **IMPORTANTE - Aquí es donde ahorras dinero**:
   - **DB instance class**: 
     - **Free tier**: `db.t3.micro` o `db.t4g.micro` (Gratis por 12 meses)
     - **Producción pequeña**: `db.t3.small` (~$15/mes)
     - **NO selecciones**: `db.r6g`, `db.r5`, o cualquier instancia con "r" (son caras)
   - **Storage**: 
     - **Free tier**: 20 GB incluidos gratis
     - **Producción**: 20-50 GB según necesites (~$0.10/GB/mes)
   - **Storage type**: `gp3` (General Purpose SSD) - más económico
   - **Storage autoscaling**: Opcional, solo si realmente lo necesitas

5. **Conectividad**:
   - **VPC**: Selecciona una VPC existente o crea una nueva
   - **Subnet group**: Selecciona el grupo de subnets por defecto
   - **Public access**: **Yes** (para que el backend pueda conectarse)
   - **VPC security group**: Crea uno nuevo llamado `fv-bodegon-db-sg`
   - **Availability Zone**: No preference (o selecciona una específica)

6. **Configuración de base de datos**:
   - **Initial database name**: `fv_bodegon`
   - **Database port**: `5432` (puerto por defecto de PostgreSQL)

7. **Autenticación**: PostgreSQL native authentication

8. **Revisa y crea**:
   - Click en **"Create database"**
   - Espera 5-10 minutos a que esté disponible

### 2.2 Configurar Security Group para RDS

1. **Ve a EC2 → Security Groups**
2. **Selecciona el security group** `fv-bodegon-db-sg`
3. **Edit inbound rules**:
   - **Type**: PostgreSQL (selecciona de la lista)
   - **Protocol**: TCP (automático)
   - **Port range**: 5432 (automático)
   - **Source**: 
     - ✅ **Para desarrollo/pruebas iniciales**: `0.0.0.0/0` (Anywhere - IPv4)
       - ⚠️ **Advertencia**: Esto permite acceso desde cualquier IP. Es inseguro para producción pero útil para pruebas.
     - 🔒 **Para producción**: Selecciona el security group del backend de Elastic Beanstalk
       - Esto es más seguro porque solo permite acceso desde tu backend
   - **Description** (opcional): "Allow PostgreSQL from backend" o "Temporary - allow from anywhere"
   - Click en **"Save rules"**

⚠️ **Nota sobre seguridad**: 
- La advertencia amarilla que verás es normal con `0.0.0.0/0`
- Para pruebas iniciales, está bien dejarlo así para verificar que todo funciona
- **Una vez que tengas el backend desplegado**, actualiza esto para usar solo el security group del backend (más seguro)

### 2.3 Obtener la URL de conexión

1. En la consola de RDS, ve a tu instancia
2. Copia el **Endpoint** (ejemplo: `fv-bodegon-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com`)
3. La **DATABASE_URL** será:
   ```
   postgresql://postgres:TU_PASSWORD@fv-bodegon-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/fv_bodegon
   ```
   ⚠️ **Reemplaza `TU_PASSWORD` con la contraseña que configuraste**

---

## 🔧 Paso 3: Desplegar el Backend

Tienes **2 opciones** para desplegar el backend:

### Opción A: AWS Elastic Beanstalk (Recomendado - Más fácil)

#### 3.1 Preparar el backend para Elastic Beanstalk

El backend ya está preparado, pero necesitamos crear un archivo de configuración:

1. **Crear `Procfile`** (si no existe):
   ```
   web: node dist/index.js
   ```

2. **Actualizar el puerto**:
   - Elastic Beanstalk usa la variable de entorno `PORT`
   - Asegúrate de que `server/index.ts` lea `process.env.PORT`

#### 3.2 Desplegar en Elastic Beanstalk

1. **Abre la consola de AWS Elastic Beanstalk**:
   - Ve a [AWS Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/)

2. **Crear aplicación**:
   - Click en **"Create application"**
   - **Application name**: `fv-bodegon`
   - **Description**: `FV Bodegon Backend`

3. **Crear entorno**:
   - **Environment tier**: 
     - ✅ **"Web server environment"** (seleccionado por defecto) - ✅ **Esta es la correcta**
     - ❌ **"Worker environment"** - NO uses esta (es para tareas en segundo plano)
   - **Environment name**: `fv-bodegon-backend-prod` 
     - ✅ Ya está prellenado correctamente
     - Debe tener entre 4-40 caracteres, solo letras, números y guiones
   - **Domain**:
     - ✅ **Déjalo en blanco** (dejará autogenerar el valor)
     - El dominio completo será: `fv-bodegon-backend-prod.us-east-2.elasticbeanstalk.com`
     - O puedes personalizarlo si lo deseas (debe ser único)
   - **Environment description** (opcional):
     - Puedes agregar una descripción como "Backend para FV Bodegon" o dejarlo vacío
   - **Platform**: Node.js
   - **Platform branch**: Node.js 20 running on 64bit Amazon Linux 2
   - **Platform version**: Latest

4. **Código de la aplicación**:
   - Selecciona **"Upload your code"** ✅ (ya está seleccionado)
   - **Version label**: 
     - ⚠️ **Este campo es obligatorio** (está marcado en rojo)
     - Ejemplos: `v1.0.0`, `backend-2024-01-15`, `fv-bodegon-v1`
     - Debe ser único para cada versión que subas
   - **Source code origin**: 
     - Selecciona **"Local file"** ✅ (ya está seleccionado)
   - **Crear archivo ZIP**:
     - ⚠️ **El archivo debe ser menor a 500 MB**
     - Incluye estos archivos y carpetas:
       - `package.json`
       - `package-lock.json`
       - Carpeta `server/` (completa)
       - Carpeta `shared/` (completa)
       - Carpeta `migrations/` (completa)
       - Carpeta `public/` (si existe y tiene archivos)
       - Archivo `tsconfig.json`
       - Archivo `Procfile` (ya creado)
       - Archivo `.npmrc` (si existe)
   
   ⚠️ **NO incluyas**:
   - `node_modules/` (se instalarán en el servidor)
   - `client/` (no se necesita en el backend)
   - `dist/` (se generará durante el build)
   - `.git/` (no es necesario)
   - Archivos de documentación (`.md`)
   
   **Click en "Choose file"** y selecciona tu archivo ZIP

5. **Configurar acceso del servicio (Service access)** ⚠️ **OBLIGATORIO**:
   
   En este paso necesitas configurar **2 roles IAM** (ambos son obligatorios):
   
   #### 5.1 Service role (Rol de servicio)
   
   Este rol permite que Elastic Beanstalk gestione recursos en tu nombre.
   
   **Opción A: Crear automáticamente (Recomendado)**:
   1. Click en el botón **"Create role [🔗]"** junto al dropdown de "Service role"
   2. Se abrirá una nueva pestaña en IAM
   3. **Role name**: `aws-elasticbeanstalk-service-role` (o déjalo por defecto)
   4. **Trusted entity type**: AWS service
   5. **Use case**: Elastic Beanstalk
   6. Click en **"Next"**
   7. **Permissions**: 
      - ✅ AWS ya seleccionará automáticamente las políticas necesarias:
        - `AWSElasticBeanstalkEnhancedHealth`
        - `AWSElasticBeanstalkService`
      - No necesitas agregar más políticas
   8. Click en **"Next"**
   9. **Review and create**: Click en **"Create role"**
   10. **Vuelve a la pestaña de Elastic Beanstalk**
   11. Click en el ícono de **refresh (🔄)** junto al dropdown
   12. Selecciona el rol que acabas de crear: `aws-elasticbeanstalk-service-role`
   
   **Opción B: Si ya tienes un rol**:
   - Click en el ícono de **refresh (🔄)** para actualizar la lista
   - Selecciona un rol existente que tenga las políticas necesarias
   
   #### 5.2 EC2 instance profile (Perfil de instancia EC2)
   
   Este perfil permite que las instancias EC2 ejecuten tu aplicación.
   
   **Opción A: Crear automáticamente (Recomendado)**:
   1. Click en el botón **"Create role [🔗]"** junto al dropdown de "EC2 instance profile"
   2. Se abrirá una nueva pestaña en IAM
   3. **Role name**: `aws-elasticbeanstalk-ec2-role` (o déjalo por defecto)
   4. **Trusted entity type**: AWS service
   5. **Use case**: EC2
   6. Click en **"Next"**
   7. **Permissions**:
      - ✅ AWS ya seleccionará automáticamente las políticas necesarias:
        - `AWSElasticBeanstalkWebTier`
        - `AWSElasticBeanstalkWorkerTier`
        - `AWSElasticBeanstalkMulticontainerDocker`
      - O puedes buscar y agregar manualmente: `AWSElasticBeanstalkWebTier`
   8. Click en **"Next"**
   9. **Review and create**: Click en **"Create role"**
   10. **Vuelve a la pestaña de Elastic Beanstalk**
   11. Click en el ícono de **refresh (🔄)** junto al dropdown
   12. Selecciona el perfil que acabas de crear: `aws-elasticbeanstalk-ec2-role`
   
   **Opción B: Si ya tienes un perfil**:
   - Click en el ícono de **refresh (🔄)** para actualizar la lista
   - Selecciona un perfil existente que tenga las políticas necesarias
   
   #### 5.3 EC2 key pair (Opcional)
   
   Este campo es **opcional**. Te permite conectarte por SSH a las instancias EC2.
   
   - Si quieres conectarte por SSH: Selecciona un key pair existente o crea uno nuevo en EC2
   - Si no necesitas SSH: Déjalo en blanco (no afecta el despliegue)
   
   ⚠️ **IMPORTANTE**: 
   - Ambos roles (Service role y EC2 instance profile) son **obligatorios**
   - Si no los configuras, verás errores en rojo y no podrás continuar
   - Después de crear los roles, **siempre haz refresh (🔄)** para que aparezcan en el dropdown
   
   **Una vez configurados ambos roles, haz click en "Next"** para continuar.

6. **Configurar variables de entorno**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:TU_PASSWORD@fv-bodegon-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/fv_bodegon
   SESSION_SECRET=genera-un-secreto-seguro-aqui
   PORT=8080
   ```
   
   ⚠️ **Nota**: Si no ves este paso ahora, podrás configurarlo después en la configuración del entorno.

7. **Revisar y crear**:
   - Click en **"Next"** hasta llegar al paso de **"Review"**
   - Revisa toda la configuración
   - Click en **"Create environment"**
   - Espera 5-10 minutos mientras se despliega

8. **Obtener la URL del backend**:
   - Una vez desplegado, obtendrás una URL como:
     ```
     http://fv-bodegon-backend-prod.xxxxxxxxxxxxx.us-east-1.elasticbeanstalk.com
     ```

### Opción B: AWS Lambda + API Gateway (Avanzado)

Si prefieres usar Lambda, necesitarás:
1. Convertir el servidor Express a funciones Lambda
2. Configurar API Gateway
3. Usar un adaptador como `serverless-http`

**Esta opción es más compleja y requiere cambios significativos en el código.**

---

## 🔗 Paso 4: Actualizar Configuraciones

### 4.1 Actualizar CORS en el Backend

1. **Edita `server/index.ts`**:
   - Agrega la URL de Amplify a la lista de orígenes permitidos:
   ```typescript
   origin: [
     'http://localhost:5173',
     'https://fv-bodegon-frontend.onrender.com',
     'https://fv-bodegon.onrender.com',
     'https://fv-bodegon.vercel.app',
     'https://main.xxxxxxxxxxxxx.amplifyapp.com', // ⬅️ Agrega tu URL de Amplify aquí
   ],
   ```

2. **Haz commit y push**:
   ```bash
   git add server/index.ts
   git commit -m "Add Amplify URL to CORS"
   git push origin main
   ```

3. **Redespliega el backend**:
   - Si usas Elastic Beanstalk, sube un nuevo ZIP o usa CI/CD

### 4.2 Actualizar Variable de Entorno en Amplify

1. **Ve a AWS Amplify Console**
2. **Selecciona tu app**
3. **Ve a App settings → Environment variables**
4. **Actualiza `VITE_API_URL`**:
   ```
   VITE_API_URL=https://fv-bodegon-backend-prod.xxxxxxxxxxxxx.us-east-1.elasticbeanstalk.com
   ```
   ⚠️ Si tu backend tiene HTTPS, usa esa URL

5. **Redeploy**:
   - Ve a **"Redeploy this version"** o espera al siguiente commit

---

## 🗄️ Paso 5: Inicializar la Base de Datos

### 5.1 Ejecutar Migraciones

Necesitas conectarte a la base de datos y ejecutar las migraciones.

**Opción A: Desde tu máquina local** (si tienes acceso a la base de datos):

1. **Instala las dependencias**:
   ```bash
   npm ci
   ```

2. **Configura `DATABASE_URL`**:
   ```bash
   export DATABASE_URL="postgresql://postgres:TU_PASSWORD@fv-bodegon-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/fv_bodegon"
   ```

3. **Ejecuta las migraciones**:
   ```bash
   npm run db:push
   ```

4. **Ejecuta el seed** (opcional):
   ```bash
   npm run seed
   ```

**Opción B: Desde el backend desplegado**:

1. **Agrega un script de inicialización** que se ejecute al iniciar
2. O usa **SSH a la instancia de Elastic Beanstalk** y ejecuta los comandos

**Opción C: Usar AWS Systems Manager Session Manager**:

1. Conecta a la instancia EC2 del backend
2. Ejecuta los comandos de migración

---

## ✅ Paso 6: Verificar el Despliegue

1. **Accede al frontend**:
   - Ve a la URL de Amplify
   - Verifica que cargue correctamente

2. **Prueba las funcionalidades**:
   - Carga de productos
   - Carga de categorías
   - Carrito de compras
   - Login de admin

3. **Revisa los logs**:
   - **Amplify**: App settings → Logs
   - **Elastic Beanstalk**: Environment → Logs
   - **RDS**: Monitoring → Logs

---

## 🔒 Paso 7: Configuración de Seguridad

### 7.1 HTTPS para el Backend

Si usas Elastic Beanstalk, puedes configurar HTTPS:

1. **Obtén un certificado SSL**:
   - Usa AWS Certificate Manager (ACM)
   - Solicita un certificado para tu dominio

2. **Configura un Load Balancer**:
   - Elastic Beanstalk puede crear un Application Load Balancer
   - Asocia el certificado SSL al listener HTTPS

### 7.2 Variables de Entorno Seguras

- **No commits secretos**: Usa variables de entorno en AWS
- **Rotación de secretos**: Cambia `SESSION_SECRET` periódicamente
- **Secrets Manager**: Considera usar AWS Secrets Manager para `DATABASE_URL`

---

## 📊 Paso 8: Monitoreo y Optimización

### 8.1 CloudWatch

- **Métricas de Amplify**: Ve a App settings → Monitoring
- **Métricas de RDS**: Ve a Monitoring en la consola de RDS
- **Métricas de Elastic Beanstalk**: Ve a Monitoring en la consola

### 8.2 Alarmas

Configura alarmas para:
- Uso de CPU de RDS > 80%
- Espacio de almacenamiento de RDS > 80%
- Errores 5xx en el backend > 10 en 5 minutos
- Tiempo de respuesta del backend > 5 segundos

---

## 🐛 Solución de Problemas

### Frontend no se conecta al backend

1. **Verifica `VITE_API_URL`** en Amplify
2. **Verifica CORS** en el backend
3. **Revisa los logs** del backend

### Backend no se conecta a la base de datos

1. **Verifica `DATABASE_URL`** en Elastic Beanstalk
2. **Verifica Security Group** de RDS permite conexiones desde el backend
3. **Verifica que la base de datos esté en "Available"**

### Errores 404 en el frontend

1. **Verifica que `amplify.yml`** esté en la raíz
2. **Verifica `baseDirectory`** en `amplify.yml` sea `dist/public`
3. **Revisa los logs de build** en Amplify

### Migraciones fallan

1. **Verifica conectividad** a la base de datos
2. **Verifica permisos** del usuario de PostgreSQL
3. **Ejecuta migraciones manualmente** si es necesario

---

## 💰 Estimación de Costos

### ⚠️ IMPORTANTE: Evita Aurora PostgreSQL

**NO uses Amazon Aurora** - Es mucho más caro (~$550/mes para instancias pequeñas).  
**USA RDS PostgreSQL estándar** - Mucho más económico.

### Free Tier (Primeros 12 meses):

- **AWS Amplify**: 1000 minutos de build/mes gratis
- **RDS PostgreSQL db.t3.micro**: **GRATIS** (750 horas/mes, 20 GB storage)
- **RDS PostgreSQL db.t4g.micro**: **GRATIS** (750 horas/mes, 20 GB storage) - ARM, más eficiente
- **Elastic Beanstalk**: Gratis (solo pagas por EC2 que también puede estar en free tier)
- **EC2 t2.micro o t3.micro**: **GRATIS** (750 horas/mes)

**Total en Free Tier**: **$0/mes** (si solo usas servicios del free tier)

### Después del Free Tier (configuración económica):

- **AWS Amplify**: 
  - Builds: 1000 minutos gratis, luego ~$0.01/minuto
  - Hosting: Gratis para sitios estáticos
- **RDS PostgreSQL db.t3.micro**: ~$15/mes
  - O **db.t4g.micro** (ARM): ~$12/mes (más eficiente y barato)
- **Storage RDS**: ~$0.10/GB/mes (20 GB = $2/mes)
- **EC2 t3.small**: ~$15/mes (para backend)
- **Data transfer**: Primeros 100 GB gratis, luego ~$0.09/GB

**Total estimado**: **~$32-44/mes** para un sitio pequeño-mediano

### Comparación de Costos:

| Servicio | Opción Cara (Aurora) | Opción Económica (RDS estándar) |
|----------|---------------------|--------------------------------|
| Base de datos | ~$550/mes (Aurora) | ~$15-17/mes (db.t3.micro + storage) |
| Instancia | db.r6g.large | db.t3.micro o db.t4g.micro |
| **Ahorro** | - | **~$530/mes** |

### 💡 Recomendaciones para Ahorrar:

1. **Usa el Free Tier** durante los primeros 12 meses ($0/mes)
2. **db.t4g.micro** en lugar de db.t3.micro (más eficiente y barato)
3. **No habilites** características premium innecesarias:
   - Multi-AZ deployment (solo si necesitas alta disponibilidad)
   - Automated backups (usa solo si lo necesitas, incrementa costo)
   - Performance Insights (opcional, tiene costo adicional)
4. **Storage**: Empieza con 20 GB, aumenta solo si es necesario
5. **Considera servicios alternativos** para desarrollo/pruebas:
   - **Neon** (PostgreSQL serverless): Free tier generoso
   - **Supabase**: Free tier disponible
   - **Railway**: ~$5/mes incluye base de datos

### 📊 Costos Reales para Pequeño/Mediano Sitio:

**Configuración mínima** (producción pequeña):
- RDS db.t4g.micro: $12/mes
- Storage 20 GB: $2/mes
- EC2 t3.small: $15/mes
- Amplify: $0 (hosting estático gratis)
- **Total: ~$29/mes**

**Configuración de crecimiento** (si necesitas más recursos):
- RDS db.t3.small: $30/mes
- Storage 50 GB: $5/mes
- EC2 t3.medium: $30/mes
- Amplify: $0-10/mes (depende de builds)
- **Total: ~$65-75/mes**

---

## 📚 Recursos Adicionales

- [Documentación de AWS Amplify](https://docs.aws.amazon.com/amplify/)
- [Documentación de AWS Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/)
- [Documentación de AWS RDS](https://docs.aws.amazon.com/rds/)
- [Guía de CORS en Express](https://expressjs.com/en/resources/middleware/cors.html)

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará desplegada en AWS con:
- ✅ Frontend en AWS Amplify
- ✅ Backend en AWS Elastic Beanstalk
- ✅ Base de datos en AWS RDS

Si tienes alguna pregunta o problema, revisa los logs o consulta la documentación de AWS.

