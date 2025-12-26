# Support & Resistance - Documentación Técnica (Fase 2)

## Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Calculadores Implementados](#calculadores-implementados)
4. [Sistema de Scoring](#sistema-de-scoring)
5. [Gestión de Caché](#gestión-de-caché)
6. [API Endpoints](#api-endpoints)
7. [Modelos de Datos](#modelos-de-datos)
8. [Flujo de Ejecución](#flujo-de-ejecución)

---

## Visión General

El módulo de Support & Resistance identifica niveles clave de precio donde el activo tiende a encontrar soporte (rebote hacia arriba) o resistencia (rebote hacia abajo). Implementa múltiples métodos de cálculo y un sistema de scoring inteligente para evaluar la fortaleza de cada nivel.

### Objetivos Principales

1. **Identificación Precisa**: Usar múltiples algoritmos para detectar niveles S/R
2. **Evaluación de Fortaleza**: Asignar un score 0-100 basado en factores múltiples
3. **Confluencia**: Detectar niveles donde coinciden múltiples métodos
4. **Multi-Timeframe**: Soportar análisis en diferentes marcos temporales
5. **Rendimiento**: Caché inteligente para reducir cálculos repetitivos

---

## Arquitectura

### Estructura de Módulos

```
backend/src/modules/support-resistance/
├── calculators/
│   ├── base.calculator.ts           # Clase abstracta base
│   ├── pivot-points.calculator.ts   # Calculador de pivot points
│   ├── swing-levels.calculator.ts   # Calculador de swing highs/lows
│   └── volume-profile.calculator.ts # Calculador basado en volumen
├── entities/
│   └── level.entity.ts              # Modelo de datos Level
├── dto/
│   └── calculate-levels.dto.ts      # DTOs para validación
├── support-resistance.service.ts     # Servicio principal
├── support-resistance.controller.ts  # API REST endpoints
└── support-resistance.module.ts      # Módulo NestJS
```

### Patrón de Diseño

Se utiliza el **patrón Strategy** con una clase base abstracta (`BaseCalculator`) que define la interfaz común, y calculadores especializados que implementan algoritmos específicos.

```typescript
export abstract class BaseCalculator {
  abstract calculate(candles: Candle[], config?: any): CalculatorResult;

  // Métodos auxiliares compartidos
  protected findHighestHigh(candles: Candle[], start: number, end: number): number;
  protected findLowestLow(candles: Candle[], start: number, end: number): number;
}
```

---

## Calculadores Implementados

### 1. Pivot Points Calculator

**Archivo**: `calculators/pivot-points.calculator.ts`

Calcula niveles de pivot points usando tres métodos diferentes.

#### Método Standard

Fórmula clásica de pivot points:

```typescript
PP = (High + Low + Close) / 3

R1 = (2 × PP) - Low
R2 = PP + (High - Low)
R3 = High + 2 × (PP - Low)

S1 = (2 × PP) - High
S2 = PP - (High - Low)
S3 = Low - 2 × (High - PP)
```

**Uso**: Niveles de soporte y resistencia básicos para day trading.

#### Método Fibonacci

Usa ratios de Fibonacci (0.382, 0.618) para calcular niveles:

```typescript
R1 = PP + 0.382 × (High - Low)
R2 = PP + 0.618 × (High - Low)
R3 = PP + 1.000 × (High - Low)

S1 = PP - 0.382 × (High - Low)
S2 = PP - 0.618 × (High - Low)
S3 = PP - 1.000 × (High - Low)
```

**Uso**: Traders que siguen análisis técnico basado en Fibonacci.

#### Método Camarilla

Fórmula más ajustada, útil para intraday:

```typescript
R1 = Close + 1.1 × (High - Low) / 12
R2 = Close + 1.1 × (High - Low) / 6
R3 = Close + 1.1 × (High - Low) / 4
R4 = Close + 1.1 × (High - Low) / 2

S1 = Close - 1.1 × (High - Low) / 12
S2 = Close - 1.1 × (High - Low) / 6
S3 = Close - 1.1 × (High - Low) / 4
S4 = Close - 1.1 × (High - Low) / 2
```

**Uso**: Breakout trading, niveles muy cercanos al precio actual.

#### Implementación

```typescript
// Ubicación: backend/src/modules/support-resistance/calculators/pivot-points.calculator.ts:24-147

calculate(candles: Candle[], config?: PivotConfig): CalculatorResult {
  const method = config?.method || 'standard';

  switch (method) {
    case 'fibonacci':
      return this.calculateFibonacci(candles);
    case 'camarilla':
      return this.calculateCamarilla(candles);
    default:
      return this.calculateStandard(candles);
  }
}
```

---

### 2. Swing Levels Calculator

**Archivo**: `calculators/swing-levels.calculator.ts`

Identifica swing highs (picos) y swing lows (valles) en el precio.

#### Algoritmo de Detección

1. **Swing High**: Un máximo local rodeado por máximos menores
2. **Swing Low**: Un mínimo local rodeado por mínimos mayores

```typescript
// Ejemplo de detección de swing high
for (let i = lookback; i < candles.length - lookback; i++) {
  const currentHigh = candles[i].high;
  let isSwingHigh = true;

  // Verificar que todos los máximos alrededor sean menores
  for (let j = i - lookback; j <= i + lookback; j++) {
    if (j !== i && candles[j].high >= currentHigh) {
      isSwingHigh = false;
      break;
    }
  }

  if (isSwingHigh) {
    swingHighs.push(currentHigh);
  }
}
```

#### Parámetros Configurables

- **lookback**: Número de velas a cada lado para validar el swing (default: 5)
- **minTouches**: Mínimo de toques para considerar el nivel válido (default: 2)
- **tolerance**: Porcentaje de tolerancia para agrupar niveles similares (default: 0.5%)

#### Agrupación de Niveles

Niveles muy cercanos se agrupan para evitar duplicados:

```typescript
// Ubicación: backend/src/modules/support-resistance/calculators/swing-levels.calculator.ts:150-178

private groupSimilarLevels(levels: number[], tolerance: number = 0.005): number[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((a, b) => a - b);
  const grouped: number[] = [];

  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const groupAvg = currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length;

    // Si está dentro de la tolerancia, agregar al grupo
    if (Math.abs(current - groupAvg) / groupAvg <= tolerance) {
      currentGroup.push(current);
    } else {
      // Finalizar grupo y empezar uno nuevo
      grouped.push(groupAvg);
      currentGroup = [current];
    }
  }

  // Agregar el último grupo
  if (currentGroup.length > 0) {
    grouped.push(currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length);
  }

  return grouped;
}
```

---

### 3. Volume Profile Calculator

**Archivo**: `calculators/volume-profile.calculator.ts`

Identifica niveles basados en concentración de volumen.

#### Conceptos Clave

1. **POC (Point of Control)**: Precio con mayor volumen negociado
2. **VAH (Value Area High)**: Límite superior del 70% del volumen
3. **VAL (Value Area Low)**: Límite inferior del 70% del volumen

#### Construcción del Perfil de Volumen

```typescript
// Ubicación: backend/src/modules/support-resistance/calculators/volume-profile.calculator.ts:91-125

private buildVolumeProfile(candles: Candle[], bins: number = 50): VolumeNode[] {
  // 1. Encontrar rango de precios
  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / bins;

  // 2. Inicializar bins
  const profile: VolumeNode[] = Array.from({ length: bins }, (_, i) => ({
    price: minPrice + (i + 0.5) * binSize,
    volume: 0,
  }));

  // 3. Distribuir volumen en bins
  for (const candle of candles) {
    const avgPrice = (candle.high + candle.low + candle.close) / 3;
    const binIndex = Math.min(
      Math.floor((avgPrice - minPrice) / binSize),
      bins - 1
    );

    if (binIndex >= 0 && binIndex < bins) {
      profile[binIndex].volume += candle.volume;
    }
  }

  return profile;
}
```

#### Cálculo del POC

```typescript
calculatePOC(candles: Candle[]): number {
  const profile = this.buildVolumeProfile(candles);

  // Encontrar el nodo con mayor volumen
  const poc = profile.reduce((max, node) =>
    node.volume > max.volume ? node : max
  );

  return poc.price;
}
```

#### Cálculo del Value Area

```typescript
// Ubicación: backend/src/modules/support-resistance/calculators/volume-profile.calculator.ts:61-89

calculateValueArea(candles: Candle[]): { vah: number; val: number } {
  const profile = this.buildVolumeProfile(candles);
  const totalVolume = profile.reduce((sum, node) => sum + node.volume, 0);
  const targetVolume = totalVolume * 0.7; // 70% del volumen

  // Ordenar por volumen
  const sorted = [...profile].sort((a, b) => b.volume - a.volume);

  let accumulatedVolume = 0;
  const valueAreaNodes: VolumeNode[] = [];

  // Acumular nodos hasta alcanzar 70% del volumen
  for (const node of sorted) {
    valueAreaNodes.push(node);
    accumulatedVolume += node.volume;

    if (accumulatedVolume >= targetVolume) {
      break;
    }
  }

  // Encontrar precios máximo y mínimo del value area
  const prices = valueAreaNodes.map(n => n.price);

  return {
    vah: Math.max(...prices),
    val: Math.min(...prices),
  };
}
```

---

## Sistema de Scoring

### Filosofía del Scoring

El scoring evalúa la **fortaleza** de un nivel S/R en una escala de 0-100. Un nivel fuerte (score alto) tiene mayor probabilidad de actuar como soporte/resistencia efectivo.

### Factores de Evaluación

#### 1. Toques (30 puntos máximo)

Número de veces que el precio ha tocado el nivel:

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:278-287

private countTouches(level: Level, candles: Candle[]): number {
  const tolerance = 0.002; // 0.2% de tolerancia
  let touches = 0;

  for (const candle of candles) {
    const distance = Math.abs(candle.low - level.price) / level.price;
    if (distance <= tolerance ||
        Math.abs(candle.high - level.price) / level.price <= tolerance) {
      touches++;
    }
  }

  return touches;
}

// Cálculo del score por toques
const touchScore = Math.min(touches * 5, 30); // 5 puntos por toque, máx 30
```

**Lógica**: Más toques = nivel más respetado por el mercado.

#### 2. Confluencia (30 puntos máximo)

Número de métodos de cálculo que identificaron este nivel:

```typescript
// Durante la agrupación de niveles
const similarLevels = allLevels.filter(l =>
  Math.abs(l.price - level.price) / level.price <= tolerance
);

const confluenceScore = Math.min(similarLevels.length * 10, 30);
```

**Lógica**: Si múltiples métodos identifican el mismo nivel, es más significativo.

#### 3. Prueba Reciente (20 puntos máximo)

Qué tan recientemente fue probado el nivel:

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:246-276

private findLastTouch(level: Level, candles: Candle[]): Date | undefined {
  const tolerance = 0.002;

  // Buscar de atrás hacia adelante (más reciente primero)
  for (let i = candles.length - 1; i >= 0; i--) {
    const candle = candles[i];
    const lowDistance = Math.abs(candle.low - level.price) / level.price;
    const highDistance = Math.abs(candle.high - level.price) / level.price;

    if (lowDistance <= tolerance || highDistance <= tolerance) {
      return new Date(candle.timestamp);
    }
  }

  return undefined;
}

// Cálculo del score
if (lastTouch) {
  const hoursSinceTouch = (Date.now() - lastTouch.getTime()) / (1000 * 60 * 60);
  if (hoursSinceTouch <= 24) {
    recencyScore = 20; // Tocado en últimas 24h
  } else if (hoursSinceTouch <= 72) {
    recencyScore = 15; // Tocado en últimos 3 días
  } else if (hoursSinceTouch <= 168) {
    recencyScore = 10; // Tocado en última semana
  }
}
```

**Lógica**: Niveles recientemente probados son más relevantes.

#### 4. Distancia del Precio Actual (10 puntos máximo)

Niveles más cercanos al precio son más inmediatamente relevantes:

```typescript
const distancePercent = Math.abs(level.price - currentPrice) / currentPrice;

let distanceScore = 0;
if (distancePercent <= 0.01) {        // < 1%
  distanceScore = 10;
} else if (distancePercent <= 0.03) { // < 3%
  distanceScore = 7;
} else if (distancePercent <= 0.05) { // < 5%
  distanceScore = 5;
} else {
  distanceScore = 2;
}
```

**Lógica**: Traders se enfocan más en niveles cercanos al precio actual.

#### 5. Estado del Nivel (10 puntos máximo)

```typescript
let statusScore = 0;
switch (level.status) {
  case LevelStatus.ACTIVE:
    statusScore = 10; // Nivel intacto
    break;
  case LevelStatus.TESTED:
    statusScore = 7;  // Probado pero sostenido
    break;
  case LevelStatus.BROKEN:
    statusScore = 0;  // Roto, no confiable
    break;
}
```

**Lógica**: Niveles activos son más confiables que niveles rotos.

### Score Final

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:198-244

private calculateStrength(
  level: Level,
  candles: Candle[],
  currentPrice: number,
  allLevels: Level[]
): number {
  let strength = 0;

  // Factor 1: Toques (30 pts)
  const touches = this.countTouches(level, candles);
  const touchScore = Math.min(touches * 5, 30);
  strength += touchScore;

  // Factor 2: Confluencia (30 pts)
  const tolerance = 0.005;
  const similarLevels = allLevels.filter(l =>
    Math.abs(l.price - level.price) / level.price <= tolerance
  );
  const confluenceScore = Math.min(similarLevels.length * 10, 30);
  strength += confluenceScore;

  // Factor 3: Prueba reciente (20 pts)
  const lastTouch = this.findLastTouch(level, candles);
  let recencyScore = 0;
  if (lastTouch) {
    const hoursSinceTouch = (Date.now() - lastTouch.getTime()) / (1000 * 60 * 60);
    if (hoursSinceTouch <= 24) recencyScore = 20;
    else if (hoursSinceTouch <= 72) recencyScore = 15;
    else if (hoursSinceTouch <= 168) recencyScore = 10;
  }
  strength += recencyScore;

  // Factor 4: Distancia del precio (10 pts)
  const distancePercent = Math.abs(level.price - currentPrice) / currentPrice;
  let distanceScore = 0;
  if (distancePercent <= 0.01) distanceScore = 10;
  else if (distancePercent <= 0.03) distanceScore = 7;
  else if (distancePercent <= 0.05) distanceScore = 5;
  else distanceScore = 2;
  strength += distanceScore;

  // Factor 5: Estado (10 pts)
  let statusScore = 0;
  switch (level.status) {
    case LevelStatus.ACTIVE: statusScore = 10; break;
    case LevelStatus.TESTED: statusScore = 7; break;
    case LevelStatus.BROKEN: statusScore = 0; break;
  }
  strength += statusScore;

  return Math.min(Math.round(strength), 100);
}
```

### Interpretación de Scores

- **70-100**: Nivel **Fuerte** - Alta probabilidad de actuar como S/R
- **40-69**: Nivel **Medio** - Probabilidad moderada
- **0-39**: Nivel **Débil** - Usar con precaución

---

## Gestión de Caché

### Estrategia de Caché

El módulo implementa un sistema de caché en memoria para optimizar rendimiento.

#### Configuración

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:22-31

private readonly levelCache = new Map<string, CachedLevels>();
private readonly levelCacheTTL: number;

constructor(
  private readonly marketService: MarketService,
  private readonly configService: ConfigService,
) {
  // TTL configurable vía env, default 60 segundos
  this.levelCacheTTL = this.configService.get<number>('LEVEL_CACHE_TTL') || 60000;
}
```

#### Estructura del Caché

```typescript
interface CachedLevels {
  data: Level[];
  timestamp: number;
  ttl: number;
}

// Clave de caché
private getLevelCacheKey(symbol: string, timeframe: string): string {
  return `levels:${symbol}:${timeframe}`;
}
```

#### Validación de Caché

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:33-38

private isCacheValid(cached: CachedLevels | undefined): boolean {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < cached.ttl;
}
```

#### Uso del Caché

```typescript
// Ubicación: backend/src/modules/support-resistance/support-resistance.service.ts:85-107

async getLevels(
  symbol: string,
  timeframe: string = '1h',
  minStrength?: number
): Promise<Level[]> {
  // Intentar obtener del caché
  const cacheKey = this.getLevelCacheKey(symbol, timeframe);
  const cached = this.levelCache.get(cacheKey);

  if (this.isCacheValid(cached)) {
    this.logger.debug(`Cache hit for ${cacheKey}`);
    let levels = cached.data;

    // Aplicar filtro de fortaleza si se especificó
    if (minStrength !== undefined) {
      levels = levels.filter(l => l.strength >= minStrength);
    }

    return levels;
  }

  // Calcular niveles si no hay caché válido
  this.logger.debug(`Cache miss for ${cacheKey}, calculating levels`);
  return this.calculateLevels(symbol, timeframe, minStrength);
}
```

#### Limpieza de Caché

```typescript
// Manual
async clearCache(symbol?: string): Promise<void> {
  if (symbol) {
    // Limpiar caché de un símbolo específico
    const keys = Array.from(this.levelCache.keys())
      .filter(k => k.startsWith(`levels:${symbol}:`));

    keys.forEach(key => this.levelCache.delete(key));
  } else {
    // Limpiar todo el caché
    this.levelCache.clear();
  }
}
```

---

## API Endpoints

### GET /api/levels/:symbol

Obtiene niveles S/R para un símbolo.

**Parámetros Query**:
- `timeframe` (opcional): '15m', '1h', '4h', '1d' (default: '1h')
- `minStrength` (opcional): Filtrar por fortaleza mínima (0-100)

**Ejemplo**:
```bash
GET /api/levels/BTC-USDT?timeframe=1h&minStrength=50
```

**Respuesta**:
```json
{
  "symbol": "BTC-USDT",
  "timeframe": "1h",
  "count": 12,
  "levels": [
    {
      "id": "uuid",
      "symbol": "BTC-USDT",
      "price": 45250.50,
      "type": "RESISTANCE",
      "timeframe": "1h",
      "method": "PIVOT_STANDARD",
      "strength": 85,
      "touches": 5,
      "lastTouch": "2025-01-15T10:30:00Z",
      "status": "ACTIVE",
      "createdAt": "2025-01-15T12:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### POST /api/levels/calculate

Fuerza el recálculo de niveles (ignora caché).

**Body**:
```json
{
  "symbol": "BTC-USDT",
  "timeframes": ["15m", "1h", "4h"],
  "minStrength": 40
}
```

**Respuesta**:
```json
{
  "message": "Levels calculated successfully",
  "results": {
    "15m": { "count": 15, "levels": [...] },
    "1h": { "count": 12, "levels": [...] },
    "4h": { "count": 8, "levels": [...] }
  }
}
```

### GET /api/levels/nearby/:symbol

Obtiene niveles cercanos al precio actual.

**Parámetros Query**:
- `timeframe` (opcional): default '1h'
- `distancePercent` (opcional): Distancia máxima en % (default: 0.5%)

**Ejemplo**:
```bash
GET /api/levels/nearby/BTC-USDT?distancePercent=1.0
```

### GET /api/levels/strength/:symbol

Análisis de niveles por fortaleza.

**Respuesta**:
```json
{
  "symbol": "BTC-USDT",
  "timeframe": "1h",
  "total": 20,
  "byStrength": {
    "strong": { "count": 5, "levels": [...] },
    "medium": { "count": 10, "levels": [...] },
    "weak": { "count": 5, "levels": [...] }
  },
  "byType": {
    "supports": { "count": 10, "levels": [...] },
    "resistances": { "count": 10, "levels": [...] }
  }
}
```

### GET /api/levels/multi-timeframe/:symbol

Obtiene niveles en múltiples timeframes.

**Parámetros Query**:
- `timeframes` (opcional): Timeframes separados por coma (default: '15m,1h,4h,1d')

**Ejemplo**:
```bash
GET /api/levels/multi-timeframe/BTC-USDT?timeframes=1h,4h,1d
```

### DELETE /api/levels/cache

Limpia el caché de niveles.

**Parámetros Query**:
- `symbol` (opcional): Símbolo específico a limpiar

---

## Modelos de Datos

### Level Entity

```typescript
// Ubicación: backend/src/modules/support-resistance/entities/level.entity.ts:3-17

export interface Level {
  id: string;                    // UUID único
  symbol: string;                // Par de trading (ej: BTC-USDT)
  price: number;                 // Precio del nivel
  type: 'SUPPORT' | 'RESISTANCE'; // Tipo de nivel
  timeframe: string;             // Marco temporal (15m, 1h, etc)
  method: CalculationMethod;     // Método de cálculo usado
  strength: number;              // Fortaleza 0-100
  touches: number;               // Número de toques
  lastTouch?: Date;              // Última vez que fue tocado
  status: LevelStatus;           // Estado del nivel
  metadata?: Record<string, any>; // Datos adicionales opcionales
  createdAt: Date;               // Timestamp de creación
  updatedAt: Date;               // Timestamp de actualización
}
```

### Enums

```typescript
// Métodos de cálculo
export enum CalculationMethod {
  PIVOT_STANDARD = 'PIVOT_STANDARD',
  PIVOT_FIBONACCI = 'PIVOT_FIBONACCI',
  PIVOT_CAMARILLA = 'PIVOT_CAMARILLA',
  SWING_HIGH_LOW = 'SWING_HIGH_LOW',
  VOLUME_PROFILE_POC = 'VOLUME_PROFILE_POC',
  VOLUME_PROFILE_VAH = 'VOLUME_PROFILE_VAH',
  VOLUME_PROFILE_VAL = 'VOLUME_PROFILE_VAL',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT', // Futuro
}

// Estados del nivel
export enum LevelStatus {
  ACTIVE = 'ACTIVE',     // Nivel intacto, no ha sido roto
  TESTED = 'TESTED',     // Probado recientemente pero sostenido
  BROKEN = 'BROKEN',     // Nivel roto por el precio
}
```

---

## Flujo de Ejecución

### Cálculo de Niveles (Flujo Principal)

```
1. Cliente llama GET /api/levels/BTC-USDT?timeframe=1h
   │
   ├─> 2. SupportResistanceController recibe request
   │       └─> Valida parámetros (symbol, timeframe)
   │
   ├─> 3. SupportResistanceService.getLevels()
   │       ├─> Verifica caché
   │       │   ├─> Cache HIT: Retorna niveles cached
   │       │   └─> Cache MISS: Continúa a paso 4
   │       │
   │       └─> 4. calculateLevels()
   │           │
   │           ├─> 5. Obtiene candles del MarketService
   │           │       └─> MarketService.getCandles(symbol, timeframe, 200)
   │           │
   │           ├─> 6. Ejecuta calculadores en paralelo
   │           │   ├─> PivotPointsCalculator
   │           │   │   ├─> calculateStandard()
   │           │   │   ├─> calculateFibonacci()
   │           │   │   └─> calculateCamarilla()
   │           │   │
   │           │   ├─> SwingLevelsCalculator
   │           │   │   ├─> findSwingHighs()
   │           │   │   └─> findSwingLows()
   │           │   │
   │           │   └─> VolumeProfileCalculator
   │           │       ├─> calculatePOC()
   │           │       └─> calculateValueArea()
   │           │
   │           ├─> 7. Agrupa niveles similares (confluencia)
   │           │       └─> groupSimilarLevels(tolerance: 0.5%)
   │           │
   │           ├─> 8. Calcula fortaleza para cada nivel
   │           │       └─> calculateStrength()
   │           │           ├─> countTouches()
   │           │           ├─> detectConfluence()
   │           │           ├─> findLastTouch()
   │           │           ├─> calculateDistance()
   │           │           └─> evaluateStatus()
   │           │
   │           ├─> 9. Filtra por fortaleza mínima (si se especificó)
   │           │
   │           ├─> 10. Ordena por fortaleza (descendente)
   │           │
   │           └─> 11. Guarda en caché
   │                   └─> levelCache.set(key, {data, timestamp, ttl})
   │
   └─> 12. Retorna niveles al cliente
           └─> Response: {symbol, timeframe, count, levels[]}
```

### Ejemplo de Ejecución Real

Para BTC-USDT en timeframe 1h:

1. **Obtener 200 candles** de 1h (últimas ~8 días)
2. **Calcular Pivot Points**:
   - Standard: 3 soportes + 3 resistencias = 6 niveles
   - Fibonacci: 3 soportes + 3 resistencias = 6 niveles
   - Camarilla: 4 soportes + 4 resistencias = 8 niveles
   - **Subtotal**: 20 niveles
3. **Calcular Swing Levels**:
   - Swing Highs detectados: ~8 niveles
   - Swing Lows detectados: ~8 niveles
   - **Subtotal**: 16 niveles
4. **Calcular Volume Profile**:
   - POC: 1 nivel
   - VAH: 1 nivel
   - VAL: 1 nivel
   - **Subtotal**: 3 niveles
5. **Total inicial**: 39 niveles
6. **Agrupar similares** (tolerance 0.5%):
   - Niveles agrupados: ~25 niveles únicos
7. **Calcular strength** para cada nivel:
   - Fuerte (70-100): ~5 niveles
   - Medio (40-69): ~12 niveles
   - Débil (0-39): ~8 niveles
8. **Resultado final**: 25 niveles ordenados por fortaleza

---

## Optimizaciones y Consideraciones

### Rendimiento

1. **Caché Inteligente**: TTL de 60 segundos reduce cálculos repetitivos
2. **Ejecución Paralela**: Calculadores independientes corren en paralelo
3. **Filtrado Temprano**: Filtros de fortaleza se aplican antes de retornar
4. **Agrupación Eficiente**: Algoritmo O(n log n) para agrupar niveles

### Escalabilidad

- **Stateless**: El servicio no mantiene estado, fácil de escalar horizontalmente
- **Caché por Instancia**: Cada instancia tiene su propio caché (puede mejorarse con Redis)
- **Rate Limiting**: Controlado por el servicio de Market Data

### Precisión vs Performance

**Trade-offs actuales**:
- 200 candles: Balance entre precisión histórica y velocidad
- Tolerance 0.5%: Agrupa niveles cercanos sin perder detalle
- 50 bins para Volume Profile: Suficiente resolución sin overhead

### Futuras Mejoras

1. **Caché Distribuido**: Migrar a Redis para compartir caché entre instancias
2. **Websockets**: Actualización en tiempo real de niveles
3. **Machine Learning**: Mejorar scoring con modelos predictivos
4. **Más Calculadores**: Fibonacci Retracement, Ichimoku, etc.
5. **Backtesting**: Validar efectividad histórica de niveles

---

## Referencias de Código

### Archivos Principales

- **Service**: `backend/src/modules/support-resistance/support-resistance.service.ts`
- **Controller**: `backend/src/modules/support-resistance/support-resistance.controller.ts`
- **Pivot Calculator**: `backend/src/modules/support-resistance/calculators/pivot-points.calculator.ts`
- **Swing Calculator**: `backend/src/modules/support-resistance/calculators/swing-levels.calculator.ts`
- **Volume Calculator**: `backend/src/modules/support-resistance/calculators/volume-profile.calculator.ts`

### Puntos Clave en el Código

- Método principal de cálculo: `support-resistance.service.ts:109-196`
- Sistema de scoring: `support-resistance.service.ts:198-244`
- Agrupación de niveles: `swing-levels.calculator.ts:150-178`
- Construcción de Volume Profile: `volume-profile.calculator.ts:91-125`

---

## Conclusión

El módulo de Support & Resistance implementa un sistema robusto y escalable para identificar niveles clave de precio. La combinación de múltiples algoritmos, el sistema de scoring inteligente, y la gestión eficiente de caché proporcionan resultados precisos y en tiempo real para estrategias de trading.

**Próximo paso**: Fase 3 - Detección de Divergencias en indicadores técnicos (RSI, MACD).
