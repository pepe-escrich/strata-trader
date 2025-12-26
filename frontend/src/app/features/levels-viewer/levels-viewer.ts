import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabsModule } from 'primeng/tabs';
import { ApiService } from '../../core/services/api.service';
import { Level, Ticker, StrengthAnalysisResponse } from '../../core/models/market.model';

interface SymbolOption {
  label: string;
  value: string;
}

interface TimeframeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-levels-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    SelectModule,
    InputNumberModule,
    TabsModule,
  ],
  templateUrl: './levels-viewer.html',
  styleUrl: './levels-viewer.scss',
})
export class LevelsViewer implements OnInit, OnDestroy {
  // Data
  levels: Level[] = [];
  currentPrice = 0;
  strengthAnalysis: StrengthAnalysisResponse | null = null;

  // UI State
  loading = true;
  error: string | null = null;
  activeTab = 'all';

  // Filters
  selectedSymbol = 'BTC-USDT';
  selectedTimeframe = '1h';
  minStrength = 0;

  // Options
  symbolOptions: SymbolOption[] = [
    { label: 'BTC-USDT', value: 'BTC-USDT' },
    { label: 'ETH-USDT', value: 'ETH-USDT' },
    { label: 'BNB-USDT', value: 'BNB-USDT' },
    { label: 'SOL-USDT', value: 'SOL-USDT' },
    { label: 'XRP-USDT', value: 'XRP-USDT' },
  ];

  timeframeOptions: TimeframeOption[] = [
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];

  // Auto-refresh
  private refreshInterval: any;

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    await this.loadData();
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadData() {
    await Promise.all([this.loadLevels(), this.loadCurrentPrice()]);
  }

  async loadLevels() {
    try {
      this.loading = true;
      this.error = null;

      const response = await this.apiService.getLevels(
        this.selectedSymbol,
        this.selectedTimeframe,
        this.minStrength || undefined
      );

      this.levels = response.levels;

      // Also load strength analysis for the analysis tab
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

  async loadStrengthAnalysis() {
    try {
      this.strengthAnalysis = await this.apiService.getLevelStrength(
        this.selectedSymbol,
        this.selectedTimeframe
      );
    } catch (error: any) {
      console.error('Error loading strength analysis:', error);
    }
  }

  async loadCurrentPrice() {
    try {
      const ticker = await this.apiService.getTicker(this.selectedSymbol);
      this.currentPrice = ticker.price;
    } catch (error: any) {
      console.error('Error loading current price:', error);
    }
  }

  async onFilterChange() {
    await this.loadLevels();
  }

  async onTabChange(event: any) {
    this.activeTab = event.value;
    if (this.activeTab === 'analysis' && !this.strengthAnalysis) {
      await this.loadStrengthAnalysis();
    }
  }

  async forceRecalculate() {
    try {
      this.loading = true;
      this.error = null;

      await this.apiService.calculateLevels(
        this.selectedSymbol,
        [this.selectedTimeframe],
        this.minStrength || undefined
      );

      await this.loadLevels();
    } catch (error: any) {
      console.error('Error recalculating levels:', error);
      this.error = error.message || 'Failed to recalculate levels';
      this.loading = false;
    }
  }

  // UI Helper Methods
  getTypeColor(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return type === 'SUPPORT' ? 'success' : 'danger';
  }

  getStrengthColor(strength: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (strength >= 70) return 'success';
    if (strength >= 40) return 'warn';
    return 'secondary';
  }

  getStrengthLabel(strength: number): string {
    if (strength >= 70) return 'Strong';
    if (strength >= 40) return 'Medium';
    return 'Weak';
  }

  getStatusColor(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'ACTIVE':
        return 'info';
      case 'TESTED':
        return 'warn';
      case 'BROKEN':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getMethodLabel(method: string): string {
    return method.replace(/_/g, ' ');
  }

  getDistanceFromPrice(level: Level): { value: number; percent: number } {
    const distance = level.price - this.currentPrice;
    const percent = (distance / this.currentPrice) * 100;
    return {
      value: Math.abs(distance),
      percent: Math.abs(percent),
    };
  }

  formatNumber(value: number, decimals: number = 2): string {
    return value?.toFixed(decimals) || '0.00';
  }

  formatDistance(level: Level): string {
    const dist = this.getDistanceFromPrice(level);
    const sign = level.price > this.currentPrice ? '+' : '-';
    return `${sign}${this.formatNumber(dist.percent, 2)}%`;
  }

  getSortedSupports(): Level[] {
    return this.strengthAnalysis?.byType.supports.levels || [];
  }

  getSortedResistances(): Level[] {
    return this.strengthAnalysis?.byType.resistances.levels || [];
  }

  calculatePercentage(count: number): number {
    const total = this.levels.length;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  calculateAverageStrength(levels: Level[]): number {
    if (!levels || levels.length === 0) return 0;
    const sum = levels.reduce((acc, level) => acc + level.strength, 0);
    return sum / levels.length;
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark-mode');
  }
}
