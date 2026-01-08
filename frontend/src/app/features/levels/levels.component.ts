import { Component, signal, OnInit, effect, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
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
  IchimokuCloud
} from '../../shared/models/levels.model';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
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
                    </select>
                  </div>

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

  currentIndex = signal(0);
  selectedLevelType = signal<LevelType>('pivot');
  selectedInterval = signal<LevelInterval>('1d');
  loading = signal(false);
  error = signal<string | null>(null);

  intervalOptions = LEVEL_INTERVAL_OPTIONS;

  private charts: Map<number, Chart> = new Map();
  private resizeObservers: Map<number, ResizeObserver> = new Map();
  private currentLevelsData: LevelsResponse | null = null;

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
    this.selectedLevelType.set(type);
    // Recalcular automáticamente si ya hay datos
    if (this.currentLevelsData) {
      this.calculateLevels();
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
}
