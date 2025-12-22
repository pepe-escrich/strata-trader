# Componentes del Frontend - Strata Trader

## 🎨 Estructura de Componentes Angular

---

## 📐 Layout Components

### 1. App Shell
```
app/
├── app.component.ts           # Componente raíz
├── app.component.html
├── app.component.scss
└── layout/
    ├── header/
    ├── sidebar/
    └── footer/
```

#### Header Component
```typescript
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  accountBalance$: Observable<number>;
  unrealizedPnL$: Observable<number>;
  notifications$: Observable<Notification[]>;

  toggleSidebar(): void;
  openSettings(): void;
  logout(): void;
}
```

**Template Features:**
- Logo y nombre de la app
- Balance de cuenta en tiempo real
- P&L no realizado
- Centro de notificaciones
- Menú de usuario
- Toggle sidebar (mobile)

#### Sidebar Component
```typescript
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'Órdenes', icon: 'pi pi-shopping-cart', routerLink: '/orders' },
    { label: 'Alertas', icon: 'pi pi-bell', routerLink: '/alerts' },
    { label: 'Visor de Datos', icon: 'pi pi-chart-line', routerLink: '/data-viewer' },
    { label: 'Backtesting', icon: 'pi pi-replay', routerLink: '/backtesting' },
    { label: 'Historial', icon: 'pi pi-history', routerLink: '/history' },
  ];

  activeItem: MenuItem;
  collapsed: boolean = false;
}
```

**PrimeNG Components Used:**
- `p-menu` o `p-panelMenu` para navegación
- `p-badge` para contadores
- Iconos de PrimeIcons

---

## 📊 Dashboard Module

### Estructura
```
features/dashboard/
├── dashboard.module.ts
├── dashboard.component.ts
├── dashboard.component.html
├── dashboard.component.scss
└── components/
    ├── market-overview/
    ├── active-positions/
    ├── recent-signals/
    ├── performance-summary/
    └── quick-actions/
```

### Dashboard Component (Principal)
```typescript
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  marketData$: Observable<MarketSummary[]>;
  activePositions$: Observable<Position[]>;
  recentSignals$: Observable<Signal[]>;
  metrics$: Observable<DailyMetrics>;

  ngOnInit(): void {
    this.loadDashboardData();
    this.subscribeToRealTimeUpdates();
  }

  refresh(): void;
}
```

**Layout (Grid):**
```html
<div class="grid">
  <!-- Row 1: Métricas principales -->
  <div class="col-12 md:col-3">
    <app-metric-card [title]="'Balance'" [value]="balance$ | async" />
  </div>
  <div class="col-12 md:col-3">
    <app-metric-card [title]="'P&L Hoy'" [value]="pnlToday$ | async" />
  </div>
  <div class="col-12 md:col-3">
    <app-metric-card [title]="'Posiciones'" [value]="openPositions$ | async" />
  </div>
  <div class="col-12 md:col-3">
    <app-metric-card [title]="'Win Rate'" [value]="winRate$ | async" />
  </div>

  <!-- Row 2: Gráficos y listas -->
  <div class="col-12 lg:col-8">
    <app-market-overview />
  </div>
  <div class="col-12 lg:col-4">
    <app-recent-signals />
  </div>

  <!-- Row 3: Posiciones y acciones -->
  <div class="col-12 lg:col-8">
    <app-active-positions />
  </div>
  <div class="col-12 lg:col-4">
    <app-quick-actions />
  </div>
</div>
```

### Market Overview Component
```typescript
@Component({
  selector: 'app-market-overview',
  templateUrl: './market-overview.component.html'
})
export class MarketOverviewComponent {
  symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  marketData: MarketData[] = [];

  columns = [
    { field: 'symbol', header: 'Par' },
    { field: 'price', header: 'Precio' },
    { field: 'change24h', header: '24h %' },
    { field: 'volume', header: 'Volumen' },
  ];
}
```

**PrimeNG Components:**
- `p-card` para contenedor
- `p-table` para tabla de mercado
- `p-tag` para cambios positivos/negativos
- `p-chart` para mini gráficos

