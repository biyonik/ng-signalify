# Angular Material + ng-signalify Best Practices

**TR:** Angular Material + ng-signalify En İyi Uygulamalar Kılavuzu  
**EN:** Angular Material + ng-signalify Best Practices Guide

**Author:** Ahmet ALTUN  
**GitHub:** [github.com/biyonik](https://github.com/biyonik)  
**LinkedIn:** [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)  
**Email:** ahmet.altun60@gmail.com

---

## Table of Contents / İçindekiler

1. [Module Organization](#1-module-organization)
2. [Form Field Consistency](#2-form-field-consistency)
3. [Error Message Display](#3-error-message-display)
4. [Accessibility](#4-accessibility)
5. [Performance](#5-performance)
6. [Theming](#6-theming)
7. [Responsive Design](#7-responsive-design)
8. [Form Validation Patterns](#8-form-validation-patterns)
9. [Loading States](#9-loading-states)
10. [Do's and Don'ts](#10-dos-and-donts)

---

## 1. Module Organization

**TR:** Modül Organizasyonu - Material modüllerini projenizde nasıl düzenleyeceğiniz  
**EN:** Module Organization - How to organize Material modules in your project

### SharedMaterialModule Pattern

**TR:** Tüm Material modüllerini tek bir shared module'de toplayın  
**EN:** Collect all Material modules in a single shared module

```typescript
// shared-material.module.ts

/**
 * TR: Tüm Angular Material modüllerini merkezi bir şekilde yöneten shared module.
 * EN: Shared module that centrally manages all Angular Material modules.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { NgModule } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const MATERIAL_MODULES = [
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatButtonModule,
  MatIconModule
];

@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES
})
export class SharedMaterialModule {}
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: Tek bir SharedMaterialModule oluşturun
- EN: Create a single SharedMaterialModule

❌ **DON'T:**
- TR: Her component'te Material modüllerini tekrar import etmeyin
- EN: Don't reimport Material modules in every component

---

## 2. Form Field Consistency

**TR:** MaterialAdapter konfigürasyonu ile tutarlı görünüm sağlayın  
**EN:** Ensure consistent appearance with MaterialAdapter configuration

### Global Configuration

```typescript
// app.config.ts

/**
 * TR: Uygulama seviyesinde Material adapter yapılandırması.
 * EN: Application-level Material adapter configuration.
 *
 * @author Ahmet ALTUN
 */
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSigUI(new MaterialAdapter({
      defaultAppearance: 'outline',
      defaultFloatLabel: 'auto',
      defaultColor: 'primary',
      autoHints: true,
      autoAriaLabels: true
    }))
  ]
};
```

### Appearance Options

- **fill**: Prominent, for primary focus forms
- **outline**: Clean modern look (recommended)
- **standard**: Minimalist, for compact UIs

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: Tüm projede tek appearance kullanın
- EN: Use one appearance throughout project

❌ **DON'T:**
- TR: Farklı appearance'ları karıştırmayın
- EN: Don't mix different appearances

---

## 3. Error Message Display

**TR:** Kullanıcı dostu hata gösterimi  
**EN:** User-friendly error display

### Touched Pattern

```typescript
@Component({
  template: `
    <mat-form-field>
      <input matInput (blur)="field.touched.set(true)" />
      @if (field.error() && field.touched()) {
        <mat-error>{{ field.error() }}</mat-error>
      }
    </mat-form-field>
  `
})
```

### Custom Error Messages

```typescript
const emailField = new StringField('email', 'Email', {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  errorMessages: {
    required: 'Email is required',
    pattern: 'Please enter a valid email address'
  }
});
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: Hataları touched durumunda gösterin
- EN: Show errors when touched

❌ **DON'T:**
- TR: Form yüklenirken hataları göstermeyin
- EN: Don't show errors on form load

---

## 4. Accessibility

**TR:** WCAG 2.1 Level AA uyumlu formlar  
**EN:** WCAG 2.1 Level AA compliant forms

### Auto ARIA Labels

```typescript
// Enabled by default in MaterialAdapter
export const appConfig = {
  providers: [
    provideSigUI(new MaterialAdapter({
      autoAriaLabels: true
    }))
  ]
};
```

### Manual ARIA Labels

```typescript
@Component({
  template: `
    <input 
      matInput 
      aria-label="Search products"
      aria-describedby="search-hint" />
    <mat-hint id="search-hint">Enter keywords</mat-hint>
  `
})
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: ARIA labels kullanın
- EN: Use ARIA labels

- TR: Klavye navigasyonunu test edin
- EN: Test keyboard navigation

❌ **DON'T:**
- TR: Sadece renge dayalı göstergeler kullanmayın
- EN: Don't rely on color alone

---

## 5. Performance

**TR:** OnPush stratejisi ile performans artışı  
**EN:** Performance boost with OnPush strategy

### OnPush Change Detection

```typescript
/**
 * TR: OnPush ile optimize edilmiş form komponenti.
 * EN: Optimized form component with OnPush.
 *
 * @author Ahmet ALTUN
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field>
      <input matInput [value]="form.fields.name.value()" />
    </mat-form-field>
  `
})
export class OptimizedFormComponent {
  fields = [new StringField('name', 'Name')];
  form = createEnhancedForm(this.fields);
}
```

### TrackBy for Lists

```typescript
@Component({
  template: `
    @for (item of items(); track trackByFn($index, item)) {
      <mat-option [value]="item.id">{{ item.name }}</mat-option>
    }
  `
})
export class ListComponent {
  trackByFn(index: number, item: any) {
    return item.id;
  }
}
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: OnPush change detection kullanın
- EN: Use OnPush change detection

- TR: TrackBy fonksiyonları kullanın
- EN: Use trackBy functions

❌ **DON'T:**
- TR: Gereksiz change detection tetiklemeyin
- EN: Don't trigger unnecessary change detection

---

## 6. Theming

**TR:** Tutarlı renk ve stil kullanımı  
**EN:** Consistent color and style usage

### Material Theme

```scss
// styles.scss
@use '@angular/material' as mat;

$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette);
$my-theme: mat.define-light-theme((color: (
  primary: $my-primary,
  accent: $my-accent
)));

@include mat.all-component-themes($my-theme);
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: Material tema sistemini kullanın
- EN: Use Material theming system

❌ **DON'T:**
- TR: Sabit renkler kullanmayın
- EN: Don't use hardcoded colors

---

## 7. Responsive Design

**TR:** Tüm ekran boyutlarında çalışan formlar  
**EN:** Forms that work on all screen sizes

### Mobile-First Grid

```typescript
@Component({
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
```

### ✅ DO / ❌ DON'T

✅ **DO:**
- TR: Mobil öncelikli tasarlayın
- EN: Design mobile-first

❌ **DON'T:**
- TR: Sabit genişlikler kullanmayın
- EN: Don't use fixed widths

---

## 8. Form Validation Patterns

**TR:** Yaygın doğrulama senaryoları  
**EN:** Common validation scenarios

### Cross-Field Validation

```typescript
@Component({
  template: `
    <mat-form-field>
      <input matInput type="password" [(ngModel)]="password" />
    </mat-form-field>
    <mat-form-field>
      <input matInput type="password" [(ngModel)]="confirmPassword" />
      @if (passwordMismatch()) {
        <mat-error>Passwords do not match</mat-error>
      }
    </mat-form-field>
  `
})
export class ValidationComponent {
  passwordMismatch = computed(() => 
    this.password !== this.confirmPassword && this.confirmPassword.length > 0
  );
}
```

---

## 9. Loading States

**TR:** Async işlemler için kullanıcı geri bildirimi  
**EN:** User feedback for async operations

### Form Submission Loading

```typescript
@Component({
  template: `
    <button 
      mat-raised-button 
      [disabled]="isSubmitting()">
      @if (isSubmitting()) {
        <mat-spinner diameter="20"></mat-spinner>
        Submitting...
      } @else {
        Submit
      }
    </button>
  `
})
export class LoadingComponent {
  isSubmitting = signal(false);
}
```

---

## 10. Do's and Don'ts

**TR:** Özet kılavuz  
**EN:** Summary guide

### ✅ DO

1. **Use MaterialAdapter configuration** for global consistency
2. **Show errors only when touched** for better UX
3. **Provide ARIA labels** for accessibility
4. **Use OnPush change detection** for performance
5. **Test on mobile devices** for responsive design

### ❌ DON'T

1. **Don't mix appearance types** in the same form
2. **Don't show errors immediately** on form load
3. **Don't ignore keyboard navigation** testing
4. **Don't use hardcoded colors** outside theme
5. **Don't forget loading states** for async operations

---

## Conclusion

**TR:** Bu kılavuz, Angular Material ve ng-signalify ile profesyonel formlar oluşturmak için en iyi uygulamaları kapsamaktadır.  
**EN:** This guide covers best practices for creating professional forms with Angular Material and ng-signalify.

**Author:** Ahmet ALTUN  
**Version:** 2.0.0  
**Last Updated:** December 2025
