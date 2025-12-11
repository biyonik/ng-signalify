<div align="center">

# ng-signalify

### The Signal-First Enterprise Framework for Angular

[![Angular](https://img.shields.io/badge/Angular-17%2B%20%7C%2018%2B%20%7C%2019%2B-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)
[![Coverage](https://img.shields.io/badge/Coverage-98%25-22C55E?style=for-the-badge)](https://github.com/biyonik/ng-signalify)
[![Build](https://img.shields.io/badge/Build-Passing-22C55E?style=for-the-badge)](https://github.com/biyonik/ng-signalify)
[![npm](https://img.shields.io/badge/npm-1.0.0--beta.1-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ng-signalify)

<br />

**TR** | Modern Angular uygulamaları için Signal-tabanlı form yönetimi, state management, API katmanı ve 50+ UI bileşeni tek pakette.

**EN** | Signal-based form management, state management, API layer, and 50+ UI components for modern Angular applications in one package.

<br />

[Kurulum](#-kurulum--installation) · [Hızlı Başlangıç](#-hızlı-başlangıç--quick-start) · [Dokümantasyon](DOCUMENTATION.md) · [Örnekler](#-cookbook) · [Katkıda Bulun](#-katkıda-bulunma--contributing)

</div>

---

## Neden ng-signalify? / Why ng-signalify?

<table>
<tr>
<td width="50%">

### TR - Türkçe

Geleneksel Angular geliştirmesinde:
- `ReactiveForms` karmaşık ve boilerplate dolu
- `Ngrx/Ngxs` öğrenme eğrisi yüksek
- Observable subscription yönetimi zahmetli
- Form, State, API birbirinden kopuk

**ng-signalify** bunları tek çatı altında, Angular Signals ile çözüyor:

- **Sıfır Boilerplate** - Action/Reducer yok
- **Tip Güvenli** - Zod + TypeScript
- **Reaktif** - Fine-grained Signals
- **Hazır UI** - 50+ Standalone Component
- **Türkiye Uyumlu** - TC Kimlik, IBAN, Telefon validatorları

</td>
<td width="50%">

### EN - English

In traditional Angular development:
- `ReactiveForms` is complex with boilerplate
- `Ngrx/Ngxs` has steep learning curve
- Observable subscription management is tedious
- Form, State, API are disconnected

**ng-signalify** solves these under one roof with Angular Signals:

- **Zero Boilerplate** - No Action/Reducer
- **Type Safe** - Zod + TypeScript
- **Reactive** - Fine-grained Signals
- **Ready UI** - 50+ Standalone Components
- **Production Ready** - Enterprise-grade features

</td>
</tr>
</table>

---

## Mimari / Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI COMPONENT LAYER                                │
│         50+ Standalone Components · OnPush · Signal-integrated              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              STORE LAYER                                    │
│      EntityStore · CRUD · Caching · Optimistic Updates · Pagination         │
├─────────────────────────────────────────────────────────────────────────────┤
│                             SCHEMA LAYER                                    │
│   FormState · Dependencies · Async Validation · Cross-Field · History       │
├─────────────────────────────────────────────────────────────────────────────┤
│                         FIELD DEFINITION LAYER                              │
│         24 Field Types · Zod Schemas · Import/Export · Formatting           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Kurulum / Installation

```bash
# npm
npm install ng-signalify zod

# pnpm
pnpm add ng-signalify zod

# yarn
yarn add ng-signalify zod
```

### Stil Kurulumu / Style Setup

**Seçenek A: Pre-compiled CSS (Hızlı Başlangıç / Quick Start)**

```json
// angular.json
{
  "styles": [
    "node_modules/ng-signalify/ng-signalify.css",
    "src/styles.scss"
  ]
}
```

**Seçenek B: SCSS (Özelleştirme için / For Customization)**

```scss
// styles.scss

// Önce kendi değişkenlerini tanımla (opsiyonel)
// Define your variables first (optional)
$sig-color-primary: #8b5cf6;
$sig-radius-md: 0.5rem;

// Sonra ng-signalify'ı import et
// Then import ng-signalify
@import 'ng-signalify/styles/main';
```

---

## Hızlı Başlangıç / Quick Start

### 1. Basit Form / Simple Form

```typescript
import { Component } from '@angular/core';
import { StringField, IntegerField, EnumField } from 'ng-signalify/fields';
import { FormSchema, createEnhancedForm } from 'ng-signalify/schemas';
import { SigInput, SigSelect, SigFormField } from 'ng-signalify/components';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SigInput, SigSelect, SigFormField],
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Ad Soyad / Full Name -->
      <sig-form-field label="Ad Soyad" [error]="form.fields.name.combinedError()">
        <sig-input [(value)]="form.fields.name.value" />
      </sig-form-field>

      <!-- Yaş / Age -->
      <sig-form-field label="Yaş" [error]="form.fields.age.combinedError()">
        <sig-input type="number" [(value)]="form.fields.age.value" />
      </sig-form-field>

      <!-- Rol / Role -->
      <sig-form-field label="Rol" [error]="form.fields.role.combinedError()">
        <sig-select
          [options]="roleOptions"
          [(value)]="form.fields.role.value"
        />
      </sig-form-field>

      <button type="submit" [disabled]="!form.valid()">
        Kaydet / Save
      </button>
    </form>
  `
})
export class UserFormComponent {
  // Field tanımları / Field definitions
  private fields = [
    new StringField('name', 'Ad Soyad', { required: true, min: 3, max: 50 }),
    new IntegerField('age', 'Yaş', { required: true, min: 18, max: 120 }),
    new EnumField('role', 'Rol', {
      required: true,
      options: [
        { id: 'admin', label: 'Yönetici' },
        { id: 'user', label: 'Kullanıcı' },
        { id: 'guest', label: 'Misafir' }
      ]
    })
  ];

  // Form oluştur / Create form
  protected form = createEnhancedForm(this.fields, {
    name: 'Ahmet Yılmaz',
    age: 28,
    role: 'user'
  });

  protected roleOptions = [
    { id: 'admin', label: 'Yönetici' },
    { id: 'user', label: 'Kullanıcı' },
    { id: 'guest', label: 'Misafir' }
  ];

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
      // { name: 'Ahmet Yılmaz', age: 28, role: 'user' }
    }
  }
}
```

### 2. Entity Store / State Management

```typescript
import { Injectable, computed } from '@angular/core';
import { EntityStore, PaginatedResponse, EntityId, FetchParams } from 'ng-signalify/store';
import { createHttpClient, HttpClient } from 'ng-signalify/api';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// HTTP Client örneği oluştur / Create HTTP Client instance
const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
});

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      selectId: (p) => p.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000, // 5 dakika / 5 minutes
      optimistic: true
    });
  }

  // Abstract metodları implemente et / Implement abstract methods
  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<Product>> {
    const response = await http.get<PaginatedResponse<Product>>('/api/products', { params });
    return response.data;
  }

  protected async fetchOne(id: EntityId): Promise<Product> {
    const response = await http.get<Product>(`/api/products/${id}`);
    return response.data;
  }

  protected async createOne(data: Partial<Product>): Promise<Product> {
    const response = await http.post<Product>('/api/products', { body: data });
    return response.data;
  }

  protected async updateOne(id: EntityId, data: Partial<Product>): Promise<Product> {
    const response = await http.put<Product>(`/api/products/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/products/${id}`);
  }

  // Custom selectors / Özel seçiciler
  readonly lowStockProducts = computed(() =>
    this.signals.all().filter(p => p.stock < 10)
  );

  readonly totalValue = computed(() =>
    this.signals.all().reduce((sum, p) => sum + (p.price * p.stock), 0)
  );

  // Custom action / Özel aksiyon
  async decreaseStock(productId: string, amount: number): Promise<void> {
    const { rollback } = this.optimisticUpdate(productId, {
      stock: (this.getById(productId)?.stock ?? 0) - amount
    });

    try {
      await http.post(`/api/products/${productId}/decrease-stock`, { body: { amount } });
    } catch (error) {
      rollback();
      throw error;
    }
  }
}
```

**Kullanım / Usage:**

```typescript
@Component({
  template: `
    @if (store.signals.isLoading()) {
      <sig-loading />
    }

    @for (product of store.signals.all(); track product.id) {
      <div class="product-card">
        <h3>{{ product.name }}</h3>
        <p>{{ product.price | currency }}</p>
        <p>Stok: {{ product.stock }}</p>
        <button (click)="store.delete(product.id)">Sil</button>
      </div>
    }

    <sig-pagination
      [page]="store.signals.page()"
      [totalPages]="store.signals.totalPages()"
      (pageChange)="store.goToPage($event)"
    />
  `
})
export class ProductListComponent {
  store = inject(ProductStore);

