# Guía de Despliegue - StrataTrader v1

## Frontend (Vercel)

### 1. Configurar URL del Backend

Edita el archivo: `frontend/src/environments/environment.production.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://TU-APP-BACKEND.onrender.com/api' // ← Cambia esto
};
```

### 2. Desplegar en Vercel

1. Conecta tu repositorio GitHub a Vercel
2. Configura el proyecto:
   - **Framework Preset**: Angular
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend`

3. Variables de entorno en Vercel (opcional):
   - No es necesario agregar variables de entorno si editaste el archivo `environment.production.ts`

4. Despliega automáticamente con cada push a la rama `main`

### 3. Verificar Despliegue

1. Abre tu URL de Vercel: `https://tu-app.vercel.app`
2. Verifica que la aplicación cargue correctamente
3. Prueba cargar el precio actual (debe conectarse al backend de Render)

---

## Backend (Render)

### 1. Configurar Variables de Entorno en Render

En el dashboard de Render, agrega estas variables:

```
NODE_ENV=production
PORT=3000
BINGX_API_KEY=tu_api_key
BINGX_API_SECRET=tu_api_secret
```

### 2. Configurar CORS

El backend ya está configurado para aceptar peticiones desde cualquier origen en `src/main.ts`:

```typescript
app.enableCors({
  origin: '*', // En producción considera limitarlo a tu dominio de Vercel
  credentials: true,
});
```

**Para mayor seguridad**, puedes cambiar `origin: '*'` por:

```typescript
origin: 'https://tu-app.vercel.app'
```

### 3. Desplegar en Render

1. Conecta tu repositorio GitHub a Render
2. Configura el servicio:
   - **Environment**: Node
   - **Region**: Oregon (US West) o el más cercano
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

3. Despliega automáticamente con cada push

### 4. Verificar Backend

URL de tu backend: `https://tu-app-backend.onrender.com`

Prueba estos endpoints:
```bash
# Health check
curl https://tu-app-backend.onrender.com/api/health

# Obtener precio BTC
curl https://tu-app-backend.onrender.com/api/market/ticker/BTCUSDT
```

---

## Desarrollo Local

### Frontend
```bash
cd frontend
npm install
npm start
# Abre http://localhost:4200
```

El proxy redirigirá `/api` → `http://localhost:3000`

### Backend
```bash
cd backend
npm install
npm run start:dev
# Servidor en http://localhost:3000
```

---

## Estructura de URLs

### Desarrollo Local
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- API Calls: `/api/*` → proxy → `http://localhost:3000/api/*`

### Producción
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-app-backend.onrender.com`
- API Calls: `https://tu-app-backend.onrender.com/api/*`

---

## Troubleshooting

### Error de CORS
Si ves errores de CORS en producción:
1. Verifica que el backend tenga `enableCors()` configurado
2. Revisa que la URL en `environment.production.ts` sea correcta

### Error 404 en rutas de Angular
Si al recargar una ruta obtienes 404:
1. Verifica que `vercel.json` esté en la raíz de `frontend/`
2. El archivo debe tener la configuración de rewrites

### Backend no responde
1. Verifica que el servicio de Render esté activo
2. Revisa los logs en el dashboard de Render
3. Verifica las variables de entorno

---

## Checklist de Despliegue

Backend (Render):
- [ ] Repositorio conectado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Endpoint `/api/health` responde

Frontend (Vercel):
- [ ] URL del backend configurada en `environment.production.ts`
- [ ] `vercel.json` presente
- [ ] Repositorio conectado
- [ ] Build exitoso
- [ ] Aplicación carga correctamente
- [ ] Llamadas API funcionan
