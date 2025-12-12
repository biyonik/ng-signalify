# Migration Guide: Angular Reactive Forms → ng-signalify

> **🇹🇷 Türkçe versiyon için:** [docs/tr/migration-forms.md](tr/migration-forms.md)

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Key Differences](#key-differences)
- [Step-by-Step Guide](#step-by-step-guide)
- [Side-by-Side Comparisons](#side-by-side-comparisons)
- [Validation Migration](#validation-migration)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Why Migrate?

### Benefits of ng-signalify Forms

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Signal-Based** | Built on Angular Signals, reactive by default | 🎯 Modern Angular patterns |
| **Type-Safe** | Full TypeScript inference for forms and fields | ✅ Catch errors at compile time |
| **Less Boilerplate** | No FormGroup/FormControl manual setup | ⚡ Faster development |
| **Better Validation** | Zod-powered validation with clear error messages | 🔒 Stronger validation |
| **Framework Agnostic** | Fields work without Angular forms dependency | 📦 Smaller bundle size |
| **Built-in Features** | Import/export, field presets, computed values | 🚀 Less custom code |
| **Declarative** | Define fields once, use everywhere | ♻️ Better reusability |

### Code Reduction Example

**Angular Reactive Forms:**
```typescript
// ~50-60 lines of setup
this.form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [
    Validators.required,
    Validators.minLength(8)
  ]),
  age: new FormControl(null, [
    Validators.required,
    Validators.min(18),
    Validators.max(120)
  ])
});
```

**ng-signalify:**
```typescript
// ~10-15 lines, more declarative
const fields = [
  new StringField('email', 'Email', { required: true, email: true }),
  new PasswordField('password', 'Password', { required: true, minLength: 8 }),
  new IntegerField('age', 'Age', { required: true, min: 18, max: 120 })
];

const form = createEnhancedForm(fields);
```

### When NOT to Migrate

Consider staying with Reactive Forms if:

- ❌ **Simple forms** - For 2-3 field forms, Reactive Forms are fine
- ❌ **Template-driven preferred** - You prefer ngModel and template syntax
- ❌ **No TypeScript** - You're not using TypeScript (ng-signalify requires it)
- ❌ **Third-party form libraries** - You're invested in libraries built on Reactive Forms
- ❌ **Team resistance** - Team is unfamiliar with Signals and resistant to change

ng-signalify forms are ideal for:

- ✅ **Complex forms** - Multi-step, dynamic, nested forms
- ✅ **Data-heavy apps** - Admin panels, CRM, ERP systems
- ✅ **Type safety critical** - Financial, healthcare, legal applications
- ✅ **Import/Export** - Forms that need Excel/CSV import
- ✅ **Reusable fields** - Same fields across multiple forms

---

## Key Differences

### Comparison Table

| Feature | Reactive Forms | ng-signalify |
|---------|---------------|--------------|
| **Field Definition** | `FormControl` | `StringField`, `IntegerField`, etc. |
| **Form Creation** | `new FormGroup({...})` | `createEnhancedForm(fields)` |
| **Validation** | `Validators.*` | Zod schema + field config |
| **Type Safety** | Weak (any types) | Strong (full inference) |
| **Reactivity** | RxJS observables | Angular Signals |
| **Error Messages** | Manual mapping | Automatic with customization |
| **Value Access** | `form.get('field')?.value` | `form.getValue('field')()` |
| **Validation State** | `form.get('field')?.errors` | `form.fields.field.error()` |
| **Arrays** | `FormArray` | `ArrayField` |
| **Nested Forms** | Nested `FormGroup` | Nested fields with schema |
| **Import/Export** | Manual | Built-in |

### Conceptual Mapping

| Reactive Forms | ng-signalify Equivalent |
|----------------|------------------------|
| `FormControl` | Field classes (StringField, etc.) |
| `FormGroup` | `createEnhancedForm()` |
| `FormArray` | `ArrayField` |
| `Validators.required` | `{ required: true }` |
| `Validators.email` | `{ email: true }` |
| `Validators.minLength` | `{ min: n }` |
| `Validators.maxLength` | `{ max: n }` |
| `Validators.min` | `{ min: n }` (for numbers) |
| `Validators.max` | `{ max: n }` (for numbers) |
| `Validators.pattern` | `{ regex: /.../ }` |
| `form.valueChanges` | `effect()` watching signals |
| `form.statusChanges` | `computed()` from field signals |
| `form.get('field')` | `form.fields.field` |
| `form.setValue()` | `form.patchValue()` |
| `form.patchValue()` | `form.patchValue()` |
| `form.reset()` | `form.reset()` |
| Custom Validators | Zod schema refinements |

---

## Step-by-Step Guide

### Step 1: Install ng-signalify

```bash
npm install ng-signalify zod
# or
pnpm add ng-signalify zod
```

### Step 2: Define Fields

**Before (Reactive Forms):**

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  template: `...`
})
export class UserFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

**After (ng-signalify):**

```typescript
import { Component } from '@angular/core';
import { 
  StringField, 
  IntegerField, 
  PasswordField, 
  BooleanField 
} from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `...`
})
export class UserFormComponent {
  private fields = [
    new StringField('firstName', 'First Name', { 
      required: true, 
      min: 2 
    }),
    new StringField('lastName', 'Last Name', { 
      required: true, 
      min: 2 
    }),
    new StringField('email', 'Email Address', { 
      required: true, 
      email: true 
    }),
    new IntegerField('age', 'Age', { 
      required: true, 
      min: 18, 
      max: 120 
    }),
    new PasswordField('password', 'Password', { 
      required: true,
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true
    }),
    new BooleanField('acceptTerms', 'I accept the terms and conditions', { 
      required: true 
    })
  ];

  protected form = createEnhancedForm(this.fields);

  onSubmit() {
    if (this.form.isValid()) {
      console.log(this.form.getRawValue());
    }
  }
}
```

### Step 3: Update Template

**Before (Reactive Forms):**

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- First Name -->
  <div class="form-field">
    <label for="firstName">First Name</label>
    <input 
      id="firstName" 
      type="text" 
      formControlName="firstName"
      class="form-control"
      [class.is-invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched">
    
    <div class="error" *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched">
      <span *ngIf="form.get('firstName')?.errors?.['required']">
        First name is required
      </span>
      <span *ngIf="form.get('firstName')?.errors?.['minlength']">
        Minimum length is 2 characters
      </span>
    </div>
  </div>

  <!-- Email -->
  <div class="form-field">
    <label for="email">Email</label>
    <input 
      id="email" 
      type="email" 
      formControlName="email"
      class="form-control"
      [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched">
    
    <div class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
      <span *ngIf="form.get('email')?.errors?.['required']">
        Email is required
      </span>
      <span *ngIf="form.get('email')?.errors?.['email']">
        Invalid email format
      </span>
    </div>
  </div>

  <!-- Age -->
  <div class="form-field">
    <label for="age">Age</label>
    <input 
      id="age" 
      type="number" 
      formControlName="age"
      class="form-control"
      [class.is-invalid]="form.get('age')?.invalid && form.get('age')?.touched">
    
    <div class="error" *ngIf="form.get('age')?.invalid && form.get('age')?.touched">
      <span *ngIf="form.get('age')?.errors?.['required']">
        Age is required
      </span>
      <span *ngIf="form.get('age')?.errors?.['min']">
        Must be at least 18 years old
      </span>
      <span *ngIf="form.get('age')?.errors?.['max']">
        Must be less than 120 years old
      </span>
    </div>
  </div>

  <!-- Submit -->
  <button type="submit" [disabled]="form.invalid">
    Submit
  </button>
</form>
```

**After (ng-signalify with Material):**

```html
<form (ngSubmit)="onSubmit()">
  <!-- First Name -->
  <mat-form-field>
    <mat-label>{{ form.fields.firstName.label }}</mat-label>
    <input 
      matInput 
      [value]="form.getValue('firstName')()" 
      (input)="form.setValue('firstName', $any($event.target).value)">
    
    @if (form.fields.firstName.error() && form.fields.firstName.touched()) {
      <mat-error>{{ form.fields.firstName.error() }}</mat-error>
    }
    
    @if (form.fields.firstName.config.hint) {
      <mat-hint>{{ form.fields.firstName.config.hint }}</mat-hint>
    }
  </mat-form-field>

  <!-- Email -->
  <mat-form-field>
    <mat-label>{{ form.fields.email.label }}</mat-label>
    <input 
      matInput 
      type="email"
      [value]="form.getValue('email')()" 
      (input)="form.setValue('email', $any($event.target).value)">
    
    @if (form.fields.email.error() && form.fields.email.touched()) {
      <mat-error>{{ form.fields.email.error() }}</mat-error>
    }
  </mat-form-field>

  <!-- Age -->
  <mat-form-field>
    <mat-label>{{ form.fields.age.label }}</mat-label>
    <input 
      matInput 
      type="number"
      [value]="form.getValue('age')()" 
      (input)="form.setValue('age', +$any($event.target).value)">
    
    @if (form.fields.age.error() && form.fields.age.touched()) {
      <mat-error>{{ form.fields.age.error() }}</mat-error>
    }
  </mat-form-field>

  <!-- Submit -->
  <button 
    mat-raised-button 
    color="primary" 
    type="submit" 
    [disabled]="!form.isValid()">
    Submit
  </button>
</form>
```

**Key Improvements:**
- ✅ No manual error message mapping
- ✅ Automatic error messages from field validation
- ✅ Signal-based reactivity
- ✅ Type-safe field access
- ✅ Less template code

---

## Side-by-Side Comparisons

### Field Definition with Validators

**Reactive Forms:**
```typescript
// String field with validation
firstName: ['', [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(50)
]]

// Email field
email: ['', [
  Validators.required,
  Validators.email
]]

// Number field with range
age: [null, [
  Validators.required,
  Validators.min(18),
  Validators.max(120)
]]

// Custom validator
password: ['', [
  Validators.required,
  Validators.minLength(8),
  this.customPasswordValidator
]]
```

**ng-signalify:**
```typescript
// String field with validation
new StringField('firstName', 'First Name', {
  required: true,
  min: 2,
  max: 50
})

// Email field
new StringField('email', 'Email Address', {
  required: true,
  email: true
})

// Number field with range
new IntegerField('age', 'Age', {
  required: true,
  min: 18,
  max: 120
})

// Password with built-in rules
new PasswordField('password', 'Password', {
  required: true,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
})
```

### Get/Set Values

**Reactive Forms:**
```typescript
// Get single value
const email = this.form.get('email')?.value;

// Get all values
const formData = this.form.value;

// Set single value
this.form.get('email')?.setValue('john@example.com');

// Set multiple values
this.form.patchValue({
  firstName: 'John',
  lastName: 'Doe'
});

// Reset form
this.form.reset();
```

**ng-signalify:**
```typescript
// Get single value (reactive signal)
const email = this.form.getValue('email')();

// Get all values
const formData = this.form.getRawValue();

// Set single value
this.form.setValue('email', 'john@example.com');

// Set multiple values
this.form.patchValue({
  firstName: 'John',
  lastName: 'Doe'
});

// Reset form
this.form.reset();
```

### Check Validity

**Reactive Forms:**
```typescript
// Check if form is valid
if (this.form.valid) {
  // Submit
}

// Check specific field
if (this.form.get('email')?.valid) {
  // ...
}

// Check if field has error
if (this.form.get('email')?.hasError('required')) {
  // ...
}

// Get errors
const errors = this.form.get('email')?.errors;
// { required: true, email: true }
```

**ng-signalify:**
```typescript
// Check if form is valid (signal)
if (this.form.isValid()) {
  // Submit
}

// Check specific field (signal)
if (!this.form.fields.email.error()) {
  // Valid
}

// Get error message (signal)
const errorMsg = this.form.fields.email.error();
// "Email is required" or "Invalid email format"

// Check touched state
if (this.form.fields.email.touched()) {
  // Show error
}
```

### Error Messages in Template

**Reactive Forms:**
```html
<!-- Manual error mapping -->
<div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
  <span *ngIf="form.get('email')?.hasError('required')">
    Email is required
  </span>
  <span *ngIf="form.get('email')?.hasError('email')">
    Invalid email format
  </span>
  <span *ngIf="form.get('email')?.hasError('minlength')">
    Email must be at least {{ form.get('email')?.errors?.['minlength']?.requiredLength }} characters
  </span>
</div>
```

**ng-signalify:**
```html
<!-- Automatic error message -->
@if (form.fields.email.error() && form.fields.email.touched()) {
  <mat-error>{{ form.fields.email.error() }}</mat-error>
}

<!-- Or customize if needed -->
@if (form.fields.email.error() && form.fields.email.touched()) {
  <div class="error-message">
    {{ form.fields.email.error() }}
  </div>
}
```

### Touch All Fields

**Reactive Forms:**
```typescript
// Mark all fields as touched (for validation display)
Object.keys(this.form.controls).forEach(key => {
  this.form.get(key)?.markAsTouched();
});

// Or using a helper
this.markFormGroupTouched(this.form);

private markFormGroupTouched(formGroup: FormGroup) {
  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);
    control?.markAsTouched();

    if (control instanceof FormGroup) {
      this.markFormGroupTouched(control);
    }
  });
}
```

**ng-signalify:**
```typescript
// Touch all fields
this.form.touchAll();

// That's it! Handles nested fields automatically
```

---

## Validation Migration

### Built-in Validators Mapping

| Reactive Forms | ng-signalify Field Config | Example |
|----------------|--------------------------|---------|
| `Validators.required` | `{ required: true }` | `new StringField('name', 'Name', { required: true })` |
| `Validators.email` | `{ email: true }` | `new StringField('email', 'Email', { email: true })` |
| `Validators.minLength(n)` | `{ min: n }` | `new StringField('name', 'Name', { min: 2 })` |
| `Validators.maxLength(n)` | `{ max: n }` | `new StringField('name', 'Name', { max: 50 })` |
| `Validators.min(n)` | `{ min: n }` | `new IntegerField('age', 'Age', { min: 18 })` |
| `Validators.max(n)` | `{ max: n }` | `new IntegerField('age', 'Age', { max: 120 })` |
| `Validators.pattern(/.../)` | `{ regex: /.../ }` | `new StringField('code', 'Code', { regex: /^[A-Z]{3}$/ })` |
| `Validators.requiredTrue` | `{ required: true }` on BooleanField | `new BooleanField('terms', 'Accept', { required: true })` |

### Custom Validators

**Reactive Forms:**
```typescript
// Custom validator function
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  
  if (password?.value !== confirm?.value) {
    return { passwordMismatch: true };
  }
  
  return null;
}

