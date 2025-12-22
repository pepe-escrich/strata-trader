# 🚀 Deployment Guide - Strata Trader

Esta guía te llevará paso a paso para desplegar la aplicación en producción:
- **Backend**: Render (gratis)
- **Frontend**: Vercel (gratis)

---

## 📋 Prerequisitos

- Cuenta en [Render](https://render.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en GitHub (para conectar repositorios)
- API Keys de BingX (opcional, para testing usa modo demo)

---

## 🔙 Parte 1: Desplegar Backend en Render

### Paso 1: Preparar el Repositorio

1. Asegúrate de que tu código está en GitHub
2. Verifica que los archivos de configuración estén presentes:
   - `render.yaml` (en la raíz)
   - `backend/build.sh`

### Paso 2: Crear Servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio **strata-trader**

### Paso 3: Configurar el Servicio

**Configuración Básica:**
```
Name: strata-trader-api
Region: Frankfurt (o el más cercano)
Branch: main (o tu branch principal)
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
```

**Plan:**
- Selecciona **Free** (suficiente para empezar)

### Paso 4: Variables de Entorno

En la sección **Environment**, añade las siguientes variables:

**OBLIGATORIAS:**
```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api
```

**BingX API (Opcionales para testing):**
```bash
BINGX_API_KEY=tu_api_key_aqui
BINGX_SECRET_KEY=tu_secret_key_aqui
BINGX_BASE_URL=https://open-api.bingx.com
BINGX_TESTNET=true
```

**Trading Configuration (Con valores por defecto):**
```bash
DEFAULT_RISK_PERCENT=1
MAX_LEVERAGE=20
MAX_OPEN_POSITIONS=3
MAX_DAILY_LOSS_PERCENT=5
MARKET_UPDATE_INTERVAL=5000
CANDLE_CACHE_TTL=300000
```

**MongoDB (Opcional):**
```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/strata-trader
```

### Paso 5: Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar automáticamente
3. Espera 5-10 minutos (primera vez puede tardar más)
4. Una vez completado, verás **"Live"** en verde

### Paso 6: Verificar Deployment

Tu API estará disponible en:
```
https://strata-trader-api.onrender.com
```

**Probar endpoints:**
```bash
# Health check
curl https://strata-trader-api.onrender.com/api/health

# Get symbols
curl https://strata-trader-api.onrender.com/api/market/symbols

# Get ticker
curl https://strata-trader-api.onrender.com/api/market/ticker/BTC-USDT
```

### ⚠️ Importante sobre Render Free Tier

- El servicio se "duerme" después de 15 minutos de inactividad
- La primera request después de dormir puede tardar ~1 minuto
- Para producción considera el plan **Starter ($7/mes)** que no se duerme

---

## 🎨 Parte 2: Desplegar Frontend en Vercel

### Paso 1: Configurar Variables de Entorno

Antes de desplegar, necesitas la URL de tu backend de Render.

1. Copia la URL de tu API de Render (ej: `https://strata-trader-api.onrender.com`)
2. Actualiza el archivo `frontend/src/environments/environment.production.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://strata-trader-api.onrender.com/api',  // ← Tu URL aquí
  wsUrl: 'wss://strata-trader-api.onrender.com',
};
```

3. Haz commit y push de este cambio:
```bash
git add frontend/src/environments/environment.production.ts
git commit -m "chore: Update production API URL"
git push
```

### Paso 2: Crear Proyecto en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New"** → **"Project"**
3. Importa tu repositorio de GitHub
4. Selecciona **strata-trader**

### Paso 3: Configurar el Proyecto

**Framework Preset:** Angular
**Root Directory:** `frontend`

**Build & Development Settings:**
```
Build Command: npm run build
Output Directory: dist/frontend/browser
Install Command: npm install
```

**Environment Variables:**
No necesitas añadir variables de entorno (ya están en environment.production.ts)

### Paso 4: Desplegar

1. Click en **"Deploy"**
2. Vercel comenzará a construir automáticamente
3. Espera 3-5 minutos
4. Una vez completado, verás **"Visit"**

### Paso 5: Verificar Deployment

Tu aplicación estará disponible en:
```
https://strata-trader-xxx.vercel.app
```

(Vercel te asignará un dominio único)

### Paso 6: Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a **"Settings"** → **"Domains"**
2. Añade tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

---

## 🔧 Parte 3: Verificación Final

### Backend (Render)

1. **Health Check:**
```bash
curl https://tu-api.onrender.com/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-12-22T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

2. **Market Data:**
```bash
curl https://tu-api.onrender.com/api/market/tickers
```

### Frontend (Vercel)

1. Abre tu aplicación en el navegador: `https://tu-app.vercel.app`
2. Deberías ver el dashboard con precios en tiempo real
3. Verifica la consola del navegador (F12) - no debería haber errores CORS
4. Los precios deberían actualizarse cada 5 segundos

---

## 🐛 Troubleshooting

### Backend no inicia

**Problema:** Build falla
```
Solution:
- Verifica que todas las dependencias estén en package.json
- Revisa los logs en Render dashboard
- Asegúrate de que NODE_ENV=production
```

**Problema:** Error de MongoDB
```
Solution:
- MongoDB es opcional en Fase 1
- Si no tienes MongoDB, el backend funcionará sin él
- Los datos se almacenan en memoria (se pierden al reiniciar)
```

### Frontend no conecta con Backend

**Problema:** CORS Error
```
Solution:
1. Verifica que environment.production.ts tenga la URL correcta
2. Asegúrate de que la URL termine en /api
3. Ejemplo correcto: https://strata-trader-api.onrender.com/api
```

**Problema:** 504 Gateway Timeout
```
Solution:
- Render Free tier se duerme después de 15 min
- Espera 1 minuto para que el servicio despierte
- Refresca la página
```

### Vercel Build Falla

**Problema:** Build timeout
```
Solution:
- Verifica que el directorio root sea "frontend"
- Asegúrate de que vercel.json esté presente
- Revisa los logs en Vercel dashboard
```

---

## 🔄 Actualizaciones y Re-deployments

### Backend (Render)

Render hace auto-deploy cuando haces push a la rama principal:
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push
```

Render detectará el cambio y re-desplegará automáticamente.

**Deploy Manual:**
1. Ve a Render Dashboard
2. Selecciona tu servicio
3. Click en **"Manual Deploy"** → **"Deploy latest commit"**

### Frontend (Vercel)

Vercel también hace auto-deploy:
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push
```

**Deploy Manual:**
1. Ve a Vercel Dashboard
2. Selecciona tu proyecto
3. Click en **"Redeploy"**

---

## 📊 Monitoreo

### Render

- **Logs:** Dashboard → Logs (tiempo real)
- **Metrics:** Dashboard → Metrics (CPU, Memory)
- **Health:** https://tu-api.onrender.com/api/health

### Vercel

- **Analytics:** Dashboard → Analytics
- **Logs:** Dashboard → Deployments → Ver logs
- **Performance:** Dashboard → Speed Insights

---

## 💰 Costos

### Configuración Actual (GRATIS)

- **Render Free:**
  - 750 horas/mes
  - Se duerme tras 15 min inactividad
  - 512 MB RAM
  - Suficiente para testing y desarrollo

- **Vercel Hobby (Free):**
  - Despliegues ilimitados
  - 100 GB bandwidth
  - Ideal para aplicaciones personales

### Upgrade Recomendado para Producción

- **Render Starter:** $7/mes
  - Siempre activo (no se duerme)
  - 512 MB RAM
  - Mejor para producción

- **Vercel Pro:** $20/mes
  - Analytics avanzado
  - Mayor bandwidth
  - Dominios ilimitados

---

## 🔐 Seguridad

### Variables de Entorno Sensibles

**❌ NUNCA hagas commit de:**
- API Keys de BingX
- Secrets de MongoDB
- Tokens de autenticación

**✅ Usa siempre:**
- Variables de entorno en Render
- Variables de entorno en Vercel
- Archivos .env.local (no en git)

### CORS

El backend está configurado para aceptar:
- `localhost:4200` (desarrollo)
- `*.vercel.app` (producción)

Si necesitas añadir más orígenes, edita `backend/src/main.ts`

---

## 📝 Checklist de Deployment

### Antes de Desplegar

- [ ] Código subido a GitHub
- [ ] Variables de entorno documentadas
- [ ] Tests pasando (si los tienes)
- [ ] README actualizado

### Backend (Render)

- [ ] Servicio creado en Render
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Health check responde OK
- [ ] API endpoints funcionan

### Frontend (Vercel)

- [ ] URL del backend actualizada en environment.production.ts
- [ ] Proyecto creado en Vercel
- [ ] Build exitoso
- [ ] Aplicación carga correctamente
- [ ] No hay errores CORS
- [ ] Datos se muestran correctamente

---

## 🎉 ¡Listo!

Tu aplicación Strata Trader ahora está desplegada en producción:

- **Backend:** https://strata-trader-api.onrender.com/api
- **Frontend:** https://strata-trader-xxx.vercel.app

### Próximos Pasos

1. Configurar dominio personalizado (opcional)
2. Configurar MongoDB Atlas (opcional)
3. Añadir monitoreo con Sentry/LogRocket
4. Configurar CI/CD con GitHub Actions
5. Implementar Fase 2: Soporte/Resistencia

---

## 🆘 Ayuda

**Render:**
- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: Dashboard → Support

**Vercel:**
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com
- Support: Dashboard → Help

**Issues del Proyecto:**
- GitHub Issues: https://github.com/tu-usuario/strata-trader/issues

---

**¡Happy Deploying! 🚀**
