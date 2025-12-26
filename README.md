# Strata Trader

Bot de trading de criptomonedas con análisis técnico automatizado y gestión de riesgos.

## 🎯 Descripción

Strata Trader es una aplicación de trading automatizado para criptomonedas que utiliza análisis técnico para identificar oportunidades de trading basadas en:
- Puntos de soporte y resistencia
- Divergencias alcistas y bajistas
- Gestión automática de stop loss y take profit
- Sistema de alertas y órdenes supervisadas

## 🏗️ Arquitectura

El proyecto está dividido en dos módulos principales:

### Backend (NestJS)
- API RESTful para gestión de trading
- Cálculo de indicadores técnicos
- Integración con BingX API
- Motor de backtesting
- Base de datos MongoDB (futuro)

### Frontend (Angular)
- Interfaz de usuario con PrimeNG
- Estilos con Tailwind CSS
- Visualización de datos en tiempo real
- Panel de control de órdenes
- Sistema de alertas

## 📋 Funcionalidades

### ✅ Fase 1: Infraestructura Base (Completa)
- ✅ Integración con BingX API
- ✅ Market data service con caché inteligente
- ✅ Dashboard con precios en vivo
- ✅ REST API endpoints para datos de mercado

### ✅ Fase 2: Soporte y Resistencia (Completa)
- ✅ Calculador de Pivot Points (Standard, Fibonacci, Camarilla)
- ✅ Calculador de Swing Levels (highs/lows con agrupación)
- ✅ Calculador de Volume Profile (POC, VAH, VAL)
- ✅ Sistema de scoring de fortaleza (0-100)
- ✅ Detección de confluencia entre métodos
- ✅ API REST completa con 6 endpoints
- ✅ Viewer interactivo con filtros
- ✅ Análisis multi-timeframe

### 🚧 Próximas Fases
- ⏳ Fase 3: Detección de divergencias (RSI, MACD)
- ⏳ Fase 4: Gestión de órdenes con risk management
- ⏳ Fase 5: Sistema de alertas
- ⏳ Fase 6: Backtesting de estrategias

## 🚀 Inicio Rápido

### Requisitos
- Node.js >= 18.x
- npm >= 9.x
- MongoDB (opcional, para persistencia)

### Instalación Completa

```bash
# Clonar repositorio
git clone <repo-url>
cd strata-trader

# Backend
cd backend
cp .env.example .env
# Configurar BINGX_API_KEY y BINGX_SECRET_KEY en .env
npm install
npm run start:dev
# Backend corriendo en http://localhost:3000

# Frontend (en otra terminal)
cd ../frontend
npm install
npm start
# Frontend corriendo en http://localhost:4200
```

### Acceder a la Aplicación

- **Dashboard**: http://localhost:4200/dashboard
  - Precios en vivo de criptomonedas
  - Niveles S/R cercanos de BTC-USDT

- **Levels Viewer**: http://localhost:4200/levels
  - Vista completa de niveles S/R
  - Filtros por símbolo, timeframe y fortaleza
  - Análisis de fortaleza por categorías

### API Backend

El backend expone una API REST en `http://localhost:3000/api`:

```bash
# Obtener niveles S/R de BTC-USDT
curl http://localhost:3000/api/levels/BTC-USDT?timeframe=1h

# Ver todos los endpoints disponibles
curl http://localhost:3000/api/market/symbols
```

Ver [documentación completa de la API](doc/backend/SUPPORT_RESISTANCE.md#api-endpoints) para todos los endpoints.

## 📚 Documentación

La documentación completa del proyecto se encuentra en el directorio `/doc`:

### Documentación General
- [Visión General](doc/OVERVIEW.md)
- [Arquitectura](doc/ARCHITECTURE.md)
- [Funcionalidades](doc/FEATURES.md)
- [Roadmap](doc/ROADMAP.md)
- [Quick Start](QUICK_START.md)

### Documentación Técnica
- **Backend**:
  - [Módulos Backend](doc/backend/MODULES.md)
  - [Support & Resistance](doc/backend/SUPPORT_RESISTANCE.md) 🆕
- **Frontend**:
  - [Componentes Frontend](doc/frontend/COMPONENTS.md)
  - [Levels Viewer](doc/frontend/LEVELS_VIEWER.md) 🆕
- **Trading**:
  - [Estrategia de Trading](doc/trading/STRATEGY.md)

### Resúmenes por Fase
- [Fase 2 - Resumen Ejecutivo](doc/PHASE2_SUMMARY.md) 🆕

## 🔑 Configuración

### BingX API
El proyecto utiliza la plataforma BingX con créditos de prueba (VST). Configura tus credenciales en el archivo `.env`:

```env
BINGX_API_KEY=tu_api_key
BINGX_SECRET_KEY=tu_secret_key
BINGX_TESTNET=true
```

## 🧪 Testing

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## 🚀 Deployment

### Quick Deploy

**Backend (Render):**
1. Push código a GitHub
2. Conecta con Render
3. Configura variables de entorno
4. Deploy automático

**Frontend (Vercel):**
1. Actualiza API URL en `frontend/src/environments/environment.production.ts`
2. Push a GitHub
3. Conecta con Vercel
4. Deploy automático

**Guía Completa:** Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas paso a paso.

### Verificar antes de desplegar

```bash
./scripts/verify-deployment.sh
```

## 📝 Licencia

Privado - Todos los derechos reservados

## 🤝 Contribución

Proyecto en desarrollo activo.
