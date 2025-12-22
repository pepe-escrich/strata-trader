# Estrategia de Trading - Strata Trader

## 📊 Estrategia Principal: S/R + Divergence

### Concepto Base
La estrategia combina niveles técnicos de soporte y resistencia con confirmación de divergencias para identificar puntos de entrada de alta probabilidad en el mercado de futuros de criptomonedas.

---

## 🎯 Componentes de la Estrategia

### 1. Identificación de Niveles (Soporte/Resistencia)

#### Métodos de Cálculo

**A. Pivot Points**
```
Pivot Central (P) = (High + Low + Close) / 3

Resistencias:
R1 = (2 × P) - Low
R2 = P + (High - Low)
R3 = High + 2 × (P - Low)

Soportes:
S1 = (2 × P) - High
S2 = P - (High - Low)
S3 = Low - 2 × (High - P)
```

**Timeframes:**
- Daily Pivots (más fuertes)
- 4H Pivots
- 1H Pivots

**B. Swing Highs/Lows**
- Identificar máximos y mínimos locales
- Mínimo 2-3 toques para validación
- Lookback period: 20-50 velas

**C. Volume Profile**
- POC (Point of Control): Nivel con mayor volumen
- VAH/VAL (Value Area High/Low)
- Zonas de alto volumen = niveles fuertes

**D. Fibonacci Retracements**
- Niveles clave: 38.2%, 50%, 61.8%
- Aplicar en swings significativos
- Combinación con otros niveles

#### Clasificación de Fortaleza

```typescript
interface LevelStrength {
  score: number;  // 0-100
  factors: {
    touches: number;           // +10 por cada toque
    volume: number;            // +20 si hay volumen alto
    multiTimeframe: boolean;   // +30 si coincide en múltiples TF
    recentTest: boolean;       // +20 si fue probado recientemente
    confluence: number;        // +10 por cada método que coincide
  };
}
```

**Niveles Fuertes (70-100):**
- Múltiples toques (3+)
- Confirmado en varios timeframes
- Alto volumen en el nivel
- Confluencia de métodos

**Niveles Medios (40-69):**
- 2 toques
- Volumen moderado
- Un método principal

**Niveles Débiles (0-39):**
- 1 toque o recién formado
- Sin confirmación
- Bajo volumen

---

### 2. Detección de Divergencias

#### Tipos de Divergencias

**A. Divergencia Regular Alcista (Bullish)**
```
Condiciones:
1. Precio: Lower Low (mínimo más bajo)
2. RSI/MACD: Higher Low (mínimo más alto)
3. Ubicación: Cerca de un soporte
4. Interpretación: Momentum alcista creciendo
5. Acción: Considerar LONG
```

**B. Divergencia Regular Bajista (Bearish)**
```
Condiciones:
1. Precio: Higher High (máximo más alto)
2. RSI/MACD: Lower High (máximo más bajo)
3. Ubicación: Cerca de una resistencia
4. Interpretación: Momentum bajista creciendo
5. Acción: Considerar SHORT
```

**C. Divergencia Oculta Alcista (Hidden Bullish)**
```
Condiciones:
1. Precio: Higher Low
2. RSI/MACD: Lower Low
3. Contexto: Tendencia alcista
4. Interpretación: Continuación de tendencia
5. Acción: Añadir a LONG existente
```

**D. Divergencia Oculta Bajista (Hidden Bearish)**
```
Condiciones:
1. Precio: Lower High
2. RSI/MACD: Higher High
3. Contexto: Tendencia bajista
4. Interpretación: Continuación de tendencia
5. Acción: Añadir a SHORT existente
```

#### Indicadores Utilizados

**RSI (Relative Strength Index)**
```
Período: 14
Niveles clave:
- Sobrecompra: > 70
- Sobreventa: < 30

Divergencias más confiables en extremos
```

**MACD (Moving Average Convergence Divergence)**
```
Configuración: 12, 26, 9
Observar:
- Línea MACD vs Línea de Señal
- Histograma
- Cruces

Divergencias en histograma son más visuales
```

**Stochastic**
```
Período: 14, 3, 3
Niveles: 80/20

Bueno para timeframes bajos
```

**Volume (Volumen)**
```
Comparar volumen en máximos/mínimos

Divergencia de volumen:
- Precio sube pero volumen baja = debilidad
- Precio baja pero volumen baja = posible rebote
```

#### Sistema de Scoring

