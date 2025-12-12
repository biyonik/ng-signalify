import { Component, inject } from '@angular/core';
import { MaterialThemeService } from 'ng-signalify/adapters';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [
    MatButtonToggleModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="theme-switcher">
      <!-- Mode Toggle -->
      <mat-button-toggle-group 
        [value]="themeService.mode()"
        (change)="themeService.setMode($event.value)"
        aria-label="Theme mode"
      >
        <mat-button-toggle value="light" matTooltip="Light mode">
          <mat-icon>light_mode</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="auto" matTooltip="Auto (system)">
          <mat-icon>brightness_auto</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="dark" matTooltip="Dark mode">
          <mat-icon>dark_mode</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>
      
      <!-- Color Palette Menu -->
      <button 
        mat-icon-button 
        [matMenuTriggerFor]="paletteMenu"
        matTooltip="Change color palette"
        aria-label="Color palette menu"
      >
        <mat-icon>palette</mat-icon>
      </button>
      
      <mat-menu #paletteMenu="matMenu">
        <button mat-menu-item (click)="themeService.setPalette('indigo')">
          <span class="color-dot indigo"></span>
          Indigo
        </button>
        <button mat-menu-item (click)="themeService.setPalette('purple')">
          <span class="color-dot purple"></span>
          Purple
        </button>
        <button mat-menu-item (click)="themeService.setPalette('teal')">
          <span class="color-dot teal"></span>
          Teal
        </button>
        <button mat-menu-item (click)="themeService.setPalette('pink')">
          <span class="color-dot pink"></span>
          Pink
        </button>
        <button mat-menu-item (click)="themeService.setPalette('amber')">
          <span class="color-dot amber"></span>
          Amber
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .theme-switcher {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .color-dot {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 8px;
      vertical-align: middle;
      
      &.indigo { background: #3f51b5; }
      &.purple { background: #9c27b0; }
      &.teal { background: #009688; }
      &.pink { background: #e91e63; }
      &.amber { background: #ffc107; }
    }
  `]
})
export class ThemeSwitcherComponent {
  themeService = inject(MaterialThemeService);
}
