import { PasswordField } from './password-field';

describe('PasswordField (Expert)', () => {
    let field: PasswordField;

    beforeEach(() => {
        field = new PasswordField('pwd', 'Şifre', {
            required: true,
            minLength: 8,
            requireUppercase: true,
            requireNumber: true
        });
    });

    it('should mask value in Presentation and Export (Security)', () => {
        const secret = 'SuperSecret123';

        // Ekranda asla görünmemeli
        expect(field.present(secret)).toBe('••••••••');

        // Excel çıktısında asla görünmemeli
        expect(field.toExport(secret)).toBe('********');
    });

    it('should PREVENT import (Security)', () => {
        // Dışarıdan şifre import edilemez
        expect(field.fromImport('hacked')).toBeNull();
    });

    it('should validate complexity rules', () => {
        const state = field.createValue();

        // 1. Kısa
        state.value.set('Abc1');
        state.touched.set(true);
        expect(state.valid()).toBe(false); // minLength: 8

        // 2. Büyük harf yok
        state.value.set('abcdefg1');
        expect(state.valid()).toBe(false);

        // 3. Rakam yok
        state.value.set('Abcdefgh');
        expect(state.valid()).toBe(false);

        // 4. Geçerli
        state.value.set('Abcdefg1');
        expect(state.valid()).toBe(true);
    });

    it('should calculate strength score correctly', () => {
        // Zayıf: Kısa, sadece harf
        const weak = field.calculateStrength('abc');
        expect(weak.score).toBeLessThan(2);
        expect(weak.label).toMatch(/Zayıf/);

        // Güçlü: Uzun, Büyük/Küçük/Sayı/Özel
        const strong = field.calculateStrength('StrongP@ssw0rd!');
        expect(strong.score).toBeGreaterThanOrEqual(3);
        expect(strong.color).toMatch(/green|lime/);
    });

    it('should generate strong passwords matching criteria', () => {
        const generated = field.generateStrongPassword(16);

        expect(generated.length).toBe(16);
        expect(/[A-Z]/.test(generated)).toBe(true); // Büyük harf var mı?
        expect(/[0-9]/.test(generated)).toBe(true); // Rakam var mı?
        expect(/[!@#$%^&*]/.test(generated)).toBe(true); // Özel karakter var mı?
    });
});