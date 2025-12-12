# Entity Store API Documentation

> **🇹🇷 For Turkish version:** [docs/tr/store.md](tr/store.md)

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [CRUD Operations](#crud-operations)
- [Pagination](#pagination)
- [Filtering & Sorting](#filtering--sorting)
- [State Signals](#state-signals)
- [Optimistic Updates](#optimistic-updates)
- [State Persistence](#state-persistence)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

### What is EntityStore?

**EntityStore** is a signal-based state management solution for CRUD operations in Angular 19+ applications. It provides a standardized, type-safe way to manage collections of entities with built-in support for:

- ✅ **CRUD Operations** - Create, Read, Update, Delete
- ✅ **Pagination** - Automatic page management with signals
- ✅ **Filtering & Sorting** - Built-in filter and sort state
- ✅ **Caching** - TTL-based caching with auto-invalidation
- ✅ **Optimistic Updates** - Instant UI updates with rollback
- ✅ **State Persistence** - Save/restore filters, sorting, and pagination
- ✅ **Auto-Cancellation** - Race condition prevention
- ✅ **Selection Management** - Single and multi-select support
- ✅ **Reactive Signals** - Full Angular Signals integration

### When to Use EntityStore?

EntityStore is ideal for:

- 📋 **Data Tables** - User lists, product catalogs, orders
- 🔍 **Search & Filter UI** - Advanced filtering with persistence
- 📊 **Dashboards** - Real-time data with caching
- 📱 **Master-Detail Views** - Entity selection and details
- 🔄 **Real-time Updates** - WebSocket integration
- 📦 **Offline Support** - Local state persistence

### Architecture

```
┌──────────────────────────────────────────────────┐
│              Angular Component                    │
│                                                   │
│  store.signals.all() ──> Display Data            │
│  store.pagination.page() ──> Show Page           │
│  store.signals.isLoading() ──> Show Spinner      │
└────────────────┬──────────────────┬──────────────┘
                 │                  │
                 ▼                  ▼
        ┌────────────────┐  ┌──────────────┐
        │  User Actions  │  │   Signals    │
        │                │  │  (Reactive)  │
        │  loadAll()     │  │              │
        │  create()      │  │  all()       │
        │  update()      │  │  selected()  │
        │  delete()      │  │  isLoading() │
        │  goToPage()    │  │  error()     │
        └────────┬───────┘  └──────────────┘
                 │
                 ▼
     ┌───────────────────────────┐
     │     EntityStore           │
     │   (State Management)      │
     │                           │
     │  - State Signal           │
     │  - Pagination             │
     │  - Filters/Sort           │
     │  - Cache TTL              │
     │  - Optimistic Updates     │
     └────────────┬──────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │   API Layer      │
        │                  │
        │  fetchAll()      │
        │  fetchOne()      │
        │  createOne()     │
        │  updateOne()     │
        │  deleteOne()     │
        └──────────────────┘
```


---

## Quick Start

### 1. Define Your Entity

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

### 2. Create Store

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
      cacheTTL: 5 * 60 * 1000, // 5 minutes
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

### 3. Use in Component

```typescript
// user-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { UserStore } from './user.store';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <!-- Loading State -->
    @if (store.signals.isLoading()) {
      <div class="spinner">Loading...</div>
    }

    <!-- Error State -->
    @if (store.signals.error()) {
      <div class="error">{{ store.signals.error() }}</div>
    }

    <!-- Data Table -->
    @if (store.signals.hasData()) {
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
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
                <button (click)="edit(user)">Edit</button>
                <button (click)="delete(user.id)">Delete</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          (click)="store.prevPage()" 
          [disabled]="!store.pagination.hasPrev()">
          Previous
        </button>
        
        <span>
          Page {{ store.pagination.page() }} of {{ store.pagination.totalPages() }}
          ({{ store.pagination.total() }} total)
        </span>
        
        <button 
          (click)="store.nextPage()" 
          [disabled]="!store.pagination.hasNext()">
          Next
        </button>
      </div>
    }

    <!-- Empty State -->
    @if (store.signals.isEmpty() && !store.signals.isLoading()) {
      <div class="empty">No users found</div>
    }
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }

  async edit(user: User) {
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

## Configuration

### EntityStoreConfig Interface

```typescript
interface EntityStoreConfig<T> {
  // Required
  name: string;                    // Store identifier
  
  // Optional
  selectId?: (entity: T) => EntityId;        // ID selector (default: e => e.id)
  sortCompare?: (a: T, b: T) => number;      // Custom sort function
  defaultPageSize?: number;                   // Default page size (default: 10)
  cacheTTL?: number;                         // Cache time-to-live in ms (default: 5 min)
  optimistic?: boolean;                       // Enable optimistic updates (default: true)
  localPagination?: boolean;                  // Client-side pagination (default: false)
  persistence?: PersistenceConfig;            // State persistence settings
}
```

### Configuration Options

#### name (required)

Unique identifier for the store. Used for persistence keys and debugging.

```typescript
super({
  name: 'users' // Must be unique across application
});
```

#### selectId

Function to extract entity ID. Defaults to `(e) => e.id`.

```typescript
super({
  name: 'users',
  selectId: (user) => user.userId // Custom ID field
});
```

#### sortCompare

Custom sorting function for client-side sorting.

```typescript
super({
  name: 'users',
  sortCompare: (a, b) => a.name.localeCompare(b.name)
});
```

#### defaultPageSize

Default number of items per page.

```typescript
super({
  name: 'users',
  defaultPageSize: 20 // Default: 10
});
```

#### cacheTTL

Cache duration in milliseconds. Data older than TTL is considered stale.

```typescript
super({
  name: 'users',
  cacheTTL: 10 * 60 * 1000 // 10 minutes (default: 5 minutes)
});
```

#### optimistic

Enable optimistic updates for better UX.

```typescript
super({
  name: 'users',
  optimistic: true // Default: true
});
```

#### localPagination

Enable client-side pagination (all data loaded, paginated locally).

```typescript
super({
  name: 'users',
  localPagination: true // Default: false (server-side)
});
```

#### persistence

State persistence configuration. See [State Persistence](#state-persistence) for details.

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage', // or 'localStorage'
    paths: ['filters', 'sort', 'pagination'], // What to persist
    key: 'my_custom_key' // Optional custom storage key
  }
});
```

### Complete Configuration Example

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      sortCompare: (a, b) => a.name.localeCompare(b.name),
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
  // ... implement abstract methods
}
```


---

## CRUD Operations

### loadAll()

Loads entities with pagination, filtering, and sorting.

#### Signature

```typescript
async loadAll(params?: Partial<FetchParams>): Promise<void>
```

#### Parameters

```typescript
interface FetchParams {
  page?: number;              // Page number (1-indexed)
  pageSize?: number;          // Items per page
  filters?: FilterParams;     // Key-value filter object
  sort?: SortConfig;          // Sort configuration
  signal?: AbortSignal;       // For cancellation
}
```

#### Examples

**Basic usage:**
```typescript
// Load first page with default settings
await store.loadAll();
```

**With pagination:**
```typescript
// Load page 2 with 20 items
await store.loadAll({ 
  page: 2, 
  pageSize: 20 
});
```

**With filters:**
```typescript
// Filter by status
await store.loadAll({ 
  filters: { 
    status: 'active',
    role: 'admin'
  } 
});
```

**With sorting:**
```typescript
// Sort by name ascending
await store.loadAll({ 
  sort: { 
    field: 'name', 
    direction: 'asc' 
  } 
});
```

**Combined example:**
```typescript
// Filter + Sort + Pagination
await store.loadAll({
  page: 1,
  pageSize: 25,
  filters: { status: 'active' },
  sort: { field: 'createdAt', direction: 'desc' }
});
```

#### Signals Updated

- `signals.all()` - Updated with loaded entities
- `signals.isLoading()` - Set to true during load
- `signals.error()` - Set if error occurs
- `pagination.total()` - Total entity count
- `pagination.page()` - Current page number

#### Auto-Cancellation

Previous `loadAll()` requests are automatically cancelled when a new request starts, preventing race conditions.

```typescript
// Only the last call's result will be applied
await store.loadAll({ page: 1 });
await store.loadAll({ page: 2 }); // Previous cancelled
await store.loadAll({ page: 3 }); // Previous cancelled
```

---

### loadOne()

Loads a single entity by ID and updates/inserts it in the store.

#### Signature

```typescript
async loadOne(id: EntityId): Promise<T | null>
```

#### Parameters

- `id: EntityId` - Entity identifier (string | number)

#### Return Value

Returns the loaded entity or `null` if error occurs.

#### Examples

```typescript
// Load user by ID
const user = await store.loadOne(123);

if (user) {
  console.log('Loaded:', user);
} else {
  console.error('Failed to load user');
}
```

#### Error Handling

```typescript
const user = await store.loadOne(999);

if (!user) {
  const error = store.signals.error();
  console.error('Load failed:', error);
  // Show error to user
  toast.error(error || 'Failed to load user');
}
```

#### Signals Updated

- `signals.all()` - Entity added/updated
- `signals.isLoading()` - Set during load
- `signals.error()` - Set if error occurs

---

### create()

Creates a new entity.

#### Signature

```typescript
async create(data: CreateDto): Promise<T | null>
```

#### Parameters

- `data: CreateDto` - Entity data (partial or full, depends on your implementation)

#### Return Value

Returns the created entity or `null` if error occurs.

#### Examples

**Basic create:**
```typescript
const newUser = await store.create({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
});

if (newUser) {
  console.log('Created:', newUser.id);
} else {
  console.error('Create failed');
}
```

**With error handling:**
```typescript
const user = await store.create(formData);

if (!user) {
  const error = store.signals.error();
  showNotification('error', error || 'Failed to create user');
  return;
}

showNotification('success', 'User created successfully');
router.navigate(['/users', user.id]);
```

#### Optimistic Updates

When `optimistic: true`, the UI updates instantly:

```typescript
super({ name: 'users', optimistic: true });

// UI updates immediately, rolls back on error
const user = await store.create(data);
```

#### Signals Updated

- `signals.all()` - New entity added
- `pagination.total()` - Incremented (if localPagination)
- `signals.isLoading()` - Set during create
- `signals.error()` - Set if error occurs

---

### update()

Updates an existing entity.

#### Signature

```typescript
async update(id: EntityId, data: UpdateDto): Promise<T | null>
```

#### Parameters

- `id: EntityId` - Entity identifier
- `data: UpdateDto` - Partial entity data to update

#### Return Value

Returns the updated entity or `null` if error occurs.

#### Examples

**Basic update:**
```typescript
const updated = await store.update(userId, {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

**Partial update:**
```typescript
// Only update status
const updated = await store.update(userId, {
  status: 'inactive'
});
```

**With confirmation:**
```typescript
async function toggleUserStatus(id: number, currentStatus: string) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  const confirmed = await confirmDialog({
    title: 'Change Status',
    message: `Set user status to ${newStatus}?`
  });
  
  if (!confirmed) return;
  
  const user = await store.update(id, { status: newStatus });
  
  if (user) {
    showNotification('success', `Status updated to ${newStatus}`);
  }
}
```

#### Optimistic Updates

```typescript
// UI updates instantly, rolls back on error
const user = await store.update(userId, { status: 'inactive' });
```

#### Signals Updated

- `signals.all()` - Entity updated in place
- `signals.isLoading()` - Set during update
- `signals.error()` - Set if error occurs

---

### delete()

Deletes an entity by ID.

#### Signature

```typescript
async delete(id: EntityId): Promise<boolean>
```

#### Parameters

- `id: EntityId` - Entity identifier

#### Return Value

Returns `true` if successful, `false` if error occurs.

#### Examples

**Basic delete:**
```typescript
const success = await store.delete(userId);

if (success) {
  showNotification('success', 'User deleted');
} else {
  showNotification('error', 'Failed to delete user');
}
```

**With confirmation:**
```typescript
async function deleteUser(id: number, name: string) {
  const confirmed = await confirmDialog({
    title: 'Delete User',
    message: `Are you sure you want to delete ${name}?`,
    confirmText: 'Delete',
    confirmColor: 'danger'
  });
  
  if (!confirmed) return;
  
  const success = await store.delete(id);
  
  if (success) {
    showNotification('success', 'User deleted');
  }
}
```

#### List Refresh Behavior

After successful deletion, `loadAll()` is automatically called to refresh the list from the server.

```typescript
// Automatic refresh after delete
await store.delete(userId);
// Current page is reloaded automatically
```

#### Signals Updated

- `signals.all()` - Entity removed
- `pagination.total()` - Decremented (if localPagination)
- `signals.isLoading()` - Set during delete
- `signals.error()` - Set if error occurs

---

### refresh()

Force reloads the current page, bypassing cache.

#### Signature

```typescript
async refresh(): Promise<void>
```

#### Examples

**Manual refresh:**
```typescript
// Refresh current page
await store.refresh();
```

**With button:**
```typescript
<button (click)="store.refresh()">
  <icon>refresh</icon> Refresh
</button>
```

**Auto-refresh on interval:**
```typescript
ngOnInit() {
  this.store.loadAll();
  
  // Refresh every 30 seconds
  this.refreshInterval = setInterval(() => {
    this.store.refresh();
  }, 30000);
}

ngOnDestroy() {
  clearInterval(this.refreshInterval);
}
```

#### Cache Invalidation

`refresh()` bypasses the cache and always fetches fresh data from the server.

---


## Pagination

### Methods

#### goToPage()

Navigate to a specific page.

```typescript
async goToPage(page: number): Promise<void>

// Usage
await store.goToPage(3); // Go to page 3
```

#### nextPage()

Navigate to the next page (if available).

```typescript
async nextPage(): Promise<void>

// Usage
if (store.pagination.hasNext()) {
  await store.nextPage();
}
```

#### prevPage()

Navigate to the previous page (if available).

```typescript
async prevPage(): Promise<void>

// Usage
if (store.pagination.hasPrev()) {
  await store.prevPage();
}
```

#### setPageSize()

Change the page size and reload.

```typescript
async setPageSize(size: number): Promise<void>

// Usage
await store.setPageSize(50); // Show 50 items per page
```

#### goToFirstPage()

```typescript
await store.goToPage(1);
```

#### goToLastPage()

```typescript
const lastPage = store.pagination.totalPages();
await store.goToPage(lastPage);
```

### Signals

#### pagination.page()

Current page number (1-indexed).

```typescript
const currentPage = store.pagination.page(); // Signal<number>

// Template usage
<span>Page {{ store.pagination.page() }}</span>
```

#### pagination.pageSize()

Current page size.

```typescript
const pageSize = store.pagination.pageSize(); // Signal<number>

// Template usage
<select [(ngModel)]="pageSize" (change)="store.setPageSize(pageSize)">
  <option [value]="10">10</option>
  <option [value]="20">20</option>
  <option [value]="50">50</option>
</select>
```

#### pagination.total()

Total number of entities across all pages.

```typescript
const total = store.pagination.total(); // Signal<number>

// Template usage
<span>{{ store.pagination.total() }} total users</span>
```

#### pagination.totalPages()

Total number of pages.

```typescript
const totalPages = store.pagination.totalPages(); // Signal<number>

// Template usage
<span>of {{ store.pagination.totalPages() }}</span>
```

#### pagination.hasNextPage()

Whether next page exists.

```typescript
const hasNext = store.pagination.hasNext(); // Signal<boolean>

// Template usage
<button 
  (click)="store.nextPage()" 
  [disabled]="!store.pagination.hasNext()">
  Next
</button>
```

#### pagination.hasPrevPage()

Whether previous page exists.

```typescript
const hasPrev = store.pagination.hasPrev(); // Signal<boolean>

// Template usage
<button 
  (click)="store.prevPage()" 
  [disabled]="!store.pagination.hasPrev()">
  Previous
</button>
```

### Complete Pagination Example

```typescript
@Component({
  template: `
    <!-- Page Info -->
    <div class="page-info">
      Showing {{ startItem() }} - {{ endItem() }} of {{ store.pagination.total() }}
    </div>

    <!-- Page Size Selector -->
    <select [value]="store.pagination.pageSize()" 
            (change)="changePageSize($event)">
      <option [value]="10">10 per page</option>
      <option [value]="20">20 per page</option>
      <option [value]="50">50 per page</option>
      <option [value]="100">100 per page</option>
    </select>

    <!-- Pagination Controls -->
    <div class="pagination">
      <!-- First Page -->
      <button 
        (click)="store.goToPage(1)"
        [disabled]="store.pagination.page() === 1">
        First
      </button>

      <!-- Previous Page -->
      <button 
        (click)="store.prevPage()"
        [disabled]="!store.pagination.hasPrev()">
        Previous
      </button>

      <!-- Page Numbers -->
      @for (page of visiblePages(); track page) {
        <button 
          (click)="store.goToPage(page)"
          [class.active]="store.pagination.page() === page">
          {{ page }}
        </button>
      }

      <!-- Next Page -->
      <button 
        (click)="store.nextPage()"
        [disabled]="!store.pagination.hasNext()">
        Next
      </button>

      <!-- Last Page -->
      <button 
        (click)="store.goToPage(store.pagination.totalPages())"
        [disabled]="store.pagination.page() === store.pagination.totalPages()">
        Last
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
    const delta = 2; // Show 2 pages before and after current
    
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

## Filtering & Sorting

### Filtering

#### updateFilter()

Update a single filter value.

```typescript
async updateFilter(key: string, value: unknown): Promise<void>

// Usage
await store.updateFilter('status', 'active');
await store.updateFilter('role', 'admin');
```

**Clear a filter** (set to null/undefined):
```typescript
await store.updateFilter('status', null);
```

#### updateFilters()

Update multiple filters at once.

```typescript
async updateFilters(filters: FilterParams): Promise<void>

// Usage (replaces all filters)
await store.updateFilters({
  status: 'active',
  role: 'admin',
  minAge: 18
});
```

#### clearFilters()

Remove all filters.

```typescript
async clearFilters(): Promise<void>

// Usage
await store.clearFilters();
```

#### clearFilter()

Clear a specific filter.

```typescript
async clearFilter(key: string): Promise<void>

// Usage
await store.clearFilter('status');
```

#### filters() Signal

Get current filters.

```typescript
const filters = store.signals.filters(); // Signal<FilterParams>

// Template
{{ store.signals.filters() | json }}
```

### Sorting

#### updateSort()

Set sort field and direction.

```typescript
async updateSort(field: string, direction: 'asc' | 'desc'): Promise<void>

// Usage
await store.updateSort('name', 'asc');
await store.updateSort('createdAt', 'desc');
```

#### clearSort()

Remove sorting.

```typescript
async clearSort(): Promise<void>

// Usage
await store.clearSort();
```

#### toggleSort()

Toggle sort direction for a field (asc → desc → none).

```typescript
async toggleSort(field: string): Promise<void>

// Usage
await store.toggleSort('name');
// First click: asc
// Second click: desc
// Third click: no sort
```

#### sort() Signal

Get current sort configuration.

```typescript
const sort = store.signals.sort(); // Signal<SortConfig | null>

// Template
@if (store.signals.sort(); as sort) {
  Sorted by {{ sort.field }} {{ sort.direction }}
}
```

### Material Table Example

```typescript
@Component({
  template: `
    <!-- Filters -->
    <mat-form-field>
      <mat-label>Status</mat-label>
      <mat-select 
        [value]="store.signals.filters()['status'] || ''"
        (selectionChange)="store.updateFilter('status', $event.value)">
        <mat-option value="">All</mat-option>
        <mat-option value="active">Active</mat-option>
        <mat-option value="inactive">Inactive</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field>
      <mat-label>Search</mat-label>
      <input matInput 
        [value]="store.signals.filters()['search'] || ''"
        (input)="onSearchChange($event)"
        placeholder="Search users...">
    </mat-form-field>

    <!-- Table with Sorting -->
    <table mat-table 
           [dataSource]="store.signals.all()"
           matSort
           (matSortChange)="onSortChange($event)">
      
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
        <td mat-cell *matCellDef="let user">{{ user.email }}</td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
        <td mat-cell *matCellDef="let user">
          <mat-chip [color]="user.status === 'active' ? 'primary' : 'warn'">
            {{ user.status }}
          </mat-chip>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `
})
export class UserListComponent {
  protected store = inject(UserStore);
  protected displayedColumns = ['name', 'email', 'status'];
  
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.store.updateFilter('search', search || null);
    });

    this.store.loadAll();
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  async onSortChange(event: Sort) {
    if (event.direction) {
      await this.store.updateSort(event.active, event.direction);
    } else {
      await this.store.clearSort();
    }
  }
}
```


### PrimeNG Table Example

```typescript
@Component({
  template: `
    <!-- Filters -->
    <p-dropdown 
      [options]="statusOptions"
      [(ngModel)]="selectedStatus"
      (onChange)="store.updateFilter('status', $event.value)"
      placeholder="Filter by Status">
    </p-dropdown>

    <!-- Table -->
    <p-table 
      [value]="store.signals.all()"
      [loading]="store.signals.isLoading()"
      [paginator]="false"
      (sortFunction)="customSort($event)"
      [customSort]="true">
      
      <ng-template pTemplate="header">
        <tr>
          <th [pSortableColumn]="'name'">
            Name <p-sortIcon field="name"></p-sortIcon>
          </th>
          <th [pSortableColumn]="'email'">
            Email <p-sortIcon field="email"></p-sortIcon>
          </th>
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
export class UserListComponent {
  protected store = inject(UserStore);
  protected statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  async customSort(event: SortEvent) {
    if (event.field) {
      await this.store.updateSort(
        event.field, 
        event.order === 1 ? 'asc' : 'desc'
      );
    }
  }
}
```

---

## State Signals

EntityStore provides a comprehensive set of reactive signals for accessing state.

### Entity Signals

#### signals.all()

All loaded entities as an array.

```typescript
const users = store.signals.all(); // Signal<User[]>

// Usage
@for (user of store.signals.all(); track user.id) {
  <div>{{ user.name }}</div>
}
```

#### signals.byId()

Get entity by ID (computed signal).

```typescript
const user = store.signals.byId(userId); // Signal<User | undefined>

// Usage - auto-updates when entity changes
effect(() => {
  const user = store.signals.byId(userId)();
  if (user) {
    console.log('User updated:', user.name);
  }
});
```

#### signals.selected()

Currently selected entity.

```typescript
const selected = store.signals.selected(); // Signal<User | null>

// Usage
@if (store.signals.selected(); as user) {
  <user-detail [user]="user" />
}
```

#### signals.selectedItems()

Array of selected entities (for multi-select).

```typescript
const selected = store.signals.selectedItems(); // Signal<User[]>

// Usage
<div>{{ store.signals.selectedItems().length }} selected</div>
```

#### signals.isLoading()

Loading state indicator.

```typescript
const isLoading = store.signals.isLoading(); // Signal<boolean>

// Usage
@if (store.signals.isLoading()) {
  <mat-spinner />
}
```

#### signals.error()

Error message if any.

```typescript
const error = store.signals.error(); // Signal<string | null>

// Usage
@if (store.signals.error(); as error) {
  <div class="error">{{ error }}</div>
}
```

#### signals.count()

Number of entities in current view.

```typescript
const count = store.signals.count(); // Signal<number>

// Usage
<span>{{ store.signals.count() }} items</span>
```

#### signals.isEmpty()

Whether the store has no entities.

```typescript
const isEmpty = store.signals.isEmpty(); // Signal<boolean>

// Usage
@if (store.signals.isEmpty() && !store.signals.isLoading()) {
  <empty-state message="No users found" />
}
```

#### signals.hasData()

Whether the store has entities (opposite of isEmpty).

```typescript
const hasData = store.signals.hasData(); // Signal<boolean>

// Usage
@if (store.signals.hasData()) {
  <user-table [data]="store.signals.all()" />
}
```

### Complete Signals Example

```typescript
@Component({
  template: `
    <div class="user-list">
      <!-- Loading State -->
      @if (store.signals.isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading users...</p>
        </div>
      }

      <!-- Error State -->
      @if (store.signals.error(); as error) {
        <mat-card class="error-card">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-button (click)="store.refresh()">Retry</button>
        </mat-card>
      }

      <!-- Empty State -->
      @if (store.signals.isEmpty() && !store.signals.isLoading()) {
        <div class="empty-state">
          <mat-icon>group</mat-icon>
          <h3>No Users Found</h3>
          <p>Get started by creating your first user</p>
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            Create User
          </button>
        </div>
      }

      <!-- Data State -->
      @if (store.signals.hasData()) {
        <!-- Selection Info -->
        @if (store.signals.selectedItems().length > 0) {
          <div class="selection-bar">
            {{ store.signals.selectedItems().length }} selected
            <button mat-button (click)="store.clearSelection()">Clear</button>
            <button mat-button color="warn" (click)="deleteSelected()">
              Delete Selected
            </button>
          </div>
        }

        <!-- Entity Count -->
        <div class="count-badge">
          {{ store.signals.count() }} of {{ store.pagination.total() }}
        </div>

        <!-- User List -->
        <user-table [users]="store.signals.all()" />
      }
    </div>
  `
})
export class UserListComponent {
  protected store = inject(UserStore);

  async deleteSelected() {
    const ids = this.store.signals.selectedItems().map(u => u.id);
    const result = await this.store.deleteMany(ids);
    
    if (result.success.length > 0) {
      showNotification('success', `${result.success.length} users deleted`);
    }
    if (result.failed.length > 0) {
      showNotification('error', `${result.failed.length} users failed to delete`);
    }
  }
}
```

---

## Optimistic Updates

### What are Optimistic Updates?

Optimistic updates improve perceived performance by **updating the UI immediately** before the server responds, then rolling back if the operation fails.

**Without optimistic updates:**
```
User clicks Delete → Show spinner → Wait for server → Update UI → Hide spinner
                      (2-3 seconds of waiting)
```

**With optimistic updates:**
```
User clicks Delete → UI updates instantly → Server confirms in background
                     (Instant feedback)
```

### When to Use Them?

- ✅ **User expects instant feedback** (like/unlike, toggle status)
- ✅ **Low failure rate** (most operations succeed)
- ✅ **Reversible actions** (can be undone)
- ✅ **Network latency is noticeable**

- ❌ **High failure risk** (payment processing)
- ❌ **Critical operations** (delete account)
- ❌ **Complex validation** (might fail server-side)

### Configuration

Enable optimistic updates in store configuration:

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      optimistic: true // Enable optimistic updates (default: true)
    });
  }
}
```

### Built-in Optimistic Methods

#### optimisticCreate()

```typescript
optimisticCreate(data: CreateDto & { id?: EntityId }): OptimisticResult

interface OptimisticResult {
  rollback: () => void;  // Undo the change
  confirm: () => void;   // Confirm the change (no-op in current implementation)
}
```

**Example:**
```typescript
const { rollback } = store.optimisticCreate({
  id: `temp-${Date.now()}`, // Temporary ID
  name: 'New User',
  email: 'new@example.com',
  status: 'active'
});

try {
  const user = await api.createUser(data);
  // Success - optimistic update confirmed
} catch (error) {
  rollback(); // Failure - revert UI
  showError('Failed to create user');
}
```

#### optimisticUpdate()

```typescript
optimisticUpdate(id: EntityId, data: UpdateDto): OptimisticResult
```

**Example:**
```typescript
const { rollback } = store.optimisticUpdate(userId, {
  status: 'inactive'
});

try {
  await api.updateUser(userId, { status: 'inactive' });
  showSuccess('User deactivated');
} catch (error) {
  rollback();
  showError('Failed to update user');
}
```

#### optimisticDelete()

```typescript
optimisticDelete(id: EntityId): OptimisticResult
```

**Example:**
```typescript
const { rollback } = store.optimisticDelete(userId);

try {
  await api.deleteUser(userId);
  showSuccess('User deleted');
} catch (error) {
  rollback();
  showError('Failed to delete user');
}
```

### Real-World Example: Toggle Status

```typescript
async toggleUserStatus(userId: number, currentStatus: string) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  // Optimistic update - UI changes instantly
  const { rollback } = this.store.optimisticUpdate(userId, {
    status: newStatus
  });

  try {
    // API call in background
    await this.userApi.updateStatus(userId, newStatus);
    
    // Success feedback
    this.toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  } catch (error) {
    // Rollback on failure
    rollback();
    this.toast.error('Failed to update status');
    console.error(error);
  }
}
```

### UI Feedback Patterns

**Loading indicator during API call:**
```typescript
async deleteUser(id: number) {
  const { rollback } = this.store.optimisticDelete(id);
  
  const loadingRef = this.showLoadingToast('Deleting...');
  
  try {
    await this.api.deleteUser(id);
    loadingRef.dismiss();
    this.toast.success('Deleted successfully');
  } catch (error) {
    rollback();
    loadingRef.dismiss();
    this.toast.error('Delete failed');
  }
}
```

**Undo action:**
```typescript
async archiveUser(id: number) {
  const { rollback } = this.store.optimisticUpdate(id, { archived: true });
  
  const snackBarRef = this.snackBar.open('User archived', 'Undo', {
    duration: 5000
  });
  
  snackBarRef.onAction().subscribe(() => {
    rollback(); // User clicked Undo
    return;
  });
  
  try {
    await this.api.archiveUser(id);
  } catch (error) {
    if (!snackBarRef.dismissed) {
      rollback();
      this.toast.error('Archive failed');
    }
  }
}
```


---

## State Persistence

State persistence allows you to save and restore store state across sessions.

### What Gets Persisted?

You can persist:
- **filters** - Active filters
- **sort** - Sort configuration
- **pagination** - Current page and page size
- **selection** - Selected entity IDs (optional)

### Configuration

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage',  // or 'localStorage'
    paths: ['filters', 'sort', 'pagination'],  // What to persist
    key: 'my_custom_key'  // Optional custom storage key
  }
});
```

#### Storage Options

**sessionStorage** (default):
- Data persists during browser session
- Cleared when tab/browser closes
- Recommended for temporary state

**localStorage**:
- Data persists indefinitely
- Survives browser restart
- Recommended for user preferences

### Example Configurations

**Persist filters and sort only:**
```typescript
persistence: {
  enabled: true,
  storage: 'sessionStorage',
  paths: ['filters', 'sort']
}
```

**Persist everything including selection:**
```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters', 'sort', 'pagination', 'selection']
}
```

**Custom storage key:**
```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters'],
  key: 'app_user_filters_v2'  // Custom key for versioning
}
```

### Restore on Init

Persisted state is automatically restored when the store is created:

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters', 'sort', 'pagination']
      }
    });
    // Filters, sort, and pagination are already restored here
  }
}
```

**Component usage:**
```typescript
ngOnInit() {
  // Load data with restored filters/sort/pagination
  this.store.loadAll();
  // User sees the same filters they had before
}
```

### Clear Persisted State

**Clear programmatically:**
```typescript
// Clear from storage (requires manual implementation)
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('sig_store_users');
}
```

**Clear on logout:**
```typescript
async logout() {
  // Clear all persisted stores
  sessionStorage.clear();
  // Or selectively
  sessionStorage.removeItem('sig_store_users');
  sessionStorage.removeItem('sig_store_products');
  
  await this.authService.logout();
  this.router.navigate(['/login']);
}
```

### Use Cases

**Search filters persistence:**
```typescript
// User applies complex filters
await store.updateFilters({
  status: 'active',
  role: 'admin',
  department: 'IT',
  createdAfter: '2024-01-01'
});

// Navigates away, then returns
// Filters are still applied!
```

**Pagination state:**
```typescript
// User navigates to page 5 with 50 items per page
await store.goToPage(5);
await store.setPageSize(50);

// Refreshes page
// Still on page 5 with 50 items per page
```

---

## Caching

EntityStore includes built-in TTL-based caching to reduce unnecessary API calls.

### Cache Configuration

```typescript
super({
  name: 'users',
  cacheTTL: 5 * 60 * 1000  // 5 minutes in milliseconds
});
```

**Common TTL values:**
```typescript
// 1 minute
cacheTTL: 60 * 1000

// 5 minutes (default)
cacheTTL: 5 * 60 * 1000

// 15 minutes
cacheTTL: 15 * 60 * 1000

// 1 hour
cacheTTL: 60 * 60 * 1000

// Never expire (use with caution)
cacheTTL: Infinity
```

### Cache Invalidation

Cache is automatically invalidated when:
- TTL expires
- Data is created, updated, or deleted
- Manual refresh is triggered

**Check if cache is stale:**
```typescript
if (store.signals.isStale()) {
  console.log('Cache expired, will fetch fresh data');
}
```

### Force Refresh (Bypass Cache)

**Using refresh():**
```typescript
// Bypasses cache, fetches fresh data
await store.refresh();
```

**Using refreshIfStale():**
```typescript
// Only refreshes if cache is stale
await store.refreshIfStale();
```

**Usage example:**
```typescript
ngOnInit() {
  // Load data (uses cache if valid)
  this.store.loadAll();
}

onRefreshClick() {
  // Force fresh data
  this.store.refresh();
}

onFocusWindow() {
  // Refresh only if stale
  this.store.refreshIfStale();
}
```

### Cache Strategies

**Aggressive caching (read-heavy data):**
```typescript
super({
  name: 'categories', // Rarely changes
  cacheTTL: 60 * 60 * 1000 // 1 hour
});
```

**No caching (real-time data):**
```typescript
super({
  name: 'live-orders',
  cacheTTL: 0 // Always fetch fresh
});
```

**Smart refresh with polling:**
```typescript
export class OrderStore extends EntityStore<Order> {
  constructor() {
    super({
      name: 'orders',
      cacheTTL: 30 * 1000 // 30 seconds
    });
  }

  startPolling(interval: number = 30000) {
    return setInterval(() => {
      this.refreshIfStale(); // Only if cache expired
    }, interval);
  }
}

// Usage
ngOnInit() {
  this.store.loadAll();
  this.pollingInterval = this.store.startPolling(30000);
}

ngOnDestroy() {
  clearInterval(this.pollingInterval);
}
```

---

## Error Handling

### Error Types

Errors can occur during:
- **Loading** (`loadAll`, `loadOne`)
- **Creating** (`create`)
- **Updating** (`update`)
- **Deleting** (`delete`)

### Error Signal

```typescript
const error = store.signals.error(); // Signal<string | null>

// Check if error exists
@if (store.signals.error(); as error) {
  <div class="error">{{ error }}</div>
}
```

### Clearing Errors

```typescript
// Manual error clearing
store.clearError();

// Errors are auto-cleared on next successful operation
await store.loadAll(); // Clears previous error if successful
```

### User Feedback Patterns

**Toast notifications:**
```typescript
async createUser(data: CreateUserDto) {
  const user = await this.store.create(data);
  
  if (!user) {
    const error = this.store.signals.error();
    this.toast.error(error || 'Failed to create user');
    return;
  }
  
  this.toast.success('User created successfully');
  this.router.navigate(['/users', user.id]);
}
```

**Inline error display:**
```typescript
@Component({
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Form fields -->
      
      @if (store.signals.error(); as error) {
        <mat-error class="form-error">
          <mat-icon>error</mat-icon>
          {{ error }}
        </mat-error>
      }
      
      <button type="submit" [disabled]="store.signals.isLoading()">
        Submit
      </button>
    </form>
  `
})
```

**Error dialog:**
```typescript
async deleteUser(id: number) {
  const success = await this.store.delete(id);
  
  if (!success) {
    const error = this.store.signals.error();
    
    this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'Delete Failed',
        message: error,
        action: 'Retry',
        onRetry: () => this.deleteUser(id)
      }
    });
  }
}
```

### Retry Strategies

**Simple retry:**
```typescript
async loadWithRetry(maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    await this.store.loadAll();
    
    if (!this.store.signals.error()) {
      return; // Success
    }
    
    if (i < maxRetries - 1) {
      await this.delay(1000 * (i + 1)); // Exponential backoff
    }
  }
  
  this.toast.error('Failed to load after multiple retries');
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Retry with user prompt:**
```typescript
async loadWithPrompt() {
  await this.store.loadAll();
  
  if (this.store.signals.error()) {
    const retry = await this.dialog.confirm({
      title: 'Load Failed',
      message: 'Failed to load data. Would you like to retry?',
      confirmText: 'Retry',
      cancelText: 'Cancel'
    });
    
    if (retry) {
      await this.loadWithPrompt(); // Recursive retry
    }
  }
}
```

