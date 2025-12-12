<div align="center">

# ng-signalify

### Modern, Type-Safe, Signal-Based State Management for Angular 19+

[![npm version](https://badge.fury.io/js/ng-signalify.svg)](https://www.npmjs.com/package/ng-signalify)
[![Build Status](https://github.com/biyonik/ng-signalify/workflows/CI/badge.svg)](https://github.com/biyonik/ng-signalify/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/ng-signalify.svg)](https://www.npmjs.com/package/ng-signalify)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-19+-red.svg)](https://angular.dev/)

<br />

**🇬🇧 [English](#english) | 🇹🇷 [Türkçe](#türkçe)**

<br />

[Installation](#-installation) · [Quick Start](#-quick-start) · [Documentation](DOCUMENTATION.md) · [Examples](examples/) · [Migration Guide](MIGRATION.md)

</div>

---

<a id="english"></a>

# 🇬🇧 English</div>

## 🎯 What is ng-signalify?

**ng-signalify** is a **modern, type-safe, signal-based state management framework** for Angular 19+ applications. Unlike traditional all-in-one libraries, ng-signalify is **UI-agnostic**, giving you complete freedom to choose your preferred UI library.

### Key Features

| Feature | Description |
|---------|-------------|
| 🎯 **Signal-Based Forms** | Type-safe, reactive form management with Zod validation and async validators |
| 🏪 **Entity Store** | Complete CRUD state management with caching, pagination, and optimistic updates |
| 🌐 **HTTP Client** | Type-safe API layer with retry logic, circuit breaker, and offline queue |
| 📝 **24+ Field Types** | Rich field types from primitives to complex structures with import/export |
| 🔄 **Real-time Support** | WebSocket management with auto-reconnect and presence tracking |
| 🎨 **UI Agnostic** | Use with Material, PrimeNG, Spartan, or build your own components |
| ✅ **Turkish Validators** | Built-in validators for TC Kimlik, IBAN, phone numbers, and more |
| 🧪 **Testing Utilities** | Comprehensive testing helpers for forms, stores, and signals |
| 🌍 **i18n Support** | Signal-based internationalization with lazy loading |
| 📦 **Tree-Shakeable** | Small bundle size - only include what you use |

### Why Choose ng-signalify?

Traditional libraries bundle logic and UI together, locking you into their design system. ng-signalify separates these concerns:

> **"Powerful logic layer + Your choice of UI = Maximum flexibility"**

**Benefits:**
- 🎨 **Complete Design Freedom** - Use Material, PrimeNG, Spartan, or custom components
- 📦 **Smaller Bundles** - Tree-shake unused features, no forced UI dependencies
- 🔄 **Easy Migration** - Switch UI libraries without rewriting business logic
- 🧪 **Better Testing** - Test logic and UI independently
- 🚀 **Future-Proof** - Adapt to new UI trends without major refactoring

---

## 📦 Installation

```bash
npm install ng-signalify zod
# or
pnpm add ng-signalify zod
# or
yarn add ng-signalify zod
```

**Optional:** Install Angular Material or your preferred UI library

```bash
ng add @angular/material
```

---

## 🚀 Quick Start

### 1. Define Your Fields

```typescript
import { StringField, DecimalField, MultiEnumField, BooleanField } from 'ng-signalify/fields';

const productFields = [
  new StringField('name', 'Product Name', {
    required: true,
    min: 3,
    max: 100
  }),
  
  new StringField('sku', 'SKU', {
    required: true,
    min: 3,
    max: 50
  }),
  
  new DecimalField('price', 'Price', {
    required: true,
    min: 0,
    precision: 2
  }),
  
  new MultiEnumField('categories', 'Categories', [
    { id: 'electronics', label: 'Electronics' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'books', label: 'Books' }
  ], { required: true }),
  
  new BooleanField('isActive', 'Active')
];
```

### 2. Create Enhanced Form

```typescript
import { Component } from '@angular/core';
import { createEnhancedForm } from 'ng-signalify/schemas';

interface ProductForm {
  name: string;
  sku: string;
  price: number;
  categories: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Use with any UI library - Angular Material example -->
      <mat-form-field appearance="outline">
        <mat-label>Product Name</mat-label>
        <input matInput
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()" />
        @if (form.fields.name.error() && form.fields.name.touched()) {
          <mat-error>{{ form.fields.name.error() }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Price</mat-label>
        <input matInput type="number"
          [value]="form.fields.price.value()"
          (input)="form.fields.price.value.set(+$any($event.target).value)" />
        @if (form.fields.price.error() && form.fields.price.touched()) {
          <mat-error>{{ form.fields.price.error() }}</mat-error>
        }
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
        [disabled]="!form.valid()">
        Submit
      </button>
    </form>
  `
})
export class ProductFormComponent {
  protected form = createEnhancedForm<ProductForm>(productFields, {
    name: '',
    sku: '',
    price: 0,
    categories: [],
    isActive: true
  });

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
      // API call here
    }
  }
}
```

### 3. Implement Entity Store

```typescript
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  categories: string[];
  isActive: boolean;
}

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000
});

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      selectId: (product) => product.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      optimistic: true
    });
  }

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
    const response = await http.patch<Product>(`/api/products/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/products/${id}`);
  }
}
```

### 4. Use in Components with List & Pagination

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ProductStore } from './product.store';

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: `
    @if (store.signals.isLoading()) {
      <mat-spinner />
    }

    @if (store.signals.error()) {
      <mat-error>{{ store.signals.error() }}</mat-error>
    }

    <table mat-table [dataSource]="store.signals.all()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let product">{{ product.name }}</td>
      </ng-container>

      <ng-container matColumnDef="sku">
        <th mat-header-cell *matHeaderCellDef>SKU</th>
        <td mat-cell *matCellDef="let product">{{ product.sku }}</td>
      </ng-container>

      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Price</th>
        <td mat-cell *matCellDef="let product">\${{ product.price }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let product">
          <button mat-icon-button (click)="edit(product)">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button (click)="delete(product.id)">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator
      [length]="store.pagination.total()"
      [pageSize]="store.pagination.pageSize()"
      [pageIndex]="store.pagination.page() - 1"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)"
    />
  `
})
export class ProductListComponent implements OnInit {
  protected store = inject(ProductStore);
  protected displayedColumns = ['name', 'sku', 'price', 'actions'];

  ngOnInit() {
    this.store.loadAll();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.store.goToPage(event.pageIndex + 1);
  }

  async edit(product: Product) {
    // Open edit dialog
  }

  async delete(id: number) {
    if (confirm('Are you sure?')) {
      await this.store.delete(id);
    }
  }
}
```