  ngOnInit() {
    this.store.loadAll();
  }
}
```

---

## Modüller / Modules

### Field Tipleri / Field Types

| Kategori | Tipler | Özellikler |
|----------|--------|------------|
| **Primitives** | `StringField`, `IntegerField`, `DecimalField`, `BooleanField`, `TextAreaField` | Min/Max, Email, URL, Regex, Precision |
| **Date/Time** | `DateField`, `TimeField`, `DateTimeField`, `DateRangeField` | Excel import, Timezone, 12h/24h |
| **Selection** | `EnumField`, `MultiEnumField`, `RelationField` | Whitelist, Async lookup, CSV import |
| **Media** | `FileField`, `ImageField` | Size/MIME validation, Dimensions |
| **Complex** | `ArrayField`, `JsonField` | Nested validation, Schema validation |
| **Special** | `PasswordField`, `ColorField`, `SliderField` | Entropy analysis, HEX/RGB/HSL |

### Form Özellikleri / Form Features

| Özellik | Açıklama / Description |
|---------|------------------------|
| **Async Validation** | Debounced API validation (email uniqueness, etc.) |
| **Field Dependencies** | Show/hide, computed values, cascading selects |
| **Cross-Field Validation** | Multi-field rules (startDate < endDate) |
| **Form History** | Undo/Redo with configurable depth |
| **Auto-Save** | Debounced auto-save callback |
| **Dirty Tracking** | Track modified fields |

### Store Özellikleri / Store Features

| Özellik | Açıklama / Description |
|---------|------------------------|
| **Smart Caching** | TTL-based cache with `isStale` signal |
| **Optimistic Updates** | Instant UI updates with rollback |
| **Pagination** | Built-in pagination state |
| **Filtering & Sorting** | Managed filter/sort state |
| **Batch Operations** | `createMany`, `updateMany`, `deleteMany` |
| **Selection** | Single/multi selection support |

### API Katmanı / API Layer

| Özellik | Açıklama / Description |
|---------|------------------------|
| **HttpClient** | Type-safe fetch wrapper with interceptors |
| **Retry Handler** | Exponential backoff retry |
| **Circuit Breaker** | Fail-fast for failing services |
| **API Cache** | Response caching with TTL |
| **Offline Queue** | Store-and-forward pattern |

### Gelişmiş Özellikler / Advanced Features

| Özellik | Açıklama / Description |
|---------|------------------------|
| **Wizard** | Multi-step form state machine |
| **Repeater** | Dynamic form arrays with nested support |
| **Realtime** | WebSocket with auto-reconnect |
| **i18n** | Signal-based internationalization |
| **DevTools** | Performance timing, signal tracking |

---

## UI Bileşenleri / UI Components

### Form (19)

`SigInput` · `SigTextarea` · `SigSelect` · `SigAutocomplete` · `SigCheckbox` · `SigRadio` · `SigDatePicker` · `SigTimePicker` · `SigDateRangePicker` · `SigFileUpload` · `SigColorPicker` · `SigOtpInput` · `SigTagsInput` · `SigRichTextEditor` · `SigNumberStepper` · `SigRating` · `SigPasswordStrength` · `SigSearchInput` · `SigFormField`

### Data (4)

`SigTable` · `SigDataGrid` · `SigPagination` · `SigVirtualScroll`

### Feedback (4)

`SigModal` · `SigToast` · `SigLoading` · `SigSlider`

### Layout (5)

`SigTabs` · `SigAccordion` · `SigStepper` · `SigDrawer` · `SigCard`

### Overlay (4)

`SigTooltip` · `SigDropdownMenu` · `SigConfirmDialog` · `SigPopover`

### Display (9)

`SigBadge` · `SigAvatar` · `SigAlert` · `SigProgress` · `SigTimeline` · `SigCarousel` · `SigImageGallery` · `SigTree` · `SigCalendar`

### Utility (2)

`SigCopyButton` · `SigBreadcrumb`

---

## Türkiye Validatorları / Turkish Validators

```typescript
import { tcKimlikNo, phoneNumber, iban, vergiNo, plaka } from 'ng-signalify/validators';

