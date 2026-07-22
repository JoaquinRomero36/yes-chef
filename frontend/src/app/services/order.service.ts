import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, OrderResponse } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  create(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, request);
  }

  getActive(type?: string): Observable<OrderResponse[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/active`, { params });
  }

  updateStatus(id: string, status: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiUrl}/${id}/status`, { status });
  }
}