### Active Positions Component
```typescript
@Component({
  selector: 'app-active-positions',
  templateUrl: './active-positions.component.html'
})
export class ActivePositionsComponent {
  positions$: Observable<Position[]>;

  columns = [
    { field: 'symbol', header: 'Par' },
    { field: 'side', header: 'Tipo' },
    { field: 'entryPrice', header: 'Entrada' },
    { field: 'currentPrice', header: 'Actual' },
    { field: 'pnl', header: 'P&L' },
    { field: 'pnlPercent', header: 'P&L %' },
  ];

  closePosition(position: Position): void;
  editStopLoss(position: Position): void;
}
```

**PrimeNG Components:**
- `p-table` con selección
- `p-button` para acciones
- `p-tag` para side (LONG verde, SHORT rojo)
- `p-progressBar` para P&L visual

### Recent Signals Component
```typescript
@Component({
  selector: 'app-recent-signals',
  templateUrl: './recent-signals.component.html'
})
export class RecentSignalsComponent {
  signals$: Observable<Signal[]>;

  openOrderDialog(signal: Signal): void;
  dismissSignal(signal: Signal): void;
}
```

**Template:**
```html
<p-card header="Señales Recientes">
  <p-timeline [value]="signals$ | async">
    <ng-template pTemplate="content" let-signal>
      <div class="signal-item">
        <div class="signal-header">
          <span class="symbol">{{ signal.symbol }}</span>
          <p-tag [value]="signal.type" [severity]="getSeverity(signal)" />
        </div>
        <div class="signal-details">
          <p>{{ signal.description }}</p>
          <small>{{ signal.timestamp | date:'short' }}</small>
        </div>
        <div class="signal-actions">
          <p-button label="Crear Orden" (onClick)="openOrderDialog(signal)" />
          <p-button label="Descartar" [text]="true" (onClick)="dismissSignal(signal)" />
        </div>
      </div>
    </ng-template>
  </p-timeline>
</p-card>
```

---

## 📝 Orders Module

### Estructura
```
features/orders/
├── orders.module.ts
├── orders-routing.module.ts
└── components/
    ├── orders-list/
    ├── order-create/
    ├── order-detail/
    └── risk-calculator/
```

### Orders List Component
```typescript
@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html'
})
export class OrdersListComponent {
  orders$: Observable<Order[]>;
  selectedOrders: Order[] = [];

  filters = {
    status: null,
    symbol: null,
    side: null,
  };

  columns = [
    { field: 'symbol', header: 'Par', sortable: true },
    { field: 'side', header: 'Tipo' },
    { field: 'status', header: 'Estado' },
    { field: 'entryPrice', header: 'Precio Entrada' },
    { field: 'quantity', header: 'Cantidad' },
    { field: 'stopLoss', header: 'Stop Loss' },
    { field: 'takeProfit', header: 'Take Profit' },
    { field: 'createdAt', header: 'Fecha', sortable: true },
  ];

  createOrder(): void;
  editOrder(order: Order): void;
  cancelOrder(order: Order): void;
  viewDetails(order: Order): void;
}
```

**PrimeNG Components:**
- `p-table` con paginación, sorting y filtrado
- `p-multiSelect` para filtros
- `p-toolbar` con botones de acción
- `p-confirmDialog` para confirmaciones
- `p-contextMenu` para menú contextual

