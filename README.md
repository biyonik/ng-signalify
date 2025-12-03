# ng-signalify

> Angular 17+ için modern, signal-tabanlı form yönetimi, state management ve UI component kütüphanesi.

[![npm version](https://badge.fury.io/js/ng-signalify.svg)](https://www.npmjs.com/package/ng-signalify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Özellikler

- 🎯 **14 Field Tipi** - String, Integer, Decimal, Boolean, Date, Enum, Relation, File, Image, JSON, Array, Password, Color, Slider
- 📝 **Form Management** - Async validation, field dependencies, cross-field validation, undo/redo
- 🗄️ **Entity Store** - Signal-based CRUD, pagination, filtering, sorting, optimistic updates
- 🧩 **10 UI Component** - Input, Select, Checkbox, Switch, Textarea, Table, Pagination, Modal, Toast, Loading
- 🌐 **API Layer** - HTTP client, caching, retry with backoff, circuit breaker, offline queue
- 🧙 **Advanced** - Multi-step wizard, dynamic repeater, real-time WebSocket
- 🏗️ **Infrastructure** - i18n, testing utilities, devtools, code generation

## 📦 Kurulum

```bash
npm install ng-signalify zod
```

## 🚀 Hızlı Başlangıç

### Form Oluşturma

```typescript
import { StringField, IntegerField, EnumField } from 'ng-signalify/fields';
import { FormSchema, createForm } from 'ng-signalify/schemas';

// Field tanımları
const userFields = {
  name: new StringField('name', 'Ad Soyad', { required: true }),
  email: new StringField('email', 'E-posta', { required: true, email: true }),
  age: new IntegerField('age', 'Yaş', { min: 18 }),
  status: new EnumField('status', 'Durum', [
    { id: 'active', label: 'Aktif' },
    { id: 'inactive', label: 'Pasif' },
  ]),
};

// Form oluştur
const form = createForm(FormSchema(userFields));

// Kullanım
form.fields.name.value.set('Ahmet');
form.fields.email.value.set('ahmet@example.com');

await form.validateAll();
console.log(form.signals.valid());  // true
console.log(form.getValues());      // { name: 'Ahmet', email: '...', ... }
```

### Entity Store

```typescript
import { EntityStore } from 'ng-signalify/store';

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User, CreateUserDto, UpdateUserDto> {
  constructor(private http: HttpClient) {
    super({ name: 'users', defaultPageSize: 20 });
  }

  protected async fetchAll(params) {
    return this.http.get<PaginatedResponse<User>>('/api/users', { params });
  }
  // ... diğer abstract metodlar
}

// Kullanım
await store.loadAll();
await store.create({ name: 'Yeni Kullanıcı' });
store.signals.all();        // Signal<User[]>
store.signals.isLoading();  // Signal<boolean>
```

### UI Components

```html
<sig-form-field label="E-posta" [error]="form.fields.email.error()">
  <sig-input type="email" [(value)]="form.fields.email.value" clearable />
</sig-form-field>

<sig-select [options]="countries" [(value)]="country" searchable />

<sig-table [data]="users" [columns]="columns" [selectable]="true" />

<sig-pagination [page]="page" [total]="total" (pageChange)="onPageChange($event)" />
```

## 📚 Modüller

| Modül | Import | Açıklama |
|-------|--------|----------|
| Fields | `ng-signalify/fields` | 14 field tipi |
| Schemas | `ng-signalify/schemas` | Form & Filter schema |
| Validators | `ng-signalify/validators` | TR validators |
| Services | `ng-signalify/services` | Import/Export |
| Store | `ng-signalify/store` | Entity state management |
| Components | `ng-signalify/components` | UI components |
| API | `ng-signalify/api` | HTTP, cache, retry |
| Advanced | `ng-signalify/advanced` | Wizard, Repeater, Real-time |
| Infrastructure | `ng-signalify/infrastructure` | i18n, Testing, DevTools |

## 📖 Dokümantasyon

Detaylı dokümantasyon için [DOCUMENTATION.md](./DOCUMENTATION.md) dosyasına bakın.

## 🔧 Gereksinimler

- Angular 17+
- TypeScript 5.2+
- Zod 3.22+

## 📄 Lisans

MIT License - [LICENSE](./LICENSE)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'feat: add amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın