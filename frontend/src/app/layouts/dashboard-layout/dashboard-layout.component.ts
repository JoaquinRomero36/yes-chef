import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent, IconComponent],
  template: `
    <div class="min-h-screen">
      <header class="h-14 flex items-center gap-3 px-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border lg:hidden">
        <button (click)="sidebarOpen.set(true)" aria-label="Abrir menú" class="p-2 rounded-lg hover:bg-sidebar-accent/60 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="text-lg font-bold">YesChef Staff</span>
      </header>

      <div class="lg:flex">
        @if (sidebarOpen()) {
          <div class="lg:hidden fixed inset-0 z-40 bg-black/50 anim-fade-in" (click)="sidebarOpen.set(false)"></div>
          <aside class="w-56 lg:w-60 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:w-60 anim-slide-in-right">
            <div class="p-4 flex items-center justify-between border-b border-sidebar-border">
              <span class="text-lg font-bold">YesChef Staff</span>
              <app-theme-toggle />
            </div>
            <nav class="flex-1 p-2 space-y-1" aria-label="Navegación principal">
              <a routerLink="/dashboard/kitchen" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                <app-icon name="chef-hat" [size]="18" /> Cocina
              </a>
              @if (auth.getRole() !== 'kitchen') {
                <a routerLink="/dashboard/reports" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="chart" [size]="18" /> Reportes
                </a>
                <a routerLink="/dashboard/cash-register" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="banknote" [size]="18" /> Caja
                </a>
              }
              @if (auth.getRole() === 'admin') {
                <a routerLink="/dashboard/admin" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="settings" [size]="18" /> Admin
                </a>
              }
            </nav>
            <div class="p-4 border-t border-sidebar-border">
              <button (click)="logout()" class="w-full text-left text-sm text-muted-foreground hover:text-sidebar-foreground transition">
                Cerrar sesión
              </button>
            </div>
          </aside>
        } @else {
          <aside class="hidden lg:flex w-60 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
            <div class="p-4 flex items-center justify-between border-b border-sidebar-border">
              <span class="text-lg font-bold">YesChef Staff</span>
              <app-theme-toggle />
            </div>
            <nav class="flex-1 p-2 space-y-1" aria-label="Navegación principal">
              <a routerLink="/dashboard/kitchen" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                <app-icon name="chef-hat" [size]="18" /> Cocina
              </a>
              @if (auth.getRole() !== 'kitchen') {
                <a routerLink="/dashboard/reports" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="chart" [size]="18" /> Reportes
                </a>
                <a routerLink="/dashboard/cash-register" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="banknote" [size]="18" /> Caja
                </a>
              }
              @if (auth.getRole() === 'admin') {
                <a routerLink="/dashboard/admin" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition">
                  <app-icon name="settings" [size]="18" /> Admin
                </a>
              }
            </nav>
            <div class="p-4 border-t border-sidebar-border">
              <button (click)="logout()" class="w-full text-left text-sm text-muted-foreground hover:text-sidebar-foreground transition">
                Cerrar sesión
              </button>
            </div>
          </aside>
        }
        <main class="flex-1 bg-background overflow-auto min-w-0">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  sidebarOpen = signal(false);

  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout();
    window.location.href = '/auth/login';
  }
}
