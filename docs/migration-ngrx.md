# Migration Guide: NgRx → ng-signalify

> **🇹🇷 Türkçe versiyon için:** [docs/tr/migration-ngrx.md](tr/migration-ngrx.md)

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Key Differences](#key-differences)
- [Migration Strategy](#migration-strategy)
- [Step-by-Step Guide](#step-by-step-guide)
- [Side-by-Side Comparisons](#side-by-side-comparisons)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Why Migrate?

### Benefits of ng-signalify

| Benefit | Description | Impact |
|---------|-------------|--------|
| **87% Less Code** | ~150 lines of NgRx boilerplate → ~20 lines with EntityStore | ⚡ Faster development |
| **Signals Native** | Built on Angular Signals, no RxJS required | 🎯 Modern Angular patterns |
| **Easier Learning Curve** | No actions, reducers, effects to learn | 👨‍💻 Faster onboarding |
| **Smaller Bundle** | No @ngrx/store, @ngrx/effects dependencies | 📦 Better performance |
| **Built-in Features** | Pagination, filtering, caching out of the box | 🚀 Less custom code |
| **Type Safety** | Full TypeScript inference throughout | ✅ Fewer runtime errors |

### Code Reduction Example

**NgRx (Traditional):**
```typescript
// ~150 lines across 4 files:
// - actions.ts
// - reducer.ts
// - effects.ts
// - selectors.ts
```

**ng-signalify:**
```typescript
// ~20 lines in 1 file:
// - user.store.ts
```

### When NOT to Migrate

Consider staying with NgRx if:

- ❌ **Complex state orchestration** - Multiple stores with intricate dependencies
- ❌ **Heavy RxJS usage** - Your team is deeply invested in RxJS patterns
- ❌ **Time-travel debugging** - You rely heavily on NgRx DevTools' time-travel
- ❌ **Large existing codebase** - Migration cost outweighs benefits (unless gradual migration is feasible)
- ❌ **Team expertise** - Team has deep NgRx knowledge but no Signals experience

ng-signalify is ideal for:

- ✅ **CRUD-heavy applications** - User management, product catalogs, admin panels
- ✅ **New projects** - Starting fresh with modern Angular
- ✅ **Modernization** - Moving away from legacy patterns
- ✅ **Signals adoption** - Embracing Angular's signal-based future

---

## Key Differences

### Comparison Table

| Feature | NgRx | ng-signalify |
|---------|------|--------------|
| **State** | Store + Reducers | EntityStore (signal-based) |
| **Updates** | Actions + Reducers | Direct method calls |
| **Side Effects** | Effects (RxJS) | Async/await methods |
| **Selectors** | Memoized selectors | Computed signals |
| **DevTools** | Redux DevTools | Browser DevTools (signals) |
| **Boilerplate** | High (~150 lines) | Low (~20 lines) |
| **Learning Curve** | Steep | Gentle |
| **Bundle Size** | Large | Small |
| **Pagination** | Manual | Built-in |
| **Filtering** | Manual | Built-in |
| **Caching** | Manual | Built-in (TTL) |
| **Optimistic Updates** | Manual | Built-in |

### Conceptual Mapping

| NgRx Concept | ng-signalify Equivalent |
|--------------|------------------------|
| `Store` | `EntityStore` |
| `createAction()` | Direct method calls (`create()`, `update()`, etc.) |
| `createReducer()` | Not needed (state managed internally) |
| `createEffect()` | Protected async methods (`createOne()`, `updateOne()`, etc.) |
| `createSelector()` | `computed()` signals |
| `@ngrx/entity` adapter | Built into EntityStore |
| Actions dispatch | Direct async method calls |
| `select()` from store | Signal read `store.signals.all()` |

---

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

**Best for:** Large applications, production systems

**Approach:**
1. Keep existing NgRx code working
2. Migrate one feature/module at a time
3. Both NgRx and ng-signalify coexist temporarily
4. Test each migration thoroughly
5. Remove NgRx when all features migrated

**Timeline:** 4-12 weeks depending on app size

**Example:**
```typescript
// Week 1: Migrate UserStore
// Week 2: Migrate ProductStore
// Week 3: Migrate OrderStore
// Week 4: Remove NgRx dependencies
```

**Pros:**
- ✅ Lower risk
- ✅ Can roll back easily
- ✅ Team can learn gradually

**Cons:**
- ❌ Longer migration period
- ❌ Two state management systems temporarily

### Option 2: Complete Rewrite

**Best for:** Small applications, greenfield projects

**Approach:**
1. Create new EntityStore implementations
2. Update all components at once
3. Remove all NgRx code
4. Single deployment

**Timeline:** 1-2 weeks

**Pros:**
- ✅ Clean cutover
- ✅ No mixed patterns

**Cons:**
- ❌ Higher risk
- ❌ More testing required
- ❌ Harder to roll back

---

## Step-by-Step Guide

### Step 1: Install ng-signalify

```bash
npm install ng-signalify
# or
pnpm add ng-signalify
```

### Step 2: Analyze Your NgRx Code

Identify what needs to migrate:

```typescript
// Example NgRx structure
users/
├── actions/
│   └── user.actions.ts       // ~30 lines
├── reducers/
│   └── user.reducer.ts       // ~40 lines
├── effects/
│   └── user.effects.ts       // ~60 lines
├── selectors/
│   └── user.selectors.ts     // ~20 lines
└── models/
    └── user.model.ts         // Keep this!
```

### Step 3: Create EntityStore

**Before (NgRx):**

```typescript
// user.actions.ts (~30 lines)
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
// user.reducer.ts (~40 lines)
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
// user.effects.ts (~60 lines)
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
// user.selectors.ts (~20 lines)
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

**Total: ~150 lines across 4 files**

**After (ng-signalify):**

```typescript
// user.store.ts (~20 lines)
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

**Total: ~20 lines in 1 file** ✨

### Step 4: Update Components

**Before (NgRx):**

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
        <div class="spinner">Loading...</div>
      }

      @if (error$ | async; as error) {
        <div class="error">{{ error }}</div>
      }

      @for (user of users$ | async; track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button (click)="edit(user)">Edit</button>
          <button (click)="delete(user.id)">Delete</button>
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
    // Navigate to edit page
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.store.dispatch(UserActions.deleteUser({ id }));
    }
  }
}
```

**After (ng-signalify):**

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
        <div class="spinner">Loading...</div>
      }

      @if (store.signals.error(); as error) {
        <div class="error">{{ error }}</div>
      }

      @for (user of store.signals.all(); track user.id) {
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button (click)="edit(user)">Edit</button>
          <button (click)="delete(user.id)">Delete</button>
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
    // Navigate to edit page
  }

  async delete(id: number) {
    if (confirm('Are you sure?')) {
      await this.store.delete(id);
    }
  }
}
```

**Key Changes:**
- ❌ No `Observable` or `async` pipe
- ❌ No `store.select()` or selectors
- ❌ No `store.dispatch()` or actions
- ✅ Direct signal reads: `store.signals.all()`
- ✅ Direct method calls: `store.loadAll()`, `store.delete()`
- ✅ Async/await instead of RxJS

### Step 5: Remove NgRx (Final Step)

Once all features are migrated:

```bash
npm uninstall @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
```

Remove from `app.config.ts`:
```typescript
// Remove these
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// Remove from providers
providers: [
  // provideStore({ users: userReducer }), // ❌ Remove
  // provideEffects([UserEffects]),        // ❌ Remove
  // provideStoreDevtools(),               // ❌ Remove
]
```

---

## Side-by-Side Comparisons

### Load Entities

**NgRx:**
```typescript
// Component
this.store.dispatch(UserActions.loadUsers());

// Effect (automatic)
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
// Component
await this.store.loadAll();

// Store method (inherited from EntityStore)
// No additional code needed!
```

### Create Entity

**NgRx:**
```typescript
// Component
this.store.dispatch(UserActions.createUser({ 
  user: { name: 'John', email: 'john@example.com' } 
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
// Component
const user = await this.store.create({ 
  name: 'John', 
  email: 'john@example.com' 
});

if (!user) {
  // Handle error
  console.error(this.store.signals.error());
}
```

### Update Entity

**NgRx:**
```typescript
// Component
this.store.dispatch(UserActions.updateUser({ 
  id: userId, 
  changes: { name: 'Jane' } 
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
// Component
const user = await this.store.update(userId, { name: 'Jane' });

if (!user) {
  console.error(this.store.signals.error());
}
```

### Delete Entity

**NgRx:**
```typescript
// Component
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
// Component
const success = await this.store.delete(userId);

if (!success) {
  console.error(this.store.signals.error());
}
```

### Selectors vs Computed Signals

**NgRx:**
```typescript
// Selectors file
export const selectActiveUsers = createSelector(
  selectAll,
  (users) => users.filter((user) => user.status === 'active')
);

export const selectUserById = (id: number) => createSelector(
  selectEntities,
  (entities) => entities[id]
);

// Component
activeUsers$ = this.store.select(selectActiveUsers);
user$ = this.store.select(selectUserById(userId));
```

**ng-signalify:**
```typescript
// Component
activeUsers = computed(() => 
  this.store.signals.all().filter(u => u.status === 'active')
);

user = computed(() => 
  this.store.signals.byId(userId)()
);

// Or directly in template
// {{ store.signals.all().filter(...) }}
```

---

## Common Patterns

### Pagination

**NgRx (Manual):**
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

// Component
nextPage() {
  const currentPage = // ... get from state
  this.store.dispatch(UserActions.setPage({ 
    page: currentPage + 1, 
    pageSize: 20 
  }));
}
```

**ng-signalify (Built-in):**
```typescript
// Component
nextPage() {
  this.store.nextPage(); // That's it!
}

// Template
<button 
  (click)="store.nextPage()" 
  [disabled]="!store.pagination.hasNext()">
  Next
</button>

<span>Page {{ store.pagination.page() }} of {{ store.pagination.totalPages() }}</span>
```

### Filtering

**NgRx (Manual):**
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

**ng-signalify (Built-in):**
```typescript
// Component
await this.store.updateFilter('status', 'active');

// Or update multiple
await this.store.updateFilters({
  status: 'active',
  role: 'admin'
});

// Clear filters
await this.store.clearFilters();
```

### Optimistic Updates

**NgRx (Manual):**
```typescript
// Effect with optimistic update
updateUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.updateUser),
    tap(({ id, changes }) => {
      // Optimistic update
      this.store.dispatch(UserActions.updateUserOptimistic({ id, changes }));
    }),
    switchMap(({ id, changes }) =>
      this.userService.update(id, changes).pipe(
        map((user) => UserActions.updateUserSuccess({ user })),
        catchError((error) => {
          // Rollback
          this.store.dispatch(UserActions.updateUserRollback({ id }));
          return of(UserActions.updateUserFailure({ error }));
        })
      )
    )
  )
);

