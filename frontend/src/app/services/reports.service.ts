import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DailySales {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalDeliveryFee: number;
  dineInCount: number;
  takeawayCount: number;
  deliveryCount: number;
  hourlyBreakdown: { hour: number; orders: number; revenue: number }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProduct: string;
  topProductQuantity: number;
}

export interface CashRegisterStatus {
  status: string;
  message?: string;
  id?: string;
  openedAt?: string;
  openingBalance?: number;
  notes?: string;
  todayOrders?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  getDailySales(date?: string): Observable<DailySales> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<DailySales>('/api/reports/daily-sales', { params });
  }

  getTopProducts(from?: string, to?: string): Observable<TopProduct[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<TopProduct[]>('/api/reports/top-products', { params });
  }

  getSummary(from?: string, to?: string): Observable<Summary> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Summary>('/api/reports/summary', { params });
  }

  getCashRegisterStatus(): Observable<CashRegisterStatus> {
    return this.http.get<CashRegisterStatus>('/api/cash-register/status');
  }

  openCashRegister(openingBalance: number, notes?: string): Observable<any> {
    return this.http.post('/api/cash-register/open', { openingBalance, notes });
  }

  closeCashRegister(data: {
    closingBalance: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
    notes?: string;
  }): Observable<any> {
    return this.http.post('/api/cash-register/close', data);
  }
}
