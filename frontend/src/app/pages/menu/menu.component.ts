import { Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <h1 class="text-4xl font-bold text-emerald-600 mb-2">YesChef</h1>
      <p class="text-gray-600">Tu menú digital</p>
    </div>
  `,
  styles: ``
})
export class MenuComponent {}
