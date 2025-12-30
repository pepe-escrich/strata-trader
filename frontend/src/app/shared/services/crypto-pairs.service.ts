import { Injectable, signal, computed } from '@angular/core';
import { CryptoPair, DEFAULT_PAIRS } from '../models/crypto-pair.model';

@Injectable({
  providedIn: 'root'
})
export class CryptoPairsService {
  private pairs = signal<CryptoPair[]>(this.loadPairs());

  // Solo los pares habilitados
  enabledPairs = computed(() => this.pairs().filter(p => p.enabled));

  // Todos los pares
  allPairs = computed(() => this.pairs());

  constructor() {
    // Guardar en localStorage cuando cambien
    this.pairs.update(pairs => {
      this.savePairs(pairs);
      return pairs;
    });
  }

  private loadPairs(): CryptoPair[] {
    const stored = localStorage.getItem('crypto-pairs');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_PAIRS;
      }
    }
    return DEFAULT_PAIRS;
  }

  private savePairs(pairs: CryptoPair[]): void {
    localStorage.setItem('crypto-pairs', JSON.stringify(pairs));
  }

  togglePair(symbol: string): void {
    this.pairs.update(pairs => {
      const updated = pairs.map(p =>
        p.symbol === symbol ? { ...p, enabled: !p.enabled } : p
      );
      this.savePairs(updated);
      return updated;
    });
  }

  addCustomPair(pair: CryptoPair): void {
    this.pairs.update(pairs => {
      const updated = [...pairs, pair];
      this.savePairs(updated);
      return updated;
    });
  }

  removePair(symbol: string): void {
    this.pairs.update(pairs => {
      const updated = pairs.filter(p => p.symbol !== symbol);
      this.savePairs(updated);
      return updated;
    });
  }

  resetToDefaults(): void {
    this.pairs.set(DEFAULT_PAIRS);
    this.savePairs(DEFAULT_PAIRS);
  }
}
