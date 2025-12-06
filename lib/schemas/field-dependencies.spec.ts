import { DependencyResolver, DependencyPatterns } from './field-dependencies';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('FieldDependencies & Resolver (Expert)', () => {
    let resolver: DependencyResolver;
    // Signal tipini any yerine WritableSignal olarak belirtebiliriz ama basitlik için any kalsın
    let valuesSignal: any;
    let setFieldValue: jest.Mock;
    let resetField: jest.Mock;

    beforeEach(() => {
        resolver = new DependencyResolver();
        setFieldValue = jest.fn();
        resetField = jest.fn();
        valuesSignal = signal({});
    });

    it('should resolve visibility based on dependency', () => {
        resolver.register('city', DependencyPatterns.showWhenEquals('country', 'TR'));

        TestBed.runInInjectionContext(() => {
            resolver.initialize(valuesSignal, setFieldValue, resetField);

            // Case 1: Ülke US
            valuesSignal.set({ country: 'US' });
            TestBed.flushEffects();
            expect(resolver.isVisible('city')).toBe(false);

            // Case 2: Ülke TR
            valuesSignal.set({ country: 'TR' });
            TestBed.flushEffects();
            expect(resolver.isVisible('city')).toBe(true);
        });
    });

    it('should compute values automatically', () => {
        resolver.register('total', {
            dependsOn: ['price', 'qty'],
            compute: (vals) => (vals['price'] as number) * (vals['qty'] as number)
        });

        TestBed.runInInjectionContext(() => {
            resolver.initialize(valuesSignal, setFieldValue, resetField);

            valuesSignal.set({ price: 100, qty: 5 });
            TestBed.flushEffects();

            expect(setFieldValue).toHaveBeenCalledWith('total', 500);
        });
    });

    it('should detect circular dependencies', () => {
        resolver.register('A', { dependsOn: ['B'] });
        resolver.register('B', { dependsOn: ['A'] });

        expect(resolver.hasCircularDependency()).toBe(true);
    });
});