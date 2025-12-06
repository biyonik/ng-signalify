import { DateTimeField } from './date-time-field';

describe('DateTimeField (Expert)', () => {
    let field: DateTimeField;

    beforeEach(() => {
        field = new DateTimeField('meeting', 'Toplantı', {
            required: true,
            min: new Date('2023-01-01T09:00:00'),
            max: new Date('2023-12-31T18:00:00'),
            showSeconds: true
        });
    });

    it('should validate full date-time boundaries', () => {
        const state = field.createValue();

        // 1. Min Sınırından Önce (Tarih aynı, saat geri)
        // 2023-01-01 08:59:59
        const tooEarly = new Date('2023-01-01T08:59:59');
        state.value.set(tooEarly);
        state.touched.set(true);

        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('en erken');

        // 2. Tam Sınır (Geçerli)
        state.value.set(new Date('2023-01-01T09:00:00'));
        expect(state.valid()).toBe(true);

        // 3. Max Sınırından Sonra
        const tooLate = new Date('2024-01-01T09:00:00');
        state.value.set(tooLate);
        expect(state.valid()).toBe(false);
    });

    it('should format presentation with timezone', () => {
        // Timezone testi için yeni bir instance oluşturuyoruz
        const tzField = new DateTimeField('tz', 'Zaman', {
            timezone: 'America/New_York', // UTC-5 (veya DST'ye göre -4)
            locale: 'en-US'
        });

        // UTC: 12:00
        const date = new Date('2023-06-01T12:00:00Z');

        // NY Yaz saati (EDT) UTC-4 -> 08:00 AM olmalı
        const presented = tzField.present(date);
        expect(presented).toContain('8'); // 08:00
        expect(presented).toMatch(/AM|PM/);
    });

    it('should parse Excel fractional date-time', () => {
        // Excel: 44567.5 -> Tarih + Yarım Gün (12:00)
        // 44567 = 6 Ocak 2022 (Yaklaşık, Excel epoch'a göre)
        const val = 44567.5;
        const result = field.fromImport(val);

        expect(result).toBeInstanceOf(Date);
        expect(result?.getUTCHours()).toBe(12);
        expect(result?.getMinutes()).toBe(0);
    });

    it('should calculate relative time correctly', () => {
        const now = new Date();
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const relative = field.getRelativeTime(fiveMinsAgo);
        // Locale tr-TR varsayılanı ile:
        expect(relative).toMatch(/5 dakika önce/);
    });
});