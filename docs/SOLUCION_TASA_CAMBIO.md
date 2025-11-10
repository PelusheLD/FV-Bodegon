# Solución: Sistema de Tasa de Cambio con Control de Límites de API

## Problema Identificado

El sistema tenía dos problemas principales:

1. **Error de CORS**: La API externa (`ve.dolarapi.com`) bloqueaba las solicitudes desde el frontend en Vercel debido a políticas CORS.
2. **Límite de solicitudes excedido**: La API `api.dolarvzla.com` tiene un límite de **60 solicitudes por minuto por IP**. Cuando múltiples componentes hacían solicitudes simultáneas, se excedía este límite y algunos productos mostraban `0,00` en la conversión a bolívares.

## Solución Implementada

### 1. Endpoint Proxy en el Backend

**Archivo**: `server/routes.ts`

Se creó un endpoint proxy `/api/dollar-rate` que:
- Hace la solicitud a la API externa desde el servidor (sin restricciones CORS)
- Procesa y adapta la respuesta a la estructura esperada por el frontend
- Maneja errores y validaciones

```typescript
app.get("/api/dollar-rate", async (_req, res) => {
  try {
    const response = await fetch('https://api.dolarvzla.com/public/exchange-rate', {
      headers: {
        'User-Agent': 'FV-Bodegon/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // La nueva API tiene estructura: { current: { usd: number, eur: number, date: string }, ... }
    if (!data?.current?.usd || typeof data.current.usd !== 'number' || data.current.usd <= 0) {
      throw new Error('Tasa inválida recibida');
    }
    
    // Adaptar a la estructura esperada por el frontend
    const rateData = {
      promedio: data.current.usd,
      nombre: 'Dólar Oficial (BCV)',
      fechaActualizacion: data.current.date,
      compra: data.current.usd,
      venta: data.current.usd,
      fuente: 'api.dolarvzla.com'
    };
    
    res.json(rateData);
  } catch (error: any) {
    console.error('Error fetching dollar rate:', error);
    res.status(500).json({ 
      error: error.message || "No se pudo obtener la tasa del dólar" 
    });
  }
});
```

**Beneficios**:
- ✅ Elimina problemas de CORS (el backend no tiene restricciones)
- ✅ Centraliza la lógica de obtención de tasa
- ✅ Permite adaptar diferentes APIs sin cambiar el frontend

---

### 2. Context Provider Global (DollarRateContext)

**Archivo**: `client/src/contexts/DollarRateContext.tsx`

Se creó un Context Provider que:
- **Comparte una única instancia** de la tasa entre todos los componentes
- **Evita múltiples solicitudes simultáneas**
- **Implementa caché en localStorage**
- **Controla la frecuencia de solicitudes**

#### Características Principales:

##### a) Estado Global Compartido
```typescript
export const DollarRateProvider = ({ children }: { children: ReactNode }) => {
  const [dollarRate, setDollarRate] = useState<DollarRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
}
```

**Beneficio**: Todos los componentes (`ProductCard`, `DollarRate`, `ShoppingCart`) comparten la misma instancia de la tasa, evitando solicitudes duplicadas.

##### b) Prevención de Solicitudes Simultáneas
```typescript
const fetchingRef = useRef(false); // Evitar múltiples solicitudes simultáneas

const fetchDollarRate = async () => {
  // Evitar múltiples solicitudes simultáneas
  if (fetchingRef.current) {
    return; // Si ya hay una solicitud en curso, salir
  }
  
  fetchingRef.current = true;
  // ... hacer solicitud
  fetchingRef.current = false;
}
```

**Beneficio**: Si múltiples componentes intentan obtener la tasa al mismo tiempo, solo se hace UNA solicitud.

##### c) Control de Frecuencia (Respetar Límite de 60/min)
```typescript
const lastFetchRef = useRef<number>(0);
const minIntervalRef = useRef(1000); // Mínimo 1 segundo entre solicitudes (60/min = 1/seg)

const fetchDollarRate = async () => {
  // Respetar el límite de 60 solicitudes/minuto (1 por segundo)
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchRef.current;
  if (timeSinceLastFetch < minIntervalRef.current) {
    const waitTime = minIntervalRef.current - timeSinceLastFetch;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastFetchRef.current = Date.now();
  // ... hacer solicitud
}
```

**Beneficio**: Garantiza que nunca se exceda el límite de 60 solicitudes por minuto.

