# Funcionalidades Detalladas - Strata Trader

## 📊 1. Detección de Rangos Soporte/Resistencia

### Objetivo
Identificar niveles de precio clave donde es probable que ocurran reversiones o consolidaciones.

### Configuración
- **Símbolos**: Selección de pares a monitorear (BTC/USDT, ETH/USDT, etc.)
- **Timeframes**: Múltiples temporalidades (1m, 5m, 15m, 1h, 4h, 1d)
- **Métodos de cálculo**:
  - Pivot Points (Standard, Fibonacci, Camarilla)
  - Swing Highs/Lows
  - Volume Profile
  - Fibonacci Retracements
  - Psychological Levels

### Características
- ✅ Cálculo automático en múltiples timeframes
- ✅ Actualización en tiempo real
- ✅ Indicador de fortaleza del nivel (débil, medio, fuerte)
- ✅ Visualización en gráficos
- ✅ Alertas cuando el precio se acerca

### Parámetros Configurables
```typescript
interface SupportResistanceConfig {
  symbol: string;
  timeframes: string[];
  methods: CalculationMethod[];
  minTouches: number;        // Mínimo de toques para validar nivel
  tolerance: number;         // % de tolerancia para agrupar niveles
  lookbackPeriod: number;    // Velas hacia atrás para análisis
  updateInterval: number;    // Frecuencia de actualización (ms)
}
```

### Estados de Nivel
- **Activo**: Nivel actual sin romper
- **Roto**: Precio ha superado el nivel
- **Rechazado**: Precio rebotó en el nivel
- **En Prueba**: Precio cerca del nivel

---

## 📈 2. Detección de Divergencias

### Objetivo
Identificar discrepancias entre el movimiento del precio y los indicadores técnicos para anticipar reversiones.

### Tipos de Divergencias

#### Divergencia Regular Alcista
- Precio: Lower Lows
- Indicador: Higher Lows
- Señal: Posible reversión alcista
- Acción: Considerar LONG

#### Divergencia Regular Bajista
- Precio: Higher Highs
- Indicador: Lower Highs
- Señal: Posible reversión bajista
- Acción: Considerar SHORT

#### Divergencia Oculta Alcista
- Precio: Higher Lows
- Indicador: Lower Lows
- Señal: Continuación de tendencia alcista
- Acción: Añadir a LONG

#### Divergencia Oculta Bajista
- Precio: Lower Highs
- Indicador: Higher Highs
- Señal: Continuación de tendencia bajista
- Acción: Añadir a SHORT

### Indicadores Analizados
- **RSI** (Relative Strength Index)
- **MACD** (Moving Average Convergence Divergence)
- **Stochastic**
- **Volume**
- **OBV** (On Balance Volume)

### Sistema de Scoring
```typescript
interface DivergenceScore {
  strength: number;        // 0-100
  confidence: number;      // 0-100
  timeframe: string;
  indicator: string;
  type: 'regular' | 'hidden';
  direction: 'bullish' | 'bearish';
}
```

### Criterios de Validación
- ✅ Mínimo de divergencia en 2 indicadores
- ✅ Confirmación en múltiples timeframes
- ✅ Proximidad a nivel de S/R
- ✅ Análisis de volumen

---

## 🤖 3. Backtesting

### Objetivo
Simular estrategias con datos históricos para validar efectividad antes de operar en real.

### Características

#### Configuración de Test
- Rango de fechas
- Símbolos a probar
- Capital inicial
- Apalancamiento máximo
- Comisiones y fees
- Slippage simulado

#### Estrategias Disponibles
1. **S/R + Divergencia**: Entrada en niveles con divergencia confirmada
2. **Scalping**: Toma rápida de beneficios en niveles
3. **Swing Trading**: Operaciones a medio plazo
4. **Breakout**: Rupturas de niveles clave
5. **Custom**: Estrategias personalizadas

#### Métricas Calculadas
```typescript
interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;              // %
  totalPnL: number;             // $
  totalPnLPercent: number;      // %
  averageWin: number;           // $
  averageLoss: number;          // $
  largestWin: number;           // $
  largestLoss: number;          // $
  profitFactor: number;         // Gross profit / Gross loss
  sharpeRatio: number;
  maxDrawdown: number;          // %
  maxDrawdownDuration: number;  // días
  averageHoldingTime: number;   // horas
  expectancy: number;           // $ esperado por trade
}
```

