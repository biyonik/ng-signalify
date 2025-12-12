# Kurulum Kılavuzu

> **🇬🇧 For English version:** [docs/installation.md](../installation.md)

## İçindekiler

- [Ön Gereksinimler](#ön-gereksinimler)
- [Kurulum Yöntemleri](#kurulum-yöntemleri)
- [Paket İçe Aktarımları](#paket-i̇çe-aktarımları)
- [Kurulum](#kurulum)
- [Kurulumu Doğrulama](#kurulumu-doğrulama)
- [Sonraki Adımlar](#sonraki-adımlar)

---

## Ön Gereksinimler

ng-signalify'ı kurmadan önce, geliştirme ortamınızın bu gereksinimleri karşıladığından emin olun:

| Gereksinim | Versiyon | Notlar |
|------------|----------|--------|
| **Node.js** | 18+ | npm/pnpm/yarn için gerekli |
| **Angular** | 19+ | ng-signalify en son Signal API'lerini kullanır |
| **TypeScript** | 5.5+ | Gelişmiş tip özellikleri için |
| **Zod** | 3.22+ | Validasyon için gerekli peer dependency |

### Ortamınızı Kontrol Edin

```bash
# Node.js versiyonunu kontrol edin
node --version
# v18.0.0 veya üzeri çıktı vermeli

# Angular CLI versiyonunu kontrol edin
ng version
# Angular CLI 19.0.0 veya üzeri göstermeli

# TypeScript versiyonunu kontrol edin
tsc --version
# Version 5.5.0 veya üzeri çıktı vermeli
```

---

## Kurulum Yöntemleri

### npm Kullanarak

```bash
npm install ng-signalify zod
```

### pnpm Kullanarak (Önerilen)

```bash
pnpm add ng-signalify zod
```

### yarn Kullanarak

```bash
yarn add ng-signalify zod
```

### Opsiyonel Bağımlılıklar

ng-signalify, belirli özellikler için opsiyonel peer bağımlılıklara sahiptir:

```bash
# Material Design entegrasyonu için (opsiyonel)
npm install @angular/material

# Excel dışa aktarma işlevselliği için (opsiyonel)
npm install xlsx

# IndexedDB desteği için (opsiyonel)
npm install idb
```

---

## Paket İçe Aktarımları

ng-signalify, tree-shaking optimizasyonu için birkaç alt pakete organize edilmiştir:

### Mevcut Paketler

```typescript
// Formlar için alan tipleri
import { StringField, NumberField, EmailField } from 'ng-signalify/fields';

// Validasyon şemaları
import { z } from 'zod';  // Zod dahili olarak kullanılır

// Durum yönetimi için entity store
import { EntityStore } from 'ng-signalify/store';

// HTTP istemci yardımcı araçları
import { HttpClient } from 'ng-signalify/api';

// Özel validatörler (TC Kimlik, IBAN, vb.)
import { TcKimlikValidator, IbanValidator } from 'ng-signalify/validators';

// Material Design adaptörleri (opsiyonel)
import { MaterialAdapter } from 'ng-signalify/adapters';

// Gelişmiş yardımcı araçlar
import { FormGroup, DynamicForm } from 'ng-signalify/advanced';
```

### İçe Aktarma Örnekleri

**Basit bir form için:**
```typescript
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';
```

**Entity yönetimi için:**
```typescript
import { EntityStore } from 'ng-signalify/store';
```

**Validasyon şemaları için:**
```typescript
import { StringField } from 'ng-signalify/fields';
import { z } from 'zod';
```

---

## Kurulum

### Standalone Bileşenler (Önerilen)

Angular 19+ standalone bileşenleri önerir. ng-signalify bu yaklaşımla sorunsuz çalışır:

**Adım 1: Bileşeninize içe aktarın**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StringField, EmailField, PasswordField } from 'ng-signalify/fields';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <form>
      <input [value]="emailField.value()" 
             (input)="emailField.setValue($event.target.value)" />
      @if (emailField.error()) {
        <span class="error">{{ emailField.error() }}</span>
      }
    </form>
  `
})
export class LoginComponent {
  emailField = new EmailField('email', 'E-posta Adresi', {
    required: true
  });
}
```

**Adım 2: Ek yapılandırma gerekmez!**

Bu kadar! ng-signalify, standalone bileşenlerle kutunun dışında çalışacak şekilde tasarlanmıştır.

---

### NgModule Kurulumu (Eski)

NgModule tabanlı uygulamalar kullanıyorsanız:

**Adım 1: Modülünüze içe aktarın**

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    BrowserModule,
    CommonModule
  ],
  providers: []
})
export class AppModule { }
```

**Adım 2: Bileşenlerde kullanın**

```typescript
import { Component } from '@angular/core';
import { StringField, EmailField } from 'ng-signalify/fields';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  emailField = new EmailField('email', 'E-posta', { required: true });
}
```

**Not:** Özel modül içe aktarımları gerekli değildir. ng-signalify alanları ve store'ları injectable servislerdir.

---

## Kurulumu Doğrulama

Kurulumu doğrulamak için bir test bileşeni oluşturun:

**test.component.ts:**
```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';

@Component({
  selector: 'app-test',
  standalone: true,
  template: `
    <div>
      <h1>ng-signalify Kurulum Testi</h1>
      <p>Alan Değeri: {{ testField.value() }}</p>
      <p>Geçerli mi: {{ testField.isValid() ? '✅' : '❌' }}</p>
      @if (testField.error()) {
        <p class="error">Hata: {{ testField.error() }}</p>
      }
      <button (click)="setValue()">Test Değeri Ayarla</button>
    </div>
  `,
  styles: [`
    .error { color: red; }
  `]
})
export class TestComponent {
  testField = new StringField('test', 'Test Alanı', {
    required: true,
    min: 3
  });

  setValue() {
    this.testField.setValue('Merhaba ng-signalify!');
  }
}
```

**Uygulamanızı çalıştırın:**
```bash
ng serve
```

Test bileşeninize gidin. Şunları görmelisiniz:
- Görüntülenen alan değeri
- Validasyon durumu
- Hata mesajları (geçersizse)
- Değer ayarlamak için düğme

---

## Sonraki Adımlar

ng-signalify kurulduktan sonra, bu konuları keşfedin:

### 1. Alan Tiplerini Öğrenin
Mevcut alanları anlamak için alan tipleri dokümantasyonuyla başlayın:
- **[Alan Tipleri Kılavuzu](fields.md)** - Tüm alan tipleri için eksiksiz referans

### 2. Entity Store'u Keşfedin
Veri koleksiyonlarını nasıl yöneteceğinizi öğrenin:
- **[Entity Store Kılavuzu](store.md)** - CRUD işlemleriyle durum yönetimi

### 3. Validasyon
Validasyon stratejilerine derinlemesine dalın:
- **[Validasyon Kılavuzu](validation.md)** - Yerleşik ve özel validatörler

### 4. Sayfalama
Veri tablolarınızda sayfalamayı uygulayın:
- **[Sayfalama Kılavuzu](pagination.md)** - İstemci ve sunucu taraflı sayfalama

### 5. Durum Kalıcılığı
Kullanıcı tercihlerini ve filtreleri kalıcı hale getirin:
- **[Kalıcılık Kılavuzu](persistence.md)** - Durumu kaydetme ve geri yükleme

### 6. Örnekler
Gerçek dünya örneklerini görün:
- **[Örnekler Koleksiyonu](examples.md)** - Giriş formları, CRUD, ana-detay, vb.

---

## Sorun Giderme

### Yaygın Sorunlar

**Sorun: "Cannot find module 'ng-signalify'"**
```bash
# Çözüm: Kurulumun başarıyla tamamlandığından emin olun
npm install ng-signalify zod
```

**Sorun: "Zod is not installed"**
```bash
# Çözüm: Zod peer bağımlılığını kurun
npm install zod
```

**Sorun: Signal tipleri hakkında TypeScript hataları**
```bash
# Çözüm: TypeScript 5.5+ kurulu olduğundan emin olun
npm install typescript@latest
```

**Sorun: Angular versiyon uyumluluğu**
```bash
# Çözüm: Angular 19+ sürümüne yükseltin
ng update @angular/core @angular/cli
```

### Yardım Alma

- **GitHub Issues:** [github.com/biyonik/ng-signalify/issues](https://github.com/biyonik/ng-signalify/issues)
- **Dokümantasyon:** [Tam Dokümantasyon](../../DOCUMENTATION.md)
- **Örnekler:** [Demo Uygulamaları](../../apps/demo-material)

---

## İlgili Dokümantasyon

- [Alan Tipleri](fields.md)
- [Entity Store](store.md)
- [Validasyon](validation.md)
- [Geçiş Kılavuzu](../../MIGRATION.md)
- [Hızlı Başlangıç](../../README.md#-quick-start)

---

**ng-signalify ile mutlu kodlamalar! 🚀**
