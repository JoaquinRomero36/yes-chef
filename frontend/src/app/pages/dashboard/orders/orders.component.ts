import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { OrderResponse } from '../../../models/order.models';
import { PAYMENT_METHODS, paymentMethodLabel } from '../../../constants/payment-methods';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-foreground mb-1">Pedidos</h1>
      <p class="text-sm text-muted-foreground mb-6">Mesas y entregas listas para cobrar</p>

      @if (loading) {
        <p class="text-muted-foreground">Cargando...</p>
      } @else if (orders.length === 0) {
        <div class="bg-card rounded-xl border border-border p-6 text-muted-foreground text-center">
          No hay pedidos entregados por cobrar
        </div>
      } @else {
        <div class="space-y-3">
          @for (o of orders; track o.id) {
            <div class="bg-card rounded-xl border border-border p-4">
              <div class="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p class="font-semibold text-foreground">
                    {{ orderLabel(o) }}
                  </p>
                  <p class="text-xs text-muted-foreground">{{ o.createdAt | date:'dd/MM HH:mm' }}</p>
                </div>
                <span
                  [class]="o.paidAt
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-amber-500 bg-amber-500/10'"
                  class="text-xs px-2 py-1 rounded-full font-medium border border-current/20">
                  {{ o.paidAt ? 'Pagado' : 'Pendiente de cobro' }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="text-sm text-muted-foreground">
                  @if (o.paymentMethod) {
                    <span class="text-foreground">{{ methodLabel(o.paymentMethod) }}</span>
                  } @else {
                    <span>Sin registrar</span>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-bold text-foreground">\${{ o.total.toFixed(2) }}</span>
                  @if (!o.paidAt) {
                    <button
                      (click)="selected = selected === o.id ? null : o.id"
                      class="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition">
                      Cobrar
                    </button>
                  }
                </div>
              </div>

              @if (selected === o.id && !o.paidAt) {
                <div class="mt-3 border-t border-border pt-3 anim-fade-up">
                  <p class="text-sm font-medium text-foreground mb-2">¿Cómo cobra?</p>
                  <div class="flex flex-wrap gap-2">
                    @for (m of paymentOptions; track m.value) {
                      <button
                        type="button"
                        (click)="payOrder(o, m.value)"
                        [disabled]="payingId === o.id"
                        class="border border-border rounded-lg px-3 py-1.5 text-sm text-foreground hover:border-primary hover:bg-primary/10 transition disabled:opacity-50">
                        {{ m.label }}
                      </button>
                    }
                  </div>
                  @if (payError === o.id) {
                    <p class="text-destructive text-sm mt-2">No se pudo registrar el cobro</p>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders: OrderResponse[] = [];
  loading = true;

  selected: string | null = null;
  payingId: string | null = null;
  payError: string | null = null;

  paymentOptions = PAYMENT_METHODS;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.orderService.getCashable().subscribe({
      next: o => {
        this.orders = o;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  orderLabel(o: OrderResponse): string {
    if (o.orderType === 'dine-in') return `Mesa ${o.tableNumber}`;
    if (o.orderType === 'delivery') return `Delivery — ${o.contactName}`;
    return `Para llevar — ${o.contactName}`;
  }

  methodLabel(method: string): string {
    return paymentMethodLabel(method);
  }

  payOrder(o: OrderResponse, method: string) {
    this.payingId = o.id;
    this.payError = null;
    this.orderService.pay(o.id, method).subscribe({
      next: () => {
        this.payingId = null;
        this.selected = null;
        this.load();
      },
      error: (err) => {
        this.payingId = null;
        this.payError = o.id;
      }
    });
  }
}