#### Visualización
- Curva de equity
- Gráfico de drawdown
- Distribución de P&L
- Análisis por símbolo
- Análisis por timeframe
- Análisis por tipo de setup

#### Optimización
- Grid search de parámetros
- Walk-forward analysis
- Monte Carlo simulation
- Análisis de sensibilidad

---

## 📉 4. Visor de Datos

### Objetivo
Visualizar información de mercado, niveles técnicos e indicadores de forma clara y en tiempo real.

### Componentes

#### Gráfico Principal
- **Velas japonesas** con zoom y pan
- **Niveles de S/R** superpuestos
- **Zonas de divergencia** marcadas
- **Órdenes activas** visualizadas
- **Volumen** en panel inferior

#### Panel de Indicadores
- RSI con niveles 30/70
- MACD con histograma
- EMAs (20, 50, 200)
- Bollinger Bands
- ATR (Average True Range)

#### Panel de Información
```typescript
interface MarketInfo {
  symbol: string;
  price: number;
  change24h: number;        // %
  volume24h: number;        // $
  high24h: number;
  low24h: number;
  funding: number;          // Rate
  openInterest: number;     // $
  longShortRatio: number;
}
```

#### Heatmap de Niveles
- Visualización de densidad de niveles
- Fortaleza por color (verde=fuerte, amarillo=medio, rojo=débil)
- Distancia al precio actual

#### Order Book (Libro de Órdenes)
- Órdenes de compra (bids)
- Órdenes de venta (asks)
- Profundidad de mercado
- Grandes órdenes destacadas

---

## 📝 5. Creador de Órdenes

### Objetivo
Facilitar la creación de órdenes con cálculos automáticos de riesgo y parámetros óptimos.

### Tipos de Órdenes

#### Market Order (Mercado)
- Ejecución inmediata al mejor precio disponible

#### Limit Order (Límite)
- Ejecución a precio específico o mejor

#### Stop Order
- Activación al alcanzar precio de stop

#### OCO (One Cancels Other)
- Dos órdenes, al ejecutar una se cancela la otra

### Flujo de Creación

#### 1. Selección de Setup
- **Manual**: Usuario define todos los parámetros
- **Asistido**: Bot sugiere parámetros basados en análisis
- **Alerta**: Basado en una alerta generada

#### 2. Configuración Base
```typescript
interface OrderConfig {
  symbol: string;
  side: 'LONG' | 'SHORT';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  entryPrice: number;
  quantity?: number;        // Si no se especifica, se calcula por riesgo
}
```

#### 3. Gestión de Riesgo
```typescript
interface RiskManagement {
  riskPercentage: number;    // % del capital a arriesgar (ej: 1%)
  stopLossPrice: number;     // Precio de stop loss
  stopLossPercent: number;   // Distancia en %
  leverage: number;          // 1-125x
  maxLeverage: number;       // Límite configurado
}
```

#### 4. Take Profit (Objetivos)
```typescript
interface TakeProfitLevels {
  levels: {
    price: number;
    percentage: number;      // % de la posición a cerrar
    label: string;           // ej: "Scalp", "TP1", "TP2"
  }[];
  trailingStop?: {
    enabled: boolean;
    activationPrice: number;
    callbackRate: number;    // %
  };
}
```

#### 5. Confirmación
- Resumen de la orden
- Cálculo de P&L potencial
- Risk/Reward ratio
- Advertencias (apalancamiento alto, spread grande, etc.)

### Cálculos Automáticos

#### Tamaño de Posición
```typescript
// Basado en % de riesgo
positionSize = (accountBalance * riskPercent) / (entryPrice - stopLossPrice)

// Con apalancamiento
positionSize = positionSize * leverage
```

#### Stop Loss Sugerido
- Basado en ATR (Average True Range)
- Debajo/encima del nivel de S/R más cercano
- % fijo configurable
- Swing low/high reciente

#### Take Profit Sugerido
- Próximo nivel de S/R
- Fibonacci extensions
- Risk/Reward ratio mínimo (ej: 1:2)

---

## 🔔 6. Sistema de Alertas

### Objetivo
Notificar al usuario sobre oportunidades de trading y eventos importantes.

### Tipos de Alertas

#### Alertas de Precio
- Precio alcanza nivel específico
- Precio cruza media móvil
- Nuevo máximo/mínimo

#### Alertas de Nivel
- Precio se acerca a soporte/resistencia
- Nivel roto
- Nivel rechazado

#### Alertas de Divergencia
- Nueva divergencia detectada
- Divergencia confirmada en múltiples timeframes
- Divergencia + proximidad a nivel