// TC Kimlik No (11 hane, checksum kontrolü)
// Turkish ID Number (11 digits with checksum)
const tcField = new StringField('tc', 'TC Kimlik No', {
  required: true,
  customSchema: tcKimlikNo
});

// Telefon (+90 veya 0 ile başlayan)
// Phone (+90 or 0 prefix)
const phoneField = new StringField('phone', 'Telefon', {
  customSchema: phoneNumber
});

// IBAN (TR + 24 rakam)
// IBAN (TR + 24 digits)
const ibanField = new StringField('iban', 'IBAN', {
  customSchema: iban
});

// Vergi No (10 hane)
// Tax Number (10 digits)
const vergiField = new StringField('vergi', 'Vergi No', {
  customSchema: vergiNo
});

// Plaka (01-81 arası il kodu)
// License Plate (01-81 province codes)
const plakaField = new StringField('plaka', 'Plaka', {
  customSchema: plaka
});
```

---

## Cookbook

### Wizard (Çok Adımlı Form / Multi-Step Form)

```typescript
import { createWizard, WizardStep } from 'ng-signalify/advanced';
import { z } from 'zod';

const steps: WizardStep[] = [
  {
    id: 'account',
    title: 'Hesap Bilgileri',
    schema: z.object({
      email: z.string().email(),
      password: z.string().min(8)
    }),
    beforeLeave: async (data) => {
      // Email kontrolü / Check email availability
      const available = await checkEmail(data.email);
      return available;
    }
  },
  {
    id: 'profile',
    title: 'Profil',
    schema: z.object({
      fullName: z.string().min(2),
      phone: z.string()
    })
  },
  {
    id: 'confirm',
    title: 'Onay',
    optional: false
  }
];

