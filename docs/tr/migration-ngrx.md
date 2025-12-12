# Geçiş Kılavuzu: NgRx → ng-signalify

> **🇬🇧 For English version:** [docs/migration-ngrx.md](../migration-ngrx.md)

## İçindekiler

- [Neden Geçiş Yapmalı?](#neden-geçiş-yapmalı)
- [Temel Farklar](#temel-farklar)
- [Geçiş Stratejisi](#geçiş-stratejisi)
- [Adım Adım Kılavuz](#adım-adım-kılavuz)
- [Yan Yana Karşılaştırmalar](#yan-yana-karşılaştırmalar)
- [Yaygın Desenler](#yaygın-desenler)
- [Sorun Giderme](#sorun-giderme)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

---

## Neden Geçiş Yapmalı?

### ng-signalify'ın Faydaları

| Fayda | Açıklama | Etki |
|-------|----------|------|
| **%87 Daha Az Kod** | ~150 satır NgRx kodu → ~20 satır EntityStore | ⚡ Daha hızlı geliştirme |
| **Signals Tabanlı** | Angular Signals üzerine kurulu, RxJS gerekmez | 🎯 Modern Angular desenleri |
| **Daha Kolay Öğrenme** | Action, reducer, effect öğrenmeye gerek yok | 👨‍💻 Daha hızlı adaptasyon |
| **Daha Küçük Bundle** | @ngrx/store, @ngrx/effects bağımlılıkları yok | 📦 Daha iyi performans |
| **Yerleşik Özellikler** | Sayfalama, filtreleme, önbellekleme hazır | 🚀 Daha az özel kod |
| **Tip Güvenliği** | Tam TypeScript çıkarımı | ✅ Daha az çalışma zamanı hatası |

### Kod Azaltma Örneği

**NgRx (Geleneksel):**
```typescript
// 4 dosyada ~150 satır:
// - actions.ts
// - reducer.ts
// - effects.ts
// - selectors.ts
```

**ng-signalify:**
```typescript
// 1 dosyada ~20 satır:
// - user.store.ts
```

### Ne Zaman Geçiş YAPMAMANIZ Gerekir

Şu durumlarda NgRx'te kalmayı düşünün:

- ❌ **Karmaşık durum orkestrasyon** - Karmaşık bağımlılıklara sahip birden fazla store
- ❌ **Yoğun RxJS kullanımı** - Ekibiniz RxJS desenlerine derin yatırım yapmış
- ❌ **Zaman yolculuğu hata ayıklama** - NgRx DevTools'un zaman yolculuğuna büyük ölçüde güveniyorsunuz
- ❌ **Büyük mevcut kod tabanı** - Geçiş maliyeti faydalardan ağır basıyor (kademeli geçiş mümkün değilse)
- ❌ **Ekip uzmanlığı** - Ekip derin NgRx bilgisine sahip ancak Signals deneyimi yok

ng-signalify şunlar için idealdir:

- ✅ **CRUD ağırlıklı uygulamalar** - Kullanıcı yönetimi, ürün katalogları, yönetim panelleri
- ✅ **Yeni projeler** - Modern Angular ile yeni başlangıç
- ✅ **Modernizasyon** - Eski desenlerden uzaklaşma
- ✅ **Signals benimseme** - Angular'ın signal tabanlı geleceğini benimseme

---

## Temel Farklar

### Karşılaştırma Tablosu

| Özellik | NgRx | ng-signalify |
|---------|------|--------------|
| **Durum** | Store + Reducers | EntityStore (signal tabanlı) |
| **Güncellemeler** | Actions + Reducers | Doğrudan metod çağrıları |
| **Yan Etkiler** | Effects (RxJS) | Async/await metodları |
| **Seçiciler** | Memoize edilmiş seçiciler | Computed signals |
| **DevTools** | Redux DevTools | Tarayıcı DevTools (signals) |
| **Boilerplate** | Yüksek (~150 satır) | Düşük (~20 satır) |
| **Öğrenme Eğrisi** | Dik | Yumuşak |
| **Bundle Boyutu** | Büyük | Küçük |
| **Sayfalama** | Manuel | Yerleşik |
| **Filtreleme** | Manuel | Yerleşik |
| **Önbellekleme** | Manuel | Yerleşik (TTL) |
| **İyimser Güncellemeler** | Manuel | Yerleşik |

### Kavramsal Eşleştirme

| NgRx Kavramı | ng-signalify Eşdeğeri |
|--------------|----------------------|
| `Store` | `EntityStore` |
| `createAction()` | Doğrudan metod çağrıları (`create()`, `update()`, vb.) |
| `createReducer()` | Gerekli değil (durum dahili olarak yönetilir) |
| `createEffect()` | Korumalı async metodlar (`createOne()`, `updateOne()`, vb.) |
| `createSelector()` | `computed()` signals |
| `@ngrx/entity` adapter | EntityStore'a yerleşik |
| Actions dispatch | Doğrudan async metod çağrıları |
| `select()` from store | Signal okuma `store.signals.all()` |

---

## Geçiş Stratejisi

### Seçenek 1: Kademeli Geçiş (Önerilen)

**En iyisi:** Büyük uygulamalar, üretim sistemleri

**Yaklaşım:**
1. Mevcut NgRx kodunu çalışır durumda tutun
2. Bir özellik/modülü aynı anda taşıyın
3. NgRx ve ng-signalify geçici olarak bir arada var olsun
4. Her geçişi iyice test edin
5. Tüm özellikler taşındığında NgRx'i kaldırın

**Zaman çizelgesi:** Uygulama boyutuna bağlı olarak 4-12 hafta

**Örnek:**
```typescript
// 1. Hafta: UserStore'u taşı
// 2. Hafta: ProductStore'u taşı
// 3. Hafta: OrderStore'u taşı
// 4. Hafta: NgRx bağımlılıklarını kaldır
```

**Artıları:**
- ✅ Daha düşük risk
- ✅ Kolayca geri alınabilir
- ✅ Ekip kademeli öğrenebilir

**Eksileri:**
- ❌ Daha uzun geçiş süresi
- ❌ Geçici olarak iki durum yönetim sistemi

### Seçenek 2: Tam Yeniden Yazım

**En iyisi:** Küçük uygulamalar, yeni projeler

**Yaklaşım:**
1. Yeni EntityStore implementasyonları oluşturun
2. Tüm bileşenleri bir seferde güncelleyin
3. Tüm NgRx kodunu kaldırın
4. Tek deployment

**Zaman çizelgesi:** 1-2 hafta

**Artıları:**
- ✅ Temiz geçiş
- ✅ Karışık desen yok

**Eksileri:**
- ❌ Daha yüksek risk
- ❌ Daha fazla test gerekli
- ❌ Geri almak daha zor

---

## Adım Adım Kılavuz

### Adım 1: ng-signalify'ı Yükleyin

```bash
npm install ng-signalify
# veya
pnpm add ng-signalify
```

### Adım 2: NgRx Kodunuzu Analiz Edin

Neyin taşınması gerektiğini belirleyin:

```typescript
// Örnek NgRx yapısı
users/
├── actions/
│   └── user.actions.ts       // ~30 satır
├── reducers/
│   └── user.reducer.ts       // ~40 satır
├── effects/
│   └── user.effects.ts       // ~60 satır
├── selectors/
│   └── user.selectors.ts     // ~20 satır
└── models/
    └── user.model.ts         // Bunu sakla!
```

### Adım 3: EntityStore Oluşturun

**Önce (NgRx):**

```typescript
// user.actions.ts (~30 satır)
import { createAction, props } from '@ngrx/store';
import { User } from '../models/user.model';

export const loadUsers = createAction('[User] Load Users');
export const loadUsersSuccess = createAction(
  '[User] Load Users Success',
  props<{ users: User[] }>()
);
export const loadUsersFailure = createAction(
  '[User] Load Users Failure',
  props<{ error: string }>()
);

export const createUser = createAction(
  '[User] Create User',
  props<{ user: Partial<User> }>()
);
export const createUserSuccess = createAction(
  '[User] Create User Success',
  props<{ user: User }>()
);
export const createUserFailure = createAction(
  '[User] Create User Failure',
  props<{ error: string }>()
);

export const updateUser = createAction(
  '[User] Update User',
  props<{ id: number; changes: Partial<User> }>()
);
export const updateUserSuccess = createAction(
  '[User] Update User Success',
  props<{ user: User }>()
);
export const updateUserFailure = createAction(
  '[User] Update User Failure',
  props<{ error: string }>()
);

export const deleteUser = createAction(
  '[User] Delete User',
  props<{ id: number }>()
);
export const deleteUserSuccess = createAction(
  '[User] Delete User Success',
  props<{ id: number }>()
);
export const deleteUserFailure = createAction(
  '[User] Delete User Failure',
  props<{ error: string }>()
);
```

```typescript
// user.reducer.ts (~40 satır)
import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { User } from '../models/user.model';
import * as UserActions from '../actions/user.actions';

export interface UserState extends EntityState<User> {
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<User> = createEntityAdapter<User>();

export const initialState: UserState = adapter.getInitialState({
  loading: false,
  error: null
});

export const userReducer = createReducer(
  initialState,
  on(UserActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(UserActions.loadUsersSuccess, (state, { users }) =>
    adapter.setAll(users, { ...state, loading: false })
  ),
  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(UserActions.createUserSuccess, (state, { user }) =>
    adapter.addOne(user, state)
  ),
  on(UserActions.updateUserSuccess, (state, { user }) =>
    adapter.updateOne({ id: user.id, changes: user }, state)
  ),
  on(UserActions.deleteUserSuccess, (state, { id }) =>
    adapter.removeOne(id, state)
  )
);
```

```typescript
// user.effects.ts (~60 satır)
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import * as UserActions from '../actions/user.actions';

@Injectable()
export class UserEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      switchMap(() =>
        this.userService.getAll().pipe(
          map((users) => UserActions.loadUsersSuccess({ users })),
          catchError((error) =>
            of(UserActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.createUser),
      switchMap(({ user }) =>
        this.userService.create(user).pipe(
          map((user) => UserActions.createUserSuccess({ user })),
          catchError((error) =>
            of(UserActions.createUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUser),
      switchMap(({ id, changes }) =>
        this.userService.update(id, changes).pipe(
          map((user) => UserActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(UserActions.updateUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.deleteUser),
      switchMap(({ id }) =>
        this.userService.delete(id).pipe(
          map(() => UserActions.deleteUserSuccess({ id })),
          catchError((error) =>
            of(UserActions.deleteUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService
  ) {}
}
```

```typescript
// user.selectors.ts (~20 satır)
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState, adapter } from '../reducers/user.reducer';

export const selectUserState = createFeatureSelector<UserState>('users');

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors(selectUserState);

export const selectUsersLoading = createSelector(
  selectUserState,
  (state) => state.loading
);

export const selectUsersError = createSelector(
  selectUserState,
  (state) => state.error
);

export const selectActiveUsers = createSelector(
  selectAll,
  (users) => users.filter((user) => user.status === 'active')
);
```

**Toplam: 4 dosyada ~150 satır**

**Sonra (ng-signalify):**

```typescript
// user.store.ts (~20 satır)
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';
import { User } from '../models/user.model';

const http = createHttpClient({
  baseUrl: 'https://api.example.com'
});

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000,
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

**Toplam: 1 dosyada ~20 satır** ✨

### Adım 4: Bileşenleri Güncelleyin

**Önce (NgRx):**

```typescript
// user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import * as UserActions from '../actions/user.actions';
import * as UserSelectors from '../selectors/user.selectors';

@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list">
      @if (loading$ | async) {
        <div class="spinner">Yükleniyor...</div>
      }

      @if (error$ | async; as error) {
        <div class="error">{{ error }}</div>
      }

      @for (user of users$ | async; track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button (click)="edit(user)">Düzenle</button>
          <button (click)="delete(user.id)">Sil</button>
        </div>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    this.users$ = this.store.select(UserSelectors.selectAll);
    this.loading$ = this.store.select(UserSelectors.selectUsersLoading);
    this.error$ = this.store.select(UserSelectors.selectUsersError);
  }

  ngOnInit() {
    this.store.dispatch(UserActions.loadUsers());
  }

  edit(user: User) {
    // Düzenleme sayfasına yönlendir
  }

  delete(id: number) {
    if (confirm('Emin misiniz?')) {
      this.store.dispatch(UserActions.deleteUser({ id }));
    }
  }
}
```

**Sonra (ng-signalify):**

```typescript
// user-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { UserStore } from '../stores/user.store';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <div class="user-list">
      @if (store.signals.isLoading()) {
        <div class="spinner">Yükleniyor...</div>
      }

      @if (store.signals.error(); as error) {
        <div class="error">{{ error }}</div>
      }

      @for (user of store.signals.all(); track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button (click)="edit(user)">Düzenle</button>
          <button (click)="delete(user.id)">Sil</button>
        </div>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  edit(user: User) {
    // Düzenleme sayfasına yönlendir
  }

  async delete(id: number) {
    if (confirm('Emin misiniz?')) {
      await this.store.delete(id);
    }
  }
}
```

**Önemli Değişiklikler:**
- ❌ `Observable` veya `async` pipe yok
- ❌ `store.select()` veya seçiciler yok
- ❌ `store.dispatch()` veya action'lar yok
- ✅ Doğrudan signal okumaları: `store.signals.all()`
- ✅ Doğrudan metod çağrıları: `store.loadAll()`, `store.delete()`
- ✅ RxJS yerine async/await

### Adım 5: NgRx'i Kaldırın (Son Adım)

Tüm özellikler taşındıktan sonra:

```bash
npm uninstall @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
```

`app.config.ts` dosyasından kaldırın:
```typescript
// Bunları kaldırın
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// providers'dan kaldırın
providers: [
  // provideStore({ users: userReducer }), // ❌ Kaldır
  // provideEffects([UserEffects]),        // ❌ Kaldır
  // provideStoreDevtools(),               // ❌ Kaldır
]
```

---

## Yan Yana Karşılaştırmalar

### Entity'leri Yükle

**NgRx:**
```typescript
// Bileşen
this.store.dispatch(UserActions.loadUsers());

// Effect (otomatik)
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.loadUsers),
    switchMap(() =>
      this.userService.getAll().pipe(
        map((users) => UserActions.loadUsersSuccess({ users })),
        catchError((error) =>
          of(UserActions.loadUsersFailure({ error: error.message }))
        )
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// Bileşen
await this.store.loadAll();

// Store metodu (EntityStore'dan miras alınmış)
// Ek kod gerekmez!
```

### Entity Oluştur

**NgRx:**
```typescript
// Bileşen
this.store.dispatch(UserActions.createUser({ 
  user: { name: 'Ahmet', email: 'ahmet@example.com' } 
}));

// Effect
createUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.createUser),
    switchMap(({ user }) =>
      this.userService.create(user).pipe(
        map((user) => UserActions.createUserSuccess({ user })),
        catchError((error) =>
          of(UserActions.createUserFailure({ error: error.message }))
        )
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// Bileşen
const user = await this.store.create({ 
  name: 'Ahmet', 
  email: 'ahmet@example.com' 
});

if (!user) {
  // Hatayı işle
  console.error(this.store.signals.error());
}
```

### Entity Güncelle

**NgRx:**
```typescript
// Bileşen
this.store.dispatch(UserActions.updateUser({ 
  id: userId, 
  changes: { name: 'Ayşe' } 
}));

// Effect
updateUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.updateUser),
    switchMap(({ id, changes }) =>
      this.userService.update(id, changes).pipe(
        map((user) => UserActions.updateUserSuccess({ user })),
        catchError((error) =>
          of(UserActions.updateUserFailure({ error: error.message }))
        )
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// Bileşen
const user = await this.store.update(userId, { name: 'Ayşe' });

if (!user) {
  console.error(this.store.signals.error());
}
```

### Entity Sil

**NgRx:**
```typescript
// Bileşen
this.store.dispatch(UserActions.deleteUser({ id: userId }));

// Effect
deleteUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.deleteUser),
    switchMap(({ id }) =>
      this.userService.delete(id).pipe(
        map(() => UserActions.deleteUserSuccess({ id })),
        catchError((error) =>
          of(UserActions.deleteUserFailure({ error: error.message }))
        )
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// Bileşen
const success = await this.store.delete(userId);

if (!success) {
  console.error(this.store.signals.error());
}
```

### Seçiciler vs Computed Signals

**NgRx:**
```typescript
// Seçiciler dosyası
export const selectActiveUsers = createSelector(
  selectAll,
  (users) => users.filter((user) => user.status === 'active')
);

export const selectUserById = (id: number) => createSelector(
  selectEntities,
  (entities) => entities[id]
);

// Bileşen
activeUsers$ = this.store.select(selectActiveUsers);
user$ = this.store.select(selectUserById(userId));
```

**ng-signalify:**
```typescript
// Bileşen
activeUsers = computed(() => 
  this.store.signals.all().filter(u => u.status === 'active')
);

user = computed(() => 
  this.store.signals.byId(userId)()
);

// Veya doğrudan template'te
// {{ store.signals.all().filter(...) }}
```

---

## Yaygın Desenler

### Sayfalama

**NgRx (Manuel):**
```typescript
// Action
export const setPage = createAction(
  '[User] Set Page',
  props<{ page: number; pageSize: number }>()
);

// Reducer
on(UserActions.setPage, (state, { page, pageSize }) => ({
  ...state,
  pagination: { page, pageSize }
})),

// Effect
loadPage$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.setPage),
    switchMap(({ page, pageSize }) =>
      this.userService.getPage(page, pageSize).pipe(
        map((response) => UserActions.loadUsersSuccess({ 
          users: response.data,
          total: response.total 
        }))
      )
    )
  )
);

// Bileşen
nextPage() {
  const currentPage = // ... state'ten al
  this.store.dispatch(UserActions.setPage({ 
    page: currentPage + 1, 
    pageSize: 20 
  }));
}
```

**ng-signalify (Yerleşik):**
```typescript
// Bileşen
nextPage() {
  this.store.nextPage(); // Bu kadar!
}

// Template
<button 
  (click)="store.nextPage()" 
  [disabled]="!store.pagination.hasNext()">
  Sonraki
</button>

<span>Sayfa {{ store.pagination.page() }} / {{ store.pagination.totalPages() }}</span>
```

### Filtreleme

**NgRx (Manuel):**
```typescript
// Action
export const setFilter = createAction(
  '[User] Set Filter',
  props<{ status: string }>()
);

// Reducer
on(UserActions.setFilter, (state, { status }) => ({
  ...state,
  filters: { ...state.filters, status }
})),

// Effect
filterUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.setFilter),
    withLatestFrom(this.store.select(selectFilters)),
    switchMap(([_, filters]) =>
      this.userService.getFiltered(filters).pipe(
        map((users) => UserActions.loadUsersSuccess({ users }))
      )
    )
  )
);
```

**ng-signalify (Yerleşik):**
```typescript
// Bileşen
await this.store.updateFilter('status', 'active');

// Veya birden fazla güncelle
await this.store.updateFilters({
  status: 'active',
  role: 'admin'
});

// Filtreleri temizle
await this.store.clearFilters();
```

### İyimser Güncellemeler

**NgRx (Manuel):**
```typescript
// İyimser güncelleme ile Effect
updateUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.updateUser),
    tap(({ id, changes }) => {
      // İyimser güncelleme
      this.store.dispatch(UserActions.updateUserOptimistic({ id, changes }));
    }),
    switchMap(({ id, changes }) =>
      this.userService.update(id, changes).pipe(
        map((user) => UserActions.updateUserSuccess({ user })),
        catchError((error) => {
          // Geri al
          this.store.dispatch(UserActions.updateUserRollback({ id }));
          return of(UserActions.updateUserFailure({ error }));
        })
      )
    )
  )
);

// Ek action'lar ve reducer mantığı gerekli
```

**ng-signalify (Yerleşik):**
```typescript
// Sadece config'de etkinleştir
super({
  name: 'users',
  optimistic: true // Bu kadar!
});

// Artık tüm güncellemeler otomatik olarak iyimser
await this.store.update(userId, { status: 'inactive' });
// UI anında güncellenir, hata durumunda geri alınır
```

---

## Sorun Giderme

### Karmaşık Effect'ler

**Problem:** Birden fazla bağımlılığa sahip karmaşık effect'leriniz var.

**NgRx:**
```typescript
complexEffect$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.createUser),
    withLatestFrom(
      this.store.select(selectCurrentOrg),
      this.store.select(selectUserSettings)
    ),
    switchMap(([action, org, settings]) =>
      this.userService.create({
        ...action.user,
        organizationId: org.id,
        settings: settings
      }).pipe(
        mergeMap((user) => [
          UserActions.createUserSuccess({ user }),
          NotificationActions.showSuccess({ message: 'Kullanıcı oluşturuldu' }),
          AuditActions.logAction({ action: 'USER_CREATED', userId: user.id })
        ])
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// create metodunu override et
override async create(data: Partial<User>): Promise<User | null> {
  // Diğer store'lara doğrudan eriş
  const org = this.orgStore.signals.selected();
  const settings = this.settingsStore.signals.current();
  
  const user = await super.create({
    ...data,
    organizationId: org?.id,
    settings: settings
  });
  
  if (user) {
    this.notificationService.showSuccess('Kullanıcı oluşturuldu');
    this.auditService.log('USER_CREATED', user.id);
  }
  
  return user;
}
```

**Temel Fark:** Karmaşık mantık için imperatif kod genellikle reaktif akışlardan daha açıktır.

### Büyük Kod Tabanları

**Problem:** Yüzlerce action tipi ve effect taşınması gerekiyor.

**Çözüm:** Kademeli geçiş

1. **Faz 1: Sadece yeni özellikler**
   - Tüm yeni özellikler ng-signalify kullanır
   - Mevcut özellikler NgRx'te kalır

2. **Faz 2: Yoğun trafik özellikler**
   - En çok kullanılan sayfaları önce taşı
   - Maksimum kullanıcı etkisi

3. **Faz 3: Düşük riskli özellikler**
   - Yönetim panellerini, ayar sayfalarını taşı
   - Daha az kullanım, sorunları düzeltmek daha kolay

4. **Faz 4: Tamamlama**
   - NgRx bağımlılıklarını kaldır
   - Kodu temizle

**Zaman çizelgesi:** Büyük uygulamalar için 3-6 ay

### Test Etme

**Problem:** Testleri güncelleme gerekiyor.

**NgRx Testleri:**
```typescript
describe('UserEffects', () => {
  it('kullanıcıları başarıyla yüklemeli', (done) => {
    const users = [mockUser1, mockUser2];
    const action = UserActions.loadUsers();
    const completion = UserActions.loadUsersSuccess({ users });

    actions$ = of(action);
    userService.getAll.mockReturnValue(of(users));

    effects.loadUsers$.subscribe((result) => {
      expect(result).toEqual(completion);
      done();
    });
  });
});
```

**ng-signalify Testleri:**
```typescript
describe('UserStore', () => {
  it('kullanıcıları başarıyla yüklemeli', async () => {
    const users = [mockUser1, mockUser2];
    http.get.mockResolvedValue({ data: { data: users, total: 2 } });

    await store.loadAll();

    expect(store.signals.all()).toEqual(users);
    expect(store.signals.isLoading()).toBe(false);
    expect(store.signals.error()).toBeNull();
  });
});
```

**Temel Fark:** Async/await ile daha basit, senkron tarzda testler.

---

## En İyi Uygulamalar

### 1. Entity Başına Bir Store

**Yapın:**
```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {}

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {}
```

**Yapmayın:**
```typescript
// İlgisiz entity'leri birleştirmekten kaçının
export class AppStore {
  users: EntityStore<User>;
  products: EntityStore<Product>;
}
```

### 2. İş Mantığını Store'da Tutun

**Yapın:**
```typescript
// user.store.ts
export class UserStore extends EntityStore<User> {
  async activateUser(id: number): Promise<boolean> {
    const user = await this.update(id, { 
      status: 'active',
      activatedAt: new Date() 
    });
    
    if (user) {
      this.emailService.sendActivationEmail(user);
      this.auditService.log('USER_ACTIVATED', id);
    }
    
    return !!user;
  }
}
```

**Yapmayın:**
```typescript
// Bileşen (çok fazla mantık)
async activateUser(id: number) {
  const user = await this.store.update(id, { status: 'active' });
  if (user) {
    this.emailService.sendActivationEmail(user);
    this.auditService.log('USER_ACTIVATED', id);
  }
}
```

### 3. Türetilmiş Durum için Computed Signals Kullanın

**Yapın:**
```typescript
export class DashboardComponent {
  store = inject(UserStore);
  
  activeUsers = computed(() => 
    this.store.signals.all().filter(u => u.status === 'active')
  );
  
  userCount = computed(() => 
    this.activeUsers().length
  );
}
```

**Yapmayın:**
```typescript
// Her erişimde yeniden hesaplama
get activeUsers() {
  return this.store.signals.all().filter(u => u.status === 'active');
}
```

### 4. Hataları İyi Yönetin

**Yapın:**
```typescript
async saveUser(data: Partial<User>) {
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

**Yapmayın:**
```typescript
// Sessiz hatalar
async saveUser(data: Partial<User>) {
  await this.store.create(data);
  this.router.navigate(['/users']); // Oluşturulmamış olabilir!
}
```

### 5. Yerleşik Özellikleri Kullanın

**Yapın:**
```typescript
// Yerleşik sayfalamayı kullan
super({
  name: 'users',
  defaultPageSize: 20
});

// Bileşen
nextPage() {
  this.store.nextPage();
}
```

**Yapmayın:**
```typescript
// Manuel sayfalama
currentPage = signal(1);
pageSize = signal(20);

async nextPage() {
  this.currentPage.update(p => p + 1);
  await this.store.loadAll({ 
    page: this.currentPage(), 
    pageSize: this.pageSize() 
  });
}
```

---

## Özet

### Geçiş Kontrol Listesi

- [ ] ng-signalify'ı yükle
- [ ] Geçiş stratejisini seç (kademeli vs tam)
- [ ] EntityStore sınıfları oluştur
- [ ] Soyut metodları uygula (fetchAll, fetchOne, vb.)
- [ ] Bileşenleri store signal'larını kullanacak şekilde güncelle
- [ ] NgRx action'larını, reducer'larını, effect'lerini, seçicilerini kaldır
- [ ] Testleri güncelle
- [ ] @ngrx bağımlılıklarını kaldır

### Önemli Çıkarımlar

1. **Daha Az Kod:** Boilerplate'te %87 azalma
2. **Modern Desenler:** Signal tabanlı, async/await
3. **Yerleşik Özellikler:** Sayfalama, filtreleme, önbellekleme dahil
4. **Tip Güvenliği:** Tam TypeScript desteği
5. **Kolay Öğrenme:** NgRx'ten daha basit zihinsel model

### Sonraki Adımlar

- [EntityStore Dokümantasyonu](store.md)'nu okuyun
- [API Referansı](../DOCUMENTATION.md)'nı inceleyin
- [Örnek Uygulamalar](../apps/demo-material/)'ı keşfedin
- [GitHub Tartışmalar](https://github.com/biyonik/ng-signalify/discussions)'a katılın

---

## İlgili Dokümantasyon

- [EntityStore API](store.md)
- [Angular Forms Geçişi](migration-forms.md)
- [Ana Dokümantasyon](../DOCUMENTATION.md)
- [README](../README.md)

---

<div align="center">

**Durum yönetiminizi basitleştirmeye hazır mısınız?**

[⭐ GitHub'da Yıldızla](https://github.com/biyonik/ng-signalify) | [📖 Tam Dokümantasyon](../DOCUMENTATION.md) | [🚀 Hızlı Başlangıç](../README.md#quick-start)

</div>
