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

- ✅ Detección de rangos soporte/resistencia por moneda
- ✅ Detección de divergencias alcistas/bajistas
- ✅ Backtesting de estrategias
- ✅ Visor de datos (velas, volumen, rangos)
- ✅ Creador de órdenes
- ✅ Sistema de alertas
- ✅ Historial de operaciones

## 🚀 Inicio Rápido

### Requisitos
- Node.js >= 18.x
- npm >= 9.x
- MongoDB (opcional, para persistencia)

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📚 Documentación

La documentación completa del proyecto se encuentra en el directorio `/doc`:

- [Visión General](doc/OVERVIEW.md)
- [Arquitectura](doc/ARCHITECTURE.md)
- [Funcionalidades](doc/FEATURES.md)
- [Roadmap](doc/ROADMAP.md)
- [Módulos Backend](doc/backend/MODULES.md)
- [Componentes Frontend](doc/frontend/COMPONENTS.md)
- [Estrategia de Trading](doc/trading/STRATEGY.md)

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