### Network Error Handling

```typescript
async loadUsers() {
  await this.store.loadAll();
  
  const error = this.store.signals.error();
  
  if (error) {
    if (error.includes('NetworkError') || error.includes('Failed to fetch')) {
      this.toast.error('No internet connection. Please check your network.');
    } else if (error.includes('401') || error.includes('Unauthorized')) {
      this.router.navigate(['/login']);
    } else if (error.includes('403') || error.includes('Forbidden')) {
      this.toast.error('You don\'t have permission to view this data.');
    } else {
      this.toast.error('An unexpected error occurred.');
    }
  }
}
```


---

## Advanced Patterns

### Related Entities

Load related entities based on master entity selection.

```typescript
// Load user with their posts
@Component({
  template: `
    @if (userStore.signals.selected(); as user) {
      <user-detail [user]="user" />
      
      <h3>Posts by {{ user.name }}</h3>
      @for (post of postStore.signals.all(); track post.id) {
        <post-card [post]="post" />
      }
    }
  `
})
export class UserDetailComponent {
  userStore = inject(UserStore);
  postStore = inject(PostStore);

  async ngOnInit() {
    const userId = this.route.snapshot.params['id'];
    
    // Load user
    await this.userStore.loadOne(userId);
    
    // Load user's posts
    await this.postStore.loadAll({
      filters: { userId }
    });
  }
}
```