---

## 📊 Comparison with Other Solutions

| Feature | ng-signalify | NgRx | Akita | Angular Forms |
|---------|--------------|------|-------|---------------|
| **Signals Support** | ✅ Native | ⚠️ Via Signal Store | ❌ RxJS only | ⚠️ Partial |
| **Type Safety** | ✅ Full with Zod | ✅ Full | ✅ Full | ⚠️ Limited |
| **Boilerplate** | 🟢 Minimal | 🔴 High | 🟡 Medium | 🟢 Low |
| **Learning Curve** | 🟢 Easy | 🔴 Steep | 🟡 Medium | 🟢 Easy |
| **Form Validation** | ✅ Built-in Zod | ❌ Manual | ❌ Manual | ✅ Built-in |
| **Entity CRUD** | ✅ Out-of-box | ⚠️ Via Entity | ✅ Built-in | ❌ No |
| **Pagination** | ✅ Integrated | ❌ Manual | ⚠️ Plugin | ❌ No |
| **State Persistence** | ✅ Built-in | ⚠️ Via Meta-Reducers | ✅ Built-in | ❌ No |
| **Bundle Size** | 🟢 Small | 🔴 Large | 🟡 Medium | 🟢 Small |
| **Async Validation** | ✅ Debounced | ❌ Manual | ❌ Manual | ✅ Manual |
| **Optimistic Updates** | ✅ Built-in | ❌ Manual | ✅ Built-in | ❌ No |
| **UI Agnostic** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Tied to Angular |
| **DevTools** | ✅ Built-in | ✅ Extension | ✅ Extension | ⚠️ Limited |
| **Real-time Support** | ✅ WebSocket | ❌ No | ❌ No | ❌ No |

**Legend:** ✅ Excellent | ⚠️ Partial | ❌ Not Available | 🟢 Good | 🟡 Average | 🔴 Poor

---

## 📚 Documentation

