import { Injectable, signal, computed, effect, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemePalette = 'indigo' | 'pink' | 'purple' | 'teal' | 'amber';

interface ThemePreferences {
  mode: ThemeMode;
  palette: ThemePalette;
}

@Injectable({ providedIn: 'root' })
export class MaterialThemeService {
  private readonly STORAGE_KEY = 'ng-signalify-theme';
  
  // Current theme mode
  private _mode = signal<ThemeMode>('auto');
  readonly mode = this._mode.asReadonly();
  
  // Current color palette
  private _palette = signal<ThemePalette>('indigo');
  readonly palette = this._palette.asReadonly();
  
  // Computed: actual theme applied (resolves 'auto')
  readonly actualTheme = computed(() => {
    const mode = this._mode();
    if (mode === 'auto') {
      return this.getSystemTheme();
    }
    return mode;
  });
  
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadPreferences();
    this.watchSystemTheme();
    
    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme();
    });
  }
  
  /**
   * Set theme mode (light, dark, or auto)
   */
  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    this.savePreferences();
  }
  
  /**
   * Set color palette
   */
  setPalette(palette: ThemePalette): void {
    this._palette.set(palette);
    this.savePreferences();
  }
  
  /**
   * Toggle between light and dark mode
   */
  toggleMode(): void {
    const current = this.actualTheme();
    this.setMode(current === 'light' ? 'dark' : 'light');
  }
  
  /**
   * Apply theme classes to document body
   */
  private applyTheme(): void {
    const theme = this.actualTheme();
    const palette = this._palette();
    
    // Remove all theme classes
    this.document.body.classList.remove('light-theme', 'dark-theme');
    this.document.body.classList.remove(
      'indigo-theme',
      'pink-theme',
      'purple-theme',
      'teal-theme',
      'amber-theme'
    );
    
    // Add current theme classes
    this.document.body.classList.add(`${theme}-theme`);
    this.document.body.classList.add(`${palette}-theme`);
  }
  
  /**
   * Get system theme preference
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  
  /**
   * Watch for system theme changes
   */
  private watchSystemTheme(): void {
    if (typeof window === 'undefined') return;
    
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (this._mode() === 'auto') {
          this.applyTheme();
        }
      });
  }
  
  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof localStorage === 'undefined') return;
    
    const preferences: ThemePreferences = {
      mode: this._mode(),
      palette: this._palette()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
  }
  
  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const preferences: ThemePreferences = JSON.parse(saved);
        this._mode.set(preferences.mode);
        this._palette.set(preferences.palette);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  }
}