```typescript
interface DivergenceScore {
  strength: number;        // 0-100
  confidence: number;      // 0-100

  factors: {
    // Básicos
    indicatorCount: number;        // +25 por indicador (máx 2-3)
    multiTimeframe: boolean;       // +30

    // Contexto
    nearLevel: boolean;            // +20
    levelStrength: number;         // +0-15 según fortaleza

    // Confirmación
    volumeConfirmation: boolean;   // +15
    priceAction: boolean;          // +10 (vela de rechazo)
    trendAlignment: boolean;       // +10
  };
}
```

**Alta Confianza (70-100):**
- 2+ indicadores con divergencia
- Múltiples timeframes
- Cerca de nivel fuerte
- Confirmación de volumen

**Media Confianza (40-69):**
- 1 indicador con divergencia clara
- Nivel válido cercano
- Sin confirmación adicional

**Baja Confianza (0-39):**
- Divergencia débil
- Sin nivel cercano
- Señales contradictorias

---

## 🎬 Condiciones de Entrada

### Setup Ideal

```typescript
interface TradeSetup {
  // Requisitos mínimos
  level: {
    type: 'SUPPORT' | 'RESISTANCE';
    strength: number;        // Mínimo: 40
    distance: number;        // < 0.5% del precio actual
  };

  divergence: {
    present: boolean;
    score: number;           // Mínimo: 50
    type: 'REGULAR' | 'HIDDEN';
    indicators: string[];    // Mínimo: 1, Ideal: 2+
  };

  // Confirmaciones adicionales
  priceAction: {
    rejectionCandle: boolean;  // Vela de rechazo del nivel
    volume: 'HIGH' | 'NORMAL' | 'LOW';
  };

  marketContext: {
    trend: 'BULLISH' | 'BEARISH' | 'RANGING';
    volatility: number;      // ATR
    liquidity: 'HIGH' | 'LOW';
  };
}
```

### Entrada LONG

**Condiciones:**
1. ✅ Precio acercándose a SOPORTE (distancia < 0.5%)
2. ✅ Divergencia ALCISTA detectada (score > 50)
3. ✅ Nivel de soporte FUERTE (strength > 40)
4. ✅ Vela de rechazo (opcional pero ideal)
5. ✅ Volumen en aumento (confirmación)

**Proceso:**
```
1. Sistema detecta precio cerca de soporte
2. Escanea divergencias en últimas 20-50 velas
3. Calcula score de setup
4. Si score > umbral (60):
   - Modo Supervisado: Ejecuta orden automáticamente
   - Modo Asistido: Genera alerta para usuario
```

### Entrada SHORT

**Condiciones:**
1. ✅ Precio acercándose a RESISTENCIA (distancia < 0.5%)
2. ✅ Divergencia BAJISTA detectada (score > 50)
3. ✅ Nivel de resistencia FUERTE (strength > 40)
4. ✅ Vela de rechazo (opcional pero ideal)
5. ✅ Volumen en aumento (confirmación)

---

## 🛡️ Gestión de Riesgo

### Cálculo de Stop Loss

**Método 1: Basado en ATR**
```typescript
function calculateStopLossATR(
  entryPrice: number,
  side: 'LONG' | 'SHORT',
  atr: number,
  multiplier: number = 1.5
): number {
  const distance = atr * multiplier;

  if (side === 'LONG') {
    return entryPrice - distance;
  } else {
    return entryPrice + distance;
  }
}
```

**Método 2: Basado en Nivel**
```typescript
function calculateStopLossLevel(
  entryPrice: number,
  side: 'LONG' | 'SHORT',
  level: Level,
  buffer: number = 0.001  // 0.1%
): number {
  if (side === 'LONG') {
    // SL debajo del soporte
    return level.price * (1 - buffer);
  } else {
    // SL encima de la resistencia
    return level.price * (1 + buffer);
  }
}
```

**Método 3: % Fijo**
```typescript
function calculateStopLossFixed(
  entryPrice: number,
  side: 'LONG' | 'SHORT',
  percent: number = 0.02  // 2%
): number {
  if (side === 'LONG') {
    return entryPrice * (1 - percent);
  } else {
    return entryPrice * (1 + percent);
  }
}
```

**Selección Automática:**
```typescript
function selectBestStopLoss(params: StopLossParams): number {
  const methods = [
    calculateStopLossATR(params),
    calculateStopLossLevel(params),
    calculateStopLossFixed(params)
  ];

  // Seleccionar el más conservador (mayor distancia)
  if (params.side === 'LONG') {
    return Math.max(...methods);
  } else {
    return Math.min(...methods);
  }
}
```

