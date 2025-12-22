# Módulos del Backend - Strata Trader

## 📦 Estructura de Módulos NestJS

---

## 1. 🔌 BingX Module

### Responsabilidad
Cliente para comunicación con la API de BingX.

### Estructura
```
bingx/
├── bingx.module.ts
├── bingx.service.ts
├── bingx.config.ts
├── dto/
│   ├── create-order.dto.ts
│   ├── market-data.dto.ts
│   └── account-info.dto.ts
└── interfaces/
    └── bingx-client.interface.ts
```

### Endpoints API Utilizados
- `GET /api/v1/market/getLatestPrice` - Precio actual
- `GET /api/v1/market/getHistoryCandles` - Velas históricas
- `GET /api/v1/user/balance` - Balance de cuenta
- `POST /api/v1/user/trade` - Crear orden
- `DELETE /api/v1/user/cancelOrder` - Cancelar orden
- `GET /api/v1/user/openOrders` - Órdenes abiertas

### Servicios
```typescript
@Injectable()
export class BingxService {
  // Autenticación
  private generateSignature(params: any): string;

  // Market Data
  async getSymbols(): Promise<Symbol[]>;
  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>;
  async getTicker(symbol: string): Promise<Ticker>;
  async getOrderBook(symbol: string, limit: number): Promise<OrderBook>;

  // Trading
  async createOrder(order: CreateOrderDto): Promise<Order>;
  async cancelOrder(orderId: string): Promise<void>;
  async getOpenOrders(symbol?: string): Promise<Order[]>;
  async getOrderHistory(symbol?: string): Promise<Order[]>;

  // Account
  async getBalance(): Promise<Balance>;
  async getPositions(): Promise<Position[]>;
}
```

### Configuración
```typescript
interface BingxConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  testnet: boolean;
  timeout: number;
  retryAttempts: number;
}
```

---

## 2. 📊 Market Module

### Responsabilidad
Gestión de datos de mercado y caché.

### Estructura
```
market/
├── market.module.ts
├── market.service.ts
├── market.controller.ts
├── market-cache.service.ts
├── dto/
│   └── get-candles.dto.ts
└── entities/
    ├── candle.entity.ts
    └── ticker.entity.ts
```

### API Endpoints
```
GET    /api/market/symbols              - Lista de símbolos disponibles
GET    /api/market/candles/:symbol      - Velas históricas
GET    /api/market/ticker/:symbol       - Precio y estadísticas actuales
GET    /api/market/depth/:symbol        - Libro de órdenes
GET    /api/market/trades/:symbol       - Últimos trades
```

### Servicios
```typescript
@Injectable()
export class MarketService {
  async getSymbols(): Promise<SymbolInfo[]>;
  async getCandles(params: GetCandlesDto): Promise<Candle[]>;
  async getTicker(symbol: string): Promise<Ticker>;
  async getOrderBook(symbol: string): Promise<OrderBook>;
  async subscribeToTicker(symbol: string, callback: Function): void;
}

@Injectable()
export class MarketCacheService {
  async getCachedCandles(symbol: string, interval: string): Promise<Candle[]>;
  async updateCache(symbol: string, interval: string, candles: Candle[]): Promise<void>;
  async invalidateCache(symbol: string): Promise<void>;
}
```

### Entidades
```typescript
export class Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class Ticker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}
```

---

## 3. 📈 Support-Resistance Module

### Responsabilidad
Cálculo y gestión de niveles de soporte y resistencia.

### Estructura
```
support-resistance/
├── support-resistance.module.ts
├── support-resistance.service.ts
├── support-resistance.controller.ts
├── calculators/
│   ├── base.calculator.ts
│   ├── pivot-points.calculator.ts
│   ├── swing-levels.calculator.ts
│   ├── volume-profile.calculator.ts
│   └── fibonacci.calculator.ts
├── dto/
│   ├── calculate-levels.dto.ts
│   └── level-response.dto.ts
└── entities/
    └── support-resistance-level.entity.ts
```

### API Endpoints
```
GET    /api/levels/:symbol              - Niveles calculados para símbolo
POST   /api/levels/calculate            - Calcular niveles (manual)
GET    /api/levels/strength/:symbol     - Fortaleza de niveles
GET    /api/levels/nearby/:symbol       - Niveles cercanos al precio actual
```

### Calculadores

