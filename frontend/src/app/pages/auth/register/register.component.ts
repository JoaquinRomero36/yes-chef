import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeToggleComponent } from '../../../components/theme-toggle/theme-toggle.component';
import { IconComponent } from '../../../components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, ThemeToggleComponent, IconComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background p-4 relative anim-fade-in">
      <div class="absolute top-4 right-4">
        <app-theme-toggle />
      </div>

      <div class="absolute inset-0 -z-10 pointer-events-none anim-fade-in">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl"></div>
      </div>

      <div class="w-full max-w-sm anim-fade-up">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4 anim-zoom-in">
            <app-icon name="chef-hat" [size]="28" />
          </div>
          <h1 class="text-2xl font-bold text-center text-primary mb-2">Configurar administrador</h1>
          <p class="text-center text-sm text-muted-foreground mb-6">
            Primer acceso: creá la cuenta del dueño del restaurante
          </p>
        </div>

        @if (error) {
          <div class="bg-destructive/10 text-destructive px-4 py-2 rounded-lg mb-4 anim-fade-in">{{ error }}</div>
        }
        @if (success) {
          <div class="bg-primary/10 text-primary px-4 py-2 rounded-lg mb-4 anim-fade-in">{{ success }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4 bg-card rounded-2xl border border-border p-6 shadow-sm anim-fade-up" style="animation-delay: 100ms">
          <input [(ngModel)]="fullName" name="fullName" type="text" required placeholder="Nombre completo"
            class="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none">
          <input [(ngModel)]="username" name="username" type="text" required placeholder="Usuario"
            class="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none">
          <input [(ngModel)]="email" name="email" type="email" required placeholder="Email"
            class="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none">
          <input [(ngModel)]="password" name="password" type="password" required placeholder="Contraseña"
            class="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none">

          <button type="submit" [disabled]="loading"
            class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 active:scale-[0.99] transition disabled:opacity-50">
            {{ loading ? 'Creando...' : 'Crear administrador' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  username = '';
  email = '';
  password = '';
  fullName = '';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.getSetupStatus().subscribe(status => {
      if (!status.needsSetup) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password,
      fullName: this.fullName || null
    }).subscribe({
      next: () => {
        this.success = 'Cuenta de administrador creada. Iniciá sesión...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear la cuenta';
        this.loading = false;
      }
    });
  }
}
