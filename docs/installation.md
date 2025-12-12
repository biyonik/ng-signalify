# Installation Guide

> **🇹🇷 For Turkish version:** [docs/tr/installation.md](tr/installation.md)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Package Imports](#package-imports)
- [Setup](#setup)
- [Verify Installation](#verify-installation)
- [Next Steps](#next-steps)

---

## Prerequisites

Before installing ng-signalify, ensure your development environment meets these requirements:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 18+ | Required for npm/pnpm/yarn |
| **Angular** | 19+ | ng-signalify uses latest Signal APIs |
| **TypeScript** | 5.5+ | For advanced type features |
| **Zod** | 3.22+ | Required peer dependency for validation |

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check Angular CLI version
ng version
# Should show Angular CLI 19.0.0 or higher

# Check TypeScript version
tsc --version
# Should output Version 5.5.0 or higher
```

---

## Installation Methods

### Using npm

```bash
npm install ng-signalify zod
```

### Using pnpm (Recommended)

```bash
pnpm add ng-signalify zod
```

### Using yarn

```bash
yarn add ng-signalify zod
```

### Optional Dependencies

ng-signalify has optional peer dependencies for specific features:

```bash
# For Material Design integration (optional)
npm install @angular/material

# For Excel export functionality (optional)
npm install xlsx

# For IndexedDB support (optional)
npm install idb
```

---

## Package Imports

ng-signalify is organized into several sub-packages for tree-shaking optimization:

### Available Packages

```typescript
// Field types for forms
import { StringField, NumberField, EmailField } from 'ng-signalify/fields';

// Validation schemas
import { z } from 'zod';  // Zod is used internally

// Entity store for state management
import { EntityStore } from 'ng-signalify/store';

// HTTP client utilities
import { HttpClient } from 'ng-signalify/api';

// Custom validators (Turkish ID, IBAN, etc.)
import { TcKimlikValidator, IbanValidator } from 'ng-signalify/validators';

// Material Design adapters (optional)
import { MaterialAdapter } from 'ng-signalify/adapters';

// Advanced utilities
import { FormGroup, DynamicForm } from 'ng-signalify/advanced';
```

### Import Examples

**For a simple form:**
```typescript
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';
```

**For entity management:**
```typescript
import { EntityStore } from 'ng-signalify/store';
```

**For validation schemas:**
```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';
```

---

## Setup

### Standalone Components (Recommended)

Angular 19+ recommends standalone components. ng-signalify works seamlessly with this approach:

**Step 1: Import in your component**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <form>
      <input [value]="emailField.value()" 
             (input)="emailField.setValue($event.target.value)" />
      @if (emailField.error()) {
        <span class="error">{{ emailField.error() }}</span>
      }
    </form>
  `
})
export class LoginComponent {
  emailField = new EmailField('email', 'Email Address', {
    required: true
  });
}
```

**Step 2: No additional configuration needed!**

That's it! ng-signalify is designed to work out of the box with standalone components.

---

### NgModule Setup (Legacy)

If you're using NgModule-based applications:

**Step 1: Import in your module**

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    BrowserModule,
    CommonModule
  ],
  providers: []
})
export class AppModule { }
```

**Step 2: Use in components**

```typescript
import { Component } from '@angular/core';
import { StringField, EmailField } from 'ng-signalify/fields';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  emailField = new EmailField('email', 'Email', { required: true });
}
```

**Note:** No special module imports required. ng-signalify fields and stores are injectable services.

---

## Verify Installation

Create a test component to verify installation:

**test.component.ts:**
```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';

@Component({
  selector: 'app-test',
  standalone: true,
  template: `
    <div>
      <h1>ng-signalify Installation Test</h1>
      <p>Field Value: {{ testField.value() }}</p>
      <p>Is Valid: {{ testField.isValid() ? '✅' : '❌' }}</p>
      @if (testField.error()) {
        <p class="error">Error: {{ testField.error() }}</p>
      }
      <button (click)="setValue()">Set Test Value</button>
    </div>
  `,
  styles: [`
    .error { color: red; }
  `]
})
export class TestComponent {
  testField = new StringField('test', 'Test Field', {
    required: true,
    min: 3
  });

  setValue() {
    this.testField.setValue('Hello ng-signalify!');
  }
}
```

**Run your application:**
```bash
ng serve
```

Navigate to your test component. You should see:
- Field value displayed
- Validation status
- Error messages (if invalid)
- Button to set value

---

## Next Steps

Now that ng-signalify is installed, explore these topics:

### 1. Learn Field Types
Start with the field types documentation to understand available fields:
- **[Field Types Guide](fields.md)** - Complete reference for all field types

### 2. Explore Entity Store
Learn how to manage collections of data:
- **[Entity Store Guide](store.md)** - State management with CRUD operations

### 3. Validation
Deep dive into validation strategies:
- **[Validation Guide](validation.md)** - Built-in and custom validators

### 4. Pagination
Implement pagination in your data tables:
- **[Pagination Guide](pagination.md)** - Client and server-side pagination

### 5. State Persistence
Persist user preferences and filters:
- **[Persistence Guide](persistence.md)** - Save and restore state

### 6. Examples
See real-world examples:
- **[Examples Collection](examples.md)** - Login forms, CRUD, master-detail, etc.

---

## Troubleshooting

### Common Issues

**Issue: "Cannot find module 'ng-signalify'"**
```bash
# Solution: Ensure installation completed successfully
npm install ng-signalify zod
```

**Issue: "Zod is not installed"**
```bash
# Solution: Install zod peer dependency
npm install zod
```

**Issue: TypeScript errors about Signal types**
```bash
# Solution: Ensure TypeScript 5.5+ is installed
npm install typescript@latest
```

**Issue: Angular version compatibility**
```bash
# Solution: Upgrade to Angular 19+
ng update @angular/core @angular/cli
```

### Getting Help

- **GitHub Issues:** [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Documentation:** [Full Documentation](../DOCUMENTATION.md)
- **Examples:** [Demo Apps](../apps/demo-material)

---

## Related Documentation

- [Field Types](fields.md)
- [Entity Store](store.md)
- [Validation](validation.md)
- [Migration Guide](../MIGRATION.md)
- [Quick Start](../README.md#-quick-start)

---

**Happy coding with ng-signalify! 🚀**
