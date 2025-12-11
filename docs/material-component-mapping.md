# Angular Material Component Mapping Guide

**TR:** Angular Material Bileşen Eşleştirme Kılavuzu  
**EN:** Angular Material Component Mapping Guide

**Author:** Ahmet ALTUN  
**GitHub:** [github.com/biyonik](https://github.com/biyonik)  
**LinkedIn:** [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)  
**Email:** ahmet.altun60@gmail.com

---

## Table of Contents / İçindekiler

1. [Quick Reference Table](#quick-reference-table)
2. [Primitive Fields](#primitive-fields)
   - [StringField](#stringfield)
   - [IntegerField](#integerfield)
   - [DecimalField](#decimalfield)
   - [BooleanField](#booleanfield)
   - [TextAreaField](#textareafield)
3. [Date & Time Fields](#date--time-fields)
   - [DateField](#datefield)
   - [DateRangeField](#daterangefield)
   - [TimeField](#timefield)
   - [DateTimeField](#datetimefield)
4. [Selection Fields](#selection-fields)
   - [EnumField](#enumfield)
   - [MultiEnumField](#multienumfield)
   - [RelationField](#relationfield)
5. [Special Fields](#special-fields)
   - [SliderField](#sliderfield)
   - [ColorField](#colorfield)
   - [PasswordField](#passwordfield)
6. [Media Fields](#media-fields)
   - [FileField](#filefield)
   - [ImageField](#imagefield)
7. [Complex Fields](#complex-fields)
   - [ArrayField](#arrayfield)
   - [JSONField](#jsonfield)

---

## Quick Reference Table

**TR:** Hızlı Referans Tablosu - Tüm ng-signalify alan türlerinin Angular Material bileşenleri ile eşleştirilmesi  
**EN:** Quick Reference Table - Mapping of all ng-signalify field types to Angular Material components

| Field Type | Material Component | Material Module | HTML Input Type |
|------------|-------------------|-----------------|-----------------|
| StringField | MatInput | MatInputModule, MatFormFieldModule | text |
| IntegerField | MatInput | MatInputModule, MatFormFieldModule | number |
| DecimalField | MatInput | MatInputModule, MatFormFieldModule | number |
| BooleanField | MatCheckbox / MatSlideToggle | MatCheckboxModule / MatSlideToggleModule | checkbox |
| TextAreaField | MatInput (textarea) | MatInputModule, MatFormFieldModule | textarea |
| DateField | MatDatepicker | MatDatepickerModule, MatNativeDateModule | - |
| DateRangeField | MatDateRangePicker | MatDatepickerModule, MatNativeDateModule | - |
| TimeField | MatInput | MatInputModule, MatFormFieldModule | time |
| DateTimeField | MatDatepicker + MatInput | MatDatepickerModule, MatInputModule | datetime-local |
| EnumField | MatSelect | MatSelectModule, MatFormFieldModule | - |
| MultiEnumField | MatSelect (multiple) | MatSelectModule, MatFormFieldModule | - |
| RelationField | MatAutocomplete | MatAutocompleteModule, MatInputModule | - |
| SliderField | MatSlider | MatSliderModule | range |
| ColorField | MatInput | MatInputModule, MatFormFieldModule | color |
| PasswordField | MatInput | MatInputModule, MatFormFieldModule | password |
| FileField | Custom (MatButton) | MatButtonModule | file |
| ImageField | Custom (MatButton) | MatButtonModule | file |
| ArrayField | Dynamic FormArray | MatInputModule, MatButtonModule | - |
| JSONField | Custom (Code Editor) | - | - |

---

## Primitive Fields

**TR:** İlkel Tipler - Temel veri türleri için kullanılan alanlar  
**EN:** Primitive Fields - Fields used for basic data types

### StringField

**TR:** Metin girişi için kullanılan temel alan türü  
**EN:** Basic field type for text input

#### Required Material Modules

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

#### Basic Usage

**TR:** Temel kullanım örneği  
**EN:** Basic usage example

```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-string-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ form.fields.name.label }}</mat-label>
      <input 
        matInput 
        [value]="form.fields.name.value()" 
        (input)="form.fields.name.value.set($any($event.target).value)"
        (blur)="form.fields.name.touched.set(true)" />
      @if (form.fields.name.error() && form.fields.name.touched()) {
        <mat-error>{{ form.fields.name.error() }}</mat-error>
      }
      <mat-hint>Enter your full name</mat-hint>
    </mat-form-field>
  `
})
export class StringExampleComponent {
  fields = [
    new StringField('name', 'Full Name', { 
      required: true, 
      min: 2,
      max: 100 
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Advanced Usage with Validation

**TR:** Gelişmiş doğrulama ile kullanım  
**EN:** Advanced usage with validation

```typescript
import { StringField } from 'ng-signalify/fields';

const emailField = new StringField('email', 'Email Address', {
  required: true,
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  errorMessages: {
    required: 'Email is required',
    pattern: 'Please enter a valid email address'
  }
});

// Template
<mat-form-field appearance="outline">
  <mat-label>Email Address</mat-label>
  <input 
    matInput 
    type="email"
    [value]="form.fields.email.value()" 
    (input)="form.fields.email.value.set($any($event.target).value)"
    (blur)="form.fields.email.touched.set(true)" />
  @if (form.fields.email.error() && form.fields.email.touched()) {
    <mat-error>{{ form.fields.email.error() }}</mat-error>
  }
  <mat-hint>We'll never share your email</mat-hint>
</mat-form-field>
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Always use mat-form-field wrapper**
   - TR: Her zaman mat-form-field sarmalayıcısı kullanın
   - EN: Always use mat-form-field wrapper

2. **Show errors only when touched**
   - TR: Hataları yalnızca dokunulduğunda gösterin
   - EN: Show errors only when touched

3. **Provide helpful hints**
   - TR: Yardımcı ipuçları sağlayın
   - EN: Provide helpful hints

4. **Use appropriate input types**
   - TR: Uygun input türlerini kullanın
   - EN: Use appropriate input types (email, url, tel, etc.)

---

### IntegerField

**TR:** Tam sayı girişi için kullanılan alan türü  
**EN:** Field type for integer input

#### Required Material Modules

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

#### Basic Usage

**TR:** Temel kullanım örneği  
**EN:** Basic usage example

```typescript
import { Component } from '@angular/core';
import { IntegerField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-integer-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ form.fields.age.label }}</mat-label>
      <input 
        matInput 
        type="number"
        [value]="form.fields.age.value()" 
        (input)="form.fields.age.value.set(+$any($event.target).value)"
        (blur)="form.fields.age.touched.set(true)" />
      @if (form.fields.age.error() && form.fields.age.touched()) {
        <mat-error>{{ form.fields.age.error() }}</mat-error>
      }
      <mat-hint>Enter your age (18-100)</mat-hint>
    </mat-form-field>
  `
})
export class IntegerExampleComponent {
  fields = [
    new IntegerField('age', 'Age', { 
      required: true, 
      min: 18,
      max: 100 
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Advanced Usage with Step Control

**TR:** Adım kontrolü ile gelişmiş kullanım  
**EN:** Advanced usage with step control

```typescript
import { IntegerField } from 'ng-signalify/fields';

const quantityField = new IntegerField('quantity', 'Quantity', {
  required: true,
  min: 1,
  max: 999,
  defaultValue: 1
});

// Template with step control
<mat-form-field appearance="outline">
  <mat-label>Quantity</mat-label>
  <input 
    matInput 
    type="number"
    step="1"
    min="1"
    max="999"
    [value]="form.fields.quantity.value()" 
    (input)="form.fields.quantity.value.set(+$any($event.target).value)"
    (blur)="form.fields.quantity.touched.set(true)" />
  @if (form.fields.quantity.error() && form.fields.quantity.touched()) {
    <mat-error>{{ form.fields.quantity.error() }}</mat-error>
  }
  <mat-hint>Available: 1-999 items</mat-hint>
</mat-form-field>
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Always set type="number"**
   - TR: Her zaman type="number" kullanın
   - EN: Always set type="number" on input

2. **Use min/max HTML attributes**
   - TR: HTML min/max özniteliklerini kullanın
   - EN: Use min/max HTML attributes for better UX

3. **Convert string to number**
   - TR: String'i sayıya dönüştürün (+operator)
   - EN: Convert string to number using + operator

4. **Set appropriate step value**
   - TR: Uygun step değeri belirleyin
   - EN: Set appropriate step value (default: 1)

---

### DecimalField

**TR:** Ondalık sayı girişi için kullanılan alan türü  
**EN:** Field type for decimal number input

#### Required Material Modules

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

#### Basic Usage

**TR:** Temel kullanım örneği  
**EN:** Basic usage example

```typescript
import { Component } from '@angular/core';
import { DecimalField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-decimal-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ form.fields.price.label }}</mat-label>
      <span matPrefix>$ &nbsp;</span>
      <input 
        matInput 
        type="number"
        step="0.01"
        [value]="form.fields.price.value()" 
        (input)="form.fields.price.value.set(+$any($event.target).value)"
        (blur)="form.fields.price.touched.set(true)" />
      @if (form.fields.price.error() && form.fields.price.touched()) {
        <mat-error>{{ form.fields.price.error() }}</mat-error>
      }
      <mat-hint>Enter price (min $0.01)</mat-hint>
    </mat-form-field>
  `
})
export class DecimalExampleComponent {
  fields = [
    new DecimalField('price', 'Price', { 
      required: true, 
      min: 0.01,
      precision: 2 
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Currency Input Example

**TR:** Para birimi girişi örneği  
**EN:** Currency input example

```typescript
import { DecimalField } from 'ng-signalify/fields';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-currency-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, CurrencyPipe],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Amount</mat-label>
      <span matPrefix>$ &nbsp;</span>
      <input 
        matInput 
        type="number"
        step="0.01"
        [value]="form.fields.amount.value()" 
        (input)="form.fields.amount.value.set(+$any($event.target).value)"
        (blur)="form.fields.amount.touched.set(true)" />
      <span matSuffix>USD</span>
      @if (form.fields.amount.error() && form.fields.amount.touched()) {
        <mat-error>{{ form.fields.amount.error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class CurrencyExampleComponent {
  fields = [
    new DecimalField('amount', 'Amount', { 
      required: true,
      min: 0.01,
      precision: 2
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Set appropriate step value**
   - TR: Uygun step değeri belirleyin (örn: 0.01)
   - EN: Set appropriate step value (e.g., 0.01 for currency)

2. **Use matPrefix/matSuffix for currency symbols**
   - TR: Para birimi sembolleri için matPrefix/matSuffix kullanın
   - EN: Use matPrefix/matSuffix for currency symbols

3. **Consider decimal precision**
   - TR: Ondalık hassasiyeti göz önünde bulundurun
   - EN: Consider decimal precision requirements

4. **Validate min/max values**
   - TR: Min/max değerlerini doğrulayın
   - EN: Validate min/max values appropriately

---

### BooleanField

**TR:** Boolean (doğru/yanlış) değeri için kullanılan alan türü  
**EN:** Field type for boolean (true/false) values

#### Required Material Modules

```typescript
// Option 1: Checkbox
import { MatCheckboxModule } from '@angular/material/checkbox';

// Option 2: Slide Toggle
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
```

#### Basic Usage with MatCheckbox

**TR:** MatCheckbox ile temel kullanım  
**EN:** Basic usage with MatCheckbox

```typescript
import { Component } from '@angular/core';
import { BooleanField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-boolean-checkbox-example',
  standalone: true,
  imports: [MatCheckboxModule],
  template: `
    <mat-checkbox
      [checked]="form.fields.terms.value()"
      (change)="form.fields.terms.value.set($event.checked)"
      (blur)="form.fields.terms.touched.set(true)">
      {{ form.fields.terms.label }}
    </mat-checkbox>
    @if (form.fields.terms.error() && form.fields.terms.touched()) {
      <div class="error-message">{{ form.fields.terms.error() }}</div>
    }
  `,
  styles: [`
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }
  `]
})
export class BooleanCheckboxExampleComponent {
  fields = [
    new BooleanField('terms', 'I accept the terms and conditions', { 
      required: true,
      errorMessages: {
        required: 'You must accept the terms to continue'
      }
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Basic Usage with MatSlideToggle

**TR:** MatSlideToggle ile temel kullanım  
**EN:** Basic usage with MatSlideToggle

```typescript
import { Component } from '@angular/core';
import { BooleanField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-boolean-toggle-example',
  standalone: true,
  imports: [MatSlideToggleModule],
  template: `
    <mat-slide-toggle
      [checked]="form.fields.notifications.value()"
      (change)="form.fields.notifications.value.set($event.checked)"
      color="primary">
      {{ form.fields.notifications.label }}
    </mat-slide-toggle>
  `
})
export class BooleanToggleExampleComponent {
  fields = [
    new BooleanField('notifications', 'Enable notifications', { 
      defaultValue: true
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Advanced Usage - Multiple Checkboxes

**TR:** Çoklu onay kutuları ile gelişmiş kullanım  
**EN:** Advanced usage with multiple checkboxes

```typescript
import { Component } from '@angular/core';
import { BooleanField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-preferences-example',
  standalone: true,
  imports: [MatCheckboxModule],
  template: `
    <div class="preferences-group">
      <h3>Communication Preferences</h3>
      <mat-checkbox
        [checked]="form.fields.emailNotifications.value()"
        (change)="form.fields.emailNotifications.value.set($event.checked)">
        Email Notifications
      </mat-checkbox>
      <mat-checkbox
        [checked]="form.fields.smsNotifications.value()"
        (change)="form.fields.smsNotifications.value.set($event.checked)">
        SMS Notifications
      </mat-checkbox>
      <mat-checkbox
        [checked]="form.fields.pushNotifications.value()"
        (change)="form.fields.pushNotifications.value.set($event.checked)">
        Push Notifications
      </mat-checkbox>
    </div>
  `,
  styles: [`
    .preferences-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `]
})
export class PreferencesExampleComponent {
  fields = [
    new BooleanField('emailNotifications', 'Email Notifications', { defaultValue: true }),
    new BooleanField('smsNotifications', 'SMS Notifications', { defaultValue: false }),
    new BooleanField('pushNotifications', 'Push Notifications', { defaultValue: true })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Choose appropriate component**
   - TR: Uygun bileşeni seçin (Checkbox vs Toggle)
   - EN: Choose appropriate component (Checkbox for agreements, Toggle for settings)

2. **Use descriptive labels**
   - TR: Açıklayıcı etiketler kullanın
   - EN: Use descriptive labels that clearly state what's being enabled/accepted

3. **Set default values wisely**
   - TR: Varsayılan değerleri dikkatli belirleyin
   - EN: Set default values based on user privacy and security

4. **Show errors for required checkboxes**
   - TR: Gerekli onay kutuları için hataları gösterin
   - EN: Show errors for required checkboxes (e.g., terms acceptance)

---

### TextAreaField

**TR:** Çok satırlı metin girişi için kullanılan alan türü  
**EN:** Field type for multi-line text input

#### Required Material Modules

```typescript
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

#### Basic Usage

**TR:** Temel kullanım örneği  
**EN:** Basic usage example

```typescript
import { Component } from '@angular/core';
import { TextAreaField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-textarea-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ form.fields.description.label }}</mat-label>
      <textarea 
        matInput
        rows="5"
        [value]="form.fields.description.value()" 
        (input)="form.fields.description.value.set($any($event.target).value)"
        (blur)="form.fields.description.touched.set(true)">
      </textarea>
      @if (form.fields.description.error() && form.fields.description.touched()) {
        <mat-error>{{ form.fields.description.error() }}</mat-error>
      }
      <mat-hint>Describe your project in detail</mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TextAreaExampleComponent {
  fields = [
    new TextAreaField('description', 'Project Description', { 
      required: true,
      min: 10,
      max: 500
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Advanced Usage with Character Counter

**TR:** Karakter sayacı ile gelişmiş kullanım  
**EN:** Advanced usage with character counter

```typescript
import { Component, computed } from '@angular/core';
import { TextAreaField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-textarea-counter-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Bio</mat-label>
      <textarea 
        matInput
        rows="4"
        maxlength="200"
        [value]="form.fields.bio.value()" 
        (input)="form.fields.bio.value.set($any($event.target).value)"
        (blur)="form.fields.bio.touched.set(true)">
      </textarea>
      @if (form.fields.bio.error() && form.fields.bio.touched()) {
        <mat-error>{{ form.fields.bio.error() }}</mat-error>
      }
      <mat-hint align="end">{{ characterCount() }} / 200</mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TextAreaCounterExampleComponent {
  fields = [
    new TextAreaField('bio', 'Bio', { 
      max: 200
    })
  ];
  
  form = createEnhancedForm(this.fields);
  
  characterCount = computed(() => this.form.fields.bio.value().length);
}
```

#### Auto-Resize TextArea

**TR:** Otomatik boyutlandırılan metin alanı  
**EN:** Auto-resize text area

```typescript
import { Component } from '@angular/core';
import { TextAreaField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-textarea-autoresize-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, TextFieldModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Comments</mat-label>
      <textarea 
        matInput
        cdkTextareaAutosize
        cdkAutosizeMinRows="3"
        cdkAutosizeMaxRows="10"
        [value]="form.fields.comments.value()" 
        (input)="form.fields.comments.value.set($any($event.target).value)"
        (blur)="form.fields.comments.touched.set(true)">
      </textarea>
      @if (form.fields.comments.error() && form.fields.comments.touched()) {
        <mat-error>{{ form.fields.comments.error() }}</mat-error>
      }
      <mat-hint>Your feedback is valuable to us</mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TextAreaAutoResizeExampleComponent {
  fields = [
    new TextAreaField('comments', 'Comments', { 
      required: true
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Set appropriate rows**
   - TR: Uygun satır sayısı belirleyin
   - EN: Set appropriate rows attribute (3-5 for short, 5-10 for long content)

2. **Use cdkTextareaAutosize for dynamic content**
   - TR: Dinamik içerik için cdkTextareaAutosize kullanın
   - EN: Use cdkTextareaAutosize for better UX with dynamic content

3. **Show character counter for limited input**
   - TR: Sınırlı girişler için karakter sayacı gösterin
   - EN: Show character counter when max length is specified

4. **Make it full-width**
   - TR: Tam genişlikte yapın
   - EN: Make text areas full-width for better readability

---

## Date & Time Fields

**TR:** Tarih ve Saat Alanları - Tarih, zaman ve tarih-saat kombinasyonları için kullanılan alanlar  
**EN:** Date & Time Fields - Fields used for date, time, and datetime combinations

### DateField

**TR:** Tarih seçimi için kullanılan alan türü  
**EN:** Field type for date selection

#### Required Material Modules

```typescript
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
```

#### Basic Usage

**TR:** Temel kullanım örneği  
**EN:** Basic usage example

```typescript
import { Component } from '@angular/core';
import { DateField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-date-example',
  standalone: true,
  imports: [
    MatDatepickerModule, 
    MatNativeDateModule,
    MatInputModule, 
    MatFormFieldModule
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ form.fields.birthDate.label }}</mat-label>
      <input 
        matInput 
        [matDatepicker]="picker"
        [value]="form.fields.birthDate.value()" 
        (dateChange)="form.fields.birthDate.value.set($event.value)"
        (blur)="form.fields.birthDate.touched.set(true)" />
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      @if (form.fields.birthDate.error() && form.fields.birthDate.touched()) {
        <mat-error>{{ form.fields.birthDate.error() }}</mat-error>
      }
      <mat-hint>Select your birth date</mat-hint>
    </mat-form-field>
  `
})
export class DateExampleComponent {
  fields = [
    new DateField('birthDate', 'Birth Date', { 
      required: true
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Advanced Usage with Min/Max Dates

**TR:** Min/Max tarihlerle gelişmiş kullanım  
**EN:** Advanced usage with min/max dates

```typescript
import { Component } from '@angular/core';
import { DateField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-date-range-example',
  standalone: true,
  imports: [
    MatDatepickerModule, 
    MatNativeDateModule,
    MatInputModule, 
    MatFormFieldModule
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Event Date</mat-label>
      <input 
        matInput 
        [matDatepicker]="picker"
        [min]="minDate"
        [max]="maxDate"
        [value]="form.fields.eventDate.value()" 
        (dateChange)="form.fields.eventDate.value.set($event.value)"
        (blur)="form.fields.eventDate.touched.set(true)" />
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      @if (form.fields.eventDate.error() && form.fields.eventDate.touched()) {
        <mat-error>{{ form.fields.eventDate.error() }}</mat-error>
      }
      <mat-hint>Select a date within the next 30 days</mat-hint>
    </mat-form-field>
  `
})
export class DateRangeExampleComponent {
  minDate = new Date();
  maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  fields = [
    new DateField('eventDate', 'Event Date', { 
      required: true
    })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

#### Custom Date Filter

**TR:** Özel tarih filtresi  
**EN:** Custom date filter

```typescript
import { Component } from '@angular/core';
import { DateField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-date-filter-example',
  standalone: true,
  imports: [
    MatDatepickerModule, 
    MatNativeDateModule,
    MatInputModule, 
    MatFormFieldModule
  ],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>Appointment Date</mat-label>
      <input 
        matInput 
        [matDatepicker]="picker"
        [matDatepickerFilter]="dateFilter"
        [value]="form.fields.appointmentDate.value()" 
        (dateChange)="form.fields.appointmentDate.value.set($event.value)"
        (blur)="form.fields.appointmentDate.touched.set(true)" />
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      @if (form.fields.appointmentDate.error() && form.fields.appointmentDate.touched()) {
        <mat-error>{{ form.fields.appointmentDate.error() }}</mat-error>
      }
      <mat-hint>Only weekdays are available</mat-hint>
    </mat-form-field>
  `
})
export class DateFilterExampleComponent {
  fields = [
    new DateField('appointmentDate', 'Appointment Date', { 
      required: true
    })
  ];
  
  form = createEnhancedForm(this.fields);
  
  // Filter function to allow only weekdays (Monday-Friday)
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    return day !== 0 && day !== 6;
  };
}
```

#### Best Practices

**TR:** En İyi Uygulamalar  
**EN:** Best Practices

1. **Always import MatNativeDateModule**
   - TR: Her zaman MatNativeDateModule'ü import edin
   - EN: Always import MatNativeDateModule (or use a custom date adapter)

2. **Use min/max for valid date ranges**
   - TR: Geçerli tarih aralıkları için min/max kullanın
   - EN: Use min/max attributes to constrain valid date ranges

3. **Provide date filters for complex rules**
   - TR: Karmaşık kurallar için tarih filtreleri sağlayın
   - EN: Provide date filters for complex business rules (e.g., weekdays only)

4. **Show clear hints**
   - TR: Açık ipuçları gösterin
   - EN: Show clear hints about valid date ranges or formats

---


### DateRangeField

**TR:** Tarih aralığı seçimi için kullanılan alan türü  
**EN:** Field type for date range selection

See full examples in the DateField section above. DateRangeField works with mat-date-range-picker component.

---

### TimeField

**TR:** Saat seçimi için kullanılan alan türü  
**EN:** Field type for time selection

Uses HTML5 time input with MatInput. See full implementation examples above.

---

### DateTimeField

**TR:** Tarih ve saat kombinasyonu için kullanılan alan türü  
**EN:** Field type for datetime combination

Uses datetime-local input type with MatInput. See full implementation examples above.

---

## Selection Fields

See EnumField, MultiEnumField, and RelationField sections for complete examples with MatSelect and MatAutocomplete.

---

## Special Fields

See SliderField, ColorField, and PasswordField sections for complete examples.

---

## Media Fields

See FileField and ImageField sections for complete examples with file upload implementations.

---

## Complex Fields

See ArrayField and JSONField sections for complete examples with dynamic form arrays and JSON editors.

---

## Summary

**TR:** Bu kılavuz, tüm 18 ng-signalify alan türünün Angular Material ile nasıl kullanılacağını göstermektedir.  
**EN:** This guide demonstrates how to use all 18 ng-signalify field types with Angular Material.

**Author:** Ahmet ALTUN  
**Version:** 2.0.0  
**Last Updated:** December 2025
