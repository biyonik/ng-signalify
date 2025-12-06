import { DateField } from './date-field';

describe('DateField (Expert & Type Safe)', () => {
    let field: DateField;

    beforeEach(() => {
        field = new DateField('birthDate', 'Doğum Tarihi', {
            required: true,
            min: new Date('2000-01-01'),
            max: new Date('2025-12-31')
        });
    });

    it('should initialize with correct config', () => {
        expect(field.config.min).toEqual(new Date('2000-01-01'));
        expect(field.config.max).toEqual(new Date('2025-12-31'));
    });

    it('should validate min/max date constraints', () => {
        const state = field.createValue();

        // 1. Min Sınır Hatası (1999)
        state.value.set(new Date('1999-12-31'));
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('2000'); // Hata mesajında tarih geçmeli

        // 2. Geçerli Tarih (2010)
        state.value.set(new Date('2010-05-15'));
        expect(state.valid()).toBe(true);

        // 3. Max Sınır Hatası (2026)
        state.value.set(new Date('2026-01-01'));
        expect(state.valid()).toBe(false);
    });

    it('should handle presentation correctly', () => {
        // Düzeltildi: present() Date bekler, string değil.
        const date = new Date('2023-05-15');
        // Varsayılan locale tr-TR ve format dd.MM.yyyy olduğu varsayımıyla:
        expect(field.present(date)).toBe('15.05.2023');

        expect(field.present(null)).toBe('-');
    });

    it('should handle Excel serial numbers in import', () => {
        // Excel'de 44567 -> 06.01.2022 (yaklaşık)
        // 1 -> 31.12.1899
        // Test için basit bir değer:
        const serial = 44927; // 2023-01-01
        const imported = field.fromImport(serial);

        expect(imported).toBeInstanceOf(Date);
        expect(imported?.getFullYear()).toBe(2023);
    });

    it('should parse ISO strings in import', () => {
        const imported = field.fromImport('2023-10-29');
        expect(imported).toBeInstanceOf(Date);
        expect(imported?.getFullYear()).toBe(2023);
        expect(imported?.getMonth()).toBe(9); // 0-based index (Ekim)
        expect(imported?.getDate()).toBe(29);
    });

    it('should correctly identify date logic (Today, Past, Future)', () => {
        const today = new Date();
        const past = new Date('2000-01-01');
        const future = new Date('2099-01-01');

        expect(field.isToday(today)).toBe(true);
        expect(field.isToday(past)).toBe(false);

        expect(field.isPast(past)).toBe(true);
        expect(field.isPast(future)).toBe(false);

        expect(field.isFuture(future)).toBe(true);
        expect(field.isFuture(past)).toBe(false);
    });
});