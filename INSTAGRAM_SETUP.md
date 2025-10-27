# Configuración de Instagram para Multimedia

Esta guía te ayudará a configurar la integración con Instagram para mostrar las últimas publicaciones en la sección de multimedia.

## 📋 Requisitos Previos

1. **Cuenta de Instagram Business**: Necesitas una cuenta de Instagram Business (no personal)
2. **Cuenta de Facebook**: Debe estar conectada a tu cuenta de Instagram Business
3. **Aplicación de Facebook**: Necesitas crear una aplicación en Facebook Developers

## 🚀 Pasos para Configurar

### 1. Crear una Aplicación en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Haz clic en "Mis Aplicaciones" → "Crear Aplicación"
3. Selecciona "Consumidor" como tipo de aplicación
4. Completa la información básica de tu aplicación

### 2. Configurar Instagram Basic Display

1. En tu aplicación, ve a "Productos" → "Instagram Basic Display"
2. Haz clic en "Configurar"
3. Agrega tu sitio web como "URI de redirección OAuth válidos":
   ```
   https://tu-dominio.com/auth/instagram/callback
   ```

### 3. Obtener el Access Token

#### Opción A: Token de Usuario (Recomendado para desarrollo)

1. Ve a "Instagram Basic Display" → "Herramientas básicas"
2. Haz clic en "Generar token"
3. Autoriza la aplicación con tu cuenta de Instagram
4. Copia el token generado

#### Opción B: Token de Aplicación (Para producción)

1. Ve a "Instagram Basic Display" → "Token de acceso de usuario"
2. Genera un token de larga duración
3. Este token dura 60 días y se puede renovar

### 4. Configurar en el Panel de Administración

1. Ve al panel de administración de tu sitio
2. Navega a "Configuración del Sitio"
3. En la sección "Redes Sociales":
   - Completa el campo "Instagram URL" con tu perfil de Instagram
   - Completa el campo "Instagram Access Token" con el token obtenido
4. Guarda los cambios

## 🔧 Configuración del Token

### Renovación del Token

Los tokens de Instagram tienen una duración limitada:

- **Token de corta duración**: 1 hora
- **Token de larga duración**: 60 días

Para renovar un token de larga duración:

```bash
curl -i -X GET "https://graph.instagram.com/refresh_access_token
  ?grant_type=ig_refresh_token
  &access_token={long-lived-access-token}"
```

### Campos Disponibles

La API de Instagram Basic Display proporciona los siguientes campos:

- `id`: ID único de la publicación
- `media_type`: Tipo de media (IMAGE, VIDEO, CAROUSEL_ALBUM)
- `media_url`: URL de la imagen/video
- `permalink`: Enlace a la publicación en Instagram
- `caption`: Descripción de la publicación
- `timestamp`: Fecha de creación
- `thumbnail_url`: URL de la miniatura (para videos)
- `like_count`: Número de "me gusta" (requiere cuenta Business/Creator)
- `comments_count`: Número de comentarios (requiere cuenta Business/Creator)

## 🎨 Características Implementadas

### Reproducción de Videos

Los videos de Instagram ahora incluyen:

- **🎬 Reproducción directa** - Click para reproducir/pausar
- **🎮 Controles personalizados** - Botones de play/pause y enlace a Instagram
- **📱 Reproducción silenciosa** - Videos se reproducen sin sonido por defecto
- **🖱️ Interacción intuitiva** - Hover para mostrar controles
- **📺 Poster automático** - Muestra thumbnail mientras carga
- **⚡ Carga optimizada** - `preload="metadata"` para mejor rendimiento

### Información Detallada de Publicaciones

La sección de multimedia ahora muestra:

- **📊 Estadísticas de Engagement**: Número de likes y comentarios con formato inteligente (1.2K, 1.5M)
- **⏰ Tiempo Relativo**: "Hace 2h", "Hace 3d", etc.
- **🎯 Indicadores Visuales**: 
  - Tipo de media (📸 imagen, 🎥 video, 📷 carrusel)
  - Nivel de engagement (🔥 alto, ⭐ medio, 👍 bajo, 📱 muy bajo)
- **💬 Caption Truncado**: Descripción limitada a 60 caracteres
- **🔗 Tooltips Informativos**: Al hacer hover sobre las estadísticas
- **🎨 Efectos Hover**: Overlay con enlace directo a Instagram

Para cambiar el número de publicaciones mostradas, modifica el parámetro `limit` en el endpoint:

```typescript
// En server/routes.ts
const response = await fetch(
  `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,caption,timestamp,thumbnail_url,like_count,comments_count&limit=4&access_token=${settings.instagramAccessToken}`
);
```

**Configuración Actual:**
- **4 publicaciones** - Muestra las últimas 4 publicaciones de Instagram
- **Grid responsive** - 1 columna en móvil, 2 en tablet, 4 en desktop
- **Tarjetas grandes** - Diseño optimizado para mejor visualización

### Personalizar el Diseño

El componente `MultimediaSection.tsx` puede ser personalizado para:

- Cambiar el número de columnas en la grilla
- Modificar los colores y estilos
- Agregar animaciones
- Cambiar el formato de fecha

## 🐛 Solución de Problemas

### Error: "Invalid Access Token"

- Verifica que el token sea válido
- Asegúrate de que el token no haya expirado
- Confirma que la aplicación tenga los permisos correctos

### Error: "Rate Limit Exceeded"

- Instagram tiene límites de API
- Implementa caché para reducir las llamadas
- Considera usar un token de aplicación en lugar de usuario

### No se Muestran Publicaciones

- Verifica que el token tenga acceso a las publicaciones
- Confirma que la cuenta tenga publicaciones públicas
- Revisa los logs del servidor para errores específicos

## 📚 Recursos Adicionales

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Developers](https://developers.facebook.com/)
- [Instagram Business](https://business.instagram.com/)

## 🔒 Consideraciones de Seguridad

1. **Nunca expongas el token** en el código del cliente
2. **Usa HTTPS** para todas las comunicaciones
3. **Implementa renovación automática** del token
4. **Monitorea el uso** de la API para evitar límites

## 📝 Notas Importantes

- Solo se muestran publicaciones públicas
- Los videos se muestran con controles de reproducción
- Las imágenes tienen efecto hover con enlace a Instagram
- El componente es responsive y se adapta a diferentes pantallas
- Se actualiza automáticamente cada 5 minutos


