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
import { createChart, CandlestickData, CandlestickSeriesOptions } from 'lightweight-charts';
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
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <span>Cargando datos...</span>
          </div>
        }
        @if (error()) {
          <div class="error">
            <span>❌ {{ error() }}</span>
            <button class="retry-btn" (click)="loadChartData()">Reintentar</button>
          </div>
        }

        <div #chartContainer class="chart-container"></div>
      </div>

      <!-- Selector de pares con scroll -->
      @if (pairsService.enabledPairs().length > 1) {
        <div class="cards-scroll" (scroll)="onScroll($event)">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="slide" [class.active]="currentIndex() === idx">
              <div class="pair-card" [style.borderColor]="pair.color">
                <span class="pair-icon">{{ pair.icon }}</span>
                <span class="pair-name">{{ pair.name }}</span>
              </div>
            </div>
          }
        </div>

        <div class="pagination-dots">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <button
              class="dot"
              [class.active]="currentIndex() === idx"
              [style.background]="currentIndex() === idx ? pair.color : '#d1d5db'"
              (click)="goToSlide(idx)">
            </button>
          }
        </div>
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
      padding: 20px;
      gap: 16px;
      height: 100%; /* Asegurar que tome toda la altura disponible */
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

    .cards-scroll {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      width: 100%;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .slide {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      padding: 0 10px;
      display: flex;
      justify-content: center;
    }

    .pair-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: white;
      border: 2px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;

      .pair-icon {
        font-size: 20px;
      }

      .pair-name {
        color: #374151;
        font-weight: 600;
      }
    }

    .pagination-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
      border: none;
      padding: 0;
      cursor: pointer;
      transition: all 0.3s;

      &.active {
        width: 24px;
        border-radius: 4px;
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

  private chart: any = null;
  private candleSeries: any = null;
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
        // Solo cargar datos si el chart ya está inicializado
        if (this.chartInitialized) {
          this.loadChartData();
        }
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
      this.chart.remove();
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
      this.chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Probar cada método hasta encontrar el que crea la serie
      let seriesCreated = false;
      const options = {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      };

      const allKeys = Object.keys(this.chart);
      for (const key of allKeys) {
        if (typeof (this.chart as any)[key] !== 'function') continue;

        try {
          const result = (this.chart as any)[key](options);
          // Verificar si el resultado parece una serie
          if (result && typeof result === 'object' && result.setData) {
            this.candleSeries = result;
            seriesCreated = true;
            break;
          }
        } catch (e: any) {
          // Continuar probando otros métodos
        }
      }

      if (!seriesCreated) {
        throw new Error('No se pudo crear la serie de velas');
      }

      // Responsive resize
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.chart && entries.length > 0) {
          const { width, height } = entries[0].contentRect;
          this.chart.resize(width, height);
        }
      });
      this.resizeObserver.observe(container);

      // Marcar el chart como inicializado
      this.chartInitialized = true;

      console.log('Chart initialized successfully', {
        chart: this.chart,
        candleSeries: this.candleSeries,
        dimensions: `${container.clientWidth}x${container.clientHeight}`
      });
    } catch (error: any) {
      console.error('Error initializing chart:', error);
    }
  }

  loadChartData(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      return;
    }

    if (!this.chartInitialized) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.marketService
      .getKlines(currentPair.symbol, this.selectedTimeframe(), 500)
      .subscribe({
        next: (candles) => {
          if (candles.length > 0 && this.candleSeries) {
            const data: CandlestickData[] = candles.map(c => ({
              time: c.time as any,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }));

            try {
              this.candleSeries.setData(data);
              this.chart?.timeScale().fitContent();
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
      const container = document.querySelector('.cards-scroll');
      if (container) {
        container.scrollTo({
          left: index * container.clientWidth,
          behavior: 'smooth'
        });
      }
    }
  }
}