#### Pivot Points Calculator
```typescript
export class PivotPointsCalculator {
  calculateStandard(candles: Candle[]): Level[];
  calculateFibonacci(candles: Candle[]): Level[];
  calculateCamarilla(candles: Candle[]): Level[];
}
```

#### Swing Levels Calculator
```typescript
export class SwingLevelsCalculator {
  findSwingHighs(candles: Candle[], lookback: number): Level[];
  findSwingLows(candles: Candle[], lookback: number): Level[];
  validateByTouches(levels: Level[], minTouches: number): Level[];
}
```

#### Volume Profile Calculator
```typescript
export class VolumeProfileCalculator {
  calculatePOC(candles: Candle[]): number;  // Point of Control
  calculateVAH(candles: Candle[]): number;  // Value Area High
  calculateVAL(candles: Candle[]): number;  // Value Area Low
}
```

### Servicios
```typescript
@Injectable()
export class SupportResistanceService {
  async calculateLevels(symbol: string, config: CalculateConfig): Promise<Level[]>;
  async getLevels(symbol: string, timeframe?: string): Promise<Level[]>;
  async getNearbyLevels(symbol: string, distance: number): Promise<Level[]>;
  async getLevelStrength(level: Level): Promise<number>;
  async updateLevels(symbol: string): Promise<void>;
}
```

### Entidades
```typescript
export class Level {
  id: string;
  symbol: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  timeframe: string;
  method: CalculationMethod;
  strength: number;           // 0-100
  touches: number;
  lastTouch: Date;
  status: 'ACTIVE' | 'BROKEN' | 'TESTED';
  createdAt: Date;
  updatedAt: Date;
}

export enum CalculationMethod {
  PIVOT_STANDARD = 'PIVOT_STANDARD',
  PIVOT_FIBONACCI = 'PIVOT_FIBONACCI',
  PIVOT_CAMARILLA = 'PIVOT_CAMARILLA',
  SWING_HIGH_LOW = 'SWING_HIGH_LOW',
  VOLUME_PROFILE = 'VOLUME_PROFILE',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT',
}
```

---

## 4. 📉 Divergence Module

### Responsabilidad
Detección de divergencias en indicadores técnicos.

### Estructura
```
divergence/
├── divergence.module.ts
├── divergence.service.ts
├── divergence.controller.ts
├── detectors/
│   ├── base-divergence.detector.ts
│   ├── rsi-divergence.detector.ts
│   ├── macd-divergence.detector.ts
│   └── volume-divergence.detector.ts
├── dto/
│   ├── scan-divergences.dto.ts
│   └── divergence-response.dto.ts
└── entities/
    └── divergence.entity.ts
```

### API Endpoints
```
GET    /api/divergence/scan             - Escanear todos los símbolos
GET    /api/divergence/:symbol          - Divergencias por símbolo
POST   /api/divergence/detect           - Detectar en tiempo real
GET    /api/divergence/active           - Divergencias activas
```

### Detectores

#### RSI Divergence Detector
```typescript
export class RsiDivergenceDetector extends BaseDivergenceDetector {
  detect(candles: Candle[], rsiPeriod: number): Divergence[];

  private findRegularBullish(candles: Candle[], rsi: number[]): Divergence[];
  private findRegularBearish(candles: Candle[], rsi: number[]): Divergence[];
  private findHiddenBullish(candles: Candle[], rsi: number[]): Divergence[];
  private findHiddenBearish(candles: Candle[], rsi: number[]): Divergence[];
}
```

#### MACD Divergence Detector
```typescript
export class MacdDivergenceDetector extends BaseDivergenceDetector {
  detect(candles: Candle[], config: MacdConfig): Divergence[];
}
```

### Servicios
```typescript
@Injectable()
export class DivergenceService {
  async scanAll(symbols: string[]): Promise<DivergenceResult[]>;
  async detectForSymbol(symbol: string, timeframes: string[]): Promise<Divergence[]>;
  async getActiveDivergences(): Promise<Divergence[]>;
  async scoresDivergence(divergence: Divergence): Promise<DivergenceScore>;
}
```

