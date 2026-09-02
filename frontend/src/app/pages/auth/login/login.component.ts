import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeToggleComponent } from '../../../components/theme-toggle/theme-toggle.component';
import { IconComponent } from '../../../components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ThemeToggleComponent, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden anim-fade-in">
      <div class="absolute top-4 right-4">
        <app-theme-toggle />
      </div>

      <div class="absolute inset-0 -z-10 pointer-events-none anim-fade-in">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl"></div>
      </div>

      <div class="w-full max-w-md">
        <div class="mb-8 text-center anim-fade-up">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4 anim-zoom-in">
            <app-icon name="chef-hat" [size]="34" />
          </div>
          <h1 class="text-2xl font-bold text-foreground">YesChef</h1>
          <p class="text-muted-foreground text-sm mt-1">Acceso del personal</p>
        </div>

        <div class="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm anim-fade-up" style="animation-delay: 100ms">
          @if (error) {
            <div class="bg-destructive/10 text-destructive px-4 py-3 rounded-xl mb-5 text-sm anim-fade-in">{{ error }}</div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <app-icon name="mail" [size]="18" />
                </span>
                <input
                  id="email" type="email" [(ngModel)]="email" name="email" required
                  placeholder="tu@email.com"
                  class="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl bg-background placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                >
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <app-icon name="lock" [size]="18" />
                </span>
                <input
                  id="password" type="password" [(ngModel)]="password" name="password" required
                  placeholder="••••••••"
                  class="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl bg-background placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                >
              </div>
            </div>

            <button type="submit" [disabled]="loading"
              class="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/20">
              {{ loading ? 'Ingresando...' : 'Ingresar' }}
            </button>
          </form>
        </div>

        <p class="text-center text-xs text-muted-foreground mt-6">
          Este acceso es exclusivo para el personal del restaurante.
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
      next: () => this.router.navigate(['/dashboard/kitchen']),
      error: (err) => {
        this.error = err.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