// Usage
this.form = this.fb.group({
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required]
}, { validators: passwordMatchValidator });
```

**ng-signalify:**
```typescript
import { z } from 'zod';

// Option 1: Use Zod refinement
const fields = [
  new PasswordField('password', 'Password', { 
    required: true, 
    minLength: 8 
  }),
  new PasswordField('confirmPassword', 'Confirm Password', { 
    required: true 
  })
];

const form = createEnhancedForm(fields, {
  schema: z.object({
    password: z.string(),
    confirmPassword: z.string()
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ['confirmPassword']
    }
  )
});

// Option 2: Custom field with validation
class ConfirmPasswordField extends PasswordField {
  constructor(
    name: string,
    label: string,
    private passwordFieldName: string,
    config: PasswordFieldConfig = {}
  ) {
    super(name, label, config);
  }

  override schema(): z.ZodType<string> {
    return super.schema().refine(
      (value) => {
        // Access password field value through form context
        const passwordValue = this.getPasswordValue();
        return value === passwordValue;
      },
      { message: "Passwords don't match" }
    );
  }
}
```

### Async Validators

**Reactive Forms:**
```typescript
// Async validator (e.g., check username availability)
function usernameValidator(userService: UserService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }
    
    return userService.checkUsername(control.value).pipe(
      map(isTaken => isTaken ? { usernameTaken: true } : null),
      catchError(() => of(null))
    );
  };
}

