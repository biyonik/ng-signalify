# ng-signalify

> Signal-first logic framework for Angular 17+ - Form management, state management, and API layer. UI-agnostic.

**Version:** 2.0.0-beta.1
**Angular:** 17+ | 18+ | 19+ | 20+ | 21+
**Requirements:** Zod, Angular Signals API

---

## 📑 İçindekiler

1. [Kurulum](#kurulum)
2. [Adapters (UI Integration)](#adapters-ui-integration)
3. [Fields (Alan Tipleri)](#fields-alan-tipleri)
4. [Schemas (Form & Filter)](#schemas-form--filter)
5. [Enhanced Form (Gelişmiş Form)](#enhanced-form-gelişmiş-form)
6. [Validators (Doğrulayıcılar)](#validators-doğrulayıcılar)
7. [Services (Import/Export)](#services-importexport)
8. [Entity Store (State Management)](#entity-store-state-management)
9. [UI Components](#ui-components)
10. [API Layer](#api-layer)
11. [Advanced Features](#advanced-features)
12. [Infrastructure](#infrastructure)
13. [Gelecek Özellikler](#gelecek-özellikler)

---

## Kurulum

```bash
# npm
npm install ng-signalify zod

# pnpm
pnpm add ng-signalify zod

# yarn
yarn add ng-signalify zod
```

### Temel Import

```typescript
// Tüm modülü import et
import * as SignalShared from 'ng-signalify';

// Veya spesifik import
import { StringField, IntegerField } from 'ng-signalify/fields';
import { FormSchema, createForm } from 'ng-signalify/schemas';
import { EntityStore } from 'ng-signalify/store';
```

---

## Adapters (UI Integration)

**ng-signalify v2.0** is a **UI-agnostic logic framework**. It separates business logic (forms, validation, state) from UI components using the **Adapter Pattern**.

### What are Adapters?

Adapters bridge ng-signalify's logic layer with UI libraries. They allow you to:
- ✅ Use **any UI library** (Material, PrimeNG, Spartan, custom)
- ✅ Switch UI libraries **without rewriting business logic**
- ✅ Test logic and UI **separately**
- ✅ Have **smaller bundle sizes** (only include what you use)

### Available Adapters

#### Material Adapter

For Angular Material projects:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new MaterialAdapter()),
    // ... other providers
  ]
};
```

**Installation:**
```bash
ng add @angular/material
```

**Usage Example:**
```typescript
import { Component } from '@angular/core';
import { StringField, IntegerField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Material Input -->
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()" />
        @if (form.fields.name.error() && form.fields.name.touched()) {
          <mat-error>{{ form.fields.name.error() }}</mat-error>
        }
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  private fields = [
    new StringField('name', 'Name', { required: true, min: 2 }),
    new IntegerField('age', 'Age', { required: true, min: 18 }),
  ];

  protected form = createEnhancedForm(this.fields, { name: '', age: 18 });

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
    }
  }
}
```

**Pros:**
- ✅ Enterprise-grade components
- ✅ WCAG 2.1 compliant
- ✅ Rich component library
- ✅ Active maintenance

**Cons:**
- ❌ Larger bundle size
- ❌ Material Design styling

---

#### Headless Adapter

For custom UI or other libraries (PrimeNG, Spartan, custom components):

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new HeadlessAdapter()),
    // ... other providers
  ]
};
```

**Usage Example:**
```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { SigFormField } from 'ng-signalify/components/core';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SigFormField],
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Use SigFormField wrapper with your own input -->
      <sig-form-field 
        label="Name" 
        [error]="form.fields.name.combinedError()"
        [touched]="form.fields.name.touched()"
        [required]="true">
        <input type="text"
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()" />
      </sig-form-field>

      <button type="submit">Submit</button>
    </form>
  `,
  styles: [`
    sig-form-field {
      display: block;
      margin-bottom: 16px;
    }
    
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    button {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class UserFormComponent {
  private fields = [
    new StringField('name', 'Name', { required: true, min: 2 }),
  ];

  protected form = createEnhancedForm(this.fields, { name: '' });

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
    }
  }
}
```

**Pros:**
- ✅ Complete design freedom
- ✅ Smaller bundle size
- ✅ Use any CSS framework (Tailwind, Bootstrap)
- ✅ No UI library lock-in

**Cons:**
- ❌ Build UI components yourself
- ❌ Handle accessibility yourself

---

### Creating Custom Adapters

Extend `BaseFormAdapter` to create your own adapter:

```typescript
import { BaseFormAdapter } from 'ng-signalify/adapters';
import { Type } from '@angular/core';

export class MyCustomAdapter extends BaseFormAdapter {
  readonly name = 'my-custom-ui';
  readonly version = '1.0.0';
  
  override getInputComponent(): Type<any> {
    return MyCustomInputComponent;
  }
  
  override getSelectComponent(): Type<any> {
    return MyCustomSelectComponent;
  }
  
  override getTextareaComponent(): Type<any> {
    return MyCustomTextareaComponent;
  }
  
  override getCheckboxComponent(): Type<any> {
    return MyCustomCheckboxComponent;
  }
  
  // Implement other required methods...
}
```

**Use in app:**
```typescript
// app.config.ts
import { provideSigUI } from 'ng-signalify/adapters';
import { MyCustomAdapter } from './my-custom-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new MyCustomAdapter()),
  ]
};
```

**Adapter Interface:**
```typescript
interface FormAdapter {
  name: string;
  version: string;
  
  getInputComponent(): Type<any>;
  getSelectComponent(): Type<any>;
  getTextareaComponent(): Type<any>;
  getCheckboxComponent(): Type<any>;
  getRadioComponent(): Type<any>;
  getDatePickerComponent(): Type<any>;
  getFileUploadComponent(): Type<any>;
  // ... other component getters
}
```

---

### Migration from v1.x Components

**v1.x (Deprecated):**
```typescript
import { SigInput, SigSelect, SigFormField } from 'ng-signalify/components';

// Template
<sig-form-field label="Name" [error]="form.fields.name.error()">
  <sig-input [(value)]="form.fields.name.value" />
</sig-form-field>
```

**v2.x with Material Adapter:**
```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

// Template
<mat-form-field>
  <mat-label>Name</mat-label>
  <input matInput 
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
  @if (form.fields.name.error() && form.fields.name.touched()) {
    <mat-error>{{ form.fields.name.error() }}</mat-error>
  }
</mat-form-field>
```

**v2.x with Headless Adapter:**
```typescript
import { SigFormField } from 'ng-signalify/components/core';

// Template
<sig-form-field label="Name" [error]="form.fields.name.combinedError()">
  <input 
    type="text"
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
</sig-form-field>
```

**Important:** The form logic (field definitions, validation, form creation) **remains identical** across all approaches!

---

### Complete Examples

See working examples:
- [Material Adapter Example](../examples/material-adapter-example.ts) - Full CRUD with Material UI
- [Headless Adapter Example](../examples/headless-adapter-example.ts) - Custom UI components
- [Examples README](../examples/README.md) - More details

---

## Fields (Alan Tipleri)

Fields, form alanlarının tip-güvenli tanımını sağlar. Her field tipi:
- Zod schema üretir (validation)
- Import/Export dönüşümü yapar
- Görüntüleme formatı sağlar
- Filter preview üretir

### 📂 Klasör Yapısı

```
lib/fields/
├── primitives/     # Temel tipler
├── date/           # Tarih/saat
├── selection/      # Seçim alanları
├── media/          # Dosya/resim
├── complex/        # Karmaşık tipler
└── special/        # Özel alanlar
```

---

### Primitive Fields

#### StringField

Metin alanları için kullanılır.

```typescript
import { StringField } from 'ng-signalify/fields';

// Basit kullanım
const nameField = new StringField('name', 'Ad Soyad');

// Tüm seçeneklerle
const emailField = new StringField('email', 'E-posta', {
  required: true,
  min: 5,
  max: 100,
  email: true,           // E-posta formatı
  // url: true,          // URL formatı
  // regex: /^[A-Z]/,    // Özel pattern
  placeholder: 'ornek@email.com',
  hint: 'İş e-postanızı giriniz',
});

// Schema üret (Zod)
const schema = emailField.schema();

// Import dönüşümü
emailField.fromImport('  test@email.com  '); // 'test@email.com' (trimmed)

// Export dönüşümü
emailField.toExport('test@email.com'); // 'test@email.com'

// Görüntüleme
emailField.present(null); // '-'
emailField.present('test@email.com'); // 'test@email.com'
```

#### IntegerField

Tam sayı alanları için kullanılır.

```typescript
import { IntegerField } from 'ng-signalify/fields';

const ageField = new IntegerField('age', 'Yaş', {
  required: true,
  min: 0,
  max: 120,
});

const stockField = new IntegerField('stock', 'Stok Miktarı', {
  min: 0,
});

// Import dönüşümü
ageField.fromImport('25');     // 25
ageField.fromImport('25.7');   // 25 (floor)
ageField.fromImport('abc');    // null

// Range filter preview
stockField.filterPreviewRange([10, null]);  // '≥ 10'
stockField.filterPreviewRange([null, 100]); // '≤ 100'
stockField.filterPreviewRange([10, 100]);   // '10 - 100'
```

#### DecimalField

Ondalıklı sayılar için kullanılır.

```typescript
import { DecimalField } from 'ng-signalify/fields';

const priceField = new DecimalField('price', 'Fiyat', {
  required: true,
  min: 0,
  precision: 2,  // Ondalık basamak
});

// Görüntüleme
priceField.present(1234.5);   // '1.234,50' (TR formatı)
priceField.present(1234.567); // '1.234,57' (yuvarlanır)

// Import
priceField.fromImport('1.234,50'); // 1234.50 (TR formatı destekler)
priceField.fromImport('1234.50');  // 1234.50 (EN formatı destekler)
```

#### BooleanField

Evet/Hayır alanları için kullanılır.

```typescript
import { BooleanField } from 'ng-signalify/fields';

const activeField = new BooleanField('isActive', 'Aktif mi?', {
  yesLabel: 'Aktif',
  noLabel: 'Pasif',
});

// Görüntüleme
activeField.present(true);   // 'Aktif'
activeField.present(false);  // 'Pasif'
activeField.present(null);   // '-'

// Import (esnek)
activeField.fromImport('evet');  // true
activeField.fromImport('true');  // true
activeField.fromImport('1');     // true
activeField.fromImport('hayır'); // false
activeField.fromImport('no');    // false
activeField.fromImport('0');     // false
```

#### TextAreaField

Çok satırlı metin alanları için kullanılır.

```typescript
import { TextAreaField } from 'ng-signalify/fields';

const descriptionField = new TextAreaField('description', 'Açıklama', {
  maxLength: 1000,
  rows: 5,
});
```

---

### Date Fields

#### DateField

Tarih seçimi için kullanılır.

```typescript
import { DateField } from 'ng-signalify/fields';

const birthDateField = new DateField('birthDate', 'Doğum Tarihi', {
  required: true,
  minDate: new Date('1900-01-01'),
  maxDate: new Date(),
});

// Görüntüleme
birthDateField.present('1990-05-15'); // '15.05.1990'

// Import (çoklu format desteği)
birthDateField.fromImport('15.05.1990');   // '1990-05-15'
birthDateField.fromImport('1990-05-15');   // '1990-05-15'
birthDateField.fromImport('15/05/1990');   // '1990-05-15'
```

#### DateTimeField

Tarih ve saat seçimi için kullanılır.

```typescript
import { DateTimeField } from 'ng-signalify/fields';

const appointmentField = new DateTimeField('appointmentAt', 'Randevu Zamanı', {
  required: true,
  minDate: new Date(),
});

// Görüntüleme
appointmentField.present('2024-05-15T14:30:00'); // '15.05.2024 14:30'
```

#### DateRangeField

Tarih aralığı seçimi için kullanılır.

```typescript
import { DateRangeField } from 'ng-signalify/fields';

const periodField = new DateRangeField('period', 'Dönem', {
  required: true,
});

// Değer tipi
type DateRange = { start: string; end: string };

// Görüntüleme
periodField.present({ start: '2024-01-01', end: '2024-12-31' }); 
// '01.01.2024 - 31.12.2024'

// Filter preview
periodField.filterPreview({ start: '2024-01-01', end: '2024-03-31' });
// '01.01.2024 - 31.03.2024'
```

#### TimeField

Saat seçimi için kullanılır.

```typescript
import { TimeField } from 'ng-signalify/fields';

const startTimeField = new TimeField('startTime', 'Başlangıç Saati', {
  required: true,
  minTime: '09:00',
  maxTime: '18:00',
});

// Görüntüleme
startTimeField.present('14:30'); // '14:30'
```

---

### Selection Fields

#### EnumField

Sabit seçeneklerden seçim için kullanılır.

```typescript
import { EnumField } from 'ng-signalify/fields';

const statusField = new EnumField(
  'status',
  'Durum',
  [
    { id: 'draft', label: 'Taslak' },
    { id: 'pending', label: 'Beklemede' },
    { id: 'approved', label: 'Onaylandı' },
    { id: 'rejected', label: 'Reddedildi' },
  ],
  { required: true }
);

// Görüntüleme (ID → Label)
statusField.present('approved'); // 'Onaylandı'

// Import (Label veya ID kabul eder)
statusField.fromImport('Onaylandı'); // 'approved'
statusField.fromImport('approved');  // 'approved'

// Seçenekleri al
statusField.getOptions(); // [{ id: 'draft', label: 'Taslak' }, ...]
```

#### MultiEnumField

Çoklu seçim için kullanılır.

```typescript
import { MultiEnumField } from 'ng-signalify/fields';

const tagsField = new MultiEnumField(
  'tags',
  'Etiketler',
  [
    { id: 'featured', label: 'Öne Çıkan' },
    { id: 'new', label: 'Yeni' },
    { id: 'sale', label: 'İndirimli' },
    { id: 'popular', label: 'Popüler' },
  ],
  { min: 1, max: 3 }  // En az 1, en fazla 3
);

// Görüntüleme
tagsField.present(['featured', 'new']); // 'Öne Çıkan, Yeni'

// Import (virgülle ayrılmış)
tagsField.fromImport('Öne Çıkan, Yeni'); // ['featured', 'new']
```

#### RelationField

İlişkili entity seçimi için kullanılır.

```typescript
import { RelationField, RelationRef } from 'ng-signalify/fields';

// API'den veri çeken fonksiyon
const fetchUsers = async (query: string, limit: number): Promise<RelationRef[]> => {
  const response = await api.get('/users/search', { params: { q: query, limit } });
  return response.data.map(u => ({ id: u.id, label: u.fullName }));
};

const managerField = new RelationField('managerId', 'Yönetici', fetchUsers, {
  required: true,
  viewUrl: '/users',  // Detay sayfası URL'i
});

// Görüntüleme
managerField.present({ id: 5, label: 'Ahmet Yılmaz' }); // 'Ahmet Yılmaz'

// Detay URL'i
managerField.getViewUrl({ id: 5, label: 'Ahmet Yılmaz' }); // '/users/5'
```

---

### Media Fields

#### FileField

Dosya yükleme için kullanılır.

```typescript
import { FileField } from 'ng-signalify/fields';

const documentField = new FileField('document', 'Belge', {
  required: true,
  maxSize: 10 * 1024 * 1024,  // 10 MB
  accept: ['.pdf', '.doc', '.docx'],
  multiple: false,
});

// Dosya boyutu formatı
documentField.formatSize(1536000); // '1.5 MB'

// Dosya tipi kontrolü
documentField.isValidType(file); // true/false
```

#### ImageField

Resim yükleme için kullanılır.

```typescript
import { ImageField } from 'ng-signalify/fields';

const avatarField = new ImageField('avatar', 'Profil Resmi', {
  maxSize: 5 * 1024 * 1024,
  accept: ['.jpg', '.jpeg', '.png', '.webp'],
  maxWidth: 1920,
  maxHeight: 1080,
  aspectRatio: 1,  // Kare resim
});

// Boyut kontrolü
await avatarField.validateDimensions(file); // { valid: true } veya { error: '...' }
```

---

### Complex Fields

#### JsonField

JSON veri yapıları için kullanılır.

```typescript
import { JsonField } from 'ng-signalify/fields';

const metadataField = new JsonField('metadata', 'Meta Veriler', {
  schema: z.object({
    version: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()),
  }),
});

// Görüntüleme
metadataField.present({ version: '1.0', tags: ['a', 'b'] }); 
// '{"version":"1.0","tags":["a","b"]}'

// Güzel görüntüleme
metadataField.presentPretty({ version: '1.0' });
// '{
//   "version": "1.0"
// }'
```

#### ArrayField

Dizi değerler için kullanılır.

```typescript
import { ArrayField } from 'ng-signalify/fields';

const phoneNumbersField = new ArrayField<string>('phones', 'Telefon Numaraları', {
  minItems: 1,
  maxItems: 5,
  itemSchema: z.string().regex(/^\+90/),
});

// Görüntüleme
phoneNumbersField.present(['+905551112233', '+905551112234']); 
// '+905551112233, +905551112234'
```

---

### Special Fields

#### PasswordField

Şifre alanları için kullanılır.

```typescript
import { PasswordField } from 'ng-signalify/fields';

const passwordField = new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
});

// Şifre gücü kontrolü
passwordField.getStrength('Abc123!@'); 
// { score: 4, label: 'Güçlü', color: 'green' }

// Export'ta maskeleme
passwordField.toExport('secret123'); // '********'
```

#### ColorField

Renk seçimi için kullanılır.

```typescript
import { ColorField } from 'ng-signalify/fields';

const themeColorField = new ColorField('primaryColor', 'Ana Renk', {
  format: 'hex',  // 'hex' | 'rgb' | 'hsl'
  presets: ['#FF0000', '#00FF00', '#0000FF'],
});

// Format dönüşümü
themeColorField.toRgb('#FF5733');    // 'rgb(255, 87, 51)'
themeColorField.toHsl('#FF5733');    // 'hsl(11, 100%, 60%)'
```

#### SliderField

Aralık değer seçimi için kullanılır.

```typescript
import { SliderField } from 'ng-signalify/fields';

const volumeField = new SliderField('volume', 'Ses Seviyesi', 0, 100, {
  step: 5,
  showValue: true,
  unit: '%',
});

// Görüntüleme
volumeField.present(75); // '75%'
```

---

## Schemas (Form & Filter)

### createEnhancedForm

Field dizisinden gelişmiş form state oluşturur.
Creates enhanced form state from field array.

```typescript
import { createEnhancedForm } from 'ng-signalify/schemas';
import { StringField, IntegerField, EnumField } from 'ng-signalify/fields';

// 1. Field'ları dizi olarak tanımla / Define fields as array
const userFields = [
  new StringField('name', 'Ad Soyad', { required: true, max: 100 }),
  new StringField('email', 'E-posta', { required: true, email: true }),
  new IntegerField('age', 'Yaş', { min: 18, max: 100 }),
  new EnumField('status', 'Durum', {
    required: true,
    options: [
      { id: 'active', label: 'Aktif' },
      { id: 'inactive', label: 'Pasif' },
    ]
  }),
];

// 2. Tip tanımı (opsiyonel ama önerilir) / Type definition (optional but recommended)
interface UserForm {
  name: string;
  email: string;
  age: number;
  status: string;
}

// 3. Form oluştur (başlangıç değerleri ile) / Create form (with initial values)
const form = createEnhancedForm<UserForm>(userFields, {
  name: '',
  email: '',
  age: 18,
  status: 'active'
});

// 4. Form kullanımı / Form usage
// Değer okuma / Reading values
form.fields.name.value();           // Signal<string>
form.fields.email.error();          // Signal<string | null>
form.fields.age.touched();          // Signal<boolean>
form.fields.name.combinedError();   // Signal<string> - sync + async errors
form.fields.email.asyncValidating(); // Signal<boolean>

// Değer yazma / Writing values
form.fields.name.value.set('Ahmet Yılmaz');
form.fields.email.touch();

// Toplu sinyaller / Aggregate signals
form.valid();                    // Signal<boolean> - Tüm form geçerli mi?
form.dirty();                    // Signal<boolean> - Değişiklik var mı?
form.errors();                   // Signal<Partial<Record<keyof T, string>>>
form.validating();               // Signal<boolean> - Async validasyon devam ediyor mu?

// Validasyon / Validation
const isValid = await form.validateAll();  // Tüm field'ları doğrula (async dahil)
form.touchAll();                           // Tüm field'ları touched yap

// Değerleri al / Get values
form.values();                   // Signal<T> - Tüm değerler
form.getValues();                // T - Anlık değerler (non-reactive)
form.getDirtyValues();           // Partial<T> - Sadece değişen değerler

// Reset
form.reset();                    // Başlangıç değerlerine dön
form.reset({ name: 'Test' });    // Belirli değerlerle reset
```

### FilterSchema

Filtreleme için schema oluşturur.

```typescript
import { FilterSchema, createFilter } from 'ng-signalify/schemas';

// Filter schema
const UserFilterSchema = FilterSchema(userFields);

// Filter oluştur
const filter = createFilter(UserFilterSchema);

// Filter kullanımı
filter.fields.status.value.set('active');
filter.fields.name.value.set('Ahmet');

// Aktif filtreleri al
filter.getActiveFilters(); 
// { status: 'active', name: 'Ahmet' }

// Filter preview (UI için)
filter.getFilterPreviews();
// [
//   { field: 'status', label: 'Durum', value: 'Aktif' },
//   { field: 'name', label: 'Ad Soyad', value: 'Ahmet' }
// ]

// Tek filter temizle
filter.clearField('status');

// Tüm filtreleri temizle
filter.clearAll();

// URL query params
filter.toQueryParams();  // '?status=active&name=Ahmet'
filter.fromQueryParams(params);
```

---

## Enhanced Form (Gelişmiş Form / Advanced Form)

### Async Validation

Asenkron doğrulama (API kontrolü vb.)
Asynchronous validation (API checks, etc.)

```typescript
import { createEnhancedForm, AsyncValidator } from 'ng-signalify/schemas';

// E-posta benzersizlik kontrolü / Email uniqueness check
const emailValidator = new AsyncValidator<string>(
  async (value: string, signal: AbortSignal) => {
    const response = await fetch(`/api/users/check-email?email=${value}`, { signal });
    const data = await response.json();
    return data.exists ? 'Bu e-posta zaten kullanımda' : '';
  },
  500  // debounceTime: 500ms bekle / wait 500ms
);

// Form'da kullanım / Usage in form
const form = createEnhancedForm<UserForm>(fields, initialValues, {
  fieldConfigs: {
    email: {
      asyncValidate: emailValidator,
    },
  },
});

// Async validation state
form.fields.email.asyncValidating();  // Signal<boolean> - Validasyon devam ediyor mu?
form.fields.email.asyncError();       // Signal<string> - Async hata mesajı
form.fields.email.fullyValid();       // Signal<boolean> - sync + async geçerli mi?
form.fields.email.combinedError();    // Signal<string> - sync veya async hata

// validateAll() artık async validasyonları da bekliyor!
// validateAll() now waits for async validations!
const isValid = await form.validateAll();  // Promise<boolean>
```

### Field Dependencies

Alanlar arası bağımlılıklar.

```typescript
import { createEnhancedForm, DependencyPatterns } from 'ng-signalify/schemas';

const form = createEnhancedForm(fields, {}, {
  fieldConfigs: {
    // Evli ise eş adı görünsün
    spouseName: {
      dependency: DependencyPatterns.showWhenEquals('maritalStatus', 'married'),
    },
    
    // Ülke değişince şehir sıfırlansın
    city: {
      dependency: DependencyPatterns.resetOnChange('country'),
    },
    
    // Toplam = fiyat × miktar (otomatik hesaplama)
    total: {
      readonly: true,
      dependency: {
        dependsOn: ['price', 'quantity'],
        compute: (values) => (values.price || 0) * (values.quantity || 0),
      },
    },
    
    // Özel koşul
    discount: {
      dependency: {
        dependsOn: ['total'],
        showWhen: (values) => values.total > 1000,
      },
    },
  },
});

// Field visibility
form.fields.spouseName.visible();   // Signal<boolean>
form.fields.discount.enabled();     // Signal<boolean>
```

### Cross-Field Validation

Çoklu alan validasyonu.

```typescript
const form = createEnhancedForm(fields, {}, {
  crossValidations: [
    // Şifre tekrarı
    {
      fields: ['password', 'passwordConfirm'],
      validate: (values) => 
        values.password === values.passwordConfirm 
          ? null 
          : 'Şifreler eşleşmiyor',
      message: 'Şifreler eşleşmiyor',
    },
    
    // Tarih sırası
    {
      fields: ['startDate', 'endDate'],
      validate: (values) => 
        new Date(values.startDate) < new Date(values.endDate)
          ? null
          : 'Başlangıç tarihi bitiş tarihinden önce olmalı',
    },
    
    // En az bir iletişim bilgisi
    {
      fields: ['email', 'phone'],
      validate: (values) =>
        values.email || values.phone
          ? null
          : 'E-posta veya telefon girilmeli',
    },
  ],
});

// Cross validation errors
form.signals.crossErrors();  // Signal<string[]>
```

### Undo/Redo (Form History)

Form değişikliklerini geri alma.

```typescript
import { createEnhancedForm } from 'ng-signalify/schemas';

const form = createEnhancedForm(fields, {}, {
  history: true,
  historyOptions: {
    maxSize: 50,        // Maksimum 50 adım
    debounceMs: 500,    // Hızlı değişiklikleri birleştir
  },
});

// History işlemleri
form.history?.undo();           // Geri al
form.history?.redo();           // İleri al
form.history?.canUndo();        // Signal<boolean>
form.history?.canRedo();        // Signal<boolean>

// Checkpoint (adlandırılmış durum)
form.history?.checkpoint('Müşteri bilgileri tamamlandı');
form.history?.restoreCheckpoint('Müşteri bilgileri tamamlandı');

// Tüm geçmişi temizle
form.history?.clear();
```

### Dirty Tracking

Değişen alanları tespit etme.

```typescript
const form = createEnhancedForm(fields, initialData);

// Değişen alanları al (PATCH request için ideal)
form.getDirtyValues();
// { name: 'Yeni Ad', email: 'yeni@email.com' }
// Sadece değişen field'lar döner

// Dirty state
form.signals.dirty();           // Signal<boolean>
form.fields.name.dirty();       // Signal<boolean>

// Tüm field'ları dirty yap
form.touchAll();
```

---

## Validators (Doğrulayıcılar)

### Türkçe Validators

```typescript
import { 
  tcKimlik, 
  vergiNo, 
  telefon, 
  iban, 
  plaka 
} from 'ng-signalify/validators';

// TC Kimlik No (11 haneli, algoritma kontrolü)
tcKimlik('12345678901');  // { valid: true } veya { error: 'Geçersiz TC Kimlik No' }

// Vergi No (10 haneli)
vergiNo('1234567890');

// Telefon (Türkiye formatları)
telefon('05551234567');
telefon('+905551234567');
telefon('0212 123 45 67');

// IBAN (TR formatı)
iban('TR330006100519786457841326');

// Araç Plakası
plaka('34ABC123');
plaka('06A1234');
```

### Zod ile Entegrasyon

```typescript
import { z } from 'zod';
import { tcKimlik, telefon } from 'ng-signalify/validators';

const customerSchema = z.object({
  tcNo: z.string().refine(
    (val) => tcKimlik(val).valid,
    { message: 'Geçersiz TC Kimlik No' }
  ),
  phone: z.string().refine(
    (val) => telefon(val).valid,
    { message: 'Geçersiz telefon numarası' }
  ),
});
```

---

## Services (Import/Export)

### ImporterService

Excel/CSV'den veri aktarımı.

```typescript
import { ImporterService } from 'ng-signalify/services';

const importer = new ImporterService(userFields);

// Dosya okuma
const file = event.target.files[0];
const result = await importer.parseFile(file);

// Sonuç yapısı
result.headers;      // ['Ad Soyad', 'E-posta', 'Yaş', ...]
result.rows;         // Ham veri satırları
result.totalRows;    // Toplam satır sayısı

// Mapping (header → field)
const mapping = importer.autoMap(result.headers);
// { 'Ad Soyad': 'name', 'E-posta': 'email', ... }

// Manuel mapping düzeltme
mapping['İsim'] = 'name';

// Import işlemi
const importResult = await importer.import(result.rows, mapping);

// Import sonucu
importResult.success;        // Başarılı kayıtlar
importResult.errors;         // Hatalı satırlar
importResult.successCount;   // Başarılı sayısı
importResult.errorCount;     // Hata sayısı

// Hata detayları
importResult.errors[0];
// { row: 5, field: 'email', value: 'invalid', error: 'Geçersiz e-posta' }
```

### ExporterService

Veriyi Excel/CSV olarak dışa aktarma.

```typescript
import { ExporterService } from 'ng-signalify/services';

const exporter = new ExporterService(userFields);

// Excel export
const blob = await exporter.toExcel(users, {
  filename: 'kullanicilar',
  sheetName: 'Kullanıcılar',
  includeHeaders: true,
});

// CSV export
const csvBlob = await exporter.toCsv(users, {
  filename: 'kullanicilar',
  delimiter: ';',  // Türkçe Excel için
});

// İndirme
exporter.download(blob, 'kullanicilar.xlsx');

// Belirli alanları export
const partialBlob = await exporter.toExcel(users, {
  fields: ['name', 'email', 'status'],  // Sadece bu alanlar
});
```

---

## Entity Store (State Management)

### EntityStore

CRUD işlemleri için signal-tabanlı state management.
Signal-based state management for CRUD operations.

```typescript
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

// HTTP Client oluştur / Create HTTP Client
const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
});

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,   // ID seçici / ID selector
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000,       // 5 dakika cache / 5 minutes cache
      optimistic: true,              // Optimistic updates aktif
    });
  }

  // Abstract metodları implement et / Implement abstract methods
  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<User>> {
    const response = await http.get<PaginatedResponse<User>>('/api/users', { params });
    return response.data;
  }

  protected async fetchOne(id: EntityId): Promise<User> {
    const response = await http.get<User>(`/api/users/${id}`);
    return response.data;
  }

  protected async createOne(data: CreateUserDto): Promise<User> {
    const response = await http.post<User>('/api/users', { body: data });
    return response.data;
  }

  protected async updateOne(id: EntityId, data: UpdateUserDto): Promise<User> {
    const response = await http.patch<User>(`/api/users/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/users/${id}`);
  }
}
```

### Store Kullanımı / Store Usage

```typescript
import { Component, inject } from '@angular/core';

@Component({
  template: `
    <!-- Modern Angular syntax (@if, @for) -->
    @if (store.signals.isLoading()) {
      <div class="loading">Yükleniyor... / Loading...</div>
    }

    @if (store.signals.error()) {
      <div class="error">{{ store.signals.error() }}</div>
    }

    <table>
      @for (user of store.signals.all(); track user.id) {
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <button (click)="edit(user)">Düzenle</button>
            <button (click)="deleteUser(user.id)">Sil</button>
          </td>
        </tr>
      }
    </table>

    <sig-pagination
      [page]="store.pagination.page()"
      [totalPages]="store.pagination.totalPages()"
      (pageChange)="store.goToPage($event)"
    />
  `
})
export class UserListComponent {
  readonly store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  async create() {
    await this.store.create({ name: 'Yeni Kullanıcı', email: 'test@test.com' });
  }

  async edit(user: User) {
    await this.store.update(user.id, { name: 'Güncel Ad' });
  }

  async deleteUser(id: number) {
    await this.store.delete(id);
  }
}
```

### Signals

```typescript
// Entity signals
store.signals.all();           // Signal<User[]> - Tüm kayıtlar
store.signals.selected();      // Signal<User[]> - Seçili kayıtlar
store.signals.isLoading();     // Signal<boolean>
store.signals.error();         // Signal<string | null>
store.signals.isEmpty();       // Signal<boolean>
store.signals.count();         // Signal<number>
store.signals.isStale();       // Signal<boolean> - Cache expired?

// Pagination signals
store.pagination.page();       // Signal<number>
store.pagination.pageSize();   // Signal<number>
store.pagination.total();      // Signal<number>
store.pagination.totalPages(); // Signal<number>
store.pagination.hasNext();    // Signal<boolean>
store.pagination.hasPrev();    // Signal<boolean>
```

### Selection

```typescript
// Tekli seçim
store.select(userId);
store.toggleSelect(userId);

// Çoklu seçim
store.selectMany([id1, id2, id3]);
store.selectAll();
store.clearSelection();

// Seçili kayıtları al
const selected = store.signals.selected();

// Toplu silme
await store.deleteMany(store.signals.selected().map(u => u.id));
```

### Filtering & Sorting

```typescript
// Filter set
store.setFilters({ status: 'active', role: 'admin' });

// Filter güncelle
store.updateFilter('status', 'inactive');

// Filter temizle
store.clearFilters();

// Sıralama
store.setSort('name', 'asc');
store.setSort('createdAt', 'desc');
store.toggleSort('name');  // asc → desc → none
```

### Optimistic Updates

```typescript
// Optimistic delete
const { rollback } = store.optimisticDelete(userId);

try {
  await api.delete(`/users/${userId}`);
  // Başarılı - UI zaten güncellendi
} catch (error) {
  rollback();  // Hata - değişikliği geri al
  showError('Silme başarısız');
}

// Optimistic update
const { rollback } = store.optimisticUpdate(userId, { status: 'inactive' });

try {
  await api.patch(`/users/${userId}`, { status: 'inactive' });
} catch (error) {
  rollback();
}
```

### Cache

```typescript
// Cache kontrolü
store.signals.isStale();       // Cache süresi dolmuş mu?
store.refreshIfStale();        // Dolmuşsa yenile

// Manuel yenileme
await store.loadAll({ force: true });  // Cache'i yoksay
```

---

## UI Components

### Form Components

#### FormField

Form alanı wrapper'ı.

```html
<sig-form-field
  label="E-posta"
  [error]="form.fields.email.error()"
  [touched]="form.fields.email.touched()"
  [required]="true"
  [loading]="form.fields.email.asyncValidating()"
  hint="İş e-postanızı giriniz"
  [charCount]="form.fields.email.value().length"
  [maxLength]="100"
>
  <sig-input
    type="email"
    [(value)]="form.fields.email.value"
    placeholder="ornek@sirket.com"
  />
</sig-form-field>
```

#### Input

Text input bileşeni.

```html
<!-- Basit kullanım -->
<sig-input [(value)]="name" placeholder="Adınız" />

<!-- Tüm özellikler -->
<sig-input
  type="email"
  [(value)]="email"
  placeholder="E-posta"
  [disabled]="false"
  [readonly]="false"
  [clearable]="true"
  icon="mail"
  iconPosition="left"
  [maxLength]="100"
  (focus)="onFocus()"
  (blur)="onBlur()"
/>

<!-- Password with toggle -->
<sig-input
  type="password"
  [(value)]="password"
  [showPasswordToggle]="true"
/>

<!-- Number -->
<sig-input
  type="number"
  [(value)]="age"
  [min]="0"
  [max]="120"
  [step]="1"
/>
```

#### Select

Dropdown seçim bileşeni.

```html
<sig-select
  [options]="countries"
  [(value)]="selectedCountry"
  placeholder="Ülke seçiniz"
  [searchable]="true"
  [clearable]="true"
  [disabled]="false"
/>

<!-- Options format -->
countries = [
  { id: 'tr', label: 'Türkiye' },
  { id: 'us', label: 'Amerika' },
  { id: 'de', label: 'Almanya', disabled: true },
];
```

#### Checkbox & Switch

```html
<!-- Checkbox -->
<sig-checkbox
  [(checked)]="rememberMe"
  label="Beni hatırla"
  [disabled]="false"
  [indeterminate]="false"
/>

<!-- Switch -->
<sig-switch
  [(checked)]="isActive"
  label="Aktif"
  size="medium"
/>
```

#### Textarea

```html
<sig-textarea
  [(value)]="description"
  placeholder="Açıklama giriniz..."
  [rows]="5"
  [maxLength]="1000"
  [autoResize]="true"
  [showCounter]="true"
  resize="vertical"
/>
```

---

### Data Components

#### Table

Veri tablosu bileşeni.

```html
<sig-table
  [data]="users"
  [columns]="columns"
  [loading]="isLoading"
  [selectable]="true"
  selectionMode="multi"
  [sortable]="true"
  [striped]="true"
  [bordered]="false"
  (sortChange)="onSort($event)"
  (selectionChange)="onSelectionChange($event)"
  (rowClicked)="onRowClick($event)"
>
  <!-- Custom column template -->
  <ng-template sigColumn="status" let-row>
    <span [class]="'badge badge-' + row.status">
      {{ row.status | titlecase }}
    </span>
  </ng-template>
  
  <!-- Actions column -->
  <ng-template sigColumn="actions" let-row>
    <button (click)="edit(row)">Düzenle</button>
    <button (click)="delete(row)">Sil</button>
  </ng-template>
</sig-table>
```

```typescript
columns = [
  { key: 'name', label: 'Ad Soyad', sortable: true },
  { key: 'email', label: 'E-posta', sortable: true },
  { key: 'status', label: 'Durum', sortable: true, width: '120px' },
  { key: 'createdAt', label: 'Kayıt Tarihi', sortable: true, format: 'date' },
  { key: 'actions', label: 'İşlemler', sortable: false, width: '150px' },
];
```

#### Pagination

Sayfalama bileşeni.

```html
<sig-pagination
  [page]="currentPage"
  [pageSize]="pageSize"
  [total]="totalItems"
  [pageSizeOptions]="[10, 20, 50, 100]"
  [maxButtons]="5"
  [showInfo]="true"
  [showPageSize]="true"
  [showFirstLast]="true"
  (pageChange)="onPageChange($event)"
  (pageSizeChanged)="onPageSizeChange($event)"
/>

<!-- Compact mode -->
<sig-pagination
  [page]="page"
  [total]="total"
  [compact]="true"
/>
```

---

### Feedback Components

#### Modal

Modal dialog bileşeni.

```html
<sig-modal
  [open]="isModalOpen"
  title="Kullanıcı Ekle"
  size="md"
  [closable]="true"
  [closeOnBackdrop]="true"
  [closeOnEsc]="true"
  (closed)="onModalClose()"
  (confirmed)="onConfirm()"
  (cancelled)="onCancel()"
>
  <!-- Modal content -->
  <p>Modal içeriği buraya gelir.</p>
  
  <!-- Footer buttons (optional, default buttons kullanılabilir) -->
  <ng-template #footer>
    <button (click)="cancel()">İptal</button>
    <button (click)="save()">Kaydet</button>
  </ng-template>
</sig-modal>
```

```typescript
// ModalService kullanımı
import { ModalService } from 'ng-signalify/components';

@Component({...})
export class MyComponent {
  modal = inject(ModalService);

  openModal() {
    this.modal.open('myModal');
  }

  async confirmDelete() {
    const confirmed = await this.modal.confirm({
      title: 'Silme Onayı',
      message: 'Bu kaydı silmek istediğinize emin misiniz?',
      confirmText: 'Sil',
      cancelText: 'İptal',
    });

    if (confirmed) {
      // Silme işlemi
    }
  }

  showAlert() {
    this.modal.alert({
      title: 'Bilgi',
      message: 'İşlem başarıyla tamamlandı.',
    });
  }
}
```

#### Toast

Bildirim mesajları.

```typescript
import { ToastService } from 'ng-signalify/components';

@Component({...})
export class MyComponent {
  toast = inject(ToastService);

  showSuccess() {
    this.toast.success('Kayıt başarıyla oluşturuldu');
  }

  showError() {
    this.toast.error('Bir hata oluştu', { duration: 5000 });
  }

  showWarning() {
    this.toast.warning('Dikkat! Bu işlem geri alınamaz.');
  }

  showInfo() {
    this.toast.info('Yeni güncelleme mevcut');
  }

  showWithAction() {
    this.toast.show({
      type: 'info',
      title: 'Yeni Mesaj',
      message: '3 yeni mesajınız var',
      duration: 0,  // Manuel kapatma
      action: {
        label: 'Görüntüle',
        onClick: () => this.router.navigate(['/messages']),
      },
    });
  }

  dismissAll() {
    this.toast.dismissAll();
  }
}
```

```html
<!-- App component'e ekle -->
<sig-toast-container position="top-right" />

<!-- Position seçenekleri -->
<!-- top-left, top-center, top-right -->
<!-- bottom-left, bottom-center, bottom-right -->
```

#### Loading

Yükleme göstergeleri.

```html
<!-- Spinner -->
<sig-spinner size="md" color="primary" />

<!-- Sizes: xs, sm, md, lg, xl -->
<!-- Colors: primary, white, gray -->

<!-- Loading overlay -->
<sig-loading
  [show]="isLoading"
  text="Yükleniyor..."
  [fullscreen]="false"
  [transparent]="false"
/>

<!-- Fullscreen loading -->
<sig-loading [show]="isLoading" [fullscreen]="true" />

<!-- Skeleton -->
<sig-skeleton width="200px" height="20px" />
<sig-skeleton variant="circle" width="50px" height="50px" />
<sig-skeleton variant="text" [lines]="3" />

<!-- Empty state -->
<sig-empty-state
  icon="📭"
  title="Veri Bulunamadı"
  description="Henüz kayıt eklenmemiş."
>
  <button (click)="addNew()">İlk Kaydı Ekle</button>
</sig-empty-state>
```

---

## API Layer

### HttpClient

Type-safe HTTP istemcisi. Native fetch API üzerine kurulu modern wrapper.
Type-safe HTTP client. Modern wrapper built on native fetch API.

```typescript
import { createHttpClient, HttpClient } from 'ng-signalify/api';

// API istemcisi oluştur / Create API client
const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  serverBaseUrl: 'http://internal-api:3000',  // SSR için / For SSR
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
  },

  // Request interceptor
  onRequest: async (config, context) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }
    console.log(`[${context.method}] ${context.path}`);
    return config;
  },

  // Response interceptor
  onResponse: async (response) => {
    console.log('Response:', response.status);
    return response;
  },

  // Error handler
  onError: (error) => {
    if (error.status === 401) {
      // Logout & redirect
      console.log('Unauthorized - redirecting to login');
    }
  },
});

// GET - ApiResponse<T> döner / Returns ApiResponse<T>
const usersResponse = await api.get<User[]>('/users');
const users = usersResponse.data;  // User[]

const userResponse = await api.get<User>('/users/1');
const user = userResponse.data;    // User

// POST - body parametresi RequestConfig içinde
const newUserResponse = await api.post<User>('/users', {
  body: { name: 'Ahmet', email: 'a@b.com' }
});
const newUser = newUserResponse.data;

// PUT
const updatedResponse = await api.put<User>('/users/1', {
  body: { name: 'Mehmet' }
});

// PATCH
const patchedResponse = await api.patch<User>('/users/1', {
  body: { status: 'active' }
});

// DELETE
await api.delete('/users/1');

// Query params
const filteredResponse = await api.get<User[]>('/users', {
  params: { status: 'active', page: 1, limit: 20 },
});

// AbortController ile iptal / Cancel with AbortController
const controller = new AbortController();
const response = await api.get<User[]>('/users', {
  signal: controller.signal
});
// controller.abort() ile iptal edilebilir / Can be cancelled with controller.abort()

// Auth helpers
api.setAuthToken('jwt-token');
api.setAuthToken('basic-token', 'Basic');
api.clearAuthToken();
api.setBaseUrl('https://new-api.example.com');
```

### ApiCache

Response caching.

```typescript
import { ApiCache, createCacheKey } from 'ng-signalify/api';

const cache = new ApiCache({
  defaultTTL: 5 * 60 * 1000,  // 5 dakika
  maxEntries: 100,
  persistent: true,           // localStorage'a kaydet
  storagePrefix: 'api_cache_',
});

// Manuel kullanım
const cacheKey = createCacheKey('/users', { status: 'active' });

// Cache'den oku
const cached = cache.get<User[]>(cacheKey);
if (cached) {
  return cached;
}

// API'den al ve cache'le
const users = await api.get<User[]>('/users', { params: { status: 'active' } });
cache.set(cacheKey, users, 10 * 60 * 1000);  // 10 dakika TTL

// Cache kontrolü
cache.has(cacheKey);           // boolean
cache.delete(cacheKey);        // Tek entry sil
cache.clear();                 // Tümünü sil
cache.clearExpired();          // Süresi dolmuşları sil

// Pattern ile invalidate
cache.invalidatePrefix('/users');           // /users/* sil
cache.invalidatePattern(/\/posts\/\d+/);    // /posts/123 gibi URL'leri sil

// İstatistikler
const stats = cache.getStats();
// { hits: 50, misses: 10, entries: 25 }
```

### Retry Handler

Otomatik yeniden deneme.

```typescript
import { retryWithBackoff, createRetryHandler, CircuitBreaker } from 'ng-signalify/api';

// Basit retry
const data = await retryWithBackoff(
  () => api.get('/flaky-endpoint'),
  {
    maxRetries: 3,
    initialDelay: 1000,      // 1 saniye
    maxDelay: 30000,         // Maksimum 30 saniye
    backoffMultiplier: 2,    // Her denemede 2x artır
    jitter: true,            // Rastgele gecikme ekle
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt} in ${delay}ms`);
    },
  }
);

// Reactive retry state
const retry = createRetryHandler(() => api.get('/data'), {
  maxRetries: 3,
  initialDelay: 1000,
});

// Signals
retry.attempt();       // Signal<number>
retry.isRetrying();    // Signal<boolean>
retry.lastError();     // Signal<unknown>
retry.nextRetryAt();   // Signal<Date | null>

// Execute
try {
  const result = await retry.execute();
} catch (error) {
  // Tüm denemeler başarısız
}

// Cancel
retry.cancel();

// Circuit Breaker Pattern
const breaker = new CircuitBreaker({
  failureThreshold: 5,    // 5 hatadan sonra aç
  successThreshold: 2,    // 2 başarıdan sonra kapat
  resetTimeout: 30000,    // 30 saniye sonra dene
  onStateChange: (state) => {
    console.log('Circuit state:', state);  // closed, open, half-open
  },
});

// Circuit breaker ile istek
try {
  const result = await breaker.execute(() => api.get('/service'));
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    // Servis geçici olarak kapalı, fallback kullan
    return fallbackData;
  }
  throw error;
}

// State kontrolü
breaker.getState();  // Signal<'closed' | 'open' | 'half-open'>
breaker.open();      // Manuel aç
breaker.close();     // Manuel kapat
breaker.reset();     // Sıfırla
```

### Offline Queue

Offline destek.

```typescript
import { OfflineQueue, useOnlineStatus } from 'ng-signalify/api';

const queue = new OfflineQueue(
  // Request executor
  async (request) => {
    return fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
  },
  {
    storageKey: 'offline_queue',
    maxRetries: 3,
    autoProcess: true,  // Online olunca otomatik işle
    
    onSuccess: (request, response) => {
      toast.success('Senkronize edildi');
    },
    
    onFailure: (request, error) => {
      toast.error('Senkronizasyon başarısız');
    },
    
    onStatusChange: (status) => {
      console.log('Queue status:', status);  // idle, processing, paused, offline
    },
  }
);

// Request ekle
queue.enqueue({
  method: 'POST',
  url: '/api/orders',
  body: { product: 'ABC', quantity: 1 },
  headers: { 'Content-Type': 'application/json' },
  priority: 1,  // Yüksek öncelik
});

// Signals
queue.getStatus();          // Signal<QueueStatus>
queue.getQueue();           // Signal<QueuedRequest[]>
queue.getPendingCount();    // Signal<number>
queue.getOnlineStatus();    // Signal<boolean>
queue.isEmpty();            // Signal<boolean>

// Kontrol
queue.process();            // Manuel işle
queue.pause();              // Duraklat
queue.resume();             // Devam et
queue.clear();              // Kuyruğu temizle

// Online status hook
const isOnline = useOnlineStatus();
// Signal<boolean> - Bağlantı durumu
```

---

## Advanced Features

### Wizard (Multi-Step Form)

Çok adımlı form.

```typescript
import { createWizard, WizardStep } from 'ng-signalify/advanced';
import { z } from 'zod';

// Step tanımları
const steps: WizardStep[] = [
  {
    id: 'customer',
    title: 'Müşteri Bilgileri',
    description: 'Temel bilgilerinizi girin',
    icon: '👤',
    schema: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
    }),
  },
  {
    id: 'address',
    title: 'Adres Bilgileri',
    schema: z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    }),
    // Önceki adım tamamlanmadan girilemesin
    beforeEnter: (allData) => !!allData.customer?.name,
  },
  {
    id: 'payment',
    title: 'Ödeme',
    optional: true,  // Atlanabilir
    schema: z.object({
      cardNumber: z.string(),
      expiryDate: z.string(),
      cvv: z.string(),
    }),
  },
  {
    id: 'review',
    title: 'Onay',
    // Custom validation
    validate: async (data, allData) => {
      if (!allData.customer?.email) {
        return 'E-posta gerekli';
      }
      return null;
    },
  },
];

