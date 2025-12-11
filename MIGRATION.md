# Migration Guide: v1.x → v2.x

Welcome to ng-signalify v2.0! This guide will help you migrate from v1.x to v2.x smoothly.

---

## 🎯 Overview of Changes

### What Changed

**v2.0 is a UI-agnostic transformation:**

- ✅ **Core logic** (Fields, Schemas, Store, API) remains **100% backward compatible**
- ✅ **UI components** moved to adapter pattern for flexibility
- ✅ **Smaller bundle** size by making UI dependencies optional
- ✅ **More choice** - use Angular Material, Spartan, or any UI library

### What Didn't Change

- ✅ Field types API (StringField, IntegerField, etc.)
- ✅ Form schema creation (createEnhancedForm)
- ✅ Entity Store API (EntityStore, CRUD operations)
- ✅ Validators (tcKimlik, telefon, etc.)
- ✅ API client (HttpClient, retry logic, etc.)
- ✅ All signals and reactive APIs

**Bottom line:** Your business logic code remains the same. Only UI component imports change.

---

## 🚀 Quick Migration (5 Steps)

### Step 1: Update Package

```bash
npm install ng-signalify@^2.0.0
# or
pnpm add ng-signalify@^2.0.0
```

### Step 2: Choose Your UI Strategy

Pick one:

**Option A: Use Angular Material (Recommended)**

```bash
ng add @angular/material
```

**Option B: Use Headless (Custom UI)**

No additional dependencies needed.

**Option C: Keep Legacy Components (Temporary)**

Use the legacy components while you migrate gradually (they will be removed in v3.0).

### Step 3: Update App Configuration

**For Material:**

```typescript
// app.config.ts
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new MaterialAdapter()),
    // ... other providers
  ]
};
```

**For Headless:**

```typescript
// app.config.ts
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new HeadlessAdapter()),
    // ... other providers
  ]
};
```

### Step 4: Update Component Imports

**Before (v1.x):**

```typescript
import { SigInput, SigSelect, SigFormField } from 'ng-signalify/components';
```

**After (v2.x with Material):**

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
```

**After (v2.x with Headless):**

```typescript
import { SigFormField } from 'ng-signalify/components/core';
// Use your own input components
```

### Step 5: Update Templates

**Before (v1.x):**

```html
<sig-form-field label="Name" [error]="form.fields.name.combinedError()">
  <sig-input [(value)]="form.fields.name.value" />
</sig-form-field>
```

**After (v2.x with Material):**

```html
<mat-form-field>
  <mat-label>Name</mat-label>
  <input matInput 
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
  @if (form.fields.name.error() && form.fields.name.touched()) {
    <mat-error>{{ form.fields.name.error() }}</mat-error>
  }
</mat-form-field>
```

**After (v2.x with Headless):**

```html
<sig-form-field label="Name" [error]="form.fields.name.combinedError()">
  <input 
    type="text"
    [value]="form.fields.name.value()" 
    (input)="form.fields.name.value.set($any($event.target).value)" />
