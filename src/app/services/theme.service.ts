import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      let isDark: boolean;
      
      if (savedTheme !== null) {
        // Use saved preference if available
        isDark = savedTheme === 'dark';
      } else {
        // Detect system preference if no saved preference
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      this.isDarkModeSubject.next(isDark);
      this.applyTheme(isDark);
    }
  }

  toggleDarkMode(): void {
    const newValue = !this.isDarkModeSubject.value;
    this.isDarkModeSubject.next(newValue);
    this.applyTheme(newValue);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
    }
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      if (isDark) {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    }
  }

  private setupSystemThemeListener(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Listen for system theme changes only if no manual preference is saved
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        const savedTheme = localStorage.getItem('theme');
        
        // Only update if user hasn't manually set a preference
        if (savedTheme === null) {
          this.isDarkModeSubject.next(e.matches);
          this.applyTheme(e.matches);
        }
      });
    }
  }
}