// Usage
username: ['', 
  [Validators.required], 
  [usernameValidator(this.userService)]
]
```

**ng-signalify:**
```typescript
// Async validation with Zod
class UsernameField extends StringField {
  constructor(
    private userService: UserService
  ) {
    super('username', 'Username', { required: true });
  }

  override schema(): z.ZodType<string> {
    return z.string()
      .min(1, 'Username is required')
      .refine(
        async (value) => {
          const isTaken = await this.userService.checkUsername(value);
          return !isTaken;
        },
        { message: 'Username is already taken' }
      );
  }
}
```

---

## Common Patterns

### FormArray vs ArrayField

**Reactive Forms (FormArray):**
```typescript
// Component
export class OrderFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      lineItems: this.fb.array([
        this.createLineItem()
      ])
    });
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  createLineItem(): FormGroup {
    return this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addLineItem() {
    this.lineItems.push(this.createLineItem());
  }

  removeLineItem(index: number) {
    this.lineItems.removeAt(index);
  }
}

// Template
<div formArrayName="lineItems">
  <div *ngFor="let item of lineItems.controls; let i = index" [formGroupName]="i">
    <input formControlName="product" placeholder="Product">
    <input formControlName="quantity" type="number" placeholder="Qty">
    <input formControlName="price" type="number" placeholder="Price">
    <button (click)="removeLineItem(i)">Remove</button>
  </div>
