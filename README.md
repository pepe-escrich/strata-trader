# StrataTrader - Clean Base Project

Aplicación de trading de criptomonedas con arquitectura limpia.

## 🏗️ Arquitectura

### Frontend (Angular 21)
- **Framework**: Angular 21 standalone components
- **Dependencias**: Solo Angular core
- **Estado**: Aplicación vacía lista para desarrollo

### Backend (NestJS)
- **Framework**: NestJS
- **Integraciones**:
  - ✅ BingX API (trading de criptomonedas)
  - ✅ MongoDB (base de datos)
- **Estado**: API base con integraciones listas

---

## 📦 Instalación

### Requisitos
- Node.js 18+
- npm 10+
- MongoDB (local o Atlas)

### Backend

```bash
cd backend
npm install
```

**Variables de entorno** (`.env`):
```env
# App
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/strata-trader

# BingX API
BINGX_API_KEY=your_api_key
BINGX_API_SECRET=your_api_secret
```

**Ejecutar**:
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm install
```

**Ejecutar**:
```bash
# Desarrollo
npm start
# Abre http://localhost:4200

# Producción
npm run build
# Output en dist/frontend/browser
```

---

## 🔌 API Endpoints Disponibles

### Health Check
```bash
GET http://localhost:3000/health
```

### BingX Integration
El módulo BingX está disponible para uso interno. Para exponerlo como API, crea un módulo que lo utilice.

---

## 📂 Estructura del Proyecto

```
strata-trader/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   └── bingx/          # Integración BingX
│   │   ├── config/             # Configuración
│   │   ├── app.module.ts       # Módulo principal
│   │   └── main.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── app.ts          # Componente raíz
    │   │   ├── app.html
    │   │   ├── app.config.ts   # Config Angular
    │   │   └── app.routes.ts   # Rutas
    │   ├── styles.scss         # Estilos globales
    │   └── main.ts
    └── package.json
```

---

## 🚀 Despliegue

### Frontend (Vercel)
1. Conecta repositorio a Vercel
2. Configuración:
   - **Framework**: Angular
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend/browser`

### Backend (Render)
1. Conecta repositorio a Render
2. Configuración:
   - **Environment**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
3. Variables de entorno:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `MONGODB_URI=tu_mongodb_uri`
   - `BINGX_API_KEY=tu_api_key`
   - `BINGX_API_SECRET=tu_api_secret`

---

## 🛠️ Desarrollo

### Agregar Funcionalidades

#### Backend (NestJS)
```bash
cd backend
nest g module features/mi-feature
nest g controller features/mi-feature
nest g service features/mi-feature
```

#### Frontend (Angular)
```bash
cd frontend
ng g c features/mi-componente --standalone
```

### Usar BingX Service

```typescript
import { BingxService } from './modules/bingx/bingx.service';

// Obtener precio
const ticker = await this.bingxService.getTicker('BTC-USDT');

// Obtener velas
const candles = await this.bingxService.getCandles('BTC-USDT', '1h', 100);
```

---

## 📊 Base de Datos

MongoDB está configurado y listo para usar. Para crear modelos:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class MiModelo {
  @Prop()
  campo: string;
}

export const MiModeloSchema = SchemaFactory.createForClass(MiModelo);
```

---

## 📝 Notas

- Frontend: Aplicación Angular limpia sin librerías UI
- Backend: Solo BingX y MongoDB configurados
- Listo para agregar funcionalidad personalizada
- Compilación exitosa garantizada

---

## 📄 Licencia

Privado - StrataTrader 2025
