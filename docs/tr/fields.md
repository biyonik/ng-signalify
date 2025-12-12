# Alan Tipleri Dokümantasyonu

> **🇬🇧 For English version:** [docs/fields.md](../fields.md)

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Alan Hiyerarşisi](#alan-hiyerarşisi)
- [Ortak Yapılandırma](#ortak-yapılandırma)
- [Alan Tipleri](#alan-tipleri)
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
- [Özel Alanlar](#özel-alanlar)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)
- [İlgili Dokümantasyon](#i̇lgili-dokümantasyon)

---

## Genel Bakış

### Alanlar Nedir?

Alanlar, ng-signalify'ın form sisteminin temelidir. Bunlar aşağıdakileri kapsayan **tip güvenli, yeniden kullanılabilir tanımlardır**:

- ✅ **Veri Tipi** - Değerin TypeScript tipi
- ✅ **Doğrulama Kuralları** - Zod şemaları kullanarak
- ✅ **UI Metadata** - Etiketler, ipuçları, yer tutucular
- ✅ **Veri Dönüşümü** - Import/Export mantığı
- ✅ **Reaktif Durum** - Signal tabanlı değer yönetimi

### Neden Alan Kullanmalıyız?

Geleneksel Angular formları her input için manuel kurulum gerektirir:
```typescript
// ❌ Geleneksel yaklaşım - tekrarlayan, hataya açık
this.form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  age: new FormControl(null, [Validators.required, Validators.min(18)])
});
```

ng-signalify alanları ile:
```typescript
// ✅ Bildirimsel, tip güvenli, yeniden kullanılabilir
const fields = [
  new StringField('email', 'E-posta Adresi', { 
    required: true, 
    email: true 
  }),
  new IntegerField('age', 'Yaş', { 
    required: true, 
    min: 18 
  })
];
```

### Faydaları

| Özellik | Açıklama |
|---------|----------|
| 🎯 **Tip Güvenliği** | Form yaşam döngüsü boyunca tam TypeScript çıkarımı |
| 🔄 **Yeniden Kullanılabilirlik** | Bir kez tanımlayın, birden fazla formda kullanın |
| ✅ **Yerleşik Doğrulama** | Zod tarafından desteklenir, özel hata mesajları ile |
| 🌐 **Import/Export** | API'ler ve dosyalar için otomatik veri dönüşümü |
| 📦 **Endişelerin Ayrılması** | İş mantığı UI bileşenlerinden ayrılmış |
| 🧪 **Test Edilebilirlik** | Bileşenleri render etmeden birim test yapmak kolay |

---

## Alan Hiyerarşisi

Tüm alan tipleri `BaseField`'den türer ve `IField` arayüzünü uygular:

```
BaseField<T>
├── StringField
│   ├── PasswordField (StringField'den türer)
│   └── TextAreaField (StringField'den türer)
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

## Ortak Yapılandırma

Tüm alanlar `FieldConfig` arayüzü aracılığıyla şu yapılandırma seçeneklerini paylaşır:

| Seçenek | Tip | Açıklama | Varsayılan |
|---------|-----|----------|------------|
| `required` | `boolean` | Alanı zorunlu yapar | `false` |
| `disabled` | `boolean` | Kullanıcı girişini devre dışı bırakır (UI seviyesi) | `false` |
| `readonly` | `boolean` | Alanı salt okunur yapar (UI seviyesi) | `false` |
| `hint` | `string` | Alanın altında gösterilen yardımcı metin | - |
| `placeholder` | `string` | Alan boşken gösterilen yer tutucu metin | - |

**Örnek:**
```typescript
new StringField('username', 'Kullanıcı Adı', {
  required: true,
  hint: 'Sistem genelinde benzersiz olmalıdır',
  placeholder: 'Kullanıcı adınızı girin'
});
```

---

## Alan Tipleri

### StringField

**Amaç:** Tek satırlı metinler için metin girişi.

#### Yapılandırma Seçenekleri

```typescript
interface StringFieldConfig extends FieldConfig {
  min?: number;        // Minimum karakter uzunluğu
  max?: number;        // Maksimum karakter uzunluğu
  email?: boolean;     // E-posta adresi olarak doğrula
  url?: boolean;       // URL olarak doğrula
  regex?: RegExp;      // Özel desen doğrulaması
}
```

#### Doğrulama Kuralları

- Uzunluk kısıtlamaları (`min`, `max`)
- E-posta formatı doğrulaması
- URL formatı doğrulaması
- Özel regex desenleri

#### TypeScript Örneği

```typescript
import { StringField } from 'ng-signalify/fields';

// Temel metin alanı
const nameField = new StringField('name', 'Ad Soyad', {
  required: true,
  min: 2,
  max: 100,
  hint: 'Tam yasal adınızı girin'
});

// Regex doğrulaması ile alan
const codeField = new StringField('productCode', 'Ürün Kodu', {
  required: true,
  regex: /^[A-Z]{3}-\d{4}$/,
  placeholder: 'ABC-1234'
});
```

#### Formda Kullanım

```typescript
import { createEnhancedForm } from 'ng-signalify/schemas';

const fields = [
  new StringField('firstName', 'Ad', { required: true, min: 2 }),
  new StringField('lastName', 'Soyad', { required: true, min: 2 })
];

const form = createEnhancedForm(fields);

// Reaktif değere erişim
console.log(form.getValue('firstName')); // Signal<string>

// Değer ayarlama
form.patchValue({ firstName: 'Ahmet' });
```

---

### NumberField

ng-signalify iki sayı alanı tipi sağlar:

#### IntegerField

**Amaç:** Ondalık basamak olmadan tam sayıları (integer) yönetir.

##### Yapılandırma Seçenekleri

```typescript
interface IntegerFieldConfig extends FieldConfig {
  min?: number;    // Minimum değer
  max?: number;    // Maksimum değer
}
```

##### Örnek

```typescript
import { IntegerField } from 'ng-signalify/fields';

const ageField = new IntegerField('age', 'Yaş', {
  required: true,
  min: 18,
  max: 120,
  hint: '18 veya daha büyük olmalı'
});

const quantityField = new IntegerField('quantity', 'Miktar', {
  required: true,
  min: 1,
  max: 999
});
```

#### DecimalField

**Amaç:** Hassasiyet kontrolü ve para birimi formatlaması ile ondalık sayıları yönetir.

##### Yapılandırma Seçenekleri

```typescript
interface DecimalFieldConfig extends FieldConfig {
  min?: number;        // Minimum değer
  max?: number;        // Maksimum değer
  scale?: number;      // Ondalık basamaklar (varsayılan: 2)
  currency?: string;   // Para birimi kodu (örn. 'TRY', 'USD', 'EUR')
  locale?: string;     // Formatlama için yerel ayar (varsayılan: 'tr-TR')
}
```

##### Örnek

```typescript
import { DecimalField } from 'ng-signalify/fields';

const priceField = new DecimalField('price', 'Fiyat', {
  required: true,
  min: 0,
  scale: 2,
  currency: 'TRY'
});

const weightField = new DecimalField('weight', 'Ağırlık (kg)', {
  required: true,
  min: 0.1,
  max: 1000,
  scale: 3
});
```

##### Formatlama

Alan, yerel ayar ve para birimine göre sayıları otomatik olarak formatlar:

```typescript
// Para birimi ile
priceField.present(1234.56); // "₺1.234,56" (TRY, tr-TR locale)

// Para birimi olmadan
weightField.present(42.123); // "42,123"
```

---

### EmailField

**Amaç:** Yerleşik e-posta doğrulaması olan string alanı.

EmailField, otomatik e-posta doğrulaması olan özelleştirilmiş bir StringField'dir. Bir kolaylık sarmalayıcısıdır.

#### Örnek

```typescript
import { StringField } from 'ng-signalify/fields';

// Seçenek 1: E-posta bayrağı ile StringField kullanma
const emailField = new StringField('email', 'E-posta Adresi', {
  required: true,
  email: true,
  placeholder: 'kullanici@ornek.com'
});

// Seçenek 2: Regex ile özel e-posta doğrulaması
const customEmailField = new StringField('email', 'E-posta', {
  required: true,
  regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  max: 255
});
```

#### Doğrulama

- Zod aracılığıyla yerleşik e-posta formatı doğrulaması
- Geçerli e-posta yapısını kontrol eder
- İsteğe bağlı maksimum uzunluk kısıtlaması

---

### UrlField

**Amaç:** Yerleşik URL doğrulaması olan string alanı.

EmailField'e benzer şekilde, UrlField URL doğrulaması olan bir StringField'dir.

#### Örnek

```typescript
import { StringField } from 'ng-signalify/fields';

const websiteField = new StringField('website', 'Website URL', {
  required: true,
  url: true,
  placeholder: 'https://ornek.com'
});

const githubField = new StringField('github', 'GitHub Profili', {
  url: true,
  placeholder: 'https://github.com/kullaniciadi'
});
```

#### Doğrulama

- Protokol dahil URL formatını doğrular
- http, https ve diğer protokolleri kabul eder
- Uygun URL yapısını garanti eder

---

### PasswordField

**Amaç:** Güç doğrulaması ve karmaşıklık gereksinimleri ile güvenli şifre girişi.

#### Yapılandırma Seçenekleri

```typescript
interface PasswordFieldConfig extends FieldConfig {
  minLength?: number;           // Minimum uzunluk (varsayılan: 8)
  maxLength?: number;           // Maksimum uzunluk
  requireUppercase?: boolean;   // Büyük harf gereksinimi
  requireLowercase?: boolean;   // Küçük harf gereksinimi
  requireNumber?: boolean;      // Rakam gereksinimi
  requireSpecial?: boolean;     // Özel karakter gereksinimi
  showStrength?: boolean;       // Güç göstergesini göster
  confirmField?: string;        // Onaylama için alan adı
}
```

#### Güvenlik Özellikleri

- Gerçek şifre değerlerini **asla export etmez**
- UI'da **maskelenmiş görüntüleme** (••••••••)
- **Güç hesaplama** algoritması
- **Şifre oluşturma** yardımcı programı

#### Örnek

```typescript
import { PasswordField } from 'ng-signalify/fields';

const passwordField = new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  showStrength: true,
  hint: 'Karışık karakterlerle güçlü bir şifre kullanın'
});

// Onaylama alanı
const confirmField = new PasswordField('confirmPassword', 'Şifre Tekrar', {
  required: true,
  confirmField: 'password'
});
```

#### Şifre Gücü

```typescript
const strength = passwordField.calculateStrength('BenimŞ@fre123');
// {
//   score: 4,           // 0-4 ölçeği
//   label: 'Çok Güçlü',
//   color: 'green',
//   feedback: []
// }
```

#### Şifre Oluştur

```typescript
const strongPassword = passwordField.generateStrongPassword(16);
// Döner: "aK9#mP2$xL5@qR8!"
```

---

### DateField

**Amaç:** Min/max kısıtlamaları ve yerel ayar farkında formatlama ile tarih seçimi.

#### Yapılandırma Seçenekleri

```typescript
interface DateFieldConfig extends FieldConfig {
  min?: Date | string;  // En erken seçilebilir tarih
  max?: Date | string;  // En geç seçilebilir tarih
  format?: string;      // Görüntüleme formatı (varsayılan: 'dd.MM.yyyy')
  locale?: string;      // Yerel ayar (varsayılan: 'tr-TR')
}
```

#### Örnek

```typescript
import { DateField } from 'ng-signalify/fields';

const birthdateField = new DateField('birthdate', 'Doğum Tarihi', {
  required: true,
  max: new Date(), // Gelecekte olamaz
  hint: 'Doğum tarihinizi seçin'
});

const appointmentField = new DateField('appointment', 'Randevu Tarihi', {
  required: true,
  min: new Date(), // Geçmişte olamaz
  max: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // En fazla 90 gün ileri
});
```

#### Tarih Yardımcı Fonksiyonları

```typescript
// Tarihin bugün olup olmadığını kontrol et
birthdateField.isToday(new Date()); // false

// Tarihin geçmişte olup olmadığını kontrol et
birthdateField.isPast(new Date('2020-01-01')); // true

// Tarihin gelecekte olup olmadığını kontrol et
appointmentField.isFuture(new Date('2025-12-31')); // true
```

#### Excel Import Desteği

DateField, Excel tarih seri numaralarını otomatik olarak işler:

```typescript
const field = new DateField('date', 'Tarih');
const date = field.fromImport(44567); // Excel serisini JS Date'e dönüştürür
```

---

### SelectField

**Amaç:** Önceden tanımlanmış bir seçenek listesinden tek veya çoklu seçim.

ng-signalify'da SelectField, `EnumField` ve `MultiEnumField` olarak uygulanır.

#### Seçenek Arayüzü

```typescript
interface EnumOption {
  id: string | number;  // Veritabanında saklanan değer
  label: string;        // Kullanıcıya gösterilen metin
}
```

#### EnumField (Tek Seçim)

```typescript
import { EnumField } from 'ng-signalify/fields';

const statusField = new EnumField(
  'status',
  'Durum',
  [
    { id: 'draft', label: 'Taslak' },
    { id: 'published', label: 'Yayınlandı' },
    { id: 'archived', label: 'Arşivlendi' }
  ],
  { required: true }
);
```

#### MultiEnumField (Çoklu Seçim)

```typescript
import { MultiEnumField } from 'ng-signalify/fields';

const tagsField = new MultiEnumField(
  'tags',
  'Etiketler',
  [
    { id: 1, label: 'Teknoloji' },
    { id: 2, label: 'İş' },
    { id: 3, label: 'Tasarım' },
    { id: 4, label: 'Pazarlama' }
  ],
  { hint: 'Bir veya daha fazla etiket seçin' }
);
```

#### Akıllı Import Eşleştirme

EnumField, akıllı import eşleştirmesi sağlar:

```typescript
const field = new EnumField('color', 'Renk', [
  { id: 'red', label: 'Kırmızı' },
  { id: 'blue', label: 'Mavi' }
]);

// ID ile eşleşir
field.fromImport('red'); // 'red'

// Etiket ile eşleşir (büyük/küçük harf duyarsız)
field.fromImport('Kırmızı'); // 'red'
field.fromImport('  MAVİ  '); // 'blue'
```

---

### BooleanField

**Amaç:** Özelleştirilebilir etiketlerle doğru/yanlış değerleri.

#### Yapılandırma Seçenekleri

```typescript
interface BooleanFieldConfig extends FieldConfig {
  yesLabel?: string;  // Doğru için etiket (varsayılan: 'Evet')
  noLabel?: string;   // Yanlış için etiket (varsayılan: 'Hayır')
}
```

#### Örnek

```typescript
import { BooleanField } from 'ng-signalify/fields';

const activeField = new BooleanField('isActive', 'Aktif Durum', {
  yesLabel: 'Aktif',
  noLabel: 'Pasif'
});

const agreedField = new BooleanField('agreedToTerms', 'Şartlar ve Koşullar', {
  required: true, // Zorunlu checkbox deseni
  hint: 'Devam etmek için kabul etmelisiniz'
});
```

#### Esnek Import Eşleştirme

BooleanField, çeşitli formatları akıllıca dönüştürür:

```typescript
// String eşleştirme
field.fromImport('true');   // true
field.fromImport('evet');   // true
field.fromImport('1');      // true
field.fromImport('false');  // false
field.fromImport('hayır');  // false
field.fromImport('0');      // false

// Sayı eşleştirme
field.fromImport(1);        // true
field.fromImport(0);        // false
```

---

### ArrayField

**Amaç:** Tekrarlayan yapılandırılmış verilerin dinamik dizileri.

#### Yapılandırma Seçenekleri

```typescript
interface ArrayFieldConfig extends FieldConfig {
  min?: number;           // Minimum öğe sayısı
  max?: number;           // Maksimum öğe sayısı
  addLabel?: string;      // Özel "Ekle" butonu etiketi
  removeLabel?: string;   // Özel "Kaldır" butonu etiketi
  sortable?: boolean;     // Sürükle-bırak yeniden sıralamayı etkinleştir
}
```

#### Örnek

```typescript
import { ArrayField, StringField, DecimalField } from 'ng-signalify/fields';

// Her dizi öğesinin yapısını tanımla
const itemFields = [
  new StringField('name', 'Ürün Adı', { required: true }),
  new DecimalField('price', 'Fiyat', { required: true, min: 0 }),
  new IntegerField('quantity', 'Miktar', { required: true, min: 1 })
];

// Dizi alanı oluştur
const lineItemsField = new ArrayField(
  'lineItems',
  'Satır Kalemleri',
  itemFields,
  {
    min: 1,
    max: 50,
    addLabel: 'Kalem Ekle',
    sortable: true
  }
);
```

#### Dizi Durum Yönetimi

```typescript
// Dizi durumu oluştur
const arrayState = lineItemsField.createArrayState([
  { name: 'Ürün A', price: 10.99, quantity: 2 }
]);

// Öğe ekle
arrayState.add({ name: 'Ürün B', price: 15.99, quantity: 1 });

// ID ile öğe kaldır
arrayState.remove(itemId);

// Öğe taşı (yeniden sırala)
arrayState.move(0, 2); // İlk öğeyi 2. konuma taşı

// Değerlere erişim
console.log(arrayState.values()); // Signal<Array<Record<string, unknown>>>

// Eklenip/kaldırılabilir mi kontrol et
console.log(arrayState.canAdd());    // Signal<boolean>
console.log(arrayState.canRemove()); // Signal<boolean>
```

---

### ObjectField

**Amaç:** Doğrulama ile karmaşık iç içe nesne yapıları.

ng-signalify'da ObjectField, `JsonField` olarak uygulanır.

#### Yapılandırma Seçenekleri

```typescript
interface JsonFieldConfig extends FieldConfig {
  schema?: z.ZodType<unknown>;  // Yapı için özel Zod şeması
  prettyPrint?: boolean;         // Görüntülemede JSON'u güzel yazdır
  maxDisplayDepth?: number;      // Görüntüleme derinliğini sınırla
}
```

#### Örnek

```typescript
import { JsonField } from 'ng-signalify/fields';
import { z } from 'zod';

// Basit nesne alanı
const metadataField = new JsonField('metadata', 'Meta Veriler', {
  prettyPrint: true
});

// Özel şema doğrulaması ile
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().length(2)
});

const addressField = new JsonField('address', 'Adres', {
  schema: addressSchema,
  required: true
});
```

#### İç İçe Veri Erişimi

```typescript
// Karmaşık nesne ayarla
addressField.createValue({
  street: '123 Ana Cadde',
  city: 'İstanbul',
  zipCode: '34000',
  country: 'TR'
});

// Nokta notasyonu ile erişim (harici yardımcı program gerekli)
const city = get(addressField.value(), 'city'); // 'İstanbul'
```

---

## Özel Alanlar

`BaseField`'i genişleterek özel alan tipleri oluşturabilirsiniz.

### Telefon Numarası Alanı Örneği

```typescript
import { z } from 'zod';
import { BaseField } from 'ng-signalify/fields';
import { FieldConfig } from 'ng-signalify/fields';

interface PhoneFieldConfig extends FieldConfig {
  countryCode?: string;  // Varsayılan ülke kodu
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
      .regex(/^\+?[1-9]\d{1,14}$/, 'Geçersiz telefon numarası formatı');

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s;
  }

  override present(value: string | null): string {
    if (!value) return '-';
    
    // Görüntüleme için formatla
    if (this.config.format === 'international') {
      return `+${value}`;
    }
    
    // Ulusal format (örn. (555) 123-4567)
    return this.formatNational(value);
  }

  override fromImport(raw: unknown): string | null {
    if (raw == null || raw === '') return null;
    
    // Tüm sayısal olmayan karakterleri kaldır
    const cleaned = String(raw).replace(/\D/g, '');
    
    // Gerekirse ülke kodu ekle
    if (this.config.countryCode && !cleaned.startsWith(this.config.countryCode)) {
      return this.config.countryCode + cleaned;
    }
    
    return cleaned;
  }

  private formatNational(phone: string): string {
    // Formatlama mantığınızı uygulayın
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }
}
```

### Kullanım

```typescript
const phoneField = new PhoneField('phone', 'Telefon Numarası', {
  required: true,
  countryCode: '90',
  format: 'national',
  hint: 'Türkiye telefon numaranızı girin'
});
```

### Özel Doğrulama

Şemada karmaşık doğrulama mantığı ekleyebilirsiniz:

```typescript
class TaxIdField extends BaseField<string> {
  schema(): z.ZodType<string> {
    return z.string()
      .length(11, 'Vergi Kimlik Numarası 11 haneli olmalı')
      .regex(/^\d+$/, 'Vergi Kimlik Numarası sadece rakam içermeli')
      .refine(
        (value) => this.validateTaxId(value),
        'Geçersiz Vergi Kimlik Numarası kontrol toplamı'
      );
  }