// Wizard oluştur
const wizard = createWizard(steps, {}, {
  validateOnLeave: true,
  linear: true,
  allowBack: true,
  onStepChange: (from, to) => {
    console.log(`Step ${from} → ${to}`);
  },
  onComplete: (data) => {
    console.log('Completed:', data);
    submitOrder(data);
  },
});

// Signals
wizard.currentStep();      // Signal<WizardStep | null>
wizard.currentIndex();     // Signal<number>
wizard.currentState();     // Signal<StepState | null>
wizard.progress();         // Signal<number> (0-100)
wizard.isFirst();          // Signal<boolean>
wizard.isLast();           // Signal<boolean>
wizard.canNext();          // Signal<boolean>
wizard.canPrev();          // Signal<boolean>
wizard.isComplete();       // Signal<boolean>
wizard.isValidating();     // Signal<boolean>
wizard.data();             // Signal<Partial<T>> - Tüm veri

// Actions
await wizard.next();                        // Sonraki adım
await wizard.prev();                        // Önceki adım
await wizard.goTo('payment');               // Adıma git
await wizard.goTo(2);                       // Index ile git
await wizard.skip();                        // Atla (optional step)
wizard.setStepData('customer', { name: 'Ahmet' });
wizard.getStepData('customer');
await wizard.validateCurrent();             // Mevcut adımı doğrula
await wizard.validateAll();                 // Tümünü doğrula
wizard.reset();                             // Sıfırla
const result = await wizard.complete();     // Tamamla
```

```html
<!-- Template örneği -->
<div class="wizard">
  <!-- Progress bar -->
  <div class="progress" [style.width.%]="wizard.progress()"></div>
  
  <!-- Steps indicator -->
  <div class="steps">
    @for (step of wizard.steps(); track step.id) {
      <div 
        class="step"
        [class.active]="step.status === 'active'"
        [class.completed]="step.status === 'completed'"
        [class.error]="step.status === 'error'"
      >
        {{ step.title }}
      </div>
    }
  </div>
  
  <!-- Current step content -->
  @switch (wizard.currentStep()?.id) {
    @case ('customer') {
      <customer-form (dataChange)="wizard.setStepData('customer', $event)" />
    }
    @case ('address') {
      <address-form (dataChange)="wizard.setStepData('address', $event)" />
    }
  }
  
  <!-- Navigation -->
  <div class="navigation">
    <button 
      (click)="wizard.prev()" 
      [disabled]="!wizard.canPrev()"
    >
      Geri
    </button>
    
    @if (wizard.currentStep()?.optional) {
      <button (click)="wizard.skip()">Atla</button>
    }
    
    @if (wizard.isLast()) {
      <button (click)="wizard.complete()">Tamamla</button>
    } @else {
      <button 
        (click)="wizard.next()" 
        [disabled]="!wizard.canNext()"
      >
        İleri
      </button>
    }
  </div>
