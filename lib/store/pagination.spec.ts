import { createPagination } from './pagination';
import { TestBed } from '@angular/core/testing';

describe('Pagination Logic (The Mathematical Core)', () => {

    // Sinyalleri kullanacağımız için Injection Context içinde çalıştırıyoruz
    const run = (fn: () => void) => TestBed.runInInjectionContext(fn);

    it('should initialize with default values', () => {
        run(() => {
            const p = createPagination();

            expect(p.page()).toBe(1);
            expect(p.pageSize()).toBe(10);
            expect(p.total()).toBe(0);
            expect(p.totalPages()).toBe(0);
        });
    });

    it('should calculate start and end indexes correctly', () => {
        run(() => {
            const p = createPagination({ initialPageSize: 10 });
            p.setTotal(55); // Toplam 55 kayıt

            // Sayfa 1: 0..10 (exclusive end için slice mantığı genelde böyledir ama kodunda inclusive mi bakalım)
            // Kodun: endIndex = Math.min(startIndex + pageSize, total) -> Yani 10. (Slice için uygun)

            // Page 1
            expect(p.startIndex()).toBe(0);
            expect(p.endIndex()).toBe(10);

            // Page 2
            p.setPage(2);
            expect(p.startIndex()).toBe(10);
            expect(p.endIndex()).toBe(20);

            // Son Sayfa (Page 6) -> 55 kayıtta, 10'arlı sayfada: 10,10,10,10,10,5
            p.setPage(6);
            expect(p.startIndex()).toBe(50);
            expect(p.endIndex()).toBe(55); // Total'i geçmemeli
        });
    });

    it('should handle page navigation (Next/Prev/First/Last)', () => {
        run(() => {
            const p = createPagination({ initialPageSize: 10 });
            p.setTotal(100); // 10 Sayfa

            // Next
            p.nextPage();
            expect(p.page()).toBe(2);

            // Last
            p.lastPage();
            expect(p.page()).toBe(10);
            expect(p.hasNext()).toBe(false);

            // Next (Sonda iken gitmemeli)
            p.nextPage();
            expect(p.page()).toBe(10);

            // Prev
            p.prevPage();
            expect(p.page()).toBe(9);

            // First
            p.firstPage();
            expect(p.page()).toBe(1);
            expect(p.hasPrev()).toBe(false);
        });
    });

    it('should validate boundaries (Clamp Logic)', () => {
        run(() => {
            const p = createPagination({ initialPageSize: 10 });
            p.setTotal(50); // 5 Sayfa

            // Eksi sayfa
            p.setPage(-99);
            expect(p.page()).toBe(1);

            // Limit aşımı
            p.setPage(999);
            expect(p.page()).toBe(5);
        });
    });

    it('should adjust page when total changes drastically', () => {
        run(() => {
            const p = createPagination({ initialPageSize: 10 });
            p.setTotal(100); // 10 Sayfa
            p.setPage(10);   // Son sayfadayız

            // Veri azaldı, toplam 20 kayıt kaldı (2 sayfa)
            // Biz 10. sayfadaydık, otomatik olarak 2. sayfaya düşmeliyiz.
            p.setTotal(20);

            expect(p.page()).toBe(2);
            expect(p.totalPages()).toBe(2);
        });
    });

    it('should reset page to 1 when page size changes', () => {
        run(() => {
            const p = createPagination({ initialPageSize: 10, initialPage: 5 });
            p.setTotal(100);

            // Kullanıcı "Görünüm: 50" yaptı
            p.setPageSize(50);

            expect(p.page()).toBe(1); // Sayfa 1'e dönmeli, yoksa kullanıcı boşlukta kalır
            expect(p.totalPages()).toBe(2);
        });
    });

    describe('Sliding Window Algorithm (The Smart Part)', () => {
        // Bu algoritma UI'da [1, 2, 3, 4, 5] gibi butonları çizer.

        it('should show all pages if total is less than max limit', () => {
            run(() => {
                // Max buton: 5, Toplam Sayfa: 3
                const p = createPagination({ maxPageButtons: 5, initialPageSize: 10 });
                p.setTotal(30);

                expect(p.pageRange()).toEqual([1, 2, 3]);
            });
        });

        it('should show correct range at the BEGINNING', () => {
            run(() => {
                // Max buton: 5, Toplam Sayfa: 20
                const p = createPagination({ maxPageButtons: 5, initialPageSize: 10 });
                p.setTotal(200);

                p.setPage(1);
                expect(p.pageRange()).toEqual([1, 2, 3, 4, 5]);

                p.setPage(2);
                expect(p.pageRange()).toEqual([1, 2, 3, 4, 5]);

                p.setPage(3); // Tam orta (3), hala 1-5 aralığı uygun
                expect(p.pageRange()).toEqual([1, 2, 3, 4, 5]);
            });
        });

        it('should show correct range in the MIDDLE', () => {
            run(() => {
                const p = createPagination({ maxPageButtons: 5, initialPageSize: 10 });
                p.setTotal(200);

                // Sayfa 10 -> [8, 9, 10, 11, 12] olmalı
                p.setPage(10);
                expect(p.pageRange()).toEqual([8, 9, 10, 11, 12]);
            });
        });

        it('should show correct range at the END', () => {
            run(() => {
                const p = createPagination({ maxPageButtons: 5, initialPageSize: 10 });
                p.setTotal(200); // 20 Sayfa

                // Son sayfa (20) -> [16, 17, 18, 19, 20]
                p.setPage(20);
                expect(p.pageRange()).toEqual([16, 17, 18, 19, 20]);

                // 19 -> [16, 17, 18, 19, 20]
                p.setPage(19);
                expect(p.pageRange()).toEqual([16, 17, 18, 19, 20]);
            });
        });
    });
});