</div>
<button (click)="addLineItem()">Add Item</button>
```

**ng-signalify (ArrayField):**
```typescript
// Component
export class OrderFormComponent {
  private lineItemFields = [
    new StringField('product', 'Product', { required: true }),
    new IntegerField('quantity', 'Quantity', { required: true, min: 1 }),
    new DecimalField('price', 'Price', { required: true, min: 0, scale: 2 })
  ];

  private fields = [
    new StringField('customerName', 'Customer Name', { required: true }),
    new ArrayField('lineItems', 'Line Items', this.lineItemFields, {
      min: 1,
      addLabel: 'Add Item',
      removeLabel: 'Remove'
    })
  ];

  protected form = createEnhancedForm(this.fields);
  protected lineItems = this.form.fields.lineItems.createArrayState([]);

  addItem() {
    this.lineItems.add({ product: '', quantity: 1, price: 0 });
  }

  removeItem(id: string) {
    this.lineItems.remove(id);
  }
}

// Template
@for (item of lineItems.values(); track item.id) {
  <div class="line-item">
    <input 
      [value]="item.getValue('product')()" 
      (input)="item.setValue('product', $any($event.target).value)"
      placeholder="Product">
    
    <input 
      type="number"
      [value]="item.getValue('quantity')()" 
      (input)="item.setValue('quantity', +$any($event.target).value)"
      placeholder="Qty">
    
    <input 
      type="number"
      [value]="item.getValue('price')()" 
      (input)="item.setValue('price', +$any($event.target).value)"
      placeholder="Price">
    
    <button (click)="removeItem(item.id)">Remove</button>
  </div>
}

