import { FileField } from './file-field';

describe('FileField (Expert)', () => {
    let field: FileField;

    beforeEach(() => {
        field = new FileField('documents', 'Belgeler', {
            required: true,
            multiple: true,
            maxFiles: 3,
            maxSize: 1024 * 1024 * 5, // 5MB
            accept: ['.pdf', 'image/*'] // Karışık tip testi
        });
    });

    it('should validate maxFiles constraint in schema', () => {
        const state = field.createValue();
        const mockFile = { id: '1', name: 'f.pdf', url: 'u', size: 100, mimeType: 'app/pdf' };

        // 1. Geçerli Sayı (2 dosya)
        state.value.set([mockFile, mockFile]);
        expect(state.valid()).toBe(true);

        // 2. Sınır Aşımı (4 dosya)
        state.value.set([mockFile, mockFile, mockFile, mockFile]);
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('En fazla 3 dosya');
    });

    it('should validate browser-side file constraints (validateFile)', () => {
        // Mock File Objects
        const validPdf = new File([''], 'doc.pdf', { type: 'application/pdf' });
        const validImg = new File([''], 'pic.jpg', { type: 'image/jpeg' });
        const invalidType = new File([''], 'script.js', { type: 'application/javascript' });
        const tooBig = new File([''], 'big.pdf', { type: 'application/pdf' });

        // Size hack: File size readonly'dir, defineProperty ile eziyoruz
        Object.defineProperty(tooBig, 'size', { value: 1024 * 1024 * 6 }); // 6MB

        // 1. PDF Kabul (Direct Match)
        expect(field.validateFile(validPdf)).toBeNull();

        // 2. Image Wildcard Kabul (image/jpeg -> image/*)
        expect(field.validateFile(validImg)).toBeNull();

        // 3. Geçersiz Tip Reddi
        expect(field.validateFile(invalidType)).toContain('İzin verilen dosya tipleri');

        // 4. Boyut Reddi
        expect(field.validateFile(tooBig)).toContain('en fazla 5 MB');
    });

    it('should handle Import logic (URL -> Mock FileRef)', () => {
        const url = 'https://example.com/uploads/contract.pdf';
        const result = field.fromImport(url);

        // Single mode testi için yeni field
        const singleField = new FileField('single', 'Tek', { multiple: false });
        const singleResult = singleField.fromImport(url) as any;

        expect(singleResult).not.toBeNull();
        expect(singleResult.url).toBe(url);
        expect(singleResult.name).toBe('contract.pdf'); // URL'den isim çıkarma
        expect(singleResult.mimeType).toBe('application/octet-stream'); // Bilinmiyor
    });

    it('should format file size readable', () => {
        expect(field.formatSize(500)).toBe('500 B');
        expect(field.formatSize(1024)).toBe('1 KB');
        expect(field.formatSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('should manage immutable list operations (add/remove)', () => {
        const f1 = { id: '1', name: 'a', url: 'a', size: 1, mimeType: 'a' };
        const f2 = { id: '2', name: 'b', url: 'b', size: 1, mimeType: 'b' };

        // Add
        const addedList = field.addFile([f1], f2);
        expect(addedList).toHaveLength(2);
        expect(addedList[1].id).toBe('2');

        // Remove
        const removedList = field.removeFile(addedList, '1');
        expect(removedList).toHaveLength(1);
        expect(removedList[0].id).toBe('2');
    });
});