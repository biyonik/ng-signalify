import { TimeField } from './time-field';

describe('TimeField (Expert)', () => {
    let field: TimeField;

    beforeEach(() => {
        field = new TimeField('shift', 'Vardiye', {
            required: true,
            min: '09:00',
            max: '18:00',
            format24h: true
        });
    });

    it('should validate time boundaries logic', () => {
        const state = field.createValue();

        // 1. Min Sınırından Önce (08:59)
        state.value.set({ hours: 8, minutes: 59 });
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('09:00');

        // 2. Tam Sınır (09:00)
        state.value.set({ hours: 9, minutes: 0 });
        expect(state.valid()).toBe(true);

        // 3. Max Sınırından Sonra (18:01)
        state.value.set({ hours: 18, minutes: 1 });
        state.touched.set(true); // Re-trigger validation check logic
        expect(state.valid()).toBe(false);
    });

    it('should format 12h/24h correctly', () => {
        // 24h Format (Varsayılan)
        const time = { hours: 14, minutes: 5 };
        expect(field.present(time)).toBe('14:05');

        // 12h Format Testi
        const field12 = new TimeField('t12', 'Time', { format24h: false });
        expect(field12.present({ hours: 14, minutes: 30 })).toBe('2:30 PM');
        expect(field12.present({ hours: 0, minutes: 15 })).toBe('12:15 AM');
    });

    it('should parse Excel fractional day', () => {
        // 0.5 = 12:00
        // 0.75 = 18:00
        const result = field.fromImport(0.75);

        expect(result).toEqual({ hours: 18, minutes: 0 });
    });

    it('should parse string input "HH:mm"', () => {
        const result = field.fromImport("14:30");
        expect(result).toEqual({ hours: 14, minutes: 30, seconds: undefined });
    });

    it('should convert helper methods (toMinutes, fromMinutes)', () => {
        // 01:30 = 90 dakika
        const time = { hours: 1, minutes: 30 };
        const mins = field.toMinutes(time);
        expect(mins).toBe(90);

        const backToTime = field.fromMinutes(90);
        expect(backToTime).toEqual(expect.objectContaining({ hours: 1, minutes: 30 }));
    });
});