import { Injectable, signal, computed } from '@angular/core';
import { CryptoPair } from '../models/crypto-pair.model';

@Injectable({
  providedIn: 'root'
})
export class ActivePairService {
  private activePair = signal<CryptoPair | null>(null);

  currentPair = computed(() => this.activePair());

  setActivePair(pair: CryptoPair | null): void {
    this.activePair.set(pair);
  }
}
