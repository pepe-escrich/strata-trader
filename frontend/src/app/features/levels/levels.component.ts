import { Component, signal, OnInit, effect, ViewChildren, ViewChild, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { init, dispose } from 'klinecharts';
import type { Chart } from 'klinecharts';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';
import { LevelsService } from '../../shared/services/levels.service';
import { BingxMarketService } from '../../shared/services/bingx-market.service';
import {
  LevelType,
  LevelInterval,
  LEVEL_INTERVAL_OPTIONS,
  LevelsResponse,
  PivotPoints,
  FibonacciRetracement,
  IchimokuCloud,
  SavedLevel,
  FrvpResult,
  FrvpLevel
} from '../../shared/models/levels.model';
import { CalculatedLevelsListComponent } from './components/calculated-levels-list.component';
import { SavedLevelsListComponent } from './components/saved-levels-list.component';
import { FrvpSelectorComponent, FrvpSelection } from './components/frvp-selector.component';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CalculatedLevelsListComponent, SavedLevelsListComponent, FrvpSelectorComponent],
  providers: [LevelsService, BingxMarketService],
  template: `
    <div class="levels-container">
      @if (pairsService.enabledPairs().length > 0) {
        <div class="slides-scroll" (scroll)="onScroll($event)">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="slide" [class.active]="currentIndex() === idx">
              <!-- Controles -->
              <div class="controls">
                <div class="control-row">
                  <div class="control-group">
                    <label>Tipo de Nivel:</label>
                    <select
                      class="level-select"
                      [value]="selectedLevelType()"
                      (change)="setLevelType($any($event.target).value)"
                      [disabled]="loading()">
                      <option value="pivot">Pivot Points</option>
                      <option value="fibonacci">Fibonacci</option>
                      <option value="ichimoku">Ichimoku Cloud</option>
                      <option value="frvp">Volume Profile (FRVP)</option>
                      <option value="actuales">Niveles Guardados</option>
                    </select>
                  </div>

                  @if (selectedLevelType() !== 'actuales' && selectedLevelType() !== 'frvp') {
                    <div class="control-group">
                      <label>Temporalidad:</label>
                      <select
                        class="level-select"
                        [value]="selectedInterval()"
                        (change)="setInterval($any($event.target).value)"
                        [disabled]="loading()">
                        @for (option of intervalOptions; track option.value) {
                          <option [value]="option.value">{{ option.label }}</option>
                        }
                      </select>
                    </div>

                    <button
                      class="calculate-btn"
                      (click)="calculateLevels()"
                      [disabled]="loading()">
                      @if (loading()) {
                        <span>Calculando...</span>
                      } @else {
                        <span>Calcular</span>
                      }
                    </button>
                  }

                  @if (selectedLevelType() === 'frvp') {
                    <div class="control-group">
                      <label>Temporalidad:</label>
                      <select
                        class="level-select"
                        [value]="selectedInterval()"
                        (change)="setInterval($any($event.target).value)">
                        @for (option of intervalOptions; track option.value) {
                          <option [value]="option.value">{{ option.label }}</option>
                        }
                      </select>
                    </div>
                  }
                </div>
              </div>

              <!-- Gráfico con niveles -->
              <div class="chart-wrapper">
                @if (loading() && currentIndex() === idx) {
                  <div class="loading">
                    <div class="spinner"></div>
                    <span>Cargando niveles...</span>
                  </div>
                }
                @if (error() && currentIndex() === idx) {
                  <div class="error">
                    <span>❌ {{ error() }}</span>
                    <button class="retry-btn" (click)="calculateLevels()">Reintentar</button>
                  </div>
                }

                <div #chartContainer class="chart-container"></div>
              </div>

              <!-- Lista de niveles calculados -->
              @if (selectedLevelType() !== 'actuales' && currentLevelsData && currentIndex() === idx) {
                <app-calculated-levels-list
                  [levelsResponse]="currentLevelsData"
                  [symbol]="pair.symbol"
                  [loading]="loading()"
                  (levelsSaved)="onLevelsSaved()">
                </app-calculated-levels-list>
              }

              <!-- Lista de niveles guardados -->
              @if (selectedLevelType() === 'actuales' && currentIndex() === idx) {
                <app-saved-levels-list
                  [symbol]="pair.symbol"
                  (levelsChanged)="onSavedLevelsChanged($event)">
                </app-saved-levels-list>
              }

              <!-- FRVP Selector -->
              @if (selectedLevelType() === 'frvp' && currentIndex() === idx) {
                <app-frvp-selector
                  #frvpSelector
                  [symbol]="pair.symbol"
                  [interval]="selectedInterval()"
                  (selectionReady)="onFrvpSelectionReady()"
                  (drawingCancelled)="onFrvpDrawingCancelled()"
                  (frvpCalculated)="onFrvpCalculated($event)"
                  (levelsSaved)="onFrvpLevelsSaved()">
                </app-frvp-selector>
              }
            </div>
          }
        </div>

        <!-- Dots de paginación -->
        @if (pairsService.enabledPairs().length > 1) {
          <div class="pagination-dots">
            @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
              <button
                class="dot"
                [class.active]="currentIndex() === idx"
                [style.color]="currentIndex() === idx ? pair.color : '#d1d5db'"
                (click)="goToSlide(idx)">
              </button>
            }
          </div>
        }
      }

      @if (pairsService.enabledPairs().length === 0) {
        <div class="empty-state">
          <p>No hay pares habilitados</p>
          <p class="hint">Usa el menú superior para añadir pares</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .levels-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }

    .slides-scroll {
      flex: 1;
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      width: 100%;
      min-height: 0;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .slide {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      display: flex;
      flex-direction: column;
      padding: 20px;
      gap: 16px;
      min-height: 0;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.9);
      padding: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .control-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
      }
    }

    .level-select {
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 140px;

      &:hover:not(:disabled) {
        border-color: #9ca3af;
      }

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .calculate-btn {
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #667eea;
      background: #667eea;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      align-self: flex-end;

      &:hover:not(:disabled) {
        background: #5568d3;
        border-color: #5568d3;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .chart-wrapper {
      flex: 1;
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }

    .chart-container {
      flex: 1;
      min-height: 400px;
      width: 100%;
    }

    .loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.95);
      z-index: 10;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f4f6;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      span {
        font-size: 14px;
        color: #6b7280;
      }
    }

    .error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.95);
      z-index: 10;
      padding: 20px;

      span {
        font-size: 12px;
        color: #ef4444;
        text-align: center;
      }

      .retry-btn {
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;

        &:hover {
          background: #5568d3;
        }
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .pagination-dots {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 12px;
      padding: 8px 0;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      transition: all 0.3s;
      touch-action: manipulation;
      min-width: 32px;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      color: #d1d5db;

      &::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: currentColor;
        transition: all 0.3s;
      }

      &.active {
        min-width: 48px;

        &::before {
          width: 32px;
          border-radius: 6px;
        }
      }
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #6b7280;

      p {
        margin: 0;
      }

      .hint {
        font-size: 14px;
      }
    }
  `]
})
export class LevelsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('chartContainer') chartContainers!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('frvpSelector') frvpSelectorComponent?: FrvpSelectorComponent;

  currentIndex = signal(0);
  selectedLevelType = signal<LevelType>('pivot');
  selectedInterval = signal<LevelInterval>('1d');
  loading = signal(false);
  error = signal<string | null>(null);

  intervalOptions = LEVEL_INTERVAL_OPTIONS;

  private charts: Map<number, Chart> = new Map();
  private resizeObservers: Map<number, ResizeObserver> = new Map();
  currentLevelsData: LevelsResponse | null = null;

  // FRVP drawing state
  private frvpDrawing = false;
  private frvpStartPoint: { x: number; y: number; timestamp: number; price: number } | null = null;
  private frvpOverlayId: string | null = null;
  private chartMouseHandlers: Map<number, {
    mousedown: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
  }> = new Map();

  constructor(
    public pairsService: CryptoPairsService,
    private activePairService: ActivePairService,
    private levelsService: LevelsService,
    private marketService: BingxMarketService
  ) {
    // Actualizar par activo cuando cambie el índice
    effect(() => {
      const index = this.currentIndex();
      const pairs = this.pairsService.enabledPairs();
      if (pairs.length > 0 && index < pairs.length) {
        const previousPair = this.activePairService.currentPair();
        const newPair = pairs[index];

        // Solo procesar si realmente cambia el par
        if (previousPair && previousPair.symbol === newPair.symbol) {
          return;
        }

        this.activePairService.setActivePair(newPair);

        // Inicializar el gráfico del slide actual si no existe
        setTimeout(() => {
          this.initChartForIndex(index);
          this.loadChartData();
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    // Inicializar con el primer par habilitado
    const pairs = this.pairsService.enabledPairs();
    if (pairs.length > 0) {
      this.activePairService.setActivePair(pairs[0]);
    }
  }

  ngAfterViewInit(): void {
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      const index = this.currentIndex();
      this.initChartForIndex(index);
      this.loadChartData();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup FRVP drawing
    this.disableFrvpDrawing();

    // Cleanup all resize observers
    this.resizeObservers.forEach((observer) => observer.disconnect());
    this.resizeObservers.clear();

    // Cleanup all charts
    this.chartContainers?.forEach((container, index) => {
      if (this.charts.has(index)) {
        dispose(container.nativeElement);
      }
    });
    this.charts.clear();
  }

  private initChartForIndex(index: number): void {
    // Si ya existe un gráfico para este índice, no hacer nada
    if (this.charts.has(index)) {
      return;
    }

    const containers = this.chartContainers?.toArray();
    if (!containers || index >= containers.length) {
      console.error(`Chart container not available for index ${index}`);
      return;
    }

    const container = containers[index].nativeElement;

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.error('Container has no dimensions');
      return;
    }

    try {
      // Crear instancia de KLineChart
      const chart = init(container);

      if (!chart) {
        console.error('Failed to initialize chart');
        return;
      }

      // Configurar estilos para las velas
      chart.setStyles({
        candle: {
          type: 'candle_solid' as any,
          bar: {
            upColor: '#10b981',
            downColor: '#ef4444',
            upBorderColor: '#10b981',
            downBorderColor: '#ef4444',
            upWickColor: '#10b981',
            downWickColor: '#ef4444',
          },
        },
        grid: {
          show: true,
          horizontal: {
            show: true,
            color: '#f0f0f0',
          },
          vertical: {
            show: true,
            color: '#f0f0f0',
          },
        },
      });

      // Habilitar gestos táctiles (zoom, pan)
      chart.setZoomEnabled(true);
      chart.setScrollEnabled(true);

      // Guardar el gráfico en el Map
      this.charts.set(index, chart);

      // Responsive resize
      const resizeObserver = new ResizeObserver(() => {
        const chart = this.charts.get(index);
        if (chart) {
          chart.resize();
        }
      });
      resizeObserver.observe(container);
      this.resizeObservers.set(index, resizeObserver);

      console.log(`Chart initialized for index ${index}`);
    } catch (error: any) {
      console.error(`Error initializing chart for index ${index}:`, error);
    }
  }

  loadChartData(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      return;
    }

    const index = this.currentIndex();
    const chart = this.charts.get(index);
    if (!chart) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Usar temporalidad para las velas (puede ser diferente a la temporalidad de los niveles)
    const candleInterval: any = this.selectedInterval();

    this.marketService
      .getKlines(currentPair.symbol, candleInterval, 500)
      .subscribe({
        next: (candles) => {
          if (candles.length > 0 && chart) {
            // Convertir datos al formato de KLineChart
            const data = candles.map(c => ({
              timestamp: c.time * 1000, // KLineChart espera milliseconds
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
            }));

            try {
              // Cargar datos usando API de v9
              (chart as any).applyNewData(data);
              console.log('Loaded', data.length, 'candles for', currentPair.symbol);
            } catch (e: any) {
              console.error('Error loading data into chart:', e);
            }
          }

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading chart data:', err);
          this.error.set('Error al cargar los datos del gráfico');
          this.loading.set(false);
        },
      });
  }

  calculateLevels(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const type = this.selectedLevelType();
    const interval = this.selectedInterval();

    this.levelsService.getLevels(currentPair.symbol, interval, type).subscribe({
      next: (response) => {
        console.log('Levels calculated:', response);
        this.currentLevelsData = response;
        this.drawLevels(response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error calculating levels:', err);
        this.error.set('Error al calcular los niveles. Verifica la API key de TAAPI.');
        this.loading.set(false);
      },
    });
  }

  private drawLevels(levelsResponse: LevelsResponse): void {
    const index = this.currentIndex();
    const chart = this.charts.get(index);
    if (!chart) {
      return;
    }

    // Limpiar líneas anteriores
    (chart as any).removeOverlay();

    const type = levelsResponse.type;
    const data = levelsResponse.data;

    switch (type) {
      case 'pivot':
        this.drawPivotPoints(chart, data as PivotPoints);
        break;
      case 'fibonacci':
        this.drawFibonacci(chart, data as FibonacciRetracement);
        break;
      case 'ichimoku':
        this.drawIchimoku(chart, data as IchimokuCloud);
        break;
    }
  }

  private drawPivotPoints(chart: Chart, data: PivotPoints): void {
    const levels = [
      { price: data.r3, label: 'R3', color: '#ef4444' },
      { price: data.r2, label: 'R2', color: '#f87171' },
      { price: data.r1, label: 'R1', color: '#fca5a5' },
      { price: data.p, label: 'P', color: '#667eea' },
      { price: data.s1, label: 'S1', color: '#6ee7b7' },
      { price: data.s2, label: 'S2', color: '#34d399' },
      { price: data.s3, label: 'S3', color: '#10b981' },
    ];

    levels.forEach(level => {
      (chart as any).createOverlay({
        name: 'priceLine',
        points: [{ value: level.price }],
        styles: {
          line: {
            style: 'dashed',
            color: level.color,
            size: 2,
          },
          text: {
            content: `${level.label}: ${level.price.toFixed(2)}`,
            color: level.color,
            size: 12,
            weight: 'bold',
          },
        },
      });
    });
  }

  private drawFibonacci(chart: Chart, data: FibonacciRetracement): void {
    data.levels.forEach(level => {
      const color = this.getFibonacciColor(level.percentage);
      (chart as any).createOverlay({
        name: 'priceLine',
        points: [{ value: level.price }],
        styles: {
          line: {
            style: 'dashed',
            color: color,
            size: 2,
          },
          text: {
            content: `${level.level}: ${level.price.toFixed(2)}`,
            color: color,
            size: 12,
            weight: 'bold',
          },
        },
      });
    });
  }

  private getFibonacciColor(percentage: number): string {
    if (percentage === 0) return '#10b981';
    if (percentage === 23.6) return '#34d399';
    if (percentage === 38.2) return '#6ee7b7';
    if (percentage === 50) return '#667eea';
    if (percentage === 61.8) return '#fca5a5';
    if (percentage === 100) return '#ef4444';
    return '#6b7280';
  }

  private drawIchimoku(chart: Chart, data: IchimokuCloud): void {
    const levels = [
      { price: data.conversion, label: 'Tenkan', color: '#ef4444' },
      { price: data.base, label: 'Kijun', color: '#3b82f6' },
      { price: data.currentSpanA, label: 'Span A', color: '#10b981' },
      { price: data.currentSpanB, label: 'Span B', color: '#f59e0b' },
    ];

    levels.forEach(level => {
      (chart as any).createOverlay({
        name: 'priceLine',
        points: [{ value: level.price }],
        styles: {
          line: {
            style: 'solid',
            color: level.color,
            size: 2,
          },
          text: {
            content: `${level.label}: ${level.price.toFixed(2)}`,
            color: level.color,
            size: 12,
            weight: 'bold',
          },
        },
      });
    });
  }

  setLevelType(type: LevelType): void {
    // Clean up FRVP drawing mode if switching away from FRVP
    if (this.selectedLevelType() === 'frvp' && type !== 'frvp') {
      this.disableFrvpDrawing();
    }

    this.selectedLevelType.set(type);

    if (type === 'actuales') {
      // Cargar niveles guardados
      this.loadSavedLevels();
    } else if (type === 'frvp') {
      // FRVP mode - wait for user to draw
      // Clear existing overlays
      const chart = this.charts.get(this.currentIndex());
      if (chart) {
        (chart as any).removeOverlay();
      }
    } else {
      // Recalcular automáticamente si ya hay datos
      if (this.currentLevelsData) {
        this.calculateLevels();
      }
    }
  }

  setInterval(interval: LevelInterval): void {
    this.selectedInterval.set(interval);
    // Recargar datos de velas con la nueva temporalidad
    this.loadChartData();
    // Recalcular niveles si ya hay datos
    if (this.currentLevelsData) {
      this.calculateLevels();
    }
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (newIndex !== this.currentIndex()) {
      this.currentIndex.set(newIndex);
    }
  }

  goToSlide(index: number): void {
    const pairs = this.pairsService.enabledPairs();
    if (index >= 0 && index < pairs.length) {
      this.currentIndex.set(index);
      const container = document.querySelector('.slides-scroll');
      if (container) {
        container.scrollTo({
          left: index * container.clientWidth,
          behavior: 'smooth'
        });
      }
    }
  }

  // Methods for saved levels

  loadSavedLevels(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.levelsService.getSavedLevels(currentPair.symbol).subscribe({
      next: (levels) => {
        this.drawSavedLevels(levels);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading saved levels:', err);
        this.error.set('Error al cargar niveles guardados');
        this.loading.set(false);
      }
    });
  }

  drawSavedLevels(levels: SavedLevel[]): void {
    const chart = this.charts.get(this.currentIndex());
    if (!chart) {
      return;
    }

    // Limpiar overlays existentes
    (chart as any).removeOverlay();

    if (levels.length === 0) {
      return;
    }

    // Dibujar cada nivel guardado con estilo sólido (distinto a los calculados)
    levels.forEach(level => {
      (chart as any).createOverlay({
        name: 'priceLine',
        points: [{ value: level.price }],
        styles: {
          line: {
            style: 'solid', // Línea SÓLIDA (vs dashed para calculados)
            color: level.metadata.color || '#667eea',
            size: 3, // Más gruesa que calculados (2px)
          },
          text: {
            content: `📌 ${level.label}: ${level.price.toFixed(2)} [${level.touchCount} toques, ${level.strength}/100]`,
            color: level.metadata.color || '#667eea',
            size: 13,
            weight: 'bold',
          },
        },
      });
    });
  }

  onLevelsSaved(): void {
    // Si estamos en modo "actuales", actualizar la vista
    if (this.selectedLevelType() === 'actuales') {
      this.loadSavedLevels();
    }
  }

  onSavedLevelsChanged(levels: SavedLevel[]): void {
    // Redibujar niveles en el gráfico
    this.drawSavedLevels(levels);
  }

  // FRVP methods

  onFrvpCalculated(result: FrvpResult): void {
    // Draw FRVP levels on chart
    this.drawFrvpLevels(result);
    // Also draw volume profile histogram
    this.drawVolumeProfile(result);
  }

  drawFrvpLevels(result: FrvpResult): void {
    const chart = this.charts.get(this.currentIndex());
    if (!chart) return;

    // Clear existing overlays
    (chart as any).removeOverlay();

    // Draw each FRVP level
    result.levels.forEach(level => {
      const color = this.getFrvpLevelColor(level.type);

      (chart as any).createOverlay({
        name: 'priceLine',
        points: [{ value: level.price }],
        styles: {
          line: {
            style: level.type === 'poc' ? 'solid' : 'dashed',
            color: color,
            size: level.type === 'poc' ? 3 : 2,
          },
          text: {
            content: `${level.label}: ${level.price.toFixed(2)}`,
            color: color,
            size: 12,
            weight: level.type === 'poc' ? 'bold' : 'normal',
          },
        },
      });
    });
  }

  drawVolumeProfile(result: FrvpResult): void {
    const chart = this.charts.get(this.currentIndex());
    if (!chart) return;

    // Find max volume for scaling
    const maxVolume = Math.max(...result.bins.map(b => b.volume));

    // Draw volume profile as rectangles on the right side of the chart
    // This is a simplified version - in production you'd create custom overlays
    result.bins.forEach(bin => {
      if (bin.volume === 0) return;

      const width = (bin.volume / maxVolume) * 100; // Width in pixels
      const opacity = Math.min(0.7, bin.percentage / 10);

      // Create a horizontal bar for this price level
      // Note: KLineChart might not have direct support for this
      // You might need to use a custom overlay or canvas drawing
    });
  }

  getFrvpLevelColor(type: string): string {
    const colors: {[key: string]: string} = {
      'poc': '#fbbf24', // Gold for POC
      'vah': '#ef4444', // Red for Value Area High
      'val': '#10b981', // Green for Value Area Low
      'hvn': '#3b82f6', // Blue for High Volume Nodes
      'lvn': '#8b5cf6', // Purple for Low Volume Nodes
    };
    return colors[type] || '#667eea';
  }

  onFrvpLevelsSaved(): void {
    // This will be handled through the calculated levels list component
    // which already has the save logic
  }

  onFrvpSelectionReady(): void {
    // Enable drawing mode on the chart
    this.enableFrvpDrawing();
  }

  onFrvpDrawingCancelled(): void {
    // Disable drawing mode
    this.disableFrvpDrawing();
  }

  private enableFrvpDrawing(): void {
    const chart = this.charts.get(this.currentIndex());
    const containers = this.chartContainers?.toArray();

    if (!chart || !containers || this.currentIndex() >= containers.length) {
      console.error('Chart or container not available');
      return;
    }

    const container = containers[this.currentIndex()].nativeElement;

    // Set cursor style to crosshair
    container.style.cursor = 'crosshair';

    // Create mouse event handlers
    const mousedownHandler = (e: MouseEvent) => this.onFrvpPointerStart(e, chart, container, e.clientX, e.clientY);
    const mousemoveHandler = (e: MouseEvent) => this.onFrvpPointerMove(e, chart, container, e.clientX, e.clientY);
    const mouseupHandler = (e: MouseEvent) => this.onFrvpPointerEnd(e, chart, container, e.clientX, e.clientY);

    // Create touch event handlers
    const touchstartHandler = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onFrvpPointerStart(e, chart, container, touch.clientX, touch.clientY);
      }
    };
    const touchmoveHandler = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onFrvpPointerMove(e, chart, container, touch.clientX, touch.clientY);
      }
    };
    const touchendHandler = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.onFrvpPointerEnd(e, chart, container, touch.clientX, touch.clientY);
      }
    };

    // Add mouse event listeners (with passive: false to allow preventDefault)
    container.addEventListener('mousedown', mousedownHandler, { passive: false });
    container.addEventListener('mousemove', mousemoveHandler, { passive: false });
    container.addEventListener('mouseup', mouseupHandler, { passive: false });

    // Add touch event listeners
    container.addEventListener('touchstart', touchstartHandler, { passive: false });
    container.addEventListener('touchmove', touchmoveHandler, { passive: false });
    container.addEventListener('touchend', touchendHandler, { passive: false });

    // Store handlers for cleanup
    this.chartMouseHandlers.set(this.currentIndex(), {
      mousedown: mousedownHandler,
      mousemove: mousemoveHandler,
      mouseup: mouseupHandler,
      touchstart: touchstartHandler,
      touchmove: touchmoveHandler,
      touchend: touchendHandler
    } as any);
  }

  private disableFrvpDrawing(): void {
    const containers = this.chartContainers?.toArray();

    if (!containers || this.currentIndex() >= containers.length) return;

    const container = containers[this.currentIndex()].nativeElement;
    container.style.cursor = 'default';

    // Remove event listeners
    const handlers: any = this.chartMouseHandlers.get(this.currentIndex());
    if (handlers) {
      // Remove mouse event listeners
      container.removeEventListener('mousedown', handlers.mousedown);
      container.removeEventListener('mousemove', handlers.mousemove);
      container.removeEventListener('mouseup', handlers.mouseup);

      // Remove touch event listeners
      if (handlers.touchstart) {
        container.removeEventListener('touchstart', handlers.touchstart);
      }
      if (handlers.touchmove) {
        container.removeEventListener('touchmove', handlers.touchmove);
      }
      if (handlers.touchend) {
        container.removeEventListener('touchend', handlers.touchend);
      }

      this.chartMouseHandlers.delete(this.currentIndex());
    }

    // Clear drawing state
    this.frvpDrawing = false;
    this.frvpStartPoint = null;

    // Remove temporary overlay if exists
    if (this.frvpOverlayId) {
      const chart = this.charts.get(this.currentIndex());
      if (chart) {
        (chart as any).removeOverlay(this.frvpOverlayId);
      }
      this.frvpOverlayId = null;
    }
  }

  private onFrvpPointerStart(e: Event, chart: Chart, container: HTMLElement, clientX: number, clientY: number): void {
    // Prevent chart default behavior (panning/zooming)
    e.preventDefault();
    e.stopPropagation();

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convert pixel coordinates to chart values
    const values = this.pixelToChartValues(chart, x, y);

    if (!values) return;

    this.frvpDrawing = true;
    this.frvpStartPoint = {
      x,
      y,
      timestamp: values.timestamp,
      price: values.price
    };
  }

  private onFrvpPointerMove(e: Event, chart: Chart, container: HTMLElement, clientX: number, clientY: number): void {
    if (!this.frvpDrawing || !this.frvpStartPoint) return;

    // Prevent chart default behavior while drawing
    e.preventDefault();
    e.stopPropagation();

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convert current position to chart values
    const values = this.pixelToChartValues(chart, x, y);
    if (!values) return;

    // Remove previous temporary rectangle
    if (this.frvpOverlayId) {
      (chart as any).removeOverlay(this.frvpOverlayId);
    }

    // Draw temporary rectangle
    const startTime = this.frvpStartPoint.timestamp;
    const endTime = values.timestamp;
    const highPrice = Math.max(this.frvpStartPoint.price, values.price);
    const lowPrice = Math.min(this.frvpStartPoint.price, values.price);

    try {
      const overlay = (chart as any).createOverlay({
        name: 'rect',
        points: [
          { timestamp: Math.min(startTime, endTime), value: highPrice },
          { timestamp: Math.max(startTime, endTime), value: lowPrice }
        ],
        styles: {
          style: 'stroke_fill',
          color: 'rgba(139, 92, 246, 0.2)',
          borderColor: '#8b5cf6',
          borderSize: 2,
          borderStyle: 'dashed'
        }
      });

      if (overlay && overlay.id) {
        this.frvpOverlayId = overlay.id;
      }
    } catch (error) {
      console.error('Error creating overlay:', error);
    }
  }

  private onFrvpPointerEnd(e: Event, chart: Chart, container: HTMLElement, clientX: number, clientY: number): void {
    if (!this.frvpDrawing || !this.frvpStartPoint) return;

    // Prevent chart default behavior
    e.preventDefault();
    e.stopPropagation();

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check if there was actual dragging (at least 10 pixels in any direction)
    const pixelDistance = Math.sqrt(
      Math.pow(x - this.frvpStartPoint.x, 2) +
      Math.pow(y - this.frvpStartPoint.y, 2)
    );

    if (pixelDistance < 10) {
      // Just a click, not a drag - don't show error, just cancel
      this.disableFrvpDrawing();
      return;
    }

    // Convert to chart values
    const values = this.pixelToChartValues(chart, x, y);

    if (!values) {
      this.disableFrvpDrawing();
      return;
    }

    // Calculate selection bounds
    const startTime = Math.min(this.frvpStartPoint.timestamp, values.timestamp);
    const endTime = Math.max(this.frvpStartPoint.timestamp, values.timestamp);
    const highPrice = Math.max(this.frvpStartPoint.price, values.price);
    const lowPrice = Math.min(this.frvpStartPoint.price, values.price);

    // Validate selection (must have meaningful range) - reduced thresholds
    if (endTime - startTime < 10000 || highPrice - lowPrice < 0.001) {
      // Selection too small
      this.error.set('Selección demasiado pequeña. Dibuja un rectángulo más grande (mínimo 10 segundos y 0.1% de rango de precio).');
      this.disableFrvpDrawing();
      return;
    }

    // Send selection to FRVP component
    const selection: FrvpSelection = {
      startTime,
      endTime,
      highPrice,
      lowPrice
    };

    if (this.frvpSelectorComponent) {
      this.frvpSelectorComponent.setSelection(selection);
    }

    // Disable drawing mode
    this.disableFrvpDrawing();

    // Keep the selection rectangle visible
    // (it will be removed when calculation happens or new selection starts)
  }

  private pixelToChartValues(chart: Chart, x: number, y: number): { timestamp: number; price: number } | null {
    try {
      // Use KLineChart's API to convert coordinates
      // Note: This is a simplified version - actual API might differ
      const convertedValue = (chart as any).convertFromPixel({ x, y }, { paneId: 'candle_pane' });

      if (convertedValue && convertedValue.dataIndex !== undefined && convertedValue.value !== undefined) {
        // Get candle data at this index
        const dataList = (chart as any).getDataList();
        if (dataList && dataList[convertedValue.dataIndex]) {
          const candle = dataList[convertedValue.dataIndex];
          return {
            timestamp: candle.timestamp,
            price: convertedValue.value
          };
        }
      }

      // Fallback: estimate based on visible range
      return this.estimateChartValues(chart, x, y);
    } catch (error) {
      console.error('Error converting pixel to chart values:', error);
      return this.estimateChartValues(chart, x, y);
    }
  }

  private estimateChartValues(chart: Chart, x: number, y: number): { timestamp: number; price: number } | null {
    try {
      // Get chart dimensions and visible range
      const dataList = (chart as any).getDataList();
      if (!dataList || dataList.length === 0) return null;

      // Get visible range
      const visibleRange = (chart as any).getVisibleRange();
      const chartRect = (chart as any).getSize();

      if (!visibleRange || !chartRect) return null;

      const { from, to } = visibleRange;
      const visibleCandles = dataList.slice(from, to + 1);

      if (visibleCandles.length === 0) return null;

      // Estimate timestamp based on x position
      const candleWidth = chartRect.width / visibleCandles.length;
      const candleIndex = Math.floor(x / candleWidth);
      const candle = visibleCandles[candleIndex];

      if (!candle) return null;

      // Estimate price based on y position
      const minPrice = Math.min(...visibleCandles.map((c: any) => c.low));
      const maxPrice = Math.max(...visibleCandles.map((c: any) => c.high));
      const priceRange = maxPrice - minPrice;

      // Y is inverted (0 at top)
      const priceRatio = y / chartRect.height;
      const price = maxPrice - (priceRange * priceRatio);

      return {
        timestamp: candle.timestamp,
        price
      };
    } catch (error) {
      console.error('Error estimating chart values:', error);
      return null;
    }
  }
}
