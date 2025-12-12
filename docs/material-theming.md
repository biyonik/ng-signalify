# Material Theming System

## Overview

ng-signalify provides a comprehensive Material Design theming system with support for light/dark modes, multiple color palettes, theme persistence, and automatic system theme detection.

## Features

- **Multiple Theme Modes**: Light, Dark, and Auto (follows system preference)
- **5 Color Palettes**: Indigo, Purple, Teal, Pink, and Amber
- **Theme Persistence**: Automatically saves preferences to localStorage
- **System Theme Detection**: Auto mode respects user's OS theme preference
- **Smooth Transitions**: CSS transitions for seamless theme changes
- **Signal-Based**: Built on Angular signals for optimal performance

## Installation

The `MaterialThemeService` is included in the `ng-signalify/adapters` package and is automatically available when using the material adapter.

```typescript
import { MaterialThemeService } from 'ng-signalify/adapters';
```

## Basic Usage

### Inject the Service

```typescript
import { Component } from '@angular/core';
import { MaterialThemeService } from 'ng-signalify/adapters';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent {
  constructor(public themeService: MaterialThemeService) {}
}
```

### Change Theme Mode

```typescript
// Set to light mode
themeService.setMode('light');

// Set to dark mode
themeService.setMode('dark');

// Set to auto (follows system)
themeService.setMode('auto');

// Toggle between light and dark
themeService.toggleMode();
```

### Change Color Palette

```typescript
// Available palettes: 'indigo', 'purple', 'teal', 'pink', 'amber'
themeService.setPalette('purple');
themeService.setPalette('teal');
```

### Read Current Theme

```typescript
// Get current mode setting
const mode = themeService.mode(); // 'light' | 'dark' | 'auto'

// Get actual applied theme (resolves 'auto')
const actualTheme = themeService.actualTheme(); // 'light' | 'dark'

// Get current palette
const palette = themeService.palette(); // 'indigo' | 'purple' | 'teal' | 'pink' | 'amber'
```

## Theme Switcher Component

The demo application includes a ready-to-use `ThemeSwitcherComponent` that you can use as a reference or copy to your project:

```typescript
import { Component } from '@angular/core';
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
  constructor(public themeService: MaterialThemeService) {}
}
```

## SCSS Setup

### Required Imports

Update your main `styles.scss` file:

```scss
@use '@angular/material' as mat;

@include mat.core();

// Import custom themes
@import './styles/themes/light-theme';
@import './styles/themes/dark-theme';
@import './styles/themes/palettes';

html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Theme Files

Create the following SCSS files in your `styles/themes/` directory:

#### `_light-theme.scss`

```scss
@use '@angular/material' as mat;

$light-primary: mat.define-palette(mat.$indigo-palette);
$light-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$light-warn: mat.define-palette(mat.$red-palette);

