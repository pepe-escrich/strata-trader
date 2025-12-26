# Levels Viewer - Documentación Frontend (Fase 2)

## Índice

1. [Visión General](#visión-general)
2. [Componentes](#componentes)
3. [Servicios y Modelos](#servicios-y-modelos)
4. [Flujo de Datos](#flujo-de-datos)
5. [UI/UX Patterns](#uiux-patterns)
6. [Integración con PrimeNG v21](#integración-con-primeng-v21)

---

## Visión General

El frontend de Support & Resistance proporciona dos vistas principales:

1. **Dashboard**: Vista general con niveles S/R cercanos al precio actual de BTC-USDT
2. **Levels Viewer**: Vista detallada con filtros, tabs y análisis completo

### Tecnologías Utilizadas

- **Angular 21**: Framework standalone components
- **PrimeNG v21**: Componentes UI (Select, Table, Tabs, Tags, Cards)
- **Tailwind CSS v3**: Utilidades de estilo
- **RxJS**: Programación reactiva
- **Axios**: Cliente HTTP (via ApiService)

---

## Componentes

### 1. Dashboard Component

**Ubicación**: `frontend/src/app/features/dashboard/dashboard.ts`

#### Responsabilidades

1. Mostrar precios en vivo de criptomonedas principales
2. Mostrar niveles S/R cercanos al precio actual de BTC-USDT
3. Auto-refresh cada 5 segundos (tickers) y 30 segundos (niveles)
4. Navegación a vista detallada de niveles

#### Estructura de Datos

```typescript
export class Dashboard implements OnInit, OnDestroy {
  // Datos de mercado
  tickers: Ticker[] = [];
  nearbyLevels: Level[] = [];

  // Estados UI
  loading = true;
  levelsLoading = false;
  error: string | null = null;

  // Auto-refresh
  private refreshInterval: any;
}
```

#### Lógica de Auto-Refresh

```typescript
// Ubicación: dashboard.ts:38-50

async ngOnInit() {
  await this.loadTickers();
  await this.loadNearbyLevels();

  // Auto-refresh inteligente
  this.refreshInterval = setInterval(() => {
    this.loadTickers(); // Cada 5 segundos

    // Niveles cada 30 segundos (cada 6ta iteración)
    const iterations = Math.floor(Date.now() / 5000);
    if (iterations % 6 === 0) {
      this.loadNearbyLevels();
    }
  }, 5000);
}
```

**Razón**: Los niveles S/R no cambian tan frecuentemente como los precios, optimizando llamadas a API.

#### Carga de Niveles Cercanos

```typescript
// Ubicación: dashboard.ts:97-108

async loadNearbyLevels() {
  try {
    this.levelsLoading = true;
    const symbol = 'BTC-USDT';

    // Obtiene niveles dentro del 2% del precio actual
    const response = await this.apiService.getNearbyLevels(symbol, '1h', 2);

    // Limita a 5 niveles más relevantes
    this.nearbyLevels = response.levels.slice(0, 5);
  } catch (error: any) {
    console.error('Error loading nearby levels:', error);
  } finally {
    this.levelsLoading = false;
  }
}
```

#### Template - Vista de Niveles Cercanos

```html
<!-- Ubicación: dashboard.html:69-138 -->

<p-card header="BTC-USDT - Nearby Support & Resistance">
  <div *ngIf="!levelsLoading && nearbyLevels.length > 0">
    <div class="grid">
      <div *ngFor="let level of nearbyLevels" class="col-12 md:col-6 lg:col-4">
        <div
          class="p-3 border-round"
          [class.bg-green-50]="level.type === 'SUPPORT'"
          [class.bg-red-50]="level.type === 'RESISTANCE'"
        >
          <!-- Badge de tipo -->
          <p-tag
            [severity]="getTypeColor(level.type)"
            [value]="level.type"
          />

          <!-- Precio del nivel -->
          <div class="text-2xl font-bold mb-1">
            {{ formatNumber(level.price, 2) }}
          </div>

          <!-- Fortaleza -->
          <div class="flex justify-content-between align-items-center text-sm">
            <span class="text-600">Strength:</span>
            <p-tag
              [severity]="getStrengthColor(level.strength)"
              [value]="level.strength.toString()"
            />
          </div>

          <!-- Toques -->
          <div class="text-sm mt-1">
            <span class="text-600">Touches:</span>
            <span class="font-semibold">{{ level.touches }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Estados de carga y vacío -->
  <div *ngIf="levelsLoading" class="text-center p-5">
    <i class="pi pi-spin pi-spinner mr-2"></i>
    Loading nearby levels...
  </div>

  <div *ngIf="!levelsLoading && nearbyLevels.length === 0">
    <i class="pi pi-info-circle mr-2"></i>
    No nearby levels found
  </div>
</p-card>
```

---

### 2. Levels Viewer Component

**Ubicación**: `frontend/src/app/features/levels-viewer/levels-viewer.ts`

#### Responsabilidades

1. Vista completa de todos los niveles S/R
2. Filtros por símbolo, timeframe y fortaleza mínima
3. Dos tabs: "All Levels" y "Strength Analysis"
4. Recálculo manual de niveles
5. Auto-refresh cada 30 segundos

#### Estructura de Datos

```typescript
export class LevelsViewer implements OnInit, OnDestroy {
  // Datos
  levels: Level[] = [];
  currentPrice = 0;
  strengthAnalysis: StrengthAnalysisResponse | null = null;

  // UI State
  loading = true;
  error: string | null = null;
  activeTab = 'all'; // 'all' | 'analysis'

  // Filtros
  selectedSymbol = 'BTC-USDT';
  selectedTimeframe = '1h';
  minStrength = 0;

  // Opciones de filtros
  symbolOptions: SymbolOption[] = [
    { label: 'BTC-USDT', value: 'BTC-USDT' },
    { label: 'ETH-USDT', value: 'ETH-USDT' },
    // ...
  ];

  timeframeOptions: TimeframeOption[] = [
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];
}
```

#### Carga de Niveles con Filtros

```typescript
// Ubicación: levels-viewer.ts:97-120

async loadLevels() {
  try {
    this.loading = true;
    this.error = null;

    // Llama al API con filtros aplicados
    const response = await this.apiService.getLevels(
      this.selectedSymbol,
      this.selectedTimeframe,
      this.minStrength || undefined // Solo envía si tiene valor
    );

    this.levels = response.levels;

    // Cargar análisis si está en ese tab
    if (this.activeTab === 'analysis') {
      await this.loadStrengthAnalysis();
    }
  } catch (error: any) {
    console.error('Error loading levels:', error);
    this.error = error.message || 'Failed to load support/resistance levels';
  } finally {
    this.loading = false;
  }
}
```

#### Recálculo Forzado

```typescript
// Ubicación: levels-viewer.ts:153-170

async forceRecalculate() {
  try {
    this.loading = true;
    this.error = null;

    // POST /api/levels/calculate - ignora caché
    await this.apiService.calculateLevels(
      this.selectedSymbol,
      [this.selectedTimeframe],
      this.minStrength || undefined
    );

    // Recargar niveles actualizados
    await this.loadLevels();
  } catch (error: any) {
    console.error('Error recalculating levels:', error);
    this.error = error.message || 'Failed to recalculate levels';
    this.loading = false;
  }
}
```

**Uso**: Cuando el usuario sospecha que el caché está desactualizado o quiere forzar un nuevo cálculo.

#### Helpers de Color (PrimeNG v21)

```typescript
// Ubicación: levels-viewer.ts:173-200

// Tipo estricto requerido por PrimeNG v21
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

getTypeColor(type: string): Severity {
  return type === 'SUPPORT' ? 'success' : 'danger';
}

getStrengthColor(strength: number): Severity {
  if (strength >= 70) return 'success';  // Verde - Fuerte
  if (strength >= 40) return 'warn';     // Naranja - Medio
  return 'secondary';                     // Gris - Débil
}

getStatusColor(status: string): Severity {
  switch (status) {
    case 'ACTIVE':  return 'info';      // Azul
    case 'TESTED':  return 'warn';      // Naranja
    case 'BROKEN':  return 'danger';    // Rojo
    default:        return 'secondary'; // Gris
  }
}
```

**Importante**: PrimeNG v21 requiere tipos estrictos. Usar `'warning'` en lugar de `'warn'` causa error de compilación.

#### Cálculo de Distancia al Precio

```typescript
// Ubicación: levels-viewer.ts:219-223

formatDistance(level: Level): string {
  const dist = this.getDistanceFromPrice(level);
  const sign = level.price > this.currentPrice ? '+' : '-';
  return `${sign}${this.formatNumber(dist.percent, 2)}%`;
}

// Ejemplo de salida: "+2.45%" o "-1.23%"
```

---

### 3. Template - Levels Viewer

#### Sección de Filtros

```html
<!-- Ubicación: levels-viewer.html:4-69 -->

<div class="filters-section mb-4">
  <div class="grid">
    <!-- Selector de Símbolo -->
    <div class="col-12 md:col-3">
      <label for="symbol" class="block mb-2 font-semibold">Symbol</label>
      <p-select
        inputId="symbol"
        [options]="symbolOptions"
        [(ngModel)]="selectedSymbol"
        (onChange)="onFilterChange()"
        [style]="{ width: '100%' }"
        placeholder="Select symbol"
        optionLabel="label"
        optionValue="value"
      />
    </div>

    <!-- Selector de Timeframe -->
    <div class="col-12 md:col-3">
      <label for="timeframe" class="block mb-2 font-semibold">Timeframe</label>
      <p-select
        inputId="timeframe"
        [options]="timeframeOptions"
        [(ngModel)]="selectedTimeframe"
        (onChange)="onFilterChange()"
        [style]="{ width: '100%' }"
        optionLabel="label"
        optionValue="value"
      />
    </div>

    <!-- Input de Fortaleza Mínima -->
    <div class="col-12 md:col-3">
      <label for="minStrength" class="block mb-2 font-semibold">Min Strength</label>
      <p-inputnumber
        inputId="minStrength"
        [(ngModel)]="minStrength"
        [min]="0"
        [max]="100"
        [step]="10"
        (onBlur)="onFilterChange()"
        placeholder="0-100"
      />
    </div>

    <!-- Botón de Recálculo -->
    <div class="col-12 md:col-3 flex align-items-end">
      <p-button
        icon="pi pi-refresh"
        label="Recalculate"
        (onClick)="forceRecalculate()"
        [loading]="loading"
        severity="primary"
      />
    </div>
  </div>

  <!-- Display de Precio Actual -->
  <div class="mt-3 p-3 bg-blue-50 border-round">
    <div class="flex justify-content-between align-items-center">
      <span class="font-semibold">Current Price:</span>
      <span class="text-2xl font-bold text-blue-600">
        {{ formatNumber(currentPrice, 2) }} USDT
      </span>
    </div>
  </div>
</div>
```

#### Tab de Todos los Niveles

```html
<!-- Ubicación: levels-viewer.html:72-170 -->

<p-tabs [(value)]="activeTab">
  <p-tablist>
    <p-tab value="all">All Levels</p-tab>
    <p-tab value="analysis">Strength Analysis</p-tab>
  </p-tablist>

  <p-tabpanels>
    <!-- Tab: All Levels -->
    <p-tabpanel value="all">
      <p-table
        [value]="levels"
        [loading]="loading"
        styleClass="p-datatable-striped"
        [sortField]="'strength'"
        [sortOrder]="-1"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="type">Type</th>
            <th pSortableColumn="price">Price</th>
            <th>Distance</th>
            <th pSortableColumn="strength">Strength</th>
            <th pSortableColumn="touches">Touches</th>
            <th>Method</th>
            <th>Status</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-level>
          <tr>
            <!-- Tipo (Support/Resistance) -->
            <td>
              <p-tag
                [severity]="getTypeColor(level.type)"
                [value]="level.type"
              />
            </td>

            <!-- Precio -->
            <td class="text-right font-semibold">
              {{ formatNumber(level.price, 2) }}
            </td>

            <!-- Distancia del precio actual -->
            <td class="text-right">
              <span [class]="level.price > currentPrice ? 'text-red-500' : 'text-green-500'">
                {{ formatDistance(level) }}
              </span>
            </td>

            <!-- Fortaleza con label -->
            <td class="text-right">
              <p-tag
                [severity]="getStrengthColor(level.strength)"
                [value]="level.strength + ' - ' + getStrengthLabel(level.strength)"
              />
            </td>

            <!-- Toques -->
            <td class="text-right">
              <span class="font-semibold">{{ level.touches }}</span>
            </td>

            <!-- Método de cálculo -->
            <td>
              <span class="text-sm">{{ getMethodLabel(level.method) }}</span>
            </td>

            <!-- Estado -->
            <td>
              <p-tag
                [severity]="getStatusColor(level.status)"
                [value]="level.status"
                [rounded]="true"
              />
            </td>
          </tr>
        </ng-template>

        <!-- Mensaje cuando no hay datos -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center">
              <div *ngIf="error" class="text-red-500">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                {{ error }}
              </div>
              <div *ngIf="!error && !loading">
                <i class="pi pi-info-circle mr-2"></i>
                No levels found for the selected criteria
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>
```

#### Tab de Análisis de Fortaleza

```html
<!-- Ubicación: levels-viewer.html:173-257 -->

<p-tabpanel value="analysis">
  <div *ngIf="strengthAnalysis" class="strength-analysis">
    <!-- Resumen por Fortaleza -->
    <div class="grid mb-4">
      <!-- Niveles Fuertes -->
      <div class="col-12 md:col-4">
        <div class="p-3 bg-green-50 border-round">
          <div class="text-sm text-600 mb-1">Strong Levels</div>
          <div class="text-2xl font-bold text-green-600">
            {{ strengthAnalysis.byStrength.strong.count }}
          </div>
        </div>
      </div>

      <!-- Niveles Medios -->
      <div class="col-12 md:col-4">
        <div class="p-3 bg-orange-50 border-round">
          <div class="text-sm text-600 mb-1">Medium Levels</div>
          <div class="text-2xl font-bold text-orange-600">
            {{ strengthAnalysis.byStrength.medium.count }}
          </div>
        </div>
      </div>

      <!-- Niveles Débiles -->
      <div class="col-12 md:col-4">
        <div class="p-3 bg-gray-50 border-round">
          <div class="text-sm text-600 mb-1">Weak Levels</div>
          <div class="text-2xl font-bold text-gray-600">
            {{ strengthAnalysis.byStrength.weak.count }}
          </div>
        </div>
      </div>
    </div>

    <!-- Soporte vs Resistencia -->
    <div class="grid">
      <!-- Soportes -->
      <div class="col-12 md:col-6">
        <p-card header="Support Levels">
          <div class="mb-3">
            <span class="text-2xl font-bold text-green-600">
              {{ strengthAnalysis.byType.supports.count }}
            </span>
            <span class="ml-2 text-600">total supports</span>
          </div>

          <!-- Top 5 soportes -->
          <div class="level-list">
            <div
              *ngFor="let level of getSortedSupports().slice(0, 5)"
              class="flex justify-content-between align-items-center mb-2 p-2 border-round hover:bg-green-50"
            >
              <span class="font-semibold">{{ formatNumber(level.price, 2) }}</span>
              <p-tag
                [severity]="getStrengthColor(level.strength)"
                [value]="level.strength.toString()"
              />
            </div>
          </div>
        </p-card>
      </div>

      <!-- Resistencias -->
      <div class="col-12 md:col-6">
        <p-card header="Resistance Levels">
          <div class="mb-3">
            <span class="text-2xl font-bold text-red-600">
              {{ strengthAnalysis.byType.resistances.count }}
            </span>
            <span class="ml-2 text-600">total resistances</span>
          </div>

          <!-- Top 5 resistencias -->
          <div class="level-list">
            <div
              *ngFor="let level of getSortedResistances().slice(0, 5)"
              class="flex justify-content-between align-items-center mb-2 p-2 border-round hover:bg-red-50"
            >
              <span class="font-semibold">{{ formatNumber(level.price, 2) }}</span>
              <p-tag
                [severity]="getStrengthColor(level.strength)"
                [value]="level.strength.toString()"
              />
            </div>
          </div>
        </p-card>
      </div>
    </div>
  </div>
</p-tabpanel>
```

---

## Servicios y Modelos

### API Service - Métodos S/R

**Ubicación**: `frontend/src/app/core/services/api.service.ts:101-167`

```typescript
// Obtener niveles con filtros
async getLevels(
  symbol: string,
  timeframe: string = '1h',
  minStrength?: number
): Promise<LevelsResponse> {
  const params: any = { timeframe };
  if (minStrength) params.minStrength = minStrength;

  const response = await this.api.get(`/levels/${symbol}`, { params });
  return response.data;
}

// Forzar recálculo
async calculateLevels(
  symbol: string,
  timeframes: string[] = ['1h'],
  minStrength?: number
): Promise<any> {
  const response = await this.api.post('/levels/calculate', {
    symbol,
    timeframes,
    minStrength,
  });
  return response.data;
}

// Niveles cercanos
async getNearbyLevels(
  symbol: string,
  timeframe: string = '1h',
  distancePercent: number = 0.5
): Promise<LevelsResponse> {
  const response = await this.api.get(`/levels/nearby/${symbol}`, {
    params: { timeframe, distancePercent },
  });
  return response.data;
}

// Análisis de fortaleza
async getLevelStrength(
  symbol: string,
  timeframe: string = '1h'
): Promise<StrengthAnalysisResponse> {
  const response = await this.api.get(`/levels/strength/${symbol}`, {
    params: { timeframe },
  });
  return response.data;
}

// Multi-timeframe
async getMultiTimeframeLevels(
  symbol: string,
  timeframes?: string[]
): Promise<MultiTimeframeLevelsResponse> {
  const params: any = {};
  if (timeframes) params.timeframes = timeframes.join(',');

  const response = await this.api.get(`/levels/multi-timeframe/${symbol}`, { params });
  return response.data;
}

// Limpiar caché
async clearLevelsCache(symbol?: string): Promise<void> {
  if (symbol) {
    await this.api.delete(`/levels/cache/${symbol}`);
  } else {
    await this.api.delete('/levels/cache');
  }
}
```

### Modelos TypeScript

**Ubicación**: `frontend/src/app/core/models/market.model.ts:60-119`

```typescript
export interface Level {
  id: string;
  symbol: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  timeframe: string;
  method: CalculationMethod;
  strength: number; // 0-100
  touches: number;
  lastTouch?: Date;
  status: LevelStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum CalculationMethod {
  PIVOT_STANDARD = 'PIVOT_STANDARD',
  PIVOT_FIBONACCI = 'PIVOT_FIBONACCI',
  PIVOT_CAMARILLA = 'PIVOT_CAMARILLA',
  SWING_HIGH_LOW = 'SWING_HIGH_LOW',
  VOLUME_PROFILE_POC = 'VOLUME_PROFILE_POC',
  VOLUME_PROFILE_VAH = 'VOLUME_PROFILE_VAH',
  VOLUME_PROFILE_VAL = 'VOLUME_PROFILE_VAL',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT',
}

export enum LevelStatus {
  ACTIVE = 'ACTIVE',
  BROKEN = 'BROKEN',
  TESTED = 'TESTED',
}

export interface LevelsResponse {
  symbol: string;
  timeframe: string;
  count: number;
  levels: Level[];
}

export interface StrengthAnalysisResponse {
  symbol: string;
  timeframe: string;
  total: number;
  byStrength: {
    strong: { count: number; levels: Level[] };
    medium: { count: number; levels: Level[] };
    weak: { count: number; levels: Level[] };
  };
  byType: {
    supports: { count: number; levels: Level[] };
    resistances: { count: number; levels: Level[] };
  };
}
```

---

## Flujo de Datos

### Flujo de Carga Inicial

```
1. Usuario navega a /levels
   │
   ├─> 2. LevelsViewer.ngOnInit()
   │       └─> loadData()
   │           ├─> loadLevels()
   │           └─> loadCurrentPrice()
   │
   ├─> 3. ApiService.getLevels()
   │       └─> GET /api/levels/BTC-USDT?timeframe=1h
   │
   ├─> 4. Backend retorna niveles
   │       └─> {symbol, timeframe, count, levels[]}
   │
   ├─> 5. Component recibe y procesa datos
   │       ├─> this.levels = response.levels
   │       └─> this.currentPrice = ticker.price
   │
   └─> 6. Template renderiza tabla
           └─> p-table con niveles ordenados por strength
```

### Flujo de Cambio de Filtros

```
1. Usuario cambia selector de timeframe: 1h → 4h
   │
   ├─> 2. (onChange)="onFilterChange()"
   │       └─> levels-viewer.ts:142-144
   │
   ├─> 3. loadLevels() se ejecuta nuevamente
   │       └─> this.selectedTimeframe = '4h'
   │
   ├─> 4. ApiService.getLevels('BTC-USDT', '4h', minStrength)
   │       └─> GET /api/levels/BTC-USDT?timeframe=4h&minStrength=50
   │
   ├─> 5. Backend retorna niveles de 4h
   │       └─> Diferentes niveles basados en candles de 4h
   │
   └─> 6. UI se actualiza automáticamente
           └─> Angular change detection
```

### Flujo de Recálculo Forzado

```
1. Usuario hace clic en botón "Recalculate"
   │
   ├─> 2. forceRecalculate()
   │       └─> this.loading = true
   │
   ├─> 3. ApiService.calculateLevels()
   │       └─> POST /api/levels/calculate
   │           └─> Body: {symbol, timeframes, minStrength}
   │
   ├─> 4. Backend ignora caché y recalcula
   │       ├─> Obtiene candles frescos
   │       ├─> Ejecuta todos los calculadores
   │       └─> Retorna niveles nuevos
   │
   ├─> 5. loadLevels() para obtener datos actualizados
   │       └─> GET /api/levels/...
   │
   └─> 6. UI muestra niveles recalculados
           └─> this.loading = false
```

---

## UI/UX Patterns

### 1. Loading States

```typescript
// Spinner mientras carga
<div *ngIf="loading" class="text-center p-5">
  <i class="pi pi-spin pi-spinner mr-2"></i>
  Loading levels...
</div>

// Botón con loading
<p-button
  [loading]="loading"
  label="Recalculate"
/>
```

### 2. Empty States

```typescript
// Sin datos
<div *ngIf="!loading && levels.length === 0">
  <i class="pi pi-info-circle mr-2"></i>
  No levels found for the selected criteria
</div>
```

### 3. Error States

```typescript
// Error message
<div *ngIf="error" class="text-red-500">
  <i class="pi pi-exclamation-triangle mr-2"></i>
  {{ error }}
</div>
```

### 4. Color Coding

**Niveles**:
- 🟢 Verde (`bg-green-50`): Support
- 🔴 Rojo (`bg-red-50`): Resistance

**Fortaleza**:
- 🟢 Verde (`success`): Fuerte (70-100)
- 🟠 Naranja (`warn`): Medio (40-69)
- ⚪ Gris (`secondary`): Débil (0-39)

**Distancia**:
- 🟢 Verde: Nivel por debajo del precio
- 🔴 Rojo: Nivel por encima del precio

### 5. Responsive Design

```scss
// Ubicación: levels-viewer.scss

@media (max-width: 768px) {
  .levels-viewer-container {
    padding: 1rem !important;

    .filters-section .col-12 {
      margin-bottom: 1rem;
    }
  }
}
```

**Grid de PrimeNG**:
- Desktop: 4 columnas (`col-12 md:col-3`)
- Tablet: 2 columnas (`col-12 md:col-6`)
- Mobile: 1 columna (`col-12`)

---

## Integración con PrimeNG v21

### Cambios Clave vs v20

#### 1. Componente Select (antes Dropdown)

**Antes (v20)**:
```html
<p-dropdown
  [options]="options"
  [(ngModel)]="selected"
></p-dropdown>
```

**Ahora (v21)**:
```html
<p-select
  [options]="options"
  [(ngModel)]="selected"
  optionLabel="label"
  optionValue="value"
/>
```

**Cambios**:
- Nombre: `p-dropdown` → `p-select`
- Import: `DropdownModule` → `Select` (standalone component)
- Requiere `optionLabel` y `optionValue` explícitos

#### 2. InputNumber

**Antes (v20)**:
```html
<p-inputNumber [(ngModel)]="value"></p-inputNumber>
```

**Ahora (v21)**:
```html
<p-inputnumber [(ngModel)]="value" />
```

**Cambios**:
- Capitalización: `p-inputNumber` → `p-inputnumber` (minúsculas)
- Import: `InputNumberModule` → `InputNumber`

#### 3. Tabs (Cambio Mayor)

**Antes (v20)**:
```html
<p-tabView [(activeIndex)]="activeTabIndex">
  <p-tabPanel header="Tab 1">Content 1</p-tabPanel>
  <p-tabPanel header="Tab 2">Content 2</p-tabPanel>
</p-tabView>
```

**Ahora (v21)**:
```html
<p-tabs [(value)]="activeTab">
  <p-tablist>
    <p-tab value="tab1">Tab 1</p-tab>
    <p-tab value="tab2">Tab 2</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="tab1">Content 1</p-tabpanel>
    <p-tabpanel value="tab2">Content 2</p-tabpanel>
  </p-tabpanels>
</p-tabs>
```

**Cambios**:
- Estructura completamente nueva
- `activeIndex: number` → `value: string`
- Requiere estructura `tablist` + `tabpanels`
- Imports: `TabViewModule` → `Tabs, TabList, Tab, TabPanels, TabPanel`

#### 4. Tags - Severity Types

**Tipos estrictos en v21**:
```typescript
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

// ❌ NO válido en v21
getColor(): string {
  return 'warning'; // Error: Type 'string' not assignable
}

// ✅ Válido en v21
getColor(): Severity {
  return 'warn'; // Correcto
}
```

**Nota importante**: `'warning'` → `'warn'` (cambio de nombre)

#### 5. Standalone Components

Todos los componentes de PrimeNG v21 son standalone:

```typescript
// ❌ NO usar módulos
imports: [DropdownModule, InputNumberModule]

// ✅ Usar componentes standalone
imports: [Select, InputNumber, Tabs, TabPanel, ...]
```

### Imports Requeridos

```typescript
// Ubicación: levels-viewer.ts:1-40

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Tabs, TabPanels, TabPanel, TabList, Tab } from 'primeng/tabs';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    Select,
    InputNumber,
    Tabs,
    TabPanels,
    TabPanel,
    TabList,
    Tab,
  ],
})
```

---

## Conclusión

El frontend de Support & Resistance proporciona una interfaz intuitiva y responsiva para visualizar y analizar niveles clave de precio. La integración con PrimeNG v21 ofrece componentes modernos y tipado estricto, mejorando la confiabilidad del código.

**Próximo paso**: Implementar gráficos visuales con Chart.js o TradingView para mostrar niveles en el contexto del precio.