**Reactive approach:**
```typescript
export class UserDetailComponent {
  userStore = inject(UserStore);
  postStore = inject(PostStore);
  
  // Auto-load posts when user changes
  constructor() {
    effect(() => {
      const user = this.userStore.signals.selected()();
      
      if (user) {
        this.postStore.loadAll({
          filters: { userId: user.id }
        });
      }
    });
  }
}
```

### Batch Operations

#### Batch Create

```typescript
async importUsers(users: CreateUserDto[]) {
  const result = await this.store.createMany(users);
  
  console.log(`Created: ${result.success.length}`);
  console.log(`Failed: ${result.failed.length}`);
  
  if (result.failed.length > 0) {
    this.showFailedImports(result.failed);
  }
  
  if (result.success.length > 0) {
    this.toast.success(`${result.success.length} users imported`);
  }
}
```

#### Batch Update

```typescript
async activateUsers(userIds: number[]) {
  const updates = userIds.map(id => ({
    id,
    data: { status: 'active' }
  }));
  
  const result = await this.store.updateMany(updates);
  
  this.toast.success(
    `${result.success.length} users activated, ${result.failed.length} failed`
  );
}
```

#### Batch Delete

```typescript
async deleteSelected() {
  const selectedIds = this.store.signals.selectedItems().map(u => u.id);
  
  if (selectedIds.length === 0) return;
  
  const confirmed = await this.dialog.confirm({
    title: 'Delete Users',
    message: `Delete ${selectedIds.length} users?`,
    confirmText: 'Delete',
    confirmColor: 'danger'
  });
  
  if (!confirmed) return;
  
  const result = await this.store.deleteMany(selectedIds);
  
  if (result.success.length > 0) {
    this.store.clearSelection();
    this.toast.success(`${result.success.length} users deleted`);
  }
  
  if (result.failed.length > 0) {
    this.toast.error(`${result.failed.length} users failed to delete`);
  }
}
```