### Cálculo de Tamaño de Posición

```typescript
function calculatePositionSize(params: {
  accountBalance: number;
  riskPercent: number;      // Ej: 0.01 = 1%
  entryPrice: number;
  stopLossPrice: number;
  leverage: number;
}): number {
  // Monto a arriesgar
  const riskAmount = params.accountBalance * params.riskPercent;

  // Distancia del SL
  const slDistance = Math.abs(params.entryPrice - params.stopLossPrice);
  const slPercent = slDistance / params.entryPrice;

  // Tamaño de posición base (sin apalancamiento)
  const baseSize = riskAmount / slDistance;

  // Tamaño con apalancamiento
  const positionValue = baseSize * params.entryPrice;
  const marginRequired = positionValue / params.leverage;

  // Verificar que no exceda balance
  if (marginRequired > params.accountBalance * 0.9) {
    // Reducir tamaño
    return (params.accountBalance * 0.9 * params.leverage) / params.entryPrice;
  }

  return baseSize;
}
```

### Validación de Apalancamiento

```typescript
function validateLeverage(params: {
  riskPercent: number;
  slPercent: number;
  leverage: number;
  maxLeverage: number;
}): { valid: boolean; suggestedLeverage?: number } {
  // Apalancamiento máximo basado en riesgo y SL
  const impliedLeverage = params.riskPercent / params.slPercent;

  if (params.leverage > params.maxLeverage) {
    return {
      valid: false,
      suggestedLeverage: params.maxLeverage
    };
  }

  if (params.leverage > impliedLeverage * 2) {
    return {
      valid: false,
      suggestedLeverage: Math.floor(impliedLeverage)
    };
  }

  return { valid: true };
}
```

### Take Profit (Objetivos)

**Estrategia Multi-Nivel:**

```typescript
interface TakeProfitStrategy {
  levels: TakeProfitLevel[];
  trailingStop?: TrailingStop;
}

interface TakeProfitLevel {
  price: number;
  percentage: number;   // % de posición a cerrar
  label: string;
}

function calculateTakeProfits(params: {
  entryPrice: number;
  stopLoss: number;
  side: 'LONG' | 'SHORT';
  nextLevel?: Level;    // Próximo nivel de S/R
  riskRewardRatio: number;  // Mínimo deseado (ej: 2)
}): TakeProfitLevel[] {
  const slDistance = Math.abs(params.entryPrice - params.stopLoss);

  let levels: TakeProfitLevel[] = [];

  // TP1: Scalp (1:1 o próximo nivel cercano)
  const tp1Distance = slDistance * 1;
  const tp1Price = params.side === 'LONG'
    ? params.entryPrice + tp1Distance
    : params.entryPrice - tp1Distance;

  levels.push({
    price: tp1Price,
    percentage: 50,  // Cerrar 50% de la posición
    label: 'Scalp (1:1)'
  });

  // TP2: Target principal (2:1 o nivel objetivo)
  if (params.nextLevel) {
    levels.push({
      price: params.nextLevel.price,
      percentage: 30,
      label: 'Next Level'
    });
  } else {
    const tp2Distance = slDistance * params.riskRewardRatio;
    const tp2Price = params.side === 'LONG'
      ? params.entryPrice + tp2Distance
      : params.entryPrice - tp2Distance;

    levels.push({
      price: tp2Price,
      percentage: 30,
      label: `Target ${params.riskRewardRatio}:1`
    });
  }

  // TP3: Trailing stop para el resto (20%)
  // Se maneja con trailing stop

  return levels;
}
```

### Movimiento a Breakeven

```typescript
interface BreakevenConfig {
  enabled: boolean;
  triggerPercent: number;  // Mover SL a BE tras X% de ganancia
  offset: number;          // Pequeño offset para fees (0.1%)
}

function shouldMoveToBreakeven(
  position: Position,
  config: BreakevenConfig
): boolean {
  if (!config.enabled) return false;

  const currentPnLPercent = position.pnlPercent;
  return currentPnLPercent >= config.triggerPercent;
}

function calculateBreakevenPrice(
  entryPrice: number,
  side: 'LONG' | 'SHORT',
  offset: number = 0.001
): number {
  if (side === 'LONG') {
    return entryPrice * (1 + offset);
  } else {
    return entryPrice * (1 - offset);
  }
}
```