### Entidades
```typescript
export class Divergence {
  id: string;
  symbol: string;
  timeframe: string;
  indicator: 'RSI' | 'MACD' | 'STOCHASTIC' | 'VOLUME';
  type: 'REGULAR' | 'HIDDEN';
  direction: 'BULLISH' | 'BEARISH';
  startTime: Date;
  endTime: Date;
  priceStart: number;
  priceEnd: number;
  indicatorStart: number;
  indicatorEnd: number;
  strength: number;         // 0-100
  confidence: number;       // 0-100
  status: 'ACTIVE' | 'EXPIRED' | 'CONFIRMED';
  nearLevel?: Level;        // Si está cerca de S/R
  createdAt: Date;
}

export class DivergenceScore {
  strength: number;
  confidence: number;
  factors: {
    multiTimeframe: boolean;
    nearLevel: boolean;
    volumeConfirmation: boolean;
    multipleIndicators: boolean;
  };
}
```

---

## 5. 📝 Orders Module

### Responsabilidad
Creación, gestión y seguimiento de órdenes de trading.

### Estructura
```
orders/
├── orders.module.ts
├── orders.service.ts
├── orders.controller.ts
├── risk-manager.service.ts
├── position-manager.service.ts
├── dto/
│   ├── create-order.dto.ts
│   ├── update-order.dto.ts
│   └── order-response.dto.ts
└── entities/
    ├── order.entity.ts
    └── position.entity.ts
```

### API Endpoints
```
GET    /api/orders                      - Lista de órdenes
POST   /api/orders                      - Crear orden
GET    /api/orders/:id                  - Detalle de orden
PUT    /api/orders/:id                  - Actualizar orden
DELETE /api/orders/:id                  - Cancelar orden
GET    /api/orders/active               - Órdenes activas
GET    /api/positions                   - Posiciones abiertas
POST   /api/orders/calculate-risk       - Calcular parámetros de riesgo
```

### Servicios

#### Orders Service
```typescript
@Injectable()
export class OrdersService {
  async createOrder(dto: CreateOrderDto): Promise<Order>;
  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order>;
  async cancelOrder(id: string): Promise<void>;
  async getOrders(filter?: OrderFilter): Promise<Order[]>;
  async getOrderById(id: string): Promise<Order>;
  async executeOrder(order: Order): Promise<void>;
}
```

#### Risk Manager Service
```typescript
@Injectable()
export class RiskManagerService {
  calculatePositionSize(params: PositionSizeParams): number;
  calculateStopLoss(params: StopLossParams): number;
  calculateTakeProfit(params: TakeProfitParams): number[];
  validateLeverage(leverage: number, maxLeverage: number): boolean;
  validateRisk(order: Order, accountBalance: number): RiskValidation;

  // Parámetros sugeridos
  suggestStopLoss(symbol: string, side: 'LONG' | 'SHORT'): number;
  suggestTakeProfit(symbol: string, side: 'LONG' | 'SHORT'): number[];
  suggestLeverage(riskPercent: number, distance: number): number;
}

interface PositionSizeParams {
  accountBalance: number;
  riskPercent: number;      // 1% = 0.01
  entryPrice: number;
  stopLossPrice: number;
  leverage: number;
}

interface RiskValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskAmount: number;
  riskPercent: number;
}
```

#### Position Manager Service
```typescript
@Injectable()
export class PositionManagerService {
  async getOpenPositions(): Promise<Position[]>;
  async updatePosition(positionId: string, updates: Partial<Position>): Promise<Position>;
  async moveToBreakeven(positionId: string): Promise<void>;
  async closePartial(positionId: string, percent: number): Promise<void>;
  async closePosition(positionId: string): Promise<void>;
  async calculatePnL(position: Position): Promise<number>;
  async monitorPositions(): Promise<void>;  // Ejecutar periódicamente
}
```

### Entidades
```typescript
export class Order {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  entryPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number[];
  riskAmount: number;
  riskPercent: number;
  setup?: {
    type: string;
    divergence?: Divergence;
    level?: Level;
  };
  exchangeOrderId?: string;
  filledPrice?: number;
  filledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Position {
  id: string;
  orderId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number[];
  pnl: number;
  pnlPercent: number;
  unrealizedPnl: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: Date;
  closedAt?: Date;
  closedPrice?: number;
}
```

---

## 6. 🔔 Alerts Module

### Responsabilidad
Sistema de alertas y notificaciones.

### Estructura
```
alerts/
├── alerts.module.ts
├── alerts.service.ts
├── alerts.controller.ts
├── alert-checker.service.ts
├── notification.service.ts
├── dto/
│   ├── create-alert.dto.ts
│   └── alert-response.dto.ts
└── entities/
    └── alert.entity.ts
```