</sig-form-field>
```

---

## 📋 Component Migration Table

| v1.x Component | v2.x Material Equivalent | v2.x Headless |
|----------------|-------------------------|---------------|
| `SigInput` | `mat-input` + `MatInputModule` | Custom input + `SigFormField` |
| `SigTextarea` | `mat-input` (textarea) | Custom textarea + `SigFormField` |
| `SigSelect` | `mat-select` + `MatSelectModule` | Custom select + `SigFormField` |
| `SigCheckbox` | `mat-checkbox` + `MatCheckboxModule` | Custom checkbox |
| `SigRadio` | `mat-radio-button` + `MatRadioModule` | Custom radio |
| `SigDatePicker` | `mat-datepicker` + `MatDatepickerModule` | Custom datepicker |
| `SigAutocomplete` | `mat-autocomplete` + `MatAutocompleteModule` | Custom autocomplete |
| `SigSlider` | `mat-slider` + `MatSliderModule` | Custom slider |
| `SigTable` | `mat-table` + `MatTableModule` | Custom table |
| `SigPagination` | `mat-paginator` + `MatPaginatorModule` | Custom pagination |
| `SigModal` | `mat-dialog` + `MatDialogModule` | Custom modal |
| `SigToast` | `MatSnackBar` + `MatSnackBarModule` | Custom toast |
| `SigTabs` | `mat-tab-group` + `MatTabsModule` | Custom tabs |
| `SigAccordion` | `mat-accordion` + `MatExpansionModule` | Custom accordion |
| `SigTooltip` | `matTooltip` directive | Custom tooltip |
| `SigBadge` | `matBadge` directive | Custom badge |
| `SigCard` | `mat-card` + `MatCardModule` | Custom card |
| `SigLoading` | `mat-progress-spinner` + `MatProgressSpinnerModule` | Custom spinner |
| `SigFormField` | `mat-form-field` + `MatFormFieldModule` | `SigFormField` from `components/core` |

**Note:** `SigFormField` from `components/core` is a lightweight wrapper that works with any UI library.

---

## 🎨 Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

**Best for:** Large applications, risk-averse teams

**Approach:** Migrate page by page or module by module.

```typescript
// Old pages continue using legacy
import { SigInput } from 'ng-signalify/components/_legacy';

// New pages use Material
import { MatInputModule } from '@angular/material/input';
```

**Pros:**
- ✅ Low risk
- ✅ Can test thoroughly
- ✅ No big bang deployment

**Cons:**
- ❌ Longer migration period
- ❌ Two UI systems coexist

**Timeline:** 2-4 weeks

### Strategy 2: Big Bang Migration

**Best for:** Small applications, new projects

**Approach:** Migrate everything at once.

1. Update all imports globally (find & replace)
2. Update all templates
3. Test thoroughly
4. Deploy

**Pros:**
- ✅ Clean cutover
- ✅ No legacy code

**Cons:**
- ❌ Higher risk
- ❌ More testing needed

**Timeline:** 1-2 weeks

### Strategy 3: Hybrid Approach

**Best for:** Medium applications

**Approach:** Migrate critical paths first, then gradually migrate the rest.

1. **Week 1:** Migrate authentication flows (login, register)
2. **Week 2:** Migrate main dashboard
3. **Week 3:** Migrate CRUD pages
4. **Week 4:** Migrate remaining pages

**Pros:**
- ✅ Balanced risk
- ✅ Progressive improvement

**Cons:**
- ❌ Some complexity

**Timeline:** 3-4 weeks

---

## 💥 Breaking Changes

### 1. Component Imports

**Breaking:** Direct component imports no longer work by default.

**Before:**
```typescript
import { SigInput } from 'ng-signalify/components';
```

**After:**
```typescript
// Legacy (temporary)
import { SigInput } from 'ng-signalify/components/_legacy';

// Material (recommended)
import { MatInputModule } from '@angular/material/input';
```

**Fix:** Update imports as shown above.

### 2. Styles Import

**Breaking:** Pre-compiled CSS no longer includes component styles.

**Before:**
```json
// angular.json
"styles": [
  "node_modules/ng-signalify/ng-signalify.css"
]
```

**After (Material):**
```json
// angular.json
"styles": [
  "@angular/material/prebuilt-themes/indigo-pink.css"
]
```

**After (Headless):**
```typescript
// Import only core styles if needed
import 'ng-signalify/styles/core.css';
```

**Fix:** Switch to Material theme or use your own styles.

### 3. Component APIs

**Breaking:** Some component APIs changed to align with Material.

**Example - Select Component:**

**Before:**
```html
<sig-select 
  [options]="countries" 
  [(value)]="selectedCountry" 
