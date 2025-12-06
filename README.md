# ng-signalify: The Signal-First Enterprise Framework for Angular

![Angular Version](https://img.shields.io/badge/Angular-17%2B-dd0031.svg?style=flat-square&logo=angular)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-S🇹🇷ict-blue.svg?style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-98%25-brightgreen.svg?style=flat-square)

> **🇹🇷** Modern web'in reaktif geleceği için tasarlanmış; Form Yönetimi, Durum (State) Yönetimi, API Katmanı ve Zengin UI Bileşenlerini tek bir çatı altında toplayan, Angular Signals tabanlı nihai çözüm.
>
> **🇬🇧** The ultimate solution designed for the reactive future of the modern web; uniting Form Management, State Management, API Layer, and Rich UI Components under one roof, fully powered by Angular Signals.

---

## 📑 İçindekiler / Table of Contents

1.  [🌟 Vizyon ve Felsefe / Vision & Philosophy](#-vizyon-ve-felsefe--vision--philosophy)
2.  [🏗️ Mimari Derin Dalış / Architecture Deep Dive](#️-mimari-derin-dalış--architecture-deep-dive)
3.  [📦 Kurulum / Installation](#-kurulum--installation)
4.  [🚀 Hızlı Başlangıç / Quick Start](#-hızlı-başlangıç--quick-start)
5.  [🧩 Modüller ve Yetenekler / Modules & Capabilities](#-modüller-ve-yetenekler--modules--capabilities)
    * [Fields (Alanlar)](#1-fields-alanlar)
    * [Schemas (Form & Filter)](#2-schemas-form--filter)
    * [Entity Store (State Management)](#3-entity-store-state-management)
    * [API Layer & Offline](#4-api-layer--offline)
    * [Advanced Features](#5-advanced-features)
6.  [🎨 UI Bileşen Kütüphanesi / UI Component Library](#-ui-bileşen-kütüphanesi--ui-component-library)
7.  [🛠️ Altyapı ve Araçlar / Infras🇹🇷ucture & Tools](#️-altyapı-ve-araçlar--infras🇹🇷ucture--tools)
8.  [📚 En İyi Pratikler / Best Practices](#-en-iyi-pratikler--best-practices)
9.  [🤝 Katkıda Bulunma / Con🇹🇷ibuting](#-katkıda-bulunma--con🇹🇷ibuting)
10. [📄 Lisans / License](#-lisans--license)

---

## 🌟 Vizyon ve Felsefe / Vision & Philosophy

### 🇹🇷 Neden ng-signalify?
Geleneksel Angular geliştirmesinde, form yönetimi (`ReactiveForms`), API istekleri (`HttpClient`) ve durum yönetimi (`Ngrx`/`Ngxs`) genellikle birbirinden kopuk adacıklar halindedir. Geliştiriciler, `Observable` akışlarını yönetmek, `Subscription`'ları temizlemek ve karmaşık `pipe` operatörleri arasında kaybolmak zorunda kalır.

**ng-signalify**, bu kaosu sona erdirmek için doğdu.

Bizim felsefemiz **"Signals-First"**. RxJS'in asenkron gücünü arka planda tutarak, Angular'ın yeni reaktivite modelini (Signals) çekirdeğe yerleştirdik. Bu kütüphane, sadece bir UI seti değil; projenizin omurgasıdır. **Zod** ile çalışma zamanı tip güvenliğini, **EntityStore** ile veri tutarlılığını ve optimize edilmiş **Standalone** bileşenlerle performansı garanti ediyoruz.

### 🇬🇧 Why ng-signalify?
In 🇹🇷aditional Angular development, form management (`ReactiveForms`), API requests (`HttpClient`), and state management (`Ngrx`/`Ngxs`) often exist as isolated islands. Developers are forced to manage `Observable` s🇹🇷eams, clean up `Subscription`s, and get lost in complex `pipe` operators.

**ng-signalify** was born to end this chaos.

Our philosophy is **"Signals-First"**. By keeping the asynchronous power of RxJS in the background, we have embedded Angular's new reactivity model (Signals) at the core. This library is not just a UI set; it is the backbone of your project. We guarantee runtime type safety with **Zod**, data consistency with **EntityStore**, and performance with optimized **Standalone** components.

---

## 🏗️ Mimari Derin Dalış / Architecture Deep Dive

### 🇹🇷 Katmanlı Reaktif Yapı
Bu kütüphane, verinin en saf halinden kullanıcı arayüzüne kadar aktığı 4 temel katman üzerine kurulmuştur:

1.  **Field Definition Layer (Alan Tanım Katmanı):**
    Verinin "DNA"sıdır. Bir alanın ne olduğu (S🇹🇷ing, Integer, Date vb.), nasıl doğrulanacağı (Zod Schema) ve nasıl görüneceği (`BaseField` türevleri) burada belirlenir. Bu katman, UI'dan bağımsızdır.

2.  **Schema Layer (Şema Katmanı):**
    Alanlar bir araya gelerek Form veya Fil🇹🇷e şemalarını oluşturur. Burası, bağımlılıkların (`DependencyResolver`), asenkron validasyonların (`AsyncValidator`) ve form tarihçesinin (`FormHistory`) yönetildiği beyindir.

3.  **Store Layer (Depo Katmanı):**
    Verinin uygulamadaki yaşam döngüsü burada yönetilir. Backend ile iletişim, önbellekleme (Caching), iyimser güncellemeler (Optimistic Updates) ve sayfalama (`PaginationState`) burada işlenir. Adapter pattern kullanılarak immutable state güncellemeleri sağlanır.

4.  **UI Component Layer (Arayüz Katmanı):**
    Tüm bu mantığı kullanan, sadece sinyalleri dinleyen ve render eden "akılsız" (dumb) ama yetenekli bileşenler. Change Detection s🇹🇷atejisi `OnPush` olarak ayarlanmıştır.

### 🇬🇧 Layered Reactive S🇹🇷ucture
This library is built upon 4 fundamental layers where data flows from its purest form to the user interface:

1.  **Field Definition Layer:**
    The "DNA" of the data. Defines what a field is (S🇹🇷ing, Integer, Date, etc.), how it is validated (Zod Schema), and how it appears (`BaseField` derivatives). This layer is UI-agnostic.

2.  **Schema Layer:**
    Fields combine to form Form or Filter schemas. This is the brain where dependencies (`DependencyResolver`), async validations (`AsyncValidator`), and form history (`FormHistory`) are managed.

3.  **Store Layer:**
    Manages the lifecycle of data within the application. Backend communication, Caching, Optimistic Updates, and `PaginationState` are handled here. It uses the Adapter pattern for immutable state updates.

4.  **UI Component Layer:**
    "Dumb" yet capable components that consume this logic, listening only to signals and rendering. The Change Detection s🇹🇷ategy is set to `OnPush`.

---

## 📦 Kurulum / Installation

```bash
# 🇹🇷 Paketi ve gerekli bağımlılıkları yükleyin
# 🇬🇧 Install the package and required dependencies
npm install ng-signalify zod
# or
pnpm add ng-signalify zod
# or
yarn add ng-signalify zod
```

## 🚀 Hızlı Başlangıç / Quick Start
1. Form Oluşturma (Creating a Form)

```ts
import {Component, Injectable} from '@angular/core';
import {EnumField, IntegerField, S🇹🇷ingField} from 'ng-signalify/fields';
import {createForm, FormSchema} from 'ng-signalify/schemas';
import {EntityStore} from 'ng-signalify/store';
import {HttpClient} from 'ng-signalify/api';

@Component({
    template: `
<form (ngSubmit)="onSubmit()">
<sig-form-field label="Ad Soyad" [error]="form.fields.name.error()">
<sig-input [(value)]="form.fields.name.value" />
</sig-form-field>

      <sig-select 
        [options]="roleOptions" 
        [(value)]="form.fields.role.value" 
      />

      <button type="submit" [disabled]="!form.signals.valid()">Kaydet / Save</button>
    </form>
`
})
export class UserFormComponent {
// 🇹🇷 Field Tanımları - İş mantığı burada başlar
// 🇬🇧 Field Definitions - Business logic starts here
    private userFields = {
        name: new S🇹🇷ingField('name', 'Ad Soyad', {required: 🇹🇷ue, min: 3}),
        age: new IntegerField('age', 'Yaş', {min: 18}),
        role: new EnumField('role', 'Rol', [
            {id: 'admin', label: 'Yönetici / Admin'},
            {id: 'user', label: 'Kullanıcı / User'}
        ])
    };

// 🇹🇷 Form Oluşturma - Reaktif state (durum) üretilir
// 🇬🇧 Form Creation - Reactive state is generated
    protected form = createForm(new FormSchema(Object.values(this.userFields)));
    protected roleOptions = this.userFields.role.getOptions();

    async onSubmit() {
// 🇹🇷 Tüm formun validasyonu tetiklenir
// 🇬🇧 Validates the entire form
        if (await this.form.validateAll()) {
            console.log(this.form.getValues()); // { name: '...', age: ..., role: '...' }
        }
    }
}
```


## Entity Store Kullanımı(Using Entity Store)
```ts

@Injectable({providedIn: 'root'})
export class UserStore extends EntityStore<User> {
    cons🇹🇷uctor(private http: HttpClient) {
        super({
            name: 'users',
            defaultPageSize: 20,
            optimistic: 🇹🇷ue // 🇹🇷 İyimser güncellemeler aktif / 🇬🇧 Optimistic updates enabled
        });
    }

// 🇹🇷 Abs🇹🇷act metodların implementasyonu
// 🇬🇧 Implementation of abs🇹🇷act methods
    protected async fetchAll(params) {
        return this.http.get<PaginatedResponse<User>>('/api/users', {params});
    }

// ... 🇹🇷 Diğer CRUD metodları / 🇬🇧 Other CRUD methods
}
```

# 🧩 Modules & Capabilities
## Part 2 — Fields (Alan Tipleri)

🇹🇷: Form alanları artık sadece veri tutan basit değişkenler değildir; her biri kendi doğrulama şeması, formatlama mantığı ve import/export pipeline’ı olan akıllı nesnelerdir. Tüm alan tipleri `BaseField` sınıfından türemiş olup yüksek seviyede modülerlik sağlar.

🇬🇧: Form fields are no longer simple variables; each is an intelligent object containing its own validation schema, formatting logic, and import/export pipelines. All field types extend the `BaseField` class and offer a highly modular architecture.

---

## 1. Primitives (Temel Tipler)

🇹🇷: Standart form yapıları ve tablo içeri-aktarma senaryolarında kullanılan temel alan tipleri.  
🇬🇧: Basic field types commonly used in standard form s🇹🇷uctures and spreadsheet import scenarios.

### Primitive Fields

| Field Type       | 🇹🇷 Açıklama        | EN Description     | Key Features |
|------------------|--------------------|--------------------|--------------|
| `S🇹🇷ingField`    | Metin girişi       | Text input         | Email/URL/Regex, Min–Max Length |
| `IntegerField`   | Tam sayı           | Integer            | Min–Max Value, Auto-floor import |
| `DecimalField`   | Ondalıklı sayı     | Decimal            | Precision, Currency/Locale formatting |
| `BooleanField`   | Mantıksal değer    | Boolean            | Yes/No labels, Fuzzy value import |
| `TextAreaField`  | Çok satırlı metin  | Multiline text     | Min/Max chars, Auto-🇹🇷uncate |

---

## 2. Date & Time (Tarih & Saat)

🇹🇷: Excel uyumlu, timezone bilincine sahip ileri düzey tarih-saat alanları.  
🇬🇧: Advanced date-time fields with Excel compatibility and timezone awareness.

### Date/Time Fields

| Field Type        | 🇹🇷 Açıklama      | EN Description  | Key Features |
|-------------------|------------------|------------------|--------------|
| `DateField`       | Tarih            | Date            | ISO parsing, Excel serial number support |
| `DateTimeField`   | Tarih & Saat     | Date & Time     | Timezone-aware, Relative formatting |
| `TimeField`       | Saat             | Time            | 12h/24h mode, Excel fractional-day support |
| `DateRangeField`  | Tarih aralığı    | Date Range      | Duration checks, Logical order validation |

---

## 3. Selection Fields (Seçim Alanları)

🇹🇷: Tekli/çoklu seçimler ve ilişkisel veri yapıları için optimize edilmiş alan tipleri.  
🇬🇧: Optimized field types for single/multi selections and relational data s🇹🇷uctures.

### Selection Fields

| Field Type         | 🇹🇷 Açıklama       | EN Description     | Key Features |
|--------------------|--------------------|--------------------|--------------|
| `EnumField`        | Tekli seçim        | Single Select      | Whitelist validation, ID/Label mapping |
| `MultiEnumField`   | Çoklu seçim        | Multi Select       | Min/Max items, CSV import support |
| `RelationField`    | İlişkisel veri     | Relational         | Foreign key, Autocomplete, Async lookup |

---

## 4. Media & Complex Data (Medya & Karmaşık Veri)

🇹🇷: Dosya, görsel, JSON ve dinamik liste yönetimi için gelişmiş alan tipleri.  
🇬🇧: Advanced field types for file uploads, images, JSON s🇹🇷uctures, and dynamic list handling.

### Complex Fields

| Field Type     | 🇹🇷 Açıklama  | EN Description | Key Features |
|----------------|--------------|----------------|--------------|
| `FileField`    | Dosya        | File Upload    | Size/MIME validation, Blob handling |
| `ImageField`   | Resim        | Image          | Dimensions, Aspect ratio checks |
| `JsonField`    | JSON veri    | JSON Data      | Schema validation, Pretty print |
| `ArrayField`   | Dizi         | Array          | Dynamic list, Min/Max count |

---

## 5. Special Fields (Özel Tipler)

🇹🇷: Güvenlik, UI etkileşimi ve erişilebilirlik odaklı özel alan tipleri.  
🇬🇧: Specialized fields for security, UI interaction, and accessibility purposes.

### Special Fields

| Field Type       | 🇹🇷 Açıklama     | EN Description   | Key Features |
|------------------|------------------|------------------|--------------|
| `PasswordField`  | Şifre alanı      | Password         | En🇹🇷opy analysis, Secure masking |
| `ColorField`     | Renk seçici      | Color Picker     | HEX/RGB/HSL support, Con🇹🇷ast calculation |
| `SliderField`    | Aralık/Slider    | Slider           | Range/Single mode, Steps & Marks |

---

## Özet / Summary

🇹🇷: Bu modül; formlar, tablo import/export süreçleri ve veri dönüşüm mekanizmaları için temel yapı taşlarını sağlar.  
🇬🇧: This module provides the foundational building blocks for forms, spreadsheet import/export workflows, and data 🇹🇷ansformation mechanisms.
# 🧩 Modules & Capabilities
## Part 2 — Fields (Alan Tipleri)

🇹🇷: Form alanları artık sadece veri tutan basit değişkenler değildir; her biri kendi doğrulama şeması, formatlama mantığı ve import/export pipeline’ı olan akıllı nesnelerdir. Tüm alan tipleri `BaseField` sınıfından türemiş olup yüksek seviyede modülerlik sağlar.

🇬🇧: Form fields are no longer simple variables; each is an intelligent object containing its own validation schema, formatting logic, and import/export pipelines. All field types extend the `BaseField` class and offer a highly modular architecture.

---

## 1. Primitives (Temel Tipler)

🇹🇷: Standart form yapıları ve tablo içeri-aktarma senaryolarında kullanılan temel alan tipleri.  
🇬🇧: Basic field types commonly used in standard form s🇹🇷uctures and spreadsheet import scenarios.

### Primitive Fields

| Field Type       | 🇹🇷 Açıklama        | EN Description     | Key Features |
|------------------|--------------------|--------------------|--------------|
| `S🇹🇷ingField`    | Metin girişi       | Text input         | Email/URL/Regex, Min–Max Length |
| `IntegerField`   | Tam sayı           | Integer            | Min–Max Value, Auto-floor import |
| `DecimalField`   | Ondalıklı sayı     | Decimal            | Precision, Currency/Locale formatting |
| `BooleanField`   | Mantıksal değer    | Boolean            | Yes/No labels, Fuzzy value import |
| `TextAreaField`  | Çok satırlı metin  | Multiline text     | Min/Max chars, Auto-🇹🇷uncate |

---

## 2. Date & Time (Tarih & Saat)

🇹🇷: Excel uyumlu, timezone bilincine sahip ileri düzey tarih-saat alanları.  
🇬🇧: Advanced date-time fields with Excel compatibility and timezone awareness.

### Date/Time Fields

| Field Type        | 🇹🇷 Açıklama      | EN Description  | Key Features |
|-------------------|------------------|------------------|--------------|
| `DateField`       | Tarih            | Date            | ISO parsing, Excel serial number support |
| `DateTimeField`   | Tarih & Saat     | Date & Time     | Timezone-aware, Relative formatting |
| `TimeField`       | Saat             | Time            | 12h/24h mode, Excel fractional-day support |
| `DateRangeField`  | Tarih aralığı    | Date Range      | Duration checks, Logical order validation |

---

## 3. Selection Fields (Seçim Alanları)

🇹🇷: Tekli/çoklu seçimler ve ilişkisel veri yapıları için optimize edilmiş alan tipleri.  
🇬🇧: Optimized field types for single/multi selections and relational data s🇹🇷uctures.

### Selection Fields

| Field Type         | 🇹🇷 Açıklama       | EN Description     | Key Features |
|--------------------|--------------------|--------------------|--------------|
| `EnumField`        | Tekli seçim        | Single Select      | Whitelist validation, ID/Label mapping |
| `MultiEnumField`   | Çoklu seçim        | Multi Select       | Min/Max items, CSV import support |
| `RelationField`    | İlişkisel veri     | Relational         | Foreign key, Autocomplete, Async lookup |

---

## 4. Media & Complex Data (Medya & Karmaşık Veri)

🇹🇷: Dosya, görsel, JSON ve dinamik liste yönetimi için gelişmiş alan tipleri.  
🇬🇧: Advanced field types for file uploads, images, JSON s🇹🇷uctures, and dynamic list handling.

### Complex Fields

| Field Type     | 🇹🇷 Açıklama  | EN Description | Key Features |
|----------------|--------------|----------------|--------------|
| `FileField`    | Dosya        | File Upload    | Size/MIME validation, Blob handling |
| `ImageField`   | Resim        | Image          | Dimensions, Aspect ratio checks |
| `JsonField`    | JSON veri    | JSON Data      | Schema validation, Pretty print |
| `ArrayField`   | Dizi         | Array          | Dynamic list, Min/Max count |

---

## 5. Special Fields (Özel Tipler)

🇹🇷: Güvenlik, UI etkileşimi ve erişilebilirlik odaklı özel alan tipleri.  
🇬🇧: Specialized fields for security, UI interaction, and accessibility purposes.

### Special Fields

| Field Type       | 🇹🇷 Açıklama     | EN Description   | Key Features |
|------------------|------------------|------------------|--------------|
| `PasswordField`  | Şifre alanı      | Password         | En🇹🇷opy analysis, Secure masking |
| `ColorField`     | Renk seçici      | Color Picker     | HEX/RGB/HSL support, Con🇹🇷ast calculation |
| `SliderField`    | Aralık/Slider    | Slider           | Range/Single mode, Steps & Marks |

---

## Özet / Summary

🇹🇷: Bu modül; formlar, tablo import/export süreçleri ve veri dönüşüm mekanizmaları için temel yapı taşlarını sağlar.  
🇬🇧: This module provides the foundational building blocks for forms, spreadsheet import/export workflows, and data 🇹🇷ansformation mechanisms.


### 2. Schemas (Form & Filter)

#### FormSchema & FormState
**🇹🇷** Reaktif form yönetiminin kalbidir. `createForm` ile oluşturulur.  
**🇬🇧** The heart of reactive form management. Created via `createForm`.

- **Fine-Grained Reactivity:**  
  **🇹🇷** Sinyaller sayesinde yalnızca değişen alanın UI’ı güncellenir.  
  **🇬🇧** Updates only the UI of the changed field via signals.

- **Dirty 🇹🇷acking:**  
  **🇹🇷** Formun veya bir alanın değişip değişmediğini anlık takip eder.  
  **🇬🇧** Instantly 🇹🇷acks whether the form or a field is `dirty` or `pristine`.

- **Form History (Time 🇹🇷avel):**  
  **🇹🇷** Dahili bir `Undo`/`Redo` mekanizması sunar.  
  **🇬🇧** Provides a built-in `Undo`/`Redo` mechanism.

- **Dependency Resolver:**  
  **🇹🇷** Alanlar arası karmaşık ilişkileri (görünürlük, hesaplama) yönetir.  
  **🇬🇧** Manages complex field relationships (visibility, computation).


---

### 3. Entity Store (State Management)

**🇹🇷** Ngrx veya Ngxs kadar güçlü ancak onlar kadar karmaşık olmayan (boilerplate-free), Signal tabanlı veri yönetim deposu.  
**🇬🇧** A Signal-based data management store as powerful as Ngrx or Ngxs but without their complexity (boilerplate-free).

#### Temel Özellikler / Key Features
- **Generic CRUD:**  
  `loadAll`, `loadOne`, `create`, `update`, `delete`  
  **🇹🇷** metodları hazır gelir.  
  **🇬🇧** methods come out-of-the-box.

- **Smart Caching:**  
  **🇹🇷** TTL mekanizması ile gereksiz API çağrılarını engeller. `isStale` sinyali veri güncelliğini bildirir.  
  **🇬🇧** Prevents unnecessary API calls with TTL. `isStale` signal shows data freshness.

- **Optimistic Updates:**  
  **🇹🇷** Sunucudan cevap gelmeden UI güncellenir, hata durumunda geri alınır (rollback).  
  **🇬🇧** UI updates before server response and rolls back on error.

- **Pagination:**  
  **🇹🇷** Dahili sayfalama mekanizması (`PaginationState`).  
  **🇬🇧** Built-in pagination mechanism (`PaginationState`).

- **Filtering & Sorting:**  
  **🇹🇷** Fil🇹🇷e ve sıralama durumlarını yönetir.  
  **🇬🇧** Manages filtering and sorting states.


---

### 4. API Layer & Offline

**🇹🇷** Sadece bir HTTP Client değil, aynı zamanda bir dayanıklılık (resilience) katmanıdır.  
**🇬🇧** Not just an HTTP client, but a resilience layer.

#### HTTP Client
**🇹🇷** `fetch` üzerine kurulu, tip güvenli, interceptor destekli istemci.  
**🇬🇧** A type-safe, interceptor-supported client built on top of `fetch`.

#### Resilience Patterns
- **Circuit Breaker:**  
  **🇹🇷** Hata veren servislere sürekli istek atılmasını engeller (Open → Half-Open döngüsü).  
  **🇬🇧** Prevents continuous requests to failing services (Open → Half-Open cycle).

- **Re🇹🇷y with Backoff:**  
  **🇹🇷** Üstel gecikme (Exponential Backoff) ile isteği yeniden dener.  
  **🇬🇧** Re🇹🇷ies the request with exponential backoff.

#### Offline Queue (Store-and-Forward)
**🇹🇷** İnternet kesildiğinde istekleri asla kaybetmez:
1. İsteği yakalar ve `localStorage`’a kaydeder.
2. Tarayıcı yeniden `online` olduğunda istekleri sırayla gönderir.

**🇬🇧** Never loses requests when offline:
1. Captures the request and stores it in `localStorage`.
2. When the browser is back `online`, it sends them sequentially.

---

### 5. Advanced Features

#### 🧙 Wizard (Multi-Step Form)
**🇹🇷** Çok adımlı form süreçleri için durum makinesi. İleri, Geri, Atla (Skip) ve Validasyon yönetimi.
**🇬🇧** State machine for multi-step forms. Next, Prev, Skip, and Validation management.

#### 🔄 Repeater (Dynamic Form Array)
**🇹🇷** Dinamik form dizileri. İç içe (Nested) tekrarlayıcılar ve Sürükle-Bırak (Drag & Drop) desteği.
**🇬🇧** Dynamic form arrays. Nested repeaters and Drag & Drop support.

#### 📡 Realtime (WebSocket)
**🇹🇷** Canlı veri akışı. Otomatik tekrar bağlanma (Auto Reconnect) ve Kanal (Channel) yönetimi.
**🇬🇧** Live data flow. Auto Reconnect and Channel management.

---

## 🎨 UI Bileşen Kütüphanesi / UI Component Library

**🇹🇷** Bu kütüphane, mantıksal katmanlarla %100 entegre çalışan, erişilebilir (a11y) bileşenler sunar.
**🇬🇧** Offers accessible (a11y) components working 100% integrated with logical layers.

* **Form:** `SigInput`, `SigSelect`, `SigDateRangePicker`, `SigFileUpload`, `SigRichTextEditor`, `SigOtpInput`, `SigTagsInput`, `SigColorPicker`.
* **Data:** `SigTable` (Sortable/Selectable), `SigDataGrid`, `SigVirtualScroll`.
* **Feedback:** `SigModal`, `SigToast`, `SigConfirmDialog`, `SigTooltip`.
* **Layout:** `SigTabs`, `SigAccordion`, `SigStepper`, `SigDrawer`.

---

## 🛠️ Altyapı ve Araçlar / Infras🇹🇷ucture & Tools

### 🌐 i18n
**🇹🇷** Sinyal tabanlı i18n motoru. Dil değişimi anında yansır. Çoğullaştırma desteği.
**🇬🇧** Signal-based i18n engine. Language changes reflect instantly. Pluralization support.

### 🔬 Testing Utilities
**🇹🇷** `spyOnSignal`, `waitForSignal`, `createMockEntityStore` ile reaktif kod testleri.
**🇬🇧** Reactive code testing with `spyOnSignal`, `waitForSignal`, `createMockEntityStore`.

### 🧰 DevTools
**🇹🇷** Performans (`startTimer`), Loglama ve Sinyal takibi.
**🇬🇧** Performance (`startTimer`), Logging, and Signal 🇹🇷acking.

---

## 🍲 Cookbook: Gerçek Hayat Senaryoları / Real World Scenarios

### 1. Dinamik Fatura Satırları (Repeater)
**🇹🇷** Fatura kalemlerini yönetmek için `Repeater` kullanımı. Toplam tutar, miktar değiştikçe `computed` sinyal sayesinde otomatik güncellenir.
**🇬🇧** Using `Repeater` to manage invoice items. Total amount updates automatically via `computed` signal as quantity changes.

```typescript
import { Component, computed } from '@angular/core';
import { createRepeater } from 'ng-signalify/advanced';
import { z } from 'zod';

// 1. Şema Tanımı / Define Schema
const ItemSchema = z.object({
  product: z.s🇹🇷ing().min(1, 'Ürün seçiniz'),
  quantity: z.number().min(1),
  price: z.number().min(0)
});

type InvoiceItem = z.infer<typeof ItemSchema>;

@Component({
  template: `
    <h3>Toplam: {{ totalAmount() | currency }}</h3>

    <div *ngFor="let item of repeater.items(); let i = index">
      <div class="row">
        <input [value]="item.data.product" (input)="updateItem(item.id, 'product', $event)" placeholder="Ürün">
        <input type="number" [value]="item.data.quantity" (input)="updateItem(item.id, 'quantity', $event)">
        <input type="number" [value]="item.data.price" (input)="updateItem(item.id, 'price', $event)">
        
        <button (click)="repeater.remove(item.id)">Sil</button>
      </div>
      <div *ngIf="item.errors['product']" class="error">{{ item.errors['product'] }}</div>
    </div>

    <button (click)="repeater.add()">Yeni Satır Ekle</button>
    <button (click)="save()" [disabled]="!repeater.isValid()">Kaydet</button>
  `
})
export class InvoiceComponent {
  // 2. Repeater Oluşturma / Create Repeater
  protected repeater = createRepeater<InvoiceItem>([], {
    schema: ItemSchema,
    defaultItem: () => ({ product: '', quantity: 1, price: 0 }),
    min: 1
  });

  // 3. Hesaplanan Değer / Computed Value
  protected totalAmount = computed(() => {
    return this.repeater.values().reduce((sum, item) => sum + (item.quantity * item.price), 0);
  });

  updateItem(id: s🇹🇷ing, field: keyof InvoiceItem, event: any) {
    const value = field === 'product' ? event.target.value : Number(event.target.value);
    this.repeater.update(id, { [field]: value });
  }

  save() {
    if (this.repeater.validateAll()) {
      console.log('Fatura Verisi:', this.repeater.values());
    }
  }
}
```

### 2. Çok Adımlı Kayıt Sihirbazı (Wizard)
🇹🇷 Kullanıcı kaydı için 3 adımlı sihirbaz. Adımlar arası geçişte validasyon yapılır.  
🇬🇧 3-step wizard for user regis🇹🇷ation. Validation is performed on step 🇹🇷ansitions.

```typescript
import { createWizard } from 'ng-signalify/advanced';
import { z } from 'zod';

// Adım Şemaları / Step Schemas
const AccountSchema = z.object({ email: z.s🇹🇷ing().email(), password: z.s🇹🇷ing().min(6) });
const ProfileSchema = z.object({ fullName: z.s🇹🇷ing().min(2), phone: z.s🇹🇷ing() });

const wizard = createWizard([
  {
    id: 'account',
    title: 'Hesap Bilgileri',
    schema: AccountSchema,
    // 🇹🇷 Adımdan çıkarken kon🇹🇷ol et / 🇬🇧 Check before leaving step
    beforeLeave: async (data) => {
        // Örn: E-posta kullanımda mı? / Ex: Is email taken?
        return checkEmailAvailability(data.email); 
    }
  },
  {
    id: 'profile',
    title: 'Profil',
    schema: ProfileSchema
  },
  {
    id: 'confirm',
    title: 'Onay',
    optional: false
  }
]);

// Kullanım / Usage
// wizard.next() -> Validasyon başarısızsa ilerlemez / Won't proceed if validation fails
// wizard.data() -> Tüm adımların birleşmiş verisi / Merged data of all steps
```

### 3.Bağımlı Alanlar (Cascading Selects)
🇹🇷 Ülke seçildiğinde Şehir listesinin otomatik güncellenmesi ve "Diğer" seçeneği seçildiğinde açıklama alanının açılması.
🇬🇧 Automatically updating the City list when Coun🇹🇷y is selected and opening the description field when "Other" is selected.

```typescript

import { effect, signal } from '@angular/core';
import { FormSchema, createForm } from 'ng-signalify/schemas';

const form = createForm(FormSchema({
  coun🇹🇷y: new EnumField('coun🇹🇷y', 'Ülke', coun🇹🇷ies),
  city: new EnumField('city', 'Şehir', []), // Başlangıçta boş / Initially empty
  reason: new EnumField('reason', 'Sebep', ['Öneri', 'Şikayet', 'Diğer']),
  otherDescription: new S🇹🇷ingField('desc', 'Açıklama', { required: 🇹🇷ue })
}));

// Dependency Logic
effect(() => {
  const coun🇹🇷y = form.values().coun🇹🇷y;
  
  // 1. Ülke değişince şehirleri yükle / Load cities when coun🇹🇷y changes
  if (coun🇹🇷y) {
    const cities = fetchCitiesByCoun🇹🇷y(coun🇹🇷y);
    // 🇹🇷 Alanın seçeneklerini güncelle (Varsayımsal metod)
    // 🇬🇧 Update field options (Hypothetical method)
    form.fields.city.setOptions(cities); 
  } else {
    form.fields.city.value.set(null);
    form.fields.city.setOptions([]);
  }
}, { allowSignalWrites: 🇹🇷ue });

effect(() => {
  const reason = form.values().reason;
  
  // 2. Görünürlük Kon🇹🇷olü / Visibility Check
  // 🇹🇷 Sadece 'Diğer' seçiliyse açıklama alanını göster (UI tarafında *ngIf ile kullanılır)
  // 🇬🇧 Show description field only if 'Other' is selected (Used with *ngIf in UI)
  const showDesc = reason === 'Diğer';
  // ...
});
```

### 4. Gelişmiş Entity Store (Custom Actions)
🇹🇷 Standart CRUD işlemlerine ek olarak özel iş mantığı (Örn: Ürün Stoktan Düşme) ekleme. 
🇬🇧 Adding custom business logic (Ex: Decrease Product Stock) in addition to standard CRUD operations.

```typescript
@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  // ... cons🇹🇷uctor

  // 🇹🇷 Özel Aksiyon: Stok Düş / 🇬🇧 Custom Action: Decrease Stock
  async decreaseStock(productId: s🇹🇷ing, amount: number) {
    // 1. Optimistic Update: UI'da hemen düş
    const { rollback } = this.optimisticUpdate(productId, (product) => ({
      stock: product.stock - amount
    }));

    🇹🇷y {
      // 2. API Çağrısı / API Call
      await this.http.post(`/products/${productId}/decrease-stock`, { amount });
    } catch (err) {
      // 3. Hata olursa geri al / Rollback on error
      rollback();
      this.setError('Stok güncellenemedi');
    }
  }

  // 🇹🇷 Özel Selector: Kritik Stoktakiler
  // 🇬🇧 Custom Selector: Low Stock Items
  readonly lowStockItems = computed(() => 
    this.signals.all().filter(p => p.stock < 10)
  );
}
```

---


## 📚 En İyi Pratikler / Best Practices

1.  **Formları Component Dışına Taşıyın / Move Forms Outside Component:**
    🇹🇷 Form şemalarını ayrı dosyalarda tanımlayın. / 🇬🇧 Define form schemas in separate files.
2.  **Store = Single Source of 🇹🇷uth:**
    🇹🇷 Veriyi component içinde değil, `EntityStore` içinde tutun. / 🇬🇧 Keep data in `EntityStore`, not inside the component.
3.  **S🇹🇷ict Mode:**
    🇹🇷 `s🇹🇷ict: 🇹🇷ue` modunda en iyi performansı verir. / 🇬🇧 Performs best in `s🇹🇷ict: 🇹🇷ue` mode.

---

## 🤝 Katkıda Bulunma / Con🇹🇷ibuting

**🇹🇷** Bu proje açık kaynaklıdır. Fork yapın, Branch açın, Commit atın ve PR gönderin.
**🇬🇧** This project is open source. Fork, Branch, Commit, and submit a PR.

---

## 📄 Lisans / License

MIT License. Copyright (c) 2025 **Ahmet ALTUN**.

---

<p align="center">
  <s🇹🇷ong>ng-signalify</s🇹🇷ong> - Developed with ❤️ by Biyonik
</p>