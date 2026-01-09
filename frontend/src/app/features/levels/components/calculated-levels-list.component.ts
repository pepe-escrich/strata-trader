import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelsService } from '../../../shared/services/levels.service';
import {
  LevelsResponse,
  PivotPoints,
  FibonacciRetracement,
  IchimokuCloud,
  SaveLevelRequest
} from '../../../shared/models/levels.model';

interface NormalizedLevel {
  id: string;
  label: string;
  price: number;
  type: 'support' | 'resistance' | 'neutral';
  calculationMethod: string;
  interval: string;
  color: string;
}

@Component({
  selector: 'app-calculated-levels-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="levels-list">
      <div class="list-header">
        <h3>Niveles Calculados</h3>
        <button
          class="save-btn"
          [disabled]="selectedLevels.length === 0 || saving"
          (click)="saveLevels()">
          @if (saving) {
            <span class="loading-spinner"></span>
            <span>Guardando...</span>
          } @else {
            <span>Guardar Seleccionados ({{ selectedLevels.length }})</span>
          }
        </button>
      </div>

      <div class="list-content">
        @if (normalizedLevels.length === 0) {
          <div class="empty-state">
            <p>No hay niveles calculados. Haz clic en "Calcular" para generar niveles.</p>
          </div>
        }

        @for (level of normalizedLevels; track level.id) {
          <div class="level-row" [class.selected]="isSelected(level)">
            <input
              type="checkbox"
              [checked]="isSelected(level)"
              (change)="toggleSelection(level)"
              class="level-checkbox">

            <div class="level-info">
              <span class="level-label" [style.color]="level.color">
                {{ level.label }}
              </span>
              <span class="level-price">{{ level.price | number:'1.2-6' }}</span>
            </div>

            <div class="level-meta">
              <span class="method-badge" [attr.data-method]="level.calculationMethod">
                {{ level.calculationMethod }}
              </span>
              <span class="interval-badge">{{ level.interval }}</span>
              <span class="type-badge" [attr.data-type]="level.type">
                {{ getTypeLabel(level.type) }}
              </span>
            </div>
          </div>
        }
      </div>

      @if (successMessage) {
        <div class="success-message">
          ✓ {{ successMessage }}
        </div>
      }

      @if (errorMessage) {
        <div class="error-message">
          ✗ {{ errorMessage }}
        </div>
      }
    </div>
  `,
  styles: [`
    .levels-list {
      margin-top: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 2px solid #e5e7eb;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .list-header h3 {
      margin: 0;
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .save-btn {
      padding: 8px 16px;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .save-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #667eea;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .list-content {
      max-height: 400px;
      overflow-y: auto;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #6b7280;
    }

    .level-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
      cursor: pointer;
    }

    .level-row:hover {
      background: #f9fafb;
    }

    .level-row.selected {
      background: #eff6ff;
    }

    .level-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .level-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 150px;
    }

    .level-label {
      font-weight: 600;
      font-size: 14px;
    }

    .level-price {
      font-size: 13px;
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }

    .level-meta {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .method-badge,
    .interval-badge,
    .type-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .method-badge {
      background: #dbeafe;
      color: #1e40af;
    }

    .method-badge[data-method="fibonacci"] {
      background: #fef3c7;
      color: #92400e;
    }

    .method-badge[data-method="ichimoku"] {
      background: #d1fae5;
      color: #065f46;
    }

    .method-badge[data-method="frvp"] {
      background: #f3e8ff;
      color: #6b21a8;
    }

    .interval-badge {
      background: #e5e7eb;
      color: #374151;
    }

    .type-badge[data-type="resistance"] {
      background: #fee2e2;
      color: #991b1b;
    }

    .type-badge[data-type="support"] {
      background: #dcfce7;
      color: #166534;
    }

    .type-badge[data-type="neutral"] {
      background: #f3f4f6;
      color: #6b7280;
    }

    .success-message {
      padding: 12px 20px;
      background: #d1fae5;
      color: #065f46;
      font-size: 14px;
      font-weight: 500;
    }

    .error-message {
      padding: 12px 20px;
      background: #fee2e2;
      color: #991b1b;
      font-size: 14px;
      font-weight: 500;
    }

    /* Scrollbar styling */
    .list-content::-webkit-scrollbar {
      width: 8px;
    }

    .list-content::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    .list-content::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 4px;
    }

    .list-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class CalculatedLevelsListComponent implements OnChanges {
  @Input() levelsResponse: LevelsResponse | null = null;
  @Input() symbol: string = '';
  @Input() loading: boolean = false;
  @Output() levelsSaved = new EventEmitter<void>();

  selectedLevels: NormalizedLevel[] = [];
  normalizedLevels: NormalizedLevel[] = [];
  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private levelsService: LevelsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['levelsResponse'] && this.levelsResponse) {
      this.normalizedLevels = this.normalizeLevelsResponse(this.levelsResponse);
      // Clear previous selection when new levels are calculated
      this.selectedLevels = [];
      this.clearMessages();
    }
  }

  private normalizeLevelsResponse(response: LevelsResponse): NormalizedLevel[] {
    const levels: NormalizedLevel[] = [];

    switch (response.type) {
      case 'pivot':
        levels.push(...this.normalizePivotPoints(response.data as PivotPoints, response));
        break;
      case 'fibonacci':
        levels.push(...this.normalizeFibonacci(response.data as FibonacciRetracement, response));
        break;
      case 'ichimoku':
        levels.push(...this.normalizeIchimoku(response.data as IchimokuCloud, response));
        break;
    }

    return levels;
  }

  private normalizePivotPoints(data: PivotPoints, response: LevelsResponse): NormalizedLevel[] {
    const levels: NormalizedLevel[] = [];
    const baseId = `pivot_${response.symbol}_${response.interval}`;

    // Resistance levels (R3, R2, R1)
    if (data.r3) {
      levels.push({
        id: `${baseId}_r3`,
        label: 'R3',
        price: data.r3,
        type: 'resistance',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#ef4444' // Red
      });
    }
    if (data.r2) {
      levels.push({
        id: `${baseId}_r2`,
        label: 'R2',
        price: data.r2,
        type: 'resistance',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#f87171'
      });
    }
    if (data.r1) {
      levels.push({
        id: `${baseId}_r1`,
        label: 'R1',
        price: data.r1,
        type: 'resistance',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#fca5a5'
      });
    }

    // Pivot point
    if (data.p) {
      levels.push({
        id: `${baseId}_p`,
        label: 'P',
        price: data.p,
        type: 'neutral',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#f59e0b' // Amber
      });
    }

    // Support levels (S1, S2, S3)
    if (data.s1) {
      levels.push({
        id: `${baseId}_s1`,
        label: 'S1',
        price: data.s1,
        type: 'support',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#86efac'
      });
    }
    if (data.s2) {
      levels.push({
        id: `${baseId}_s2`,
        label: 'S2',
        price: data.s2,
        type: 'support',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#4ade80'
      });
    }
    if (data.s3) {
      levels.push({
        id: `${baseId}_s3`,
        label: 'S3',
        price: data.s3,
        type: 'support',
        calculationMethod: 'pivot',
        interval: response.interval,
        color: '#10b981' // Green
      });
    }

    return levels;
  }

  private normalizeFibonacci(data: FibonacciRetracement, response: LevelsResponse): NormalizedLevel[] {
    const levels: NormalizedLevel[] = [];
    const baseId = `fib_${response.symbol}_${response.interval}`;

    data.levels.forEach(fibLevel => {
      const percentage = parseFloat(fibLevel.level.replace('%', ''));
      let type: 'support' | 'resistance' | 'neutral' = 'neutral';
      let color = '#f59e0b';

      if (percentage < 50) {
        type = 'support';
        color = '#10b981';
      } else if (percentage > 50) {
        type = 'resistance';
        color = '#ef4444';
      }

      levels.push({
        id: `${baseId}_${fibLevel.level.replace('%', '').replace('.', '_')}`,
        label: fibLevel.level,
        price: fibLevel.price,
        type,
        calculationMethod: 'fibonacci',
        interval: response.interval,
        color
      });
    });

    return levels;
  }

  private normalizeIchimoku(data: IchimokuCloud, response: LevelsResponse): NormalizedLevel[] {
    const levels: NormalizedLevel[] = [];
    const baseId = `ichi_${response.symbol}_${response.interval}`;

    const ichimokuLevels = [
      { key: 'conversion', label: 'Tenkan', price: data.conversion, color: '#ef4444' },
      { key: 'base', label: 'Kijun', price: data.base, color: '#3b82f6' },
      { key: 'spanA', label: 'Senkou A', price: data.spanA, color: '#10b981' },
      { key: 'spanB', label: 'Senkou B', price: data.spanB, color: '#f59e0b' },
      { key: 'currentSpanA', label: 'Current Span A', price: data.currentSpanA, color: '#8b5cf6' },
      { key: 'currentSpanB', label: 'Current Span B', price: data.currentSpanB, color: '#ec4899' }
    ];

    ichimokuLevels.forEach(level => {
      if (level.price) {
        levels.push({
          id: `${baseId}_${level.key}`,
          label: level.label,
          price: level.price,
          type: 'neutral', // Ichimoku levels are typically neutral
          calculationMethod: 'ichimoku',
          interval: response.interval,
          color: level.color
        });
      }
    });

    return levels;
  }

  toggleSelection(level: NormalizedLevel) {
    const index = this.selectedLevels.findIndex(l => l.id === level.id);
    if (index >= 0) {
      this.selectedLevels.splice(index, 1);
    } else {
      this.selectedLevels.push(level);
    }
    this.clearMessages();
  }

  isSelected(level: NormalizedLevel): boolean {
    return this.selectedLevels.some(l => l.id === level.id);
  }

  getTypeLabel(type: string): string {
    const labels: {[key: string]: string} = {
      'support': 'Soporte',
      'resistance': 'Resistencia',
      'neutral': 'Neutral'
    };
    return labels[type] || type;
  }

  saveLevels() {
    if (this.selectedLevels.length === 0) return;

    this.saving = true;
    this.clearMessages();

    const requests: SaveLevelRequest[] = this.selectedLevels.map(level => ({
      symbol: this.symbol,
      price: level.price,
      calculationMethod: level.calculationMethod,
      interval: level.interval,
      type: level.type,
      label: level.label,
      metadata: {
        calculatedAt: Date.now(),
        color: level.color
      }
    }));

    this.levelsService.saveLevels(requests).subscribe({
      next: () => {
        this.successMessage = `${this.selectedLevels.length} nivel(es) guardado(s) exitosamente`;
        this.selectedLevels = [];
        this.saving = false;
        this.levelsSaved.emit();

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error saving levels:', err);
        this.errorMessage = 'Error al guardar niveles. Por favor intenta nuevamente.';
        this.saving = false;

        // Clear error message after 5 seconds
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