#### Alertas de Indicadores
- RSI en sobrecompra/sobreventa
- MACD cruza línea de señal
- Volumen anormal

#### Alertas de Posiciones
- Stop loss alcanzado
- Take profit alcanzado
- Posición en breakeven
- Margen bajo

### Configuración
```typescript
interface AlertConfig {
  name: string;
  symbol: string;
  type: AlertType;
  conditions: Condition[];
  actions: Action[];
  active: boolean;
  oneTime: boolean;         // Se desactiva tras disparar
  cooldown?: number;        // Tiempo entre disparos (min)
}

interface Condition {
  indicator: string;
  operator: '>' | '<' | '=' | 'crosses_above' | 'crosses_below';
  value: number;
  timeframe?: string;
}

interface Action {
  type: 'notification' | 'email' | 'telegram' | 'prepare_order';
  config: any;
}
```

### Canales de Notificación
- ✅ In-app (dentro de la aplicación)
- ✅ Browser notification
- 📧 Email (futuro)
- 📱 Telegram (futuro)
- 🔊 Sonido

### Historial
- Registro de todas las alertas disparadas
- Estadísticas de efectividad
- Filtrado y búsqueda

---

## 📚 7. Historial de Operaciones

### Objetivo
Mantener registro detallado de todas las operaciones para análisis y aprendizaje.

### Información Almacenada

#### Por Operación
```typescript
interface TradeRecord {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryTime: Date;
  entryPrice: number;
  exitTime?: Date;
  exitPrice?: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number[];
  pnl?: number;
  pnlPercent?: number;
  commission: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  setup: {
    type: string;           // ej: "S/R Bounce", "Divergence"
    divergence?: DivergenceScore;
    level?: SupportResistanceLevel;
    confidence: number;
  };
  notes?: string;
  screenshots?: string[];
}
```

#### Análisis Agregado
- P&L total por período
- Win rate por símbolo
- Win rate por tipo de setup
- Mejor/peor operación
- Promedio de holding time
- Distribución de ganancias/pérdidas

### Exportación
- CSV para análisis en Excel
- JSON para procesamiento
- PDF con reporte visual

### Aprendizaje
- Etiquetado de operaciones
- Análisis de errores comunes
- Identificación de mejores setups
- Revisión de diario de trading

---

## ⚙️ 8. Configuración Global

### Parámetros de Trading
```typescript
interface TradingConfig {
  // Gestión de Riesgo
  defaultRiskPercent: number;      // 1-5%
  maxLeverage: number;             // 1-125x
  maxOpenPositions: number;        // Límite de posiciones simultáneas
  maxDailyLoss: number;            // % máximo de pérdida diaria

  // Símbolos
  activeSymbols: string[];         // Pares a monitorear
  defaultTimeframe: string;        // '15m', '1h', etc.

  // Ejecución
  slippageTolerance: number;       // % de slippage aceptable
  orderTimeout: number;            // Segundos para cancelar orden

  // Gestión de Posiciones
  moveToBreakeven: {
    enabled: boolean;
    afterPercent: number;          // Mover SL a BE tras X% de ganancia
  };
  partialTakeProfit: {
    enabled: boolean;
    firstLevel: number;            // % de posición a cerrar
    atPercent: number;             // Cuando alcance X% de ganancia
  };
}
```

### Notificaciones
- Activar/desactivar por tipo
- Canales preferidos
- Quiet hours (horarios sin notificaciones)

### Interfaz
- Tema (claro/oscuro)
- Idioma
- Formato de números
- Timezone

---

## 🔄 Estados y Flujos

### Estado de una Operación

```
PLANNED → WAITING → TRIGGERED → FILLED → OPEN → CLOSED
                                              ↓
                                          CANCELLED
```

### Flujo Completo de Trading

```
1. Monitoreo de mercado
   ↓
2. Detección de oportunidad (nivel + divergencia)
   ↓
3. [Si supervisada] → Crear orden automáticamente
   [Si no supervisada] → Generar alerta
   ↓
4. Ejecutar orden (market/limit)
   ↓
5. Confirmar llenado
   ↓
6. Monitorear posición
   ↓
7. [Condición cumplida]
   ├─ Stop Loss → Cerrar con pérdida
   ├─ Take Profit 1 → Cerrar parcial + Mover SL a BE
   └─ Take Profit final → Cerrar total
   ↓
8. Registrar en historial
   ↓
9. Actualizar métricas
```
