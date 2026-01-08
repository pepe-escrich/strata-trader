import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LevelsResponse, LevelType, LevelInterval } from '../models/levels.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LevelsService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getLevels(
    symbol: string,
    interval: LevelInterval,
    type: LevelType,
    exchange: string = 'binance'
  ): Observable<LevelsResponse> {
    const params = {
      symbol,
      interval,
      type,
      exchange
    };

    return this.http.get<LevelsResponse>(`${this.apiUrl}/levels`, { params });
  }

  getPivotPoints(symbol: string, interval: LevelInterval): Observable<LevelsResponse> {
    return this.getLevels(symbol, interval, 'pivot');
  }

  getFibonacciRetracement(symbol: string, interval: LevelInterval): Observable<LevelsResponse> {
    return this.getLevels(symbol, interval, 'fibonacci');
  }

  getIchimokuCloud(symbol: string, interval: LevelInterval): Observable<LevelsResponse> {
    return this.getLevels(symbol, interval, 'ichimoku');
  }
}