### Order Create Component
```typescript
@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html'
})
export class OrderCreateComponent implements OnInit {
  orderForm: FormGroup;

  symbols: SelectItem[];
  currentPrice: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number[];

  riskCalculation: RiskCalculation;

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private riskManager: RiskManagerService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.orderForm = this.fb.group({
      symbol: ['', Validators.required],
      side: ['LONG', Validators.required],
      type: ['MARKET', Validators.required],
      entryPrice: [0],
      riskPercent: [1, [Validators.required, Validators.min(0.1), Validators.max(5)]],
      stopLoss: [0, Validators.required],
      takeProfit1: [0],
      takeProfit2: [0],
      leverage: [1, [Validators.required, Validators.min(1), Validators.max(125)]],
      quantity: [0],
    });

    // Auto-cálculo cuando cambian valores
    this.orderForm.valueChanges.subscribe(() => {
      this.calculateRisk();
    });
  }

  onSymbolChange(): void {
    // Cargar precio actual
    // Calcular sugerencias
  }

  calculateRisk(): void {
    const formValue = this.orderForm.value;
    this.riskCalculation = this.riskManager.calculate(formValue);
  }

  useSuggestedStopLoss(): void {
    this.orderForm.patchValue({ stopLoss: this.suggestedStopLoss });
  }

  submitOrder(): void {
    if (this.orderForm.valid) {
      this.ordersService.createOrder(this.orderForm.value).subscribe(
        (order) => {
          // Mostrar confirmación
          // Redirigir o limpiar form
        }
      );
    }
  }
}
```

**Template Structure:**
```html
<p-card header="Crear Nueva Orden">
  <form [formGroup]="orderForm">
    <!-- Paso 1: Configuración Básica -->
    <p-panel header="Configuración Básica">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label>Par de Trading</label>
          <p-dropdown
            formControlName="symbol"
            [options]="symbols"
            (onChange)="onSymbolChange()" />
        </div>
        <div class="col-12 md:col-3">
          <label>Dirección</label>
          <p-selectButton
            formControlName="side"
            [options]="[
              {label: 'LONG', value: 'LONG'},
              {label: 'SHORT', value: 'SHORT'}
            ]" />
        </div>
        <div class="col-12 md:col-3">
          <label>Tipo</label>
          <p-dropdown
            formControlName="type"
            [options]="orderTypes" />
        </div>
      </div>
    </p-panel>

    <!-- Paso 2: Gestión de Riesgo -->
    <p-panel header="Gestión de Riesgo">
      <div class="grid">
        <div class="col-12 md:col-4">
          <label>% Riesgo</label>
          <p-inputNumber
            formControlName="riskPercent"
            [min]="0.1"
            [max]="5"
            suffix="%" />
        </div>
        <div class="col-12 md:col-4">
          <label>Apalancamiento</label>
          <p-slider formControlName="leverage" [min]="1" [max]="125" />
          <span>{{ orderForm.get('leverage').value }}x</span>
        </div>
        <div class="col-12 md:col-4">
          <label>Stop Loss</label>
          <div class="p-inputgroup">
            <p-inputNumber formControlName="stopLoss" />
            <button
              pButton
              icon="pi pi-check"
              (click)="useSuggestedStopLoss()"
              pTooltip="Usar sugerido: {{ suggestedStopLoss }}" />
          </div>
        </div>
      </div>
    </p-panel>

    <!-- Paso 3: Take Profit -->
    <p-panel header="Objetivos de Ganancia">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label>Take Profit 1 (50%)</label>
          <p-inputNumber formControlName="takeProfit1" />
        </div>
        <div class="col-12 md:col-6">
          <label>Take Profit 2 (50%)</label>
          <p-inputNumber formControlName="takeProfit2" />
        </div>
      </div>
    </p-panel>

    <!-- Resumen de Riesgo -->
    <app-risk-calculator [calculation]="riskCalculation" />

    <!-- Acciones -->
    <div class="flex justify-content-end gap-2 mt-3">
      <p-button label="Cancelar" severity="secondary" [outlined]="true" />
      <p-button
        label="Crear Orden"
        (onClick)="submitOrder()"
        [disabled]="!orderForm.valid" />
    </div>
  </form>
</p-card>
```

### Risk Calculator Component
```typescript
@Component({
  selector: 'app-risk-calculator',
  templateUrl: './risk-calculator.component.html'
})
export class RiskCalculatorComponent {
  @Input() calculation: RiskCalculation;

  getRiskColor(): string {
    if (this.calculation.riskPercent > 3) return 'danger';
    if (this.calculation.riskPercent > 1.5) return 'warning';
    return 'success';
  }
}
```