### Real-time Updates

Integrate WebSocket updates with EntityStore.

```typescript
export class UserStore extends EntityStore<User> {
  private ws = inject(WebSocketService);

  constructor() {
    super({
      name: 'users',
      defaultPageSize: 20
    });
    
    this.setupRealtimeUpdates();
  }

  private setupRealtimeUpdates() {
    // Listen for user created
    this.ws.on<User>('user:created', (user) => {
      this._state.update((s) => ({
        ...adapter.addOne(s, user, this.config.selectId),
      }));
      this.pagination.setTotal(this.pagination.total() + 1);
    });

    // Listen for user updated
    this.ws.on<User>('user:updated', (user) => {
      this._state.update((s) => ({
        ...adapter.updateOne(s, user.id, user),
      }));
    });

    // Listen for user deleted
    this.ws.on<{ id: number }>('user:deleted', ({ id }) => {
      this._state.update((s) => ({
        ...adapter.removeOne(s, id),
      }));
      this.pagination.setTotal(Math.max(0, this.pagination.total() - 1));
    });
  }
  
  // ... rest of implementation
}
```

**With notifications:**
```typescript
private setupRealtimeUpdates() {
  this.ws.on<User>('user:created', (user) => {
    // Update store
    this._state.update((s) => ({
      ...adapter.addOne(s, user, this.config.selectId),
    }));
    
    // Show notification
    this.toast.info(`New user added: ${user.name}`);
  });
}
```

