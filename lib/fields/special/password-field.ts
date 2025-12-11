import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Şifre karmaşıklık analizinin sonucunu tutan nesne.
 * Puan (0-4), metinsel etiket (Zayıf/Güçlü), renk kodu ve kullanıcıya yönelik iyileştirme önerilerini içerir.
 *
 * EN: Object holding the result of the password complexity analysis.
 * Contains score (0-4), textual label (Weak/Strong), color code, and improvement suggestions for the user.
 */
export interface PasswordStrength {
  /**
   * TR: Şifre gücü puanı (0: Çok Zayıf, 4: Çok Güçlü).
   *
   * EN: Password strength score (0: Very Weak, 4: Very Strong).
   */
  score: 0 | 1 | 2 | 3 | 4;

  /**
   * TR: UI'da gösterilecek metin (Örn: "Güçlü").
   *
   * EN: Text to be displayed in the UI (E.g., "Strong").
   */
  label: string;

  /**
   * TR: Güç göstergesi çubuğu için renk kodu.
   *
   * EN: Color code for the strength indicator bar.
   */
  color: string;

  /**
   * TR: Şifreyi güçlendirmek için kullanıcıya sunulan öneriler listesi.
   *
   * EN: List of suggestions presented to the user to strengthen the password.
   */
  feedback: string[];
}

/**
 * TR: Şifre alanı için güvenlik politikalarını ve validasyon kurallarını belirleyen yapılandırma.
 * Karakter tipi zorunlulukları (büyük/küçük harf, rakam vb.) ve görsel ayarları yönetir.
 *
 * EN: Configuration defining security policies and validation rules for the password field.
 * Manages character type requirements (upper/lowercase, number, etc.) and visual settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface PasswordFieldConfig extends FieldConfig {
  /**
   * TR: Minimum karakter uzunluğu.
   *
   * EN: Minimum character length.
   */
  minLength?: number;

  /**
   * TR: Maksimum karakter uzunluğu.
   *
   * EN: Maximum character length.
   */
  maxLength?: number;

  /**
   * TR: Büyük harf (A-Z) zorunluluğu.
   *
   * EN: Uppercase (A-Z) requirement.
   */
  requireUppercase?: boolean;

  /**
   * TR: Küçük harf (a-z) zorunluluğu.
   *
   * EN: Lowercase (a-z) requirement.
   */
  requireLowercase?: boolean;

  /**
   * TR: Rakam (0-9) zorunluluğu.
   *
   * EN: Number (0-9) requirement.
   */
  requireNumber?: boolean;

  /**
   * TR: Özel karakter (!@#$ vb.) zorunluluğu.
   *
   * EN: Special character (!@#$ etc.) requirement.
   */
  requireSpecial?: boolean;

  /**
   * TR: Kullanıcı şifre yazarken güç göstergesinin (Strength Meter) gösterilip gösterilmeyeceği.
   *
   * EN: Whether to show the strength meter while the user is typing the password.
   */
  showStrength?: boolean;

  /**
   * TR: "Şifre Tekrar" senaryolarında, bu alanın eşleşmesi gereken diğer alanın adı.
   *
   * EN: In "Confirm Password" scenarios, the name of the other field this field must match.
   */
  confirmField?: string;
}

