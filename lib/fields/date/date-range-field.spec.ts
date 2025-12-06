import { DateRangeField } from './date-range-field';

describe('DateRangeField (Expert)', () => {
    let field: DateRangeField;

    beforeEach(() => {
        field = new DateRangeField('vacation', 'Tatil', {
            required: true,
            minRange: 2, // En az 2 gün
            maxRange: 10 // En fazla 10 gün
        });
    });

    it('should validate logical order (start <= end)', () => {
        const state = field.createValue();

        // Hatalı: Bitiş < Başlangıç
        state.value.set({
            start: new Date('2023-01-10'),
            end: new Date('2023-01-05')
        });
        state.touched.set(true);

        expect(state.valid()).toBe(false);
        expect(state.error()).toBe('Başlangıç tarihi bitiş tarihinden büyük olamaz');
    });

    it('should enforce minRange constraint', () => {
        const state = field.createValue();

        // 1 Günlük Aralık (Hatalı, min 2)
        state.value.set({
            start: new Date('2023-01-01'),
            end: new Date('2023-01-01') // Fark 0 gün (veya 1 gün mantığına göre değişir, getDaysDiff farka bakar)
        });
        // getDaysDiff: end - start. Aynı gün = 0 fark.

        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('en az 2 gün');

        // 3 Günlük Aralık (Geçerli)
        state.value.set({
            start: new Date('2023-01-01'),
            end: new Date('2023-01-04') // Fark 3
        });
        expect(state.valid()).toBe(true);
    });

    it('should enforce maxRange constraint', () => {
        const state = field.createValue();

        // 20 Günlük Aralık (Hatalı, max 10)
        state.value.set({
            start: new Date('2023-01-01'),
            end: new Date('2023-01-21')
        });
        state.touched.set(true);

        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('en fazla 10 gün');
    });

    it('should parse string ranges in import', () => {
        const raw = "2023-01-01 - 2023-01-05";
        const result = field.fromImport(raw);

        expect(result).not.toBeNull();
        expect(result?.start).toBeInstanceOf(Date);
        expect(result?.end).toBeInstanceOf(Date);
        expect(result?.start?.getDate()).toBe(1);
        expect(result?.end?.getDate()).toBe(5);
    });

    it('should handle open-ended ranges in presentation', () => {
        // Sadece başlangıç var
        const val = { start: new Date('2023-01-01'), end: null };
        expect(field.present(val)).toContain('ve sonrası');

        // Sadece bitiş var
        const val2 = { start: null, end: new Date('2023-01-01') };
        expect(field.present(val2)).toContain('ve öncesi');
    });
});