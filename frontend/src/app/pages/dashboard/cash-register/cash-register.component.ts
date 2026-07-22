import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, CashRegisterStatus } from '../../../services/reports.service';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">💰 Caja</h1>

      @if (loading) {
        <p class="text-gray-500">Cargando...</p>
      } @else if (status?.status === 'open') {
        <div class="bg-white rounded-xl border p-6 max-w-md">
          <div class="flex items-center gap-2 text-emerald-700 mb-4">
            <span class="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span class="font-semibold">Caja abierta</span>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <p><span class="text-gray-500">Abierta:</span> {{ status!.openedAt | date:'dd/MM HH:mm' }}</p>
            <p><span class="text-gray-500">Fondo inicial:</span> \${{ status!.openingBalance?.toFixed(2) }}</p>
            <p><span class="text-gray-500">Ventas del turno:</span> \${{ status!.todayOrders?.toFixed(2) }}</p>
          </div>

          <details class="mt-4">
            <summary class="cursor-pointer text-emerald-700 font-medium text-sm">Cerrar caja</summary>
            <div class="mt-3 space-y-3">
              <input type="number" [(ngModel)]="closeData.cashSales" placeholder="Efectivo" step="0.01"
                class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <input type="number" [(ngModel)]="closeData.cardSales" placeholder="Tarjeta" step="0.01"
                class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <input type="number" [(ngModel)]="closeData.transferSales" placeholder="Transferencia" step="0.01"
                class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <input type="number" [(ngModel)]="closeData.closingBalance" placeholder="Total final en caja" step="0.01"
                class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <textarea [(ngModel)]="closeData.notes" placeholder="Notas" rows="2"
                class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
              <button (click)="closeRegister()" [disabled]="closing"
                class="w-full bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50">
                {{ closing ? 'Cerrando...' : 'Cerrar caja' }}
              </button>
              @if (closeError) {
                <p class="text-red-600 text-sm">{{ closeError }}</p>
              }
            </div>
          </details>
        </div>
      } @else {
        <div class="bg-white rounded-xl border p-6 max-w-md">
          <p class="text-gray-500 mb-4">No hay caja abierta</p>
          <div class="space-y-3">
            <input type="number" [(ngModel)]="openingBalance" placeholder="Fondo inicial" step="0.01"
              class="w-full border px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <button (click)="openRegister()" [disabled]="opening"
              class="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700 transition disabled:opacity-50">
              {{ opening ? 'Abriendo...' : 'Abrir caja' }}
            </button>
            @if (openError) {
              <p class="text-red-600 text-sm">{{ openError }}</p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class CashRegisterComponent implements OnInit {
  status: CashRegisterStatus | null = null;
  loading = true;

  opening = false;
  openingBalance = 0;
  openError = '';

  closing = false;
  closeError = '';
  closeData = {
    closingBalance: 0,
    cashSales: 0,
    cardSales: 0,
    transferSales: 0,
    notes: ''
  };

  constructor(private reports: ReportsService) {}

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.reports.getCashRegisterStatus().subscribe(s => {
      this.status = s;
      this.loading = false;
    });
  }

  openRegister() {
    this.opening = true;
    this.openError = '';
    this.reports.openCashRegister(this.openingBalance).subscribe({
      next: () => { this.opening = false; this.loadStatus(); },
      error: (err) => { this.openError = err.error?.message || 'Error'; this.opening = false; }
    });
  }

  closeRegister() {
    this.closing = true;
    this.closeError = '';
    this.reports.closeCashRegister(this.closeData).subscribe({
      next: () => { this.closing = false; this.loadStatus(); },
      error: (err) => { this.closeError = err.error?.message || 'Error'; this.closing = false; }
    });
  }
}
