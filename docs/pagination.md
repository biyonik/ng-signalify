# Pagination Guide

> **🇹🇷 For Turkish version:** [docs/tr/pagination.md](tr/pagination.md)

## Table of Contents

- [Basic Pagination](#basic-pagination)
- [Page Navigation Methods](#page-navigation-methods)
- [Pagination Signals](#pagination-signals)
- [Filtering](#filtering)
- [Sorting](#sorting)
- [Combined Operations](#combined-operations)
- [Server-Side Pagination](#server-side-pagination)
- [Client-Side Pagination](#client-side-pagination)
- [UI Integration](#ui-integration)
- [Best Practices](#best-practices)

---

## Basic Pagination

EntityStore provides built-in pagination support with reactive signals.

### Configure Default Page Size

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
      defaultPageSize: 20  // Default: 10
    });
  }

  // Implement required methods
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

### Load First Page

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div>
      @for (user of store.signals.all(); track user.id) {
        <div>{{ user.name }}</div>
      }
      
      <div>
        Page {{ store.pagination.page() }} of {{ store.pagination.totalPages() }}
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    // Loads page 1 with default page size
    this.store.loadAll();
  }
}
```

---

## Page Navigation Methods

EntityStore provides convenient methods for pagination navigation.

### goToPage(page)

Navigate to a specific page number.

```typescript
// Go to page 3
await store.goToPage(3);

// Template usage
<button (click)="store.goToPage(5)">Go to Page 5</button>
```

### nextPage()

Navigate to the next page.

```typescript
// Go to next page
await store.nextPage();

// Template usage
<button 
  (click)="store.nextPage()"
  [disabled]="!store.pagination.hasNext()">
  Next
</button>
```

### prevPage()

Navigate to the previous page.

```typescript
// Go to previous page
await store.prevPage();

// Template usage
<button 
  (click)="store.prevPage()"
  [disabled]="!store.pagination.hasPrev()">
  Previous
</button>
```

### goToFirstPage()

Navigate to the first page.

```typescript
// Go to first page
await store.goToFirstPage();

// Template usage
<button (click)="store.goToFirstPage()">First Page</button>
```

### goToLastPage()

Navigate to the last page.

```typescript
// Go to last page
await store.goToLastPage();

// Template usage
<button (click)="store.goToLastPage()">Last Page</button>
```

### setPageSize(size)

Change the number of items per page.

```typescript
// Change page size to 50
await store.setPageSize(50);

// Template usage with select
<select (change)="store.setPageSize(+$event.target.value)">
  <option value="10">10 per page</option>
  <option value="20">20 per page</option>
  <option value="50">50 per page</option>
  <option value="100">100 per page</option>
</select>
```

---

## Pagination Signals

Access pagination state through reactive signals.

### pagination.page()

Current page number (1-indexed).

```typescript
const currentPage = store.pagination.page();
console.log(`Currently on page ${currentPage}`);

// Template
<span>Page {{ store.pagination.page() }}</span>
```

### pagination.pageSize()

Number of items per page.

```typescript
const size = store.pagination.pageSize();
console.log(`Showing ${size} items per page`);

// Template
<span>{{ store.pagination.pageSize() }} items per page</span>
```

### pagination.total()

Total number of items across all pages.

```typescript
const totalItems = store.pagination.total();
console.log(`${totalItems} total items`);

// Template
<span>{{ store.pagination.total() }} total users</span>
```

### pagination.totalPages()

Total number of pages.

```typescript
const pages = store.pagination.totalPages();
console.log(`${pages} pages total`);

// Template
<span>of {{ store.pagination.totalPages() }} pages</span>
```

### pagination.hasNext()

Whether there is a next page.

```typescript
if (store.pagination.hasNext()) {
  console.log('More pages available');
}

// Template - disable next button
<button [disabled]="!store.pagination.hasNext()">
  Next
</button>
```

### pagination.hasPrev()

Whether there is a previous page.

```typescript
if (store.pagination.hasPrev()) {
  console.log('Can go back');
}

// Template - disable previous button
<button [disabled]="!store.pagination.hasPrev()">
  Previous
</button>
```

---

## Filtering

Apply filters to narrow down results.

### updateFilter(key, value)

Set a single filter.

```typescript
// Filter by status
await store.updateFilter('status', 'active');

// Filter by role
await store.updateFilter('role', 'admin');

// Template usage
<select (change)="store.updateFilter('status', $event.target.value)">
  <option value="">All</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>
```

### updateFilters(filters)

Set multiple filters at once.

```typescript
// Set multiple filters
await store.updateFilters({
  status: 'active',
  role: 'admin',
  department: 'IT'
});

// Component method
async applyFilters() {
  await this.store.updateFilters({
    status: this.statusControl.value,
    role: this.roleControl.value,
    search: this.searchControl.value
  });
}
```

### clearFilter(key)

Remove a specific filter.

```typescript
// Clear status filter
await store.clearFilter('status');

// Template
<button (click)="store.clearFilter('status')">
  Clear Status Filter
</button>
```

### clearFilters()

Remove all filters.

```typescript
// Clear all filters
await store.clearFilters();

// Template
<button (click)="store.clearFilters()">
  Clear All Filters
</button>
```

### filters()

Get current filters as a signal.

```typescript
const currentFilters = store.filters();
console.log('Active filters:', currentFilters);

// Template - show active filters
@if (store.filters()['status']) {
  <span class="badge">Status: {{ store.filters()['status'] }}</span>
}
```

---

## Sorting

Sort results by field and direction.

### updateSort(field, direction)

Set sorting configuration.

```typescript
// Sort by name ascending
await store.updateSort('name', 'asc');

// Sort by created date descending
await store.updateSort('createdAt', 'desc');

// Template - sortable column header
<th (click)="store.updateSort('name', toggleDirection())">
  Name
  @if (store.sort()?.field === 'name') {
    <span>{{ store.sort()?.direction === 'asc' ? '↑' : '↓' }}</span>
  }
</th>
```

### clearSort()

Remove sorting.

```typescript
// Clear sorting
await store.clearSort();

// Template
<button (click)="store.clearSort()">Clear Sort</button>
```

### sort()

Get current sort configuration.

```typescript
const sortConfig = store.sort();
if (sortConfig) {
  console.log(`Sorted by ${sortConfig.field} ${sortConfig.direction}`);
}

// Template - show current sort
@if (store.sort()) {
  <span>
    Sorted by {{ store.sort()?.field }} 
    ({{ store.sort()?.direction }})
  </span>
}
```

---

## Combined Operations

Combine pagination, filtering, and sorting in a single request.

### loadAll() with Parameters

```typescript
// Load with current pagination, filters, and sort
await store.loadAll();

// The store automatically includes:
// - Current page
// - Current page size
// - Active filters
// - Active sort configuration
```

### Complete Example

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div class="filters">
      <input 
        placeholder="Search..."
        (input)="onSearch($event.target.value)" />
      
      <select (change)="onStatusChange($event.target.value)">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      
      <button (click)="clearAll()">Clear Filters</button>
    </div>

    <table>
      <thead>
        <tr>
          <th (click)="sortBy('name')">
            Name {{ getSortIcon('name') }}
          </th>
          <th (click)="sortBy('email')">
            Email {{ getSortIcon('email') }}
          </th>
          <th (click)="sortBy('createdAt')">
            Created {{ getSortIcon('createdAt') }}
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

## Server-Side Pagination

Handle pagination on the server for large datasets.

### Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  private http = inject(HttpClient);

  constructor() {
    super({
      name: 'users',
      defaultPageSize: 20,
      localPagination: false  // Server-side (default)
    });
  }

  async loadAllApi() {
    // Build query parameters
    const params = new HttpParams()
      .set('page', this.pagination.page().toString())
      .set('size', this.pagination.pageSize().toString());

    // Add filters
    const filters = this.filters();
    Object.keys(filters).forEach(key => {
      params = params.set(key, filters[key]);
    });

    // Add sorting
    const sort = this.sort();
    if (sort) {
      params = params.set('sortBy', sort.field);
      params = params.set('sortDirection', sort.direction);
    }

    // Make API request
    const response = await firstValueFrom(
      this.http.get<PaginatedResponse<User>>('/api/users', { params })
    );

    // Update pagination state
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

## Client-Side Pagination

Paginate data locally (useful for small datasets or offline support).

### Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  private http = inject(HttpClient);

  constructor() {
    super({
      name: 'products',
      defaultPageSize: 12,
      localPagination: true  // Client-side pagination
    });
  }

  async loadAllApi() {
    // Fetch all data once
    const allProducts = await firstValueFrom(
      this.http.get<Product[]>('/api/products/all')
    );

    // Store handles pagination locally
    return allProducts;
  }

  async loadOneApi(id: number) {
    return firstValueFrom(
      this.http.get<Product>(`/api/products/${id}`)
    );
  }
}
```

**Note:** With `localPagination: true`, the store:
- Fetches all data once
- Handles filtering, sorting, and pagination in memory
- No server requests on page changes
- Ideal for datasets under 1000 items

---

## UI Integration

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
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let user">{{ user.name }}</td>
      </ng-container>
      
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
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
          <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
          <th pSortableColumn="email">Email <p-sortIcon field="email"></p-sortIcon></th>
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
    // Update page
    const page = (event.first / event.rows) + 1;
    await this.store.goToPage(page);

    // Update page size if changed
    if (event.rows !== this.store.pagination.pageSize()) {
      await this.store.setPageSize(event.rows);
    }

    // Update sort
    if (event.sortField) {
      const direction = event.sortOrder === 1 ? 'asc' : 'desc';
      await this.store.updateSort(event.sortField, direction);
    }
  }
}
```

---

## Best Practices

### 1. Use Server-Side for Large Datasets

```typescript
// ✅ Server-side for 10,000+ items
super({
  name: 'users',
  localPagination: false,
  defaultPageSize: 20
});

// ❌ Client-side for large datasets causes performance issues
super({
  name: 'users',
  localPagination: true  // Don't do this for large datasets
});
```

### 2. Persist Pagination State

```typescript
// Save user's page preference
super({
  name: 'users',
  persistence: {
    enabled: true,
    storage: 'sessionStorage',
    paths: ['pagination', 'filters', 'sort']
  }
});
```

### 3. Reset to Page 1 on Filter Change

```typescript
async applyFilter(key: string, value: any) {
  await this.store.updateFilter(key, value);
  // Filter change automatically resets to page 1
  // No need to manually call goToFirstPage()
}
```

### 4. Debounce Search Filters

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

### 5. Show Loading State

```typescript
@Component({
  template: `
    @if (store.signals.isLoading()) {
      <div class="loading">Loading...</div>
    }
    
    @for (item of store.signals.all(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `
})
```

---

## Related Documentation

- [Entity Store](store.md) - Complete store documentation
- [State Persistence](persistence.md) - Persist pagination state
- [Examples](examples.md) - Real-world pagination examples
- [Installation](installation.md) - Getting started

---

**Master pagination with ng-signalify! 📄**
