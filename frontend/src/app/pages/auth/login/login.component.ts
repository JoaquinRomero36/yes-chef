import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold text-center text-emerald-600 mb-6">Iniciar Sesión</h1>
        <form class="space-y-4">
          <input type="email" placeholder="Email" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <input type="password" placeholder="Contraseña" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <button type="submit" class="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">Ingresar</button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {}