<button (click)="addItem()">Add Item</button>
```

### Nested Forms

**Reactive Forms:**
```typescript
this.form = this.fb.group({
  name: ['', Validators.required],
  address: this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
  }),
  contact: this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required]
  })
});

// Access nested value
const city = this.form.get('address.city')?.value;
```

**ng-signalify:**
```typescript
// Option 1: Flat structure with prefixes
const fields = [
  new StringField('name', 'Name', { required: true }),
  new StringField('address_street', 'Street', { required: true }),
  new StringField('address_city', 'City', { required: true }),
  new StringField('address_zipCode', 'ZIP Code', { 
    required: true, 
    regex: /^\d{5}$/ 
  }),
  new StringField('contact_email', 'Email', { required: true, email: true }),
  new StringField('contact_phone', 'Phone', { required: true })
];

const form = createEnhancedForm(fields);

// Access value
const city = form.getValue('address_city')();

// Option 2: Use JsonField for complex objects
const fields = [
  new StringField('name', 'Name', { required: true }),
  new JsonField('address', 'Address', {
    schema: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      zipCode: z.string().regex(/^\d{5}$/)
    })
  }),
  new JsonField('contact', 'Contact', {
    schema: z.object({
      email: z.string().email(),
      phone: z.string().min(1)
    })
  })
];
```

### Dynamic Forms

**Reactive Forms:**
```typescript
// Add control dynamically
this.form.addControl('newField', new FormControl('', Validators.required));