- **[Complete Documentation](DOCUMENTATION.md)** - Full API reference and guides
- **[Field Types Guide](docs/fields.md)** - Comprehensive field types documentation ([Türkçe](docs/tr/fields.md))
- **[Migration Guide](MIGRATION.md)** - Upgrade from v1.x to v2.x
- **[Examples](examples/)** - Working code examples
- **[Demo App](https://github.com/biyonik/ng-signalify/tree/main/apps/demo-material)** - Full-featured demo application

---

## 🎨 Demo Applications

Explore our fully functional demo applications:

- **[Material Demo](apps/demo-material)** - Complete app using Angular Material
  - Product management with CRUD operations
  - User management with pagination
  - Field examples showcase
  - Dashboard with real-time updates

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
test: Adding or updating tests
chore: Maintenance tasks
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/biyonik/ng-signalify.git
cd ng-signalify

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Run demo app
cd apps/demo-material
npm start
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ahmet ALTUN**

- GitHub: [@biyonik](https://github.com/biyonik)
- LinkedIn: [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)
- Email: ahmet.altun60@gmail.com

---

<div align="center">

**If you find ng-signalify useful, please give it a ⭐!**

Made with ❤️ for the Angular community

</div>

---
---

<a id="türkçe"></a>

# 🇹🇷 Türkçe

## 🎯 ng-signalify Nedir?

**ng-signalify**, Angular 19+ uygulamaları için **modern, tip-güvenli, signal-tabanlı bir state management framework**'tür. Geleneksel hepsi-bir-arada kütüphanelerden farklı olarak, ng-signalify **UI-agnostik**'tir ve tercih ettiğiniz UI kütüphanesini kullanma özgürlüğü sunar.

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🎯 **Signal-Tabanlı Formlar** | Zod validasyonu ve async validator'lar ile tip-güvenli, reaktif form yönetimi |
| 🏪 **Entity Store** | Önbellekleme, sayfalama ve iyimser güncellemelerle eksiksiz CRUD state yönetimi |
| 🌐 **HTTP İstemcisi** | Yeniden deneme, circuit breaker ve offline kuyruk ile tip-güvenli API katmanı |
| 📝 **24+ Alan Tipi** | Temel tiplerden karmaşık yapılara import/export destekli zengin alan tipleri |
| 🔄 **Gerçek Zamanlı Destek** | Otomatik yeniden bağlanma ve presence tracking ile WebSocket yönetimi |
| 🎨 **UI Bağımsız** | Material, PrimeNG, Spartan veya kendi bileşenlerinizle kullanın |
| ✅ **Türkçe Validator'lar** | TC Kimlik, IBAN, telefon numarası ve daha fazlası için yerleşik validator'lar |
| 🧪 **Test Araçları** | Formlar, store'lar ve signal'ler için kapsamlı test yardımcıları |
| 🌍 **i18n Desteği** | Lazy loading ile signal-tabanlı uluslararasılaştırma |
| 📦 **Tree-Shakeable** | Küçük paket boyutu - sadece kullandığınızı dahil edin |

### Neden ng-signalify'ı Seçmelisiniz?

Geleneksel kütüphaneler mantık ve UI'ı birlikte paketleyerek sizi tasarım sistemlerine kilitler. ng-signalify bu endişeleri ayırır:

> **"Güçlü mantık katmanı + UI tercihiniz = Maksimum esneklik"**

**Faydalar:**
- 🎨 **Tam Tasarım Özgürlüğü** - Material, PrimeNG, Spartan veya özel bileşenler kullanın
- 📦 **Daha Küçük Paketler** - Kullanılmayan özellikleri tree-shake edin, zorla UI bağımlılıkları yok
- 🔄 **Kolay Geçiş** - İş mantığını yeniden yazmadan UI kütüphanelerini değiştirin
- 🧪 **Daha İyi Test** - Mantık ve UI'ı bağımsız test edin
- 🚀 **Geleceğe Hazır** - Büyük yeniden yapılandırma olmadan yeni UI trendlerine uyum sağlayın

---

## 📦 Kurulum

```bash
npm install ng-signalify zod
# veya
pnpm add ng-signalify zod
# veya
yarn add ng-signalify zod
```

**İsteğe Bağlı:** Angular Material veya tercih ettiğiniz UI kütüphanesini yükleyin

```bash
ng add @angular/material
```

---

## 🚀 Hızlı Başlangıç

### 1. Alanlarınızı Tanımlayın

```typescript
import { StringField, DecimalField, MultiEnumField, BooleanField } from 'ng-signalify/fields';

const productFields = [
  new StringField('name', 'Ürün Adı', {
    required: true,
    min: 3,
    max: 100
  }),
  
  new StringField('sku', 'Stok Kodu', {
    required: true,
    min: 3,
    max: 50
  }),
  
  new DecimalField('price', 'Fiyat', {
    required: true,
    min: 0,
    precision: 2
  }),
  
  new MultiEnumField('categories', 'Kategoriler', [
    { id: 'electronics', label: 'Elektronik' },
    { id: 'clothing', label: 'Giyim' },
    { id: 'books', label: 'Kitap' }
  ], { required: true }),
  
  new BooleanField('isActive', 'Aktif')
];
```

### 2. Gelişmiş Form Oluşturun

```typescript
import { Component } from '@angular/core';
import { createEnhancedForm } from 'ng-signalify/schemas';

interface ProductForm {
  name: string;
  sku: string;
  price: number;
  categories: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Herhangi bir UI kütüphanesi ile kullanın - Angular Material örneği -->
      <mat-form-field appearance="outline">
        <mat-label>Ürün Adı</mat-label>
        <input matInput
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()" />
        @if (form.fields.name.error() && form.fields.name.touched()) {
          <mat-error>{{ form.fields.name.error() }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Fiyat</mat-label>
        <input matInput type="number"
          [value]="form.fields.price.value()"
          (input)="form.fields.price.value.set(+$any($event.target).value)" />
        @if (form.fields.price.error() && form.fields.price.touched()) {
          <mat-error>{{ form.fields.price.error() }}</mat-error>
        }
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
        [disabled]="!form.valid()">
        Gönder
      </button>
    </form>
  `
})
export class ProductFormComponent {
  protected form = createEnhancedForm<ProductForm>(productFields, {
    name: '',
    sku: '',
    price: 0,
    categories: [],
    isActive: true
  });

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Verisi:', this.form.getValues());
      // API çağrısı burada
    }
  }
}
```

### 3. Entity Store Uygulayın

```typescript
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  categories: string[];
  isActive: boolean;
}

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000
});

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      selectId: (product) => product.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000, // 5 dakika
      optimistic: true
    });
  }

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
    const response = await http.patch<Product>(`/api/products/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/products/${id}`);
  }
}
```

### 4. Bileşenlerde Liste ve Sayfalama ile Kullanın

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ProductStore } from './product.store';

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: `
    @if (store.signals.isLoading()) {
      <mat-spinner />
    }

    @if (store.signals.error()) {
      <mat-error>{{ store.signals.error() }}</mat-error>
    }

    <table mat-table [dataSource]="store.signals.all()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Ürün Adı</th>
        <td mat-cell *matCellDef="let product">{{ product.name }}</td>
      </ng-container>

      <ng-container matColumnDef="sku">
        <th mat-header-cell *matHeaderCellDef>Stok Kodu</th>
        <td mat-cell *matCellDef="let product">{{ product.sku }}</td>
      </ng-container>

      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Fiyat</th>
        <td mat-cell *matCellDef="let product">{{ product.price }} ₺</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>İşlemler</th>
        <td mat-cell *matCellDef="let product">
          <button mat-icon-button (click)="edit(product)">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button (click)="delete(product.id)">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator
      [length]="store.pagination.total()"
      [pageSize]="store.pagination.pageSize()"
      [pageIndex]="store.pagination.page() - 1"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)"
    />
  `
})
export class ProductListComponent implements OnInit {
  protected store = inject(ProductStore);
  protected displayedColumns = ['name', 'sku', 'price', 'actions'];

  ngOnInit() {
    this.store.loadAll();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.store.goToPage(event.pageIndex + 1);
  }

  async edit(product: Product) {
    // Düzenleme diyalogu aç
  }

  async delete(id: number) {
    if (confirm('Emin misiniz?')) {
      await this.store.delete(id);
    }
  }
}
```

