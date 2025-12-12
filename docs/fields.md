# Field Types Documentation

> **🇹🇷 Türkçe versiyon için:** [docs/tr/fields.md](tr/fields.md)

## Table of Contents

- [Overview](#overview)
- [Field Hierarchy](#field-hierarchy)
- [Common Configuration](#common-configuration)
- [Field Types](#field-types)
  - [StringField](#stringfield)
  - [NumberField](#numberfield)
  - [EmailField](#emailfield)
  - [UrlField](#urlfield)
  - [PasswordField](#passwordfield)
  - [DateField](#datefield)
  - [SelectField](#selectfield)
  - [BooleanField](#booleanfield)
  - [ArrayField](#arrayfield)
  - [ObjectField](#objectfield)
- [Custom Fields](#custom-fields)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

### What are Fields?

Fields are the foundation of ng-signalify's form system. They are **type-safe, reusable definitions** that encapsulate:

- ✅ **Data Type** - The TypeScript type of the value
- ✅ **Validation Rules** - Using Zod schemas
- ✅ **UI Metadata** - Labels, hints, placeholders
- ✅ **Data Transformation** - Import/Export logic
- ✅ **Reactive State** - Signal-based value management

### Why Use Fields?

Traditional Angular forms require manual setup for each input:
```typescript
// ❌ Traditional approach - repetitive, error-prone
this.form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  age: new FormControl(null, [Validators.required, Validators.min(18)])
});
```

With ng-signalify fields:
```typescript
// ✅ Declarative, type-safe, reusable
const fields = [
  new StringField('email', 'Email Address', { 
    required: true, 
    email: true 
  }),
  new IntegerField('age', 'Age', { 
    required: true, 
    min: 18 
  })
];
```

### Benefits

| Feature | Description |
|---------|-------------|
| 🎯 **Type Safety** | Full TypeScript inference throughout the form lifecycle |
| 🔄 **Reusability** | Define once, use in multiple forms and contexts |
| ✅ **Built-in Validation** | Powered by Zod, with custom error messages |
| 🌐 **Import/Export** | Automatic data transformation for APIs and files |
| 📦 **Separation of Concerns** | Business logic separated from UI components |
| 🧪 **Testability** | Easy to unit test without rendering components |

---

## Field Hierarchy

All field types extend from `BaseField` and implement the `IField` interface:

```
BaseField<T>
├── StringField
│   ├── PasswordField (extends StringField)
│   └── TextAreaField (extends StringField)
├── IntegerField
├── DecimalField
├── DateField
│   ├── DateTimeField
│   ├── TimeField
│   └── DateRangeField
├── EnumField (SelectField)
│   └── MultiEnumField
├── BooleanField
├── ArrayField
├── JsonField (ObjectField)
├── FileField
│   └── ImageField
└── RelationField
```

---

## Common Configuration

All fields share these configuration options via the `FieldConfig` interface:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `required` | `boolean` | Makes the field mandatory | `false` |
| `disabled` | `boolean` | Disables user input (UI-level) | `false` |
| `readonly` | `boolean` | Makes field read-only (UI-level) | `false` |
| `hint` | `string` | Helper text shown below the field | - |
| `placeholder` | `string` | Placeholder text when field is empty | - |

**Example:**
```typescript
new StringField('username', 'Username', {
  required: true,
  hint: 'Must be unique across the system',
  placeholder: 'Enter your username'
});
```

---

## Field Types

### StringField

**Purpose:** Handles text input for single-line strings.

#### Configuration Options

```typescript
interface StringFieldConfig extends FieldConfig {
  min?: number;        // Minimum character length
  max?: number;        // Maximum character length
  email?: boolean;     // Validate as email address
  url?: boolean;       // Validate as URL
  regex?: RegExp;      // Custom pattern validation
}
```

#### Validation Rules

- Length constraints (`min`, `max`)
- Email format validation
- URL format validation
- Custom regex patterns

#### TypeScript Example

```typescript
import { StringField } from 'ng-signalify/fields';

// Basic text field
const nameField = new StringField('name', 'Full Name', {
  required: true,
  min: 2,
  max: 100,
  hint: 'Enter your full legal name'
});

// Field with regex validation
const codeField = new StringField('productCode', 'Product Code', {
  required: true,
  regex: /^[A-Z]{3}-\d{4}$/,
  placeholder: 'ABC-1234'
});
```

#### Usage in Form

```typescript
import { createEnhancedForm } from 'ng-signalify/schemas';

const fields = [
  new StringField('firstName', 'First Name', { required: true, min: 2 }),
  new StringField('lastName', 'Last Name', { required: true, min: 2 })
];

const form = createEnhancedForm(fields);

// Access reactive value
console.log(form.getValue('firstName')); // Signal<string>

// Set value
form.patchValue({ firstName: 'John' });
```

---

### NumberField

ng-signalify provides two number field types:

#### IntegerField

**Purpose:** Handles whole numbers (integers) without decimal places.

##### Configuration Options

```typescript
interface IntegerFieldConfig extends FieldConfig {
  min?: number;    // Minimum value
  max?: number;    // Maximum value
}
```

##### Example

```typescript
import { IntegerField } from 'ng-signalify/fields';

const ageField = new IntegerField('age', 'Age', {
  required: true,
  min: 18,
  max: 120,
  hint: 'Must be 18 or older'
});

const quantityField = new IntegerField('quantity', 'Quantity', {
  required: true,
  min: 1,
  max: 999
});
```

#### DecimalField

**Purpose:** Handles decimal numbers with precision control and currency formatting.

##### Configuration Options

```typescript
interface DecimalFieldConfig extends FieldConfig {
  min?: number;        // Minimum value
  max?: number;        // Maximum value
  scale?: number;      // Decimal places (default: 2)
  currency?: string;   // Currency code (e.g., 'USD', 'EUR', 'TRY')
  locale?: string;     // Locale for formatting (default: 'tr-TR')
}
```

##### Example

```typescript
import { DecimalField } from 'ng-signalify/fields';

const priceField = new DecimalField('price', 'Price', {
  required: true,
  min: 0,
  scale: 2,
  currency: 'USD'
});

const weightField = new DecimalField('weight', 'Weight (kg)', {
  required: true,
  min: 0.1,
  max: 1000,
  scale: 3
});
```

##### Formatting

The field automatically formats numbers based on locale and currency:

```typescript
// With currency
priceField.present(1234.56); // "$1,234.56" (USD)

// Without currency
weightField.present(42.123); // "42.123"
```

---

### EmailField

**Purpose:** String field with built-in email validation.

EmailField is a specialized StringField with automatic email validation. It's a convenience wrapper.

#### Example

```typescript
import { StringField } from 'ng-signalify/fields';

// Option 1: Using StringField with email flag
const emailField = new StringField('email', 'Email Address', {
  required: true,
  email: true,
  placeholder: 'user@example.com'
});

// Option 2: Custom email validation with regex
const customEmailField = new StringField('email', 'Email', {
  required: true,
  regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  max: 255
});
```

#### Validation

- Built-in email format validation via Zod
- Checks for valid email structure
- Optional max length constraint

---

### UrlField

**Purpose:** String field with built-in URL validation.

Similar to EmailField, UrlField is a StringField with URL validation.

#### Example

```typescript
import { StringField } from 'ng-signalify/fields';

const websiteField = new StringField('website', 'Website URL', {
  required: true,
  url: true,
  placeholder: 'https://example.com'
});

const githubField = new StringField('github', 'GitHub Profile', {
  url: true,
  placeholder: 'https://github.com/username'
});
```

#### Validation

- Validates URL format including protocol
- Accepts http, https, and other protocols
- Ensures proper URL structure

---

### PasswordField

**Purpose:** Secure password input with strength validation and complexity requirements.

#### Configuration Options

```typescript
interface PasswordFieldConfig extends FieldConfig {
  minLength?: number;           // Minimum length (default: 8)
  maxLength?: number;           // Maximum length
  requireUppercase?: boolean;   // Require uppercase letters
  requireLowercase?: boolean;   // Require lowercase letters
  requireNumber?: boolean;      // Require numbers
  requireSpecial?: boolean;     // Require special characters
  showStrength?: boolean;       // Show strength meter
  confirmField?: string;        // Field name for confirmation
}
```

#### Security Features

- **Never exports** actual password values
- **Masked display** in UI (••••••••)
- **Strength calculation** algorithm
- **Password generation** utility

#### Example

```typescript
import { PasswordField } from 'ng-signalify/fields';

const passwordField = new PasswordField('password', 'Password', {
  required: true,
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  showStrength: true,
  hint: 'Use a strong password with mixed characters'
});

// Confirmation field
const confirmField = new PasswordField('confirmPassword', 'Confirm Password', {
  required: true,
  confirmField: 'password'
});
```

#### Password Strength

```typescript
const strength = passwordField.calculateStrength('MyP@ssw0rd123');
// {
//   score: 4,           // 0-4 scale
//   label: 'Very Strong',
//   color: 'green',
//   feedback: []
// }
```

#### Generate Password

```typescript
const strongPassword = passwordField.generateStrongPassword(16);
// Returns: "aK9#mP2$xL5@qR8!"
```

---

### DateField

**Purpose:** Date selection with min/max constraints and locale-aware formatting.

#### Configuration Options

```typescript
interface DateFieldConfig extends FieldConfig {
  min?: Date | string;  // Earliest selectable date
  max?: Date | string;  // Latest selectable date
  format?: string;      // Display format (default: 'dd.MM.yyyy')
  locale?: string;      // Locale (default: 'tr-TR')
}
```

#### Example

```typescript
import { DateField } from 'ng-signalify/fields';

const birthdateField = new DateField('birthdate', 'Date of Birth', {
  required: true,
  max: new Date(), // Cannot be in the future
  hint: 'Select your birth date'
});

const appointmentField = new DateField('appointment', 'Appointment Date', {
  required: true,
  min: new Date(), // Cannot be in the past
  max: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Max 90 days ahead
});
```

#### Date Utilities

```typescript
// Check if date is today
birthdateField.isToday(new Date()); // false

// Check if date is in the past
birthdateField.isPast(new Date('2020-01-01')); // true

// Check if date is in the future
appointmentField.isFuture(new Date('2025-12-31')); // true
```

#### Excel Import Support

DateField automatically handles Excel date serial numbers:

```typescript
const field = new DateField('date', 'Date');
const date = field.fromImport(44567); // Converts Excel serial to JS Date
```

---

### SelectField

**Purpose:** Single or multiple selection from a predefined list of options.

In ng-signalify, SelectField is implemented as `EnumField` and `MultiEnumField`.

#### Choice Interface

```typescript
interface EnumOption {
  id: string | number;  // Value stored in database
  label: string;        // Text displayed to user
}
```

#### EnumField (Single Selection)

```typescript
import { EnumField } from 'ng-signalify/fields';

const statusField = new EnumField(
  'status',
  'Status',
  [
    { id: 'draft', label: 'Draft' },
    { id: 'published', label: 'Published' },
    { id: 'archived', label: 'Archived' }
  ],
  { required: true }
);
```

#### MultiEnumField (Multiple Selection)

```typescript
import { MultiEnumField } from 'ng-signalify/fields';

const tagsField = new MultiEnumField(
  'tags',
  'Tags',
  [
    { id: 1, label: 'Technology' },
    { id: 2, label: 'Business' },
    { id: 3, label: 'Design' },
    { id: 4, label: 'Marketing' }
  ],
  { hint: 'Select one or more tags' }
);
```

#### Smart Import Matching

EnumField provides intelligent import matching:

```typescript
const field = new EnumField('color', 'Color', [
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' }
]);

// Matches by ID
field.fromImport('red'); // 'red'

// Matches by label (case-insensitive)
field.fromImport('Red'); // 'red'
field.fromImport('  BLUE  '); // 'blue'
```

---

### BooleanField

**Purpose:** True/false values with customizable labels.

#### Configuration Options

```typescript
interface BooleanFieldConfig extends FieldConfig {
  yesLabel?: string;  // Label for true (default: 'Yes'/'Evet')
  noLabel?: string;   // Label for false (default: 'No'/'Hayır')
}
```

#### Example

```typescript
import { BooleanField } from 'ng-signalify/fields';

const activeField = new BooleanField('isActive', 'Active Status', {
  yesLabel: 'Active',
  noLabel: 'Inactive'
});

const agreedField = new BooleanField('agreedToTerms', 'Terms & Conditions', {
  required: true, // Required checkbox pattern
  hint: 'You must agree to continue'
});
```

#### Fuzzy Import Matching

BooleanField intelligently converts various formats:

```typescript
// String matching
field.fromImport('true');   // true
field.fromImport('yes');    // true
field.fromImport('1');      // true
field.fromImport('false');  // false
field.fromImport('no');     // false
field.fromImport('0');      // false

// Number matching
field.fromImport(1);        // true
field.fromImport(0);        // false
```

---

### ArrayField

**Purpose:** Dynamic arrays of repeating structured data.

#### Configuration Options

```typescript
interface ArrayFieldConfig extends FieldConfig {
  min?: number;           // Minimum number of items
  max?: number;           // Maximum number of items
  addLabel?: string;      // Custom "Add" button label
  removeLabel?: string;   // Custom "Remove" button label
  sortable?: boolean;     // Enable drag-drop reordering
}
```

#### Example

```typescript
import { ArrayField, StringField, DecimalField } from 'ng-signalify/fields';

// Define the structure of each array item
const itemFields = [
  new StringField('name', 'Item Name', { required: true }),
  new DecimalField('price', 'Price', { required: true, min: 0 }),
  new IntegerField('quantity', 'Quantity', { required: true, min: 1 })
];

// Create array field
const lineItemsField = new ArrayField(
  'lineItems',
  'Line Items',
  itemFields,
  {
    min: 1,
    max: 50,
    addLabel: 'Add Line Item',
    sortable: true
  }
);
```

#### Array State Management

```typescript
// Create array state
const arrayState = lineItemsField.createArrayState([
  { name: 'Product A', price: 10.99, quantity: 2 }
]);

// Add item
arrayState.add({ name: 'Product B', price: 15.99, quantity: 1 });

// Remove item by ID
arrayState.remove(itemId);

// Move item (reorder)
arrayState.move(0, 2); // Move first item to position 2

// Access values
console.log(arrayState.values()); // Signal<Array<Record<string, unknown>>>

// Check if can add/remove
console.log(arrayState.canAdd());    // Signal<boolean>
console.log(arrayState.canRemove()); // Signal<boolean>
```

---

### ObjectField

**Purpose:** Complex nested object structures with validation.

In ng-signalify, ObjectField is implemented as `JsonField`.

#### Configuration Options

```typescript
interface JsonFieldConfig extends FieldConfig {
  schema?: z.ZodType<unknown>;  // Custom Zod schema for structure
  prettyPrint?: boolean;         // Pretty-print JSON in display
  maxDisplayDepth?: number;      // Limit display depth
}
```

#### Example

```typescript
import { JsonField } from 'ng-signalify/fields';
import { z } from 'zod';

// Simple object field
const metadataField = new JsonField('metadata', 'Metadata', {
  prettyPrint: true
});

// With custom schema validation
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().length(2)
});

const addressField = new JsonField('address', 'Address', {
  schema: addressSchema,
  required: true
});
```

#### Nested Data Access

```typescript
// Set complex object
addressField.createValue({
  street: '123 Main St',
  city: 'New York',
  zipCode: '10001',
  country: 'US'
});

// Access with dot notation (external utility needed)
const city = get(addressField.value(), 'city'); // 'New York'
```

---

## Custom Fields

You can create custom field types by extending `BaseField`.

### Phone Number Field Example

```typescript
import { z } from 'zod';
import { BaseField } from 'ng-signalify/fields';
import { FieldConfig } from 'ng-signalify/fields';

interface PhoneFieldConfig extends FieldConfig {
  countryCode?: string;  // Default country code
  format?: 'national' | 'international';
}

class PhoneField extends BaseField<string> {
  constructor(
    name: string,
    label: string,
    public override config: PhoneFieldConfig = {}
  ) {
    super(name, label, config);
  }

  schema(): z.ZodType<string> {
    let s = z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s;
  }

  override present(value: string | null): string {
    if (!value) return '-';
    
    // Format for display
    if (this.config.format === 'international') {
      return `+${value}`;
    }
    
    // National format (e.g., (555) 123-4567)
    return this.formatNational(value);
  }

  override fromImport(raw: unknown): string | null {
    if (raw == null || raw === '') return null;
    
    // Remove all non-numeric characters
    const cleaned = String(raw).replace(/\D/g, '');
    
    // Add country code if needed
    if (this.config.countryCode && !cleaned.startsWith(this.config.countryCode)) {
      return this.config.countryCode + cleaned;
    }
    
    return cleaned;
  }

  private formatNational(phone: string): string {
    // Implement your formatting logic
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }
}
```

### Usage

```typescript
const phoneField = new PhoneField('phone', 'Phone Number', {
  required: true,
  countryCode: '1',
  format: 'national',
  hint: 'Enter your US phone number'
});
```

### Custom Validation

You can add complex validation logic in the schema:

```typescript
class TaxIdField extends BaseField<string> {
  schema(): z.ZodType<string> {
    return z.string()
      .length(11, 'Tax ID must be 11 digits')
      .regex(/^\d+$/, 'Tax ID must contain only digits')
      .refine(
        (value) => this.validateTaxId(value),
        'Invalid Tax ID checksum'
      );
  }

  private validateTaxId(value: string): boolean {
    // Implement checksum validation
    const digits = value.split('').map(Number);
    // ... validation logic
    return true;
  }
}
```

---

## Best Practices

### 1. Separate Field Definitions

Create reusable field definition files:

```typescript
// fields/user-fields.ts
import { StringField, IntegerField, BooleanField } from 'ng-signalify/fields';

export const userFields = {
  firstName: new StringField('firstName', 'First Name', {
    required: true,
    min: 2,
    max: 50
  }),
  
  lastName: new StringField('lastName', 'Last Name', {
    required: true,
    min: 2,
    max: 50
  }),
  
  age: new IntegerField('age', 'Age', {
    min: 18,
    max: 120
  }),
  
  isActive: new BooleanField('isActive', 'Active', {
    yesLabel: 'Active',
    noLabel: 'Inactive'
  })
};
```

### 2. Reuse Across Forms

```typescript
// registration-form.ts
import { userFields } from './fields/user-fields';

const registrationFields = [
  userFields.firstName,
  userFields.lastName,
  userFields.age,
  // ... additional fields
];

const form = createEnhancedForm(registrationFields);
```

### 3. Type Inference

Let TypeScript infer types from field definitions:

```typescript
const fields = [
  new StringField('email', 'Email', { email: true }),
  new IntegerField('age', 'Age', { min: 0 })
] as const;

type FormData = {
  [K in typeof fields[number] as K['name']]: K extends BaseField<infer T> ? T : never
};
// FormData = { email: string; age: number; }
```

### 4. Group Related Fields

```typescript
// fields/address-fields.ts
export const createAddressFields = (prefix = '') => [
  new StringField(`${prefix}street`, 'Street Address', { required: true }),
  new StringField(`${prefix}city`, 'City', { required: true }),
  new StringField(`${prefix}zipCode`, 'ZIP Code', { 
    required: true,
    regex: /^\d{5}(-\d{4})?$/
  }),
  new EnumField(`${prefix}state`, 'State', stateOptions, { required: true })
];

// Usage
const billingFields = createAddressFields('billing_');
const shippingFields = createAddressFields('shipping_');
```

### 5. Provide Helpful Hints

Always add hints for fields that might be confusing:

```typescript
const passwordField = new PasswordField('password', 'Password', {
  required: true,
  minLength: 12,
  hint: 'Must be at least 12 characters with uppercase, lowercase, number, and special character'
});

const taxIdField = new StringField('taxId', 'Tax ID', {
  required: true,
  regex: /^\d{2}-\d{7}$/,
  hint: 'Format: XX-XXXXXXX',
  placeholder: '12-3456789'
});
```

### 6. Use Specific Field Types

Choose the most specific field type for your use case:

```typescript
// ❌ Too generic
const priceField = new StringField('price', 'Price');

// ✅ Type-safe and feature-rich
const priceField = new DecimalField('price', 'Price', {
  required: true,
  min: 0,
  scale: 2,
  currency: 'USD'
});
```

---

## Related Documentation

- [Forms & Schemas](../DOCUMENTATION.md#schemas-form--filter)
- [Validation](../DOCUMENTATION.md#validators-doğrulayıcılar)
- [Enhanced Forms](../DOCUMENTATION.md#enhanced-form-gelişmiş-form)
- [Import/Export Services](../DOCUMENTATION.md#services-importexport)
- [UI Adapters](../DOCUMENTATION.md#adapters-ui-integration)
- [Material Component Mapping](./material-component-mapping.md)

---

[Back to README](../README.md) | [Documentation Home](../DOCUMENTATION.md)

---

**ng-signalify** - Modern, Type-Safe, Signal-Based Forms for Angular 19+
