import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, OrderResponse } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  create(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  getByTable(tableNumber: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/table/${tableNumber}`);
  }
}