</div>
```

### Repeater (Dynamic Form)

Dinamik form tekrarlayıcı.

```typescript
import { createRepeater, createDragState } from 'ng-signalify/advanced';
import { z } from 'zod';

// Item schema
const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100),
});

// Repeater oluştur
const items = createRepeater<InvoiceItem>(
  [{ description: 'Ürün 1', quantity: 1, unitPrice: 100, taxRate: 18 }],
  {
    min: 1,          // En az 1 satır
    max: 50,         // En fazla 50 satır
    sortable: true,  // Sıralama aktif
    collapsible: true,
    confirmDelete: true,
    
    // Varsayılan yeni satır
    defaultItem: () => ({
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
    }),
    
    // Validation schema
    schema: invoiceItemSchema,
    
    // Satır başlığı
    itemLabel: (item, index) => `Kalem ${index + 1}: ${item.description || 'Yeni'}`,
  }
);

// Signals
items.items();       // Signal<RepeaterItem<T>[]>
items.values();      // Signal<T[]> - Sadece data
items.count();       // Signal<number>
items.isEmpty();     // Signal<boolean>
items.canAdd();      // Signal<boolean>
items.canRemove();   // Signal<boolean>
items.isValid();     // Signal<boolean>
items.hasErrors();   // Signal<boolean>