### Computed Signals

Create derived state from store signals.

```typescript
export class DashboardComponent {
  userStore = inject(UserStore);

  // Computed: Active users
  activeUsers = computed(() => 
    this.userStore.signals.all().filter(u => u.status === 'active')
  );

  // Computed: Admin users
  adminUsers = computed(() =>
    this.userStore.signals.all().filter(u => u.role === 'admin')
  );

  // Computed: User stats
  userStats = computed(() => {
    const users = this.userStore.signals.all();
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      admins: users.filter(u => u.role === 'admin').length
    };
  });

  // Template usage
  // {{ userStats().active }} active users
  // {{ activeUsers().length }} active
}
```

### Store Composition

Combine multiple stores for complex views.

```typescript
export class OrderDetailComponent {
  orderStore = inject(OrderStore);
  productStore = inject(ProductStore);
  userStore = inject(UserStore);

  // Combined data
  orderDetails = computed(() => {
    const order = this.orderStore.signals.selected()();
    if (!order) return null;

    const customer = this.userStore.signals.byId(order.customerId)();
    const products = order.productIds.map(id => 
      this.productStore.signals.byId(id)()
    ).filter(Boolean);

    return {
      order,
      customer,
      products,
      total: products.reduce((sum, p) => sum + (p?.price || 0), 0)
    };
  });
}
```

