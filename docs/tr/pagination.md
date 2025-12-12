# Sayfalama Kılavuzu

> **🇬🇧 For English version:** [docs/pagination.md](../pagination.md)

## İçindekiler

- [Temel Sayfalama](#temel-sayfalama)
- [Sayfa Gezinme Metodları](#sayfa-gezinme-metodları)
- [Sayfalama Sinyalleri](#sayfalama-sinyalleri)
- [Filtreleme](#filtreleme)
- [Sıralama](#sıralama)
- [Birleşik İşlemler](#birleşik-i̇şlemler)
- [Sunucu Taraflı Sayfalama](#sunucu-taraflı-sayfalama)
- [İstemci Taraflı Sayfalama](#i̇stemci-taraflı-sayfalama)
- [UI Entegrasyonu](#ui-entegrasyonu)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

---

## Temel Sayfalama

EntityStore, reaktif sinyallerle yerleşik sayfalama desteği sağlar.

### Varsayılan Sayfa Boyutunu Yapılandır

```typescript
import { Injectable } from '@angular/core';
import { EntityStore } from 'ng-signalify/store';

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      defaultPageSize: 20  // Varsayılan: 10
    });
  }

  // Gerekli metodları uygula
  async loadAllApi() {
    const page = this.pagination.page();
    const pageSize = this.pagination.pageSize();
    
    const response = await fetch(
      `/api/users?page=${page}&size=${pageSize}`
    );
    return response.json();
  }

  async loadOneApi(id: number) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
}
```

### İlk Sayfayı Yükle

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div>
      @for (user of store.signals.all(); track user.id) {
        <div>{{ user.name }}</div>
      }
      
      <div>
        Sayfa {{ store.pagination.page() }} / {{ store.pagination.totalPages() }}
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    // Varsayılan sayfa boyutuyla sayfa 1'i yükler
    this.store.loadAll();
  }
}
```

---

## Sayfa Gezinme Metodları

EntityStore, sayfalama gezinmesi için kullanışlı metodlar sağlar.

### goToPage(page)

Belirli bir sayfa numarasına git.

```typescript
// Sayfa 3'e git
await store.goToPage(3);

// Template kullanımı
<button (click)="store.goToPage(5)">Sayfa 5'e Git</button>
```

### nextPage()

Sonraki sayfaya git.

```typescript
// Sonraki sayfaya git
await store.nextPage();

// Template kullanımı
<button 
  (click)="store.nextPage()"
  [disabled]="!store.pagination.hasNext()">
  Sonraki
</button>
```

### prevPage()

Önceki sayfaya git.

```typescript
// Önceki sayfaya git
await store.prevPage();

// Template kullanımı
<button 
  (click)="store.prevPage()"
  [disabled]="!store.pagination.hasPrev()">
  Önceki
</button>
```

### goToFirstPage()

İlk sayfaya git.

```typescript
// İlk sayfaya git
await store.goToFirstPage();

// Template kullanımı
<button (click)="store.goToFirstPage()">İlk Sayfa</button>
```

### goToLastPage()

Son sayfaya git.

```typescript
// Son sayfaya git
await store.goToLastPage();

// Template kullanımı
<button (click)="store.goToLastPage()">Son Sayfa</button>
```

### setPageSize(size)

Sayfa başına öğe sayısını değiştir.

```typescript
// Sayfa boyutunu 50'ye değiştir
await store.setPageSize(50);

// Select ile template kullanımı
<select (change)="store.setPageSize(+$event.target.value)">
  <option value="10">Sayfada 10</option>
  <option value="20">Sayfada 20</option>
  <option value="50">Sayfada 50</option>
  <option value="100">Sayfada 100</option>
</select>
```

---

## Sayfalama Sinyalleri

Reaktif sinyaller aracılığıyla sayfalama durumuna erişin.

### pagination.page()

Mevcut sayfa numarası (1'den başlar).

```typescript
const currentPage = store.pagination.page();
console.log(`Şu anda sayfa ${currentPage}'desiniz`);

// Template
<span>Sayfa {{ store.pagination.page() }}</span>
```

### pagination.pageSize()

Sayfa başına öğe sayısı.

```typescript
const size = store.pagination.pageSize();
console.log(`Sayfa başına ${size} öğe gösteriliyor`);

// Template
<span>Sayfada {{ store.pagination.pageSize() }} öğe</span>
```

### pagination.total()

Tüm sayfalardaki toplam öğe sayısı.

```typescript
const totalItems = store.pagination.total();
console.log(`${totalItems} toplam öğe`);

// Template
<span>{{ store.pagination.total() }} toplam kullanıcı</span>
```

### pagination.totalPages()

Toplam sayfa sayısı.

```typescript
const pages = store.pagination.totalPages();
console.log(`Toplam ${pages} sayfa`);

// Template
<span>/ {{ store.pagination.totalPages() }} sayfa</span>
```

### pagination.hasNext()

Sonraki sayfa olup olmadığı.

```typescript
if (store.pagination.hasNext()) {
  console.log('Daha fazla sayfa mevcut');
}

// Template - sonraki düğmesini devre dışı bırak
<button [disabled]="!store.pagination.hasNext()">
  Sonraki
</button>
```

### pagination.hasPrev()

Önceki sayfa olup olmadığı.

```typescript
if (store.pagination.hasPrev()) {
  console.log('Geri gidebilirsiniz');
}

// Template - önceki düğmesini devre dışı bırak
<button [disabled]="!store.pagination.hasPrev()">
  Önceki
</button>
```

---

## Filtreleme

Sonuçları daraltmak için filtre uygulayın.

### updateFilter(key, value)

Tek bir filtre ayarla.

```typescript
// Duruma göre filtrele
await store.updateFilter('status', 'active');

// Role göre filtrele
await store.updateFilter('role', 'admin');

// Template kullanımı
<select (change)="store.updateFilter('status', $event.target.value)">
  <option value="">Tümü</option>
  <option value="active">Aktif</option>
  <option value="inactive">Pasif</option>
</select>
```

### updateFilters(filters)

Birden fazla filtreyi aynı anda ayarla.

```typescript
// Birden fazla filtre ayarla
await store.updateFilters({
  status: 'active',
  role: 'admin',
  department: 'IT'
});

// Bileşen metodu
async applyFilters() {
  await this.store.updateFilters({
    status: this.statusControl.value,
    role: this.roleControl.value,
    search: this.searchControl.value
  });
}
```

### clearFilter(key)

Belirli bir filtreyi kaldır.

```typescript
// Durum filtresini temizle
await store.clearFilter('status');

// Template
<button (click)="store.clearFilter('status')">
  Durum Filtresini Temizle
</button>
```

### clearFilters()

Tüm filtreleri kaldır.

```typescript
// Tüm filtreleri temizle
await store.clearFilters();

// Template
<button (click)="store.clearFilters()">
  Tüm Filtreleri Temizle
</button>
```

### filters()

Mevcut filtreleri sinyal olarak al.

```typescript
const currentFilters = store.filters();
console.log('Aktif filtreler:', currentFilters);

// Template - aktif filtreleri göster
@if (store.filters()['status']) {
  <span class="badge">Durum: {{ store.filters()['status'] }}</span>
}
```

---

## Sıralama

Sonuçları alana ve yöne göre sırala.

### updateSort(field, direction)

Sıralama yapılandırmasını ayarla.

```typescript
// İsme göre artan sıralama
await store.updateSort('name', 'asc');

// Oluşturulma tarihine göre azalan sıralama
await store.updateSort('createdAt', 'desc');

// Template - sıralanabilir sütun başlığı
<th (click)="store.updateSort('name', toggleDirection())">
  İsim
  @if (store.sort()?.field === 'name') {
    <span>{{ store.sort()?.direction === 'asc' ? '↑' : '↓' }}</span>
  }
</th>
```

### clearSort()

Sıralamayı kaldır.

```typescript
// Sıralamayı temizle
await store.clearSort();

// Template
<button (click)="store.clearSort()">Sıralamayı Temizle</button>
```

### sort()

Mevcut sıralama yapılandırmasını al.

```typescript
const sortConfig = store.sort();
if (sortConfig) {
  console.log(`${sortConfig.field} ${sortConfig.direction} ile sıralandı`);
}

// Template - mevcut sıralamayı göster
@if (store.sort()) {
  <span>
    {{ store.sort()?.field }} ile sıralandı
    ({{ store.sort()?.direction }})
  </span>
}
```

---

## Birleşik İşlemler

Tek bir istekte sayfalama, filtreleme ve sıralamayı birleştirin.

### Parametrelerle loadAll()

```typescript
// Mevcut sayfalama, filtreler ve sıralama ile yükle
await store.loadAll();

// Store otomatik olarak şunları içerir:
// - Mevcut sayfa
// - Mevcut sayfa boyutu
// - Aktif filtreler
// - Aktif sıralama yapılandırması
```

### Tam Örnek

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div class="filters">
      <input 
        placeholder="Ara..."
        (input)="onSearch($event.target.value)" />
      
      <select (change)="onStatusChange($event.target.value)">
        <option value="">Tüm Durumlar</option>
        <option value="active">Aktif</option>
        <option value="inactive">Pasif</option>
      </select>
      
      <button (click)="clearAll()">Filtreleri Temizle</button>
    </div>

    <table>
      <thead>
        <tr>
          <th (click)="sortBy('name')">
            İsim {{ getSortIcon('name') }}
          </th>
          <th (click)="sortBy('email')">
            E-posta {{ getSortIcon('email') }}
          </th>
          <th (click)="sortBy('createdAt')">
            Oluşturulma {{ getSortIcon('createdAt') }}
          </th>
        </tr>
      </thead>
      <tbody>
        @for (user of store.signals.all(); track user.id) {
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.createdAt | date }}</td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button 
        (click)="store.prevPage()"
        [disabled]="!store.pagination.hasPrev()">
        Önceki
      </button>
      
      <span>
        Sayfa {{ store.pagination.page() }} / {{ store.pagination.totalPages() }}
        ({{ store.pagination.total() }} toplam)
      </span>
      
      <button 
        (click)="store.nextPage()"
        [disabled]="!store.pagination.hasNext()">
        Sonraki
      </button>
      
      <select (change)="store.setPageSize(+$event.target.value)">
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
    </div>
  `
})
export class UserListComponent {
  protected store = inject(UserStore);

  async onSearch(query: string) {
    await this.store.updateFilter('search', query);
  }

  async onStatusChange(status: string) {
    await this.store.updateFilter('status', status);
  }

  async sortBy(field: string) {
    const currentSort = this.store.sort();
    const direction = 
      currentSort?.field === field && currentSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    
    await this.store.updateSort(field, direction);
  }

  getSortIcon(field: string): string {
    const sort = this.store.sort();
    if (sort?.field !== field) return '';
    return sort.direction === 'asc' ? '↑' : '↓';
  }

  async clearAll() {
    await this.store.clearFilters();
    await this.store.clearSort();
    await this.store.goToFirstPage();
  }
}
```

---

## Sunucu Taraflı Sayfalama

Büyük veri setleri için sunucuda sayfalama işleyin.

### Uygulama

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  private http = inject(HttpClient);

  constructor() {
    super({
      name: 'users',
      defaultPageSize: 20,
      localPagination: false  // Sunucu taraflı (varsayılan)
    });
  }

  async loadAllApi() {
    // Sorgu parametrelerini oluştur
    const params = new HttpParams()
      .set('page', this.pagination.page().toString())
      .set('size', this.pagination.pageSize().toString());

    // Filtreleri ekle
    const filters = this.filters();
    Object.keys(filters).forEach(key => {
      params = params.set(key, filters[key]);
    });

    // Sıralamayı ekle
    const sort = this.sort();
    if (sort) {
      params = params.set('sortBy', sort.field);
      params = params.set('sortDirection', sort.direction);
    }

    // API isteği yap
    const response = await firstValueFrom(
      this.http.get<PaginatedResponse<User>>('/api/users', { params })
    );

    // Sayfalama durumunu güncelle
    this.pagination.setTotal(response.total);

    return response.items;
  }

  async loadOneApi(id: number) {
    return firstValueFrom(
      this.http.get<User>(`/api/users/${id}`)
    );
  }
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## İstemci Taraflı Sayfalama

Verileri yerel olarak sayfalayın (küçük veri setleri veya çevrimdışı destek için kullanışlıdır).

### Uygulama

```typescript
@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  private http = inject(HttpClient);

  constructor() {
    super({
      name: 'products',
      defaultPageSize: 12,
      localPagination: true  // İstemci taraflı sayfalama
    });
  }

  async loadAllApi() {
    // Tüm verileri bir kez al
    const allProducts = await firstValueFrom(
      this.http.get<Product[]>('/api/products/all')
    );

    // Store sayfalamaları yerel olarak işler
    return allProducts;
  }

  async loadOneApi(id: number) {
    return firstValueFrom(
      this.http.get<Product>(`/api/products/${id}`)
    );
  }
}
```

**Not:** `localPagination: true` ile store:
- Tüm verileri bir kez alır
- Filtreleme, sıralama ve sayfalamaları bellekte işler
- Sayfa değişikliklerinde sunucu istekleri olmaz
- 1000'den az öğe için idealdir

---

## UI Entegrasyonu

### Material Table + Paginator

```typescript
import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule],
  template: `
    <table mat-table [dataSource]="store.signals.all()">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>İsim</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>
      
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>E-posta</th>
        <td mat-cell *matCellDef="let user">{{ user.email }}</td>
      </ng-container>
      
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <mat-paginator
      [length]="store.pagination.total()"
      [pageSize]="store.pagination.pageSize()"
      [pageIndex]="store.pagination.page() - 1"
      [pageSizeOptions]="[10, 20, 50, 100]"
      (page)="onPageChange($event)">
    </mat-paginator>
  `
})
export class UserTableComponent {
  protected store = inject(UserStore);
  displayedColumns = ['name', 'email'];

  async onPageChange(event: PageEvent) {
    if (event.pageSize !== this.store.pagination.pageSize()) {
      await this.store.setPageSize(event.pageSize);
    } else {
      await this.store.goToPage(event.pageIndex + 1);
    }
  }
}
```

### PrimeNG Table

```typescript
import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [TableModule],
  template: `
    <p-table
      [value]="store.signals.all()"
      [lazy]="true"
      [rows]="store.pagination.pageSize()"
      [totalRecords]="store.pagination.total()"
      [paginator]="true"
      [first]="(store.pagination.page() - 1) * store.pagination.pageSize()"
      (onLazyLoad)="onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">İsim <p-sortIcon field="name"></p-sortIcon></th>
          <th pSortableColumn="email">E-posta <p-sortIcon field="email"></p-sortIcon></th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class UserTableComponent {
  protected store = inject(UserStore);

  async onLazyLoad(event: any) {
    // Sayfayı güncelle
    const page = (event.first / event.rows) + 1;
    await this.store.goToPage(page);

    // Değiştiyse sayfa boyutunu güncelle
    if (event.rows !== this.store.pagination.pageSize()) {
      await this.store.setPageSize(event.rows);
    }

    // Sıralamayı güncelle
    if (event.sortField) {
      const direction = event.sortOrder === 1 ? 'asc' : 'desc';
      await this.store.updateSort(event.sortField, direction);
    }
  }
}
```

---

## En İyi Uygulamalar

### 1. Büyük Veri Setleri için Sunucu Taraflı Kullanın

```typescript
// ✅ 10,000+ öğe için sunucu taraflı
super({
  name: 'users',
  localPagination: false,
  defaultPageSize: 20
});

// ❌ Büyük veri setleri için istemci taraflı performans sorunlarına neden olur
super({
  name: 'users',
  localPagination: true  // Büyük veri setleri için bunu yapmayın
});
```

### 2. Sayfalama Durumunu Kalıcı Hale Getirin

```typescript
// Kullanıcının sayfa tercihini kaydet
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage',
    paths: ['pagination', 'filters', 'sort']
  }
});
```

### 3. Filtre Değişikliğinde Sayfa 1'e Dön

```typescript
async applyFilter(key: string, value: any) {
  await this.store.updateFilter(key, value);
  // Filtre değişikliği otomatik olarak sayfa 1'e döner
  // Manuel olarak goToFirstPage() çağırmanıza gerek yok
}
```

### 4. Arama Filtrelerini Debounce Edin

```typescript
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export class UserListComponent implements OnInit {
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.store.updateFilter('search', query);
    });
  }

  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }
}
```

### 5. Yükleme Durumunu Göster

```typescript
@Component({
  template: `
    @if (store.signals.isLoading()) {
      <div class="loading">Yükleniyor...</div>
    }
    
    @for (item of store.signals.all(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `
})
```

---

## İlgili Dokümantasyon

- [Entity Store](store.md) - Tam store dokümantasyonu
- [Durum Kalıcılığı](persistence.md) - Sayfalama durumunu kalıcı hale getir
- [Örnekler](examples.md) - Gerçek dünya sayfalama örnekleri
- [Kurulum](installation.md) - Başlangıç

---

**ng-signalify ile sayfalamada ustalaşın! 📄**
