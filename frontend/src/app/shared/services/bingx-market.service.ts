import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Candlestick, Timeframe } from '../models/candlestick.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BingxMarketService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene datos de velas (candlesticks) para un símbolo y timeframe
   * @param symbol - Símbolo del par (ej: BTCUSDT)
   * @param interval - Intervalo de tiempo (1m, 5m, 15m, 30m, 1h, 4h, 1d)
   * @param limit - Número de velas a obtener (default: 500)
   */
  getKlines(symbol: string, interval: Timeframe, limit: number = 500): Observable<Candlestick[]> {
    const params = {
      symbol,
      interval,
      limit: limit.toString()
    };

    return this.http.get<any>(`${this.apiUrl}/market/klines`, { params }).pipe(
      map(response => {
        // BingX devuelve un array de arrays: [timestamp, open, high, low, close, volume]
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((kline: any[]) => ({
            time: Math.floor(kline[0] / 1000), // convertir ms a segundos
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5])
          }));
        }
        return [];
      })
    );
  }

  /**
   * Obtiene el precio actual (última vela cerrada)
   */
  getCurrentPrice(symbol: string): Observable<number> {
    return this.getKlines(symbol, '1m', 1).pipe(
      map(klines => klines.length > 0 ? klines[0].close : 0)
    );
  }
}
