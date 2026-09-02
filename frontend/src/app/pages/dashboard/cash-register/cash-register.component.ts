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
      <h1 class="text-2xl font-bold text-foreground mb-6">Caja</h1>

      @if (loading) {
        <p class="text-muted-foreground">Cargando...</p>
      } @else if (status?.status === 'open') {
        <div class="bg-card rounded-xl border border-border p-6 max-w-md">
          <div class="flex items-center gap-2 text-primary mb-4">
            <span class="w-3 h-3 bg-primary rounded-full"></span>
            <span class="font-semibold">Caja abierta</span>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <p><span class="text-muted-foreground">Abierta:</span> {{ status!.openedAt | date:'dd/MM HH:mm' }}</p>
            <p><span class="text-muted-foreground">Fondo inicial:</span> \${{ status!.openingBalance?.toFixed(2) }}</p>
            <p><span class="text-muted-foreground">Ventas del turno:</span> \${{ status!.todayOrders?.toFixed(2) }}</p>
          </div>

          <details class="mt-4">
            <summary class="cursor-pointer text-primary font-medium text-sm">Cerrar caja</summary>
            <div class="mt-3 space-y-3">
              <input type="number" [(ngModel)]="closeData.closingBalance" placeholder="Total de efectivo físico en caja" step="0.01"
                class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-card outline-none focus:ring-2 focus:ring-primary">
              <textarea [(ngModel)]="closeData.notes" placeholder="Notas" rows="2"
                class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-card outline-none focus:ring-2 focus:ring-primary"></textarea>
              <button (click)="closeRegister()" [disabled]="closing"
                class="w-full bg-destructive text-destructive-foreground py-2 rounded-lg text-sm hover:bg-destructive/90 transition disabled:opacity-50">
                {{ closing ? 'Cerrando...' : 'Cerrar caja' }}
              </button>
              @if (closeError) {
                <p class="text-destructive text-sm">{{ closeError }}</p>
              }
            </div>
          </details>
        </div>
      } @else {
        <div class="bg-card rounded-xl border border-border p-6 max-w-md">
          <p class="text-muted-foreground mb-4">No hay caja abierta</p>
          <div class="space-y-3">
            <input type="number" [(ngModel)]="openingBalance" placeholder="Fondo inicial" step="0.01"
              class="w-full border border-border px-3 py-1.5 rounded-lg text-sm bg-card outline-none focus:ring-2 focus:ring-primary">
            <button (click)="openRegister()" [disabled]="opening"
              class="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-50">
              {{ opening ? 'Abriendo...' : 'Abrir caja' }}
            </button>
            @if (openError) {
              <p class="text-destructive text-sm">{{ openError }}</p>
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
