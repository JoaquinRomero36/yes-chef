import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold text-center text-emerald-600 mb-6">Iniciar Sesión</h1>

        @if (error) {
          <div class="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <input
            [(ngModel)]="email" name="email" type="email" required
            placeholder="Email"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
          <input
            [(ngModel)]="password" name="password" type="password" required
            placeholder="Contraseña"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
          <button type="submit" [disabled]="loading"
            class="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-4">
          ¿No tenés cuenta?
          <a routerLink="/auth/register" class="text-emerald-600 hover:underline">Registrate</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/menu']),
      error: (err) => {
        this.error = err.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
