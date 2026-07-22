import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Role } from '../../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold text-center text-emerald-600 mb-6">Crear Cuenta</h1>

        @if (error) {
          <div class="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">{{ error }}</div>
        }
        @if (success) {
          <div class="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4">{{ success }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <input [(ngModel)]="fullName" name="fullName" type="text" required placeholder="Nombre completo"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <input [(ngModel)]="username" name="username" type="text" required placeholder="Usuario"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <input [(ngModel)]="email" name="email" type="email" required placeholder="Email"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <input [(ngModel)]="password" name="password" type="password" required placeholder="Contraseña"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">

          <select [(ngModel)]="roleId" name="roleId" required
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            <option value="">Seleccioná un rol</option>
            @for (role of roles; track role.id) {
              <option [value]="role.id">{{ role.name }}</option>
            }
          </select>

          <button type="submit" [disabled]="loading"
            class="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {{ loading ? 'Creando...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-4">
          ¿Ya tenés cuenta?
          <a routerLink="/auth/login" class="text-emerald-600 hover:underline">Iniciá sesión</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  username = '';
  email = '';
  password = '';
  fullName = '';
  roleId = '';
  roles: Role[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.getRoles().subscribe(roles => this.roles = roles);
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password,
      fullName: this.fullName || null,
      roleId: this.roleId
    }).subscribe({
      next: () => {
        this.success = 'Cuenta creada. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear cuenta';
        this.loading = false;
      }
    });
  }
}