### Trailing Stop

```typescript
interface TrailingStopConfig {
  enabled: boolean;
  activationPercent: number;  // Activar tras X% de ganancia
  callbackRate: number;       // % de retroceso para cerrar
}

function updateTrailingStop(
  position: Position,
  currentPrice: number,
  config: TrailingStopConfig
): number | null {
  // Solo activar si estamos en ganancia suficiente
  if (position.pnlPercent < config.activationPercent) {
    return null;
  }

  // Calcular nuevo SL basado en máximo alcanzado
  const { side, highestPrice, lowestPrice } = position;

  if (side === 'LONG') {
    const newSL = highestPrice * (1 - config.callbackRate);
    // Solo mover SL hacia arriba
    return Math.max(newSL, position.stopLoss);
  } else {
    const newSL = lowestPrice * (1 + config.callbackRate);
    // Solo mover SL hacia abajo
    return Math.min(newSL, position.stopLoss);
  }
}
```

---

## 🔄 Gestión de Posiciones

### Ciclo de Vida Completo

```typescript
enum PositionState {
  PLANNED = 'PLANNED',        // Orden planificada
  WAITING = 'WAITING',        // Esperando entrada
  ENTERED = 'ENTERED',        // Posición abierta
  PARTIAL_CLOSED = 'PARTIAL', // Cierre parcial realizado
  BREAKEVEN = 'BREAKEVEN',    // SL en breakeven
  TRAILING = 'TRAILING',      // Trailing stop activo
  CLOSED = 'CLOSED'           // Posición cerrada
}

class PositionLifecycle {
  async execute(position: Position): Promise<void> {
    switch (position.state) {
      case PositionState.PLANNED:
        await this.checkEntry(position);
        break;

      case PositionState.WAITING:
        await this.monitorEntry(position);
        break;

      case PositionState.ENTERED:
        await this.monitorPosition(position);
        await this.checkFirstTP(position);
        break;

      case PositionState.PARTIAL_CLOSED:
        await this.moveToBreakeven(position);
        await this.checkRemainingTPs(position);
        break;

      case PositionState.BREAKEVEN:
        await this.activateTrailing(position);
        break;

      case PositionState.TRAILING:
        await this.updateTrailing(position);
        break;
    }
  }

  private async checkFirstTP(position: Position): Promise<void> {
    const firstTP = position.takeProfit[0];

    if (this.isPriceAtTarget(position.currentPrice, firstTP, position.side)) {
      // Cerrar 50% de la posición
      await this.closePartial(position, 50);

      // Mover SL a breakeven
      position.stopLoss = this.calculateBreakevenPrice(position.entryPrice, position.side);

      // Actualizar estado
      position.state = PositionState.PARTIAL_CLOSED;

      // Notificar usuario
      await this.notify(`TP1 alcanzado en ${position.symbol}. 50% cerrado, SL en breakeven.`);
    }
  }
}
```

### Reglas de Gestión

**Regla 1: Never Move SL Against You**
```
✅ LONG: Solo mover SL hacia arriba
✅ SHORT: Solo mover SL hacia abajo
❌ Nunca aumentar el riesgo
```

**Regla 2: Secure Profits Early**
```
✅ Primer TP en 1:1 (50% de posición)
✅ Mover SL a BE inmediatamente
✅ Dejar correr el resto con trailing
```

**Regla 3: Cut Losses Quick**
```
❌ No mover SL más lejos
❌ No promediar perdidas (añadir a posición perdedora)
✅ Respetar el SL inicial
```

**Regla 4: Max Exposure**
```
✅ Máximo 2-3 posiciones simultáneas
✅ No más del 5% del capital total en riesgo
✅ Diversificar entre pares (no todo en BTC)
```

**Regla 5: Time-Based Exit**
```
Si posición no se mueve en X horas/días:
- Considerar cierre manual
- Puede indicar setup inválido
- Liberar capital para mejores oportunidades
```

---

## 📊 Backtesting de la Estrategia

### Parámetros a Optimizar

