# Arquitectura Técnica - Strata Trader

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        STRATA TRADER                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────────┐
│   FRONTEND (Angular) │          │   BACKEND (NestJS)       │
│                      │          │                          │
│  ┌────────────────┐  │          │  ┌────────────────────┐  │
│  │   Dashboard    │  │          │  │   Trading Engine   │  │
│  ├────────────────┤  │          │  ├────────────────────┤  │
│  │  Order Panel   │  │◄────────►│  │  Market Analysis   │  │
│  ├────────────────┤  │   REST   │  ├────────────────────┤  │
│  │   Alerts       │  │   API    │  │  Risk Manager      │  │
│  ├────────────────┤  │          │  ├────────────────────┤  │
│  │  Data Viewer   │  │          │  │  Backtesting       │  │
│  ├────────────────┤  │          │  └────────────────────┘  │
│  │  Backtesting   │  │          │           │              │
│  └────────────────┘  │          │           ▼              │
│                      │          │  ┌────────────────────┐  │
│  PrimeNG + Tailwind  │          │  │   BingX Client     │  │
└──────────────────────┘          └──┼────────────────────┼──┘
                                     │                    │
                                     ▼                    ▼
                            ┌─────────────┐      ┌──────────────┐
                            │  MongoDB    │      │  BingX API   │
                            │  (Future)   │      │  (Testnet)   │
                            └─────────────┘      └──────────────┘
```

## 🔙 Backend Architecture (NestJS)

### Estructura de Módulos

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/                    # Configuración global
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── bingx.config.ts
│   ├── modules/
│   │   ├── market/                # Datos de mercado
│   │   │   ├── market.module.ts
│   │   │   ├── market.service.ts
│   │   │   ├── market.controller.ts
│   │   │   └── dto/
│   │   ├── support-resistance/    # Cálculo S/R
│   │   │   ├── support-resistance.module.ts
│   │   │   ├── support-resistance.service.ts
│   │   │   ├── calculators/
│   │   │   │   ├── pivot-points.calculator.ts
│   │   │   │   ├── swing-levels.calculator.ts
│   │   │   │   └── volume-profile.calculator.ts
│   │   │   └── entities/
│   │   ├── divergence/            # Detección divergencias
│   │   │   ├── divergence.module.ts
│   │   │   ├── divergence.service.ts
│   │   │   ├── detectors/
│   │   │   │   ├── rsi-divergence.detector.ts
│   │   │   │   ├── macd-divergence.detector.ts
│   │   │   │   └── volume-divergence.detector.ts
│   │   │   └── entities/
│   │   ├── orders/                # Gestión de órdenes
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── risk-manager.service.ts
│   │   │   └── entities/
│   │   ├── alerts/                # Sistema de alertas
│   │   │   ├── alerts.module.ts
│   │   │   ├── alerts.service.ts
│   │   │   ├── alerts.controller.ts
│   │   │   └── entities/
│   │   ├── backtesting/           # Motor de backtesting
│   │   │   ├── backtesting.module.ts
│   │   │   ├── backtesting.service.ts
│   │   │   ├── backtesting.controller.ts
│   │   │   ├── simulator.service.ts
│   │   │   └── entities/
│   │   ├── history/               # Historial operaciones
│   │   │   ├── history.module.ts
│   │   │   ├── history.service.ts
│   │   │   ├── history.controller.ts
│   │   │   └── entities/
│   │   └── bingx/                 # Integración BingX
│   │       ├── bingx.module.ts
│   │       ├── bingx.service.ts
│   │       └── dto/
│   ├── common/                    # Utilidades comunes
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   └── shared/                    # Servicios compartidos
│       ├── indicators/            # Indicadores técnicos
│       │   ├── rsi.service.ts
│       │   ├── macd.service.ts
│       │   ├── ema.service.ts
│       │   └── volume.service.ts
│       └── utils/
└── test/
```

### Principales Servicios

#### 1. Market Service
- Obtención de datos de mercado en tiempo real
- Caché de velas (candlesticks)
- Normalización de datos

#### 2. Support-Resistance Service
- Cálculo de niveles usando múltiples algoritmos
- Actualización periódica de niveles
- Validación y fortaleza de niveles

#### 3. Divergence Service
- Detección de divergencias en múltiples indicadores
- Clasificación (alcista/bajista, regular/oculta)
- Score de confianza

#### 4. Orders Service
- Creación y gestión de órdenes
- Cálculo de parámetros (stop loss, take profit)
- Seguimiento de posiciones abiertas

