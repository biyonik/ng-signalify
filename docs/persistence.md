# State Persistence Guide

> **🇹🇷 For Turkish version:** [docs/tr/persistence.md](tr/persistence.md)

## Table of Contents

- [What is State Persistence?](#what-is-state-persistence)
- [Configuration](#configuration)
- [Storage Options](#storage-options)
- [What to Persist](#what-to-persist)
- [Restore on Init](#restore-on-init)
- [Clear Persisted State](#clear-persisted-state)
- [Storage Keys](#storage-keys)
- [Security Considerations](#security-considerations)
- [Performance Tips](#performance-tips)
- [Examples](#examples)
- [Disable Persistence](#disable-persistence)
- [Best Practices](#best-practices)

---

## What is State Persistence?

State persistence allows you to **save and restore** store state across browser sessions. This provides a better user experience by:

- 🔄 **Preserving filters** - Users don't lose their search criteria when navigating away
- 📄 **Remembering pagination** - Returns users to the same page they were viewing
- ↕️ **Maintaining sort** - Keeps the data sorted the way users prefer
- 💾 **Saving selections** - Remembers which items users had selected

### Without Persistence

```typescript
// User applies filters
await store.updateFilter('status', 'active');
await store.updateFilter('role', 'admin');

// User navigates to another page and comes back
// ❌ Filters are lost, have to reapply them
```

### With Persistence

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    paths: ['filters']
  }
});

// User applies filters
await store.updateFilter('status', 'active');

// User navigates away and comes back
// ✅ Filters are still there!
```

---

## Configuration

Enable persistence in your EntityStore configuration.

### Basic Configuration

```typescript
import { Injectable } from '@angular/core';
import { EntityStore } from 'ng-signalify/store';

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,                                    // Enable persistence
        storage: 'sessionStorage',                        // Storage type
        paths: ['filters', 'sort', 'pagination']         // What to persist
      }
    });
  }
}
```

### Configuration Options

```typescript
interface PersistenceConfig {
  enabled: boolean;                    // Enable/disable persistence
  storage: 'sessionStorage' | 'localStorage';  // Storage backend
  paths: string[];                     // State paths to persist
  key?: string;                        // Custom storage key (optional)
}
```

---

## Storage Options

Choose between `sessionStorage` and `localStorage` based on your needs.

### sessionStorage (Recommended for Most Cases)

**Characteristics:**
- ✅ Data persists **during browser session only**
- ✅ Cleared when tab or browser closes
- ✅ More private (data not shared across tabs)
- ✅ Recommended for temporary state

**Use for:**
- Search filters
- Temporary preferences
- Session-specific state

```typescript
persistence: {
  enabled: true,
  storage: 'sessionStorage',
  paths: ['filters', 'sort', 'pagination']
}
```

### localStorage (For Long-Term Preferences)

**Characteristics:**
- ✅ Data persists **indefinitely**
- ✅ Survives browser restart
- ✅ Shared across all tabs
- ⚠️ Less private

**Use for:**
- User preferences (theme, language)
- Long-term settings
- Cross-tab state sharing

```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters', 'pagination']
}
```

---

## What to Persist

Choose which parts of the store state to persist.

### Recommended Paths

```typescript
paths: ['filters', 'sort', 'pagination']
```

**Explanation:**
- `filters` - User's search and filter criteria
- `sort` - Sort field and direction
- `pagination` - Current page and page size

### Optional Paths

```typescript
paths: ['filters', 'sort', 'pagination', 'selection']
```

**Additional paths:**
- `selection` - Selected entity IDs (use carefully, can become stale)

### What NOT to Persist

**❌ Don't persist:**
- `entities` - Entity data can become stale
- `error` - Error state should not be persisted
- `isLoading` - Loading state is temporary

```typescript
// ❌ Bad practice
paths: ['entities', 'filters', 'sort']  // Don't persist entities!

// ✅ Good practice
paths: ['filters', 'sort', 'pagination']
```

---

## Restore on Init

Persisted state is **automatically restored** when the store is created.

### Automatic Restoration

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
    // State is automatically restored here
    // filters(), sort(), and pagination.page() contain persisted values
  }
}
```

### Component Usage

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <!-- Filters automatically applied from persisted state -->
    @if (store.filters()['status']) {
      <span class="badge">Status: {{ store.filters()['status'] }}</span>
    }
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    // Load data with restored filters, sort, and pagination
    this.store.loadAll();
    // User sees the same view they had before
  }
}
```

---

## Clear Persisted State

Remove persisted state manually or on specific events.

### Method 1: Clear from Storage

```typescript
// Clear specific store
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('ng-signalify-users');
}

// Or for localStorage
if (typeof window !== 'undefined') {
  localStorage.removeItem('ng-signalify-users');
}
```

### Method 2: Clear on Logout

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  async logout() {
    // Clear all persisted state
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      // Or selectively clear
      sessionStorage.removeItem('ng-signalify-users');
      sessionStorage.removeItem('ng-signalify-products');
    }

    // Logout and redirect
    await this.logoutFromServer();
    this.router.navigate(['/login']);
  }
}
```

### Method 3: Clear in Store

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  clearPersistedState() {
    if (typeof window !== 'undefined') {
      const key = `ng-signalify-${this.config.name}`;
      const storage = this.config.persistence?.storage === 'localStorage'
        ? localStorage
        : sessionStorage;
      storage.removeItem(key);
    }
  }
}