// Remove control
this.form.removeControl('newField');

// Enable/disable
this.form.get('email')?.disable();
this.form.get('email')?.enable();
```

**ng-signalify:**
```typescript
// Fields are defined upfront, but can be conditionally shown
const allFields = [
  new StringField('email', 'Email', { required: true, email: true }),
  new StringField('phone', 'Phone', { required: false }),
  new StringField('fax', 'Fax', { required: false })
];

// Show/hide based on condition
const showPhone = signal(false);
const showFax = signal(false);

const activeFields = computed(() => {
  const fields = [allFields[0]]; // Email always shown
  if (showPhone()) fields.push(allFields[1]);
  if (showFax()) fields.push(allFields[2]);
  return fields;
});

// Recreate form when fields change
effect(() => {
  const form = createEnhancedForm(activeFields());
  // ...
});

// Or use disabled state
form.fields.phone.config.disabled = true;
```

---

## Best Practices

### 1. Separate Field Definitions

**Do:**
```typescript
// fields/user-fields.ts
export const userFields = {
  email: new StringField('email', 'Email Address', { 
    required: true, 
    email: true 
  }),
  password: new PasswordField('password', 'Password', { 
    required: true,
    minLength: 8 
  }),
  // ... more fields
};

// registration.component.ts
import { userFields } from './fields/user-fields';

const form = createEnhancedForm([
  userFields.email,
  userFields.password
]);
```

**Don't:**
```typescript
// Defining fields inline in component
const form = createEnhancedForm([
  new StringField('email', 'Email', { required: true, email: true }),
  // Repeated across multiple components
]);
```

### 2. Use Appropriate Field Types

**Do:**
```typescript
// Specific field types
new EmailField('email', 'Email')           // Or StringField with email: true
new PasswordField('password', 'Password')
new IntegerField('age', 'Age')
new DecimalField('price', 'Price', { scale: 2, currency: 'USD' })
new DateField('birthdate', 'Birth Date')
new EnumField('status', 'Status', statusOptions)
```

**Don't:**
```typescript
// Using generic StringField for everything
new StringField('price', 'Price')      // Should be DecimalField
new StringField('age', 'Age')          // Should be IntegerField
new StringField('date', 'Date')        // Should be DateField
```

### 3. Provide Clear Labels and Hints

**Do:**
```typescript
new PasswordField('password', 'Password', {
  required: true,
  minLength: 12,
  hint: 'Must contain uppercase, lowercase, number, and special character',
  placeholder: 'Enter a strong password'
})
```

**Don't:**
```typescript
new PasswordField('pwd', 'pwd', { required: true })
```

### 4. Use Computed Signals for Derived State

**Do:**
```typescript
export class CheckoutComponent {
  form = createEnhancedForm(this.fields);
  