#### 5. Risk Manager Service
- Cálculo de tamaño de posición
- Validación de apalancamiento
- Gestión de exposición total

#### 6. Backtesting Service
- Simulación de estrategias
- Análisis de resultados
- Optimización de parámetros

## 🎨 Frontend Architecture (Angular)

### Estructura de Componentes

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   ├── core/                      # Servicios core
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── websocket.service.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── models/
│   │   ├── shared/                    # Componentes compartidos
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   └── footer/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── shared.module.ts
│   │   ├── features/                  # Módulos de funcionalidades
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.module.ts
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── components/
│   │   │   │       ├── market-overview/
│   │   │   │       ├── active-positions/
│   │   │   │       └── recent-signals/
│   │   │   ├── orders/
│   │   │   │   ├── orders.module.ts
│   │   │   │   ├── orders-list/
│   │   │   │   ├── order-create/
│   │   │   │   └── order-detail/
│   │   │   ├── alerts/
│   │   │   │   ├── alerts.module.ts
│   │   │   │   ├── alerts-list/
│   │   │   │   └── alert-config/
│   │   │   ├── data-viewer/
│   │   │   │   ├── data-viewer.module.ts
│   │   │   │   ├── chart-view/
│   │   │   │   ├── levels-view/
│   │   │   │   └── indicators-view/
│   │   │   ├── backtesting/
│   │   │   │   ├── backtesting.module.ts
│   │   │   │   ├── test-config/
│   │   │   │   ├── test-results/
│   │   │   │   └── optimization/
│   │   │   └── history/
│   │   │       ├── history.module.ts
│   │   │       ├── trades-list/
│   │   │       └── performance-metrics/
│   │   └── styles/
│   │       ├── _variables.scss
│   │       ├── _themes.scss
│   │       └── styles.scss
│   ├── assets/
│   ├── environments/
│   └── index.html
└── tailwind.config.js
```

### Componentes Principales

#### 1. Dashboard
- Resumen de mercado
- Posiciones activas
- Señales recientes
- P&L del día

#### 2. Orders Panel
- Lista de órdenes activas
- Creador de órdenes
- Gestión de parámetros
- Ejecución manual

#### 3. Alerts
- Lista de alertas activas
- Configuración de alertas
- Historial de notificaciones

#### 4. Data Viewer
- Gráficos de velas con TradingView
- Niveles de S/R visualizados
- Indicadores técnicos
- Volumen y profundidad

#### 5. Backtesting
- Configuración de tests
- Visualización de resultados
- Comparación de estrategias
- Optimización de parámetros

## 🔌 API Endpoints

### Market
- `GET /api/market/symbols` - Lista de símbolos
- `GET /api/market/candles/:symbol` - Velas históricas
- `GET /api/market/ticker/:symbol` - Precio actual
- `GET /api/market/depth/:symbol` - Order book

### Support/Resistance
- `GET /api/levels/:symbol` - Niveles calculados
- `POST /api/levels/calculate` - Recalcular niveles
- `GET /api/levels/strength/:symbol` - Fortaleza de niveles

### Divergence
- `GET /api/divergence/scan` - Escanear divergencias
- `GET /api/divergence/:symbol` - Divergencias por símbolo
- `POST /api/divergence/detect` - Detectar en tiempo real

### Orders
- `GET /api/orders` - Lista de órdenes
- `POST /api/orders` - Crear orden
- `PUT /api/orders/:id` - Actualizar orden
- `DELETE /api/orders/:id` - Cancelar orden
- `GET /api/orders/active` - Órdenes activas

### Alerts
- `GET /api/alerts` - Lista de alertas
- `POST /api/alerts` - Crear alerta
- `PUT /api/alerts/:id` - Actualizar alerta
- `DELETE /api/alerts/:id` - Eliminar alerta

### Backtesting
- `POST /api/backtest/run` - Ejecutar backtest
- `GET /api/backtest/results/:id` - Resultados
- `GET /api/backtest/history` - Historial de tests

### History
- `GET /api/history/trades` - Historial de trades
- `GET /api/history/metrics` - Métricas de rendimiento
- `GET /api/history/export` - Exportar historial

## 🔐 Seguridad

- JWT para autenticación
- Rate limiting en API
- Validación de datos con class-validator
- Encriptación de API keys
- CORS configurado

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm start
```

### Producción
```bash
# Backend
cd backend && npm run build && npm run start:prod

# Frontend
cd frontend && npm run build
```

## 📊 Monitoreo

- Logs estructurados con Winston
- Health checks en endpoints
- Métricas de rendimiento
- Alertas de errores
