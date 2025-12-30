import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { CryptoCardComponent } from '../../shared/components/crypto-card/crypto-card.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, CryptoCardComponent],
  template: `
    <div class="viewer-container">
      <div class="cards-wrapper">
        <div class="cards-scroll">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="card-slide" [class.active]="currentIndex() === idx">
              <app-crypto-card [pair]="pair">
                <div class="card-details">
                  <div class="price">
                    <span class="label">Precio Actual</span>
                    <span class="value">$--,---</span>
                  </div>
                  <div class="stats">
                    <div class="stat">
                      <span class="label">24h</span>
                      <span class="value positive">+0.00%</span>
                    </div>
                    <div class="stat">
                      <span class="label">Vol</span>
                      <span class="value">$--M</span>
                    </div>
                  </div>
                </div>
              </app-crypto-card>
            </div>
          }
        </div>
      </div>

      @if (pairsService.enabledPairs().length > 1) {
        <div class="pagination-dots">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <button
              class="dot"
              [class.active]="currentIndex() === idx"
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
      padding: 20px;
      min-height: calc(100vh - 160px);
      display: flex;
      flex-direction: column;
    }

    .cards-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    .cards-scroll {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      width: 100%;
      padding: 8px 0;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .card-slide {
      flex: 0 0 90%;
      scroll-snap-align: center;
      transition: transform 0.3s, opacity 0.3s;

      &:not(.active) {
        opacity: 0.6;
        transform: scale(0.95);
      }
    }

    .card-details {
      margin-top: 24px;
    }

    .price {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;

      .label {
        font-size: 14px;
        opacity: 0.9;
      }

      .value {
        font-size: 36px;
        font-weight: 700;
      }
    }

    .stats {
      display: flex;
      gap: 24px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        opacity: 0.8;
      }

      .value {
        font-size: 16px;
        font-weight: 600;

        &.positive {
          color: #10b981;
        }

        &.negative {
          color: #ef4444;
        }
      }
    }

    .pagination-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
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
        background: #667eea;
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
  `]
})
export class ViewerComponent {
  currentIndex = signal(0);

  constructor(public pairsService: CryptoPairsService) {}

  goToSlide(index: number): void {
    this.currentIndex.set(index);
    const container = document.querySelector('.cards-scroll');
    const slide = document.querySelectorAll('.card-slide')[index];
    if (container && slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}
