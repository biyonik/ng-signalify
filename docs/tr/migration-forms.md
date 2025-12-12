# Geçiş Kılavuzu: Angular Reactive Forms → ng-signalify

> **🇬🇧 For English version:** [docs/migration-forms.md](../migration-forms.md)

## İçindekiler

- [Neden Geçiş Yapmalı?](#neden-geçiş-yapmalı)
- [Temel Farklar](#temel-farklar)
- [Adım Adım Kılavuz](#adım-adım-kılavuz)
- [Yan Yana Karşılaştırmalar](#yan-yana-karşılaştırmalar)
- [Doğrulama Geçişi](#doğrulama-geçişi)
- [Yaygın Desenler](#yaygın-desenler)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

---

## Neden Geçiş Yapmalı?

### ng-signalify Forms'un Faydaları

| Fayda | Açıklama | Etki |
|-------|----------|------|
| **Signal Tabanlı** | Angular Signals üzerine kurulu, varsayılan olarak reaktif | 🎯 Modern Angular desenleri |
| **Tip Güvenli** | Formlar ve alanlar için tam TypeScript çıkarımı | ✅ Derleme zamanında hataları yakala |
| **Daha Az Boilerplate** | FormGroup/FormControl manuel kurulumu yok | ⚡ Daha hızlı geliştirme |
| **Daha İyi Doğrulama** | Açık hata mesajlarıyla Zod destekli doğrulama | 🔒 Daha güçlü doğrulama |
| **Framework Bağımsız** | Alanlar Angular forms bağımlılığı olmadan çalışır | 📦 Daha küçük bundle boyutu |
| **Yerleşik Özellikler** | İçe/dışa aktarma, alan ön ayarları, hesaplanmış değerler | 🚀 Daha az özel kod |
| **Bildirimsel** | Alanları bir kez tanımla, her yerde kullan | ♻️ Daha iyi yeniden kullanılabilirlik |

### Kod Azaltma Örneği

**Angular Reactive Forms:**
```typescript
// ~50-60 satır kurulum
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
// ~10-15 satır, daha bildirimsel
const fields = [
  new StringField('email', 'E-posta', { required: true, email: true }),
  new PasswordField('password', 'Şifre', { required: true, minLength: 8 }),
  new IntegerField('age', 'Yaş', { required: true, min: 18, max: 120 })
];

const form = createEnhancedForm(fields);
```

### Ne Zaman Geçiş YAPMAMANIZ Gerekir

Şu durumlarda Reactive Forms'ta kalmayı düşünün:

- ❌ **Basit formlar** - 2-3 alanlı formlar için Reactive Forms yeterli
- ❌ **Template-driven tercih** - ngModel ve template sözdizimini tercih ediyorsunuz
- ❌ **TypeScript yok** - TypeScript kullanmıyorsunuz (ng-signalify gerektirir)
- ❌ **Üçüncü taraf form kütüphaneleri** - Reactive Forms üzerine kurulu kütüphanelere yatırım yaptınız
- ❌ **Ekip direnci** - Ekip Signals'a aşina değil ve değişime direniyor

ng-signalify formları şunlar için idealdir:

- ✅ **Karmaşık formlar** - Çok adımlı, dinamik, iç içe formlar
- ✅ **Veri yoğun uygulamalar** - Yönetim panelleri, CRM, ERP sistemleri
- ✅ **Tip güvenliği kritik** - Finans, sağlık, hukuk uygulamaları
- ✅ **İçe/Dışa Aktarma** - Excel/CSV içe aktarma gereken formlar
- ✅ **Yeniden kullanılabilir alanlar** - Birden fazla formda aynı alanlar

---

## Temel Farklar

### Karşılaştırma Tablosu

| Özellik | Reactive Forms | ng-signalify |
|---------|---------------|--------------|
| **Alan Tanımı** | `FormControl` | `StringField`, `IntegerField`, vb. |
| **Form Oluşturma** | `new FormGroup({...})` | `createEnhancedForm(fields)` |
| **Doğrulama** | `Validators.*` | Zod şeması + alan config |
| **Tip Güvenliği** | Zayıf (any tipleri) | Güçlü (tam çıkarım) |
| **Reaktivite** | RxJS observable'lar | Angular Signals |
| **Hata Mesajları** | Manuel eşleme | Özelleştirme ile otomatik |
| **Değer Erişimi** | `form.get('field')?.value` | `form.getValue('field')()` |
| **Doğrulama Durumu** | `form.get('field')?.errors` | `form.fields.field.error()` |
| **Diziler** | `FormArray` | `ArrayField` |
| **İç İçe Formlar** | İç içe `FormGroup` | Şema ile iç içe alanlar |
| **İçe/Dışa Aktarma** | Manuel | Yerleşik |

### Kavramsal Eşleştirme

| Reactive Forms | ng-signalify Eşdeğeri |
|----------------|----------------------|
| `FormControl` | Alan sınıfları (StringField, vb.) |
| `FormGroup` | `createEnhancedForm()` |
| `FormArray` | `ArrayField` |
| `Validators.required` | `{ required: true }` |
| `Validators.email` | `{ email: true }` |
| `Validators.minLength` | `{ min: n }` |
| `Validators.maxLength` | `{ max: n }` |
| `Validators.min` | `{ min: n }` (sayılar için) |
| `Validators.max` | `{ max: n }` (sayılar için) |
| `Validators.pattern` | `{ regex: /.../ }` |
| `form.valueChanges` | Signal'ları izleyen `effect()` |
| `form.statusChanges` | Alan signal'larından `computed()` |
| `form.get('field')` | `form.fields.field` |
| `form.setValue()` | `form.patchValue()` |
| `form.patchValue()` | `form.patchValue()` |
| `form.reset()` | `form.reset()` |
| Özel Validator'lar | Zod şema iyileştirmeleri |

---

## Adım Adım Kılavuz

### Adım 1: ng-signalify'ı Yükleyin

```bash
npm install ng-signalify zod
# veya
pnpm add ng-signalify zod
```

### Adım 2: Alanları Tanımlayın

**Önce (Reactive Forms):**

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

**Sonra (ng-signalify):**

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
    new StringField('firstName', 'Ad', { 
      required: true, 
      min: 2 
    }),
    new StringField('lastName', 'Soyad', { 
      required: true, 
      min: 2 
    }),
    new StringField('email', 'E-posta Adresi', { 
      required: true, 
      email: true 
    }),
    new IntegerField('age', 'Yaş', { 
      required: true, 
      min: 18, 
      max: 120 
    }),
    new PasswordField('password', 'Şifre', { 
      required: true,
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true
    }),
    new BooleanField('acceptTerms', 'Şartları ve koşulları kabul ediyorum', { 
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

### Adım 3: Template'i Güncelleyin

**Önce (Reactive Forms):**

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- Ad -->
  <div class="form-field">
    <label for="firstName">Ad</label>
    <input 
      id="firstName" 
      type="text" 
      formControlName="firstName"
      class="form-control"
      [class.is-invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched">
    
    <div class="error" *ngIf="form.get('firstName')?.invalid && form.get('firstName')?.touched">
      <span *ngIf="form.get('firstName')?.errors?.['required']">
        Ad gereklidir
      </span>
      <span *ngIf="form.get('firstName')?.errors?.['minlength']">
        Minimum uzunluk 2 karakterdir
      </span>
    </div>
  </div>

  <!-- E-posta -->
  <div class="form-field">
    <label for="email">E-posta</label>
    <input 
      id="email" 
      type="email" 
      formControlName="email"
      class="form-control"
      [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched">
    
    <div class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
      <span *ngIf="form.get('email')?.errors?.['required']">
        E-posta gereklidir
      </span>
      <span *ngIf="form.get('email')?.errors?.['email']">
        Geçersiz e-posta formatı
      </span>
    </div>
  </div>

  <!-- Yaş -->
  <div class="form-field">
    <label for="age">Yaş</label>
    <input 
      id="age" 
      type="number" 
      formControlName="age"
      class="form-control"
      [class.is-invalid]="form.get('age')?.invalid && form.get('age')?.touched">
    
    <div class="error" *ngIf="form.get('age')?.invalid && form.get('age')?.touched">
      <span *ngIf="form.get('age')?.errors?.['required']">
        Yaş gereklidir
      </span>
      <span *ngIf="form.get('age')?.errors?.['min']">
        En az 18 yaşında olmalısınız
      </span>
      <span *ngIf="form.get('age')?.errors?.['max']">
        120 yaşından küçük olmalısınız
      </span>
    </div>
  </div>

  <!-- Gönder -->
  <button type="submit" [disabled]="form.invalid">
    Gönder
  </button>
</form>
```

**Sonra (ng-signalify ile Material):**

```html
<form (ngSubmit)="onSubmit()">
  <!-- Ad -->
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

  <!-- E-posta -->
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

  <!-- Yaş -->
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

  <!-- Gönder -->
  <button 
    mat-raised-button 
    color="primary" 
    type="submit" 
    [disabled]="!form.isValid()">
    Gönder
  </button>
</form>
```

**Önemli İyileştirmeler:**
- ✅ Manuel hata mesajı eşlemesi yok
- ✅ Alan doğrulamasından otomatik hata mesajları
- ✅ Signal tabanlı reaktivite
- ✅ Tip güvenli alan erişimi
- ✅ Daha az template kodu

---

## Yan Yana Karşılaştırmalar

### Doğrulayıcılarla Alan Tanımı

**Reactive Forms:**
```typescript
// Doğrulama ile string alanı
firstName: ['', [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(50)
]]

// E-posta alanı
email: ['', [
  Validators.required,
  Validators.email
]]

// Aralıklı sayı alanı
age: [null, [
  Validators.required,
  Validators.min(18),
  Validators.max(120)
]]

// Özel doğrulayıcı
password: ['', [
  Validators.required,
  Validators.minLength(8),
  this.customPasswordValidator
]]
```

**ng-signalify:**
```typescript
// Doğrulama ile string alanı
new StringField('firstName', 'Ad', {
  required: true,
  min: 2,
  max: 50
})

// E-posta alanı
new StringField('email', 'E-posta Adresi', {
  required: true,
  email: true
})

// Aralıklı sayı alanı
new IntegerField('age', 'Yaş', {
  required: true,
  min: 18,
  max: 120
})

// Yerleşik kurallarla şifre
new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
})
```

### Değer Al/Ayarla

**Reactive Forms:**
```typescript
// Tek değer al
const email = this.form.get('email')?.value;

// Tüm değerleri al
const formData = this.form.value;

// Tek değer ayarla
this.form.get('email')?.setValue('ahmet@example.com');

// Birden fazla değer ayarla
this.form.patchValue({
  firstName: 'Ahmet',
  lastName: 'Yılmaz'
});

// Formu sıfırla
this.form.reset();
```

**ng-signalify:**
```typescript
// Tek değer al (reaktif signal)
const email = this.form.getValue('email')();

// Tüm değerleri al
const formData = this.form.getRawValue();

// Tek değer ayarla
this.form.setValue('email', 'ahmet@example.com');

// Birden fazla değer ayarla
this.form.patchValue({
  firstName: 'Ahmet',
  lastName: 'Yılmaz'
});

// Formu sıfırla
this.form.reset();
```

### Geçerliliği Kontrol Et

**Reactive Forms:**
```typescript
// Form geçerli mi kontrol et
if (this.form.valid) {
  // Gönder
}

// Belirli alanı kontrol et
if (this.form.get('email')?.valid) {
  // ...
}

// Alanda hata var mı kontrol et
if (this.form.get('email')?.hasError('required')) {
  // ...
}

// Hataları al
const errors = this.form.get('email')?.errors;
// { required: true, email: true }
```

**ng-signalify:**
```typescript
// Form geçerli mi kontrol et (signal)
if (this.form.isValid()) {
  // Gönder
}

// Belirli alanı kontrol et (signal)
if (!this.form.fields.email.error()) {
  // Geçerli
}

// Hata mesajını al (signal)
const errorMsg = this.form.fields.email.error();
// "E-posta gereklidir" veya "Geçersiz e-posta formatı"

// Dokunulma durumunu kontrol et
if (this.form.fields.email.touched()) {
  // Hatayı göster
}
```

### Template'te Hata Mesajları

**Reactive Forms:**
```html
<!-- Manuel hata eşleme -->
<div *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
  <span *ngIf="form.get('email')?.hasError('required')">
    E-posta gereklidir
  </span>
  <span *ngIf="form.get('email')?.hasError('email')">
    Geçersiz e-posta formatı
  </span>
  <span *ngIf="form.get('email')?.hasError('minlength')">
    E-posta en az {{ form.get('email')?.errors?.['minlength']?.requiredLength }} karakter olmalıdır
  </span>
</div>
```

**ng-signalify:**
```html
<!-- Otomatik hata mesajı -->
@if (form.fields.email.error() && form.fields.email.touched()) {
  <mat-error>{{ form.fields.email.error() }}</mat-error>
}

<!-- Veya gerekirse özelleştir -->
@if (form.fields.email.error() && form.fields.email.touched()) {
  <div class="error-message">
    {{ form.fields.email.error() }}
  </div>
}
```

### Tüm Alanları Dokun

**Reactive Forms:**
```typescript
// Tüm alanları dokunulmuş olarak işaretle (doğrulama gösterimi için)
Object.keys(this.form.controls).forEach(key => {
  this.form.get(key)?.markAsTouched();
});

// Veya yardımcı kullanarak
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
// Tüm alanları dokun
this.form.touchAll();

// Bu kadar! İç içe alanları otomatik olarak işler
```

---

## Doğrulama Geçişi

### Yerleşik Doğrulayıcı Eşlemesi

| Reactive Forms | ng-signalify Alan Yapılandırması | Örnek |
|----------------|----------------------------------|-------|
| `Validators.required` | `{ required: true }` | `new StringField('name', 'Ad', { required: true })` |
| `Validators.email` | `{ email: true }` | `new StringField('email', 'E-posta', { email: true })` |
| `Validators.minLength(n)` | `{ min: n }` | `new StringField('name', 'Ad', { min: 2 })` |
| `Validators.maxLength(n)` | `{ max: n }` | `new StringField('name', 'Ad', { max: 50 })` |
| `Validators.min(n)` | `{ min: n }` | `new IntegerField('age', 'Yaş', { min: 18 })` |
| `Validators.max(n)` | `{ max: n }` | `new IntegerField('age', 'Yaş', { max: 120 })` |
| `Validators.pattern(/.../)` | `{ regex: /.../ }` | `new StringField('code', 'Kod', { regex: /^[A-Z]{3}$/ })` |
| `Validators.requiredTrue` | BooleanField'da `{ required: true }` | `new BooleanField('terms', 'Kabul Et', { required: true })` |

### Özel Doğrulayıcılar

**Reactive Forms:**
```typescript
// Özel doğrulayıcı fonksiyonu
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  
  if (password?.value !== confirm?.value) {
    return { passwordMismatch: true };
  }
  
  return null;
}

// Kullanım
this.form = this.fb.group({
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required]
}, { validators: passwordMatchValidator });
```

**ng-signalify:**
```typescript
import { z } from 'zod';

// Seçenek 1: Zod iyileştirmesi kullan
const fields = [
  new PasswordField('password', 'Şifre', { 
    required: true, 
    minLength: 8 
  }),
  new PasswordField('confirmPassword', 'Şifre Onayı', { 
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
      message: "Şifreler eşleşmiyor",
      path: ['confirmPassword']
    }
  )
});

// Seçenek 2: Doğrulama ile özel alan
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
        // Form bağlamı üzerinden şifre alanı değerine eriş
        const passwordValue = this.getPasswordValue();
        return value === passwordValue;
      },
      { message: "Şifreler eşleşmiyor" }
    );
  }
}
```

### Async Doğrulayıcılar

**Reactive Forms:**
```typescript
// Async doğrulayıcı (örn., kullanıcı adı müsaitliğini kontrol et)
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

// Kullanım
username: ['', 
  [Validators.required], 
  [usernameValidator(this.userService)]
]
```

**ng-signalify:**
```typescript
// Zod ile async doğrulama
class UsernameField extends StringField {
  constructor(
    private userService: UserService
  ) {
    super('username', 'Kullanıcı Adı', { required: true });
  }

  override schema(): z.ZodType<string> {
    return z.string()
      .min(1, 'Kullanıcı adı gereklidir')
      .refine(
        async (value) => {
          const isTaken = await this.userService.checkUsername(value);
          return !isTaken;
        },
        { message: 'Kullanıcı adı zaten alınmış' }
      );
  }
}
```

---

## Yaygın Desenler

### FormArray vs ArrayField

**Reactive Forms (FormArray):**
```typescript
// Bileşen
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
    <input formControlName="product" placeholder="Ürün">
    <input formControlName="quantity" type="number" placeholder="Adet">
    <input formControlName="price" type="number" placeholder="Fiyat">
    <button (click)="removeLineItem(i)">Kaldır</button>
  </div>
</div>
<button (click)="addLineItem()">Ürün Ekle</button>
```

**ng-signalify (ArrayField):**
```typescript
// Bileşen
export class OrderFormComponent {
  private lineItemFields = [
    new StringField('product', 'Ürün', { required: true }),
    new IntegerField('quantity', 'Adet', { required: true, min: 1 }),
    new DecimalField('price', 'Fiyat', { required: true, min: 0, scale: 2 })
  ];

  private fields = [
    new StringField('customerName', 'Müşteri Adı', { required: true }),
    new ArrayField('lineItems', 'Ürünler', this.lineItemFields, {
      min: 1,
      addLabel: 'Ürün Ekle',
      removeLabel: 'Kaldır'
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
      placeholder="Ürün">
    
    <input 
      type="number"
      [value]="item.getValue('quantity')()" 
      (input)="item.setValue('quantity', +$any($event.target).value)"
      placeholder="Adet">
    
    <input 
      type="number"
      [value]="item.getValue('price')()" 
      (input)="item.setValue('price', +$any($event.target).value)"
      placeholder="Fiyat">
    
    <button (click)="removeItem(item.id)">Kaldır</button>
  </div>
}

<button (click)="addItem()">Ürün Ekle</button>
```

### İç İçe Formlar

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

// İç içe değere eriş
const city = this.form.get('address.city')?.value;
```

**ng-signalify:**
```typescript
// Seçenek 1: Ön eklerle düz yapı
const fields = [
  new StringField('name', 'Ad', { required: true }),
  new StringField('address_street', 'Sokak', { required: true }),
  new StringField('address_city', 'Şehir', { required: true }),
  new StringField('address_zipCode', 'Posta Kodu', { 
    required: true, 
    regex: /^\d{5}$/ 
  }),
  new StringField('contact_email', 'E-posta', { required: true, email: true }),
  new StringField('contact_phone', 'Telefon', { required: true })
];

const form = createEnhancedForm(fields);

// Değere eriş
const city = form.getValue('address_city')();

// Seçenek 2: Karmaşık nesneler için JsonField kullan
const fields = [
  new StringField('name', 'Ad', { required: true }),
  new JsonField('address', 'Adres', {
    schema: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      zipCode: z.string().regex(/^\d{5}$/)
    })
  }),
  new JsonField('contact', 'İletişim', {
    schema: z.object({
      email: z.string().email(),
      phone: z.string().min(1)
    })
  })
];
```

### Dinamik Formlar

**Reactive Forms:**
```typescript
// Kontrolü dinamik olarak ekle
this.form.addControl('newField', new FormControl('', Validators.required));

// Kontrolü kaldır
this.form.removeControl('newField');

// Etkinleştir/devre dışı bırak
this.form.get('email')?.disable();
this.form.get('email')?.enable();
```

**ng-signalify:**
```typescript
// Alanlar önceden tanımlanır, ancak koşullu gösterilebilir
const allFields = [
  new StringField('email', 'E-posta', { required: true, email: true }),
  new StringField('phone', 'Telefon', { required: false }),
  new StringField('fax', 'Faks', { required: false })
];

// Koşula göre göster/gizle
const showPhone = signal(false);
const showFax = signal(false);

const activeFields = computed(() => {
  const fields = [allFields[0]]; // E-posta her zaman gösterilir
  if (showPhone()) fields.push(allFields[1]);
  if (showFax()) fields.push(allFields[2]);
  return fields;
});

// Alanlar değiştiğinde formu yeniden oluştur
effect(() => {
  const form = createEnhancedForm(activeFields());
  // ...
});

// Veya devre dışı durumu kullan
form.fields.phone.config.disabled = true;
```

---

## En İyi Uygulamalar

### 1. Alan Tanımlarını Ayırın

**Yapın:**
```typescript
// fields/user-fields.ts
export const userFields = {
  email: new StringField('email', 'E-posta Adresi', { 
    required: true, 
    email: true 
  }),
  password: new PasswordField('password', 'Şifre', { 
    required: true,
    minLength: 8 
  }),
  // ... daha fazla alan
};

// registration.component.ts
import { userFields } from './fields/user-fields';

const form = createEnhancedForm([
  userFields.email,
  userFields.password
]);
```

**Yapmayın:**
```typescript
// Alanları bileşende satır içi tanımlama
const form = createEnhancedForm([
  new StringField('email', 'E-posta', { required: true, email: true }),
  // Birden fazla bileşende tekrarlanır
]);
```

### 2. Uygun Alan Tiplerini Kullanın

**Yapın:**
```typescript
// Özel alan tipleri
new StringField('email', 'E-posta', { email: true })  // Veya EmailField
new PasswordField('password', 'Şifre')
new IntegerField('age', 'Yaş')
new DecimalField('price', 'Fiyat', { scale: 2, currency: 'TRY' })
new DateField('birthdate', 'Doğum Tarihi')
new EnumField('status', 'Durum', statusOptions)
```

**Yapmayın:**
```typescript
// Her şey için genel StringField kullanma
new StringField('price', 'Fiyat')      // DecimalField olmalı
new StringField('age', 'Yaş')          // IntegerField olmalı
new StringField('date', 'Tarih')       // DateField olmalı
```

### 3. Açık Etiketler ve İpuçları Sağlayın

**Yapın:**
```typescript
new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 12,
  hint: 'Büyük harf, küçük harf, sayı ve özel karakter içermelidir',
  placeholder: 'Güçlü bir şifre girin'
})
```

**Yapmayın:**
```typescript
new PasswordField('pwd', 'pwd', { required: true })
```

### 4. Türetilmiş Durum için Computed Signals Kullanın

**Yapın:**
```typescript
export class CheckoutComponent {
  form = createEnhancedForm(this.fields);
  
  // Hesaplanan toplam
  total = computed(() => {
    const subtotal = this.form.getValue('subtotal')();
    const tax = this.form.getValue('tax')();
    return subtotal + tax;
  });
  
  // Hesaplanan doğrulama durumu
  canSubmit = computed(() => 
    this.form.isValid() && this.total() > 0
  );
}
```

**Yapmayın:**
```typescript
// Her erişimde yeniden hesaplama
get total() {
  return this.form.getValue('subtotal')() + this.form.getValue('tax')();
}
```

### 5. Hataları İyi Yönetin

**Yapın:**
```typescript
async onSubmit() {
  if (!this.form.isValid()) {
    this.form.touchAll(); // Tüm hataları göster
    this.toast.warning('Lütfen form hatalarını düzeltin');
    return;
  }
  
  try {
    const data = this.form.getRawValue();
    await this.userService.create(data);
    this.toast.success('Kullanıcı başarıyla oluşturuldu');
    this.router.navigate(['/users']);
  } catch (error) {
    this.toast.error('Kullanıcı oluşturulamadı');
    console.error(error);
  }
}
```

**Yapmayın:**
```typescript
// Doğrulama kontrolü yok, sessiz hatalar
async onSubmit() {
  const data = this.form.getRawValue();
  await this.userService.create(data);
}
```

### 6. Alan Tanımlarını Yeniden Kullanın

**Yapın:**
```typescript
// Paylaşılan alan tanımları
export const addressFields = [
  new StringField('street', 'Sokak Adresi', { required: true }),
  new StringField('city', 'Şehir', { required: true }),
  new StringField('state', 'İl', { required: true }),
  new StringField('zipCode', 'Posta Kodu', { required: true, regex: /^\d{5}$/ })
];

// Birden fazla formda kullan
const billingForm = createEnhancedForm([
  ...addressFields,
  new StringField('cardNumber', 'Kart Numarası', { required: true })
]);

const shippingForm = createEnhancedForm(addressFields);
```

**Yapmayın:**
```typescript
// Yinelenen alan tanımları
const billingForm = createEnhancedForm([
  new StringField('street', 'Sokak', { required: true }),
  new StringField('city', 'Şehir', { required: true }),
  // ...
]);

const shippingForm = createEnhancedForm([
  new StringField('street', 'Sokak', { required: true }), // Tekrarlanmış!
  new StringField('city', 'Şehir', { required: true }),
  // ...
]);
```

---

## Özet

### Geçiş Kontrol Listesi

- [ ] ng-signalify ve zod'u yükle
- [ ] Field sınıflarını kullanarak alanları tanımla
- [ ] createEnhancedForm() ile form oluştur
- [ ] Template'i signal'ları kullanacak şekilde güncelle
- [ ] Doğrulayıcıları alan yapılandırmasına veya Zod şemalarına taşı
- [ ] Hata yönetimini güncelle
- [ ] Form doğrulamasını test et
- [ ] Form gönderimini test et
- [ ] ReactiveFormsModule bağımlılıklarını kaldır (tamamen taşındıysa)

### Önemli Çıkarımlar

1. **Signal Tabanlı:** Varsayılan olarak reaktif, RxJS gerekmez
2. **Tip Güvenli:** Tam TypeScript çıkarımı
3. **Daha Az Kod:** Form kurulum kodunda ~%50 azalma
4. **Daha İyi Doğrulama:** Otomatik hata mesajlarıyla Zod destekli
5. **Yeniden Kullanılabilir:** Alanları bir kez tanımla, her yerde kullan

### Sonraki Adımlar

- [Alan Tipleri Dokümantasyonu](fields.md)'nu okuyun
- [Formlar ve Şemalar Kılavuzu](../DOCUMENTATION.md#schemas-form--filter)'na göz atın
- [Örnek Uygulamalar](../apps/demo-material/)'ı keşfedin
- [GitHub Tartışmalar](https://github.com/biyonik/ng-signalify/discussions)'a katılın

---

## İlgili Dokümantasyon

- [Alan Tipleri](fields.md)
- [NgRx Geçişi](migration-ngrx.md)
- [Ana Dokümantasyon](../DOCUMENTATION.md)
- [README](../README.md)

---

<div align="center">

**Formlarınızı modernleştirmeye hazır mısınız?**

[⭐ GitHub'da Yıldızla](https://github.com/biyonik/ng-signalify) | [📖 Tam Dokümantasyon](../DOCUMENTATION.md) | [🚀 Hızlı Başlangıç](../README.md#quick-start)

</div>
