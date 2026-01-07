import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { init, dispose, CandleType } from 'klinecharts';
import type { Chart } from 'klinecharts';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';
import { BingxMarketService } from '../../shared/services/bingx-market.service';
import {
  Timeframe,
  RefreshInterval,
  TIMEFRAME_OPTIONS,
  REFRESH_INTERVAL_OPTIONS,
} from '../../shared/models/candlestick.model';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [BingxMarketService],
  template: `
    <div class="viewer-container">
      @if (pairsService.enabledPairs().length > 0) {
        <!-- Contenedor deslizable completo -->
        <div class="slides-scroll" (scroll)="onScroll($event)">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="slide" [class.active]="currentIndex() === idx">

              <!-- Controles -->
              <div class="controls">
                <div class="control-group">
                  <label>Temporalidad:</label>
                  <div class="button-group">
                    @for (option of timeframeOptions; track option.value) {
                      <button
                        class="control-btn"
                        [class.active]="selectedTimeframe() === option.value"
                        (click)="setTimeframe(option.value)"
                        [disabled]="loading()">
                        {{ option.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="control-group">
                  <label>Actualización:</label>
                  <div class="button-group">
                    @for (option of refreshOptions; track option.value) {
                      <button
                        class="control-btn"
                        [class.active]="refreshInterval() === option.value"
                        (click)="setRefreshInterval(option.value)">
                        {{ option.label }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Gráfico -->
              <div class="chart-wrapper">
                @if (loading() && currentIndex() === idx) {
                  <div class="loading">
                    <div class="spinner"></div>
                    <span>Cargando datos...</span>
                  </div>
                }
                @if (error() && currentIndex() === idx) {
                  <div class="error">
                    <span>❌ {{ error() }}</span>
                    <button class="retry-btn" (click)="loadChartData()">Reintentar</button>
                  </div>
                }

                @if (currentIndex() === idx) {
                  <div #chartContainer class="chart-container"></div>
                }
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
    .viewer-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
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

    .button-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .control-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      &.active {
        background: #667eea;
        border-color: #667eea;
        color: white;
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
      min-height: 400px; /* Altura mínima garantizada */
      display: flex;
      flex-direction: column;
    }

    .chart-container {
      flex: 1;
      min-height: 400px; /* Altura mínima garantizada */
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
      overflow-y: auto;

      span {
        font-size: 12px;
        color: #ef4444;
        text-align: left;
        max-width: 100%;
        word-wrap: break-word;
        white-space: pre-wrap;
        font-family: monospace;
        background: #fee;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #fcc;
        line-height: 1.6;
        max-height: 80vh;
        overflow-y: auto;
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

    .pair-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: white;
      border: 3px solid #d1d5db;
      border-radius: 16px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s;

      .pair-icon {
        font-size: 32px;
      }

      .pair-name {
        color: #374151;
        font-weight: 600;
        font-size: 18px;
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
  `],
})
export class ViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;

  currentIndex = signal(0);
  selectedTimeframe = signal<Timeframe>('15m');
  refreshInterval = signal<RefreshInterval>(30);
  loading = signal(false);
  error = signal<string | null>(null);

  timeframeOptions = TIMEFRAME_OPTIONS;
  refreshOptions = REFRESH_INTERVAL_OPTIONS;

  private chart: Chart | null = null;
  private refreshTimer: any = null;
  private resizeObserver: ResizeObserver | null = null;
  private chartInitialized = false;

  constructor(
    public pairsService: CryptoPairsService,
    private activePairService: ActivePairService,
    private marketService: BingxMarketService
  ) {
    // Actualizar par activo cuando cambie el índice
    effect(() => {
      const index = this.currentIndex();
      const pairs = this.pairsService.enabledPairs();
      if (pairs.length > 0 && index < pairs.length) {
        this.activePairService.setActivePair(pairs[index]);
        // Reinicializar el gráfico para el nuevo slide
        setTimeout(() => {
          if (this.chart && this.chartContainer) {
            dispose(this.chartContainer.nativeElement);
            this.chart = null;
            this.chartInitialized = false;
          }
          if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
          }
          this.initChart();
          if (this.chartInitialized) {
            this.loadChartData();
          }
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
      this.initChart();
      this.loadChartData();
      this.startAutoRefresh();
    }, 100);
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      dispose(this.chartContainer.nativeElement);
    }
  }

  private initChart(): void {
    if (!this.chartContainer) {
      console.error('chartContainer is not available');
      return;
    }

    const container = this.chartContainer.nativeElement;

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

      this.chart = chart;

      // Configurar estilos para las velas con tipo correcto
      chart.setStyles({
        candle: {
          type: CandleType.CandleSolid,
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

      // Responsive resize
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.resize();
        }
      });
      this.resizeObserver.observe(container);

      // Marcar el chart como inicializado
      this.chartInitialized = true;

      console.log('KLineChart initialized successfully');
    } catch (error: any) {
      console.error('Error initializing chart:', error);
    }
  }

  loadChartData(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      return;
    }

    if (!this.chartInitialized || !this.chart) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.marketService
      .getKlines(currentPair.symbol, this.selectedTimeframe(), 500)
      .subscribe({
        next: (candles) => {
          if (candles.length > 0 && this.chart) {
            // Convertir datos al formato de KLineChart
            const data = candles.map(c => ({
              timestamp: c.time * 1000, // KLineChart espera milliseconds
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: 0, // Opcional, podríamos agregar volumen si está disponible
            }));

            try {
              // Cargar datos usando API de v9
              (this.chart as any).applyNewData(data);
              console.log('Loaded', data.length, 'candles');
            } catch (e: any) {
              console.error('Error loading data into chart:', e);
            }
          }

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading chart data:', err);

          let errorMessage = 'Error al cargar los datos del gráfico\n\n';
          errorMessage += `Status: ${err.status || 'unknown'}\n`;
          errorMessage += `URL: ${err.url || 'N/A'}\n\n`;

          if (err.error) {
            if (typeof err.error === 'string') {
              errorMessage += `Backend: ${err.error}\n`;
            } else if (err.error.message) {
              errorMessage += `Backend: ${err.error.message}\n`;
            } else {
              errorMessage += `Backend: ${JSON.stringify(err.error, null, 2)}\n`;
            }
          }

          if (err.message) {
            errorMessage += `Client: ${err.message}\n`;
          }

          if (err.statusText && err.statusText !== 'Unknown Error') {
            errorMessage += `StatusText: ${err.statusText}\n`;
          }

          this.error.set(errorMessage);
          this.loading.set(false);
        },
      });
  }

  setTimeframe(timeframe: Timeframe): void {
    this.selectedTimeframe.set(timeframe);
    this.loadChartData();
  }

  setRefreshInterval(interval: RefreshInterval): void {
    this.refreshInterval.set(interval);
    this.stopAutoRefresh();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    const intervalMs = this.refreshInterval() * 1000;
    this.refreshTimer = setInterval(() => {
      this.loadChartData();
    }, intervalMs);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
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