$light-theme: mat.define-light-theme((
  color: (
    primary: $light-primary,
    accent: $light-accent,
    warn: $light-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

.light-theme {
  @include mat.all-component-themes($light-theme);
  background-color: #fafafa;
  color: rgba(0, 0, 0, 0.87);
}
```

#### `_dark-theme.scss`

```scss
@use '@angular/material' as mat;

$dark-primary: mat.define-palette(mat.$indigo-palette);
$dark-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$dark-warn: mat.define-palette(mat.$red-palette);

$dark-theme: mat.define-dark-theme((
  color: (
    primary: $dark-primary,
    accent: $dark-accent,
    warn: $dark-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

.dark-theme {
  @include mat.all-component-themes($dark-theme);
  background-color: #303030;
  color: rgba(255, 255, 255, 0.87);
}
```

#### `_palettes.scss`

```scss
@use '@angular/material' as mat;

.indigo-theme {
  --primary-color: #3f51b5;
}

.purple-theme {
  $primary: mat.define-palette(mat.$purple-palette);
  $accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
  $warn: mat.define-palette(mat.$red-palette);
  $theme: mat.define-light-theme((
    color: (primary: $primary, accent: $accent, warn: $warn)
  ));
  @include mat.all-component-colors($theme);
  --primary-color: #9c27b0;
}

.teal-theme {
  $primary: mat.define-palette(mat.$teal-palette);
  $accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
  $warn: mat.define-palette(mat.$red-palette);
  $theme: mat.define-light-theme((
    color: (primary: $primary, accent: $accent, warn: $warn)
  ));
  @include mat.all-component-colors($theme);
  --primary-color: #009688;
}

.pink-theme {
  $primary: mat.define-palette(mat.$pink-palette);
  $accent: mat.define-palette(mat.$indigo-palette, A200, A100, A400);
  $warn: mat.define-palette(mat.$red-palette);
  $theme: mat.define-light-theme((
    color: (primary: $primary, accent: $accent, warn: $warn)
  ));
  @include mat.all-component-colors($theme);
  --primary-color: #e91e63;
}

.amber-theme {
  $primary: mat.define-palette(mat.$amber-palette);
  $accent: mat.define-palette(mat.$indigo-palette, A200, A100, A400);
  $warn: mat.define-palette(mat.$red-palette);
  $theme: mat.define-light-theme((
    color: (primary: $primary, accent: $accent, warn: $warn)
  ));
  @include mat.all-component-colors($theme);
  --primary-color: #ffc107;
}
```

## Custom Theme Creation

To create your own custom color palette:

1. Define a new palette in `_palettes.scss`:

```scss
.custom-theme {
  $primary: mat.define-palette(mat.$deep-purple-palette);
  $accent: mat.define-palette(mat.$amber-palette, A200, A100, A400);
  $warn: mat.define-palette(mat.$red-palette);
  $theme: mat.define-light-theme((
    color: (primary: $primary, accent: $accent, warn: $warn)
  ));
  @include mat.all-component-colors($theme);
  --primary-color: #673ab7;
}
```

2. Add the palette to the TypeScript types:

```typescript
export type ThemePalette = 'indigo' | 'pink' | 'purple' | 'teal' | 'amber' | 'custom';
```

## Best Practices

### Accessibility

- **Contrast Ratios**: All provided themes meet WCAG AA standards for contrast ratios
- **Focus Indicators**: Material components maintain visible focus indicators across themes
- **Color Independence**: Don't rely solely on color to convey information

### Performance

- **Signal-Based**: The service uses Angular signals for efficient change detection
- **CSS Transitions**: Smooth theme changes without JavaScript animations
- **LocalStorage**: Preferences are persisted locally to avoid server roundtrips

### SSR Considerations

The theme service includes checks for `window` and `localStorage` availability:

```typescript
if (typeof window === 'undefined') return 'light';
if (typeof localStorage === 'undefined') return;
```

This ensures the service works correctly in server-side rendering environments.

## API Reference

### MaterialThemeService

#### Properties

- `mode: Signal<ThemeMode>` - Current theme mode setting (readonly)
- `palette: Signal<ThemePalette>` - Current color palette (readonly)
- `actualTheme: Signal<'light' | 'dark'>` - Actual applied theme, resolving 'auto' mode (readonly)

#### Methods

- `setMode(mode: ThemeMode): void` - Set the theme mode
- `setPalette(palette: ThemePalette): void` - Set the color palette
- `toggleMode(): void` - Toggle between light and dark mode

### Types

```typescript
type ThemeMode = 'light' | 'dark' | 'auto';
type ThemePalette = 'indigo' | 'pink' | 'purple' | 'teal' | 'amber';
```

## Examples

### Reactive Theme Display

```typescript
@Component({
  template: `
    <div>
      <p>Current mode: {{ themeService.mode() }}</p>
      <p>Actual theme: {{ themeService.actualTheme() }}</p>
      <p>Palette: {{ themeService.palette() }}</p>
    </div>
  `
})
export class ThemeInfoComponent {
  constructor(public themeService: MaterialThemeService) {}
}
```

### Conditional Rendering Based on Theme

```typescript
@Component({
  template: `
    <mat-icon *ngIf="themeService.actualTheme() === 'light'">
      wb_sunny
    </mat-icon>
    <mat-icon *ngIf="themeService.actualTheme() === 'dark'">
      nights_stay
    </mat-icon>
  `
})
export class ThemeIconComponent {
  constructor(public themeService: MaterialThemeService) {}
}
```

## Troubleshooting

### Theme Not Applying

1. Ensure SCSS theme files are properly imported in `styles.scss`
2. Check that `@angular/material` is installed
3. Verify Material components are imported correctly

### LocalStorage Not Working

- Check browser privacy settings
- Verify SSR environment has fallback handling
- Ensure user hasn't disabled localStorage

### System Theme Not Detected

- Verify browser supports `prefers-color-scheme` media query
- Check OS theme settings are properly configured
- Ensure 'auto' mode is selected

## License

MIT License - see LICENSE file for details