  private validateTaxId(value: string): boolean {
    // Kontrol toplamı doğrulamasını uygula
    const digits = value.split('').map(Number);
    // ... doğrulama mantığı
    return true;
  }
}
```

---

## En İyi Uygulamalar

### 1. Alan Tanımlarını Ayırın

Yeniden kullanılabilir alan tanım dosyaları oluşturun:

```typescript
// fields/user-fields.ts
import { StringField, IntegerField, BooleanField } from 'ng-signalify/fields';

export const userFields = {
  firstName: new StringField('firstName', 'Ad', {
    required: true,
    min: 2,
    max: 50
  }),
  
  lastName: new StringField('lastName', 'Soyad', {
    required: true,
    min: 2,
    max: 50
  }),
  
  age: new IntegerField('age', 'Yaş', {
    min: 18,
    max: 120
  }),
  
  isActive: new BooleanField('isActive', 'Aktif', {
    yesLabel: 'Aktif',
    noLabel: 'Pasif'
  })
};
```

### 2. Formlar Arası Yeniden Kullanım

```typescript
// registration-form.ts
import { userFields } from './fields/user-fields';

const registrationFields = [
  userFields.firstName,
  userFields.lastName,
  userFields.age,
  // ... ek alanlar
];

const form = createEnhancedForm(registrationFields);
```

### 3. Tip Çıkarımı

TypeScript'in alan tanımlarından tipleri çıkarmasına izin verin:

```typescript
const fields = [
  new StringField('email', 'E-posta', { email: true }),
  new IntegerField('age', 'Yaş', { min: 0 })
] as const;

