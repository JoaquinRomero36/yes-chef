import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const STAFF_ROLES = ['admin', 'waiter', 'kitchen'];

export const roleGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.parseUrl('/auth/login');

  const role = auth.getRole();
  if (role && STAFF_ROLES.includes(role)) return true;

  // Clientes o roles inválidos no acceden al panel de administración
  return router.parseUrl('/menu');
};