// Actions
const newId = items.add();                              // Yeni satır ekle
const newId = items.add({ description: 'Test' });       // Değerle ekle
const newId = items.add({ description: 'Test' }, 0);    // İndexe ekle
items.remove(id);                                       // Satır sil
items.update(id, { quantity: 5 });                      // Güncelle
items.move(0, 2);                                       // Taşı
items.duplicate(id);                                    // Kopyala
items.clear();                                          // Temizle
items.reset();                                          // Başlangıca dön

// Validation
items.validateItem(id);                                 // Tek satır doğrula
items.validateAll();                                    // Tümünü doğrula
items.touchItem(id);                                    // Touched yap
items.touchAll();

// Collapse
items.toggleCollapse(id);
items.collapseAll();
items.expandAll();

// Query
items.getItem(id);                                      // Item al
items.getIndex(id);                                     // Index al

// Drag & Drop
const drag = createDragState();
```

```html
<!-- Template örneği -->
<div class="repeater">
  @for (item of items.items(); track item.id) {
    <div 
      class="repeater-item"
      [class.collapsed]="item.collapsed"
      [class.error]="item.errors | hasErrors"
      draggable="true"
      (dragstart)="drag.startDrag(item.id)"
      (dragenter)="drag.enterDrag(item.id)"
      (dragend)="drag.endDrag()"
      (drop)="drag.drop(items)"
    >
      <!-- Header -->
      <div class="item-header">
        <span class="drag-handle">☰</span>
        <span class="item-label">{{ itemLabel(item.data, items.getIndex(item.id)) }}</span>
        
        <button (click)="items.toggleCollapse(item.id)">
          {{ item.collapsed ? '▼' : '▲' }}
        </button>
        <button (click)="items.duplicate(item.id)" [disabled]="!items.canAdd()">📋</button>
        <button (click)="items.remove(item.id)" [disabled]="!items.canRemove()">🗑️</button>
      </div>
      
      <!-- Content -->
      @if (!item.collapsed) {
        <div class="item-content">
          <input
            [(ngModel)]="item.data.description"
            (ngModelChange)="items.update(item.id, { description: $event })"
            placeholder="Açıklama"
          />
          <input
            type="number"
            [(ngModel)]="item.data.quantity"
            (ngModelChange)="items.update(item.id, { quantity: $event })"
          />
          <input
            type="number"
            [(ngModel)]="item.data.unitPrice"
            (ngModelChange)="items.update(item.id, { unitPrice: $event })"
          />
          
          @if (item.errors['description']) {
            <span class="error">{{ item.errors['description'] }}</span>
          }
        </div>
      }
    </div>
  }
  
  <!-- Add button -->
  <button (click)="items.add()" [disabled]="!items.canAdd()">
    + Satır Ekle
  </button>
  
  <!-- Summary -->
  <div class="summary">
    Toplam: {{ items.count() }} kalem
  </div>