### Master-Detail Pattern

```typescript
@Component({
  template: `
    <div class="master-detail">
      <!-- Master: User List -->
      <div class="master">
        @for (user of store.signals.all(); track user.id) {
          <div 
            class="user-item"
            [class.selected]="store.signals.selected()?.id === user.id"
            (click)="store.select(user.id)">
            {{ user.name }}
          </div>
        }
      </div>

      <!-- Detail: Selected User -->
      <div class="detail">
        @if (store.signals.selected(); as user) {
          <user-detail [user]="user" />
        } @else {
          <p>Select a user to view details</p>
        }
      </div>
    </div>
  `
})
export class UserMasterDetailComponent {
  store = inject(UserStore);

  ngOnInit() {
    this.store.loadAll();
  }
}
```

### Infinite Scroll

```typescript
@Component({
  template: `
    <div class="user-list" (scroll)="onScroll($event)">
      @for (user of store.signals.all(); track user.id) {
        <user-card [user]="user" />
      }
      
      @if (store.signals.isLoading()) {
        <div class="loading-more">Loading more...</div>
      }
    </div>
  `
})
export class InfiniteScrollComponent {
  store = inject(UserStore);
  private currentPage = 1;

  ngOnInit() {
    this.loadPage(1);
  }

  async onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    
    if (atBottom && this.store.pagination.hasNext() && !this.store.signals.isLoading()) {
      this.currentPage++;
      await this.loadPage(this.currentPage);
    }
  }

  private async loadPage(page: number) {
    await this.store.loadAll({ page, pageSize: 20 });
  }
}
```

