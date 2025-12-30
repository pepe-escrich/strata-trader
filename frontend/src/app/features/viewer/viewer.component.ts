import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viewer-container">
      <div class="cards-scroll" (scroll)="onScroll($event)">
        @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
          <div class="slide" [class.active]="currentIndex() === idx" [style.background]="getLightBackground(pair.color)">
            <div class="slide-content">
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
          </div>
        }
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
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .cards-scroll {
      flex: 1;
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
      height: 100%;
      padding: 40px 20px;
      overflow-y: auto;
    }

    .slide-content {
      max-width: 600px;
      margin: 0 auto;
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
export class ViewerComponent implements OnInit {
  currentIndex = signal(0);

  constructor(
    public pairsService: CryptoPairsService,
    private activePairService: ActivePairService
  ) {
    // Actualizar par activo cuando cambie el índice
    effect(() => {
      const index = this.currentIndex();
      const pairs = this.pairsService.enabledPairs();
      if (pairs.length > 0 && index < pairs.length) {
        this.activePairService.setActivePair(pairs[index]);
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
    this.currentIndex.set(index);
    const container = document.querySelector('.cards-scroll');
    if (container) {
      container.scrollTo({
        left: index * container.clientWidth,
        behavior: 'smooth'
      });
    }
  }

  getLightBackground(color: string): string {
    // Convertir el color a un fondo muy claro (95% de luminosidad)
    return `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`;
  }
}