</div>
```

### Real-time (WebSocket)

WebSocket bağlantı yönetimi. Memory leak koruması ve otomatik reconnect desteği.
WebSocket connection management. Memory leak protection and auto-reconnect support.

```typescript
import { createRealtimeConnection } from 'ng-signalify/advanced';

// Bağlantı oluştur / Create connection
const ws = createRealtimeConnection({
  url: 'wss://api.example.com/ws',
  reconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  reconnectDelayMultiplier: 1.5,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  heartbeatMessage: 'ping',
  connectionTimeout: 10000,
  maxQueueSize: 1000,  // Memory leak koruması - kuyruk limiti / Memory leak protection - queue limit

  onOpen: () => console.log('Bağlandı / Connected'),
  onClose: (event) => console.log('Kapandı / Closed:', event.code),
  onError: (error) => console.error('Hata / Error:', error),
});

// Bağlan
ws.connect();

// Signals
ws.state();          // Signal<ConnectionState>
ws.isConnected();    // Signal<boolean>
ws.lastMessage();    // Signal<unknown>
ws.error();          // Signal<string | null>

// Mesaj gönder
ws.send({ type: 'chat', text: 'Merhaba' });
ws.emit('chat:message', { text: 'Merhaba', roomId: 123 });

// Mesaj dinle
const unsubscribe = ws.on<ChatMessage>('chat:message', (msg) => {
  console.log('Yeni mesaj:', msg);
});

