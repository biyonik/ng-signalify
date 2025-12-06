import { createAsyncValidator } from './async-validator';

describe('AsyncValidator (Expert)', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should debounce validation requests', async () => {
        const mockFn = jest.fn().mockResolvedValue(null);
        const validator = createAsyncValidator(mockFn, 500); // 500ms gecikme

        // Hızlıca 3 kez çağır
        validator.validate('a');
        validator.validate('ab');
        validator.validate('abc');

        // Henüz çağrılmamalı
        expect(mockFn).not.toHaveBeenCalled();

        // Süreyi ilerlet
        jest.advanceTimersByTime(550);

        // Sadece sonuncusu çağrılmalı (Debounce)
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('abc');
    });

    it('should handle race conditions (Cancellation)', async () => {
        // Yavaş cevap veren bir mock (1000ms)
        const slowMock = jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(null), 1000))
        );

        const validator = createAsyncValidator(slowMock, 0); // Debounce yok

        // 1. İstek (Yavaş)
        const p1 = validator.validate('slow');
        jest.advanceTimersByTime(10); // İstek başladı

        // 2. İstek (Hızlıca araya girdi)
        const p2 = validator.validate('fast');

        // Zamanı ilerlet (1. istek bitse bile sonucu işlenmemeli)
        jest.advanceTimersByTime(2000);
        await p1;
        await p2;

        // İlk istek iptal edildiği için sonucu 'null' değil, iptal olmalı (veya sessizce bitmeli)
        // Kodda abortController.signal.aborted kontrolü var, yani error signal'i güncellenmemeli.
        // Ancak ikinci istek (fast) sonucu güncellemeli.

        expect(validator.validating()).toBe(false);
        expect(slowMock).toHaveBeenCalledTimes(2);
    });

    it('should set error on failure', async () => {
        const errorMock = jest.fn().mockResolvedValue('Kullanıcı adı dolu');
        const validator = createAsyncValidator(errorMock, 0);

        validator.validate('taken_user');
        jest.runAllTimers();

        // Promise chain'in tamamlanması için flush
        await Promise.resolve();

        expect(validator.error()).toBe('Kullanıcı adı dolu');
    });
});