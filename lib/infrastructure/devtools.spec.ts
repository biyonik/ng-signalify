import { signal } from '@angular/core';
import {
    DevTools,
    deepFreeze, assert
} from './devtools';

describe('DevTools', () => {
    let devTools: DevTools;

    beforeEach(() => {
        devTools = new DevTools({
            enabled: true,
            logLevel: 'debug',
            maxEntries: 100,
            consoleOutput: false, // Test sırasında console spam olmasın
            trackPerformance: true,
            trackSignals: true,
        });
    });

    describe('logging', () => {
        it('debug log kaydedilmeli', () => {
            devTools.debug('Test', 'Debug mesajı', { extra: 'data' });

            const logs = devTools.getLogs()();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('debug');
            expect(logs[0].category).toBe('Test');
            expect(logs[0].message).toBe('Debug mesajı');
            expect(logs[0].data).toEqual({ extra: 'data' });
        });

        it('info log kaydedilmeli', () => {
            devTools.info('Test', 'Info mesajı');

            const logs = devTools.getLogs()();
            expect(logs[0].level).toBe('info');
        });

        it('warn log kaydedilmeli', () => {
            devTools.warn('Test', 'Warning mesajı');

            const logs = devTools.getLogs()();
            expect(logs[0].level).toBe('warn');
        });

        it('error log stack trace içermeli', () => {
            devTools.error('Test', 'Error mesajı');

            const logs = devTools.getLogs()();
            expect(logs[0].level).toBe('error');
            expect(logs[0].stack).toBeDefined();
        });

        it('maxEntries aşılınca eski loglar silinmeli', () => {
            const smallDevTools = new DevTools({ maxEntries: 3, consoleOutput: false });

            smallDevTools.info('Cat', 'Msg 1');
            smallDevTools.info('Cat', 'Msg 2');
            smallDevTools.info('Cat', 'Msg 3');
            smallDevTools.info('Cat', 'Msg 4');

            const logs = smallDevTools.getLogs()();
            expect(logs).toHaveLength(3);
            expect(logs[0].message).toBe('Msg 2');
        });

        it('clearLogs tüm logları temizlemeli', () => {
            devTools.info('Test', 'Msg 1');
            devTools.info('Test', 'Msg 2');

            devTools.clearLogs();

            expect(devTools.getLogs()()).toHaveLength(0);
        });

        it('filteredLogs log seviyesine göre filtrelemeli', () => {
            const warnDevTools = new DevTools({ logLevel: 'warn', consoleOutput: false });

            warnDevTools.debug('Cat', 'Debug');
            warnDevTools.info('Cat', 'Info');
            warnDevTools.warn('Cat', 'Warn');
            warnDevTools.error('Cat', 'Error');

            expect(warnDevTools.filteredLogs()).toHaveLength(2);
            expect(warnDevTools.filteredLogs()[0].level).toBe('warn');
            expect(warnDevTools.filteredLogs()[1].level).toBe('error');
        });

        it('errorCount ve warnCount doğru hesaplanmalı', () => {
            devTools.info('Cat', 'Info');
            devTools.warn('Cat', 'Warn 1');
            devTools.warn('Cat', 'Warn 2');
            devTools.error('Cat', 'Error');

            expect(devTools.errorCount()).toBe(1);
            expect(devTools.warnCount()).toBe(2);
        });

        it('exportLogs JSON formatında dışa aktarmalı', () => {
            devTools.info('Test', 'Message');

            const exported = devTools.exportLogs();
            const parsed = JSON.parse(exported);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].message).toBe('Message');
        });
    });

    describe('performance', () => {
        it('startTimer ve endTimer süre ölçmeli', () => {
            devTools.startTimer('test-op', 'test');

            // Biraz zaman geçsin
            const start = performance.now();
            while (performance.now() - start < 10) {} // 10ms bekle

            const duration = devTools.endTimer('test-op', 'test');

            expect(duration).toBeGreaterThan(0);

            const entries = devTools.getPerformanceEntries()();
            expect(entries).toHaveLength(1);
            expect(entries[0].name).toBe('test-op');
        });

        it('başlatılmamış timer için uyarı vermeli', () => {
            const warnSpy = jest.spyOn(devTools, 'warn');

            devTools.endTimer('non-existent');

            expect(warnSpy).toHaveBeenCalled();
        });

        it('measure async fonksiyon süresini ölçmeli', async () => {
            const result = await devTools.measure('async-op', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'done';
            });

            expect(result).toBe('done');

            const entries = devTools.getPerformanceEntries()();
            expect(entries[0].name).toBe('async-op');
        });

        it('measureSync sync fonksiyon süresini ölçmeli', () => {
            const result = devTools.measureSync('sync-op', () => {
                return 42;
            });

            expect(result).toBe(42);

            const entries = devTools.getPerformanceEntries()();
            expect(entries[0].name).toBe('sync-op');
        });

        it('getSlowOperations yavaş işlemleri döndürmeli', () => {
            // Manuel olarak performans girdisi ekle
            devTools.startTimer('fast');
            devTools.endTimer('fast');

            // Slow operation simülasyonu - doğrudan state güncelle
            (devTools as any).perfEntries.update((entries: any[]) => [
                ...entries,
                { id: 999, name: 'slow', duration: 150, startTime: 0, endTime: 150, category: 'test' }
            ]);

            const slow = devTools.getSlowOperations(100);
            expect(slow.some(e => e.name === 'slow')).toBe(true);
        });

        it('avgPerformance ortalama süreyi hesaplamalı', () => {
            (devTools as any).perfEntries.set([
                { id: 1, name: 'op1', duration: 100, startTime: 0, endTime: 100, category: 'test' },
                { id: 2, name: 'op2', duration: 200, startTime: 0, endTime: 200, category: 'test' },
            ]);

            expect(devTools.avgPerformance()).toBe(150);
        });
    });

    describe('signal tracking', () => {
        it('trackSignal sinyal değişikliklerini kaydetmeli', () => {
            jest.useFakeTimers();

            const testSignal = signal(0);
            const unsubscribe = devTools.trackSignal(testSignal, 'counter');

            // İlk değer kaydedilmeli
            expect(devTools.getSignalTracks()()).toHaveLength(1);

            // Değer değiştir
            testSignal.set(1);
            jest.advanceTimersByTime(100);

            expect(devTools.getSignalTracks()().length).toBeGreaterThan(1);

            unsubscribe();
            jest.useRealTimers();
        });

        it('clearSignalTracks izlemeleri temizlemeli', () => {
            const testSignal = signal(0);
            devTools.trackSignal(testSignal, 'test');

            devTools.clearSignalTracks();

            expect(devTools.getSignalTracks()()).toHaveLength(0);
        });
    });

    describe('createLogger', () => {
        it('kategori özel logger oluşturmalı', () => {
            const logger = devTools.createLogger('MyComponent');

            logger.info('Component initialized');
            logger.warn('Something suspicious');

            const logs = devTools.getLogs()();
            expect(logs[0].category).toBe('MyComponent');
            expect(logs[1].category).toBe('MyComponent');
        });
    });

    describe('dumpState', () => {
        it('tüm state i döndürmeli', () => {
            devTools.info('Test', 'Message');

            const state = devTools.dumpState();

            expect(state).toHaveProperty('logs');
            expect(state).toHaveProperty('performance');
            expect(state).toHaveProperty('signals');
            expect(state).toHaveProperty('config');
            expect(state).toHaveProperty('stats');
        });
    });

    describe('clearAll', () => {
        it('tüm verileri temizlemeli', () => {
            devTools.info('Test', 'Message');
            devTools.startTimer('test');
            devTools.endTimer('test');

            devTools.clearAll();

            expect(devTools.getLogs()()).toHaveLength(0);
            expect(devTools.getPerformanceEntries()()).toHaveLength(0);
            expect(devTools.getSignalTracks()()).toHaveLength(0);
        });
    });
});

describe('assert', () => {
    it('koşul sağlanınca hata fırlatmamalı', () => {
        expect(() => assert(true, 'This is fine')).not.toThrow();
    });

    it('koşul sağlanmayınca hata fırlatmalı', () => {
        expect(() => assert(false, 'This failed')).toThrow('Assertion failed: This failed');
    });
});

describe('deepFreeze', () => {
    it('nesneyi dondurmalı', () => {
        const obj = { a: 1, b: { c: 2 } };
        const frozen = deepFreeze(obj);

        expect(Object.isFrozen(frozen)).toBe(true);
        expect(Object.isFrozen(frozen.b)).toBe(true);
    });

    it('primitive değerleri olduğu gibi döndürmeli', () => {
        expect(deepFreeze(42)).toBe(42);
        expect(deepFreeze('string')).toBe('string');
        expect(deepFreeze(null)).toBe(null);
    });
});