---

## Best Practices

### 1. Store Organization

**One store per entity type:**
```typescript
// ✅ Good: Separate stores
UserStore
ProductStore
OrderStore

// ❌ Bad: Single store for everything
AppStore // Contains users, products, orders
```

**Keep stores focused:**
```typescript
// ✅ Good: Focused responsibility
export class UserStore extends EntityStore<User> {
  // Only user-related logic
}

// ❌ Bad: Mixed responsibilities
export class UserStore extends EntityStore<User> {
  // User logic + Order logic + Product logic
}
```

**Use dependency injection:**
```typescript
// ✅ Good: Injectable service
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {}

// Usage
store = inject(UserStore);
```

### 2. Performance

**Use appropriate page sizes:**
```typescript
// ✅ Good: Reasonable page sizes
defaultPageSize: 20  // For lists
defaultPageSize: 50  // For tables
defaultPageSize: 100 // For select dropdowns

// ❌ Bad: Too large/small
defaultPageSize: 1000 // Slow rendering
defaultPageSize: 1    // Too many requests
```

**Enable caching for read-heavy data:**
```typescript
// ✅ Good: Cache static/slow-changing data
super({
  name: 'categories',
  cacheTTL: 60 * 60 * 1000 // 1 hour
});

// ❌ Bad: No cache for frequently accessed data
super({
  name: 'categories',
  cacheTTL: 0 // Always fetch
});
```

**Use optimistic updates for better UX:**
```typescript
// ✅ Good: Instant feedback
super({
  name: 'users',
  optimistic: true
});

// ⚠️ Consider: For critical operations
super({
  name: 'payments',
  optimistic: false // Wait for confirmation
});
```

### 3. Error Handling

**Always check return values:**
```typescript
// ✅ Good: Check result
const user = await store.create(data);
if (!user) {
  handleError();
  return;
}
processSuccess(user);

// ❌ Bad: Assume success
const user = await store.create(data);
processSuccess(user); // Might be null!
```

**Display errors to users:**
```typescript
// ✅ Good: User feedback
if (!user) {
  this.toast.error(this.store.signals.error());
}

// ❌ Bad: Silent failure
if (!user) {
  console.error('Failed');
}
```

**Implement retry logic for network errors:**
```typescript
// ✅ Good: Retry on network error
async loadWithRetry() {
  for (let i = 0; i < 3; i++) {
    await this.store.loadAll();
    if (!this.store.signals.error()) break;
    await this.delay(1000 * (i + 1));
  }
}
```

### 4. Testing

**Mock HTTP calls:**
```typescript
const mockHttp = {
  get: jest.fn().mockResolvedValue({ data: mockUsers }),
  post: jest.fn().mockResolvedValue({ data: mockUser }),
  // ...
};
```

**Test CRUD operations:**
```typescript
it('should create user', async () => {
  const user = await store.create(mockData);
  expect(user).toBeTruthy();
  expect(store.signals.all()).toContain(user);
});
```

**Test error scenarios:**
```typescript
it('should handle create error', async () => {
  mockHttp.post.mockRejectedValue(new Error('Network error'));
  const user = await store.create(mockData);
  expect(user).toBeNull();
  expect(store.signals.error()).toBeTruthy();
});
```

### 5. Common Pitfalls

**❌ Forgetting to call loadAll() on init:**
```typescript
// Bad
ngOnInit() {
  // Store is empty, nothing displays
}

// Good
ngOnInit() {
  this.store.loadAll();
}
```

**❌ Not clearing filters when appropriate:**
```typescript
// Bad: Filters persist when navigating away
ngOnDestroy() {
  // Filters still active on next visit
}

// Good: Clear filters when done
ngOnDestroy() {
  this.store.clearFilters();
}
```

**❌ Not handling null returns from CRUD operations:**
```typescript
// Bad
const user = await store.create(data);
router.navigate(['/users', user.id]); // Crash if null!

// Good
const user = await store.create(data);
if (user) {
  router.navigate(['/users', user.id]);
}
```