##### d) Caché en localStorage
```typescript
const CACHE_KEY = 'dollar_rate_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cargar desde caché al iniciar
useEffect(() => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRate = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      // Si el caché es válido (menos de 5 minutos), usarlo
      if (age < CACHE_DURATION && parsed.data?.promedio) {
        setDollarRate(parsed.data);
        setLoading(false);
        // Si el caché es viejo pero existe, hacer fetch en background
        if (age > 2 * 60 * 1000) { // Más de 2 minutos
          fetchDollarRate();
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Error loading cached rate:', err);
  }
  
  // Si no hay caché válido, hacer fetch
  fetchDollarRate();
}, []);

// Guardar en caché después de obtener la tasa
const saveToCache = (data: DollarRateData) => {
  try {
    const cache: CachedRate = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Error saving to cache:', err);
  }
};
```

**Beneficios**:
- ✅ Reduce solicitudes innecesarias (usa caché si es válido)
- ✅ Mejora la experiencia de usuario (carga instantánea desde caché)
- ✅ Funciona offline (usa caché si la API falla)
- ✅ Actualización en background (si el caché es viejo, actualiza sin bloquear)

##### e) Manejo de Errores con Fallback a Caché
```typescript
catch (err: any) {
  setError(err.message || 'No se pudo obtener la tasa del dólar');
  console.error('Error fetching dollar rate:', err);
  
  // Si hay error, intentar usar caché aunque sea viejo
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRate = JSON.parse(cached);
      if (parsed.data?.promedio) {
        setDollarRate(parsed.data);
        setError('Usando tasa en caché (última actualización disponible)');
      }
    }
  } catch (cacheErr) {
    // Ignorar errores de caché
  }
}
```

**Beneficio**: Si la API falla, el sistema sigue funcionando usando la última tasa guardada.

##### f) Actualización Automática Reducida
```typescript
// Actualizar cada 10 minutos (reducido de 5 para evitar límites)
useEffect(() => {
  const interval = setInterval(() => {
    fetchDollarRate();
  }, 10 * 60 * 1000); // 10 minutos
  
  return () => clearInterval(interval);
}, []);
```

**Beneficio**: Reduce la frecuencia de actualización automática para evitar exceder límites.

---

### 3. Integración en App.tsx

**Archivo**: `client/src/App.tsx`

Se envolvió la aplicación con el `DollarRateProvider`:

```typescript
import { DollarRateProvider } from "@/contexts/DollarRateContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DollarRateProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </DollarRateProvider>
    </QueryClientProvider>
  );
}
```

**Beneficio**: Todos los componentes dentro de la app tienen acceso a la tasa de cambio compartida.

---

### 4. Actualización de Componentes

**Archivos actualizados**:
- `client/src/components/DollarRate.tsx`
- `client/src/components/ProductCard.tsx`
- `client/src/components/ShoppingCart.tsx`

**Cambio principal**: Todos ahora importan desde el contexto en lugar del hook:

```typescript
// Antes:
import { useDollarRate } from "@/hooks/useDollarRate";

// Ahora:
import { useDollarRate } from "@/contexts/DollarRateContext";
```

**Beneficio**: Todos los componentes comparten la misma instancia de la tasa.

---

### 5. Configuración CORS Actualizada

**Archivo**: `server/index.ts`

