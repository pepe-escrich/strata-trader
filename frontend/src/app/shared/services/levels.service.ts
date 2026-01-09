import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LevelsResponse, LevelType, LevelInterval, SavedLevel, SaveLevelRequest, FrvpResult, CalculateFrvpRequest } from '../models/levels.model';
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

  // Persistence methods

  saveLevels(levels: SaveLevelRequest[]): Observable<SavedLevel[]> {
    return this.http.post<SavedLevel[]>(`${this.apiUrl}/levels/save`, { levels });
  }

  getSavedLevels(symbol: string, filters?: any): Observable<SavedLevel[]> {
    return this.http.get<SavedLevel[]>(`${this.apiUrl}/levels/saved/${symbol}`, { params: filters });
  }

  deleteLevel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/levels/saved/${id}`);
  }

  recalculateStrength(symbol: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/levels/recalculate-strength/${symbol}`, {});
  }

  // FRVP methods

  calculateFrvp(request: CalculateFrvpRequest): Observable<FrvpResult> {
    return this.http.post<FrvpResult>(`${this.apiUrl}/levels/frvp`, request);
  }
}