const wizard = createWizard(steps);

// Navigation
wizard.next();          // Sonraki adım (validasyon ile)
wizard.prev();          // Önceki adım
wizard.goTo('confirm'); // Belirli adıma git

// State
wizard.currentStep();   // Aktif adım
wizard.isFirstStep();   // İlk adımda mı?
wizard.isLastStep();    // Son adımda mı?
wizard.data();          // Tüm adımların verileri
wizard.canProceed();    // İlerlenebilir mi?
```

### Repeater (Dinamik Form Dizisi / Dynamic Form Array)

```typescript
import { createRepeater } from 'ng-signalify/advanced';
import { z } from 'zod';

const ItemSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().min(1),
  price: z.number().min(0)
});

const repeater = createRepeater({
  schema: ItemSchema,
  defaultItem: () => ({ product: '', quantity: 1, price: 0 }),
  min: 1,
  max: 20
});

// Actions
repeater.add();                         // Yeni satır ekle
repeater.remove(itemId);                // Satır sil
repeater.update(itemId, { quantity: 5 }); // Güncelle
repeater.move(itemId, newIndex);        // Sıra değiştir

// State
repeater.items();      // Tüm satırlar
repeater.values();     // Sadece veriler
repeater.isValid();    // Tümü geçerli mi?
repeater.errors();     // Hatalar
```

### Field Dependencies (Alan Bağımlılıkları)

```typescript
import { createEnhancedForm, DependencyPatterns } from 'ng-signalify/schemas';

