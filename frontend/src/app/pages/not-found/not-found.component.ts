import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground flex flex-col">
      <header class="bg-primary text-primary-foreground">
        <div class="h-16 px-4 flex items-center justify-between max-w-5xl mx-auto w-full">
          <a routerLink="/menu" class="flex items-center gap-2">
            <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-accent text-accent-foreground shadow">
              <app-icon name="chef-hat" [size]="20" />
            </span>
            <span class="text-lg font-bold leading-tight">YesChef</span>
          </a>
        </div>
      </header>

      <main class="flex-1 flex items-center justify-center p-6">
        <div class="text-center max-w-md anim-fade-up">
          <p class="text-7xl font-black text-primary">404</p>
          <h1 class="text-2xl font-bold mt-4">Página no encontrada</h1>
          <p class="text-muted-foreground mt-2">
            Esta receta no está en el menú. Volvé al inicio para seguir pidiendo.
          </p>
          <div class="flex flex-wrap justify-center gap-3 mt-8">
            <a routerLink="/menu"
              class="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition">
              Ir al menú
            </a>
            <a routerLink="/dashboard/orders"
              class="border border-border bg-card text-foreground px-5 py-2.5 rounded-xl font-semibold hover:border-primary/50 transition">
              Panel de pedidos
            </a>
          </div>
        </div>
      </main>
    </div>
  `
})
export class NotFoundComponent {}