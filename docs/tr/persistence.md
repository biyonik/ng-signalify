# Durum Kalıcılığı Kılavuzu

> **🇬🇧 For English version:** [docs/persistence.md](../persistence.md)

## İçindekiler

- [Durum Kalıcılığı Nedir?](#durum-kalıcılığı-nedir)
- [Yapılandırma](#yapılandırma)
- [Depolama Seçenekleri](#depolama-seçenekleri)
- [Neyin Kalıcı Hale Getirileceği](#neyin-kalıcı-hale-getirileceği)
- [Başlangıçta Geri Yükleme](#başlangıçta-geri-yükleme)
- [Kalıcı Durumu Temizleme](#kalıcı-durumu-temizleme)
- [Depolama Anahtarları](#depolama-anahtarları)
- [Güvenlik Konuları](#güvenlik-konuları)
- [Performans İpuçları](#performans-i̇puçları)
- [Örnekler](#örnekler)
- [Kalıcılığı Devre Dışı Bırakma](#kalıcılığı-devre-dışı-bırakma)
- [En İyi Uygulamalar](#en-i̇yi-uygulamalar)

---

## Durum Kalıcılığı Nedir?

Durum kalıcılığı, tarayıcı oturumları arasında store durumunu **kaydetmenize ve geri yüklemenize** olanak tanır. Bu, şunları sağlayarak daha iyi bir kullanıcı deneyimi sunar:

- 🔄 **Filtreleri koruma** - Kullanıcılar uzaklaştıklarında arama kriterlerini kaybetmez
- 📄 **Sayfalamanın hatırlanması** - Kullanıcıları görüntüledikleri sayfaya döndürür
- ↕️ **Sıralamayı sürdürme** - Verileri kullanıcıların tercih ettiği şekilde sıralı tutar
- 💾 **Seçimleri kaydetme** - Kullanıcıların hangi öğeleri seçtiğini hatırlar

### Kalıcılık Olmadan

```typescript
// Kullanıcı filtreleri uygular
await store.updateFilter('status', 'active');
await store.updateFilter('role', 'admin');

// Kullanıcı başka bir sayfaya gider ve geri gelir
// ❌ Filtreler kayboldu, yeniden uygulamak gerekiyor
```

### Kalıcılık İle

```typescript
super({
  name: 'users',
  persistence: {
    enabled: true,
    paths: ['filters']
  }
});

// Kullanıcı filtreleri uygular
await store.updateFilter('status', 'active');

// Kullanıcı uzaklaşır ve geri gelir
// ✅ Filtreler hala orada!
```

---

## Yapılandırma

EntityStore yapılandırmanızda kalıcılığı etkinleştirin.

### Temel Yapılandırma

```typescript
import { Injectable } from '@angular/core';
import { EntityStore } from 'ng-signalify/store';

@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,                                    // Kalıcılığı etkinleştir
        storage: 'sessionStorage',                        // Depolama türü
        paths: ['filters', 'sort', 'pagination']         // Neyin kalıcı olacağı
      }
    });
  }
}
```

### Yapılandırma Seçenekleri

```typescript
interface PersistenceConfig {
  enabled: boolean;                    // Kalıcılığı etkinleştir/devre dışı bırak
  storage: 'sessionStorage' | 'localStorage';  // Depolama backend'i
  paths: string[];                     // Kalıcı hale getirilecek durum yolları
  key?: string;                        // Özel depolama anahtarı (opsiyonel)
}
```

---

## Depolama Seçenekleri

İhtiyaçlarınıza göre `sessionStorage` ve `localStorage` arasında seçim yapın.

### sessionStorage (Çoğu Durum İçin Önerilen)

**Özellikler:**
- ✅ Veriler **yalnızca tarayıcı oturumu sırasında** kalıcıdır
- ✅ Sekme veya tarayıcı kapandığında temizlenir
- ✅ Daha gizli (veriler sekmeler arasında paylaşılmaz)
- ✅ Geçici durum için önerilir

**Şunlar için kullanın:**
- Arama filtreleri
- Geçici tercihler
- Oturuma özel durum

```typescript
persistence: {
  enabled: true,
  storage: 'sessionStorage',
  paths: ['filters', 'sort', 'pagination']
}
```

### localStorage (Uzun Vadeli Tercihler İçin)

**Özellikler:**
- ✅ Veriler **süresiz olarak** kalıcıdır
- ✅ Tarayıcı yeniden başlatılmasından sonra da kalır
- ✅ Tüm sekmeler arasında paylaşılır
- ⚠️ Daha az gizli

**Şunlar için kullanın:**
- Kullanıcı tercihleri (tema, dil)
- Uzun vadeli ayarlar
- Sekmeler arası durum paylaşımı

```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters', 'pagination']
}
```

---

## Neyin Kalıcı Hale Getirileceği

Store durumunun hangi kısımlarının kalıcı hale getirileceğini seçin.

### Önerilen Yollar

```typescript
paths: ['filters', 'sort', 'pagination']
```

**Açıklama:**
- `filters` - Kullanıcının arama ve filtre kriterleri
- `sort` - Sıralama alanı ve yönü
- `pagination` - Mevcut sayfa ve sayfa boyutu

### Opsiyonel Yollar

```typescript
paths: ['filters', 'sort', 'pagination', 'selection']
```

**Ek yollar:**
- `selection` - Seçili entity ID'leri (dikkatli kullanın, eskiyebilir)

### Kalıcı Hale GETİRİLMEMESİ Gerekenler

**❌ Kalıcı hale getirmeyin:**
- `entities` - Entity verileri eskiyebilir
- `error` - Hata durumu kalıcı olmamalıdır
- `isLoading` - Yükleme durumu geçicidir

```typescript
// ❌ Kötü uygulama
paths: ['entities', 'filters', 'sort']  // Entity'leri kalıcı hale getirmeyin!

// ✅ İyi uygulama
paths: ['filters', 'sort', 'pagination']
```

---

## Başlangıçta Geri Yükleme

Kalıcı durum, store oluşturulduğunda **otomatik olarak geri yüklenir**.

### Otomatik Geri Yükleme

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters', 'sort', 'pagination']
      }
    });
    // Durum burada otomatik olarak geri yüklenir
    // filters(), sort() ve pagination.page() kalıcı değerleri içerir
  }
}
```

### Bileşen Kullanımı

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <!-- Filtreler kalıcı durumdan otomatik olarak uygulanır -->
    @if (store.filters()['status']) {
      <span class="badge">Durum: {{ store.filters()['status'] }}</span>
    }
  `
})
export class UserListComponent implements OnInit {
  protected store = inject(UserStore);

  ngOnInit() {
    // Geri yüklenen filtreler, sıralama ve sayfalama ile veri yükle
    this.store.loadAll();
    // Kullanıcı daha önce sahip olduğu görünümü görür
  }
}
```

---

## Kalıcı Durumu Temizleme

Kalıcı durumu manuel olarak veya belirli olaylarda kaldırın.

### Yöntem 1: Depolamadan Temizle

```typescript
// Belirli store'u temizle
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('ng-signalify-users');
}

// Veya localStorage için
if (typeof window !== 'undefined') {
  localStorage.removeItem('ng-signalify-users');
}
```

### Yöntem 2: Çıkışta Temizle

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  async logout() {
    // Tüm kalıcı durumu temizle
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      // Veya seçici olarak temizle
      sessionStorage.removeItem('ng-signalify-users');
      sessionStorage.removeItem('ng-signalify-products');
    }

    // Çıkış yap ve yönlendir
    await this.logoutFromServer();
    this.router.navigate(['/login']);
  }
}
```

### Yöntem 3: Store'da Temizle

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  clearPersistedState() {
    if (typeof window !== 'undefined') {
      const key = `ng-signalify-${this.config.name}`;
      const storage = this.config.persistence?.storage === 'localStorage'
        ? localStorage
        : sessionStorage;
      storage.removeItem(key);
    }
  }
}

// Kullanım
store.clearPersistedState();
```

---

## Depolama Anahtarları

Depolama anahtarlarının nasıl oluşturulduğunu anlayın.

### Varsayılan Anahtar Formatı

```typescript
// Format: ng-signalify-{storeName}
const key = `ng-signalify-users`;
```

### Özel Anahtar

```typescript
persistence: {
  enabled: true,
  storage: 'localStorage',
  paths: ['filters'],
  key: 'app_user_filters_v2'  // Sürümleme için özel anahtar
}
```

**Özel anahtarları şunlar için kullanın:**
- Sürümleme (saklanan yapı değiştiğinde)
- Aynı ada sahip birden fazla store
- Diğer kütüphanelerle çakışmaları önleme

---

## Güvenlik Konuları

**⚠️ Önemli Güvenlik Notları:**

### Asla Hassas Verileri Kalıcı Hale Getirmeyin

```typescript
// ❌ ASLA hassas verileri kalıcı hale getirmeyin
paths: ['password', 'token', 'creditCard']  // BUNU YAPMAYIN!

// ✅ Sadece UI durumunu kalıcı hale getirin
paths: ['filters', 'sort', 'pagination']
```

### Kalıcı Hale Getirmek Güvenli Olanlar

**✅ Güvenli:**
- Filtreler (durum, rol, departman)
- Sıralama yapılandırması
- Sayfalama durumu
- UI tercihleri (tema, düzen)

**❌ Güvensiz:**
- Şifreler
- Kimlik doğrulama token'ları
- Kredi kartı verileri
- Kişisel tanımlanabilir bilgiler (PII)
- API anahtarları

### Çıkışta Temizle

```typescript
async logout() {
  // ÖNEMLİ: Çıkışta kalıcı durumu temizle
  sessionStorage.clear();
  localStorage.clear();
  
  await this.authService.logout();
}
```

---

## Performans İpuçları

Daha iyi performans için kalıcılığı optimize edin.

### 1. Büyük Entity Listelerini Kalıcı Hale Getirmeyin

```typescript
// ❌ Kötü - 10.000 entity'yi kalıcı hale getirme
paths: ['entities', 'filters']

// ✅ İyi - sadece UI durumunu kalıcı hale getir
paths: ['filters', 'sort', 'pagination']
```

### 2. Çoğu Durum İçin sessionStorage Kullanın

```typescript
// ✅ sessionStorage daha hızlı ve daha gizli
storage: 'sessionStorage'

// localStorage'ı sadece verinin tarayıcı yeniden başlatılmasından sonra da kalması gerektiğinde kullanın
storage: 'localStorage'
```

### 3. Cache TTL Ayarlayın

```typescript
super({
  name: 'users',
  cacheTTL: 5 * 60 * 1000,  // 5 dakika
  persistence: {
    enabled: true,
    paths: ['filters']
  }
});
```

### 4. Kalıcı Yolları Sınırlayın

```typescript
// ❌ Çok fazla
paths: ['entities', 'filters', 'sort', 'pagination', 'selection', 'error']

// ✅ Sadece gereken
paths: ['filters', 'pagination']
```

---

## Örnekler

### Örnek 1: Kullanıcı Tercihleri (localStorage)

```typescript
@Injectable({ providedIn: 'root' })
export class UserStore extends EntityStore<User> {
  constructor() {
    super({
      name: 'users',
      persistence: {
        enabled: true,
        storage: 'localStorage',  // Tarayıcı yeniden başlatılmasından sonra da kalır
        paths: ['filters', 'sort', 'pagination']
      }
    });
  }
}
```

**Kullanım durumu:** Kullanıcının tercih ettiği filtreler ve sıralama oturumlar arasında kalmalıdır.

### Örnek 2: Oturum Durumu (sessionStorage)

```typescript
@Injectable({ providedIn: 'root' })
export class OrderStore extends EntityStore<Order> {
  constructor() {
    super({
      name: 'orders',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',  // Sekme kapandığında temizlenir
        paths: ['filters', 'pagination']
      }
    });
  }
}
```

**Kullanım durumu:** Tarayıcı yeniden başlatılmasında kalmaması gereken geçici oturum durumu.

### Örnek 3: Sadece Filtreler

```typescript
@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      persistence: {
        enabled: true,
        storage: 'sessionStorage',
        paths: ['filters']  // Sadece filtreler, sayfalama değil
      }
    });
  }
}
```

**Kullanım durumu:** Filtreleri hatırla ama her zaman sayfa 1'den başla.

---

## Kalıcılığı Devre Dışı Bırakma

### Global Olarak Devre Dışı Bırak

```typescript
super({
  name: 'users',
  persistence: {
    enabled: false  // Devre dışı
  }
});
```

### Config'i Atla (Varsayılan Devre Dışı)

```typescript
super({
  name: 'users'
  // Kalıcılık config'i yok = devre dışı
});
```

---

## En İyi Uygulamalar

### 1. Geçici Durum İçin sessionStorage Kullanın

```typescript
// ✅ Çoğu durum için iyi
storage: 'sessionStorage'
```

### 2. Kullanıcı Tercihleri İçin localStorage Kullanın

```typescript
// ✅ Yeniden başlatmalarda kalması gereken ayarlar için iyi
storage: 'localStorage'
paths: ['filters', 'pagination']
```

### 3. Çıkışta Temizleyin

```typescript
async logout() {
  sessionStorage.clear();
  localStorage.removeItem('ng-signalify-users');
}
```

### 4. Depolama Devre Dışıyken Test Edin

```typescript
// Depolama engellendiğinde/kullanılamadığında uygulamanın çalıştığını test edin
if (typeof window !== 'undefined') {
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
  } catch (e) {
    console.warn('Depolama kullanılamıyor');
  }
}
```

### 5. Anahtarlarınızı Sürümlendirin

```typescript
// Yapı değiştiğinde sürümlendirilmiş anahtarlar kullanın
key: 'app_users_v2'
```

### 6. Her Şeyi Kalıcı Hale Getirmeyin

```typescript
// ❌ Çok fazla
paths: ['entities', 'filters', 'sort', 'pagination', 'selection']

// ✅ Sadece gereken
paths: ['filters', 'pagination']
```

---

## İlgili Dokümantasyon

- [Entity Store](store.md) - Tam store dokümantasyonu
- [Sayfalama](pagination.md) - Kalıcılık ile sayfalama
- [Örnekler](examples.md) - Gerçek dünya kalıcılık örnekleri
- [Kurulum](installation.md) - Başlangıç

---

**ng-signalify ile durumu etkili bir şekilde kalıcı hale getirin! 💾**