// Additional actions and reducer logic needed
```

**ng-signalify (Built-in):**
```typescript
// Just enable in config
super({
  name: 'users',
  optimistic: true // That's it!
});

// Now all updates are optimistic automatically
await this.store.update(userId, { status: 'inactive' });
// UI updates instantly, rolls back on error
```

---

## Troubleshooting

### Complex Effects

**Problem:** You have complex effects with multiple dependencies.

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
          NotificationActions.showSuccess({ message: 'User created' }),
          AuditActions.logAction({ action: 'USER_CREATED', userId: user.id })
        ])
      )
    )
  )
);
```

**ng-signalify:**
```typescript
// Override create method
override async create(data: Partial<User>): Promise<User | null> {
  // Access other stores directly
  const org = this.orgStore.signals.selected();
  const settings = this.settingsStore.signals.current();
  
  const user = await super.create({
    ...data,
    organizationId: org?.id,
    settings: settings
  });
  
  if (user) {
    this.notificationService.showSuccess('User created');
    this.auditService.log('USER_CREATED', user.id);
  }
  
  return user;
}
```

**Key Difference:** Imperative code is often clearer than reactive streams for complex logic.

### Large Codebases

**Problem:** Hundreds of action types and effects to migrate.

**Solution:** Gradual migration

1. **Phase 1: New features only**
   - All new features use ng-signalify
   - Existing features stay on NgRx