---

## API Reference

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadAll()` | `params?: Partial<FetchParams>` | `Promise<void>` | Load entities with pagination, filters, and sorting |
| `loadOne()` | `id: EntityId` | `Promise<T \| null>` | Load single entity by ID |
| `create()` | `data: CreateDto` | `Promise<T \| null>` | Create new entity |
| `createMany()` | `items: CreateDto[]` | `Promise<{ success: T[]; failed: {...}[] }>` | Create multiple entities |
| `update()` | `id: EntityId, data: UpdateDto` | `Promise<T \| null>` | Update entity |
| `updateMany()` | `updates: Array<{ id, data }>` | `Promise<{ success: T[]; failed: {...}[] }>` | Update multiple entities |
| `delete()` | `id: EntityId` | `Promise<boolean>` | Delete entity |
| `deleteMany()` | `ids: EntityId[]` | `Promise<{ success: EntityId[]; failed: EntityId[] }>` | Delete multiple entities |
| `refresh()` | - | `Promise<void>` | Force reload current page (bypass cache) |
| `refreshIfStale()` | - | `Promise<void>` | Reload only if cache is expired |
| `goToPage()` | `page: number` | `Promise<void>` | Navigate to specific page |
| `nextPage()` | - | `Promise<void>` | Go to next page |
| `prevPage()` | - | `Promise<void>` | Go to previous page |
| `setPageSize()` | `size: number` | `Promise<void>` | Change page size |
| `updateFilter()` | `key: string, value: unknown` | `Promise<void>` | Update single filter |
| `updateFilters()` | `filters: FilterParams` | `Promise<void>` | Update all filters |
| `clearFilters()` | - | `Promise<void>` | Clear all filters |
| `clearFilter()` | `key: string` | `Promise<void>` | Clear specific filter |
| `updateSort()` | `field: string, direction: 'asc' \| 'desc'` | `Promise<void>` | Set sorting |
| `toggleSort()` | `field: string` | `Promise<void>` | Toggle sort direction (asc → desc → none) |
| `clearSort()` | - | `Promise<void>` | Clear sorting |
| `select()` | `id: EntityId \| null` | `void` | Select single entity |
| `toggleSelect()` | `id: EntityId` | `void` | Toggle entity selection |
| `selectMany()` | `ids: EntityId[]` | `void` | Select multiple entities |
| `selectAll()` | - | `void` | Select all entities in current view |
| `clearSelection()` | - | `void` | Clear all selections |
| `clearError()` | - | `void` | Clear error state |
| `reset()` | - | `void` | Reset store to initial state |
| `optimisticCreate()` | `data: CreateDto & { id?: EntityId }` | `OptimisticResult` | Optimistic create with rollback |
| `optimisticUpdate()` | `id: EntityId, data: UpdateDto` | `OptimisticResult` | Optimistic update with rollback |
| `optimisticDelete()` | `id: EntityId` | `OptimisticResult` | Optimistic delete with rollback |
| `getById()` | `id: EntityId` | `T \| undefined` | Get entity by ID (non-reactive) |
| `getByIds()` | `ids: EntityId[]` | `T[]` | Get multiple entities by IDs |
| `find()` | `predicate: (entity: T) => boolean` | `T \| undefined` | Find first matching entity |
| `filter()` | `predicate: (entity: T) => boolean` | `T[]` | Filter entities by predicate |

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `signals.all()` | `Signal<T[]>` | All loaded entities in current page |
| `signals.byId(id)` | `Signal<T \| undefined>` | Entity by ID (computed) |
| `signals.entities()` | `Signal<Map<EntityId, T>>` | Entity map (key-value) |
| `signals.ids()` | `Signal<EntityId[]>` | Array of entity IDs |
| `signals.selected()` | `Signal<T \| null>` | Currently selected entity |
| `signals.selectedItems()` | `Signal<T[]>` | All selected entities (multi-select) |
| `signals.isLoading()` | `Signal<boolean>` | Loading state indicator |
| `signals.loading()` | `Signal<LoadingState>` | Detailed loading state ('idle' \| 'loading' \| 'success' \| 'error') |
| `signals.error()` | `Signal<string \| null>` | Error message if any |
| `signals.hasError()` | `Signal<boolean>` | Whether error exists |
| `signals.count()` | `Signal<number>` | Number of entities in current view |
| `signals.isEmpty()` | `Signal<boolean>` | Whether store has no entities |
| `signals.hasData()` | `Signal<boolean>` | Whether store has entities (opposite of isEmpty) |
| `signals.isStale()` | `Signal<boolean>` | Whether cached data is expired |
| `signals.filters()` | `Signal<FilterParams>` | Current filter values |
| `signals.sort()` | `Signal<SortConfig \| null>` | Current sort configuration |
| `pagination.page()` | `Signal<number>` | Current page number (1-indexed) |
| `pagination.pageSize()` | `Signal<number>` | Current page size |
| `pagination.total()` | `Signal<number>` | Total number of entities |
| `pagination.totalPages()` | `Signal<number>` | Total number of pages |
| `pagination.hasNext()` | `Signal<boolean>` | Whether next page exists |
| `pagination.hasPrev()` | `Signal<boolean>` | Whether previous page exists |

### Types

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

// Example
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

// Example
const sort: SortConfig = {
  field: 'name',
  direction: 'asc'
};
```

#### PaginatedResponse

```typescript
interface PaginatedResponse<T> {
  data: T[];           // Entities for current page
  total: number;       // Total count across all pages
  page: number;        // Current page number
  pageSize: number;    // Items per page
  totalPages?: number; // Total pages (optional)
}
```

#### LoadingState

```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

#### OptimisticResult

```typescript
interface OptimisticResult {
  rollback: () => void;  // Revert the optimistic change
  confirm: () => void;   // Confirm the change (no-op currently)
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

## Related Documentation

- **[Field Types Guide](fields.md)** - Complete field types documentation
- **[Enhanced Form](../DOCUMENTATION.md#enhanced-form-gelişmiş-form)** - Form state management
- **[API Layer](../DOCUMENTATION.md#api-layer)** - HTTP client and caching
- **[Examples](../examples/)** - Working code examples
- **[Demo App](../apps/demo-material/)** - Full-featured demo application

---

## Migration from v1.x

If you're upgrading from v1.x, see the [Migration Guide](../MIGRATION.md) for details on breaking changes and upgrade path.

---

## Support

- **GitHub Issues**: [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Discussions**: [github.com/biyonik/ng-signalify/discussions](https://github.com/biyonik/ng-signalify/discussions)
- **Email**: ahmet.altun60@gmail.com

---

<div align="center">

**Made with ❤️ for the Angular community**

[⭐ Star on GitHub](https://github.com/biyonik/ng-signalify) | [📖 Full Documentation](../DOCUMENTATION.md) | [🚀 Quick Start](../README.md#quick-start)

</div>