**Template:**
```html
<p-card header="Análisis de Riesgo" *ngIf="calculation">
  <div class="grid">
    <div class="col-6 md:col-3">
      <div class="stat">
        <label>Monto en Riesgo</label>
        <h3>{{ calculation.riskAmount | currency:'USD' }}</h3>
      </div>
    </div>
    <div class="col-6 md:col-3">
      <div class="stat">
        <label>% de Capital</label>
        <p-tag
          [value]="calculation.riskPercent + '%'"
          [severity]="getRiskColor()" />
      </div>
    </div>
    <div class="col-6 md:col-3">
      <div class="stat">
        <label>Risk/Reward</label>
        <h3>1:{{ calculation.rewardRatio }}</h3>
      </div>
    </div>
    <div class="col-6 md:col-3">
      <div class="stat">
        <label>Tamaño Posición</label>
        <h3>{{ calculation.positionSize }}</h3>
      </div>
    </div>
  </div>

  <p-messages
    *ngIf="calculation.warnings.length > 0"
    [(value)]="calculation.warnings"
    [closable]="false" />
</p-card>
```

---

## 🔔 Alerts Module

### Structure
```
features/alerts/
├── alerts.module.ts
└── components/
    ├── alerts-list/
    ├── alert-create/
    └── alert-config/
```

### Alerts List Component
```typescript
@Component({
  selector: 'app-alerts-list',
  templateUrl: './alerts-list.component.html'
})
export class AlertsListComponent {
  alerts$: Observable<Alert[]>;

  columns = [
    { field: 'name', header: 'Nombre' },
    { field: 'symbol', header: 'Par' },
    { field: 'type', header: 'Tipo' },
    { field: 'active', header: 'Estado' },
    { field: 'triggerCount', header: 'Disparos' },
    { field: 'lastTriggered', header: 'Último Disparo' },
  ];

  createAlert(): void;
  toggleAlert(alert: Alert): void;
  editAlert(alert: Alert): void;
  deleteAlert(alert: Alert): void;
  testAlert(alert: Alert): void;
}
```

**PrimeNG Components:**
- `p-table` con acciones inline
- `p-inputSwitch` para activar/desactivar
- `p-badge` para contador de disparos
- `p-dialog` para crear/editar

### Alert Create Component
```typescript
@Component({
  selector: 'app-alert-create',
  templateUrl: './alert-create.component.html'
})
export class AlertCreateComponent {
  alertForm: FormGroup;

  alertTypes: SelectItem[] = [
    { label: 'Precio', value: 'PRICE' },
    { label: 'Nivel S/R', value: 'LEVEL' },
    { label: 'Divergencia', value: 'DIVERGENCE' },
    { label: 'Indicador', value: 'INDICATOR' },
  ];

  operators: SelectItem[] = [
    { label: 'Mayor que', value: '>' },
    { label: 'Menor que', value: '<' },
    { label: 'Cruza arriba', value: 'crosses_above' },
    { label: 'Cruza abajo', value: 'crosses_below' },
  ];

  conditions: FormArray;

  addCondition(): void {
    this.conditions.push(this.fb.group({
      field: ['', Validators.required],
      operator: ['>', Validators.required],
      value: [0, Validators.required],
    }));
  }

  removeCondition(index: number): void {
    this.conditions.removeAt(index);
  }

  submitAlert(): void;
}
```

---

## 📈 Data Viewer Module

### Structure
```
features/data-viewer/
├── data-viewer.module.ts
└── components/
    ├── chart-view/
    ├── levels-panel/
    ├── indicators-panel/
    └── order-book/
```

### Chart View Component
```typescript
@Component({
  selector: 'app-chart-view',
  templateUrl: './chart-view.component.html'
})
export class ChartViewComponent implements OnInit, OnDestroy {
  @Input() symbol: string;
  @Input() timeframe: string;

  chartData: ChartData;
  levels: Level[] = [];
  indicators: Indicator[] = [];

  ngOnInit(): void {
    this.loadChartData();
    this.loadLevels();
    this.subscribeToRealTime();
  }

  onTimeframeChange(timeframe: string): void {
    this.timeframe = timeframe;
    this.loadChartData();
  }

  toggleIndicator(indicator: string): void;
  drawLevel(level: Level): void;
}
```