---

## 📊 Diğer Çözümlerle Karşılaştırma

| Özellik | ng-signalify | NgRx | Akita | Angular Forms |
|---------|--------------|------|-------|---------------|
| **Signals Desteği** | ✅ Native | ⚠️ Signal Store ile | ❌ Sadece RxJS | ⚠️ Kısmi |
| **Tip Güvenliği** | ✅ Zod ile Tam | ✅ Tam | ✅ Tam | ⚠️ Sınırlı |
| **Boilerplate** | 🟢 Minimal | 🔴 Yüksek | 🟡 Orta | 🟢 Düşük |
| **Öğrenme Eğrisi** | 🟢 Kolay | 🔴 Dik | 🟡 Orta | 🟢 Kolay |
| **Form Validasyonu** | ✅ Yerleşik Zod | ❌ Manuel | ❌ Manuel | ✅ Yerleşik |
| **Entity CRUD** | ✅ Hazır | ⚠️ Entity ile | ✅ Yerleşik | ❌ Yok |
| **Sayfalama** | ✅ Entegre | ❌ Manuel | ⚠️ Eklenti | ❌ Yok |
| **State Kalıcılığı** | ✅ Yerleşik | ⚠️ Meta-Reducer ile | ✅ Yerleşik | ❌ Yok |
| **Paket Boyutu** | 🟢 Küçük | 🔴 Büyük | 🟡 Orta | 🟢 Küçük |
| **Async Validasyon** | ✅ Debounced | ❌ Manuel | ❌ Manuel | ✅ Manuel |
| **İyimser Güncellemeler** | ✅ Yerleşik | ❌ Manuel | ✅ Yerleşik | ❌ Yok |
| **UI Bağımsız** | ✅ Evet | ✅ Evet | ✅ Evet | ⚠️ Angular'a Bağlı |
| **DevTools** | ✅ Yerleşik | ✅ Eklenti | ✅ Eklenti | ⚠️ Sınırlı |
| **Gerçek Zamanlı Destek** | ✅ WebSocket | ❌ Yok | ❌ Yok | ❌ Yok |

