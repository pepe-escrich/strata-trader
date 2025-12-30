import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoPairsService } from '../../shared/services/crypto-pairs.service';
import { ActivePairService } from '../../shared/services/active-pair.service';
import { ViewerComponent } from '../../features/viewer/viewer.component';
import { LevelsComponent } from '../../features/levels/levels.component';
import { OrdersComponent } from '../../features/orders/orders.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, ViewerComponent, LevelsComponent, OrdersComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  showSettingsDrawer = signal(false);
  activeTab = signal('viewer');

  constructor(
    public pairsService: CryptoPairsService,
    public activePairService: ActivePairService
  ) {}

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  toggleSettings(): void {
    this.showSettingsDrawer.update(v => !v);
  }

  togglePair(symbol: string): void {
    this.pairsService.togglePair(symbol);
  }
}