**Libraries:**
- TradingView Lightweight Charts o Chart.js
- Anotaciones para niveles de S/R
- Overlays para divergencias

### Levels Panel Component
```typescript
@Component({
  selector: 'app-levels-panel',
  templateUrl: './levels-panel.component.html'
})
export class LevelsPanelComponent {
  @Input() symbol: string;
  @Output() levelClick = new EventEmitter<Level>();

  levels$: Observable<Level[]>;

  filters = {
    type: null,      // SUPPORT | RESISTANCE
    strength: null,  // STRONG | MEDIUM | WEAK
    timeframe: null,
  };

  getLevelColor(level: Level): string {
    return level.type === 'SUPPORT' ? 'green' : 'red';
  }

  getStrengthSeverity(strength: number): string {
    if (strength > 70) return 'success';
    if (strength > 40) return 'warning';
    return 'danger';
  }
}
```

---

## 🧪 Backtesting Module

### Structure
```
features/backtesting/
├── backtesting.module.ts
└── components/
    ├── test-config/
    ├── test-results/
    ├── equity-chart/
    ├── trades-list/
    └── optimization/
```

### Test Config Component
```typescript
@Component({
  selector: 'app-test-config',
  templateUrl: './test-config.component.html'
})
export class TestConfigComponent {
  configForm: FormGroup;

  strategies: SelectItem[] = [
    { label: 'S/R Bounce', value: 'sr_bounce' },
    { label: 'Divergence', value: 'divergence' },
    { label: 'Breakout', value: 'breakout' },
  ];

  initForm(): void {
    this.configForm = this.fb.group({
      name: ['', Validators.required],
      strategy: ['', Validators.required],
      symbol: ['BTCUSDT', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      initialCapital: [10000, Validators.required],
      commission: [0.075],  // %
      slippage: [0.05],     // %
      strategyParams: this.fb.group({}),
    });
  }

  runBacktest(): void {
    const config = this.configForm.value;
    this.backtestingService.run(config).subscribe(
      (result) => {
        // Navegar a resultados
      }
    );
  }
}
```

### Test Results Component
```typescript
@Component({
  selector: 'app-test-results',
  templateUrl: './test-results.component.html'
})
export class TestResultsComponent {
  results: BacktestResults;

  metricCards = [
    { label: 'Total Trades', field: 'totalTrades' },
    { label: 'Win Rate', field: 'winRate', suffix: '%' },
    { label: 'Total P&L', field: 'totalPnL', prefix: '$' },
    { label: 'Profit Factor', field: 'profitFactor' },
    { label: 'Max Drawdown', field: 'maxDrawdown', suffix: '%' },
    { label: 'Sharpe Ratio', field: 'sharpeRatio' },
  ];

  exportResults(format: 'PDF' | 'CSV'): void;
}
```

**PrimeNG Components:**
- `p-card` para métricas
- `p-chart` para equity curve
- `p-table` para lista de trades
- `p-tabView` para diferentes vistas
- `p-menu` para exportación

---

## 📚 History Module

### Structure
```
features/history/
├── history.module.ts
└── components/
    ├── trades-list/
    ├── trade-detail/
    ├── performance-charts/
    └── calendar-view/
```

### Trades List Component
```typescript
@Component({
  selector: 'app-trades-list',
  templateUrl: './trades-list.component.html'
})
export class TradesListComponent {
  trades$: Observable<TradeRecord[]>;

  dateRange: Date[];

  columns = [
    { field: 'symbol', header: 'Par' },
    { field: 'side', header: 'Tipo' },
    { field: 'entryTime', header: 'Entrada' },
    { field: 'exitTime', header: 'Salida' },
    { field: 'entryPrice', header: 'Precio Entrada' },
    { field: 'exitPrice', header: 'Precio Salida' },
    { field: 'pnl', header: 'P&L' },
    { field: 'pnlPercent', header: 'P&L %' },
  ];

  onDateRangeSelect(): void {
    this.loadTrades();
  }

  exportTrades(): void;
  viewDetails(trade: TradeRecord): void;
}
```

