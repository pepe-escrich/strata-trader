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
import { createChart, CandlestickData } from 'lightweight-charts';
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

      <!-- Selector de pares -->
      @if (pairsService.enabledPairs().length > 1) {
        <div class="pair-selector">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <button
              class="pair-btn"
              [class.active]="currentIndex() === idx"
              [style.borderColor]="pair.color"
              (click)="goToSlide(idx)">
              <span class="pair-icon">{{ pair.icon }}</span>
              <span class="pair-name">{{ pair.name }}</span>
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

      <!-- Panel de Debug -->
      <div class="debug-panel">
        <button class="debug-toggle" (click)="toggleDebug()">
          {{ showDebug() ? '🔽' : '▶️' }} Debug
        </button>
        @if (showDebug()) {
          <pre class="debug-content">{{ debugInfo() || 'Esperando logs...' }}</pre>
        }
      </div>
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

    .pair-selector {
      display: flex;
      gap: 8px;
      padding: 0;
      overflow-x: auto;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
      }
    }

    .pair-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      font-size: 14px;
      font-weight: 500;

      &:hover {
        background: #f3f4f6;
      }

      &.active {
        background: rgba(102, 126, 234, 0.1);
        border-width: 2px;
      }

      .pair-icon {
        font-size: 18px;
      }

      .pair-name {
        color: #374151;
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

    .debug-panel {
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #333;
      border-radius: 8px;
      z-index: 1000;
      max-height: 300px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .debug-toggle {
      width: 100%;
      background: #1a1a1a;
      color: #fff;
      border: none;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .debug-toggle:active {
      background: #2a2a2a;
    }

    .debug-content {
      margin: 0;
      padding: 12px;
      background: #0a0a0a;
      color: #0f0;
      font-size: 11px;
      font-family: 'Courier New', monospace;
      overflow-y: auto;
      max-height: 250px;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
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
  debugInfo = signal<string>('');
  showDebug = signal<boolean>(true);

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
    let debugLog = `[ngOnInit] Pares habilitados: ${pairs.length}\n`;
    if (pairs.length > 0) {
      this.activePairService.setActivePair(pairs[0]);
      debugLog += `Par activo: ${pairs[0].symbol}\n`;
    }
    this.debugInfo.set(debugLog);
  }

  ngAfterViewInit(): void {
    let debugLog = this.debugInfo() + `[ngAfterViewInit] Iniciando...\n`;
    debugLog += `chartContainer disponible: ${!!this.chartContainer}\n`;
    this.debugInfo.set(debugLog);

    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      let log = this.debugInfo() + `[setTimeout 100ms] Ejecutando inicialización...\n`;
      this.debugInfo.set(log);
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
    let debugLog = this.debugInfo() + `\n[INIT CHART] Iniciando...\n`;

    if (!this.chartContainer) {
      debugLog += `❌ chartContainer no disponible\n`;
      debugLog += `  ViewChild: ${this.chartContainer}\n`;
      this.debugInfo.set(debugLog);
      console.error('chartContainer is not available');
      return;
    }

    debugLog += `✅ chartContainer disponible\n`;

    const container = this.chartContainer.nativeElement;
    debugLog += `Container dimensions: ${container.clientWidth}x${container.clientHeight}\n`;

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      debugLog += `❌ Container sin dimensiones\n`;
      debugLog += `  width: ${container.clientWidth}\n`;
      debugLog += `  height: ${container.clientHeight}\n`;
      this.debugInfo.set(debugLog);
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

      debugLog += `✅ Chart creado (${typeof this.chart})\n`;

      this.candleSeries = this.chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      debugLog += `✅ CandleSeries creado (${typeof this.candleSeries})\n`;
      debugLog += `  this.chart: ${!!this.chart}\n`;
      debugLog += `  this.candleSeries: ${!!this.candleSeries}\n`;

      // Responsive resize
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.chart && entries.length > 0) {
          const { width, height } = entries[0].contentRect;
          this.chart.resize(width, height);
        }
      });
      this.resizeObserver.observe(container);

      debugLog += `✅ ResizeObserver configurado\n`;

      // Marcar el chart como inicializado
      this.chartInitialized = true;
      debugLog += `✅ Chart marcado como inicializado\n`;

      this.debugInfo.set(debugLog);

      console.log('Chart initialized successfully', {
        chart: this.chart,
        candleSeries: this.candleSeries,
        dimensions: `${container.clientWidth}x${container.clientHeight}`
      });
    } catch (error: any) {
      debugLog += `❌ Error al crear chart: ${error.message}\n`;
      debugLog += `  Stack: ${error.stack}\n`;
      this.debugInfo.set(debugLog);
      console.error('Error initializing chart:', error);
    }
  }

  loadChartData(): void {
    const currentPair = this.activePairService.currentPair();
    if (!currentPair) {
      let log = this.debugInfo() + '⚠️ No hay par activo\n';
      this.debugInfo.set(log);
      return;
    }

    if (!this.chartInitialized) {
      let log = this.debugInfo() + `⚠️ Chart no inicializado todavía, esperando...\n`;
      this.debugInfo.set(log);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    let debugLog = this.debugInfo() + `\n[${timestamp}] Cargando datos...\n`;
    debugLog += `Par: ${currentPair.symbol}\n`;
    debugLog += `Timeframe: ${this.selectedTimeframe()}\n`;
    debugLog += `URL API: ${this.marketService['apiUrl']}\n`;
    debugLog += `Estado ANTES de petición:\n`;
    debugLog += `  - chartInitialized: ${this.chartInitialized}\n`;
    debugLog += `  - chart: ${!!this.chart}\n`;
    debugLog += `  - candleSeries: ${!!this.candleSeries}\n\n`;

    this.debugInfo.set(debugLog);
    this.loading.set(true);
    this.error.set(null);

    this.marketService
      .getKlines(currentPair.symbol, this.selectedTimeframe(), 500)
      .subscribe({
        next: (candles) => {
          debugLog += `✅ Respuesta recibida\n`;
          debugLog += `Velas recibidas: ${candles.length}\n`;

          if (candles.length > 0) {
            debugLog += `Primera vela: ${JSON.stringify(candles[0], null, 2)}\n`;
            debugLog += `Última vela: ${JSON.stringify(candles[candles.length - 1], null, 2)}\n\n`;

            debugLog += `Estado AL RECIBIR datos:\n`;
            debugLog += `  - chart: ${!!this.chart}\n`;
            debugLog += `  - candleSeries: ${!!this.candleSeries}\n`;
            debugLog += `  - candleSeries type: ${typeof this.candleSeries}\n\n`;

            if (this.candleSeries) {
              const data: CandlestickData[] = candles.map(c => ({
                time: c.time as any,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
              }));

              debugLog += `\nDatos transformados: ${data.length} velas\n`;
              debugLog += `Chart existe: ${!!this.chart}\n`;
              debugLog += `CandleSeries existe: ${!!this.candleSeries}\n`;

              try {
                this.candleSeries.setData(data);
                this.chart?.timeScale().fitContent();
                debugLog += `✅ Datos cargados en el gráfico\n`;
              } catch (e: any) {
                debugLog += `❌ Error al cargar en gráfico: ${e.message}\n`;
              }
            } else {
              debugLog += `❌ CandleSeries no inicializado\n`;
            }
          } else {
            debugLog += `⚠️ No se recibieron velas\n`;
          }

          this.debugInfo.set(debugLog);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading chart data:', err);

          debugLog += `\n❌ ERROR\n`;
          debugLog += `Status: ${err.status || 'unknown'}\n`;
          debugLog += `URL: ${err.url || 'N/A'}\n`;

          if (err.error) {
            if (typeof err.error === 'string') {
              debugLog += `Backend: ${err.error}\n`;
            } else {
              debugLog += `Backend: ${JSON.stringify(err.error, null, 2)}\n`;
            }
          }

          if (err.message) {
            debugLog += `Client: ${err.message}\n`;
          }

          this.debugInfo.set(debugLog);

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

  toggleDebug(): void {
    this.showDebug.set(!this.showDebug());
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

  goToSlide(index: number): void {
    const pairs = this.pairsService.enabledPairs();
    if (index >= 0 && index < pairs.length) {
      this.currentIndex.set(index);
      this.activePairService.setActivePair(pairs[index]);
      this.loadChartData();
    }
  }
}
