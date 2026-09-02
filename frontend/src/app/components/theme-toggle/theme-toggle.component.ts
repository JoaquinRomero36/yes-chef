import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="theme.isDark()"
      aria-label="Cambiar tema"
      title="Cambiar tema"
      (click)="theme.toggle()"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent
             bg-foreground/20 transition-colors duration-300
             focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
             focus-visible:ring-offset-background"
    >
      <span
        class="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full
               bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2)]
               transition-transform duration-300"
        [class.translate-x-5]="theme.isDark()"
        [class.translate-x-0.5]="!theme.isDark()"
      >
        @if (theme.isDark()) {
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        }
      </span>
    </button>
  `
})
export class ThemeToggleComponent {
  constructor(public theme: ThemeService) {}
}