  // Computed total
  total = computed(() => {
    const subtotal = this.form.getValue('subtotal')();
    const tax = this.form.getValue('tax')();
    return subtotal + tax;
  });
  
  // Computed validation state
  canSubmit = computed(() => 
    this.form.isValid() && this.total() > 0
  );
}
```

**Don't:**
```typescript
// Recomputing on every access
get total() {
  return this.form.getValue('subtotal')() + this.form.getValue('tax')();
}
```

### 5. Handle Errors Gracefully

**Do:**
```typescript
async onSubmit() {
  if (!this.form.isValid()) {
    this.form.touchAll(); // Show all errors
    this.toast.warning('Please fix form errors');
    return;
  }
  
  try {
    const data = this.form.getRawValue();
    await this.userService.create(data);
    this.toast.success('User created successfully');
    this.router.navigate(['/users']);
  } catch (error) {
    this.toast.error('Failed to create user');
    console.error(error);
  }
}
```

**Don't:**
```typescript
// No validation check, silent failures
async onSubmit() {
  const data = this.form.getRawValue();
  await this.userService.create(data);
}
```

### 6. Reuse Field Definitions

**Do:**
```typescript
// Shared field definitions
export const addressFields = [
  new StringField('street', 'Street Address', { required: true }),
  new StringField('city', 'City', { required: true }),
  new StringField('state', 'State', { required: true }),
  new StringField('zipCode', 'ZIP Code', { required: true, regex: /^\d{5}$/ })
];

// Use in multiple forms
const billingForm = createEnhancedForm([
  ...addressFields,
  new StringField('cardNumber', 'Card Number', { required: true })
]);

const shippingForm = createEnhancedForm(addressFields);
```

**Don't:**
```typescript
// Duplicate field definitions
const billingForm = createEnhancedForm([
  new StringField('street', 'Street', { required: true }),
  new StringField('city', 'City', { required: true }),
  // ...
]);

const shippingForm = createEnhancedForm([
  new StringField('street', 'Street', { required: true }), // Duplicated!
  new StringField('city', 'City', { required: true }),
  // ...
]);
```

---

## Summary

### Migration Checklist

- [ ] Install ng-signalify and zod
- [ ] Define fields using Field classes
- [ ] Create form with createEnhancedForm()
- [ ] Update template to use signals
- [ ] Migrate validators to field config or Zod schemas
- [ ] Update error handling
- [ ] Test form validation
- [ ] Test form submission
- [ ] Remove ReactiveFormsModule dependencies (if fully migrated)

### Key Takeaways

1. **Signal-Based:** Reactive by default, no RxJS needed
2. **Type-Safe:** Full TypeScript inference
3. **Less Code:** ~50% reduction in form setup code
4. **Better Validation:** Zod-powered with automatic error messages
5. **Reusable:** Define fields once, use everywhere

### Next Steps

- Read [Field Types Documentation](fields.md)
- Check [Forms & Schemas Guide](../DOCUMENTATION.md#schemas-form--filter)
- Explore [Example Apps](../apps/demo-material/)
- Join [GitHub Discussions](https://github.com/biyonik/ng-signalify/discussions)

---

## Related Documentation

- [Field Types](fields.md)
- [NgRx Migration](migration-ngrx.md)
- [Main Documentation](../DOCUMENTATION.md)
- [README](../README.md)

---

<div align="center">

**Ready to modernize your forms?**

[⭐ Star on GitHub](https://github.com/biyonik/ng-signalify) | [📖 Full Documentation](../DOCUMENTATION.md) | [🚀 Quick Start](../README.md#quick-start)

</div>
