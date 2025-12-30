import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';
import { CryptoCardComponent } from '../../shared/components/crypto-card/crypto-card.component';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [CommonModule, CryptoCardComponent],
  template: `
    <div class="levels-container">
      <div class="cards-wrapper">
        <div class="cards-scroll" (scroll)="onScroll($event)">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="card-slide" [class.active]="currentIndex() === idx">
              <app-crypto-card [pair]="pair">
                <div class="card-details">
                  <div class="section-header">
                    <h3>Niveles S/R</h3>
                    <button class="calculate-btn">Calcular</button>
                  </div>

                  <div class="levels-list">
                    <div class="level-group">
                      <div class="group-title">Resistencias</div>
                      <div class="level-item resistance">
                        <span class="level-label">R3</span>
                        <span class="level-value">$--,---</span>
                      </div>
                      <div class="level-item resistance">
                        <span class="level-label">R2</span>
                        <span class="level-value">$--,---</span>
                      </div>
                      <div class="level-item resistance">
                        <span class="level-label">R1</span>
                        <span class="level-value">$--,---</span>
                      </div>
                    </div>

                    <div class="current-price">
                      <span class="label">Precio Actual</span>
                      <span class="value">$--,---</span>
                    </div>

                    <div class="level-group">
                      <div class="group-title">Soportes</div>
                      <div class="level-item support">
                        <span class="level-label">S1</span>
                        <span class="level-value">$--,---</span>
                      </div>
                      <div class="level-item support">
                        <span class="level-label">S2</span>
                        <span class="level-value">$--,---</span>
                      </div>
                      <div class="level-item support">
                        <span class="level-label">S3</span>
                        <span class="level-value">$--,---</span>
                      </div>
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
    .levels-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .cards-wrapper {
      flex: 1;
      display: flex;
      align-items: stretch;
      overflow: hidden;
    }

    .cards-scroll {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      width: 100%;
      height: 100%;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .card-slide {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .card-details {
      margin-top: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .calculate-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .levels-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .level-group {
      .group-title {
        font-size: 12px;
        text-transform: uppercase;
        opacity: 0.8;
        margin-bottom: 8px;
        font-weight: 600;
      }
    }

    .level-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 6px;

      &.resistance {
        border-left: 3px solid #ef4444;
      }

      &.support {
        border-left: 3px solid #10b981;
      }

      .level-label {
        font-weight: 600;
        font-size: 14px;
      }

      .level-value {
        font-size: 16px;
        font-weight: 500;
      }
    }

    .current-price {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);

      .label {
        font-size: 12px;
        opacity: 0.9;
        text-transform: uppercase;
      }

      .value {
        font-size: 28px;
        font-weight: 700;
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
export class LevelsComponent implements OnInit {
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
}
