import { TestBed } from '@angular/core/testing';
import { provideSigUI, injectUIAdapter, UI_ADAPTER } from './provider';
import { UIAdapter } from './base/ui-adapter.interface';
import { MaterialAdapter } from './material/material-adapter';
import { HeadlessAdapter } from './headless/headless-adapter';
import { ComponentRef } from '@angular/core';
import { FieldValue } from '../fields';

describe('UI Adapter Provider', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
    });

    describe('provideSigUI', () => {
        it('should provide MaterialAdapter through DI', () => {
            const adapter = new MaterialAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            const injectedAdapter = TestBed.inject(UI_ADAPTER);
            expect(injectedAdapter).toBe(adapter);
            expect(injectedAdapter.name).toBe('angular-material');
        });

        it('should provide HeadlessAdapter through DI', () => {
            const adapter = new HeadlessAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            const injectedAdapter = TestBed.inject(UI_ADAPTER);
            expect(injectedAdapter).toBe(adapter);
            expect(injectedAdapter.name).toBe('headless');
        });

        it('should provide custom adapter implementation', () => {
            class CustomAdapter implements UIAdapter {
                readonly name = 'custom';
                readonly version = '1.0.0';
                
                getInputComponent() { return null; }
                getSelectComponent() { return null; }
                getCheckboxComponent() { return null; }
                getTextareaComponent() { return null; }
                getRadioGroupComponent() { return null; }
                bindFieldToComponent() { }
            }

            const adapter = new CustomAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            const injectedAdapter = TestBed.inject(UI_ADAPTER);
            expect(injectedAdapter).toBe(adapter);
            expect(injectedAdapter.name).toBe('custom');
            expect(injectedAdapter.version).toBe('1.0.0');
        });

        it('should allow switching adapters between tests', () => {
            // First test with MaterialAdapter
            const materialAdapter = new MaterialAdapter();
            TestBed.configureTestingModule({
                providers: [provideSigUI(materialAdapter)]
            });
            
            let injected = TestBed.inject(UI_ADAPTER);
            expect(injected.name).toBe('angular-material');
            
            // Reset and use HeadlessAdapter
            TestBed.resetTestingModule();
            const headlessAdapter = new HeadlessAdapter();
            TestBed.configureTestingModule({
                providers: [provideSigUI(headlessAdapter)]
            });
            
            injected = TestBed.inject(UI_ADAPTER);
            expect(injected.name).toBe('headless');
        });

        it('should provide EnvironmentProviders type', () => {
            const adapter = new MaterialAdapter();
            const providers = provideSigUI(adapter);
            
            // EnvironmentProviders should be usable in TestBed
            expect(() => {
                TestBed.configureTestingModule({
                    providers: [providers]
                });
            }).not.toThrow();
        });
    });

    describe('injectUIAdapter', () => {
        it('should inject the provided adapter', () => {
            const adapter = new MaterialAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            TestBed.runInInjectionContext(() => {
                const injectedAdapter = injectUIAdapter();
                expect(injectedAdapter).toBe(adapter);
                expect(injectedAdapter.name).toBe('angular-material');
            });
        });

        it('should throw error if no adapter is provided', () => {
            TestBed.configureTestingModule({
                providers: []
            });

            expect(() => {
                TestBed.runInInjectionContext(() => {
                    injectUIAdapter();
                });
            }).toThrow();
        });

        it('should work with HeadlessAdapter', () => {
            const adapter = new HeadlessAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            TestBed.runInInjectionContext(() => {
                const injectedAdapter = injectUIAdapter();
                expect(injectedAdapter).toBe(adapter);
                expect(injectedAdapter.name).toBe('headless');
            });
        });

        it('should be callable multiple times in same context', () => {
            const adapter = new MaterialAdapter();
            
            TestBed.configureTestingModule({
                providers: [provideSigUI(adapter)]
            });

            TestBed.runInInjectionContext(() => {
                const first = injectUIAdapter();
                const second = injectUIAdapter();
                
                expect(first).toBe(second);
                expect(first).toBe(adapter);
            });
        });
    });

    describe('UI_ADAPTER token', () => {
        it('should be a valid InjectionToken', () => {
            expect(UI_ADAPTER).toBeDefined();
            expect(UI_ADAPTER.toString()).toContain('NG_SIGNALIFY_UI_ADAPTER');
        });

        it('should allow direct injection via token', () => {
            const adapter = new MaterialAdapter();
            
            TestBed.configureTestingModule({
                providers: [{ provide: UI_ADAPTER, useValue: adapter }]
            });

            const injected = TestBed.inject(UI_ADAPTER);
            expect(injected).toBe(adapter);
        });

        it('should support factory providers', () => {
            const adapter = new HeadlessAdapter();
            
            TestBed.configureTestingModule({
                providers: [
                    { provide: UI_ADAPTER, useFactory: () => adapter }
                ]
            });

            const injected = TestBed.inject(UI_ADAPTER);
            expect(injected).toBe(adapter);
        });
    });
});