// Usage
store.clearPersistedState();
```

---

## Storage Keys

Understand how storage keys are generated.

### Default Key Format

```typescript
// Format: ng-signalify-{storeName}
const key = `ng-signalify-users`;
```

### Custom Key

```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters'],
  key: 'app_user_filters_v2'  // Custom key for versioning
}
```

**Use custom keys for:**
- Versioning (when changing stored structure)
- Multiple stores with same name
- Avoiding conflicts with other libraries

---

## Security Considerations

**⚠️ Important Security Notes:**

### Never Persist Sensitive Data

```typescript
// ❌ NEVER persist sensitive data
paths: ['password', 'token', 'creditCard']  // DON'T DO THIS!

// ✅ Only persist UI state
paths: ['filters', 'sort', 'pagination']
```

### What's Safe to Persist

**✅ Safe:**
- Filters (status, role, department)
- Sort configuration
- Pagination state
- UI preferences (theme, layout)

**❌ Unsafe:**
- Passwords
- Authentication tokens
- Credit card data
- Personal identifiable information (PII)
- API keys

### Clear on Logout

```typescript
async logout() {
  // IMPORTANT: Clear persisted state on logout
  sessionStorage.clear();
  localStorage.clear();
  
  await this.authService.logout();
}
```

---

## Performance Tips

Optimize persistence for better performance.

### 1. Don't Persist Large Entity Lists

```typescript
// ❌ Bad - persisting 10,000 entities
paths: ['entities', 'filters']

// ✅ Good - only persist UI state
paths: ['filters', 'sort', 'pagination']
```

### 2. Use sessionStorage for Most Cases

```typescript
// ✅ sessionStorage is faster and more private
storage: 'sessionStorage'

// Only use localStorage when data must survive browser restart
storage: 'localStorage'
```

### 3. Set Cache TTL

```typescript
super({
  name: 'users',
  cacheTTL: 5 * 60 * 1000,  // 5 minutes
  persistence: {
    enabled: true,
    paths: ['filters']
  }
});
```

### 4. Limit Persisted Paths

```typescript
// ❌ Too much
paths: ['entities', 'filters', 'sort', 'pagination', 'selection', 'error']

// ✅ Just what's needed
paths: ['filters', 'pagination']
```

---

## Examples

### Example 1: User Preferences (localStorage)

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,
        storage: 'localStorage',  // Survives browser restart
        paths: ['filters', 'sort', 'pagination']
      }
    });
  }
}
```

**Use case:** User's preferred filters and sort should persist across sessions.

### Example 2: Session State (sessionStorage)

```typescript
@Injectable({ providedIn: 'root' })
export class OrderStore extends EntityStore<Order> {
  constructor() {
    super({
      name: 'orders',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',  // Cleared on tab close
        paths: ['filters', 'pagination']
      }
    });
  }
}
```

**Use case:** Temporary session state that should not persist across browser restarts.

### Example 3: Filters Only

```typescript
@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters']  // Only filters, not pagination
      }
    });
  }
}
```

**Use case:** Remember filters but always start from page 1.

### Example 4: Custom Key for Versioning

```typescript
@Injectable({ providedIn: 'root' })
export class ReportStore extends EntityStore<Report> {
  constructor() {
    super({
      name: 'reports',
      persistence: {
        enabled: true,
        storage: 'localStorage',
        paths: ['filters'],
        key: 'app_reports_v2'  // Version 2 key
      }
    });
  }
}
```

**Use case:** New version of app with different filter structure.

---

## Disable Persistence

### Disable Globally

```typescript
super({
  name: 'users',
  persistence: {
    enabled: false  // Disabled
  }
});
```

### Omit Config (Default Disabled)

```typescript
super({
  name: 'users'
  // No persistence config = disabled
});
```

### Conditional Disabling

```typescript
super({
  name: 'users',
  persistence: {
    enabled: !environment.production,  // Only in development
    paths: ['filters']
  }
});
```

---

## Best Practices

### 1. Use sessionStorage for Temporary State

```typescript
// ✅ Good for most cases
storage: 'sessionStorage'
```

### 2. Use localStorage for User Preferences

```typescript
// ✅ Good for settings that should survive restarts
storage: 'localStorage'
paths: ['filters', 'pagination']
```

### 3. Clear on Logout

```typescript
async logout() {
  sessionStorage.clear();
  localStorage.removeItem('ng-signalify-users');
}
```

### 4. Test with Storage Disabled

```typescript
// Test that app works when storage is blocked/unavailable
if (typeof window !== 'undefined') {
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
  } catch (e) {
    console.warn('Storage not available');
  }
}
```

### 5. Version Your Keys

```typescript
// Use versioned keys when structure changes
key: 'app_users_v2'
```

### 6. Don't Persist Everything

```typescript
// ❌ Too much
paths: ['entities', 'filters', 'sort', 'pagination', 'selection']

// ✅ Just what's needed
paths: ['filters', 'pagination']
```

---

## Related Documentation

- [Entity Store](store.md) - Complete store documentation
- [Pagination](pagination.md) - Pagination with persistence
- [Examples](examples.md) - Real-world persistence examples
- [Installation](installation.md) - Getting started

---

**Persist state effectively with ng-signalify! 💾**
