<div align="center">

# ng-signalify

### Signal-First Logic Framework for Angular

**Not a UI library.** A powerful logic layer for forms, state, and APIs.  
Use with **any** UI library you love.

[![Angular](https://img.shields.io/badge/Angular-17%2B%20%7C%2018%2B%20%7C%2019%2B-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)
[![Coverage](https://img.shields.io/badge/Coverage-98%25-22C55E?style=for-the-badge)](https://github.com/biyonik/ng-signalify)
[![npm](https://img.shields.io/badge/npm-2.0.0--beta.1-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ng-signalify)

<br />

[Installation](#-installation) · [Quick Start](#-quick-start) · [Documentation](DOCUMENTATION.md) · [Examples](examples/) · [Migration Guide](MIGRATION.md)

</div>

---

## 🎯 What is ng-signalify?

**ng-signalify** is a **UI-agnostic** logic framework for Angular applications. It provides:

- ✅ **Signal-based form management** - Type-safe, reactive forms with Zod validation
- ✅ **Entity state management** - CRUD operations, caching, pagination out of the box  
- ✅ **API layer** - Type-safe HTTP client with retry, circuit breaker, offline queue
- ✅ **Rich field types** - 24+ field types with import/export capabilities
- ✅ **Advanced features** - Wizards, repeaters, WebSocket, i18n, and more

**The key difference:** ng-signalify handles the **logic**, you choose the **UI**.

### Why Not a Full UI Library?

Traditional all-in-one libraries bundle logic + UI together, forcing you into their design choices. We believe:

> **"Separate concerns, maximize flexibility"**

With ng-signalify:
- 🎨 **Use Angular Material** - For enterprise-grade UI components
- 🎨 **Use Spartan/shadcn** - For modern, accessible components  
- 🎨 **Use PrimeNG** - For feature-rich components
- 🎨 **Build custom UI** - Complete design freedom
- 🎨 **Mix and match** - Use different libraries in the same app

**The migration from v1.x?** Your business logic code stays the same. Only UI layer changes.  
[See Migration Guide →](MIGRATION.md)

---

## 🏗️ Architecture

ng-signalify uses the **Adapter Pattern** to separate logic from UI:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR UI LAYER                               │
│     Angular Material | Spartan | PrimeNG | Custom Components       │
├─────────────────────────────────────────────────────────────────────┤
│                         ADAPTER LAYER                               │
│           MaterialAdapter | HeadlessAdapter | CustomAdapter         │
├─────────────────────────────────────────────────────────────────────┤
│                      ng-signalify LOGIC LAYER                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   FIELDS     │  │   SCHEMAS    │  │    STORE     │             │
│  │              │  │              │  │              │             │
│  │ • String     │  │ • Form       │  │ • CRUD       │             │
│  │ • Integer    │  │ • Validation │  │ • Caching    │             │
│  │ • Date       │  │ • Dependencies│  │ • Pagination │             │
│  │ • Enum       │  │ • History    │  │ • Optimistic │             │
│  │ • 20+ more   │  │ • Auto-save  │  │ • Filtering  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     API      │  │   ADVANCED   │  │ INFRASTRUCTURE│             │
│  │              │  │              │  │              │             │
│  │ • HttpClient │  │ • Wizard     │  │ • i18n       │             │
│  │ • Retry      │  │ • Repeater   │  │ • DevTools   │             │
│  │ • Circuit    │  │ • WebSocket  │  │ • Testing    │             │
│  │ • Offline    │  │ • Presence   │  │ • Validators │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 📦 **Smaller bundles** - Only include what you use
- 🔄 **Easy migration** - Switch UI libraries without rewriting logic
- 🎯 **Better testing** - Test logic and UI separately
- 🚀 **Future-proof** - Adapt to new UI trends easily

---

## 📦 Installation

```bash
npm install ng-signalify zod
# or
pnpm add ng-signalify zod
# or
yarn add ng-signalify zod
```

### Choose Your UI Strategy

**Option A: Use Angular Material (Recommended for most apps)**

```bash
ng add @angular/material
```

**Option B: Use Headless (For custom UI)**

No additional dependencies needed.

**Option C: Keep v1.x components temporarily**

Available in `ng-signalify/components/_legacy` (will be removed in v3.0)

---

## 🚀 Quick Start

### 1. Configure Adapter

**For Angular Material:**

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

**For Headless (Custom UI):**

```typescript
// app.config.ts
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new HeadlessAdapter()),
    // ... other providers
  ]
};
```

### 2. Create a Form with Material UI

```typescript
import { Component } from '@angular/core';
import { StringField, IntegerField, EnumField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Name Field -->
      <mat-form-field appearance="outline">
        <mat-label>Full Name</mat-label>
        <input matInput
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()" />
        @if (form.fields.name.error() && form.fields.name.touched()) {
          <mat-error>{{ form.fields.name.error() }}</mat-error>
        }
      </mat-form-field>

      <!-- Age Field -->
      <mat-form-field appearance="outline">
        <mat-label>Age</mat-label>
        <input matInput type="number"
          [value]="form.fields.age.value()"
          (input)="form.fields.age.value.set(+$any($event.target).value)" />
        @if (form.fields.age.error() && form.fields.age.touched()) {
          <mat-error>{{ form.fields.age.error() }}</mat-error>
        }
      </mat-form-field>

      <!-- Role Select -->
      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select
          [value]="form.fields.role.value()"
          (selectionChange)="form.fields.role.value.set($event.value)">
          @for (role of roleOptions; track role.id) {
            <mat-option [value]="role.id">{{ role.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
        [disabled]="!form.valid()">
        Submit
      </button>
    </form>
  `
})
export class UserFormComponent {
  // Define fields with ng-signalify
  private fields = [
    new StringField('name', 'Full Name', { required: true, min: 2, max: 100 }),
    new IntegerField('age', 'Age', { required: true, min: 18, max: 120 }),
    new EnumField('role', 'Role', [
      { id: 'admin', label: 'Administrator' },
      { id: 'user', label: 'User' },
      { id: 'guest', label: 'Guest' },
    ], { required: true }),
  ];

  // Create reactive form
  protected form = createEnhancedForm(this.fields, {
    name: '',
    age: 18,
    role: 'user'
  });

  protected roleOptions = [
    { id: 'admin', label: 'Administrator' },
    { id: 'user', label: 'User' },
    { id: 'guest', label: 'Guest' },
  ];

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
    }
  }
}
```

### 3. Create a Form with Headless UI

```typescript
import { Component } from '@angular/core';
import { StringField, IntegerField } from 'ng-signalify/fields';
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
        label="Full Name" 
        [error]="form.fields.name.combinedError()"
        [touched]="form.fields.name.touched()"
        [required]="true">
        <input type="text"
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()"
          placeholder="Enter your name" />
      </sig-form-field>

      <sig-form-field 
        label="Age"
        [error]="form.fields.age.combinedError()">
        <input type="number"
          [value]="form.fields.age.value()"
          (input)="form.fields.age.value.set(+$any($event.target).value)" />
      </sig-form-field>

      <button type="submit" [disabled]="!form.valid()">
        Submit
      </button>
    </form>
  `
})
export class UserFormComponent {
  private fields = [
    new StringField('name', 'Full Name', { required: true, min: 2 }),
    new IntegerField('age', 'Age', { required: true, min: 18 }),
  ];

  protected form = createEnhancedForm(this.fields, {
    name: '',
    age: 18
  });

  async onSubmit() {
    if (await this.form.validateAll()) {
      console.log('Form Data:', this.form.getValues());
    }
  }
}
```

**Notice:** The form logic (fields, validation, state) is **identical** in both approaches!

### 4. Entity Store (State Management)

```typescript
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
});

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      optimistic: true,
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<User>> {
    const response = await http.get<PaginatedResponse<User>>('/api/users', { params });
    return response.data;
  }

  protected async fetchOne(id: EntityId): Promise<User> {
    const response = await http.get<User>(`/api/users/${id}`);
    return response.data;
  }

  protected async createOne(data: Partial<User>): Promise<User> {
    const response = await http.post<User>('/api/users', { body: data });
    return response.data;
  }

  protected async updateOne(id: EntityId, data: Partial<User>): Promise<User> {
    const response = await http.patch<User>(`/api/users/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/users/${id}`);
  }
}
```

**Usage in Component:**

```typescript
@Component({
  template: `
    @if (store.signals.isLoading()) {
      <mat-spinner />
    }

    @for (user of store.signals.all(); track user.id) {
      <div>{{ user.name }} - {{ user.email }}</div>
    }

    <mat-paginator
      [length]="store.pagination.total()"
      [pageSize]="store.pagination.pageSize()"
      [pageIndex]="store.pagination.page() - 1"
      (page)="store.goToPage($event.pageIndex + 1)"
    />
  `
})
export class UserListComponent {
  store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }
}
```

---

## 📚 Core Modules

### Fields (24+ Types)

| Category | Types | Features |
|----------|-------|----------|
| **Primitives** | `StringField`, `IntegerField`, `DecimalField`, `BooleanField`, `TextAreaField` | Min/Max, Email, URL, Regex |
| **Date/Time** | `DateField`, `TimeField`, `DateTimeField`, `DateRangeField` | Format handling, Timezone support |
| **Selection** | `EnumField`, `MultiEnumField`, `RelationField` | Async options, Search, Cascade |
| **Media** | `FileField`, `ImageField` | Size/type validation, Dimensions |
| **Complex** | `ArrayField`, `JsonField` | Nested validation, Schema support |
| **Special** | `PasswordField`, `ColorField`, `SliderField` | Strength check, Format conversion |

[See all field types →](DOCUMENTATION.md#fields-alan-tipleri)

### Form Features

- ✅ **Async Validation** - Debounced API checks (email uniqueness, etc.)
- ✅ **Field Dependencies** - Show/hide, computed values, cascading selects
- ✅ **Cross-Field Validation** - Multi-field rules (startDate < endDate)
- ✅ **Form History** - Undo/Redo with configurable depth
- ✅ **Auto-Save** - Debounced auto-save callbacks
- ✅ **Dirty Tracking** - Track modified fields for PATCH requests

[See form documentation →](DOCUMENTATION.md#schemas-form--filter)

### Store Features

- ✅ **Smart Caching** - TTL-based with `isStale` signal
- ✅ **Optimistic Updates** - Instant UI updates with rollback
- ✅ **Pagination** - Built-in pagination state
- ✅ **Filtering & Sorting** - Managed filter/sort state
- ✅ **Batch Operations** - `createMany`, `updateMany`, `deleteMany`
- ✅ **Selection** - Single/multi selection support

[See store documentation →](DOCUMENTATION.md#entity-store-state-management)

### API Layer

- ✅ **Type-Safe HTTP Client** - Built on fetch API with interceptors
- ✅ **Retry Handler** - Exponential backoff with jitter
- ✅ **Circuit Breaker** - Fail-fast for degraded services
- ✅ **API Cache** - Response caching with TTL
- ✅ **Offline Queue** - Store-and-forward pattern

[See API documentation →](DOCUMENTATION.md#api-layer)

### Advanced Features

- ✅ **Wizard** - Multi-step form state machine
- ✅ **Repeater** - Dynamic form arrays with drag & drop
- ✅ **WebSocket** - Real-time with auto-reconnect
- ✅ **i18n** - Signal-based internationalization
- ✅ **DevTools** - Performance tracking, logging

[See advanced features →](DOCUMENTATION.md#advanced-features)

---

## 🎨 Adapter Options

### Material Adapter

For Angular Material projects:

```typescript
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

provideSigUI(new MaterialAdapter())
```

**Pros:** Enterprise-grade, WCAG compliant, rich components  
**Cons:** Larger bundle, Material design language

[Material Example →](examples/material-adapter-example.ts)

### Headless Adapter

For custom UI or other libraries:

```typescript
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

provideSigUI(new HeadlessAdapter())
```

**Pros:** Complete design freedom, smaller bundle  
**Cons:** Build UI components yourself

[Headless Example →](examples/headless-adapter-example.ts)

### Custom Adapter

Create your own:

```typescript
import { BaseFormAdapter } from 'ng-signalify/adapters';

export class MyCustomAdapter extends BaseFormAdapter {
  readonly name = 'my-ui-library';
  readonly version = '1.0.0';
  
  // Implement adapter methods
}
```

[Adapter Documentation →](lib/adapters/README.md)

---

## 🔄 Migration from v1.x

**Good news:** Your business logic code is **100% backward compatible**.

Only UI layer needs updates:

```typescript
// ❌ v1.x (deprecated)
import { SigInput, SigSelect } from 'ng-signalify/components';

// ✅ v2.x with Material
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// ✅ v2.x with Headless
import { SigFormField } from 'ng-signalify/components/core';
```

**Migration strategies:**
- 🟢 **Gradual** - Migrate page by page (2-4 weeks)
- 🔵 **Big Bang** - Migrate everything at once (1-2 weeks)
- 🟡 **Hybrid** - Migrate critical paths first (3-4 weeks)

[Complete Migration Guide →](MIGRATION.md)

---

## 📖 Examples

Explore complete, runnable examples:

- [Material Adapter Example](examples/material-adapter-example.ts) - Full CRUD with Material UI
- [Headless Adapter Example](examples/headless-adapter-example.ts) - Custom UI components
- [Examples README](examples/README.md) - Usage guide and tips

---

## 🧪 Turkish Validators

Built-in validators for Turkish-specific data:

```typescript
import { tcKimlikNo, phoneNumber, iban, vergiNo, plaka } from 'ng-signalify/validators';

// TC ID Number (11 digits with algorithm check)
const tcField = new StringField('tc', 'TC Kimlik No', {
  required: true,
  customSchema: tcKimlikNo
});

// Phone (Turkish formats: 05551234567, +905551234567)
const phoneField = new StringField('phone', 'Telefon', {
  customSchema: phoneNumber
});

// IBAN (TR + 24 digits)
const ibanField = new StringField('iban', 'IBAN', {
  customSchema: iban
});

// Tax Number (10 digits)
const vergiField = new StringField('vergi', 'Vergi No', {
  customSchema: vergiNo
});

// License Plate (Turkish format)
const plakaField = new StringField('plaka', 'Plaka', {
  customSchema: plaka
});
```

---

## 📋 Roadmap

### v2.1 (Q1 2025)
- [ ] Form Builder UI (drag & drop)
- [ ] Additional adapters (Spartan, PrimeNG)
- [ ] Enhanced DevTools extension

### v2.5 (Q2 2025)
- [ ] Legacy components show warnings
- [ ] GraphQL client support
- [ ] VS Code extension

### v3.0 (Q1 2026)
- [ ] Remove legacy components
- [ ] Angular 20+ support
- [ ] Performance optimizations

[See full roadmap →](DOCUMENTATION.md#gelecek-özellikler)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

**Commit Convention:** `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Documentation:** [DOCUMENTATION.md](DOCUMENTATION.md)
- **Examples:** [examples/](examples/)
- **Issues:** [GitHub Issues](https://github.com/biyonik/ng-signalify/issues)
- **Discussions:** [GitHub Discussions](https://github.com/biyonik/ng-signalify/discussions)
- **Email:** ahmet.altun60@gmail.com

---

<div align="center">

## 👨‍💻 Author

**Ahmet ALTUN**

[![GitHub](https://img.shields.io/badge/GitHub-biyonik-181717?style=for-the-badge&logo=github)](https://github.com/biyonik)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-biyonik-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/biyonik)
[![Email](https://img.shields.io/badge/Email-ahmet.altun60%40gmail.com-EA4335?style=for-the-badge&logo=gmail)](mailto:ahmet.altun60@gmail.com)

---

**If you find ng-signalify useful, give it a ⭐!**

**ng-signalify v2.0** - Developed with ❤️ for the Angular community

</div>
