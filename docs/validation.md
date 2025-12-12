# Validation Guide

> **🇹🇷 For Turkish version:** [docs/tr/validation.md](tr/validation.md)

## Table of Contents

- [Built-in Validation Rules](#built-in-validation-rules)
- [Field-Level Validation](#field-level-validation)
- [Form-Level Validation](#form-level-validation)
- [Custom Validators](#custom-validators)
- [Async Validators](#async-validators)
- [Validation Messages](#validation-messages)
- [Conditional Validation](#conditional-validation)
- [Cross-Field Validation](#cross-field-validation)
- [Best Practices](#best-practices)

---

## Built-in Validation Rules

ng-signalify provides comprehensive built-in validation for all field types using Zod schemas.

### StringField

```typescript
import { StringField } from 'ng-signalify/fields';

const nameField = new StringField('name', 'Full Name', {
  required: true,           // Field must have a value
  min: 3,                   // Minimum length
  max: 100,                 // Maximum length
  pattern: /^[A-Za-z\s]+$/, // Regex pattern (letters and spaces only)
  trim: true                // Automatically trim whitespace
});
```

**Validation rules:**
- `required` - Field cannot be empty
- `min` - Minimum string length
- `max` - Maximum string length
- `pattern` - Regular expression pattern
- `trim` - Remove leading/trailing whitespace

### NumberField

```typescript
import { NumberField } from 'ng-signalify/fields';

const ageField = new NumberField('age', 'Age', {
  required: true,    // Field must have a value
  min: 18,          // Minimum value
  max: 120,         // Maximum value
  step: 1,          // Value increment (e.g., for sliders)
  integer: true     // Must be an integer (no decimals)
});
```

**Validation rules:**
- `required` - Field cannot be null
- `min` - Minimum numeric value
- `max` - Maximum numeric value
- `step` - Value must be a multiple of step
- `integer` - Must be a whole number

### EmailField

```typescript
import { EmailField } from 'ng-signalify/fields';

const emailField = new EmailField('email', 'Email Address', {
  required: true  // Field must have a valid email
});
```

**Validation rules:**
- `required` - Field cannot be empty
- Email format validation (built-in)

### DateField

```typescript
import { DateField } from 'ng-signalify/fields';

const birthdateField = new DateField('birthdate', 'Date of Birth', {
  required: true,
  min: new Date('1900-01-01'),  // Minimum date
  max: new Date()               // Maximum date (today)
});
```

**Validation rules:**
- `required` - Field must have a date
- `min` - Minimum allowed date
- `max` - Maximum allowed date

### SelectField

```typescript
import { SelectField } from 'ng-signalify/fields';

const roleField = new SelectField('role', 'User Role', {
  required: true,
  choices: [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'Regular User' },
    { value: 'guest', label: 'Guest' }
  ]
});
```

**Validation rules:**
- `required` - A choice must be selected
- Value must be one of the valid choices

### BooleanField

```typescript
import { BooleanField } from 'ng-signalify/fields';

const termsField = new BooleanField('terms', 'Accept Terms', {
  required: true  // Must be true (checkbox must be checked)
});
```

**Validation rules:**
- `required` - Must be `true` (useful for required checkboxes like terms acceptance)

### ArrayField

```typescript
import { ArrayField, StringField } from 'ng-signalify/fields';

const tagsField = new ArrayField('tags', 'Tags', {
  required: true,
  min: 1,          // Minimum array length
  max: 5,          // Maximum array length
  itemField: new StringField('tag', 'Tag', { min: 2, max: 20 })
});
```

**Validation rules:**
- `required` - Array cannot be empty
- `min` - Minimum number of items
- `max` - Maximum number of items
- `itemField` - Validation for each item in the array

---

## Field-Level Validation

Each field has reactive validation signals that update automatically.

### Check Validity

```typescript
const emailField = new EmailField('email', 'Email', { required: true });

// Check if field is valid
if (emailField.isValid()) {
  console.log('Email is valid');
} else {
  console.log('Email is invalid');
}
```

### Get Error Message

```typescript
const nameField = new StringField('name', 'Name', { 
  required: true, 
  min: 3 
});

nameField.setValue('ab');  // Too short

// Get error message
const error = nameField.error();
console.log(error);  // "String must contain at least 3 character(s)"
```

### Template Usage

```typescript
@Component({
  selector: 'app-form',
  template: `
    <div class="form-field">
      <label>{{ nameField.label }}</label>
      <input 
        [value]="nameField.value()" 
        (input)="nameField.setValue($event.target.value)"
        (blur)="nameField.touch()" />
      
      @if (nameField.touched() && nameField.error()) {
        <span class="error">{{ nameField.error() }}</span>
      }
    </div>
  `
})
export class FormComponent {
  nameField = new StringField('name', 'Full Name', {
    required: true,
    min: 3,
    max: 50
  });
}
```

---

## Form-Level Validation

Validate multiple fields together.

### Check Form Validity

```typescript
import { Component } from '@angular/core';
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-register',
  template: `
    <form (submit)="onSubmit()">
      <!-- fields here -->
      <button [disabled]="!isFormValid()">Submit</button>
    </form>
  `
})
export class RegisterComponent {
  nameField = new StringField('name', 'Name', { required: true });
  emailField = new EmailField('email', 'Email', { required: true });
  passwordField = new PasswordField('password', 'Password', { 
    required: true, 
    min: 8 
  });

  isFormValid(): boolean {
    return this.nameField.isValid() && 
           this.emailField.isValid() && 
           this.passwordField.isValid();
  }

  onSubmit() {
    // Touch all fields to show errors
    this.nameField.touch();
    this.emailField.touch();
    this.passwordField.touch();

    if (!this.isFormValid()) {
      return;
    }

    const formData = {
      name: this.nameField.value(),
      email: this.emailField.value(),
      password: this.passwordField.value()
    };

    console.log('Form submitted:', formData);
  }
}
```

### Get All Values

```typescript
getFormValues() {
  return {
    name: this.nameField.value(),
    email: this.emailField.value(),
    password: this.passwordField.value()
  };
}
```

---

## Custom Validators

Create custom field types with specialized validation logic.

### Extend Field Class

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';

export class PhoneField extends StringField {
  override schema(): z.ZodString {
    let schema = super.schema();

    // Add custom phone validation
    schema = schema.regex(
      /^\+?[1-9]\d{1,14}$/,
      'Invalid phone number format'
    );

    return schema;
  }
}
```

### Usage

```typescript
const phoneField = new PhoneField('phone', 'Phone Number', {
  required: true
});

phoneField.setValue('+1234567890');
console.log(phoneField.isValid());  // true

phoneField.setValue('invalid');
console.log(phoneField.error());  // "Invalid phone number format"
```

### Complex Custom Validator

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';

export class UsernameField extends StringField {
  override schema(): z.ZodString {
    let schema = super.schema();

    // Custom validation rules
    schema = schema
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      )
      .refine(
        (val) => !val.startsWith('_'),
        'Username cannot start with underscore'
      )
      .refine(
        (val) => !val.endsWith('_'),
        'Username cannot end with underscore'
      );

    return schema;
  }
}
```

---

## Async Validators

Validate against external data sources (e.g., check if username is available).

### Create Async Validator Field

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class UsernameField extends StringField {
  private http = inject(HttpClient);

  override schema(): z.ZodString {
    let schema = super.schema();

    // Synchronous validation first
    schema = schema
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters');

    return schema;
  }

  // Async validation
  async asyncValidate(value: string): Promise<string | null> {
    // Only validate if sync validation passes
    const syncResult = this.schema().safeParse(value);
    if (!syncResult.success) {
      return null; // Sync errors will be shown
    }

    try {
      const response = await this.http
        .get<{ available: boolean }>(`/api/check-username/${value}`)
        .toPromise();

      if (!response?.available) {
        return 'Username is already taken';
      }

      return null; // Valid
    } catch (error) {
      return 'Failed to validate username';
    }
  }
}
```

### Usage in Component

```typescript
@Component({
  selector: 'app-register',
  template: `
    <input 
      [value]="usernameField.value()"
      (input)="usernameField.setValue($event.target.value)"
      (blur)="checkUsername()" />
    
    @if (checking) {
      <span class="checking">Checking availability...</span>
    }
    
    @if (usernameField.error()) {
      <span class="error">{{ usernameField.error() }}</span>
    }
  `
})
export class RegisterComponent {
  usernameField = new UsernameField('username', 'Username', {
    required: true
  });

  checking = false;

  async checkUsername() {
    this.checking = true;
    const error = await this.usernameField.asyncValidate(
      this.usernameField.value()
    );
    this.checking = false;

    if (error) {
      // Set custom error
      console.error(error);
    }
  }
}
```

---

## Validation Messages

### Built-in Error Messages

ng-signalify uses Zod's default error messages:

| Validation | Default Message |
|------------|----------------|
| Required string | "Required" |
| Min length | "String must contain at least X character(s)" |
| Max length | "String must contain at most X character(s)" |
| Invalid email | "Invalid email" |
| Number too small | "Number must be greater than or equal to X" |
| Number too large | "Number must be less than or equal to X" |

### Display in Template

```typescript
@Component({
  template: `
    <div class="form-field">
      <label>{{ emailField.label }}</label>
      <input 
        type="email"
        [value]="emailField.value()"
        (input)="emailField.setValue($event.target.value)"
        (blur)="emailField.touch()" />
      
      @if (emailField.touched() && emailField.error()) {
        <div class="error-message">
          <span class="icon">⚠️</span>
          <span>{{ emailField.error() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .error-message {
      color: #d32f2f;
      font-size: 0.875rem;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class FormComponent {
  emailField = new EmailField('email', 'Email', { required: true });
}
```

---

## Conditional Validation

Enable or disable validation based on other field values.

### Using Angular Effects

```typescript
import { Component, effect } from '@angular/core';
import { BooleanField, StringField } from 'ng-signalify/fields';

@Component({
  selector: 'app-shipping-form',
  template: `
    <label>
      <input 
        type="checkbox"
        [checked]="sameAsShippingField.value()"
        (change)="sameAsShippingField.setValue($event.target.checked)" />
      Billing address same as shipping
    </label>

    @if (!sameAsShippingField.value()) {
      <div>
        <input 
          [value]="billingAddressField.value()"
          (input)="billingAddressField.setValue($event.target.value)" />
        @if (billingAddressField.error()) {
          <span class="error">{{ billingAddressField.error() }}</span>
        }
      </div>
    }
  `
})
export class ShippingFormComponent {
  sameAsShippingField = new BooleanField('sameAsShipping', 'Same Address', {});
  
  billingAddressField = new StringField('billingAddress', 'Billing Address', {
    required: false  // Initially optional
  });

  constructor() {
    // Update billing address requirement based on checkbox
    effect(() => {
      const sameAsShipping = this.sameAsShippingField.value();
      
      // Recreate field with new config
      if (sameAsShipping) {
        this.billingAddressField = new StringField(
          'billingAddress', 
          'Billing Address', 
          { required: false }
        );
      } else {
        this.billingAddressField = new StringField(
          'billingAddress', 
          'Billing Address', 
          { required: true }
        );
      }
    });
  }
}
```

---

## Cross-Field Validation

Validate one field based on another field's value.

### Password Confirmation Example

```typescript
import { Component, computed } from '@angular/core';
import { PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-password-form',
  template: `
    <div>
      <label>Password</label>
      <input 
        type="password"
        [value]="passwordField.value()"
        (input)="passwordField.setValue($event.target.value)" />
    </div>

    <div>
      <label>Confirm Password</label>
      <input 
        type="password"
        [value]="confirmPasswordField.value()"
        (input)="confirmPasswordField.setValue($event.target.value)"
        (blur)="confirmPasswordField.touch()" />
      
      @if (confirmPasswordField.touched() && passwordMismatch()) {
        <span class="error">Passwords do not match</span>
      }
    </div>
  `
})
export class PasswordFormComponent {
  passwordField = new PasswordField('password', 'Password', {
    required: true,
    min: 8
  });

  confirmPasswordField = new PasswordField('confirmPassword', 'Confirm Password', {
    required: true
  });

  // Computed signal for password match
  passwordMismatch = computed(() => {
    const password = this.passwordField.value();
    const confirm = this.confirmPasswordField.value();
    return password !== confirm && confirm !== null;
  });

  isFormValid(): boolean {
    return this.passwordField.isValid() && 
           this.confirmPasswordField.isValid() &&
           !this.passwordMismatch();
  }
}
```

---

## Best Practices

### 1. Use Specific Field Types

```typescript
// ❌ Don't use generic StringField for email
const email = new StringField('email', 'Email', { required: true });

// ✅ Use EmailField for automatic email validation
const email = new EmailField('email', 'Email', { required: true });
```

### 2. Validate on Blur

```typescript
// Show errors after user leaves the field
<input 
  [value]="field.value()"
  (input)="field.setValue($event.target.value)"
  (blur)="field.touch()" />

@if (field.touched() && field.error()) {
  <span class="error">{{ field.error() }}</span>
}
```

### 3. Touch All Fields on Submit

```typescript
onSubmit() {
  // Touch all fields to show validation errors
  this.nameField.touch();
  this.emailField.touch();
  this.passwordField.touch();

  if (!this.isFormValid()) {
    return; // Don't submit if invalid
  }

  // Proceed with form submission
}
```

### 4. Provide Helpful Error Messages

```typescript
// Use clear, actionable error messages
const username = new UsernameField('username', 'Username', {
  required: true
});
// Error: "Username must be at least 3 characters"
// Better than: "Invalid input"
```

### 5. Separate Sync and Async Validation

```typescript
// Sync validation first (fast)
schema = schema.min(3).max(20);

// Async validation only after sync passes (slow)
async asyncValidate(value: string) {
  const syncResult = this.schema().safeParse(value);
  if (!syncResult.success) return null;
  
  // Only check API if sync validation passed
  return await this.checkAvailability(value);
}
```

---

## Related Documentation

- [Field Types](fields.md) - All available field types
- [Installation](installation.md) - Getting started
- [Examples](examples.md) - Real-world validation examples
- [Store](store.md) - Entity validation in stores

---

**Master validation with ng-signalify! ✅**