// Tek seferlik dinle
ws.once('user:joined', (user) => {
  console.log('Kullanıcı katıldı:', user);
});

// Dinlemeyi kaldır
ws.off('chat:message');        // Tüm handler'lar
ws.off('chat:message', handler);  // Belirli handler
ws.offAll();                   // Tümü

// Kapat
ws.disconnect();
```

#### Presence (Online Kullanıcılar)

```typescript
// Presence oluştur
const presence = createPresence(ws, 'room:123', currentUserId);

// Odaya katıl
presence.join({
  id: currentUserId,
  name: 'Ahmet Yılmaz',
  avatar: '/avatars/ahmet.jpg',
  status: 'online',
});

// Signals
presence.users();        // Signal<PresenceUser[]>
presence.count();        // Signal<number>
presence.currentUser();  // Signal<PresenceUser | null>

// Durum güncelle
presence.updateStatus('away');
presence.updateStatus('busy');
presence.updateMeta({ typing: true });

// Odadan ayrıl
presence.leave();
```

#### Channel (Pub/Sub)

```typescript
// Kanal oluştur
const chat = createChannel<ChatMessage>(ws, 'chat:general', {
  maxHistory: 100,
});

// Mesaj gönder
chat.publish({ 
  text: 'Merhaba!', 
  userId: currentUserId,
  timestamp: Date.now(),
});

