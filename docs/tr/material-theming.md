# Material Tema Sistemi

## Genel Bakış

ng-signalify, açık/koyu modlar, birden fazla renk paleti, tema kalıcılığı ve otomatik sistem teması algılama desteği ile kapsamlı bir Material Design tema sistemi sağlar.

## Özellikler

- **Birden Fazla Tema Modu**: Açık, Koyu ve Otomatik (sistem tercihini takip eder)
- **5 Renk Paleti**: Indigo, Mor, Deniz Yeşili, Pembe ve Amber
- **Tema Kalıcılığı**: Tercihleri otomatik olarak localStorage'a kaydeder
- **Sistem Teması Algılama**: Otomatik mod kullanıcının işletim sistemi tema tercihine uyar
- **Yumuşak Geçişler**: Sorunsuz tema değişiklikleri için CSS geçişleri
- **Signal Tabanlı**: Optimal performans için Angular signals üzerine inşa edilmiştir

## Kurulum

`MaterialThemeService`, `ng-signalify/adapters` paketine dahildir ve material adapter kullanılırken otomatik olarak kullanılabilir.

```typescript
import { MaterialThemeService } from 'ng-signalify/adapters';
```

## Temel Kullanım

### Servisi Enjekte Etme

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

### Tema Modunu Değiştirme

```typescript
// Açık moda ayarla
themeService.setMode('light');

// Koyu moda ayarla
themeService.setMode('dark');

// Otomatiğe ayarla (sistemi takip eder)
themeService.setMode('auto');

// Açık ve koyu arasında geçiş yap
themeService.toggleMode();
```

### Renk Paletini Değiştirme

```typescript
// Mevcut paletler: 'indigo', 'purple', 'teal', 'pink', 'amber'
themeService.setPalette('purple');
themeService.setPalette('teal');
```

### Mevcut Temayı Okuma

```typescript
// Mevcut mod ayarını al
const mode = themeService.mode(); // 'light' | 'dark' | 'auto'

// Gerçekte uygulanan temayı al ('auto'yu çözer)
const actualTheme = themeService.actualTheme(); // 'light' | 'dark'

// Mevcut paleti al
const palette = themeService.palette(); // 'indigo' | 'purple' | 'teal' | 'pink' | 'amber'
```

## Tema Değiştirici Bileşeni

Demo uygulaması, referans olarak kullanabileceğiniz veya projenize kopyalayabileceğiniz kullanıma hazır bir `ThemeSwitcherComponent` içerir:

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
      <!-- Mod Değiştirici -->
      <mat-button-toggle-group 
        [value]="themeService.mode()"
        (change)="themeService.setMode($event.value)"
      >
        <mat-button-toggle value="light" matTooltip="Açık mod">
          <mat-icon>light_mode</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="auto" matTooltip="Otomatik (sistem)">
          <mat-icon>brightness_auto</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="dark" matTooltip="Koyu mod">
          <mat-icon>dark_mode</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>
      
      <!-- Renk Paleti Menüsü -->
      <button 
        mat-icon-button 
        [matMenuTriggerFor]="paletteMenu"
        matTooltip="Renk paletini değiştir"
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
          Mor
        </button>
        <button mat-menu-item (click)="themeService.setPalette('teal')">
          <span class="color-dot teal"></span>
          Deniz Yeşili
        </button>
        <button mat-menu-item (click)="themeService.setPalette('pink')">
          <span class="color-dot pink"></span>
          Pembe
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

## SCSS Kurulumu

### Gerekli İçe Aktarımlar

Ana `styles.scss` dosyanızı güncelleyin:

```scss
@use '@angular/material' as mat;

@include mat.core();

// Özel temaları içe aktar
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

### Tema Dosyaları

`styles/themes/` dizininizde aşağıdaki SCSS dosyalarını oluşturun:

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

## Özel Tema Oluşturma

Kendi özel renk paletinizi oluşturmak için:

1. `_palettes.scss` dosyasında yeni bir palet tanımlayın:

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

2. Paleti TypeScript tiplerine ekleyin:

```typescript
export type ThemePalette = 'indigo' | 'pink' | 'purple' | 'teal' | 'amber' | 'custom';
```

## En İyi Uygulamalar

### Erişilebilirlik

- **Kontrast Oranları**: Sağlanan tüm temalar, kontrast oranları için WCAG AA standartlarını karşılar
- **Odak Göstergeleri**: Material bileşenleri, temalar arasında görünür odak göstergelerini korur
- **Renkten Bağımsızlık**: Bilgi iletmek için yalnızca renge güvenmeyin

### Performans

- **Signal Tabanlı**: Servis, verimli değişiklik algılama için Angular signals kullanır
- **CSS Geçişleri**: JavaScript animasyonları olmadan yumuşak tema değişiklikleri
- **LocalStorage**: Tercihler, sunucu gidiş-dönüşlerinden kaçınmak için yerel olarak saklanır

### SSR Hususları

Tema servisi, `window` ve `localStorage` kullanılabilirliği için kontroller içerir:

```typescript
if (typeof window === 'undefined') return 'light';
if (typeof localStorage === 'undefined') return;
```

Bu, servisin sunucu tarafı render ortamlarında doğru şekilde çalışmasını sağlar.

## API Referansı

### MaterialThemeService

#### Özellikler

- `mode: Signal<ThemeMode>` - Mevcut tema mod ayarı (salt okunur)
- `palette: Signal<ThemePalette>` - Mevcut renk paleti (salt okunur)
- `actualTheme: Signal<'light' | 'dark'>` - 'auto' modunu çözerek uygulanan gerçek tema (salt okunur)

#### Metodlar

- `setMode(mode: ThemeMode): void` - Tema modunu ayarla
- `setPalette(palette: ThemePalette): void` - Renk paletini ayarla
- `toggleMode(): void` - Açık ve koyu mod arasında geçiş yap

### Tipler

```typescript
type ThemeMode = 'light' | 'dark' | 'auto';
type ThemePalette = 'indigo' | 'pink' | 'purple' | 'teal' | 'amber';
```

## Örnekler

### Reaktif Tema Gösterimi

```typescript
@Component({
  template: `
    <div>
      <p>Mevcut mod: {{ themeService.mode() }}</p>
      <p>Gerçek tema: {{ themeService.actualTheme() }}</p>
      <p>Palet: {{ themeService.palette() }}</p>
    </div>
  `
})
export class ThemeInfoComponent {
  constructor(public themeService: MaterialThemeService) {}
}
```

### Temaya Göre Koşullu Render

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

## Sorun Giderme

### Tema Uygulanmıyor

1. SCSS tema dosyalarının `styles.scss` dosyasında düzgün bir şekilde içe aktarıldığından emin olun
2. `@angular/material` paketinin yüklü olduğunu kontrol edin
3. Material bileşenlerinin doğru şekilde içe aktarıldığını doğrulayın

### LocalStorage Çalışmıyor

- Tarayıcı gizlilik ayarlarını kontrol edin
- SSR ortamının yedek işleme sahip olduğunu doğrulayın
- Kullanıcının localStorage'ı devre dışı bırakmadığından emin olun

### Sistem Teması Algılanmıyor

- Tarayıcının `prefers-color-scheme` medya sorgusunu desteklediğini doğrulayın
- İşletim sistemi tema ayarlarının düzgün yapılandırıldığını kontrol edin
- 'auto' modunun seçili olduğundan emin olun

## Lisans

MIT Lisansı - ayrıntılar için LICENSE dosyasına bakın