type FormData = {
  [K in typeof fields[number] as K['name']]: K extends BaseField<infer T> ? T : never
};
// FormData = { email: string; age: number; }
```

### 4. İlgili Alanları Gruplayın

```typescript
// fields/address-fields.ts
export const createAddressFields = (prefix = '') => [
  new StringField(`${prefix}street`, 'Sokak Adresi', { required: true }),
  new StringField(`${prefix}city`, 'Şehir', { required: true }),
  new StringField(`${prefix}zipCode`, 'Posta Kodu', { 
    required: true,
    regex: /^\d{5}$/
  }),
  new EnumField(`${prefix}state`, 'İl', stateOptions, { required: true })
];

// Kullanım
const billingFields = createAddressFields('billing_');
const shippingFields = createAddressFields('shipping_');
```

### 5. Yardımcı İpuçları Sağlayın

Kafa karıştırıcı olabilecek alanlar için her zaman ipuçları ekleyin:

```typescript
const passwordField = new PasswordField('password', 'Şifre', {
  required: true,
  minLength: 12,
  hint: 'En az 12 karakter, büyük harf, küçük harf, rakam ve özel karakter içermeli'
});

const taxIdField = new StringField('taxId', 'Vergi Kimlik No', {
  required: true,
  regex: /^\d{11}$/,
  hint: 'Format: 11 haneli rakam',
  placeholder: '12345678901'
});
```

### 6. Spesifik Alan Tiplerini Kullanın

Kullanım durumunuz için en spesifik alan tipini seçin:

```typescript
// ❌ Çok genel
const priceField = new StringField('price', 'Fiyat');

// ✅ Tip güvenli ve zengin özellikli
const priceField = new DecimalField('price', 'Fiyat', {
  required: true,
  min: 0,
  scale: 2,
  currency: 'TRY'
});
```

---

## İlgili Dokümantasyon

- [Formlar & Şemalar](../../DOCUMENTATION.md#schemas-form--filter)
- [Doğrulama](../../DOCUMENTATION.md#validators-doğrulayıcılar)
- [Gelişmiş Formlar](../../DOCUMENTATION.md#enhanced-form-gelişmiş-form)
- [Import/Export Servisleri](../../DOCUMENTATION.md#services-importexport)
- [UI Adaptörleri](../../DOCUMENTATION.md#adapters-ui-integration)
- [Material Bileşen Eşleştirmesi](../material-component-mapping.md)

---

[README'ye Dön](../../README.md) | [Dokümantasyon Ana Sayfa](../../DOCUMENTATION.md)

---

**ng-signalify** - Angular 19+ için Modern, Tip Güvenli, Signal Tabanlı Formlar
