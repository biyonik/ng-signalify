import { ArrayField } from './array-field';
import { StringField } from '../primitives/string-field';

describe('ArrayField (Complex)', () => {
    let field: ArrayField;
    const itemFields = [
        new StringField('name', 'İsim', { required: true })
    ];

    beforeEach(() => {
        field = new ArrayField('users', 'Kullanıcılar', itemFields, {
            min: 1,
            max: 3
        });
    });

    it('should initialize state with default items', () => {
        const arrayState = field.createArrayState([{ name: 'Ali' }]);

        expect(arrayState.count()).toBe(1);
        expect(arrayState.values()[0]).toEqual({ name: 'Ali' });
    });

    it('should manage Add/Remove logic with limits', () => {
        const arrayState = field.createArrayState(); // Başlangıç boş

        // Min 1 olduğu için clear() veya boş başlangıç, min kadar boş eleman ekleyebilir
        // Kod implementasyonuna göre clear() min kadar eleman ekliyor.
        // Ancak createArrayState boş ise boştur (veya min kontrolü yapar, koda bakmak lazım).
        // Test edelim:

        // Ekleme
        arrayState.add({ name: 'Veli' });
        expect(arrayState.count()).toBe(1);

        // Max sınıra kadar ekle (Max: 3)
        arrayState.add({ name: 'Ayşe' });
        arrayState.add({ name: 'Fatma' });
        expect(arrayState.count()).toBe(3);

        // Sınır aşıldı, ekleme yapmamalı
        arrayState.add({ name: 'Hayri' });
        expect(arrayState.count()).toBe(3); // Hala 3 olmalı
        expect(arrayState.canAdd()).toBe(false);
    });

    it('should validate entire array schema', () => {
        const state = field.createValue();

        // 1. Min Hatası (Boş)
        state.value.set([]);
        state.touched.set(true);
        expect(state.valid()).toBe(false);

        // 2. Item Validasyonu (İsim zorunlu)
        // ArrayField schema() metodu item'ların şemasını da içerir
        state.value.set([{ name: null }] as any); // Boş isim
        state.touched.set(true);
        expect(state.valid()).toBe(false);

        // 3. Geçerli
        state.value.set([{ name: 'Doğru' }]);
        expect(state.valid()).toBe(true);
    });

    it('should reorder items', () => {
        const arrayState = field.createArrayState([
            { name: '1' },
            { name: '2' },
            { name: '3' }
        ]);

        // 0. indeksi 2. indekse taşı (1 sona gitsin)
        arrayState.move(0, 2);

        const values = arrayState.values();
        expect(values[0]["name"]).toBe('2');
        expect(values[1]["name"]).toBe('3');
        expect(values[2]["name"]).toBe('1');
    });
});