2. **Phase 2: High-traffic features**
   - Migrate most-used pages first
   - Maximum user impact

3. **Phase 3: Low-risk features**
   - Migrate admin panels, settings pages
   - Lower usage, easier to fix issues

4. **Phase 4: Complete**
   - Remove NgRx dependencies
   - Clean up code

**Timeline:** 3-6 months for large apps

### Testing

**Problem:** Need to update tests.

**NgRx Tests:**
```typescript
describe('UserEffects', () => {
  it('should load users successfully', (done) => {
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

**ng-signalify Tests:**
```typescript
describe('UserStore', () => {
  it('should load users successfully', async () => {
    const users = [mockUser1, mockUser2];
    http.get.mockResolvedValue({ data: { data: users, total: 2 } });

    await store.loadAll();

    expect(store.signals.all()).toEqual(users);
    expect(store.signals.isLoading()).toBe(false);
    expect(store.signals.error()).toBeNull();
  });
});
```

**Key Difference:** Simpler, synchronous-style tests with async/await.

---

## Best Practices

### 1. One Store Per Entity

**Do:**
```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {}

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {}
```

**Don't:**
```typescript
// Avoid combining unrelated entities
export class AppStore {
  users: EntityStore<User>;
  products: EntityStore<Product>;
}
```

### 2. Keep Business Logic in Store

**Do:**
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

**Don't:**
```typescript
// Component (too much logic)
async activateUser(id: number) {
  const user = await this.store.update(id, { status: 'active' });
  if (user) {
    this.emailService.sendActivationEmail(user);
    this.auditService.log('USER_ACTIVATED', id);
  }
}
```

### 3. Use Computed Signals for Derived State

**Do:**
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

**Don't:**
```typescript
// Recomputing on every access
get activeUsers() {
  return this.store.signals.all().filter(u => u.status === 'active');
}
```

### 4. Handle Errors Gracefully

**Do:**
```typescript
async saveUser(data: Partial<User>) {
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

**Don't:**
```typescript
// Silent failures
async saveUser(data: Partial<User>) {
  await this.store.create(data);
  this.router.navigate(['/users']); // Might not have been created!
}
```

### 5. Leverage Built-in Features

**Do:**
```typescript
// Use built-in pagination
super({
  name: 'users',
  defaultPageSize: 20
});

// Component
nextPage() {
  this.store.nextPage();
}
```

**Don't:**
```typescript
// Manual pagination
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

## Summary

### Migration Checklist

- [ ] Install ng-signalify
- [ ] Choose migration strategy (gradual vs complete)
- [ ] Create EntityStore classes
- [ ] Implement abstract methods (fetchAll, fetchOne, etc.)
- [ ] Update components to use store signals
- [ ] Remove NgRx actions, reducers, effects, selectors
- [ ] Update tests
- [ ] Remove @ngrx dependencies

### Key Takeaways

1. **Less Code:** 87% reduction in boilerplate
2. **Modern Patterns:** Signal-based, async/await
3. **Built-in Features:** Pagination, filtering, caching included
4. **Type Safety:** Full TypeScript support
5. **Easy Learning:** Simpler mental model than NgRx

### Next Steps

- Read [EntityStore Documentation](store.md)
- Check [API Reference](../DOCUMENTATION.md)
- Explore [Example Apps](../apps/demo-material/)
- Join [GitHub Discussions](https://github.com/biyonik/ng-signalify/discussions)

---

## Related Documentation

- [EntityStore API](store.md)
- [Angular Forms Migration](migration-forms.md)
- [Main Documentation](../DOCUMENTATION.md)
- [README](../README.md)

---

<div align="center">

**Ready to simplify your state management?** 

[⭐ Star on GitHub](https://github.com/biyonik/ng-signalify) | [📖 Full Documentation](../DOCUMENTATION.md) | [🚀 Quick Start](../README.md#quick-start)

</div>