/>
```

**After (Material):**
```html
<mat-form-field>
  <mat-label>Country</mat-label>
  <mat-select [value]="selectedCountry" (selectionChange)="selectedCountry = $event.value">
    @for (country of countries; track country.id) {
      <mat-option [value]="country.id">{{ country.label }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

**Fix:** Refer to Angular Material documentation for component-specific APIs.

### 4. Toast/Modal Services

**Breaking:** Toast and Modal services moved to Material equivalents.

**Before:**
```typescript
import { ToastService } from 'ng-signalify/components';

constructor(private toast: ToastService) {}

this.toast.success('Saved!');
```

**After:**
```typescript
import { MatSnackBar } from '@angular/material/snack-bar';

constructor(private snackBar: MatSnackBar) {}

this.snackBar.open('Saved!', 'Close', { duration: 3000 });
```

**Fix:** Use `MatSnackBar` and `MatDialog` from Angular Material.

---

## 📅 Deprecation Timeline

| Version | Timeline | Status | Action Required |
|---------|----------|--------|-----------------|
| **v1.x** | Until Dec 2024 | Stable | No action needed |
| **v2.0** | Jan 2025 | Current | **Migrate UI layer** |
| **v2.5** | Jun 2025 | Planned | Legacy components show warnings |
| **v3.0** | Jan 2026 | Planned | Legacy components removed |

**Recommendation:** Migrate to v2.0 by **June 2025** to avoid disruption.

---

## 🔧 Troubleshooting

### Issue 1: "Cannot find module 'ng-signalify/components'"

**Cause:** v2.0 changed component exports.

**Solution:**
```typescript
// Change this
import { SigInput } from 'ng-signalify/components';

// To this (legacy)
import { SigInput } from 'ng-signalify/components/_legacy';

// Or this (Material)
import { MatInputModule } from '@angular/material/input';
```

### Issue 2: Styles not working

**Cause:** v2.0 removed built-in component styles.

**Solution:**
```json
// angular.json - Add Material theme
"styles": [
  "@angular/material/prebuilt-themes/indigo-pink.css",
  "src/styles.scss"
]
```

Or create your own styles:
```scss
// styles.scss
@import '@angular/material/prebuilt-themes/indigo-pink.css';
```

### Issue 3: Form validation not working

**Cause:** This should NOT happen - form logic is unchanged.

**Solution:** Verify you're using the correct field value binding:

```typescript
// Correct
[value]="form.fields.name.value()" 
(input)="form.fields.name.value.set($any($event.target).value)"

// Also correct (two-way binding)
[(ngModel)]="form.fields.name.value"
```

### Issue 4: TypeScript errors after upgrade

**Cause:** Some type definitions moved.

**Solution:**
```typescript
// Update imports
import { FieldConfig } from 'ng-signalify/fields';
import { FormConfig } from 'ng-signalify/schemas';
import { EntityStoreConfig } from 'ng-signalify/store';
```

### Issue 5: Material not installed

**Cause:** Material is now a peer dependency.

**Solution:**
```bash
ng add @angular/material
# Select a theme when prompted
```

---

## 📚 Additional Resources

- [README.md](README.md) - Updated documentation
- [DOCUMENTATION.md](DOCUMENTATION.md) - Complete API reference
- [Examples](examples/) - Working code examples
- [Adapter README](lib/adapters/README.md) - Adapter documentation

### Example Projects

- [Material Example](examples/material-adapter-example.ts) - Full Material integration
- [Headless Example](examples/headless-adapter-example.ts) - Custom UI example

---

## 🆘 Need Help?

- **GitHub Issues:** [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Discussions:** [github.com/biyonik/ng-signalify/discussions](https://github.com/biyonik/ng-signalify/discussions)
- **Email:** ahmet.altun60@gmail.com

---

## ✅ Migration Checklist

Use this checklist to track your migration progress:

- [ ] Read migration guide
- [ ] Choose migration strategy (gradual/big bang/hybrid)
- [ ] Update to v2.0.0
- [ ] Install Angular Material (if using Material adapter)
- [ ] Add adapter to app config
- [ ] Update component imports (page by page or all at once)
- [ ] Update templates
- [ ] Update styles configuration
- [ ] Test forms and validation
- [ ] Test CRUD operations
- [ ] Test all user flows
- [ ] Remove legacy imports
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Remove `ng-signalify/components/_legacy` imports (before v3.0)

---

<div align="center">

**Made the migration?** Let us know! ⭐ Star the repo if v2.0 works great for you!

**ng-signalify v2.0** - UI-Agnostic Logic Framework for Angular

</div>