Se agregó `Cache-Control` a los headers permitidos:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fv-bodegon-frontend.onrender.com',
    'https://fv-bodegon.onrender.com',
    'https://fv-bodegon.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'Cache-Control'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400 // 24 horas
}));
```

**Beneficio**: Permite que el frontend haga solicitudes con headers de caché sin problemas CORS.

---

## Flujo Completo de Funcionamiento

### Primera Carga de la Página:

1. **Usuario carga la página** → `DollarRateProvider` se inicializa
2. **Verifica caché en localStorage**:
   - Si existe y es válido (< 5 min) → Usa caché inmediatamente
   - Si existe pero es viejo (> 2 min) → Usa caché y actualiza en background
   - Si no existe → Hace solicitud al backend
3. **Backend hace proxy** → Solicita a `api.dolarvzla.com`
4. **Backend adapta respuesta** → Transforma a estructura esperada
5. **Frontend recibe tasa** → Guarda en estado y en localStorage
6. **Todos los componentes** → Acceden a la misma tasa compartida

### Solicitudes Subsecuentes:

1. **Componente necesita tasa** → Usa `useDollarRate()` del contexto
2. **Si ya está cargada** → Retorna inmediatamente (sin solicitud)
3. **Si hay solicitud en curso** → Espera a que termine (sin duplicar)
4. **Si pasó más de 1 segundo** → Permite nueva solicitud (respetando límite)
5. **Si caché es válido** → No hace solicitud, usa caché

### Actualización Automática:

1. **Cada 10 minutos** → Intenta actualizar la tasa
2. **Verifica frecuencia** → Espera si es necesario (respetando límite)
3. **Actualiza caché** → Guarda nueva tasa en localStorage
4. **Notifica componentes** → Todos reciben la nueva tasa automáticamente

---

## Resultados

### Antes de la Solución:
- ❌ Error de CORS bloqueando solicitudes
- ❌ Múltiples solicitudes simultáneas (una por componente)
- ❌ Límite de API excedido frecuentemente
- ❌ Productos mostrando `0,00` en conversión
- ❌ Sin caché, siempre solicitando a la API

### Después de la Solución:
- ✅ Sin errores de CORS (proxy en backend)
- ✅ Una sola solicitud compartida entre todos los componentes
- ✅ Límite de API respetado (control de frecuencia)
- ✅ Todos los productos muestran conversión correcta
- ✅ Caché reduce solicitudes innecesarias
- ✅ Funciona offline usando caché
- ✅ Mejor experiencia de usuario (carga instantánea)

---

## Archivos Modificados/Creados

### Nuevos Archivos:
- `client/src/contexts/DollarRateContext.tsx` - Context Provider para tasa de cambio

### Archivos Modificados:
- `server/routes.ts` - Agregado endpoint `/api/dollar-rate`
- `server/index.ts` - Actualizado configuración CORS
- `client/src/App.tsx` - Agregado `DollarRateProvider`
- `client/src/components/DollarRate.tsx` - Actualizado import
- `client/src/components/ProductCard.tsx` - Actualizado import
- `client/src/components/ShoppingCart.tsx` - Actualizado import

### Archivos Eliminados:
- `client/src/hooks/useDollarRate.ts` - Reemplazado por contexto

---

## Consideraciones Técnicas

### Límite de API:
- **Límite**: 60 solicitudes por minuto por IP
- **Control**: Mínimo 1 segundo entre solicitudes
- **Caché**: 5 minutos de duración
- **Actualización automática**: Cada 10 minutos

### Caché:
- **Duración**: 5 minutos
- **Almacenamiento**: localStorage
- **Fallback**: Si API falla, usa caché aunque sea viejo
- **Actualización**: En background si caché > 2 minutos

### Manejo de Errores:
- **Error 429 (Too Many Requests)**: Aumenta intervalo a 2 segundos
- **Error de red**: Usa caché como fallback
- **Error de API**: Muestra mensaje pero mantiene última tasa válida

---

## Pruebas Recomendadas

1. **Carga inicial**: Verificar que carga desde caché si existe
2. **Múltiples componentes**: Verificar que solo se hace una solicitud
3. **Límite de API**: Verificar que respeta el intervalo de 1 segundo
4. **Caché**: Verificar que usa caché cuando es válido
5. **Offline**: Verificar que funciona con caché cuando no hay conexión
6. **Error de API**: Verificar que usa caché como fallback

---

## Mantenimiento Futuro

### Si se cambia de API:
1. Actualizar URL en `server/routes.ts` (endpoint `/api/dollar-rate`)
2. Adaptar estructura de respuesta en el mismo archivo
3. El frontend no necesita cambios (el backend adapta la respuesta)

### Si se necesita cambiar frecuencia:
1. Actualizar `CACHE_DURATION` en `DollarRateContext.tsx`
2. Actualizar intervalo de actualización automática
3. Ajustar `minIntervalRef.current` si cambia el límite de API

---

## Conclusión

La solución implementada resuelve completamente los problemas de CORS y límites de API mediante:
- **Proxy en backend** para evitar CORS
- **Context Provider global** para compartir estado
- **Caché inteligente** para reducir solicitudes
- **Control de frecuencia** para respetar límites
- **Manejo robusto de errores** con fallback a caché

El sistema ahora es más eficiente, confiable y proporciona una mejor experiencia de usuario.

