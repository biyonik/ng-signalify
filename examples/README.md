# ng-signalify Examples

This directory contains complete, runnable examples demonstrating how to use ng-signalify v2.0 with different UI strategies.

---

## 📁 Available Examples

### 1. Material Adapter Example
**File:** `material-adapter-example.ts`

Complete CRUD application using Angular Material for UI.

**What it demonstrates:**
- ✅ Using ng-signalify with Angular Material
- ✅ Form management with Material form fields
- ✅ Entity store with Material table
- ✅ CRUD operations with Material dialogs
- ✅ Pagination with Material paginator
- ✅ Toast notifications with MatSnackBar

**Use this if:**
- You want professional, pre-built UI components
- You're using or planning to use Angular Material
- You want a quick start with minimal custom styling

---

### 2. Headless Adapter Example
**File:** `headless-adapter-example.ts`

Complete CRUD application with custom UI components.

**What it demonstrates:**
- ✅ Using ng-signalify with custom UI
- ✅ Building your own input/select components
- ✅ Custom product grid with cards
- ✅ Complete design freedom
- ✅ Lightweight implementation

**Use this if:**
- You have a custom design system
- You're using other UI libraries (PrimeNG, Spartan, etc.)
- You want complete control over styling
- You want the smallest possible bundle size

---

## 🚀 How to Use These Examples

### Option 1: Copy & Paste

1. Copy the example file content
2. Create components in your project
3. Adjust imports and paths
4. Customize as needed

### Option 2: Run Standalone

```bash
# Create a new Angular project
ng new my-app --standalone

# Install dependencies
npm install ng-signalify zod

# For Material example
ng add @angular/material

# Copy example file to your project
cp examples/material-adapter-example.ts src/app/

# Import in your app
```

### Option 3: Learn & Adapt

Study the examples to understand patterns, then build your own implementation.

---

## 📚 What Each Example Covers

### Common Features (Both Examples)

- **Field Definitions**: StringField, IntegerField, EnumField, BooleanField
- **Form Management**: createEnhancedForm with validation
- **Entity Store**: Full CRUD with pagination, caching, optimistic updates
- **HTTP Client**: Type-safe API calls with retry logic
- **Signals**: Reactive state management throughout

### Material Example Specific

- Material form fields and inputs
- Material table with sorting
- Material paginator
- Material dialogs and snackbars
- Material progress spinner
- Material icons

### Headless Example Specific

- Custom input component with error states
- Custom select component
- Custom product card grid
- Custom pagination controls
- SigFormField wrapper usage
- Pure CSS styling (no framework)

---

## 🎯 Key Differences Between Approaches

| Aspect | Material | Headless |
|--------|----------|----------|
| **Bundle Size** | Larger (Material included) | Smaller (no UI lib) |
| **Setup Time** | Quick (pre-built components) | More time (build components) |
| **Customization** | Theming only | Complete freedom |
| **Accessibility** | Built-in (WCAG) | You implement |
| **Maintenance** | Material updates | You maintain |
| **Best For** | Enterprise apps, quick MVPs | Branded apps, custom designs |

---

## 💡 Tips & Best Practices

### General Tips

1. **Start with fields**: Define your field types first
2. **Let ng-signalify handle validation**: Use built-in validators
3. **Use signals everywhere**: Embrace reactive programming
4. **Leverage the store**: Don't manually manage CRUD state

### Material Tips

1. **Import only what you need**: Tree-shake Material modules
2. **Use form field appearance**: `outline` looks modern
3. **Leverage Material icons**: Rich icon set available
4. **Use Material theming**: Customize colors globally

### Headless Tips

1. **Use SigFormField wrapper**: Consistent error display
2. **Build reusable components**: Create your component library
3. **Focus on UX**: Handle loading, errors, empty states
4. **Consider accessibility**: Add ARIA labels, keyboard support

---

## 🔄 Migration Example

### Before (v1.x)

```typescript
import { SigInput, SigSelect } from 'ng-signalify/components';

// Template
<sig-form-field label="Name">
  <sig-input [(value)]="form.fields.name.value" />
</sig-form-field>
```

### After (v2.x with Material)

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

// Template
<mat-form-field>
  <mat-label>Name</mat-label>
  <input matInput 
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
</mat-form-field>
```

### After (v2.x with Headless)

```typescript
import { SigFormField } from 'ng-signalify/components/core';

// Template
<sig-form-field label="Name" [error]="form.fields.name.combinedError()">
  <input 
    type="text"
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
</sig-form-field>
```

**Notice:** The form logic code is **identical** in all three cases!

---

## 📖 Additional Resources

- [README.md](../README.md) - Main documentation
- [MIGRATION.md](../MIGRATION.md) - Migration guide
- [DOCUMENTATION.md](../DOCUMENTATION.md) - API reference
- [Adapter README](../lib/adapters/README.md) - Adapter details

---

## 🆘 Need Help?

- **Issues:** [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Discussions:** [github.com/biyonik/ng-signalify/discussions](https://github.com/biyonik/ng-signalify/discussions)
- **Email:** ahmet.altun60@gmail.com

---

## ✅ Quick Checklist

Before using these examples:

- [ ] Read the example comments thoroughly
- [ ] Install required dependencies (ng-signalify, zod, @angular/material if needed)
- [ ] Set up adapter in app.config.ts
- [ ] Understand the field → form → store flow
- [ ] Customize to match your needs

---

<div align="center">

**Happy Coding!** 🚀

If these examples helped you, consider ⭐ starring the repo!

</div>
