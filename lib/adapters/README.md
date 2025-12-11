# ng-signalify Adapters

**TR:** Adapterler, ng-signalify'ın mantık katmanını UI kütüphaneleri ile köprüler.  
**EN:** Adapters bridge ng-signalify's logic layer with UI libraries.

**Author:** Ahmet ALTUN  
**GitHub:** [github.com/biyonik](https://github.com/biyonik)  
**LinkedIn:** [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)  
**Email:** ahmet.altun60@gmail.com

---

## Available Adapters

### Material Adapter

**TR:** Angular Material projeleri için adapter  
**EN:** Adapter for Angular Material projects

#### Basic Usage / Temel Kullanım

```typescript
// app.config.ts
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

export const appConfig = {
  providers: [
    provideSigUI(new MaterialAdapter())
  ]
};
```

#### Advanced Usage with Configuration / Yapılandırma ile Gelişmiş Kullanım

**TR:** MaterialAdapter, tüm form alanları için varsayılan ayarları yapılandırmanıza izin verir.  
**EN:** MaterialAdapter allows you to configure default settings for all form fields.

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSigUI, MaterialAdapter, MaterialAdapterConfig } from 'ng-signalify/adapters';

/**
 * TR: Özel MaterialAdapter yapılandırması.
 * Tüm form alanlarında tutarlı görünüm ve davranış sağlar.
 *
 * EN: Custom MaterialAdapter configuration.
 * Ensures consistent appearance and behavior across all form fields.
 *
 * @author Ahmet ALTUN
 */
const materialConfig: MaterialAdapterConfig = {
  // TR: Varsayılan görünüm stili
  // EN: Default appearance style
  defaultAppearance: 'outline',     // 'fill' | 'outline' | 'standard' | 'legacy'
  
  // TR: Etiket davranışı
  // EN: Label behavior
  defaultFloatLabel: 'auto',        // 'always' | 'auto'
  
  // TR: Tema rengi
  // EN: Theme color
  defaultColor: 'primary',          // 'primary' | 'accent' | 'warn'
  
  // TR: Otomatik ipuçları göster
  // EN: Auto-display hints
  autoHints: true,
  
  // TR: Otomatik ARIA etiketleri oluştur (erişilebilirlik)
  // EN: Auto-generate ARIA labels (accessibility)
  autoAriaLabels: true
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new MaterialAdapter(materialConfig))
  ]
};
```

#### Configuration Options / Yapılandırma Seçenekleri

**TR:** MaterialAdapterConfig arayüzü aşağıdaki seçenekleri destekler:  
**EN:** MaterialAdapterConfig interface supports the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultAppearance` | `'fill' \| 'outline' \| 'standard' \| 'legacy'` | `'outline'` | TR: Form alanlarının görünüm stili<br>EN: Appearance style for form fields |
| `defaultFloatLabel` | `'always' \| 'auto'` | `'auto'` | TR: Etiket davranışı<br>EN: Label behavior |
| `defaultColor` | `'primary' \| 'accent' \| 'warn'` | `'primary'` | TR: Tema rengi<br>EN: Theme color |
| `autoHints` | `boolean` | `false` | TR: Field config'den ipuçlarını otomatik göster<br>EN: Auto-display hints from field config |
| `autoAriaLabels` | `boolean` | `true` | TR: Erişilebilirlik için ARIA etiketlerini otomatik oluştur<br>EN: Auto-generate ARIA labels for accessibility |

#### Appearance Styles Comparison / Görünüm Stilleri Karşılaştırması

```typescript
// Fill - Prominent, emphasized appearance
// TR: Dolgun, vurgulu görünüm
new MaterialAdapter({ defaultAppearance: 'fill' })

// Outline - Clean, modern appearance (recommended)
// TR: Temiz, modern görünüm (önerilen)
new MaterialAdapter({ defaultAppearance: 'outline' })

// Standard - Minimalist appearance
// TR: Minimalist görünüm
new MaterialAdapter({ defaultAppearance: 'standard' })

// Legacy - Classic Material appearance
// TR: Klasik Material görünümü
new MaterialAdapter({ defaultAppearance: 'legacy' })
```

### Headless Adapter

For custom UI or other libraries:

```typescript
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

export const appConfig = {
  providers: [
    provideSigUI(new HeadlessAdapter())
  ]
};
```

## Usage Example

```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput 
        [value]="form.fields.name.value()" 
        (input)="form.fields.name.value.set($any($event.target).value)" />
      @if (form.fields.name.error() && form.fields.name.touched()) {
        <mat-error>{{ form.fields.name.error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ExampleComponent {
  fields = [
    new StringField('name', 'Name', { required: true, min: 2 })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

## Creating Custom Adapters

**TR:** Özel adapter oluşturma  
**EN:** Creating custom adapters

Extend `BaseFormAdapter`:

```typescript
import { BaseFormAdapter } from 'ng-signalify/adapters';

/**
 * TR: Özel UI kütüphanesi için adapter.
 * EN: Adapter for custom UI library.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class MyCustomAdapter extends BaseFormAdapter {
  readonly name = 'my-custom-ui';
  readonly version = '1.0.0';
  
  getInputComponent() { return MyInputComponent; }
  getSelectComponent() { return MySelectComponent; }
  // ... implement other methods
}
```

---

## Documentation

**TR:** Detaylı dokümantasyon için aşağıdaki kılavuzlara bakın:  
**EN:** For detailed documentation, refer to the following guides:

- **[Material Component Mapping](../../docs/material-component-mapping.md)** - Complete guide for all field types with Material
  - TR: Tüm alan türleri için Material ile eksiksiz kılavuz
  
- **[Material Best Practices](../../docs/material-best-practices.md)** - Best practices for Material + ng-signalify
  - TR: Material + ng-signalify için en iyi uygulamalar
  
- **[Accessibility Checklist](../../docs/accessibility-checklist.md)** - WCAG 2.1 Level AA compliance checklist
  - TR: WCAG 2.1 Level AA uyumluluk kontrol listesi

---

**Version:** 2.0.0  
**Last Updated:** December 2025
