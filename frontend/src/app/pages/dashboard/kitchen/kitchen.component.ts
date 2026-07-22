import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { SignalRService } from '../../../services/signalr.service';
import { OrderResponse } from '../../../models/order.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">🍳 Cocina</h1>
        <select [(ngModel)]="filterType" (change)="loadOrders()"
          class="border px-3 py-1.5 rounded-lg text-sm outline-none">
          <option value="">Todos</option>
          <option value="dine-in">🍽️ Comer acá</option>
          <option value="takeaway">🛍️ Para llevar</option>
          <option value="delivery">🚚 Delivery</option>
        </select>
      </div>

      @if (orders.length === 0) {
        <div class="text-center text-gray-400 py-12">
          <p class="text-lg">No hay pedidos activos</p>
          <p class="text-sm">Los pedidos nuevos aparecen aquí automáticamente</p>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (order of orders; track order.id) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="text-lg font-bold text-gray-800">
                  @if (order.orderType === 'dine-in') {🍽️ Mesa {{ order.tableNumber }}
                  } @else if (order.orderType === 'takeaway') {🛍️ {{ order.contactName }}
                  } @else {🚚 {{ order.contactName || 'Delivery' }}
                  }
                </span>
                @if (order.orderType === 'takeaway') {
                  <p class="text-xs text-gray-400">Para llevar</p>
                }
                @if (order.orderType === 'delivery') {
                  <p class="text-xs text-gray-400">{{ order.deliveryAddress }}</p>
                }
              </div>
              <span [class]="statusClass(order.status)"
                    class="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                {{ statusLabel(order.status) }}
              </span>
            </div>

            <div class="text-xs text-gray-400 mb-3">
              {{ order.createdAt | date:'HH:mm' }} — {{ elapsed(order.createdAt) }}
            </div>

            <ul class="space-y-1 mb-4">
              @for (item of order.items; track item.id) {
                <li class="flex justify-between text-sm">
                  <span>{{ item.quantity }}x {{ item.productName }}</span>
                </li>
              }
            </ul>

            @if (order.notes) {
              <div class="text-sm bg-yellow-50 text-yellow-800 px-3 py-1 rounded mb-3">{{ order.notes }}</div>
            }

            @if (order.contactPhone) {
              <div class="text-xs text-gray-400 mb-3">📞 {{ order.contactPhone }}</div>
            }

            <div class="flex gap-2">
              @if (order.status === 'pending') {
                <button (click)="updateStatus(order.id, 'preparing')"
                  class="flex-1 bg-amber-500 text-white py-1.5 rounded-lg text-sm hover:bg-amber-600 transition">
                  En preparación
                </button>
              }
              @if (order.status === 'preparing') {
                <button (click)="updateStatus(order.id, 'ready')"
                  class="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg text-sm hover:bg-emerald-600 transition">
                  Listo
                </button>
              }
              @if (order.status === 'ready') {
                <button (click)="updateStatus(order.id, 'delivered')"
                  class="flex-1 bg-gray-500 text-white py-1.5 rounded-lg text-sm hover:bg-gray-600 transition">
                  Entregado
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class KitchenComponent implements OnInit, OnDestroy {
  orders: OrderResponse[] = [];
  filterType = '';
  private subs: Subscription[] = [];

  constructor(
    private orderService: OrderService,
    private signalR: SignalRService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.signalR.start();

    this.subs.push(
      this.signalR.newOrder$.subscribe(order => {
        this.orders = [order, ...this.orders];
      })
    );

    this.subs.push(
      this.signalR.orderUpdated$.subscribe(updated => {
        const idx = this.orders.findIndex(o => o.id === updated.id);
        if (idx >= 0) {
          if (updated.status === 'delivered' || updated.status === 'cancelled') {
            this.orders = this.orders.filter(o => o.id !== updated.id);
          } else {
            this.orders[idx] = updated;
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.signalR.stop();
  }

  loadOrders() {
    this.orderService.getActive(this.filterType || undefined).subscribe(orders => {
      this.orders = orders;
    });
  }

  updateStatus(id: string, status: string) {
    this.orderService.updateStatus(id, status).subscribe();
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-emerald-100 text-emerald-800',
      delivered: 'bg-gray-100 text-gray-500',
      cancelled: 'bg-red-100 text-red-800'
    };
    return map[s] || 'bg-gray-100';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return map[s] || s;
  }

  elapsed(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'recién';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    return `hace ${h}h ${min % 60}min`;
  }
}
