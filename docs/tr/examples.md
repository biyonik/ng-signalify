# Örnekler Koleksiyonu

> **🇬🇧 For English version:** [docs/examples.md](../examples.md)

## İçindekiler

- [1. Basit Giriş Formu](#1-basit-giriş-formu)
- [2. EntityStore ile CRUD](#2-entitystore-i̇le-crud)
- [3. Ana-Detay Deseni](#3-ana-detay-deseni)
- [4. Filtrelerle Arama](#4-filtrelerle-arama)
- [5. Sıralanabilir Tablo](#5-sıralanabilir-tablo)
- [6. Çok Adımlı Form](#6-çok-adımlı-form)
- [7. Dinamik Form (ArrayField)](#7-dinamik-form-arrayfield)
- [8. Hesaplanmış Türetilmiş Durum](#8-hesaplanmış-türetilmiş-durum)
- [9. Sonsuz Kaydırma](#9-sonsuz-kaydırma)
- [10. İlerleme ile Dosya Yükleme](#10-i̇lerleme-i̇le-dosya-yükleme)
- [11. Gerçek Zamanlı Güncellemeler](#11-gerçek-zamanlı-güncellemeler)
- [12. Material Entegrasyonu](#12-material-entegrasyonu)
- [13. PrimeNG Entegrasyonu](#13-primeng-entegrasyonu)
- [Daha Fazla Örnek](#daha-fazla-örnek)

---

## 1. Basit Giriş Formu

E-posta ve şifre doğrulamalı temel giriş formu.

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmailField, PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <h1>Giriş Yap</h1>
      
      <form (submit)="onSubmit($event)">
        <div class="form-field">
          <label>{{ emailField.label }}</label>
          <input 
            type="email"
            [value]="emailField.value()"
            (input)="emailField.setValue($event.target.value)"
            (blur)="emailField.touch()" />
          @if (emailField.touched() && emailField.error()) {
            <span class="error">{{ emailField.error() }}</span>
          }
        </div>

        <div class="form-field">
          <label>{{ passwordField.label }}</label>
          <input 
            type="password"
            [value]="passwordField.value()"
            (input)="passwordField.setValue($event.target.value)"
            (blur)="passwordField.touch()" />
          @if (passwordField.touched() && passwordField.error()) {
            <span class="error">{{ passwordField.error() }}</span>
          }
        </div>

        <button 
          type="submit"
          [disabled]="!isFormValid()">
          Giriş Yap
        </button>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
    }
    .form-field {
      margin-bottom: 1rem;
    }
    input {
      width: 100%;
      padding: 0.5rem;
    }
    .error {
      color: #d32f2f;
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
  emailField = new EmailField('email', 'E-posta Adresi', {
    required: true
  });

  passwordField = new PasswordField('password', 'Şifre', {
    required: true,
    min: 8
  });

  constructor(private router: Router) {}

  isFormValid(): boolean {
    return this.emailField.isValid() && this.passwordField.isValid();
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    this.emailField.touch();
    this.passwordField.touch();

    if (!this.isFormValid()) {
      return;
    }

    const credentials = {
      email: this.emailField.value(),
      password: this.passwordField.value()
    };

    try {
      await this.login(credentials);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Giriş başarısız:', error);
    }
  }

  private async login(credentials: any) {
    // Giriş mantığınızı uygulayın
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  }
}
```

---

## 2. EntityStore ile CRUD

Veri tablosu ile tam CRUD işlemleri.

### Store Kurulumu

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EntityStore } from 'ng-signalify/store';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  private http = inject(HttpClient);

  constructor() {
    super({
      name: 'users',
      defaultPageSize: 20,
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters', 'sort', 'pagination']
      }
    });
  }

  async loadAllApi() {
    const params = {
      page: this.pagination.page(),
      size: this.pagination.pageSize(),
      ...this.filters(),
      sortBy: this.sort()?.field,
      sortDirection: this.sort()?.direction
    };

    const response = await firstValueFrom(
      this.http.get<{ items: User[]; total: number }>('/api/users', { params })
    );

    this.pagination.setTotal(response.total);
    return response.items;
  }

  async loadOneApi(id: number) {
    return firstValueFrom(
      this.http.get<User>(`/api/users/${id}`)
    );
  }

  async createApi(data: Partial<User>) {
    return firstValueFrom(
      this.http.post<User>('/api/users', data)
    );
  }

  async updateApi(id: number, data: Partial<User>) {
    return firstValueFrom(
      this.http.put<User>(`/api/users/${id}`, data)
    );
  }

  async deleteApi(id: number) {
    await firstValueFrom(
      this.http.delete(`/api/users/${id}`)
    );
  }
}
```

### Bileşen

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from './user.store';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-list">
      <h1>Kullanıcılar</h1>

      <div class="actions">
        <button (click)="createUser()">Kullanıcı Ekle</button>
      </div>

      @if (store.signals.isLoading()) {
        <div class="loading">Yükleniyor...</div>
      }

      @if (store.signals.error()) {
        <div class="error">{{ store.signals.error() }}</div>
      }

      <table>
        <thead>
          <tr>
            <th>İsim</th>
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
                <button (click)="editUser(user)">Düzenle</button>
                <button (click)="deleteUser(user.id)">Sil</button>
              </td>
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
        </span>
        <button 
          (click)="store.nextPage()"
          [disabled]="!store.pagination.hasNext()">
          Sonraki
        </button>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  async createUser() {
    const newUser = await this.store.create({
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      role: 'user',
      status: 'active'
    });
    console.log('Oluşturuldu:', newUser);
  }

  async editUser(user: any) {
    await this.store.update(user.id, {
      ...user,
      name: 'Güncellenmiş İsim'
    });
  }

  async deleteUser(id: number) {
    if (confirm('Emin misiniz?')) {
      await this.store.delete(id);
    }
  }
}
```

**Tam demo için:** [apps/demo-material](../../apps/demo-material)

---

## 3. Ana-Detay Deseni

Seçim ve detay görünümü ile liste.

```typescript
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore, User } from './user.store';

@Component({
  selector: 'app-user-master-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="master-detail">
      <!-- Ana: Liste -->
      <div class="master">
        <h2>Kullanıcılar</h2>
        @for (user of store.signals.all(); track user.id) {
          <div 
            class="user-item"
            [class.selected]="selectedUser()?.id === user.id"
            (click)="selectUser(user.id)">
            {{ user.name }}
          </div>
        }
      </div>

      <!-- Detay: Seçili Kullanıcı -->
      <div class="detail">
        @if (selectedUser()) {
          <h2>Kullanıcı Detayları</h2>
          <div>
            <strong>İsim:</strong> {{ selectedUser()!.name }}
          </div>
          <div>
            <strong>E-posta:</strong> {{ selectedUser()!.email }}
          </div>
          <div>
            <strong>Rol:</strong> {{ selectedUser()!.role }}
          </div>
          <div>
            <strong>Durum:</strong> {{ selectedUser()!.status }}
          </div>
        } @else {
          <p>Detayları görüntülemek için bir kullanıcı seçin</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .master-detail {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1rem;
    }
    .user-item {
      padding: 0.5rem;
      cursor: pointer;
      border-bottom: 1px solid #ddd;
    }
    .user-item.selected {
      background: #e3f2fd;
    }
  `]
})
export class UserMasterDetailComponent {
  protected store = inject(UserStore);

  // Computed signal olarak seçili kullanıcı
  selectedUser = computed(() => {
    const selectedId = this.store.signals.selectedId();
    if (!selectedId) return null;
    return this.store.signals.entityMap()[selectedId] || null;
  });

  async selectUser(id: number) {
    this.store.selectOne(id);
    await this.store.loadOne(id); // Taze veri yükle
  }
}
```

---

## 4. Filtrelerle Arama

Debounce edilmiş arama ile birden fazla filtre.

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserStore } from './user.store';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filters">
      <input 
        placeholder="İsimle ara..."
        (input)="onSearchInput($event.target.value)" />

      <select (change)="onRoleChange($event.target.value)">
        <option value="">Tüm Roller</option>
        <option value="admin">Yönetici</option>
        <option value="user">Kullanıcı</option>
        <option value="guest">Misafir</option>
      </select>

      <select (change)="onStatusChange($event.target.value)">
        <option value="">Tüm Durumlar</option>
        <option value="active">Aktif</option>
        <option value="inactive">Pasif</option>
      </select>

      <button (click)="clearFilters()">Tümünü Temizle</button>
    </div>

    <!-- Aktif filtreleri göster -->
    <div class="active-filters">
      @if (store.filters()['search']) {
        <span class="badge">
          Arama: {{ store.filters()['search'] }}
          <button (click)="store.clearFilter('search')">×</button>
        </span>
      }
      @if (store.filters()['role']) {
        <span class="badge">
          Rol: {{ store.filters()['role'] }}
          <button (click)="store.clearFilter('role')">×</button>
        </span>
      }
      @if (store.filters()['status']) {
        <span class="badge">
          Durum: {{ store.filters()['status'] }}
          <button (click)="store.clearFilter('status')">×</button>
        </span>
      }
    </div>

    <!-- Sonuçlar -->
    <div class="results">
      @for (user of store.signals.all(); track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="role">{{ user.role }}</span>
          <span class="status">{{ user.status }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .badge {
      background: #e3f2fd;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.5rem;
    }
  `]
})
export class UserSearchComponent implements OnInit {
  protected store = inject(UserStore);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Arama girişini debounce et
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.store.updateFilter('search', query);
    });

    this.store.loadAll();
  }

  onSearchInput(query: string) {
    this.searchSubject.next(query);
  }

  async onRoleChange(role: string) {
    await this.store.updateFilter('role', role);
  }

  async onStatusChange(status: string) {
    await this.store.updateFilter('status', status);
  }

  async clearFilters() {
    await this.store.clearFilters();
  }
}
```

---

## 5. Sıralanabilir Tablo

Sıralamak için sütun başlıklarına tıklayın.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from './user.store';

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table>
      <thead>
        <tr>
          <th (click)="sortBy('name')">
            İsim {{ getSortIcon('name') }}
          </th>
          <th (click)="sortBy('email')">
            E-posta {{ getSortIcon('email') }}
          </th>
          <th (click)="sortBy('role')">
            Rol {{ getSortIcon('role') }}
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
            <td>{{ user.role }}</td>
            <td>{{ user.createdAt | date }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    th {
      cursor: pointer;
      user-select: none;
    }
    th:hover {
      background: #f5f5f5;
    }
  `]
})
export class SortableTableComponent {
  protected store = inject(UserStore);

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
    if (sort?.field !== field) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  }
}
```

---

## 6. Çok Adımlı Form

Validasyonlu her adım için birden fazla form.

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StringField, EmailField, PasswordField, SelectField } from 'ng-signalify/fields';

@Component({
  selector: 'app-multi-step-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wizard">
      <div class="steps">
        <div [class.active]="currentStep() === 1">1. Kişisel Bilgiler</div>
        <div [class.active]="currentStep() === 2">2. Hesap</div>
        <div [class.active]="currentStep() === 3">3. Tercihler</div>
      </div>

      @if (currentStep() === 1) {
        <div class="step">
          <h2>Kişisel Bilgiler</h2>
          <!-- İsim alanı -->
          <input 
            [value]="nameField.value()"
            (input)="nameField.setValue($event.target.value)"
            (blur)="nameField.touch()" />
          @if (nameField.error()) {
            <span class="error">{{ nameField.error() }}</span>
          }
        </div>
      }

      @if (currentStep() === 2) {
        <div class="step">
          <h2>Hesap Detayları</h2>
          <!-- E-posta ve şifre alanları -->
        </div>
      }

      @if (currentStep() === 3) {
        <div class="step">
          <h2>Tercihler</h2>
          <!-- Tercih alanları -->
        </div>
      }

      <div class="actions">
        <button 
          (click)="previousStep()"
          [disabled]="currentStep() === 1">
          Önceki
        </button>
        
        @if (currentStep() < 3) {
          <button (click)="nextStep()">Sonraki</button>
        } @else {
          <button (click)="submit()">Gönder</button>
        }
      </div>
    </div>
  `
})
export class MultiStepFormComponent {
  currentStep = signal(1);

  // Adım 1 alanları
  nameField = new StringField('name', 'Tam Ad', { required: true });

  // Adım 2 alanları
  emailField = new EmailField('email', 'E-posta', { required: true });
  passwordField = new PasswordField('password', 'Şifre', { required: true, min: 8 });

  // Adım 3 alanları
  themeField = new SelectField('theme', 'Tema', {
    required: true,
    choices: [
      { value: 'light', label: 'Açık' },
      { value: 'dark', label: 'Koyu' }
    ]
  });

  nextStep() {
    // Mevcut adımı doğrula
    if (this.currentStep() === 1 && !this.nameField.isValid()) {
      this.nameField.touch();
      return;
    }
    if (this.currentStep() === 2 && (!this.emailField.isValid() || !this.passwordField.isValid())) {
      this.emailField.touch();
      this.passwordField.touch();
      return;
    }

    this.currentStep.set(this.currentStep() + 1);
  }

  previousStep() {
    this.currentStep.set(this.currentStep() - 1);
  }

  submit() {
    const formData = {
      name: this.nameField.value(),
      email: this.emailField.value(),
      password: this.passwordField.value(),
      theme: this.themeField.value()
    };
    console.log('Form gönderildi:', formData);
  }
}
```

---

## 7. Dinamik Form (ArrayField)

Dinamik olarak öğe ekle/kaldır.

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArrayField, StringField } from 'ng-signalify/fields';

@Component({
  selector: 'app-dynamic-tags',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Etiketler</h2>

      @for (tag of tagsField.value(); track $index) {
        <div class="tag-item">
          <input 
            [value]="tag"
            (input)="updateTag($index, $event.target.value)" />
          <button (click)="removeTag($index)">Kaldır</button>
        </div>
      }

      <button (click)="addTag()">Etiket Ekle</button>

      @if (tagsField.error()) {
        <span class="error">{{ tagsField.error() }}</span>
      }
    </div>
  `
})
export class DynamicTagsComponent {
  tagsField = new ArrayField('tags', 'Etiketler', {
    required: true,
    min: 1,
    max: 5,
    itemField: new StringField('tag', 'Etiket', { min: 2, max: 20 })
  });

  constructor() {
    this.tagsField.setValue(['angular', 'typescript']);
  }

  addTag() {
    const current = this.tagsField.value() || [];
    this.tagsField.setValue([...current, '']);
  }

  removeTag(index: number) {
    const current = this.tagsField.value() || [];
    this.tagsField.setValue(current.filter((_, i) => i !== index));
  }

  updateTag(index: number, value: string) {
    const current = this.tagsField.value() || [];
    const updated = [...current];
    updated[index] = value;
    this.tagsField.setValue(updated);
  }
}
```

---

## 8. Hesaplanmış Türetilmiş Durum

Computed sinyaller ile entity'leri filtrele.

```typescript
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from './user.store';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats">
      <div class="stat">
        <h3>Toplam Kullanıcı</h3>
        <p>{{ totalUsers() }}</p>
      </div>
      <div class="stat">
        <h3>Aktif Kullanıcılar</h3>
        <p>{{ activeUsers().length }}</p>
      </div>
      <div class="stat">
        <h3>Yöneticiler</h3>
        <p>{{ adminUsers().length }}</p>
      </div>
    </div>

    <h2>Aktif Kullanıcılar</h2>
    @for (user of activeUsers(); track user.id) {
      <div>{{ user.name }} - {{ user.email }}</div>
    }
  `
})
export class UserStatsComponent {
  protected store = inject(UserStore);

  // Computed: toplam sayı
  totalUsers = computed(() => this.store.signals.all().length);

  // Computed: aktif kullanıcıları filtrele
  activeUsers = computed(() => 
    this.store.signals.all().filter(u => u.status === 'active')
  );

  // Computed: yöneticileri filtrele
  adminUsers = computed(() =>
    this.store.signals.all().filter(u => u.role === 'admin')
  );
}
```

---

## 9. Sonsuz Kaydırma

Kaydırmada sonraki sayfayı yükle.

```typescript
import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from './user.store';

@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list">
      @for (user of store.signals.all(); track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
        </div>
      }

      @if (store.signals.isLoading()) {
        <div class="loading">Daha fazla yükleniyor...</div>
      }

      @if (!store.pagination.hasNext()) {
        <div class="end">Başka kullanıcı yok</div>
      }
    </div>
  `
})
export class InfiniteScrollComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  @HostListener('window:scroll', ['$event'])
  async onScroll() {
    const threshold = 200;
    const position = window.pageYOffset + window.innerHeight;
    const height = document.documentElement.scrollHeight;

    if (position > height - threshold && 
        !this.store.signals.isLoading() && 
        this.store.pagination.hasNext()) {
      await this.store.nextPage();
    }
  }
}
```

---

## 10. İlerleme ile Dosya Yükleme

Yükleme ilerlemesi ile özel FileField.

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { inject } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <input 
        type="file"
        (change)="onFileSelected($event)" />

      @if (uploadProgress() > 0) {
        <div class="progress-bar">
          <div 
            class="progress" 
            [style.width.%]="uploadProgress()">
            %{{ uploadProgress() }}
          </div>
        </div>
      }

      @if (uploadedFile()) {
        <div class="success">
          Dosya yüklendi: {{ uploadedFile() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s;
    }
  `]
})
export class FileUploadComponent {
  private http = inject(HttpClient);
  uploadProgress = signal(0);
  uploadedFile = signal<string | null>(null);

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post('/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.uploadProgress.set(progress);
        } else if (event.type === HttpEventType.Response) {
          this.uploadedFile.set(file.name);
          this.uploadProgress.set(0);
        }
      },
      error: (error) => {
        console.error('Yükleme başarısız:', error);
        this.uploadProgress.set(0);
      }
    });
  }
}
```

---

## 11. Gerçek Zamanlı Güncellemeler

EntityStore ile WebSocket entegrasyonu.

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from './user.store';

@Component({
  selector: 'app-realtime-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Kullanıcılar (Gerçek Zamanlı)</h2>
      @for (user of store.signals.all(); track user.id) {
        <div class="user-card">
          {{ user.name }} - {{ user.status }}
        </div>
      }
    </div>
  `
})
export class RealtimeUsersComponent implements OnInit, OnDestroy {
  protected store = inject(UserStore);
  private ws?: WebSocket;

  ngOnInit() {
    this.store.loadAll();
    this.connectWebSocket();
  }

  ngOnDestroy() {
    this.ws?.close();
  }

  private connectWebSocket() {
    this.ws = new WebSocket('ws://localhost:3000/users');

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'user_created':
          this.store.addOne(message.data);
          break;
        case 'user_updated':
          this.store.updateOne(message.data.id, message.data);
          break;
        case 'user_deleted':
          this.store.removeOne(message.data.id);
          break;
      }
    };
  }
}
```

---

## 12. Material Entegrasyonu

ng-signalify'ı Angular Material ile kullanma.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserStore } from './user.store';

@Component({
  selector: 'app-material-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-form-field>
      <mat-label>Ara</mat-label>
      <input 
        matInput
        (input)="store.updateFilter('search', $event.target.value)" />
    </mat-form-field>

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
      [pageSizeOptions]="[10, 20, 50]"
      (page)="onPageChange($event)">
    </mat-paginator>
  `
})
export class MaterialTableComponent {
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

---

## 13. PrimeNG Entegrasyonu

ng-signalify'ı PrimeNG ile kullanma.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { UserStore } from './user.store';

@Component({
  selector: 'app-primeng-table',
  standalone: true,
  imports: [CommonModule, TableModule, InputTextModule],
  template: `
    <p-table
      [value]="store.signals.all()"
      [lazy]="true"
      [rows]="store.pagination.pageSize()"
      [totalRecords]="store.pagination.total()"
      [paginator]="true"
      (onLazyLoad)="onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th>
            <p-columnFilter field="name" type="text">
            </p-columnFilter>
            İsim
          </th>
          <th>E-posta</th>
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
export class PrimeNGTableComponent {
  protected store = inject(UserStore);

  async onLazyLoad(event: any) {
    const page = (event.first / event.rows) + 1;
    await this.store.goToPage(page);

    if (event.filters?.name?.value) {
      await this.store.updateFilter('name', event.filters.name.value);
    }
  }
}
```

---

## Daha Fazla Örnek

### Demo Uygulamaları

Tam özellikli demo uygulamalarını keşfedin:

- **[Material Demo](../../apps/demo-material)** - Angular Material ile tam uygulama
- **GitHub Deposu** - [github.com/biyonik/ng-signalify](https://github.com/biyonik/ng-signalify)

### Ek Kaynaklar

- [Alan Tipleri Dokümantasyonu](fields.md)
- [Entity Store Dokümantasyonu](store.md)
- [Validasyon Kılavuzu](validation.md)
- [Sayfalama Kılavuzu](pagination.md)
- [Kalıcılık Kılavuzu](persistence.md)

---

**ng-signalify ile harika uygulamalar oluşturun! 🚀**
