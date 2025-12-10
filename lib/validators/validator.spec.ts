import {
    tcKimlikNo,
    phoneNumber,
    iban,
    plaka,
    strongPassword,
    Validators
} from './validators';

describe('Turkish Validators (Expert)', () => {

    describe('TC Kimlik No', () => {
        it('should validate correct TCKN', () => {
            // Gerçek algoritma ile üretilmiş geçerli bir TCKN (Örnek)
            // Algoritma: 10000000146 (11 hane, algoritma tutar)
            // Not: Gerçek hayatta geçerli birini bulmak lazım veya algoritmayı mocklamak yerine
            // algoritmanın tersini hesaplayıp valid bir numara üretelim.
            // Basitlik için bilinen bir valid numara kullanalım:
            // (Algoritma gereği son haneler 46 olan rastgele valid numara)
            const validTC = '10000000146';
            expect(tcKimlikNo.safeParse(validTC).success).toBe(true);
        });

        it('should fail if length is not 11', () => {
            expect(tcKimlikNo.safeParse('12345').success).toBe(false);
            expect(tcKimlikNo.safeParse('123456789012').success).toBe(false);
        });

        it('should fail if starts with 0', () => {
            expect(tcKimlikNo.safeParse('01234567890').success).toBe(false);
        });

        it('should fail checksum validation (Last digits)', () => {
            const invalidTC = '10000000147'; // Son hane yanlış
            expect(tcKimlikNo.safeParse(invalidTC).success).toBe(false);
        });
    });

    describe('IBAN', () => {
        it('should validate and transform to Uppercase', () => {
            // Geçerli bir TR IBAN - checksum doğru olmalı
            // TR + 2 checksum digit + 5 banka kodu + 1 rezerv + 16 hesap no
            // Geçerli IBAN: TR330006100519786457841326
            const validIban = 'tr330006100519786457841326';
            const result = iban.safeParse(validIban);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(validIban.toUpperCase());
            }
        });

        it('should fail for non-TR IBANs', () => {
            expect(iban.safeParse('DE123456789012345678901234').success).toBe(false);
        });

        it('should fail for invalid IBAN checksum', () => {
            // Yanlış checksum ile IBAN
            const invalidIban = 'TR123456789012345678901234';
            expect(iban.safeParse(invalidIban).success).toBe(false);
        });
    });

    describe('Plaka', () => {
        it('should validate correct plates', () => {
            expect(plaka.safeParse('34ABC123').success).toBe(true);
            expect(plaka.safeParse('06A1234').success).toBe(true);
            expect(plaka.safeParse('81zz999').success).toBe(true); // Lowercase input
        });

        it('should fail for invalid city codes', () => {
            expect(plaka.safeParse('99ABC123').success).toBe(false); // 99 yok
            expect(plaka.safeParse('00ABC123').success).toBe(false); // 00 yok
        });
    });

    describe('Dynamic Validators', () => {
        it('should validate ranges', () => {
            const range = Validators.range(10, 20);
            expect(range.safeParse(15).success).toBe(true);
            expect(range.safeParse(5).success).toBe(false);
            expect(range.safeParse(25).success).toBe(false);
        });

        it('should validate oneOf (Enum)', () => {
            const options = Validators.oneOf(['A', 'B']);
            expect(options.safeParse('A').success).toBe(true);
            expect(options.safeParse('C').success).toBe(false);
        });
    });
});