**Açıklama:** ✅ Mükemmel | ⚠️ Kısmi | ❌ Mevcut Değil | 🟢 İyi | 🟡 Orta | 🔴 Zayıf

---

## 📚 Dokümantasyon

- **[Tam Dokümantasyon](DOCUMENTATION.md)** - Eksiksiz API referansı ve rehberler
- **[Alan Tipleri Rehberi](docs/tr/fields.md)** - Kapsamlı alan tipleri dokümantasyonu ([English](docs/fields.md))
- **[Geçiş Rehberi](MIGRATION.md)** - v1.x'ten v2.x'e yükseltme
- **[Örnekler](examples/)** - Çalışan kod örnekleri
- **[Demo Uygulaması](https://github.com/biyonik/ng-signalify/tree/main/apps/demo-material)** - Tam özellikli demo uygulama

---

## 🎨 Demo Uygulamaları

Tam işlevsel demo uygulamalarımızı keşfedin:

- **[Material Demo](apps/demo-material)** - Angular Material kullanan eksiksiz uygulama
  - CRUD işlemleri ile ürün yönetimi
  - Sayfalama ile kullanıcı yönetimi
  - Alan örnekleri vitrini
  - Gerçek zamanlı güncellemelerle dashboard

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Nasıl yardımcı olabilirsiniz:

1. Depoyu **fork** edin
2. Özellik dalı **oluşturun** (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi **commit** edin (`git commit -m 'feat: harika özellik eklendi'`)
4. Dala **push** yapın (`git push origin feature/harika-ozellik`)
5. Bir **Pull Request açın**

### Commit Konvansiyonu

[Conventional Commits](https://www.conventionalcommits.org/) standardını takip ediyoruz:

```
feat: Yeni özellik
fix: Hata düzeltme
docs: Dokümantasyon değişiklikleri
style: Kod stili değişiklikleri (formatlama vb.)
refactor: Kod yeniden yapılandırma
test: Test ekleme veya güncelleme
chore: Bakım işleri
```

### Geliştirme Ortamı Kurulumu

```bash
# Depoyu klonlayın
git clone https://github.com/biyonik/ng-signalify.git
cd ng-signalify

# Bağımlılıkları yükleyin
npm install

# Testleri çalıştırın
npm test

# Kütüphaneyi derleyin
npm run build

# Demo uygulamayı çalıştırın
cd apps/demo-material
npm start
```

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👨‍💻 Yazar

**Ahmet ALTUN**

- GitHub: [@biyonik](https://github.com/biyonik)
- LinkedIn: [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)
- E-posta: ahmet.altun60@gmail.com

---

<div align="center">

**ng-signalify'ı faydalı buluyorsanız, lütfen bir ⭐ verin!**

Angular topluluğu için ❤️ ile yapıldı

</div>