/**
 * TR: Güvenli metin girişi sağlayan alan sınıfı.
 * Veri güvenliği (Data Privacy) gereği değerleri asla açık (cleartext) olarak dışa aktarmaz.
 * Zod ile regex tabanlı karmaşıklık kontrolü yapar ve dahili bir şifre üreticisi barındırır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class providing secure text input.
 * Due to Data Privacy, it never exports values as cleartext.
 * Performs regex-based complexity checks with Zod and includes an internal password generator.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class PasswordField extends BaseField<string> {
  /**
   * TR: PasswordField sınıfını başlatır.
   *
   * EN: Initializes the PasswordField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Şifre yapılandırması. / EN: Password configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: PasswordFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Şifre politikalarına uygun dinamik Zod şeması oluşturur.
   * Config içindeki her bir 'require' ayarı için ayrı bir Regex kuralı ekler.
   * Bu sayede kullanıcıya "Büyük harf eksik", "Rakam eksik" gibi spesifik hatalar dönülebilir.
   *
   * EN: Creates a dynamic Zod schema compliant with password policies.
   * Adds a separate Regex rule for each 'require' setting in the config.
   * This allows returning specific errors like "Missing uppercase", "Missing number" to the user.
   *
   * @returns TR: String Zod şeması. / EN: String Zod schema.
   */
  schema(): z.ZodType<string> {
    let s = z.string({ required_error: `${this.label} zorunludur` });

    const minLength = this.config.minLength ?? 8;
    s = s.min(minLength, `${this.label} en az ${minLength} karakter olmalı`);

    if (this.config.maxLength) {
      s = s.max(this.config.maxLength, `${this.label} en fazla ${this.config.maxLength} karakter olabilir`);
    }

    if (this.config.requireUppercase) {
      s = s.regex(/[A-Z]/, 'En az bir büyük harf içermeli');
    }

    if (this.config.requireLowercase) {
      s = s.regex(/[a-z]/, 'En az bir küçük harf içermeli');
    }

    if (this.config.requireNumber) {
      s = s.regex(/[0-9]/, 'En az bir rakam içermeli');
    }

    if (this.config.requireSpecial) {
      s = s.regex(/[^A-Za-z0-9]/, 'En az bir özel karakter içermeli');
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s;
  }

  /**
   * TR: Güvenlik gereği şifreyi asla ekranda göstermez.
   * Dolu ise maskelenmiş (••••••••) string, boş ise tire döner.
   *
   * EN: For security reasons, never shows the password on screen.
   * Returns a masked (••••••••) string if filled, otherwise a dash.
   */
  override present(value: string | null): string {
    // Şifre asla görüntülenmez
    if (!value) return '-';
    return '••••••••';
  }

  /**
   * TR: Veri dışa aktarılırken (Export) şifrenin sızmasını engeller.
   * Gerçek değer yerine yıldızlardan oluşan bir maske döndürür.
   *
   * EN: Prevents password leakage during data export.
   * Returns a mask of asterisks instead of the actual value.
   */
  override toExport(value: string | null): string {
    // Şifre asla export edilmez
    return '********';
  }

  /**
   * TR: Dış kaynaktan (Excel, JSON vb.) şifre import edilmesini engeller.
   * Güvenlik riski oluşturabileceği için her zaman null döner.
   *
   * EN: Prevents importing passwords from external sources (Excel, JSON, etc.).
   * Always returns null as it poses a security risk.
   */
  override fromImport(raw: unknown): string | null {
    // Import'ta şifre kabul edilmez
    return null;
  }

  /**
   * TR: Girilen şifrenin gücünü (Entropi) basit bir algoritma ile analiz eder.
   * Uzunluk ve karakter çeşitliliğine (harf, rakam, sembol) göre puan verir.
   * Eksik kriterler için geri bildirim (feedback) dizisi oluşturur.
   *
   * EN: Analyzes the strength (Entropy) of the entered password using a simple algorithm.
   * Scores based on length and character variety (letter, number, symbol).
   * Creates a feedback array for missing criteria.
   *
   * @param value - TR: Analiz edilecek şifre. / EN: Password to analyze.
   * @returns TR: Şifre güç raporu. / EN: Password strength report.
   */
  calculateStrength(value: string | null): PasswordStrength {
    if (!value || value.length === 0) {
      return {
        score: 0,
        label: 'Boş',
        color: 'gray',
        feedback: ['Şifre girin'],
      };
    }

    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (value.length < 8) feedback.push('En az 8 karakter kullanın');

    // Uppercase
    if (/[A-Z]/.test(value)) score += 0.5;
    else feedback.push('Büyük harf ekleyin');

    // Lowercase
    if (/[a-z]/.test(value)) score += 0.5;
    else feedback.push('Küçük harf ekleyin');

    // Numbers
    if (/[0-9]/.test(value)) score += 0.5;
    else feedback.push('Rakam ekleyin');

    // Special chars
    if (/[^A-Za-z0-9]/.test(value)) score += 0.5;
    else feedback.push('Özel karakter ekleyin');

    // TR: Puanı 0-4 arasına normalize et
    // EN: Normalize score between 0-4
    const normalizedScore = Math.min(4, Math.floor(score)) as 0 | 1 | 2 | 3 | 4;

    const labels: Record<number, string> = {
      0: 'Çok Zayıf',
      1: 'Zayıf',
      2: 'Orta',
      3: 'Güçlü',
      4: 'Çok Güçlü',
    };

    const colors: Record<number, string> = {
      0: 'red',
      1: 'orange',
      2: 'yellow',
      3: 'lime',
      4: 'green',
    };

    return {
      score: normalizedScore,
      label: labels[normalizedScore],
      color: colors[normalizedScore],
      feedback: normalizedScore < 3 ? feedback : [],
    };
  }

  /**
   * TR: Şifre ve Şifre Tekrarı alanlarının eşleşip eşleşmediğini kontrol eder.
   *
   * EN: Checks if the Password and Confirm Password fields match.
   */
  matchesConfirmation(password: string | null, confirmation: string | null): boolean {
    if (!password || !confirmation) return false;
    return password === confirmation;
  }

  /**
   * TR: Rastgele, güçlü bir şifre oluşturur.
   * Her karakter grubundan (Büyük, Küçük, Rakam, Özel) en az bir adet bulunmasını garanti eder.
   * Ardından karakterleri karıştırarak (shuffle) tahmin edilebilirliği azaltır.
   *
   * EN: Generates a random, strong password.
   * Guarantees at least one of each character group (Upper, Lower, Number, Special).
   * Then shuffles the characters to reduce predictability.
   *
   * @param length - TR: Şifre uzunluğu (varsayılan: 16). / EN: Password length (default: 16).
   * @returns TR: Üretilen şifre. / EN: Generated password.
   */
  generateStrongPassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + special;

    let password = '';

    // Her kategoriden en az bir karakter
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Geri kalanı rastgele
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Karıştır (Shuffle)
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}