import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    loadComponent: () => import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'kitchen', pathMatch: 'full' },
      {
        path: 'kitchen',
        loadComponent: () => import('./pages/dashboard/kitchen/kitchen.component').then(m => m.KitchenComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/dashboard/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/dashboard/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/dashboard/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'cash-register',
        loadComponent: () => import('./pages/dashboard/cash-register/cash-register.component').then(m => m.CashRegisterComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
