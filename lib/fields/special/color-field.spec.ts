import { ColorField } from './color-field';

describe('ColorField (Expert)', () => {
    let field: ColorField;

    beforeEach(() => {
        field = new ColorField('theme', 'Tema Rengi', {
            required: true,
            format: 'hex'
        });
    });

    it('should validate HEX format strictly', () => {
        const state = field.createValue();

        // 1. Geçerli HEX
        state.value.set('#FFFFFF');
        expect(state.valid()).toBe(true);

        // 2. Geçersiz Karakter
        state.value.set('#GG0000'); // G hex değil
        state.touched.set(true);
        expect(state.valid()).toBe(false);

        // 3. Eksik Karakter
        state.value.set('#FFF'); // 3 hane genelde desteklenir ama regex {6} ise patlar
        // Koddaki regex: ^#[0-9A-Fa-f]{6}$
        expect(state.valid()).toBe(false);
    });

    it('should validate Alpha channel if enabled', () => {
        const alphaField = new ColorField('bg', 'Arkaplan', { alpha: true });
        const state = alphaField.createValue();

        // 8 haneli HEX (RGBA)
        state.value.set('#FF000080');
        expect(state.valid()).toBe(true);

        // Alpha kapalıyken 8 hane denersek
        const noAlphaState = field.createValue();
        noAlphaState.value.set('#FF000080');
        noAlphaState.touched.set(true);
        expect(noAlphaState.valid()).toBe(false);
    });

    it('should auto-fix missing hash in Import', () => {
        // Kullanıcı "FF0000" girdi, sistem "#FF0000" yapmalı
        expect(field.fromImport('FF0000')).toBe('#FF0000');

        // Zaten varsa dokunma
        expect(field.fromImport('#0000FF')).toBe('#0000FF');

        // Bozuk veri
        expect(field.fromImport('NotAColor')).toBe('NotAColor'); // Regex tutmazsa olduğu gibi döner
    });

    it('should convert HEX to RGB correctly', () => {
        const rgb = field.hexToRgb('#FF0000'); // Kırmızı
        expect(rgb).toEqual({ r: 255, g: 0, b: 0 });

        const white = field.hexToRgb('#FFFFFF');
        expect(white).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should determine appropriate contrast color (Accessibility)', () => {
        // Siyah üzerine Beyaz metin
        expect(field.getContrastColor('#000000')).toBe('#ffffff');

        // Beyaz üzerine Siyah metin
        expect(field.getContrastColor('#FFFFFF')).toBe('#000000');

        // Açık sarı (#FFFF00) üzerine Siyah
        expect(field.getContrastColor('#FFFF00')).toBe('#000000');
    });

    it('should adjust brightness', () => {
        // Siyahı %50 açarsak Gri olur
        const gray = field.adjustBrightness('#000000', 50);
        // 0 + (0 + 50% * 0) bu formül toplama değil çarpma mantığıyla çalışıyorsa:
        // Kodda: value + (value * percent) / 100
        // Siyah (0) değişmez. Gri (#808080) deneyelim.

        const darkGray = '#808080'; // ~128
        const lighter = field.adjustBrightness(darkGray, 50); // 128 + 64 = 192 -> #C0C0C0
        expect(lighter.toUpperCase()).toBe('#C0C0C0');
    });
});