# Entity Store API Dokümantasyonu

> **🇬🇧 For English version:** [docs/store.md](../store.md)

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Yapılandırma](#yapılandırma)
- [CRUD İşlemleri](#crud-i̇şlemleri)
- [Sayfalama](#sayfalama)
- [Filtreleme ve Sıralama](#filtreleme-ve-sıralama)
- [Durum Sinyalleri](#durum-sinyalleri)
- [İyimser Güncellemeler](#i̇yimser-güncellemeler)
- [Durum Kalıcılığı](#durum-kalıcılığı)
- [Önbellekleme](#önbellekleme)
- [Hata Yönetimi](#hata-yönetimi)
- [Gelişmiş Desenler](#gelişmiş-desenler)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)
- [API Referansı](#api-referansı)

---

## Genel Bakış

### EntityStore Nedir?

**EntityStore**, Angular 19+ uygulamalarında CRUD işlemleri için signal-tabanlı bir state management çözümüdür. Koleksiyonları yönetmek için standartlaşmış, tip-güvenli bir yol sunar ve şunlar için yerleşik destek sağlar:

- ✅ **CRUD İşlemleri** - Oluşturma, Okuma, Güncelleme, Silme
- ✅ **Sayfalama** - Sinyaller ile otomatik sayfa yönetimi
- ✅ **Filtreleme ve Sıralama** - Yerleşik filtre ve sıralama durumu
- ✅ **Önbellekleme** - TTL tabanlı önbellekleme ve otomatik geçersizleştirme
- ✅ **İyimser Güncellemeler** - Geri alma ile anında UI güncellemeleri
- ✅ **Durum Kalıcılığı** - Filtreleri, sıralamayı ve sayfalamayı kaydetme/geri yükleme
- ✅ **Otomatik İptal** - Race condition önleme
- ✅ **Seçim Yönetimi** - Tekli ve çoklu seçim desteği
- ✅ **Reaktif Sinyaller** - Tam Angular Signals entegrasyonu

### EntityStore Ne Zaman Kullanılır?

EntityStore şunlar için idealdir:

- 📋 **Veri Tabloları** - Kullanıcı listeleri, ürün katalogları, siparişler
- 🔍 **Arama ve Filtreleme UI'ı** - Kalıcılık ile gelişmiş filtreleme
- 📊 **Panolar** - Önbellekleme ile gerçek zamanlı veri
- 📱 **Ana-Detay Görünümleri** - Entity seçimi ve detayları
- 🔄 **Gerçek Zamanlı Güncellemeler** - WebSocket entegrasyonu
- 📦 **Çevrimdışı Destek** - Yerel durum kalıcılığı

### Mimari

```
┌──────────────────────────────────────────────────┐
│              Angular Component                    │
│                                                   │
│  store.signals.all() ──> Veriyi Göster          │
│  store.pagination.page() ──> Sayfayı Göster     │
│  store.signals.isLoading() ──> Spinner Göster   │
└────────────────┬──────────────────┬──────────────┘
                 │                  │
                 ▼                  ▼
        ┌────────────────┐  ┌──────────────┐
        │ Kullanıcı      │  │   Sinyaller  │
        │  Eylemleri     │  │  (Reaktif)   │
        │                │  │              │
        │  loadAll()     │  │  all()       │
        │  create()      │  │  selected()  │
        │  update()      │  │  isLoading() │
        │  delete()      │  │  error()     │
        │  goToPage()    │  │              │
        └────────┬───────┘  └──────────────┘
                 │
                 ▼
     ┌───────────────────────────┐
     │     EntityStore           │
     │   (Durum Yönetimi)        │
     │                           │
     │  - Durum Sinyali          │
     │  - Sayfalama              │
     │  - Filtreler/Sıralama     │
     │  - Önbellek TTL           │
     │  - İyimser Güncellemeler  │
     └────────────┬──────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │   API Katmanı    │
        │                  │
        │  fetchAll()      │
        │  fetchOne()      │
        │  createOne()     │
        │  updateOne()     │
        │  deleteOne()     │
        └──────────────────┘
```


---

## Hızlı Başlangıç

### 1. Entity'nizi Tanımlayın

```typescript
// user.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Store Oluşturun

```typescript
// user.store.ts
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000
});

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000, // 5 dakika
      optimistic: true
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

### 3. Component'te Kullanın

```typescript
// user-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { UserStore } from './user.store';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <!-- Yükleniyor Durumu -->
    @if (store.signals.isLoading()) {
      <div class="spinner">Yükleniyor...</div>
    }

    <!-- Hata Durumu -->
    @if (store.signals.error()) {
      <div class="error">{{ store.signals.error() }}</div>
    }

    <!-- Veri Tablosu -->
    @if (store.signals.hasData()) {
      <table>
        <thead>
          <tr>
            <th>Ad</th>
            <th>E-posta</th>
            <th>Rol</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          @for (user of store.signals.all(); track user.id) {
            <tr>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.status }}</td>
              <td>
                <button (click)="edit(user)">Düzenle</button>
                <button (click)="delete(user.id)">Sil</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Sayfalama -->
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
      </div>
    }

    <!-- Boş Durum -->
    @if (store.signals.isEmpty() && !store.signals.isLoading()) {
      <div class="empty">Kullanıcı bulunamadı</div>
    }
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  async edit(user: User) {
    // Düzenleme dialogu aç
  }

  async delete(id: number) {
    if (confirm('Emin misiniz?')) {
      await this.store.delete(id);
    }
  }
}
```

---

## Yapılandırma

### EntityStoreConfig Arayüzü

```typescript
interface EntityStoreConfig<T> {
  // Zorunlu
  name: string;                    // Store tanımlayıcısı
  
  // Opsiyonel
  selectId?: (entity: T) => EntityId;        // ID seçici (varsayılan: e => e.id)
  sortCompare?: (a: T, b: T) => number;      // Özel sıralama fonksiyonu
  defaultPageSize?: number;                   // Varsayılan sayfa boyutu (varsayılan: 10)
  cacheTTL?: number;                         // Önbellek süresi ms (varsayılan: 5 dk)
  optimistic?: boolean;                       // İyimser güncellemeleri etkinleştir (varsayılan: true)
  localPagination?: boolean;                  // İstemci tarafı sayfalama (varsayılan: false)
  persistence?: PersistenceConfig;            // Durum kalıcılığı ayarları
}
```

### Yapılandırma Seçenekleri

#### name (zorunlu)

Store için benzersiz tanımlayıcı. Kalıcılık anahtarları ve hata ayıklama için kullanılır.

```typescript
super({
  name: 'users' // Uygulama genelinde benzersiz olmalı
});
```

#### selectId

Entity ID'sini çıkaran fonksiyon. Varsayılan: `(e) => e.id`.

```typescript
super({
  name: 'users',
  selectId: (user) => user.userId // Özel ID alanı
});
```

#### sortCompare

İstemci tarafı sıralama için özel sıralama fonksiyonu.

```typescript
super({
  name: 'users',
  sortCompare: (a, b) => a.name.localeCompare(b.name, 'tr')
});
```

#### defaultPageSize

Sayfa başına varsayılan öğe sayısı.

```typescript
super({
  name: 'users',
  defaultPageSize: 20 // Varsayılan: 10
});
```

#### cacheTTL

Milisaniye cinsinden önbellek süresi. TTL'den daha eski veriler eskimiş kabul edilir.

```typescript
super({
  name: 'users',
  cacheTTL: 10 * 60 * 1000 // 10 dakika (varsayılan: 5 dakika)
});
```

#### optimistic

Daha iyi UX için iyimser güncellemeleri etkinleştir.

```typescript
super({
  name: 'users',
  optimistic: true // Varsayılan: true
});
```

#### localPagination

İstemci tarafı sayfalamayı etkinleştir (tüm veri yüklenir, yerel olarak sayfalanır).

```typescript
super({
  name: 'users',
  localPagination: true // Varsayılan: false (sunucu taraflı)
});
```

#### persistence

Durum kalıcılığı yapılandırması. Detaylar için [Durum Kalıcılığı](#durum-kalıcılığı) bölümüne bakın.

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage',  // veya 'localStorage'
    paths: ['filters', 'sort', 'pagination'],  // Neyin kalıcı olacağı
    key: 'ozel_anahtar'  // Opsiyonel özel depolama anahtarı
  }
});
```

### Tam Yapılandırma Örneği

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      sortCompare: (a, b) => a.name.localeCompare(b.name, 'tr'),
      defaultPageSize: 25,
      cacheTTL: 10 * 60 * 1000,
      optimistic: true,
      localPagination: false,
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters', 'sort', 'pagination']
      }
    });
  }
  // ... soyut metodları implement edin
}
```


---

## CRUD İşlemleri

### loadAll()

Sayfalama, filtreleme ve sıralama ile entity'leri yükler.

#### İmza

```typescript
async loadAll(params?: Partial<FetchParams>): Promise<void>
```

#### Parametreler

```typescript
interface FetchParams {
  page?: number;              // Sayfa numarası (1-tabanlı)
  pageSize?: number;          // Sayfa başına öğe
  filters?: FilterParams;     // Anahtar-değer filtre nesnesi
  sort?: SortConfig;          // Sıralama yapılandırması
  signal?: AbortSignal;       // İptal için
}
```

#### Örnekler

**Temel kullanım:**
```typescript
// Varsayılan ayarlarla ilk sayfayı yükle
await store.loadAll();
```

**Sayfalama ile:**
```typescript
// 20 öğeyle 2. sayfayı yükle
await store.loadAll({ 
  page: 2, 
  pageSize: 20 
});
```

**Filtrelerle:**
```typescript
// Duruma göre filtrele
await store.loadAll({ 
  filters: { 
    status: 'active',
    role: 'admin'
  } 
});
```

**Sıralama ile:**
```typescript
// Ada göre artan sırala
await store.loadAll({ 
  sort: { 
    field: 'name', 
    direction: 'asc' 
  } 
});
```

**Birleşik örnek:**
```typescript
// Filtre + Sıralama + Sayfalama
await store.loadAll({
  page: 1,
  pageSize: 25,
  filters: { status: 'active' },
  sort: { field: 'createdAt', direction: 'desc' }
});
```

#### Otomatik İptal

Önceki `loadAll()` istekleri yeni bir istek başladığında otomatik olarak iptal edilir, race condition'ları önler.

---

### loadOne()

ID ile tek bir entity yükler ve store'da günceller/ekler.

#### İmza

```typescript
async loadOne(id: EntityId): Promise<T | null>
```

#### Parametreler

- `id: EntityId` - Entity tanımlayıcısı (string | number)

#### Dönüş Değeri

Yüklenen entity'yi veya hata durumunda `null` döner.

#### Örnekler

```typescript
// ID ile kullanıcı yükle
const user = await store.loadOne(123);

if (user) {
  console.log('Yüklendi:', user);
} else {
  console.error('Kullanıcı yüklenemedi');
}
```

---

### create()

Yeni bir entity oluşturur.

#### İmza

```typescript
async create(data: CreateDto): Promise<T | null>
```

#### Dönüş Değeri

Oluşturulan entity'yi veya hata durumunda `null` döner.

#### Örnekler

```typescript
const newUser = await store.create({
  name: 'Ahmet Yılmaz',
  email: 'ahmet@example.com',
  role: 'user'
});

if (newUser) {
  console.log('Oluşturuldu:', newUser.id);
} else {
  console.error('Oluşturma başarısız');
}
```

---

### update()

Mevcut bir entity'yi günceller.

#### İmza

```typescript
async update(id: EntityId, data: UpdateDto): Promise<T | null>
```

#### Örnekler

```typescript
const updated = await store.update(userId, {
  name: 'Ayşe Demir',
  email: 'ayse@example.com'
});
```

**Kısmi güncelleme:**
```typescript
// Sadece durumu güncelle
const updated = await store.update(userId, {
  status: 'inactive'
});
```

---

### delete()

Bir entity'yi ID ile siler.

#### İmza

```typescript
async delete(id: EntityId): Promise<boolean>
```

#### Dönüş Değeri

Başarılıysa `true`, hata durumunda `false` döner.

#### Örnekler

```typescript
const success = await store.delete(userId);

if (success) {
  showNotification('success', 'Kullanıcı silindi');
} else {
  showNotification('error', 'Kullanıcı silinemedi');
}
```

#### Liste Yenileme Davranışı

Başarılı silme işleminden sonra, listeyi sunucudan yenilemek için `loadAll()` otomatik olarak çağrılır.

---

### refresh()

Mevcut sayfayı önbelleği atlayarak zorla yeniden yükler.

#### İmza

```typescript
async refresh(): Promise<void>
```

#### Örnekler

```typescript
// Mevcut sayfayı yenile
await store.refresh();
```

---

## Sayfalama

### Metodlar

```typescript
async goToPage(page: number): Promise<void>      // Belirli bir sayfaya git
async nextPage(): Promise<void>                   // Sonraki sayfa
async prevPage(): Promise<void>                   // Önceki sayfa
async setPageSize(size: number): Promise<void>    // Sayfa boyutunu değiştir
```

### Sinyaller

```typescript
pagination.page()          // Signal<number> - Mevcut sayfa numarası
pagination.pageSize()      // Signal<number> - Sayfa boyutu
pagination.total()         // Signal<number> - Toplam entity sayısı
pagination.totalPages()    // Signal<number> - Toplam sayfa sayısı
pagination.hasNext()       // Signal<boolean> - Sonraki sayfa var mı
pagination.hasPrev()       // Signal<boolean> - Önceki sayfa var mı
```

### Tam Sayfalama Örneği

```typescript
@Component({
  template: `
    <!-- Sayfa Bilgisi -->
    <div class="page-info">
      {{ startItem() }} - {{ endItem() }} arası gösteriliyor ({{ store.pagination.total() }} toplam)
    </div>

    <!-- Sayfa Boyutu Seçici -->
    <select [value]="store.pagination.pageSize()" 
            (change)="changePageSize($event)">
      <option [value]="10">Sayfa başına 10</option>
      <option [value]="20">Sayfa başına 20</option>
      <option [value]="50">Sayfa başına 50</option>
      <option [value]="100">Sayfa başına 100</option>
    </select>

    <!-- Sayfalama Kontrolleri -->
    <div class="pagination">
      <button (click)="store.goToPage(1)"
              [disabled]="store.pagination.page() === 1">
        İlk
      </button>

      <button (click)="store.prevPage()"
              [disabled]="!store.pagination.hasPrev()">
        Önceki
      </button>

      @for (page of visiblePages(); track page) {
        <button (click)="store.goToPage(page)"
                [class.active]="store.pagination.page() === page">
          {{ page }}
        </button>
      }

      <button (click)="store.nextPage()"
              [disabled]="!store.pagination.hasNext()">
        Sonraki
      </button>

      <button (click)="store.goToPage(store.pagination.totalPages())"
              [disabled]="store.pagination.page() === store.pagination.totalPages()">
        Son
      </button>
    </div>
  `
})
export class UserListComponent {
  protected store = inject(UserStore);

  protected startItem = computed(() => {
    const page = this.store.pagination.page();
    const pageSize = this.store.pagination.pageSize();
    return (page - 1) * pageSize + 1;
  });

  protected endItem = computed(() => {
    const page = this.store.pagination.page();
    const pageSize = this.store.pagination.pageSize();
    const total = this.store.pagination.total();
    return Math.min(page * pageSize, total);
  });

  protected visiblePages = computed(() => {
    const current = this.store.pagination.page();
    const total = this.store.pagination.totalPages();
    const delta = 2;
    
    const pages: number[] = [];
    for (let i = Math.max(1, current - delta); 
         i <= Math.min(total, current + delta); 
         i++) {
      pages.push(i);
    }
    return pages;
  });

  async changePageSize(event: Event) {
    const size = +(event.target as HTMLSelectElement).value;
    await this.store.setPageSize(size);
  }
}
```

---

## Filtreleme ve Sıralama

### Filtreleme

#### updateFilter()

Tek bir filtre değerini günceller.

```typescript
async updateFilter(key: string, value: unknown): Promise<void>

// Kullanım
await store.updateFilter('status', 'active');
await store.updateFilter('role', 'admin');
```

**Filtreyi temizle** (null/undefined olarak ayarla):
```typescript
await store.updateFilter('status', null);
```

#### updateFilters()

Birden fazla filtreyi aynı anda günceller.

```typescript
async updateFilters(filters: FilterParams): Promise<void>

// Kullanım (tüm filtreleri değiştirir)
await store.updateFilters({
  status: 'active',
  role: 'admin',
  minAge: 18
});
```

#### clearFilters()

Tüm filtreleri kaldırır.

```typescript
async clearFilters(): Promise<void>

// Kullanım
await store.clearFilters();
```

#### filters() Sinyali

Mevcut filtreleri alır.

```typescript
const filters = store.signals.filters(); // Signal<FilterParams>

// Template
{{ store.signals.filters() | json }}
```

### Sıralama

#### updateSort()

Sıralama alanı ve yönünü ayarlar.

```typescript
async updateSort(field: string, direction: 'asc' | 'desc'): Promise<void>

// Kullanım
await store.updateSort('name', 'asc');
await store.updateSort('createdAt', 'desc');
```

#### clearSort()

Sıralamayı kaldırır.

```typescript
async clearSort(): Promise<void>

// Kullanım
await store.clearSort();
```

#### toggleSort()

Bir alan için sıralama yönünü değiştirir (asc → desc → none).

```typescript
async toggleSort(field: string): Promise<void>

// Kullanım
await store.toggleSort('name');
// İlk tıklama: asc
// İkinci tıklama: desc
// Üçüncü tıklama: sıralama yok
```


---

## Durum Sinyalleri

EntityStore, duruma erişmek için kapsamlı bir reaktif sinyal seti sağlar.

### Entity Sinyalleri

```typescript
signals.all()              // Signal<T[]> - Tüm yüklenmiş entity'ler
signals.byId(id)           // Signal<T | undefined> - ID ile entity
signals.selected()         // Signal<T | null> - Seçili entity
signals.selectedItems()    // Signal<T[]> - Seçili entity'ler (çoklu seçim)
signals.isLoading()        // Signal<boolean> - Yükleniyor durumu
signals.error()            // Signal<string | null> - Hata mesajı
signals.count()            // Signal<number> - Entity sayısı
signals.isEmpty()          // Signal<boolean> - Store boş mu
signals.hasData()          // Signal<boolean> - Store'da veri var mı
signals.isStale()          // Signal<boolean> - Önbellek eskidi mi
signals.filters()          // Signal<FilterParams> - Mevcut filtreler
signals.sort()             // Signal<SortConfig | null> - Mevcut sıralama
```

### Kullanım Örneği

```typescript
@Component({
  template: `
    <!-- Yükleniyor Durumu -->
    @if (store.signals.isLoading()) {
      <mat-spinner />
    }

    <!-- Hata Durumu -->
    @if (store.signals.error(); as error) {
      <mat-card class="error-card">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ error }}</p>
        <button mat-button (click)="store.refresh()">Tekrar Dene</button>
      </mat-card>
    }

    <!-- Boş Durum -->
    @if (store.signals.isEmpty() && !store.signals.isLoading()) {
      <div class="empty-state">
        <mat-icon>group</mat-icon>
        <h3>Kullanıcı Bulunamadı</h3>
        <p>İlk kullanıcınızı oluşturarak başlayın</p>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          Kullanıcı Oluştur
        </button>
      </div>
    }

    <!-- Veri Durumu -->
    @if (store.signals.hasData()) {
      <div class="count-badge">
        {{ store.signals.count() }} / {{ store.pagination.total() }}
      </div>
      <user-table [users]="store.signals.all()" />
    }
  `
})
```

---

## İyimser Güncellemeler

### İyimser Güncellemeler Nedir?

İyimser güncellemeler, sunucu yanıtı vermeden önce **UI'ı hemen güncelleyerek** ve işlem başarısız olursa geri alarak algılanan performansı artırır.

**İyimser güncellemeler olmadan:**
```
Kullanıcı Sil'e tıklar → Spinner göster → Sunucuyu bekle → UI'ı güncelle
                          (2-3 saniye bekleme)
```

**İyimser güncellemelerle:**
```
Kullanıcı Sil'e tıklar → UI anında güncellenir → Sunucu arka planda onaylar
                         (Anında geri bildirim)
```

### Ne Zaman Kullanılır?

- ✅ **Kullanıcı anında geri bildirim bekler** (beğen/beğenme, durumu değiştir)
- ✅ **Düşük hata oranı** (çoğu işlem başarılı)
- ✅ **Geri alınabilir eylemler** (geri alınabilir)
- ✅ **Ağ gecikmesi fark edilir**

- ❌ **Yüksek hata riski** (ödeme işleme)
- ❌ **Kritik işlemler** (hesap sil)
- ❌ **Karmaşık doğrulama** (sunucu tarafında başarısız olabilir)

### Yapılandırma

```typescript
super({
  name: 'users',
  optimistic: true // İyimser güncellemeleri etkinleştir (varsayılan: true)
});
```

### Yerleşik İyimser Metodlar

```typescript
optimisticCreate(data)   // İyimser oluşturma
optimisticUpdate(id, data) // İyimser güncelleme
optimisticDelete(id)     // İyimser silme

// Her biri OptimisticResult döner
interface OptimisticResult {
  rollback: () => void;  // Değişikliği geri al
  confirm: () => void;   // Değişikliği onayla
}
```

### Gerçek Dünya Örneği: Durum Değiştir

```typescript
async toggleUserStatus(userId: number, currentStatus: string) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  // İyimser güncelleme - UI anında değişir
  const { rollback } = this.store.optimisticUpdate(userId, {
    status: newStatus
  });

  try {
    // Arka planda API çağrısı
    await this.userApi.updateStatus(userId, newStatus);
    
    // Başarı geri bildirimi
    this.toast.success(`Kullanıcı ${newStatus === 'active' ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
  } catch (error) {
    // Hata durumunda geri al
    rollback();
    this.toast.error('Durum güncellenemedi');
    console.error(error);
  }
}
```

---

## Durum Kalıcılığı

Durum kalıcılığı, store durumunu oturumlar arasında kaydetmenize ve geri yüklemenize olanak tanır.

### Neyin Kalıcı Olacağı?

Şunları kalıcı hale getirebilirsiniz:
- **filters** - Aktif filtreler
- **sort** - Sıralama yapılandırması
- **pagination** - Mevcut sayfa ve sayfa boyutu
- **selection** - Seçili entity ID'leri (opsiyonel)

### Yapılandırma

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage',  // veya 'localStorage'
    paths: ['filters', 'sort', 'pagination'],
    key: 'ozel_anahtar'  // Opsiyonel özel depolama anahtarı
  }
});
```

#### Depolama Seçenekleri

**sessionStorage** (varsayılan):
- Veri tarayıcı oturumu boyunca kalır
- Sekme/tarayıcı kapatıldığında temizlenir
- Geçici durum için önerilir

**localStorage**:
- Veri süresiz olarak kalır
- Tarayıcı yeniden başlatıldığında devam eder
- Kullanıcı tercihleri için önerilir

### Kullanım Senaryoları

**Arama filtrelerinin kalıcılığı:**
```typescript
// Kullanıcı karmaşık filtreler uygular
await store.updateFilters({
  status: 'active',
  role: 'admin',
  department: 'IT',
  createdAfter: '2024-01-01'
});

// Sayfadan ayrılır, sonra geri döner
// Filtreler hala uygulanmış durumda!
```

---

## Önbellekleme

EntityStore, gereksiz API çağrılarını azaltmak için TTL tabanlı yerleşik önbellekleme içerir.

### Önbellek Yapılandırması

```typescript
super({
  name: 'users',
  cacheTTL: 5 * 60 * 1000  // 5 dakika (milisaniye cinsinden)
});
```

**Yaygın TTL değerleri:**
```typescript
cacheTTL: 60 * 1000           // 1 dakika
cacheTTL: 5 * 60 * 1000       // 5 dakika (varsayılan)
cacheTTL: 15 * 60 * 1000      // 15 dakika
cacheTTL: 60 * 60 * 1000      // 1 saat
cacheTTL: Infinity            // Asla dolmasın (dikkatli kullanın)
```

### Önbelleği Yenileme

```typescript
// Önbelleği atla, taze veri al
await store.refresh();

// Sadece eskimişse yenile
await store.refreshIfStale();

// Önbellek durumunu kontrol et
if (store.signals.isStale()) {
  await store.refresh();
}
```

---

## Hata Yönetimi

### Hata Sinyali

```typescript
const error = store.signals.error(); // Signal<string | null>

// Hata varsa kontrol et
@if (store.signals.error(); as error) {
  <div class="error">{{ error }}</div>
}
```

### Hataları Temizleme

```typescript
// Manuel hata temizleme
store.clearError();

// Hatalar sonraki başarılı işlemde otomatik temizlenir
await store.loadAll(); // Başarılıysa önceki hatayı temizler
```

### Kullanıcı Geri Bildirimi Desenleri

**Toast bildirimleri:**
```typescript
async createUser(data: CreateUserDto) {
  const user = await this.store.create(data);
  
  if (!user) {
    const error = this.store.signals.error();
    this.toast.error(error || 'Kullanıcı oluşturulamadı');
    return;
  }
  
  this.toast.success('Kullanıcı başarıyla oluşturuldu');
  this.router.navigate(['/users', user.id]);
}
```

---

## Gelişmiş Desenler

### İlişkili Entity'ler

Ana entity seçimine göre ilişkili entity'leri yükleyin.

```typescript
// Kullanıcıyı gönderileriyle birlikte yükle
effect(() => {
  const user = this.userStore.signals.selected()();
  
  if (user) {
    this.postStore.loadAll({
      filters: { userId: user.id }
    });
  }
});
```

### Toplu İşlemler

```typescript
// Toplu oluşturma
const result = await store.createMany(users);

// Toplu güncelleme
const result = await store.updateMany(updates);

// Toplu silme
const result = await store.deleteMany(selectedIds);
```

### Gerçek Zamanlı Güncellemeler

WebSocket güncellemelerini EntityStore ile entegre edin.

```typescript
export class UserStore extends EntityStore<User> {
  private ws = inject(WebSocketService);

  constructor() {
    super({ name: 'users' });
    this.setupRealtimeUpdates();
  }

  private setupRealtimeUpdates() {
    this.ws.on<User>('user:created', (user) => {
      this._state.update((s) => ({
        ...adapter.addOne(s, user, this.config.selectId),
      }));
      this.toast.info(`Yeni kullanıcı eklendi: ${user.name}`);
    });
  }
}
```

### Computed Signals

Store sinyallerinden türetilmiş durum oluşturun.

```typescript
export class DashboardComponent {
  userStore = inject(UserStore);

  activeUsers = computed(() => 
    this.userStore.signals.all().filter(u => u.status === 'active')
  );

  userStats = computed(() => {
    const users = this.userStore.signals.all();
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length
    };
  });
}
```

---

## En İyi Uygulamalar

### 1. Store Organizasyonu

**Entity tipi başına bir store:**
```typescript
// ✅ İyi: Ayrı store'lar
UserStore
ProductStore
OrderStore

// ❌ Kötü: Her şey için tek store
AppStore // Kullanıcılar, ürünler, siparişler içerir
```

**Store'ları odaklanmış tutun:**
```typescript
// ✅ İyi: Odaklanmış sorumluluk
export class UserStore extends EntityStore<User> {
  // Sadece kullanıcı ile ilgili mantık
}
```

### 2. Performans

**Uygun sayfa boyutları kullanın:**
```typescript
// ✅ İyi: Makul sayfa boyutları
defaultPageSize: 20  // Listeler için
defaultPageSize: 50  // Tablolar için
defaultPageSize: 100 // Seçim açılır menüleri için

// ❌ Kötü: Çok büyük/küçük
defaultPageSize: 1000 // Yavaş render
defaultPageSize: 1    // Çok fazla istek
```

**Sık okunan veriler için önbelleklemeyi etkinleştirin:**
```typescript
// ✅ İyi: Statik/yavaş değişen veriyi önbelleğe al
super({
  name: 'categories',
  cacheTTL: 60 * 60 * 1000 // 1 saat
});
```

**Daha iyi UX için iyimser güncellemeleri kullanın:**
```typescript
// ✅ İyi: Anında geri bildirim
super({
  name: 'users',
  optimistic: true
});
```

### 3. Hata Yönetimi

**Dönüş değerlerini her zaman kontrol edin:**
```typescript
// ✅ İyi: Sonucu kontrol et
const user = await store.create(data);
if (!user) {
  handleError();
  return;
}
processSuccess(user);

// ❌ Kötü: Başarıyı varsay
const user = await store.create(data);
processSuccess(user); // Null olabilir!
```

**Hataları kullanıcılara gösterin:**
```typescript
// ✅ İyi: Kullanıcı geri bildirimi
if (!user) {
  this.toast.error(this.store.signals.error());
}

// ❌ Kötü: Sessiz başarısızlık
if (!user) {
  console.error('Başarısız');
}
```

### 4. Yaygın Hatalar

**❌ Init'te loadAll() çağırmayı unutmak:**
```typescript
// Kötü
ngOnInit() {
  // Store boş, hiçbir şey görüntülenmez
}

// İyi
ngOnInit() {
  this.store.loadAll();
}
```

**❌ Filtreleri uygun zamanda temizlememek:**
```typescript
// Kötü: Filtreler ayrıldığında kalıcı
ngOnDestroy() {
  // Sonraki ziyarette filtreler hala aktif
}

// İyi: İşiniz bittiğinde filtreleri temizleyin
ngOnDestroy() {
  this.store.clearFilters();
}
```

**❌ CRUD işlemlerinden null dönüşleri işlememek:**
```typescript
// Kötü
const user = await store.create(data);
router.navigate(['/users', user.id]); // Null ise çöker!

// İyi
const user = await store.create(data);
if (user) {
  router.navigate(['/users', user.id]);
}
```


---

## API Referansı

### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `loadAll()` | `params?: Partial<FetchParams>` | `Promise<void>` | Sayfalama, filtreler ve sıralama ile entity'leri yükle |
| `loadOne()` | `id: EntityId` | `Promise<T \| null>` | ID ile tek entity yükle |
| `create()` | `data: CreateDto` | `Promise<T \| null>` | Yeni entity oluştur |
| `createMany()` | `items: CreateDto[]` | `Promise<{ success: T[]; failed: {...}[] }>` | Birden fazla entity oluştur |
| `update()` | `id: EntityId, data: UpdateDto` | `Promise<T \| null>` | Entity'yi güncelle |
| `updateMany()` | `updates: Array<{ id, data }>` | `Promise<{ success: T[]; failed: {...}[] }>` | Birden fazla entity'yi güncelle |
| `delete()` | `id: EntityId` | `Promise<boolean>` | Entity'yi sil |
| `deleteMany()` | `ids: EntityId[]` | `Promise<{ success: EntityId[]; failed: EntityId[] }>` | Birden fazla entity'yi sil |
| `refresh()` | - | `Promise<void>` | Mevcut sayfayı zorla yeniden yükle (önbelleği atla) |
| `refreshIfStale()` | - | `Promise<void>` | Sadece önbellek eskimişse yenile |
| `goToPage()` | `page: number` | `Promise<void>` | Belirli bir sayfaya git |
| `nextPage()` | - | `Promise<void>` | Sonraki sayfaya git |
| `prevPage()` | - | `Promise<void>` | Önceki sayfaya git |
| `setPageSize()` | `size: number` | `Promise<void>` | Sayfa boyutunu değiştir |
| `updateFilter()` | `key: string, value: unknown` | `Promise<void>` | Tek filtreyi güncelle |
| `updateFilters()` | `filters: FilterParams` | `Promise<void>` | Tüm filtreleri güncelle |
| `clearFilters()` | - | `Promise<void>` | Tüm filtreleri temizle |
| `clearFilter()` | `key: string` | `Promise<void>` | Belirli bir filtreyi temizle |
| `updateSort()` | `field: string, direction: 'asc' \| 'desc'` | `Promise<void>` | Sıralamayı ayarla |
| `toggleSort()` | `field: string` | `Promise<void>` | Sıralama yönünü değiştir (asc → desc → none) |
| `clearSort()` | - | `Promise<void>` | Sıralamayı temizle |
| `select()` | `id: EntityId \| null` | `void` | Tek entity seç |
| `toggleSelect()` | `id: EntityId` | `void` | Entity seçimini değiştir |
| `selectMany()` | `ids: EntityId[]` | `void` | Birden fazla entity seç |
| `selectAll()` | - | `void` | Mevcut görünümdeki tüm entity'leri seç |
| `clearSelection()` | - | `void` | Tüm seçimleri temizle |
| `clearError()` | - | `void` | Hata durumunu temizle |
| `reset()` | - | `void` | Store'u başlangıç durumuna sıfırla |
| `optimisticCreate()` | `data: CreateDto & { id?: EntityId }` | `OptimisticResult` | Geri alma ile iyimser oluşturma |
| `optimisticUpdate()` | `id: EntityId, data: UpdateDto` | `OptimisticResult` | Geri alma ile iyimser güncelleme |
| `optimisticDelete()` | `id: EntityId` | `OptimisticResult` | Geri alma ile iyimser silme |
| `getById()` | `id: EntityId` | `T \| undefined` | ID ile entity al (reaktif değil) |
| `getByIds()` | `ids: EntityId[]` | `T[]` | ID'lere göre birden fazla entity al |
| `find()` | `predicate: (entity: T) => boolean` | `T \| undefined` | İlk eşleşen entity'yi bul |
| `filter()` | `predicate: (entity: T) => boolean` | `T[]` | Entity'leri yüklem ile filtrele |

### Sinyaller

| Sinyal | Tip | Açıklama |
|--------|-----|----------|
| `signals.all()` | `Signal<T[]>` | Mevcut sayfadaki tüm yüklenmiş entity'ler |
| `signals.byId(id)` | `Signal<T \| undefined>` | ID ile entity (computed) |
| `signals.entities()` | `Signal<Map<EntityId, T>>` | Entity haritası (anahtar-değer) |
| `signals.ids()` | `Signal<EntityId[]>` | Entity ID'leri dizisi |
| `signals.selected()` | `Signal<T \| null>` | Şu anda seçili entity |
| `signals.selectedItems()` | `Signal<T[]>` | Tüm seçili entity'ler (çoklu seçim) |
| `signals.isLoading()` | `Signal<boolean>` | Yükleniyor durumu göstergesi |
| `signals.loading()` | `Signal<LoadingState>` | Detaylı yükleme durumu ('idle' \| 'loading' \| 'success' \| 'error') |
| `signals.error()` | `Signal<string \| null>` | Hata mesajı (varsa) |
| `signals.hasError()` | `Signal<boolean>` | Hata var mı |
| `signals.count()` | `Signal<number>` | Mevcut görünümdeki entity sayısı |
| `signals.isEmpty()` | `Signal<boolean>` | Store'da entity yok mu |
| `signals.hasData()` | `Signal<boolean>` | Store'da entity var mı (isEmpty'nin tersi) |
| `signals.isStale()` | `Signal<boolean>` | Önbelleklenmiş veri eskidi mi |
| `signals.filters()` | `Signal<FilterParams>` | Mevcut filtre değerleri |
| `signals.sort()` | `Signal<SortConfig \| null>` | Mevcut sıralama yapılandırması |
| `pagination.page()` | `Signal<number>` | Mevcut sayfa numarası (1-tabanlı) |
| `pagination.pageSize()` | `Signal<number>` | Mevcut sayfa boyutu |
| `pagination.total()` | `Signal<number>` | Toplam entity sayısı |
| `pagination.totalPages()` | `Signal<number>` | Toplam sayfa sayısı |
| `pagination.hasNext()` | `Signal<boolean>` | Sonraki sayfa var mı |
| `pagination.hasPrev()` | `Signal<boolean>` | Önceki sayfa var mı |

### Tipler

#### EntityId

```typescript
type EntityId = string | number;
```

#### FetchParams

```typescript
interface FetchParams {
  page?: number;
  pageSize?: number;
  filters?: FilterParams;
  sort?: SortConfig;
  signal?: AbortSignal;
}
```

#### FilterParams

```typescript
type FilterParams = Record<string, unknown>;

// Örnek
const filters: FilterParams = {
  status: 'active',
  role: 'admin',
  minAge: 18
};
```

#### SortConfig

```typescript
interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Örnek
const sort: SortConfig = {
  field: 'name',
  direction: 'asc'
};
```

#### PaginatedResponse

```typescript
interface PaginatedResponse<T> {
  data: T[];           // Mevcut sayfa için entity'ler
  total: number;       // Tüm sayfalardaki toplam sayı
  page: number;        // Mevcut sayfa numarası
  pageSize: number;    // Sayfa başına öğe
  totalPages?: number; // Toplam sayfa sayısı (opsiyonel)
}
```

#### LoadingState

```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

#### OptimisticResult

```typescript
interface OptimisticResult {
  rollback: () => void;  // İyimser değişikliği geri al
  confirm: () => void;   // Değişikliği onayla (şu anda no-op)
}
```

#### EntityStoreConfig

```typescript
interface EntityStoreConfig<T> {
  name: string;
  selectId?: (entity: T) => EntityId;
  sortCompare?: (a: T, b: T) => number;
  defaultPageSize?: number;
  cacheTTL?: number;
  optimistic?: boolean;
  localPagination?: boolean;
  persistence?: {
    enabled: boolean;
    storage?: 'localStorage' | 'sessionStorage';
    paths?: Array<'filters' | 'sort' | 'pagination' | 'selection'>;
    key?: string;
  };
}
```

---

## İlgili Dokümantasyon

- **[Alan Tipleri Rehberi](fields.md)** - Kapsamlı alan tipleri dokümantasyonu
- **[Gelişmiş Form](../../DOCUMENTATION.md#enhanced-form-gelişmiş-form)** - Form durum yönetimi
- **[API Katmanı](../../DOCUMENTATION.md#api-layer)** - HTTP istemcisi ve önbellekleme
- **[Örnekler](../../examples/)** - Çalışan kod örnekleri
- **[Demo Uygulaması](../../apps/demo-material/)** - Tam özellikli demo uygulama

---

## v1.x'ten Geçiş

v1.x'ten yükseltiyorsanız, kırılan değişiklikler ve yükseltme yolu için [Geçiş Rehberi](../../MIGRATION.md)'ne bakın.

---

## Destek

- **GitHub Issues**: [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Discussions**: [github.com/biyonik/ng-signalify/discussions](https://github.com/biyonik/ng-signalify/discussions)
- **E-posta**: ahmet.altun60@gmail.com

---

<div align="center">

**Angular topluluğu için ❤️ ile yapıldı**

[⭐ GitHub'da Yıldızla](https://github.com/biyonik/ng-signalify) | [📖 Tam Dokümantasyon](../../DOCUMENTATION.md) | [🚀 Hızlı Başlangıç](../../README.md#hızlı-başlangıç)

</div>
