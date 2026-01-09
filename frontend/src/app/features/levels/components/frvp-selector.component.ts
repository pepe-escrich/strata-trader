import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LevelsService } from '../../../shared/services/levels.service';
import { FrvpResult, FrvpLevel } from '../../../shared/models/levels.model';

export interface FrvpSelection {
  startTime: number;
  endTime: number;
  highPrice: number;
  lowPrice: number;
}

@Component({
  selector: 'app-frvp-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="frvp-selector">
      <div class="selector-header">
        <h3>Fixed Range Volume Profile</h3>
        <div class="mode-toggle">
          @if (!drawingMode && !frvpResult) {
            <button class="draw-btn" (click)="enableDrawing()">
              📐 Dibujar Rango
            </button>
          }
          @if (drawingMode) {
            <div class="drawing-instructions">
              <span class="pulse">●</span>
              <span>🖱️ Usa el BOTÓN DERECHO para dibujar el rectángulo en la gráfica</span>
              <button class="cancel-btn" (click)="cancelDrawing()">Cancelar</button>
            </div>
          }
        </div>
      </div>

      @if (selection && !drawingMode) {
        <div class="selection-info">
          <div class="info-row">
            <label>Rango Temporal:</label>
            <span>{{ formatDate(selection.startTime) }} → {{ formatDate(selection.endTime) }}</span>
          </div>
          <div class="info-row">
            <label>Rango de Precio:</label>
            <span>{{ selection.lowPrice | number:'1.2-6' }} → {{ selection.highPrice | number:'1.2-6' }}</span>
          </div>
          <div class="info-row">
            <label>Resolución (bins):</label>
            <input type="range" min="50" max="300" step="10" [(ngModel)]="bins" (change)="onBinsChange()">
            <span class="bins-value">{{ bins }}</span>
          </div>
          <button
            class="calculate-btn"
            (click)="calculate()"
            [disabled]="calculating">
            @if (calculating) {
              <span class="spinner"></span>
              <span>Calculando...</span>
            } @else {
              <span>Calcular FRVP</span>
            }
          </button>
        </div>
      }

      @if (frvpResult) {
        <div class="frvp-results">
          <div class="results-header">
            <h4>Niveles Identificados</h4>
            <div class="results-stats">
              <span class="stat">
                <strong>Volumen Total:</strong> {{ formatVolume(frvpResult.totalVolume) }}
              </span>
              <span class="stat">
                <strong>Bins:</strong> {{ frvpResult.bins.length }}
              </span>
            </div>
            <button class="new-calc-btn" (click)="reset()">Nueva Selección</button>
          </div>

          <div class="levels-list">
            @for (level of frvpResult.levels; track level.price) {
              <div class="level-item" [attr.data-type]="level.type">
                <div class="level-type-indicator" [attr.data-type]="level.type">
                  {{ level.type.toUpperCase() }}
                </div>
                <div class="level-details">
                  <div class="level-main">
                    <span class="level-label">{{ level.label }}</span>
                    <span class="level-price">{{ level.price | number:'1.2-6' }}</span>
                  </div>
                  <div class="level-description">{{ level.description }}</div>
                  <div class="level-volume">
                    Vol: {{ formatVolume(level.volume) }} ({{ getVolumePercentage(level.volume) }}%)
                  </div>
                </div>
                <input
                  type="checkbox"
                  [checked]="isLevelSelected(level)"
                  (change)="toggleLevelSelection(level)">
              </div>
            }
          </div>

          <button
            class="save-btn"
            [disabled]="selectedLevels.length === 0"
            (click)="saveLevels()">
            Guardar Seleccionados ({{ selectedLevels.length }})
          </button>
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
    .frvp-selector {
      margin-top: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .selector-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selector-header h3 {
      margin: 0;
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .draw-btn {
      padding: 8px 16px;
      background: white;
      color: #8b5cf6;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .draw-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .drawing-instructions {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      font-size: 14px;
    }

    .pulse {
      color: #ef4444;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .cancel-btn {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid white;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .selection-info {
      padding: 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .info-row label {
      font-weight: 600;
      color: #374151;
      min-width: 140px;
    }

    .info-row span {
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }

    .info-row input[type="range"] {
      flex: 1;
      max-width: 200px;
    }

    .bins-value {
      min-width: 40px;
      text-align: right;
      font-weight: 600;
      color: #8b5cf6 !important;
    }

    .calculate-btn {
      width: 100%;
      padding: 10px;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      transition: all 0.2s;
    }

    .calculate-btn:not(:disabled):hover {
      background: #7c3aed;
    }

    .calculate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .frvp-results {
      padding: 20px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .results-header h4 {
      margin: 0;
      color: #374151;
      font-size: 16px;
    }

    .results-stats {
      display: flex;
      gap: 16px;
      font-size: 13px;
    }

    .stat {
      color: #6b7280;
    }

    .stat strong {
      color: #374151;
    }

    .new-calc-btn {
      padding: 6px 12px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .new-calc-btn:hover {
      background: #e5e7eb;
    }

    .levels-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .level-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .level-item:hover {
      border-color: #8b5cf6;
    }

    .level-type-indicator {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      min-width: 45px;
    }

    .level-type-indicator[data-type="poc"] {
      background: #fbbf24;
      color: #78350f;
    }

    .level-type-indicator[data-type="vah"] {
      background: #fee2e2;
      color: #991b1b;
    }

    .level-type-indicator[data-type="val"] {
      background: #dcfce7;
      color: #166534;
    }

    .level-type-indicator[data-type="hvn"] {
      background: #dbeafe;
      color: #1e40af;
    }

    .level-type-indicator[data-type="lvn"] {
      background: #e0e7ff;
      color: #3730a3;
    }

    .level-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .level-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .level-label {
      font-weight: 600;
      color: #374151;
    }

    .level-price {
      font-family: 'Courier New', monospace;
      color: #6b7280;
      font-size: 13px;
    }

    .level-description {
      font-size: 12px;
      color: #9ca3af;
    }

    .level-volume {
      font-size: 11px;
      color: #6b7280;
    }

    .level-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .save-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .save-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      padding: 12px 20px;
      background: #fee2e2;
      color: #991b1b;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class FrvpSelectorComponent implements OnInit, OnDestroy {
  @Input() symbol: string = '';
  @Input() interval: string = '1h';
  @Output() selectionReady = new EventEmitter<FrvpSelection>();
  @Output() frvpCalculated = new EventEmitter<FrvpResult>();
  @Output() levelsSaved = new EventEmitter<void>();
  @Output() drawingCancelled = new EventEmitter<void>();

  drawingMode = false;
  selection: FrvpSelection | null = null;
  bins = 100;
  calculating = false;
  frvpResult: FrvpResult | null = null;
  selectedLevels: FrvpLevel[] = [];
  errorMessage = '';

  constructor(private levelsService: LevelsService) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.cancelDrawing();
  }

  enableDrawing() {
    this.drawingMode = true;
    this.errorMessage = '';
    // Emit event so parent can set up drawing handlers
    this.selectionReady.emit(this.selection || {} as FrvpSelection);
  }

  cancelDrawing() {
    this.drawingMode = false;
    this.drawingCancelled.emit();
  }

  setSelection(selection: FrvpSelection) {
    this.selection = selection;
    this.drawingMode = false;
  }

  onBinsChange() {
    // User changed bins, might want to recalculate
  }

  calculate() {
    if (!this.selection) return;

    this.calculating = true;
    this.errorMessage = '';

    const request = {
      symbol: this.symbol,
      interval: this.interval,
      startTime: this.selection.startTime,
      endTime: this.selection.endTime,
      highPrice: this.selection.highPrice,
      lowPrice: this.selection.lowPrice,
      bins: this.bins
    };

    this.levelsService.calculateFrvp(request).subscribe({
      next: (result) => {
        this.frvpResult = result;
        this.calculating = false;
        this.frvpCalculated.emit(result);
        // Auto-select POC, VAH, VAL
        const mainLevels = result.levels.filter(l =>
          l.type === 'poc' || l.type === 'vah' || l.type === 'val'
        );
        this.selectedLevels = [...mainLevels];
      },
      error: (err) => {
        console.error('Error calculating FRVP:', err);
        this.errorMessage = 'Error al calcular FRVP. Verifica el rango seleccionado.';
        this.calculating = false;
      }
    });
  }

  toggleLevelSelection(level: FrvpLevel) {
    const index = this.selectedLevels.findIndex(l => l.price === level.price);
    if (index >= 0) {
      this.selectedLevels.splice(index, 1);
    } else {
      this.selectedLevels.push(level);
    }
  }

  isLevelSelected(level: FrvpLevel): boolean {
    return this.selectedLevels.some(l => l.price === level.price);
  }

  saveLevels() {
    // Emit event to parent to handle saving with existing flow
    this.levelsSaved.emit();
  }

  getSelectedLevels() {
    return this.selectedLevels;
  }

  reset() {
    this.selection = null;
    this.frvpResult = null;
    this.selectedLevels = [];
    this.errorMessage = '';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
  }

  getVolumePercentage(volume: number): string {
    if (!this.frvpResult) return '0';
    const percentage = (volume / this.frvpResult.totalVolume) * 100;
    return percentage.toFixed(2);
  }
}
