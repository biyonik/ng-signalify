import { createRepeater, createNestedRepeater, RepeaterItem } from './repeater';
import { TestBed } from '@angular/core/testing';
import { z } from 'zod';

describe('Repeater Logic (Dynamic Lists)', () => {

    const run = (fn: () => void) => TestBed.runInInjectionContext(fn);

    // Test verisi tipi
    interface User extends Record<string, unknown>{
        name: string;
        age: number;
    }

    // Varsayılan veri üretici
    const defaultUser = (): User => ({ name: '', age: 0 });

    it('should initialize empty or with items', () => {
        run(() => {
            // Boş başlat
            const r1 = createRepeater<User>([], { defaultItem: defaultUser });
            expect(r1.count()).toBe(0);
            expect(r1.isEmpty()).toBe(true);

            // Dolu başlat
            const r2 = createRepeater<User>([
                { name: 'Ali', age: 25 },
                { name: 'Veli', age: 30 }
            ], { defaultItem: defaultUser });

            expect(r2.count()).toBe(2);
            expect(r2.isEmpty()).toBe(false);
            expect(r2.values()[0].name).toBe('Ali');
        });
    });

    it('should handle Add/Remove with Limits (Min/Max)', () => {
        run(() => {
            const repeater = createRepeater<User>([], {
                min: 1,
                max: 3,
                defaultItem: defaultUser
            });

            // Başlangıçta min limit (1) kadar otomatik eklemeli
            expect(repeater.count()).toBe(1);

            // Ekle (2 oldu)
            repeater.add({ name: 'User 2' });
            expect(repeater.count()).toBe(2);

            // Ekle (3 oldu - Max sınır)
            repeater.add({ name: 'User 3' });
            expect(repeater.count()).toBe(3);
            expect(repeater.canAdd()).toBe(false);

            // Max limiti aştığı için eklememeli
            repeater.add({ name: 'User 4' });
            expect(repeater.count()).toBe(3);

            // Sil (2 kaldı)
            const idToRemove = repeater.items()[0].id;
            repeater.remove(idToRemove);
            expect(repeater.count()).toBe(2);

            // Hepsini silmeye çalış (Min limit 1 olduğu için sonuncuyu silmemeli)
            repeater.remove(repeater.items()[0].id); // 1 kaldı
            const lastId = repeater.items()[0].id;

            const result = repeater.remove(lastId); // Silinemedi
            expect(result).toBe(false);
            expect(repeater.count()).toBe(1);
        });
    });

    it('should validate items with Zod schema', () => {
        run(() => {
            const schema = z.object({
                name: z.string().min(2, 'İsim kısa'),
                age: z.number().min(18, 'Reşit değil')
            });

            const repeater = createRepeater<User>([], {
                schema,
                defaultItem: defaultUser
            });

            // Geçersiz bir öğe ekle
            const id = repeater.add({ name: 'A', age: 10 }); // Hatalı

            // Henüz "touched" olmadığı için genel valid true olabilir (implementasyona bağlı)
            // Ama biz manuel validateItem çağıralım
            repeater.validateItem(id);

            const item = repeater.getItem(id)!;
            expect(item.errors['name']).toBe('İsim kısa');
            expect(item.errors['age']).toBe('Reşit değil');
            repeater.touchAll();
            expect(repeater.isValid()).toBe(false); // Validasyon çalıştıktan sonra false olmalı

            // Düzeltelim
            repeater.update(id, { name: 'Ahmet', age: 20 });
            repeater.validateItem(id);

            expect(repeater.getItem(id)!.errors).toEqual({});
        });
    });

    it('should handle Move (Drag & Drop Logic)', () => {
        run(() => {
            const repeater = createRepeater<User>([
                { name: '1', age: 1 },
                { name: '2', age: 2 },
                { name: '3', age: 3 }
            ], { sortable: true });

            // [1, 2, 3] -> 1. indexi (2) al, 0. indexe taşı -> [2, 1, 3]
            repeater.move(1, 0);

            const names = repeater.values().map(u => u.name);
            expect(names).toEqual(['2', '1', '3']);
        });
    });

    it('should duplicate an item', () => {
        run(() => {
            const repeater = createRepeater<User>([{ name: 'Original', age: 20 }]);
            const originalId = repeater.items()[0].id;

            repeater.duplicate(originalId);

            expect(repeater.count()).toBe(2);
            expect(repeater.values()[1].name).toBe('Original');
            expect(repeater.items()[1].id).not.toBe(originalId); // ID'ler farklı olmalı
        });
    });

    describe('Nested Repeater (Recursive Power)', () => {
        interface Child extends Record<string, unknown> { title: string; }
        interface Parent extends Record<string, unknown> { group: string; children: Child[]; }

        it('should manage child repeaters lazily', () => {
            run(() => {
                const nested = createNestedRepeater<Parent, Child>([
                    { group: 'G1', children: [{ title: 'C1' }] }
                ], {
                    defaultItem: () => ({ group: '', children: [] }),
                    childKey: 'children',
                    childConfig: { defaultItem: () => ({ title: '' }) }
                });

                const parentItem = nested.parent.items()[0];

                // Child repeater'ı getir (Lazy init)
                const childRepeater = nested.getChildRepeater(parentItem.id);
                expect(childRepeater).toBeDefined();
                expect(childRepeater?.count()).toBe(1);
                expect(childRepeater?.values()[0].title).toBe('C1');

                // Child ekle
                childRepeater?.add({ title: 'C2' });

                // Tüm veriyi çek (Parent + Children birleşmiş halde)
                const allData = nested.getAllValues();
                expect(allData[0].children.length).toBe(2);
                expect(allData[0].children[1].title).toBe('C2');
            });
        });
    });
});