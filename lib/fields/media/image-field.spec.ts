import { ImageField } from './image-field';

describe('ImageField (Expert)', () => {
    let field: ImageField;

    beforeEach(() => {
        field = new ImageField('avatar', 'Profil', {
            maxImages: 1,
            dimensions: {
                maxWidth: 1000,
                aspectRatio: 1 // Kare zorunluluğu
            }
        });
    });

    it('should validate async image dimensions (Mocking Image API)', async () => {
        // --- MOCK SETUP ---
        const mockFile = new File([''], 'test.png', { type: 'image/png' });
        global.URL.createObjectURL = jest.fn(() => 'blob:mock');
        global.URL.revokeObjectURL = jest.fn();

        // Image constructor ve onload mock
        // Not: Bu yapı Jest ortamında Image API'sini simüle eder
        const originalImage = global.Image;
        class MockImage {
            onload: () => void = () => {};
            width = 0;
            height = 0;
            set src(_: string) {
                // src set edildiğinde onload'ı tetikle
                setTimeout(() => this.onload(), 0);
            }
        }
        (global as any).Image = MockImage;

        // 1. Valid Case (500x500 Kare)
        const validPromise = field.validateImage(mockFile);
        // MockImage instance'ına ulaşıp boyutları set etmemiz lazım ama
        // kod içinde new Image() yapıldığı için instance'ı dışarıdan yakalamak zor.
        // Alternatif: MockImage prototype'ına varsayılan değerleri verelim veya
        // validateDimensions metodunu (private olsa da) dolaylı test edelim.

        // Daha temiz yöntem: validateImage metodunu çağırdığında oluşan Image'ın boyutlarını kontrol etmek.
        // Ancak ImageField içinde new Image() local scope'ta.
        // Bu yüzden MockImage sınıfını manipüle edilebilir yapalım:

        let currentMockImageInstance: any;
        (global as any).Image = class {
            onload: any;
            width = 0;
            height = 0;
            constructor() { currentMockImageInstance = this; }
            set src(v: string) { setTimeout(() => this.onload && this.onload(), 0); }
        };

        // Test 1: Geçerli (500x500)
        const p1 = field.validateImage(mockFile);
        currentMockImageInstance.width = 500;
        currentMockImageInstance.height = 500;
        expect(await p1).toBeNull();

        // Test 2: Geçersiz Oran (500x300 -> Kare değil)
        const p2 = field.validateImage(mockFile);
        currentMockImageInstance.width = 500;
        currentMockImageInstance.height = 300;
        const err2 = await p2;
        expect(err2).toContain('Resim oranı 1:1 olmalı');

        // Test 3: Max Width Hatası (1200px)
        const p3 = field.validateImage(mockFile);
        currentMockImageInstance.width = 1200;
        currentMockImageInstance.height = 1200;
        const err3 = await p3;
        expect(err3).toContain('en fazla 1000px');

        // --- TEARDOWN ---
        (global as any).Image = originalImage;
    });

    it('should reorder images (Drag & Drop Logic)', () => {
        const img1 = { id: '1', name: '1.jpg', url: 'u1', size: 0 };
        const img2 = { id: '2', name: '2.jpg', url: 'u2', size: 0 };
        const img3 = { id: '3', name: '3.jpg', url: 'u3', size: 0 };
        const list = [img1, img2, img3];

        // 1. resmi (index 0) sona (index 2) taşı
        const reordered = field.reorderImages(list, 0, 2);

        expect(reordered[0].id).toBe('2');
        expect(reordered[1].id).toBe('3');
        expect(reordered[2].id).toBe('1');
    });

    it('should return correct thumbnail or fallback', () => {
        // Thumbnail varsa onu dön
        const withThumb = { id: '1', name: 'a', url: 'full.jpg', thumbnailUrl: 'thumb.jpg', size: 0 };
        expect(field.getThumbnail(withThumb)).toBe('thumb.jpg');

        // Thumbnail yoksa orijinali dön
        const noThumb = { id: '1', name: 'a', url: 'full.jpg', size: 0 };
        expect(field.getThumbnail(noThumb)).toBe('full.jpg');

        // Hiçbiri yoksa fallback dön
        expect(field.getThumbnail(null, 'default.png')).toBe('default.png');
    });

    it('should generate accept string correctly', () => {
        // Varsayılan: jpeg, png, gif, webp
        expect(field.getAcceptString()).toContain('image/jpeg');

        // Özel config
        const customField = new ImageField('custom', 'Custom', { accept: ['image/png'] });
        expect(customField.getAcceptString()).toBe('image/png');
    });
});