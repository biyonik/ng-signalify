# Accessibility Checklist for Angular Material + ng-signalify

**TR:** Erişilebilirlik Kontrol Listesi - WCAG 2.1 Level AA Uyumluluğu  
**EN:** Accessibility Checklist - WCAG 2.1 Level AA Compliance

**Author:** Ahmet ALTUN  
**GitHub:** [github.com/biyonik](https://github.com/biyonik)  
**LinkedIn:** [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)  
**Email:** ahmet.altun60@gmail.com

---

## How to Use This Checklist

**TR:** Bu kontrol listesini formlarınızı oluştururken veya gözden geçirirken kullanın.  
**EN:** Use this checklist when creating or reviewing your forms.

Each item includes:
- ✅ Checkbox for tracking completion
- TR + EN descriptions
- Code examples (✓ Good vs ✗ Bad)
- WCAG Success Criteria references

---

## 1. Keyboard Navigation

**TR:** Klavye Navigasyonu - Tüm fonksiyonlar klavye ile erişilebilir olmalı  
**EN:** Keyboard Navigation - All functions must be keyboard accessible

### 1.1 Tab Order

- [ ] **All form fields are keyboard accessible**
  - TR: Tüm form alanlarına Tab tuşu ile erişilebilir
  - EN: All form fields reachable via Tab key
  - WCAG: 2.1.1 (Level A)

✓ **GOOD:**
```html
<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput type="email" tabindex="0" />
</mat-form-field>
```

✗ **BAD:**
```html
<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
</mat-form-field>
```

### 1.2 Focus Indicators

- [ ] **Visible focus indicators on all interactive elements**
  - TR: Tüm etkileşimli öğelerde görünür odak göstergeleri
  - EN: Visible focus indicators on all interactive elements
  - WCAG: 2.4.7 (Level AA)

✓ **GOOD:**
```css
input:focus,
button:focus {
  outline: 2px solid #3f51b5;
  outline-offset: 2px;
}
```

✗ **BAD:**
```css
input:focus,
button:focus {
  outline: none;  /* Removes focus indicator */
}
```

### 1.3 Keyboard Shortcuts

- [ ] **Enter key submits forms**
  - TR: Enter tuşu formu gönderir
  - EN: Enter key submits forms
  - WCAG: 2.1.1 (Level A)

- [ ] **Escape key closes dialogs/dropdowns**
  - TR: Escape tuşu dialog/dropdown kapatır
  - EN: Escape key closes dialogs/dropdowns
  - WCAG: 2.1.1 (Level A)

- [ ] **Arrow keys navigate select/autocomplete options**
  - TR: Ok tuşları select/autocomplete seçeneklerinde gezinir
  - EN: Arrow keys navigate select/autocomplete options
  - WCAG: 2.1.1 (Level A)

### 1.4 Skip Links

- [ ] **Skip to main content link provided**
  - TR: Ana içeriğe atla linki sağlanmış
  - EN: Skip to main content link provided
  - WCAG: 2.4.1 (Level A)

✓ **GOOD:**
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content">
  <form>...</form>
</main>
```

---

## 2. ARIA Labels and Roles

**TR:** ARIA Etiketleri ve Rolleri - Ekran okuyucular için semantik bilgi  
**EN:** ARIA Labels and Roles - Semantic information for screen readers

### 2.1 Form Labels

- [ ] **All inputs have associated labels**
  - TR: Tüm inputlarda ilişkili etiketler var
  - EN: All inputs have associated labels
  - WCAG: 1.3.1, 3.3.2 (Level A)

✓ **GOOD:**
```html
<mat-form-field>
  <mat-label>Email Address</mat-label>
  <input matInput type="email" id="email" />
</mat-form-field>
```

✗ **BAD:**
```html
```

### 2.2 ARIA Attributes

- [ ] **aria-label provided when visual label is absent**
  - TR: Görsel etiket yoksa aria-label sağlanmış
  - EN: aria-label provided when visual label is absent
  - WCAG: 4.1.2 (Level A)

- [ ] **aria-describedby links to hints/error messages**
  - TR: aria-describedby ipuçları/hata mesajlarına bağlanmış
  - EN: aria-describedby links to hints/error messages
  - WCAG: 3.3.1 (Level A)

✓ **GOOD:**
```html
<mat-form-field>
  <mat-label>Password</mat-label>
  <input 
    matInput 
    type="password"
    aria-describedby="password-hint password-error" />
  <mat-hint id="password-hint">Minimum 8 characters</mat-hint>
  <mat-error id="password-error">Password is required</mat-error>
</mat-form-field>
```

### 2.3 ARIA Live Regions

- [ ] **Error messages announced to screen readers**
  - TR: Hata mesajları ekran okuyuculara duyurulur
  - EN: Error messages announced to screen readers
  - WCAG: 4.1.3 (Level AA)

✓ **GOOD:**
```html
<div aria-live="polite" aria-atomic="true">
  @if (form.fields.email.error()) {
    <mat-error>{{ form.fields.email.error() }}</mat-error>
  }
</div>
```

### 2.4 Required Fields

- [ ] **Required fields marked with aria-required**
  - TR: Gerekli alanlar aria-required ile işaretlenmiş
  - EN: Required fields marked with aria-required
  - WCAG: 3.3.2 (Level A)

✓ **GOOD:**
```html
<input matInput required aria-required="true" />
```

---

## 3. Color Contrast

**TR:** Renk Kontrastı - WCAG AA standartlarına uygun kontrast oranları  
**EN:** Color Contrast - Contrast ratios compliant with WCAG AA standards

### 3.1 Text Contrast

- [ ] **Normal text: minimum 4.5:1 contrast ratio**
  - TR: Normal metin: minimum 4.5:1 kontrast oranı
  - EN: Normal text: minimum 4.5:1 contrast ratio
  - WCAG: 1.4.3 (Level AA)

- [ ] **Large text (18pt+): minimum 3:1 contrast ratio**
  - TR: Büyük metin (18pt+): minimum 3:1 kontrast oranı
  - EN: Large text (18pt+): minimum 3:1 contrast ratio
  - WCAG: 1.4.3 (Level AA)

✓ **GOOD:**
```css
.form-label {
  color: #212121;  /* Black on white: 16:1 ratio */
  background: #ffffff;
}
```

✗ **BAD:**
```css
.form-label {
  color: #cccccc;  /* Light gray on white: 1.6:1 ratio - FAIL */
  background: #ffffff;
}
```

### 3.2 Interactive Element Contrast

- [ ] **Buttons and links: minimum 3:1 contrast**
  - TR: Butonlar ve linkler: minimum 3:1 kontrast
  - EN: Buttons and links: minimum 3:1 contrast
  - WCAG: 1.4.11 (Level AA)

- [ ] **Form inputs: visible boundaries with 3:1 contrast**
  - TR: Form inputları: 3:1 kontrastla görünür sınırlar
  - EN: Form inputs: visible boundaries with 3:1 contrast
  - WCAG: 1.4.11 (Level AA)

### 3.3 Error State Contrast

- [ ] **Error messages: sufficient contrast**
  - TR: Hata mesajları: yeterli kontrast
  - EN: Error messages: sufficient contrast
  - WCAG: 1.4.3 (Level AA)

- [ ] **Error indicators not relying on color alone**
  - TR: Hata göstergeleri sadece renge dayanmıyor
  - EN: Error indicators not relying on color alone
  - WCAG: 1.4.1 (Level A)

✓ **GOOD:**
```html
<mat-error>
  Email is required
</mat-error>
```

✗ **BAD:**
```html
```

---

## 4. Screen Reader Support

**TR:** Ekran Okuyucu Desteği - NVDA, JAWS, VoiceOver uyumluluğu  
**EN:** Screen Reader Support - NVDA, JAWS, VoiceOver compatibility

### 4.1 Semantic HTML

- [ ] **Proper HTML5 semantic elements used**
  - TR: Uygun HTML5 semantik öğeleri kullanılmış
  - EN: Proper HTML5 semantic elements used
  - WCAG: 1.3.1 (Level A)

✓ **GOOD:**
```html
<form>
  <fieldset>
    <legend>Personal Information</legend>
  </fieldset>
</form>
```

### 4.2 Form Instructions

- [ ] **Form-level instructions provided**
  - TR: Form seviyesinde talimatlar sağlanmış
  - EN: Form-level instructions provided
  - WCAG: 3.3.2 (Level A)

✓ **GOOD:**
```html
<p id="form-instructions">All fields marked with * are required</p>
<form aria-describedby="form-instructions">
  ...
</form>
```

### 4.3 Error Identification

- [ ] **Errors clearly identified and described**
  - TR: Hatalar açıkça tanımlanmış ve açıklanmış
  - EN: Errors clearly identified and described
  - WCAG: 3.3.1 (Level A)

- [ ] **Error summary provided at form level**
  - TR: Form seviyesinde hata özeti sağlanmış
  - EN: Error summary provided at form level
  - WCAG: 3.3.1 (Level A)

✓ **GOOD:**
```html
<div role="alert" aria-live="assertive">
  <h2>Please correct the following errors:</h2>
  <ul>
    <li><a href="#email">Email is required</a></li>
    <li><a href="#password">Password is too short</a></li>
  </ul>
</div>
```

### 4.4 Dynamic Content

- [ ] **Screen reader notified of dynamic changes**
  - TR: Dinamik değişiklikler ekran okuyucuya bildirilmiş
  - EN: Screen reader notified of dynamic changes
  - WCAG: 4.1.3 (Level AA)

✓ **GOOD:**
```html
<div aria-live="polite" aria-atomic="true">
  @if (isSubmitting()) {
    <p>Submitting form, please wait...</p>
  }
</div>
```

---

## 5. Focus Management

**TR:** Odak Yönetimi - Mantıklı odak sırası ve görünür göstergeler  
**EN:** Focus Management - Logical focus order and visible indicators

### 5.1 Focus Order

- [ ] **Logical tab order (left-to-right, top-to-bottom)**
  - TR: Mantıklı tab sırası (soldan-sağa, yukarıdan-aşağıya)
  - EN: Logical tab order (left-to-right, top-to-bottom)
  - WCAG: 2.4.3 (Level A)

- [ ] **No use of positive tabindex values**
  - TR: Pozitif tabindex değerleri kullanılmamış
  - EN: No use of positive tabindex values
  - WCAG: 2.4.3 (Level A)

✗ **BAD:**
```html
<input tabindex="5" />
<input tabindex="3" />
```

### 5.2 Focus Trapping

- [ ] **Focus trapped in modal dialogs**
  - TR: Modal dialog'larda odak hapsedilmiş
  - EN: Focus trapped in modal dialogs
  - WCAG: 2.4.3 (Level A)

✓ **GOOD:**
```typescript
@Component({
  template: `
    <mat-dialog-content>
    </mat-dialog-content>
  `
})
```

### 5.3 Focus Restoration

- [ ] **Focus restored after dialog closes**
  - TR: Dialog kapandıktan sonra odak geri yüklenmiş
  - EN: Focus restored after dialog closes
  - WCAG: 2.4.3 (Level A)

---

## 6. Form Validation Accessibility

**TR:** Form Doğrulama Erişilebilirliği - Anlaşılır ve erişilebilir validasyon  
**EN:** Form Validation Accessibility - Clear and accessible validation

### 6.1 Error Messages

- [ ] **Error messages clear and specific**
  - TR: Hata mesajları açık ve spesifik
  - EN: Error messages clear and specific
  - WCAG: 3.3.1 (Level A)

✓ **GOOD:**
```
"Email is required"
"Password must be at least 8 characters"
```

✗ **BAD:**
```
"Invalid input"
"Error"
```

### 6.2 Inline Validation

- [ ] **Inline errors announced to screen readers**
  - TR: Inline hatalar ekran okuyuculara duyurulmuş
  - EN: Inline errors announced to screen readers
  - WCAG: 3.3.1 (Level A)

- [ ] **Errors shown after field loses focus (blur)**
  - TR: Hatalar alan odağı kaybettikten sonra gösterilmiş
  - EN: Errors shown after field loses focus
  - WCAG: 3.3.1 (Level A)

### 6.3 Success Feedback

- [ ] **Success states clearly indicated**
  - TR: Başarı durumları açıkça belirtilmiş
  - EN: Success states clearly indicated
  - WCAG: 3.3.1 (Level A)

✓ **GOOD:**
```html
<div role="status" aria-live="polite">
  <mat-icon>check_circle</mat-icon>
  Form submitted successfully
</div>
```

---

## 7. Required Field Indicators

**TR:** Gerekli Alan Göstergeleri - Açık ve tutarlı gösterimler  
**EN:** Required Field Indicators - Clear and consistent indicators

### 7.1 Visual Indicators

- [ ] **Required fields marked with asterisk (*)**
  - TR: Gerekli alanlar yıldız (*) ile işaretlenmiş
  - EN: Required fields marked with asterisk (*)
  - WCAG: 3.3.2 (Level A)

- [ ] **Legend/note explaining required indicator**
  - TR: Gerekli göstergeyi açıklayan açıklama/not
  - EN: Legend/note explaining required indicator
  - WCAG: 3.3.2 (Level A)

✓ **GOOD:**
```html
<p>Fields marked with <span aria-label="required">*</span> are required</p>

<mat-form-field>
  <mat-label>
    Email <span class="required" aria-label="required">*</span>
  </mat-label>
  <input matInput required aria-required="true" />
</mat-form-field>
```

### 7.2 Programmatic Indicators

- [ ] **required attribute on HTML inputs**
  - TR: HTML inputlarda required özniteliği
  - EN: required attribute on HTML inputs
  - WCAG: 4.1.2 (Level A)

- [ ] **aria-required="true" on custom components**
  - TR: Özel bileşenlerde aria-required="true"
  - EN: aria-required="true" on custom components
  - WCAG: 4.1.2 (Level A)

---

## 8. Table Accessibility

**TR:** Tablo Erişilebilirliği - Veri tabloları için erişilebilirlik  
**EN:** Table Accessibility - Accessibility for data tables

### 8.1 Table Structure

- [ ] **Proper table markup (thead, tbody, th, td)**
  - TR: Uygun tablo işaretlemesi (thead, tbody, th, td)
  - EN: Proper table markup (thead, tbody, th, td)
  - WCAG: 1.3.1 (Level A)

✓ **GOOD:**
```html
<table mat-table>
  <thead>
    <tr mat-header-row>
      <th mat-header-cell scope="col">Name</th>
      <th mat-header-cell scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr mat-row>
      <td mat-cell>John Doe</td>
      <td mat-cell>john@example.com</td>
    </tr>
  </tbody>
</table>
```

### 8.2 Table Headers

- [ ] **Column headers with scope="col"**
  - TR: Sütun başlıkları scope="col" ile
  - EN: Column headers with scope="col"
  - WCAG: 1.3.1 (Level A)

- [ ] **Row headers with scope="row" (if applicable)**
  - TR: Satır başlıkları scope="row" ile (varsa)
  - EN: Row headers with scope="row" (if applicable)
  - WCAG: 1.3.1 (Level A)

### 8.3 Sortable Tables

- [ ] **Sort controls keyboard accessible**
  - TR: Sıralama kontrolleri klavye erişilebilir
  - EN: Sort controls keyboard accessible
  - WCAG: 2.1.1 (Level A)

- [ ] **Current sort state announced**
  - TR: Mevcut sıralama durumu duyurulmuş
  - EN: Current sort state announced
  - WCAG: 4.1.3 (Level AA)

✓ **GOOD:**
```html
<th mat-sort-header aria-label="Sort by name">
  Name
  <span class="visually-hidden" *ngIf="sortActive === 'name'">
    (sorted {{ sortDirection }})
  </span>
</th>
```

---

## 9. Loading States Accessibility

**TR:** Yükleme Durumları Erişilebilirliği - Async işlemler için geri bildirim  
**EN:** Loading States Accessibility - Feedback for async operations

### 9.1 Loading Indicators

- [ ] **Loading state announced to screen readers**
  - TR: Yükleme durumu ekran okuyuculara duyurulmuş
  - EN: Loading state announced to screen readers
  - WCAG: 4.1.3 (Level AA)

✓ **GOOD:**
```html
<div role="status" aria-live="polite" aria-atomic="true">
  @if (isLoading()) {
    <mat-spinner></mat-spinner>
    <span class="visually-hidden">Loading, please wait...</span>
  }
</div>
```

### 9.2 Disabled State

- [ ] **Form disabled during submission**
  - TR: Gönderim sırasında form devre dışı
  - EN: Form disabled during submission
  - WCAG: 3.3.1 (Level A)

- [ ] **Disabled state announced**
  - TR: Devre dışı durumu duyurulmuş
  - EN: Disabled state announced
  - WCAG: 4.1.3 (Level AA)

✓ **GOOD:**
```html
<button 
  mat-raised-button 
  [disabled]="isSubmitting()"
  [attr.aria-busy]="isSubmitting()">
  {{ isSubmitting() ? 'Submitting...' : 'Submit' }}
</button>
```

---

## 10. Touch Targets

**TR:** Dokunma Hedefleri - Minimum 44x44px boyut  
**EN:** Touch Targets - Minimum 44x44px size

### 10.1 Button Size

- [ ] **All buttons minimum 44x44 pixels**
  - TR: Tüm butonlar minimum 44x44 piksel
  - EN: All buttons minimum 44x44 pixels
  - WCAG: 2.5.5 (Level AAA, but recommended for AA)

✓ **GOOD:**
```css
button {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}
```

### 10.2 Input Size

- [ ] **Form inputs minimum 44px height**
  - TR: Form inputları minimum 44px yükseklik
  - EN: Form inputs minimum 44px height
  - WCAG: 2.5.5 (Level AAA, but recommended for AA)

### 10.3 Spacing

- [ ] **Adequate spacing between interactive elements**
  - TR: Etkileşimli öğeler arası yeterli boşluk
  - EN: Adequate spacing between interactive elements
  - WCAG: 2.5.5 (Level AAA, but recommended for AA)

✓ **GOOD:**
```css
.button-group button {
  margin: 4px;  /* Prevents accidental taps */
}
```

---

## Testing Tools and Resources

**TR:** Test Araçları ve Kaynaklar  
**EN:** Testing Tools and Resources

### Automated Testing Tools

1. **axe DevTools**
   - Browser extension for accessibility testing
   - https://www.deque.com/axe/devtools/

2. **WAVE**
   - Web accessibility evaluation tool
   - https://wave.webaim.org/

3. **Lighthouse**
   - Built into Chrome DevTools
   - Accessibility audit included

### Screen Readers

1. **NVDA** (Windows) - Free
2. **JAWS** (Windows) - Commercial
3. **VoiceOver** (macOS/iOS) - Built-in
4. **TalkBack** (Android) - Built-in

### Manual Testing Checklist

- [ ] Test with keyboard only (unplug mouse)
- [ ] Test with screen reader
- [ ] Test color contrast with tools
- [ ] Test on mobile devices
- [ ] Test with browser zoom at 200%

---

## Summary

**TR:** Bu kontrol listesi, WCAG 2.1 Level AA standartlarına uygun erişilebilir formlar oluşturmanıza yardımcı olur.  
**EN:** This checklist helps you create accessible forms compliant with WCAG 2.1 Level AA standards.

**Remember:** Accessibility is not optional—it's a fundamental requirement for inclusive web applications.

**Author:** Ahmet ALTUN  
**Version:** 2.0.0  
**Last Updated:** December 2025