// Mesaj dinle
chat.subscribe((msg) => {
  console.log('Yeni mesaj:', msg);
});

// Signals
chat.messages();      // Signal<ChatMessage[]>
chat.lastMessage();   // Signal<ChatMessage | null>

// Geçmiş
chat.history(20);     // Son 20 mesaj
chat.clear();         // Geçmişi temizle
```

---

## Infrastructure

### i18n (Internationalization)

Çoklu dil desteği.

```typescript
import { 
  createI18n, 
  trValidationMessages, 
  enValidationMessages,
  t, tp 
} from 'ng-signalify/infrastructure';

// i18n oluştur
const i18n = createI18n({
  defaultLocale: 'tr',
  fallbackLocale: 'en',
  translations: {
    tr: {
      ...trValidationMessages,
      greeting: 'Merhaba {{name}}!',
      items: {
        zero: 'Hiç öğe yok',
        one: '{{count}} öğe',
        other: '{{count}} öğe',
      },
    },
    en: {
      ...enValidationMessages,
      greeting: 'Hello {{name}}!',
      items: {
        zero: 'No items',
        one: '{{count}} item',
        other: '{{count}} items',
      },
    },
  },
  persistLocale: true,
  storageKey: 'app_locale',
  onMissingKey: (key, locale) => `[${key}]`,
});

// Signals
i18n.locale();              // Signal<string>
i18n.availableLocales();    // Signal<string[]>
i18n.isLoaded();            // Signal<boolean>

// Dil değiştir
i18n.setLocale('en');

// Çeviri
i18n.t('greeting', { name: 'Ahmet' });  // 'Merhaba Ahmet!'
i18n.t('validation.required');           // 'Bu alan zorunludur'

// Çoğul
i18n.tp('items', 0);   // 'Hiç öğe yok'
i18n.tp('items', 1);   // '1 öğe'
i18n.tp('items', 5);   // '5 öğe'

// Key var mı?
i18n.hasKey('greeting');  // true

// Formatlama
i18n.formatNumber(1234.56);              // '1.234,56'
i18n.formatCurrency(99.90);              // '₺99,90'
i18n.formatCurrency(99.90, 'USD');       // '$99.90'
i18n.formatDate(new Date());             // '3 Aralık 2025'
i18n.formatDate(new Date(), { 
  dateStyle: 'full' 
});                                       // 'Çarşamba, 3 Aralık 2025'
i18n.formatRelativeTime(yesterday);      // 'dün'
i18n.formatRelativeTime(lastWeek);       // '1 hafta önce'

// Lazy loading
await i18n.loadTranslations('de', async () => {
  const module = await import('./translations/de.json');
  return module.default;
});

// Global shorthand
t('greeting', { name: 'Test' });
tp('items', 5);
```

### Testing Utilities

Test yardımcıları.

```typescript
import {
  spyOnSignal,
  createMockSignal,
  waitForSignal,
  waitForValue,
  waitFor,
  createMockHttpClient,
  createMockEntityStore,
  createFormTestHelper,
  flushPromises,
  useFakeTimers,
  testData,
} from 'ng-signalify/infrastructure';

// Signal spy
describe('CounterComponent', () => {
  it('should increment', () => {
    const counter = signal(0);
    const spy = spyOnSignal(counter);
    
    counter.set(1);
    counter.set(2);
    
    expect(spy.values).toEqual([0, 1, 2]);
    expect(spy.callCount).toBe(3);
    expect(spy.lastValue).toBe(2);
    expect(spy.wasCalledWith(1)).toBe(true);
    
    spy.destroy();
  });
});

// Mock signal
it('should track changes', () => {
  const mock = createMockSignal('initial');
  mock.set('updated');
  
  expect(mock.values).toEqual(['initial', 'updated']);
});

// Wait helpers
it('should load data', async () => {
  const loading = signal(true);
  
  setTimeout(() => loading.set(false), 100);
  
  await waitForSignal(loading, (v) => v === false);
  expect(loading()).toBe(false);
  
  // veya
  await waitForValue(loading, false);
});

// Mock HTTP
it('should fetch users', async () => {
  const http = createMockHttpClient();
  http.mockResponse('get', [{ id: 1, name: 'Test' }]);
  
  const service = new UserService(http);
  const users = await service.getUsers();
  
  expect(http.get).toHaveBeenCalledWith('/users');
  expect(users).toHaveLength(1);
});

// Mock store
it('should manage entities', () => {
  const store = createMockEntityStore<User>([]);
  
  store.addEntity({ id: 1, name: 'Test' });
  store.setLoading(true);
  
  expect(store.entities()).toHaveLength(1);
  expect(store.loading()).toBe(true);
});

// Form test helper
it('should validate form', async () => {
  const form = createForm(UserSchema);
  const helper = createFormTestHelper(form);
  
  helper.setValues({ name: '', email: 'invalid' });
  await helper.submit();
  
  expect(helper.isValid()).toBe(false);
  expect(helper.getErrors().name).toBeTruthy();
  expect(helper.getErrors().email).toBeTruthy();
});

// Fake timers
it('should debounce', () => {
  const timers = useFakeTimers();
  const fn = jest.fn();
  
  debounce(fn, 100)();
  
  expect(fn).not.toHaveBeenCalled();
  
  timers.advanceTimersByTime(100);
  
  expect(fn).toHaveBeenCalled();
  
  timers.restore();
});

// Test data generators
it('should create test data', () => {
  const user = testData.user({ role: 'admin' });
  const users = testData.array(() => testData.user(), 10);
  const email = testData.email();
  const date = testData.date();
});
```

### DevTools

Debugging araçları.

```typescript
import { 
  getDevTools, 
  Debug, 
  Measure, 
  assert, 
  devWarn 
} from 'ng-signalify/infrastructure';

