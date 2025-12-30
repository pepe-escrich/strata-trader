import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPair } from '../../models/crypto-pair.model';

@Component({
  selector: 'app-crypto-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crypto-card" [style.background]="pair.gradient">
      <div class="card-content">
        <div class="card-header">
          <span class="crypto-icon">{{ pair.icon }}</span>
          <span class="crypto-name">{{ pair.name }}</span>
        </div>
        <div class="card-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crypto-card {
      border-radius: 24px;
      padding: 24px;
      min-height: 240px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .crypto-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .card-content {
      position: relative;
      z-index: 1;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .crypto-icon {
      font-size: 32px;
      font-weight: bold;
    }

    .crypto-name {
      font-size: 20px;
      font-weight: 600;
    }

    .card-body {
      font-size: 14px;
    }
  `]
})
export class CryptoCardComponent {
  @Input({ required: true }) pair!: CryptoPair;
}
