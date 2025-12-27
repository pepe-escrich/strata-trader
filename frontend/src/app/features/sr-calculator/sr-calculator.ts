import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';

interface SRLevel {
  id?: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  touches: number;
  method: string;
  status: string;
  active: boolean;
}

interface CalculationParams {
  symbol: string;
  timeframe: string;
  // Parámetros de cálculo
  lookbackPeriod: number;
  minTouches: number;
  priceThreshold: number;
  volumeWeight: number;
  timeWeight: number;
  usePivotPoints: boolean;
  useFibonacci: boolean;
  useVolumeProfile: boolean;
}

@Component({
  selector: 'app-sr-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    TableModule,
    TagModule,
    ToggleButtonModule,
    AccordionModule,
    DividerModule
  ],
  templateUrl: './sr-calculator.html',
  styleUrl: './sr-calculator.scss'
})
export class SRCalculator implements OnInit {
  loading = signal(false);
  calculating = signal(false);

  // Opciones de selección
  symbolOptions = [
    { label: 'BTC/USDT', value: 'BTCUSDT' },
    { label: 'ETH/USDT', value: 'ETHUSDT' },
    { label: 'BNB/USDT', value: 'BNBUSDT' },
    { label: 'SOL/USDT', value: 'SOLUSDT' },
    { label: 'XRP/USDT', value: 'XRPUSDT' }
  ];

  timeframeOptions = [
    { label: '1 Minuto', value: '1m' },
    { label: '5 Minutos', value: '5m' },
    { label: '15 Minutos', value: '15m' },
    { label: '1 Hora', value: '1h' },
    { label: '4 Horas', value: '4h' },
    { label: '1 Día', value: '1d' },
    { label: '1 Semana', value: '1w' }
  ];

  // Parámetros de cálculo
  params: CalculationParams = {
    symbol: 'BTCUSDT',
    timeframe: '1h',
    lookbackPeriod: 100,
    minTouches: 2,
    priceThreshold: 0.5,
    volumeWeight: 30,
    timeWeight: 20,
    usePivotPoints: true,
    useFibonacci: false,
    useVolumeProfile: true
  };

  // Niveles calculados
  levels: SRLevel[] = [];
  currentPrice = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Cargar precio actual
    this.loadCurrentPrice();
  }

  loadCurrentPrice() {
    this.loading.set(true);

    this.http.get<any>(`${environment.apiUrl}/market/ticker/${this.params.symbol}`).subscribe({
      next: (data) => {
        this.currentPrice = data.price;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading price:', err);
        this.currentPrice = 0;
        this.loading.set(false);
      }
    });
  }

  calculateLevels() {
    this.calculating.set(true);

    // Preparar el body de la petición
    const body = {
      symbol: this.params.symbol,
      timeframes: [this.params.timeframe],
      minStrength: 0 // Obtenemos todos los niveles sin filtrar por fuerza mínima
    };

    this.http.post<any>(`${environment.apiUrl}/levels/calculate`, body).subscribe({
      next: (data) => {
        // El backend devuelve { symbol, timeframes, results: { '1h': { count, levels } } }
        const timeframeData = data.results[this.params.timeframe];

        if (timeframeData && timeframeData.levels) {
          // Convertir los niveles recibidos y marcarlos como activos por defecto
          this.levels = timeframeData.levels.map((level: any) => ({
            ...level,
            active: true
          }));
        } else {
          this.levels = [];
        }

        this.calculating.set(false);
      },
      error: (err) => {
        console.error('Error calculating levels:', err);
        this.levels = [];
        this.calculating.set(false);
      }
    });
  }

  saveLevels() {
    const activeLevels = this.levels.filter(l => l.active);

    this.http.post(`${environment.apiUrl}/levels/save`, {
      symbol: this.params.symbol,
      timeframe: this.params.timeframe,
      levels: activeLevels,
      params: this.params
    }).subscribe({
      next: () => {
        console.log('Levels saved successfully');
      },
      error: (err) => {
        console.error('Error saving levels:', err);
      }
    });
  }

  toggleLevel(level: SRLevel) {
    level.active = !level.active;
  }

  getTypeColor(type: string): 'success' | 'danger' {
    return type === 'SUPPORT' ? 'success' : 'danger';
  }

  getStrengthColor(strength: number): 'success' | 'warn' | 'secondary' {
    if (strength >= 70) return 'success';
    if (strength >= 40) return 'warn';
    return 'secondary';
  }

  formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  formatDistance(level: SRLevel): string {
    if (!this.currentPrice) return '-';
    const diff = ((level.price - this.currentPrice) / this.currentPrice) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`;
  }

  isDesktop(): boolean {
    return window.innerWidth >= 768;
  }
}