### API Endpoints
```
GET    /api/alerts                      - Lista de alertas
POST   /api/alerts                      - Crear alerta
GET    /api/alerts/:id                  - Detalle de alerta
PUT    /api/alerts/:id                  - Actualizar alerta
DELETE /api/alerts/:id                  - Eliminar alerta
GET    /api/alerts/triggered            - Alertas disparadas
POST   /api/alerts/:id/test             - Probar alerta
```

### Servicios
```typescript
@Injectable()
export class AlertsService {
  async createAlert(dto: CreateAlertDto): Promise<Alert>;
  async updateAlert(id: string, dto: UpdateAlertDto): Promise<Alert>;
  async deleteAlert(id: string): Promise<void>;
  async getAlerts(filter?: AlertFilter): Promise<Alert[]>;
  async triggerAlert(alert: Alert): Promise<void>;
}

@Injectable()
export class AlertCheckerService {
  async checkAll(): Promise<void>;  // Ejecutar periódicamente
  async checkAlert(alert: Alert): Promise<boolean>;
  private evaluateConditions(alert: Alert): Promise<boolean>;
}

@Injectable()
export class NotificationService {
  async sendInApp(userId: string, message: string): Promise<void>;
  async sendEmail(email: string, subject: string, body: string): Promise<void>;
  async sendTelegram(chatId: string, message: string): Promise<void>;
  async sendBrowserNotification(userId: string, notification: Notification): Promise<void>;
}
```

### Entidades
```typescript
export class Alert {
  id: string;
  name: string;
  symbol: string;
  type: AlertType;
  conditions: Condition[];
  actions: Action[];
  active: boolean;
  oneTime: boolean;
  cooldown?: number;        // minutos
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum AlertType {
  PRICE = 'PRICE',
  LEVEL = 'LEVEL',
  DIVERGENCE = 'DIVERGENCE',
  INDICATOR = 'INDICATOR',
  POSITION = 'POSITION',
}

export interface Condition {
  field: string;            // 'price', 'rsi', 'distance_to_level', etc.
  operator: Operator;
  value: number;
  timeframe?: string;
}

export enum Operator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUALS = '=',
  CROSSES_ABOVE = 'crosses_above',
  CROSSES_BELOW = 'crosses_below',
}

export interface Action {
  type: ActionType;
  config: any;
}

export enum ActionType {
  NOTIFICATION = 'NOTIFICATION',
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
  PREPARE_ORDER = 'PREPARE_ORDER',
  WEBHOOK = 'WEBHOOK',
}
```

---

## 7. 🧪 Backtesting Module

### Responsabilidad
Motor de backtesting y optimización de estrategias.

### Estructura
```
backtesting/
├── backtesting.module.ts
├── backtesting.service.ts
├── backtesting.controller.ts
├── simulator.service.ts
├── strategy-runner.service.ts
├── optimizer.service.ts
├── strategies/
│   ├── base.strategy.ts
│   ├── sr-bounce.strategy.ts
│   ├── divergence.strategy.ts
│   └── breakout.strategy.ts
├── dto/
│   ├── run-backtest.dto.ts
│   └── backtest-results.dto.ts
└── entities/
    ├── backtest.entity.ts
    └── backtest-trade.entity.ts
```

### API Endpoints
```
POST   /api/backtest/run                - Ejecutar backtest
GET    /api/backtest/results/:id        - Resultados de backtest
GET    /api/backtest/history            - Historial de backtests
POST   /api/backtest/optimize           - Optimizar parámetros
DELETE /api/backtest/:id                - Eliminar backtest
```

### Servicios
```typescript
@Injectable()
export class BacktestingService {
  async runBacktest(config: BacktestConfig): Promise<BacktestResults>;
  async getResults(id: string): Promise<BacktestResults>;
  async getHistory(): Promise<Backtest[]>;
  async deleteBacktest(id: string): Promise<void>;
}

@Injectable()
export class SimulatorService {
  async simulate(strategy: Strategy, candles: Candle[], config: SimConfig): Promise<Trade[]>;

  private calculateSlippage(price: number, volume: number): number;
  private calculateCommission(quantity: number, price: number): number;
  private executeEntry(trade: Trade, candle: Candle): void;
  private executeExit(trade: Trade, candle: Candle): void;
}

@Injectable()
export class OptimizerService {
  async gridSearch(strategy: Strategy, params: ParamGrid): Promise<OptimizationResults>;
  async walkForward(strategy: Strategy, config: WalkForwardConfig): Promise<WFResults>;
  async monteCarlo(strategy: Strategy, iterations: number): Promise<MCResults>;
}
```

