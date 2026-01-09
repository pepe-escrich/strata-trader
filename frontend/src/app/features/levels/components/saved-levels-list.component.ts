import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelsService } from '../../../shared/services/levels.service';
import { SavedLevel } from '../../../shared/models/levels.model';

@Component({
  selector: 'app-saved-levels-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saved-levels-list">
      <div class="list-header">
        <h3>Niveles Guardados</h3>
        <button class="refresh-btn" (click)="refresh()" [disabled]="loading">
          @if (loading) {
            <span class="loading-spinner"></span>
          } @else {
            <span>↻</span>
          }
          <span>Actualizar</span>
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="loading-spinner large"></div>
          <p>Cargando niveles guardados...</p>
        </div>
      }

      @if (!loading && savedLevels.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📌</div>
          <h4>No hay niveles guardados</h4>
          <p>Calcula niveles y guárdalos para verlos aquí</p>
        </div>
      }

      <div class="list-content">
        @for (level of savedLevels; track level._id) {
          <div class="level-row" [class.high-strength]="level.strength > 75">
            <div class="level-info">
              <div class="level-main">
                <span class="level-label" [style.color]="level.metadata.color || '#667eea'">
                  {{ level.label }}
                </span>
                <span class="level-price">{{ level.price | number:'1.2-6' }}</span>
              </div>
              <div class="level-details">
                <span class="detail-item">
                  📅 {{ formatDate(level.createdAt) }}
                </span>
              </div>
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

            <div class="level-strength">
              <div class="strength-bar-container">
                <div class="strength-bar" [style.width.%]="level.strength"
                     [class.high]="level.strength > 75"
                     [class.medium]="level.strength > 40 && level.strength <= 75"
                     [class.low]="level.strength <= 40">
                </div>
              </div>
              <div class="strength-info">
                <span class="touch-count">{{ level.touchCount }} toques</span>
                <span class="strength-value">{{ level.strength }}/100</span>
              </div>
            </div>

            <button class="delete-btn" (click)="deleteLevel(level)" title="Eliminar nivel">
              🗑️
            </button>
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
    .saved-levels-list {
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

    .refresh-btn {
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

    .refresh-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-state,
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #667eea;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .loading-spinner.large {
      width: 40px;
      height: 40px;
      border-width: 3px;
      margin-bottom: 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      color: #374151;
      font-size: 16px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .list-content {
      max-height: 400px;
      overflow-y: auto;
    }

    .level-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
      position: relative;
    }

    .level-row:hover {
      background: #f9fafb;
    }

    .level-row.high-strength {
      background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
    }

    .level-row.high-strength::before {
      content: '⭐';
      position: absolute;
      left: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
    }

    .level-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 150px;
    }

    .level-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .level-label {
      font-weight: 600;
      font-size: 15px;
    }

    .level-price {
      font-size: 13px;
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }

    .level-details {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #9ca3af;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .level-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .method-badge,
    .interval-badge,
    .type-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      white-space: nowrap;
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

    .level-strength {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }

    .strength-bar-container {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .strength-bar {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .strength-bar.high {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .strength-bar.medium {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .strength-bar.low {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .strength-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }

    .touch-count {
      color: #6b7280;
      font-weight: 500;
    }

    .strength-value {
      color: #374151;
      font-weight: 600;
    }

    .delete-btn {
      padding: 8px;
      background: #fee2e2;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .delete-btn:hover {
      background: #fecaca;
      transform: scale(1.1);
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
export class SavedLevelsListComponent implements OnInit, OnChanges {
  @Input() symbol: string = '';
  @Output() levelsChanged = new EventEmitter<SavedLevel[]>();

  savedLevels: SavedLevel[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private levelsService: LevelsService) {}

  ngOnInit() {
    if (this.symbol) {
      this.loadSavedLevels();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['symbol'] && !changes['symbol'].firstChange) {
      this.loadSavedLevels();
    }
  }

  loadSavedLevels() {
    if (!this.symbol) return;

    this.loading = true;
    this.clearMessages();

    this.levelsService.getSavedLevels(this.symbol).subscribe({
      next: (levels) => {
        this.savedLevels = levels;
        this.levelsChanged.emit(levels);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading saved levels:', err);
        this.errorMessage = 'Error al cargar niveles guardados';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  deleteLevel(level: SavedLevel) {
    if (!confirm(`¿Eliminar el nivel ${level.label} a ${level.price}?`)) {
      return;
    }

    this.levelsService.deleteLevel(level._id).subscribe({
      next: () => {
        this.successMessage = 'Nivel eliminado exitosamente';
        this.loadSavedLevels();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error deleting level:', err);
        this.errorMessage = 'Error al eliminar nivel';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  refresh() {
    this.loadSavedLevels();
  }

  getTypeLabel(type: string): string {
    const labels: {[key: string]: string} = {
      'support': 'Soporte',
      'resistance': 'Resistencia',
      'neutral': 'Neutral'
    };
    return labels[type] || type;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
