import { Injectable, computed, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'yeschef_theme';
  private readonly themeSignal = signal<Theme>(this.getInitial());

  readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.themeSignal();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem(this.THEME_KEY, theme);
    });
  }

  get theme(): Theme {
    return this.themeSignal();
  }

  toggle(): void {
    this.themeSignal.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  set(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  private getInitial(): Theme {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.THEME_KEY) : null;
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }
}
