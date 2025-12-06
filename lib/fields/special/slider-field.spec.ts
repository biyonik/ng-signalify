import { SliderField } from './slider-field';

describe('SliderField (Expert)', () => {
    let field: SliderField;

    beforeEach(() => {
        field = new SliderField('volume', 'Ses', {
            min: 0,
            max: 100,
            step: 10,
            range: false // Single mode
        });
    });

    it('should validate steps (MultipleOf)', () => {
        const state = field.createValue();

        // 1. Geçerli Adım (10, 20, 30...)
        state.value.set(50);
        expect(state.valid()).toBe(true);

        // 2. Geçersiz Adım (15)
        state.value.set(15);
        state.touched.set(true);
        expect(state.valid()).toBe(false); // 10'un katı olmalı
        expect(state.error()).toContain('katı olmalı');
    });

    it('should validate Range Mode logic', () => {
        const rangeField = new SliderField('price', 'Fiyat', {
            min: 0,
            max: 1000,
            range: true // Range mode
        });
        const state = rangeField.createValue();

        // 1. Geçerli Aralık
        state.value.set([100, 500]);
        expect(state.valid()).toBe(true);

        // 2. Hatalı Aralık (Start > End)
        state.value.set([600, 200]);
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('büyük olamaz');
    });

    it('should parse string ranges in Import', () => {
        const imported = field.fromImport("20 - 80");
        // Config range:false olduğu için single number döner mi yoksa tuple mı?
        // Kodda: fromImport array dönüyor (string check ile).
        // Ancak createValue tipi config'e göre değişmeli.
        // Runtime'da tuple dönerse ve config single ise type error çıkmaz ama mantık hatası olabilir.
        // Test, metodun ne döndüğünü kontrol eder:
        expect(imported).toEqual([20, 80]);
    });

    it('should calculate CSS percentages correctly', () => {
        // 0-100 arasında 50 -> %50
        expect(field.toPercent(50)).toBe(50);

        // Min: 100, Max: 200 arasında 150 -> %50 olmalı
        const offsetField = new SliderField('x', 'y', { min: 100, max: 200 });
        expect(offsetField.toPercent(150)).toBe(50);
    });

    it('should snap values to step', () => {
        // Step: 10. Gelen: 14 -> 10, 16 -> 20
        expect(field.snapToStep(14)).toBe(10);
        expect(field.snapToStep(16)).toBe(20);
        expect(field.snapToStep(5)).toBe(10); // Yuvarlama mantığına göre (Math.round)
    });

    it('should clamp values within bounds', () => {
        expect(field.clamp(-50)).toBe(0);   // Min altı -> Min
        expect(field.clamp(150)).toBe(100); // Max üstü -> Max
        expect(field.clamp(50)).toBe(50);   // Arada -> Kendisi
    });
});