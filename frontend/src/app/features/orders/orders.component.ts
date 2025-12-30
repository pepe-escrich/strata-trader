import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';
import { CryptoCardComponent } from '../../shared/components/crypto-card/crypto-card.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, CryptoCardComponent],
  template: `
    <div class="orders-container">
      <div class="cards-wrapper">
        <div class="cards-scroll" (scroll)="onScroll($event)">
          @for (pair of pairsService.enabledPairs(); track pair.symbol; let idx = $index) {
            <div class="card-slide" [class.active]="currentIndex() === idx">
              <app-crypto-card [pair]="pair">
                <div class="card-details">
                  <div class="section-header">
                    <h3>Órdenes</h3>
                    <button class="new-order-btn">+ Nueva</button>
                  </div>

                  <div class="orders-tabs">
                    <button
                      class="tab-btn"
                      [class.active]="activeTab() === 'active'"
                      (click)="setActiveTab('active')">
                      Activas
                    </button>
                    <button
                      class="tab-btn"
                      [class.active]="activeTab() === 'history'"
                      (click)="setActiveTab('history')">
                      Historial
                    </button>
                  </div>

                  @if (activeTab() === 'active') {
                    <div class="orders-list">
                      <div class="empty-orders">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="9" y1="9" x2="15" y2="9"/>
                          <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        <p>No hay órdenes activas</p>
                        <p class="hint">Crea una nueva orden para comenzar</p>
                      </div>
                    </div>
                  }

                  @if (activeTab() === 'history') {
                    <div class="orders-list">
                      <div class="order-item completed">
                        <div class="order-header">
                          <span class="order-type buy">COMPRA</span>
                          <span class="order-date">Hace 2h</span>
                        </div>
                        <div class="order-info">
                          <div class="info-row">
                            <span class="label">Precio</span>
                            <span class="value">$--,---</span>
                          </div>
                          <div class="info-row">
                            <span class="label">Cantidad</span>
                            <span class="value">0.--- {{ pair.symbol.replace('USDT', '') }}</span>
                          </div>
                          <div class="info-row">
                            <span class="label">Total</span>
                            <span class="value">$---</span>
                          </div>
                        </div>
                        <div class="order-status success">Completada</div>
                      </div>

                      <div class="order-item completed">
                        <div class="order-header">
                          <span class="order-type sell">VENTA</span>
                          <span class="order-date">Hace 5h</span>
                        </div>
                        <div class="order-info">
                          <div class="info-row">
                            <span class="label">Precio</span>
                            <span class="value">$--,---</span>
                          </div>
                          <div class="info-row">
                            <span class="label">Cantidad</span>
                            <span class="value">0.--- {{ pair.symbol.replace('USDT', '') }}</span>
                          </div>
                          <div class="info-row">
                            <span class="label">Total</span>
                            <span class="value">$---</span>
                          </div>
                        </div>
                        <div class="order-status success">Completada</div>
                      </div>
                    </div>
                  }
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
    .orders-container {
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

    .new-order-btn {
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

    .orders-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      background: rgba(255, 255, 255, 0.1);
      padding: 4px;
      border-radius: 10px;
    }

    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 0.6;

      &.active {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .empty-orders {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 12px;
      opacity: 0.7;

      svg {
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 14px;
      }

      .hint {
        font-size: 12px;
        opacity: 0.8;
      }
    }

    .order-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      &.completed {
        border-left: 3px solid rgba(255, 255, 255, 0.2);
      }
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-type {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;

      &.buy {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      &.sell {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }

    .order-date {
      font-size: 12px;
      opacity: 0.7;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;

      .label {
        opacity: 0.8;
      }

      .value {
        font-weight: 500;
      }
    }

    .order-status {
      text-align: center;
      padding: 8px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;

      &.success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
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
export class OrdersComponent implements OnInit {
  currentIndex = signal(0);
  activeTab = signal<'active' | 'history'>('active');

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

  setActiveTab(tab: 'active' | 'history'): void {
    this.activeTab.set(tab);
  }
}