---

## 🎨 Shared Components

### Metric Card Component
```typescript
@Component({
  selector: 'app-metric-card',
  template: `
    <p-card>
      <div class="metric-card">
        <label>{{ title }}</label>
        <h2 [class]="getValueClass()">
          {{ prefix }}{{ value | number:'1.2-2' }}{{ suffix }}
        </h2>
        <small *ngIf="change">
          <i [class]="getChangeIcon()"></i>
          {{ change }}%
        </small>
      </div>
    </p-card>
  `
})
export class MetricCardComponent {
  @Input() title: string;
  @Input() value: number;
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() change: number;

  getValueClass(): string {
    if (this.value > 0) return 'text-green-500';
    if (this.value < 0) return 'text-red-500';
    return '';
  }

  getChangeIcon(): string {
    return this.change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }
}
```

### Price Display Component
```typescript
@Component({
  selector: 'app-price-display',
  template: `
    <span [class]="getPriceClass()">
      {{ price | number:'1.2-8' }}
      <i *ngIf="showArrow" [class]="getArrowClass()"></i>
    </span>
  `
})
export class PriceDisplayComponent {
  @Input() price: number;
  @Input() previousPrice: number;
  @Input() showArrow: boolean = true;

  getPriceClass(): string {
    if (!this.previousPrice) return '';
    return this.price > this.previousPrice ? 'text-green-500' : 'text-red-500';
  }

  getArrowClass(): string {
    if (!this.previousPrice) return '';
    return this.price > this.previousPrice ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }
}
```

---

## 🎨 PrimeNG Theme Customization

### Tailwind Integration
```scss
// styles/theme.scss

@import 'primeng/resources/primeng.css';
@import 'primeicons/primeicons.css';

// Custom theme variables
:root {
  --primary-color: #3B82F6;
  --primary-color-text: #ffffff;
  --surface-0: #ffffff;
  --surface-50: #FAFAFA;
  --surface-100: #F5F5F5;
  --surface-200: #EEEEEE;
  --surface-300: #E0E0E0;
  --surface-400: #BDBDBD;
  --surface-500: #9E9E9E;
  --surface-600: #757575;
  --surface-700: #616161;
  --surface-800: #424242;
  --surface-900: #212121;
  --content-padding: 1rem;
  --inline-spacing: 0.5rem;
  --border-radius: 6px;
}

// Dark mode
.dark-mode {
  --surface-0: #1e1e1e;
  --surface-50: #2a2a2a;
  // ...
}
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Adaptations
- Sidebar colapsable
- Tablas con scroll horizontal
- Gráficos responsive
- Touch gestures para charts
- Bottom navigation (mobile)

---

## 🧪 Testing

### Unit Testing
```typescript
describe('OrderCreateComponent', () => {
  let component: OrderCreateComponent;
  let fixture: ComponentFixture<OrderCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderCreateComponent ],
      imports: [ ReactiveFormsModule, HttpClientTestingModule ],
      providers: [ OrdersService, RiskManagerService ]
    }).compileComponents();
  });

  it('should calculate risk when form changes', () => {
    component.orderForm.patchValue({
      riskPercent: 2,
      stopLoss: 50000,
      entryPrice: 51000
    });

    expect(component.riskCalculation).toBeDefined();
    expect(component.riskCalculation.riskAmount).toBeGreaterThan(0);
  });
});
```

---

## 🎯 Best Practices

### Component Design
- Single Responsibility Principle
- Input/Output para comunicación
- OnPush change detection cuando sea posible
- Unsubscribe de observables en ngOnDestroy

### State Management
- Considerar NgRx para estado global
- Servicios para estado local
- BehaviorSubject para streams de datos

### Performance
- Lazy loading de módulos
- Virtual scrolling para listas grandes
- Memoización de cálculos pesados
- Image optimization

### Accessibility
- Labels en formularios
- ARIA attributes
- Keyboard navigation
- Screen reader support