### Estrategias Base
```typescript
export abstract class BaseStrategy {
  abstract name: string;
  abstract params: StrategyParams;

  abstract shouldEnter(candle: Candle, context: Context): Signal | null;
  abstract shouldExit(trade: Trade, candle: Candle, context: Context): boolean;
  abstract calculateStopLoss(entry: number, context: Context): number;
  abstract calculateTakeProfit(entry: number, context: Context): number[];
}

export class SRBounceStrategy extends BaseStrategy {
  // Entrada en rebote de S/R con divergencia
}

export class DivergenceStrategy extends BaseStrategy {
  // Entrada solo por divergencia confirmada
}
```

### Entidades
```typescript
export class Backtest {
  id: string;
  name: string;
  strategy: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  config: BacktestConfig;
  results: BacktestResults;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
}

export class BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  averageHoldingTime: number;
  expectancy: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
}
```

---

## 8. 📚 History Module

### Responsabilidad
Almacenamiento y análisis del historial de operaciones.

### Estructura
```
history/
├── history.module.ts
├── history.service.ts
├── history.controller.ts
├── analytics.service.ts
├── dto/
│   └── trade-filter.dto.ts
└── entities/
    ├── trade-record.entity.ts
    └── performance-metrics.entity.ts
```

### API Endpoints
```
GET    /api/history/trades              - Historial de trades
GET    /api/history/trades/:id          - Detalle de trade
GET    /api/history/metrics             - Métricas de rendimiento
GET    /api/history/export              - Exportar historial
POST   /api/history/analyze             - Análisis personalizado
```

### Servicios
```typescript
@Injectable()
export class HistoryService {
  async saveTrade(trade: TradeRecord): Promise<void>;
  async getTrades(filter: TradeFilter): Promise<TradeRecord[]>;
  async getTradeById(id: string): Promise<TradeRecord>;
  async exportTrades(format: 'CSV' | 'JSON' | 'PDF'): Promise<Buffer>;
}

@Injectable()
export class AnalyticsService {
  async calculateMetrics(period: Period): Promise<PerformanceMetrics>;
  async analyzeBySymbol(): Promise<SymbolAnalysis[]>;
  async analyzeByStrategy(): Promise<StrategyAnalysis[]>;
  async getEquityCurve(period: Period): Promise<EquityPoint[]>;
}
```

---

## 9. 🔧 Shared Module

### Responsabilidad
Servicios e indicadores compartidos entre módulos.

### Estructura
```
shared/
├── indicators/
│   ├── rsi.service.ts
│   ├── macd.service.ts
│   ├── ema.service.ts
│   ├── sma.service.ts
│   ├── bollinger-bands.service.ts
│   ├── atr.service.ts
│   └── volume.service.ts
└── utils/
    ├── math.util.ts
    ├── date.util.ts
    └── validation.util.ts
```

### Indicadores
```typescript
@Injectable()
export class RsiService {
  calculate(closes: number[], period: number = 14): number[];
}

@Injectable()
export class MacdService {
  calculate(closes: number[], fast = 12, slow = 26, signal = 9): MacdResult[];
}

@Injectable()
export class EmaService {
  calculate(values: number[], period: number): number[];
}

@Injectable()
export class AtrService {
  calculate(candles: Candle[], period: number = 14): number[];
}
```

---

## 🔄 Flujo de Datos entre Módulos

```
Market Module
    ↓ (datos de mercado)
Support-Resistance Module + Divergence Module
    ↓ (señales)
Alerts Module
    ↓ (notificaciones)
Orders Module
    ↓ (ejecución)
Position Manager
    ↓ (cierre)
History Module
```

---

## 📝 Convenciones

### Naming
- Módulos: `kebab-case` (support-resistance.module.ts)
- Clases: `PascalCase` (SupportResistanceService)
- Métodos: `camelCase` (calculateLevels)
- Constantes: `UPPER_SNAKE_CASE` (MAX_LEVERAGE)

### DTOs
- Usar `class-validator` para validación
- Prefijos: `Create`, `Update`, `Get`, `Delete`
- Sufijo: `.dto.ts`

### Entities
- Usar `class-transformer` para serialización
- Sufijo: `.entity.ts`
- Incluir `createdAt` y `updatedAt` cuando aplique

### Servicios
- Un servicio principal por módulo
- Servicios auxiliares para lógica específica
- Inyección de dependencias
- Testing unitario obligatorio