// DevTools başlat
const devTools = getDevTools({
  enabled: true,
  logLevel: 'debug',
  maxEntries: 1000,
  consoleOutput: true,
  trackPerformance: true,
  trackSignals: true,
});

// Logging
devTools.debug('Auth', 'Login attempt', { email });
devTools.info('API', 'Request completed', { duration: 150 });
devTools.warn('Cache', 'Cache miss for key', { key });
devTools.error('Payment', 'Transaction failed', { error, orderId });

// Scoped logger
const log = devTools.createLogger('UserService');
log.debug('Fetching users...');
log.info('Users loaded', { count: 10 });
log.error('Failed to load users', error);

// Performance tracking
devTools.startTimer('fetchUsers', 'api');
const users = await api.get('/users');
const duration = devTools.endTimer('fetchUsers', 'api');
// Konsol: "[api] fetchUsers: 150ms"
// 100ms üzeri otomatik warning

// Async measure
const data = await devTools.measure('loadDashboard', async () => {
  const users = await api.get('/users');
  const orders = await api.get('/orders');
  return { users, orders };
}, 'page');

// Signal tracking
const unsub = devTools.trackSignal(userCount, 'userCount', 'DashboardComponent');
// Her değişiklik loglanır

// Decorators
class UserService {
  @Debug('UserService')
  async getUser(id: number) {
    // Otomatik: başlangıç, bitiş, sonuç/hata loglanır
  }
  
  @Measure('UserService')
  calculateStats() {
    // Otomatik performans ölçümü
  }
}

// Assertions
assert(user !== null, 'User must be loaded');
// Hata varsa: Error + devTools.error()

// Dev-only warnings
devWarn('This API is deprecated', { replacement: 'newApi()' });
// Production'da çalışmaz

// State dump
const state = devTools.dumpState();
// { logs, performance, signals, stats }

// Export
const logsJson = devTools.exportLogs();

// Browser console'dan erişim
window.__SIGNAL_DEVTOOLS__.getLogs();
window.__SIGNAL_DEVTOOLS__.getPerformanceEntries();
window.__SIGNAL_DEVTOOLS__.getSlowOperations(100);
```

### Schematics (Code Generation)

Kod üretici.

```typescript
import { 
  EntityBuilder, 
  generateEntity,
  generateInterface,
  generateFormSchema,
  generateEntityStore,
  generateListComponent,
  generateFormComponent,
} from 'ng-signalify/infrastructure';

// Entity tanımla
const product = new EntityBuilder('Product', 'Products')
  .string('name', 'Ürün Adı', { required: true, maxLength: 100 })
  .string('sku', 'Stok Kodu', { required: true })
  .text('description', 'Açıklama', { maxLength: 2000 })
  .decimal('price', 'Fiyat', { required: true, min: 0 })
  .integer('stock', 'Stok', { min: 0 })
  .enum('status', 'Durum', [
    { value: 'draft', label: 'Taslak' },
    { value: 'active', label: 'Aktif' },
    { value: 'archived', label: 'Arşivlenmiş' },
  ], { required: true })
  .enum('category', 'Kategori', [
    { value: 'electronics', label: 'Elektronik' },
    { value: 'clothing', label: 'Giyim' },
    { value: 'home', label: 'Ev & Yaşam' },
  ])
  .relation('brandId', 'Marka', 'Brand', { required: true })
  .boolean('featured', 'Öne Çıkan')
  .image('image', 'Ürün Resmi')
  .timestamps()
  .softDelete()
  .build();

// Tüm dosyaları üret
const files = generateEntity(product);
// {
//   'product.interface.ts': '...',
//   'product.schema.ts': '...',
//   'product.store.ts': '...',
//   'product-list.component.ts': '...',
//   'product-form.component.ts': '...',
// }

// Tek tek üret
const interfaceCode = generateInterface(product);
const schemaCode = generateFormSchema(product);
const storeCode = generateEntityStore(product);
const listCode = generateListComponent(product);
const formCode = generateFormComponent(product);

// Dosyalara yaz (Node.js ortamında)
Object.entries(files).forEach(([filename, content]) => {
  fs.writeFileSync(`./src/app/products/${filename}`, content);
});
```

Üretilen interface örneği:

```typescript
// product.interface.ts
export interface Product {
  id: string | number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stock?: number;
  status: string;
  category?: string;
  brandId: string | number;
  featured?: boolean;
  image?: File | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
```

---

## Gelecek Özellikler

### 🔜 Kısa Vadeli (v1.1)

#### Form Enhancements
- [ ] **AutoSave** - Otomatik kaydetme (debounced)
- [ ] **FormArray** - Angular FormArray benzeri dinamik alan yönetimi
- [ ] **ConditionalFields** - Koşullu alan grupları
- [ ] **FormState Persistence** - Form durumunu localStorage'a kaydet
- [ ] **Form Templates** - Hazır form şablonları (login, register, contact)

#### Field Types
- [ ] **AddressField** - Adres bileşeni (ülke, şehir, ilçe cascade)
- [ ] **PhoneField** - Telefon input (ülke kodu + format)
- [ ] **CurrencyField** - Para birimi seçimi + değer
- [ ] **RatingField** - Yıldız puanlama
- [ ] **SignatureField** - İmza alanı (canvas)
- [ ] **RichTextField** - WYSIWYG editör
- [ ] **CodeField** - Kod editörü (syntax highlighting)
- [ ] **LocationField** - Harita üzerinden konum seçimi

#### UI Components
- [ ] **DataGrid** - Gelişmiş tablo (virtual scroll, column resize, export)
- [ ] **TreeView** - Ağaç yapısı görünümü
- [ ] **Tabs** - Tab bileşeni
- [ ] **Accordion** - Accordion bileşeni
- [ ] **Stepper** - Adım göstergesi (wizard entegrasyonu)
- [ ] **DatePicker** - Takvim bileşeni
- [ ] **TimePicker** - Saat seçici
- [ ] **ColorPicker** - Renk seçici
- [ ] **FileUploader** - Dosya yükleme (drag & drop, preview)
- [ ] **ImageCropper** - Resim kırpma

### 📅 Orta Vadeli (v1.2)

#### Store Enhancements
- [ ] **RelationalStore** - İlişkisel entity'ler arası bağlantı
- [ ] **UndoableStore** - Store seviyesinde undo/redo
- [ ] **SyncedStore** - Multi-tab senkronizasyonu (BroadcastChannel)
- [ ] **PersistedStore** - IndexedDB persistence
- [ ] **ComputedStore** - Derived/computed state
- [ ] **ActionHistory** - Tüm aksiyonların kaydı (time-travel debugging)

#### API Enhancements
- [ ] **GraphQL Client** - GraphQL desteği
- [ ] **REST Resource** - RESTful kaynak yönetimi
- [ ] **Batch Requests** - Toplu istek birleştirme
- [ ] **Request Deduplication** - Aynı istekleri birleştir
- [ ] **Prefetching** - Önceden veri yükleme
- [ ] **Polling** - Periyodik veri yenileme

#### Real-time Enhancements
- [ ] **SSE Support** - Server-Sent Events desteği
- [ ] **Room Management** - Oda yönetimi
- [ ] **Message Queue** - Mesaj kuyruğu
- [ ] **Typing Indicators** - Yazıyor göstergesi
- [ ] **Read Receipts** - Okundu bilgisi

### 🚀 Uzun Vadeli (v2.0)

#### Framework Features
- [ ] **CLI Tool** - `ng-signalify generate entity Product`
- [ ] **VS Code Extension** - Snippet'ler ve autocomplete
- [ ] **DevTools Browser Extension** - Chrome/Firefox extension
- [ ] **Storybook Integration** - Component documentation
- [ ] **Nx Plugin** - Monorepo desteği

#### Advanced Features
- [ ] **Form Builder UI** - Sürükle-bırak form oluşturucu
- [ ] **Report Builder** - Rapor oluşturucu
- [ ] **Dashboard Builder** - Dashboard oluşturucu
- [ ] **Role-Based Fields** - Rol bazlı alan görünürlüğü
- [ ] **Audit Trail** - Değişiklik takibi
- [ ] **Data Masking** - Hassas veri maskeleme

#### Performance
- [ ] **Virtual Scrolling** - Büyük listeler için
- [ ] **Lazy Field Loading** - İhtiyaç duyulduğunda field yükle
- [ ] **Memoized Computations** - Hesaplama önbellekleme
- [ ] **Web Workers** - Ağır işlemleri worker'a taşı

#### Testing
- [ ] **Visual Regression Testing** - Görsel test
- [ ] **Accessibility Testing** - a11y testleri
- [ ] **Performance Benchmarks** - Performans testleri
- [ ] **E2E Test Helpers** - Cypress/Playwright yardımcıları

#### Documentation
- [ ] **Interactive Docs** - Canlı örneklerle dokümantasyon
- [ ] **Migration Guide** - Versiyon geçiş rehberi
- [ ] **Best Practices** - En iyi pratikler
- [ ] **Video Tutorials** - Video eğitimler

---

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Convention

```
feat: yeni özellik
fix: hata düzeltme
docs: dokümantasyon
style: formatlama
refactor: kod yeniden düzenleme
test: test ekleme
chore: bakım işleri
```

---

## Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## İletişim

- **Geliştirici**: Ahmet ALTUN
- **Proje**: Signal-Based Shared Module
- **Versiyon**: 1.0.0
- **Angular**: 17+