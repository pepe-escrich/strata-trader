import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../core/services/api.service';
import { Ticker } from '../../core/models/market.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, ButtonModule, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  tickers: Ticker[] = [];
  loading = true;
  error: string | null = null;
  private refreshInterval: any;

  // PrimeNG table configuration
  columns = [
    { field: 'symbol', header: 'Symbol' },
    { field: 'price', header: 'Price' },
    { field: 'priceChangePercent', header: '24h Change %' },
    { field: 'high24h', header: '24h High' },
    { field: 'low24h', header: '24h Low' },
    { field: 'volume24h', header: '24h Volume' },
  ];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadTickers();
    // Auto-refresh every 5 seconds
    this.refreshInterval = setInterval(() => this.loadTickers(), 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadTickers() {
    try {
      this.loading = true;
      this.error = null;

      // Get all tickers and filter for popular pairs
      const allTickers = await this.apiService.getAllTickers();

      // Filter for major pairs
      const popularSymbols = ['BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'SOL-USDT', 'XRP-USDT'];
      this.tickers = allTickers
        .filter(t => popularSymbols.includes(t.symbol))
        .slice(0, 10);

    } catch (error: any) {
      console.error('Error loading tickers:', error);
      this.error = error.message || 'Failed to load market data';
    } finally {
      this.loading = false;
    }
  }

  getPriceChangeColor(change: number): string {
    return change >= 0 ? 'success' : 'danger';
  }

  formatNumber(value: number, decimals: number = 2): string {
    return value?.toFixed(decimals) || '0.00';
  }

  formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
  }
}
