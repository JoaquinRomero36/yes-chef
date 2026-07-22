import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportsService, DailySales, TopProduct, Summary } from '../../../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">📊 Reportes</h1>

      <div class="flex gap-2 mb-6">
        <input type="date" [(ngModel)]="selectedDate" (change)="loadDaily()"
          class="border px-3 py-1.5 rounded-lg text-sm outline-none">
        <input type="date" [(ngModel)]="rangeFrom" (change)="loadRange()"
          class="border px-3 py-1.5 rounded-lg text-sm outline-none">
        <span class="self-center text-sm text-gray-400">a</span>
        <input type="date" [(ngModel)]="rangeTo" (change)="loadRange()"
          class="border px-3 py-1.5 rounded-lg text-sm outline-none">
      </div>

      @if (daily) {
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl border p-4">
            <p class="text-sm text-gray-500">Pedidos hoy</p>
            <p class="text-2xl font-bold">{{ daily.totalOrders }}</p>
          </div>
          <div class="bg-white rounded-xl border p-4">
            <p class="text-sm text-gray-500">Ingresos</p>
            <p class="text-2xl font-bold text-emerald-700">\${{ daily.totalRevenue.toFixed(2) }}</p>
          </div>
          <div class="bg-white rounded-xl border p-4">
            <p class="text-sm text-gray-500">Delivery</p>
            <p class="text-lg font-semibold">{{ daily.deliveryCount }} pedidos</p>
            <p class="text-sm text-gray-500">\${{ daily.totalDeliveryFee.toFixed(2) }} en envíos</p>
          </div>
          <div class="bg-white rounded-xl border p-4">
            <p class="text-sm text-gray-500">Composición</p>
            <p class="text-sm">🍽️ {{ daily.dineInCount }} · 🛍️ {{ daily.takeawayCount }} · 🚚 {{ daily.deliveryCount }}</p>
          </div>
        </section>

        @if (daily.hourlyBreakdown.length > 0) {
          <section class="bg-white rounded-xl border p-4 mb-6">
            <h2 class="font-semibold text-gray-700 mb-3">Ventas por hora</h2>
            <div class="flex items-end gap-1 h-32">
              @for (h of daily.hourlyBreakdown; track h.hour) {
                <div class="flex-1 flex flex-col items-center">
                  <div [style.height.px]="barHeight(h.revenue, maxRevenue())"
                       class="w-full bg-emerald-500 rounded-t transition-all"
                       style="min-height: 4px;"></div>
                  <span class="text-xs text-gray-400 mt-1">{{ h.hour }}:00</span>
                </div>
              }
            </div>
          </section>
        }
      }

      @if (sort) {
        <section class="bg-white rounded-xl border p-4 mb-6">
          <h2 class="font-semibold text-gray-700 mb-3">Resumen del período</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500">Pedidos</p>
              <p class="text-xl font-bold">{{ sort.totalOrders }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Ingresos</p>
              <p class="text-xl font-bold text-emerald-700">\${{ sort.totalRevenue.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Ticket promedio</p>
              <p class="text-xl font-bold">\${{ sort.averageOrderValue.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Top producto</p>
              <p class="text-xl font-bold text-amber-700">{{ sort.topProduct }}</p>
              <p class="text-xs text-gray-400">{{ sort.topProductQuantity }} vendidos</p>
            </div>
          </div>
        </section>
      }

      @if (topProducts.length > 0) {
        <section class="bg-white rounded-xl border p-4">
          <h2 class="font-semibold text-gray-700 mb-3">Productos más vendidos</h2>
          <div class="space-y-2">
            @for (p of topProducts; track p.productId; let i = $index) {
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-400 w-6">{{ i + 1 }}.</span>
                <div class="flex-1">
                  <div class="flex justify-between text-sm">
                    <span>{{ p.productName }}</span>
                    <span class="text-gray-500">{{ p.totalQuantity }} uds · \${{ p.totalRevenue.toFixed(2) }}</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div [style.width.%]="(p.totalQuantity / maxQty()) * 100"
                         class="bg-emerald-500 h-2 rounded-full transition-all"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  selectedDate = new Date().toISOString().slice(0, 10);
  rangeFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  rangeTo = new Date().toISOString().slice(0, 10);

  daily: DailySales | null = null;
  sort: Summary | null = null;
  topProducts: TopProduct[] = [];

  constructor(private reports: ReportsService) {}

  ngOnInit() {
    this.loadDaily();
    this.loadRange();
  }

  loadDaily() {
    this.reports.getDailySales(this.selectedDate).subscribe(d => this.daily = d);
  }

  loadRange() {
    this.reports.getSummary(this.rangeFrom, this.rangeTo).subscribe(s => this.sort = s);
    this.reports.getTopProducts(this.rangeFrom, this.rangeTo).subscribe(p => this.topProducts = p);
  }

  maxRevenue() {
    if (!this.daily?.hourlyBreakdown.length) return 1;
    return Math.max(...this.daily.hourlyBreakdown.map(h => h.revenue));
  }

  barHeight(revenue: number, max: number) {
    if (max === 0) return 4;
    return Math.max(4, (revenue / max) * 120);
  }

  maxQty() {
    if (!this.topProducts.length) return 1;
    return Math.max(...this.topProducts.map(p => p.totalQuantity));
  }
}