const form = createEnhancedForm(fields, initialValues, {
  fieldConfigs: {
    // Ülke değişince şehir sıfırlansın
    // Reset city when country changes
    city: {
      dependency: DependencyPatterns.resetOnChange('country')
    },

    // "Diğer" seçilince açıklama görünsün
    // Show description when "other" is selected
    otherDescription: {
      dependency: DependencyPatterns.showWhenEquals('reason', 'other')
    },

    // Toplam = Fiyat × Adet
    // Total = Price × Quantity
    total: {
      dependency: {
        dependsOn: ['price', 'quantity'],
        compute: (values) => (values.price ?? 0) * (values.quantity ?? 0)
      }
    },

    // Özel async seçenek yükleme
    // Custom async options loading
    city: {
      dependency: {
        dependsOn: ['country'],
        onDependencyChange: async (values, ctx) => {
          if (values.country) {
            const cities = await fetchCities(values.country);
            ctx.setOptions(cities);
          } else {
            ctx.reset();
          }
        }
      }
    }
  }
});
```

---

## Tema Özelleştirme / Theming

```scss
// styles.scss

// 1. Renkleri override et / Override colors
$sig-color-primary: #8b5cf6;       // Mor / Purple
$sig-color-primary-hover: #7c3aed;
$sig-color-success: #10b981;       // Yeşil / Green
$sig-color-error: #ef4444;         // Kırmızı / Red

// 2. Spacing ve radius
$sig-radius-md: 0.5rem;
$sig-spacing-4: 1.25rem;

// 3. ng-signalify'ı import et / Import ng-signalify
@import 'ng-signalify/styles/main';

// 4. Ek özelleştirmeler / Additional customizations
.sig-input__field {
  font-family: 'Inter', sans-serif;
}

// 5. Dark mode (manuel class ile / with manual class)
.dark {
  --sig-bg-surface: #1e1e2e;
  --sig-bg-background: #11111b;
  --sig-text-main: #cdd6f4;
  --sig-border-color: #45475a;
}
```

---

## API Reference

Detaylı API dokümantasyonu için [DOCUMENTATION.md](DOCUMENTATION.md) dosyasına bakın.

For detailed API documentation, see [DOCUMENTATION.md](DOCUMENTATION.md).

### Quick Links

- [Field Types](DOCUMENTATION.md#field-types)
- [Form Schema](DOCUMENTATION.md#form-schema)
- [Entity Store](DOCUMENTATION.md#entity-store)
- [Components](DOCUMENTATION.md#components)
- [Validators](DOCUMENTATION.md#validators)

---

## Test

```bash
# Tüm testleri çalıştır / Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage raporu / Coverage report
npm run test:coverage
```

---

## Roadmap

- [ ] Angular 19 `linkedSignal()` desteği
- [ ] Form Builder (Drag & Drop)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Server-Side Rendering (SSR)
- [ ] Storybook entegrasyonu
- [ ] VS Code extension
- [ ] Form Analytics
- [ ] AI-powered suggestions

---

## Katkıda Bulunma / Contributing

Katkılarınızı bekliyoruz! / Contributions are welcome!

1. Fork yapın / Fork the repo
2. Feature branch oluşturun / Create feature branch (`git checkout -b feature/amazing`)
3. Commit atın / Commit changes (`git commit -m 'Add amazing feature'`)
4. Push yapın / Push to branch (`git push origin feature/amazing`)
5. Pull Request açın / Open a Pull Request

---

## Lisans / License

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

## Yazar / Author

**Ahmet ALTUN**

[![GitHub](https://img.shields.io/badge/GitHub-biyonik-181717?style=for-the-badge&logo=github)](https://github.com/biyonik)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-biyonik-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/biyonik)
[![Email](https://img.shields.io/badge/Email-ahmet.altun60%40gmail.com-EA4335?style=for-the-badge&logo=gmail)](mailto:ahmet.altun60@gmail.com)

---

Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

If you find this project useful, don't forget to give it a star!

**ng-signalify** - Developed with ❤️ by Biyonik

</div>