```typescript
interface StrategyParams {
  // Niveles
  levelMinStrength: number;       // 40-70
  levelMaxDistance: number;       // 0.3-1.0%

  // Divergencia
  divMinScore: number;            // 40-70
  requiredIndicators: number;     // 1-2
  multiTimeframe: boolean;

  // Riesgo
  riskPercent: number;            // 0.5-2.0%
  maxLeverage: number;            // 5-20x

  // SL/TP
  slMethod: 'ATR' | 'LEVEL' | 'FIXED';
  atrMultiplier: number;          // 1.0-2.5
  minRiskReward: number;          // 1.5-3.0

  // Gestión
  moveToBreakevenAt: number;      // 0.5-1.5%
  partialClosePercent: number;    // 30-70%
  trailingStopCallback: number;   // 1.0-3.0%
}
```

### Métricas de Evaluación

```typescript
interface BacktestMetrics {
  // Básicas
  totalTrades: number;
  winRate: number;              // > 50% objetivo
  profitFactor: number;         // > 1.5 objetivo

  // Rentabilidad
  totalReturn: number;          // %
  averageWin: number;
  averageLoss: number;
  expectancy: number;           // $ esperado por trade

  // Riesgo
  maxDrawdown: number;          // < 20% objetivo
  maxDrawdownDuration: number;  // días
  sharpeRatio: number;          // > 1.0 objetivo

  // Consistencia
  winStreak: number;
  lossStreak: number;
  monthlyReturns: number[];

  // Eficiencia
  averageHoldingTime: number;   // horas
  tradesPerMonth: number;
}
```

### Criterios de Éxito

**Mínimos Aceptables:**
- Win Rate: > 45%
- Profit Factor: > 1.3
- Max Drawdown: < 25%
- Sharpe Ratio: > 0.8

**Objetivo Ideal:**
- Win Rate: > 55%
- Profit Factor: > 2.0
- Max Drawdown: < 15%
- Sharpe Ratio: > 1.5

---

## 📝 Registro y Aprendizaje

### Información a Capturar

```typescript
interface TradeJournal {
  // Setup
  setup: {
    type: 'SR_DIVERGENCE' | 'BREAKOUT' | 'OTHER';
    level: Level;
    divergence: Divergence;
    score: number;
    confidence: number;
  };

  // Ejecución
  entry: {
    time: Date;
    price: number;
    reason: string;
  };

  // Gestión
  management: {
    initialSL: number;
    slAdjustments: {time: Date, price: number, reason: string}[];
    tpHits: {time: Date, price: number, percent: number}[];
    movedToBreakeven: boolean;
    trailingActivated: boolean;
  };

  // Resultado
  exit: {
    time: Date;
    price: number;
    reason: 'TP' | 'SL' | 'MANUAL' | 'TIME';
    pnl: number;
    pnlPercent: number;
  };

  // Análisis Post-Trade
  review: {
    whatWorked: string;
    whatDidnt: string;
    mistakes: string[];
    lessons: string;
    rating: number;  // 1-5
  };

  // Extras
  screenshots: string[];
  notes: string;
}
```

### Análisis de Patrones

**Identificar:**
- Setups más rentables
- Errores comunes
- Mejores horarios de trading
- Pares más consistentes
- Timeframes óptimos

**Mejorar:**
- Ajustar parámetros basado en datos
- Eliminar setups perdedores
- Duplicar estrategias ganadoras
- Refinar gestión de riesgo

---

## 🎓 Reglas de Oro

1. **El Setup es Rey**
   - No entrar sin setup válido
   - Paciencia para el setup perfecto
   - Calidad > Cantidad

2. **Respetar el Plan**
   - Seguir las reglas sin excepción
   - No trading emocional
   - Confiar en el sistema

3. **Gestión de Riesgo Primero**
   - Nunca arriesgar > 2% por trade
   - Siempre usar stop loss
   - Proteger el capital

4. **Tomar Ganancias**
   - No ser codicioso
   - Scalp first, let run rest
   - Celebrar wins pequeños consistentes

5. **Aprender Continuamente**
   - Revisar cada trade
   - Ajustar basado en datos
   - Adaptarse al mercado

---

## 🔄 Evolución de la Estrategia

### Fase 1: Básica (Actual)
- S/R + Divergence manual
- Parámetros fijos
- Gestión estándar

### Fase 2: Optimizada
- Parámetros adaptativos por par
- Filtros adicionales (volumen, spread)
- Mejor timing de entrada

### Fase 3: Avanzada
- Machine Learning para scoring
- Múltiples estrategias paralelas
- Gestión dinámica de riesgo

### Fase 4: Profesional
- Trading multi-exchange
- Arbitraje de estrategias
- Portfolio optimization
