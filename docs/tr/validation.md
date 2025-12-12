# Validasyon Kılavuzu

> **🇬🇧 For English version:** [docs/validation.md](../validation.md)

## İçindekiler

- [Yerleşik Validasyon Kuralları](#yerleşik-validasyon-kuralları)
- [Alan Seviyesi Validasyon](#alan-seviyesi-validasyon)
- [Form Seviyesi Validasyon](#form-seviyesi-validasyon)
- [Özel Validatörler](#özel-validatörler)
- [Asenkron Validatörler](#asenkron-validatörler)
- [Validasyon Mesajları](#validasyon-mesajları)
- [Koşullu Validasyon](#koşullu-validasyon)
- [Çapraz Alan Validasyonu](#çapraz-alan-validasyonu)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

---

## Yerleşik Validasyon Kuralları

ng-signalify, Zod şemalarını kullanarak tüm alan tipleri için kapsamlı yerleşik validasyon sağlar.

### StringField

```typescript
import { StringField } from 'ng-signalify/fields';

const nameField = new StringField('name', 'Tam Ad', {
  required: true,           // Alan bir değere sahip olmalıdır
  min: 3,                   // Minimum uzunluk
  max: 100,                 // Maksimum uzunluk
  pattern: /^[A-Za-zğüşöçİĞÜŞÖÇ\s]+$/, // Regex deseni (sadece harfler ve boşluklar)
  trim: true                // Otomatik olarak boşlukları kırp
});
```

**Validasyon kuralları:**
- `required` - Alan boş olamaz
- `min` - Minimum string uzunluğu
- `max` - Maksimum string uzunluğu
- `pattern` - Düzenli ifade deseni
- `trim` - Başta ve sondaki boşlukları kaldır

### NumberField

```typescript
import { NumberField } from 'ng-signalify/fields';

const ageField = new NumberField('age', 'Yaş', {
  required: true,    // Alan bir değere sahip olmalıdır
  min: 18,          // Minimum değer
  max: 120,         // Maksimum değer
  step: 1,          // Değer artışı (örn. kaydırıcılar için)
  integer: true     // Tam sayı olmalıdır (ondalık yok)
});
```

**Validasyon kuralları:**
- `required` - Alan null olamaz
- `min` - Minimum sayısal değer
- `max` - Maksimum sayısal değer
- `step` - Değer step'in katı olmalıdır
- `integer` - Tam sayı olmalıdır

### EmailField

```typescript
import { EmailField } from 'ng-signalify/fields';

const emailField = new EmailField('email', 'E-posta Adresi', {
  required: true  // Alan geçerli bir e-posta içermelidir
});
```

**Validasyon kuralları:**
- `required` - Alan boş olamaz
- E-posta format validasyonu (yerleşik)

### DateField

```typescript
import { DateField } from 'ng-signalify/fields';

const birthdateField = new DateField('birthdate', 'Doğum Tarihi', {
  required: true,
  min: new Date('1900-01-01'),  // Minimum tarih
  max: new Date()               // Maksimum tarih (bugün)
});
```

**Validasyon kuralları:**
- `required` - Alan bir tarihe sahip olmalıdır
- `min` - İzin verilen minimum tarih
- `max` - İzin verilen maksimum tarih

### SelectField

```typescript
import { SelectField } from 'ng-signalify/fields';

const roleField = new SelectField('role', 'Kullanıcı Rolü', {
  required: true,
  choices: [
    { value: 'admin', label: 'Yönetici' },
    { value: 'user', label: 'Normal Kullanıcı' },
    { value: 'guest', label: 'Misafir' }
  ]
});
```

**Validasyon kuralları:**
- `required` - Bir seçim yapılmalıdır
- Değer geçerli seçeneklerden biri olmalıdır

### BooleanField

```typescript
import { BooleanField } from 'ng-signalify/fields';

const termsField = new BooleanField('terms', 'Şartları Kabul Et', {
  required: true  // true olmalıdır (onay kutusu işaretlenmeli)
});
```

**Validasyon kuralları:**
- `required` - `true` olmalıdır (şartlar kabulü gibi gerekli onay kutuları için kullanışlıdır)

### ArrayField

```typescript
import { ArrayField, StringField } from 'ng-signalify/fields';

const tagsField = new ArrayField('tags', 'Etiketler', {
  required: true,
  min: 1,          // Minimum dizi uzunluğu
  max: 5,          // Maksimum dizi uzunluğu
  itemField: new StringField('tag', 'Etiket', { min: 2, max: 20 })
});
```

**Validasyon kuralları:**
- `required` - Dizi boş olamaz
- `min` - Minimum öğe sayısı
- `max` - Maksimum öğe sayısı
- `itemField` - Dizideki her öğe için validasyon

---

## Alan Seviyesi Validasyon

Her alan, otomatik olarak güncellenen reaktif validasyon sinyallerine sahiptir.

### Geçerliliği Kontrol Et

```typescript
const emailField = new EmailField('email', 'E-posta', { required: true });

// Alanın geçerli olup olmadığını kontrol et
if (emailField.isValid()) {
  console.log('E-posta geçerli');
} else {
  console.log('E-posta geçersiz');
}
```

### Hata Mesajını Al

```typescript
const nameField = new StringField('name', 'Ad', { 
  required: true, 
  min: 3 
});

nameField.setValue('ab');  // Çok kısa

// Hata mesajını al
const error = nameField.error();
console.log(error);  // "String must contain at least 3 character(s)"
```

### Template Kullanımı

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
  nameField = new StringField('name', 'Tam Ad', {
    required: true,
    min: 3,
    max: 50
  });
}
```

---

## Form Seviyesi Validasyon

Birden fazla alanı birlikte doğrulayın.

### Form Geçerliliğini Kontrol Et

```typescript
import { Component } from '@angular/core';
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-register',
  template: `
    <form (submit)="onSubmit()">
      <!-- alanlar burada -->
      <button [disabled]="!isFormValid()">Gönder</button>
    </form>
  `
})
export class RegisterComponent {
  nameField = new StringField('name', 'Ad', { required: true });
  emailField = new EmailField('email', 'E-posta', { required: true });
  passwordField = new PasswordField('password', 'Şifre', { 
    required: true, 
    min: 8 
  });

  isFormValid(): boolean {
    return this.nameField.isValid() && 
           this.emailField.isValid() && 
           this.passwordField.isValid();
  }

  onSubmit() {
    // Hataları göstermek için tüm alanları touch et
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

    console.log('Form gönderildi:', formData);
  }
}
```

### Tüm Değerleri Al

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

## Özel Validatörler

Özelleştirilmiş validasyon mantığı ile özel alan tipleri oluşturun.

### Alan Sınıfını Genişlet

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';

export class PhoneField extends StringField {
  override schema(): z.ZodString {
    let schema = super.schema();

    // Özel telefon validasyonu ekle
    schema = schema.regex(
      /^\+?[1-9]\d{1,14}$/,
      'Geçersiz telefon numarası formatı'
    );

    return schema;
  }
}
```

### Kullanım

```typescript
const phoneField = new PhoneField('phone', 'Telefon Numarası', {
  required: true
});

phoneField.setValue('+1234567890');
console.log(phoneField.isValid());  // true

phoneField.setValue('geçersiz');
console.log(phoneField.error());  // "Geçersiz telefon numarası formatı"
```

### Karmaşık Özel Validatör

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';

export class UsernameField extends StringField {
  override schema(): z.ZodString {
    let schema = super.schema();

    // Özel validasyon kuralları
    schema = schema
      .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
      .max(20, 'Kullanıcı adı en fazla 20 karakter olmalıdır')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
      )
      .refine(
        (val) => !val.startsWith('_'),
        'Kullanıcı adı alt çizgi ile başlayamaz'
      )
      .refine(
        (val) => !val.endsWith('_'),
        'Kullanıcı adı alt çizgi ile bitemez'
      );

    return schema;
  }
}
```

---

## Asenkron Validatörler

Harici veri kaynaklarına karşı doğrulama yapın (örn. kullanıcı adının müsait olup olmadığını kontrol edin).

### Asenkron Validatör Alanı Oluştur

```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class UsernameField extends StringField {
  private http = inject(HttpClient);

  override schema(): z.ZodString {
    let schema = super.schema();

    // Önce senkron validasyon
    schema = schema
      .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
      .max(20, 'Kullanıcı adı en fazla 20 karakter olmalıdır');

    return schema;
  }

  // Asenkron validasyon
  async asyncValidate(value: string): Promise<string | null> {
    // Sadece senkron validasyon geçerse doğrula
    const syncResult = this.schema().safeParse(value);
    if (!syncResult.success) {
      return null; // Senkron hatalar gösterilecek
    }

    try {
      const response = await this.http
        .get<{ available: boolean }>(`/api/check-username/${value}`)
        .toPromise();

      if (!response?.available) {
        return 'Kullanıcı adı zaten alınmış';
      }

      return null; // Geçerli
    } catch (error) {
      return 'Kullanıcı adı doğrulanamadı';
    }
  }
}
```

### Bileşende Kullanım

```typescript
@Component({
  selector: 'app-register',
  template: `
    <input 
      [value]="usernameField.value()"
      (input)="usernameField.setValue($event.target.value)"
      (blur)="checkUsername()" />
    
    @if (checking) {
      <span class="checking">Müsaitlik kontrol ediliyor...</span>
    }
    
    @if (usernameField.error()) {
      <span class="error">{{ usernameField.error() }}</span>
    }
  `
})
export class RegisterComponent {
  usernameField = new UsernameField('username', 'Kullanıcı Adı', {
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
      // Özel hata ayarla
      console.error(error);
    }
  }
}
```

---

## Validasyon Mesajları

### Yerleşik Hata Mesajları

ng-signalify, Zod'un varsayılan hata mesajlarını kullanır:

| Validasyon | Varsayılan Mesaj |
|------------|------------------|
| Zorunlu string | "Required" |
| Minimum uzunluk | "String must contain at least X character(s)" |
| Maksimum uzunluk | "String must contain at most X character(s)" |
| Geçersiz e-posta | "Invalid email" |
| Sayı çok küçük | "Number must be greater than or equal to X" |
| Sayı çok büyük | "Number must be less than or equal to X" |

### Template'te Göster

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
  emailField = new EmailField('email', 'E-posta', { required: true });
}
```

---

## Koşullu Validasyon

Diğer alan değerlerine göre validasyonu etkinleştirin veya devre dışı bırakın.

### Angular Effect'leri Kullanma

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
      Fatura adresi teslimat adresi ile aynı
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
  sameAsShippingField = new BooleanField('sameAsShipping', 'Aynı Adres', {});
  
  billingAddressField = new StringField('billingAddress', 'Fatura Adresi', {
    required: false  // Başlangıçta opsiyonel
  });

  constructor() {
    // Onay kutusuna göre fatura adresi gerekliliğini güncelle
    effect(() => {
      const sameAsShipping = this.sameAsShippingField.value();
      
      // Yeni config ile alanı yeniden oluştur
      if (sameAsShipping) {
        this.billingAddressField = new StringField(
          'billingAddress', 
          'Fatura Adresi', 
          { required: false }
        );
      } else {
        this.billingAddressField = new StringField(
          'billingAddress', 
          'Fatura Adresi', 
          { required: true }
        );
      }
    });
  }
}
```

---

## Çapraz Alan Validasyonu

Bir alanı başka bir alanın değerine göre doğrulayın.

### Şifre Onayı Örneği

```typescript
import { Component, computed } from '@angular/core';
import { PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-password-form',
  template: `
    <div>
      <label>Şifre</label>
      <input 
        type="password"
        [value]="passwordField.value()"
        (input)="passwordField.setValue($event.target.value)" />
    </div>

    <div>
      <label>Şifreyi Onayla</label>
      <input 
        type="password"
        [value]="confirmPasswordField.value()"
        (input)="confirmPasswordField.setValue($event.target.value)"
        (blur)="confirmPasswordField.touch()" />
      
      @if (confirmPasswordField.touched() && passwordMismatch()) {
        <span class="error">Şifreler eşleşmiyor</span>
      }
    </div>
  `
})
export class PasswordFormComponent {
  passwordField = new PasswordField('password', 'Şifre', {
    required: true,
    min: 8
  });

  confirmPasswordField = new PasswordField('confirmPassword', 'Şifreyi Onayla', {
    required: true
  });

  // Şifre eşleşmesi için computed signal
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

## En İyi Uygulamalar

### 1. Özel Alan Tiplerini Kullanın

```typescript
// ❌ E-posta için genel StringField kullanmayın
const email = new StringField('email', 'E-posta', { required: true });

// ✅ Otomatik e-posta validasyonu için EmailField kullanın
const email = new EmailField('email', 'E-posta', { required: true });
```

### 2. Blur Üzerinde Doğrulama Yapın

```typescript
// Kullanıcı alanı terk ettikten sonra hataları göster
<input 
  [value]="field.value()"
  (input)="field.setValue($event.target.value)"
  (blur)="field.touch()" />

@if (field.touched() && field.error()) {
  <span class="error">{{ field.error() }}</span>
}
```

### 3. Gönderimde Tüm Alanları Touch Edin

```typescript
onSubmit() {
  // Validasyon hatalarını göstermek için tüm alanları touch edin
  this.nameField.touch();
  this.emailField.touch();
  this.passwordField.touch();

  if (!this.isFormValid()) {
    return; // Geçersizse gönderme
  }

  // Form gönderimi ile devam et
}
```

### 4. Yardımcı Hata Mesajları Sağlayın

```typescript
// Net, uygulanabilir hata mesajları kullanın
const username = new UsernameField('username', 'Kullanıcı Adı', {
  required: true
});
// Hata: "Kullanıcı adı en az 3 karakter olmalıdır"
// Daha iyi: "Geçersiz giriş" yerine
```

### 5. Senkron ve Asenkron Validasyonu Ayırın

```typescript
// Önce senkron validasyon (hızlı)
schema = schema.min(3).max(20);

// Asenkron validasyon sadece senkron geçtikten sonra (yavaş)
async asyncValidate(value: string) {
  const syncResult = this.schema().safeParse(value);
  if (!syncResult.success) return null;
  
  // Sadece senkron validasyon geçtiyse API'yi kontrol et
  return await this.checkAvailability(value);
}
```

---

## İlgili Dokümantasyon

- [Alan Tipleri](fields.md) - Tüm mevcut alan tipleri
- [Kurulum](installation.md) - Başlangıç
- [Örnekler](examples.md) - Gerçek dünya validasyon örnekleri
- [Store](store.md) - Store'larda entity validasyonu

---

**ng-signalify ile validasyonda ustalaşın! ✅**
