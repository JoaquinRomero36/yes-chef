import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex">
      <aside class="w-56 bg-gray-900 text-white flex flex-col">
        <div class="p-4 text-lg font-bold border-b border-gray-700">YesChef Staff</div>
        <nav class="flex-1 p-2 space-y-1">
          <a routerLink="/dashboard/kitchen" routerLinkActive="bg-emerald-600" class="block px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            🍳 Cocina
          </a>
          <a routerLink="/dashboard/admin" routerLinkActive="bg-emerald-600" class="block px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            ⚙️ Admin
          </a>
        </nav>
        <div class="p-4 border-t border-gray-700">
          <button (click)="logout()" class="w-full text-left text-sm text-gray-400 hover:text-white transition">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main class="flex-1 bg-gray-50 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class DashboardLayoutComponent {
  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
    window.location.href = '/auth/login';
  }
}
