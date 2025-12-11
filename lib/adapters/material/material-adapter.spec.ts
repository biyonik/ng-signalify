import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MaterialAdapter, MaterialAdapterConfig } from './material-adapter';
import { signal } from '@angular/core';

describe('MaterialAdapter', () => {
    let adapter: MaterialAdapter;

    beforeEach(() => {
        adapter = new MaterialAdapter();
    });

    describe('Basic Properties', () => {
        it('should have correct name and version', () => {
            expect(adapter.name).toBe('angular-material');
            expect(adapter.version).toBe('2.0.0');
        });

        it('should extend BaseFormAdapter', () => {
            expect(adapter.getInputComponent).toBeDefined();
            expect(adapter.getSelectComponent).toBeDefined();
            expect(adapter.bindFieldToComponent).toBeDefined();
        });
    });

    describe('Configuration', () => {
        it('should use default configuration when no config provided', () => {
            const defaultAdapter = new MaterialAdapter();
            const config = defaultAdapter.getDefaultConfig();
            
            expect(config.defaultAppearance).toBe('outline');
            expect(config.defaultFloatLabel).toBe('auto');
            expect(config.defaultColor).toBe('primary');
            expect(config.autoHints).toBe(false);
            expect(config.autoAriaLabels).toBe(true);
        });

        it('should merge user config with defaults', () => {
            const userConfig: MaterialAdapterConfig = {
                defaultAppearance: 'fill',
                autoHints: true
            };
            const configAdapter = new MaterialAdapter(userConfig);
            const config = configAdapter.getDefaultConfig(userConfig);
            
            expect(config.defaultAppearance).toBe('fill');
            expect(config.defaultFloatLabel).toBe('auto'); // default
            expect(config.autoHints).toBe(true);
            expect(config.autoAriaLabels).toBe(true); // default
        });

        it('should accept all configuration options', () => {
            const fullConfig: MaterialAdapterConfig = {
                defaultAppearance: 'standard',
                defaultFloatLabel: 'always',
                defaultColor: 'accent',
                autoHints: true,
                autoAriaLabels: false
            };
            const configAdapter = new MaterialAdapter(fullConfig);
            const config = configAdapter.getDefaultConfig(fullConfig);
            
            expect(config.defaultAppearance).toBe('standard');
            expect(config.defaultFloatLabel).toBe('always');
            expect(config.defaultColor).toBe('accent');
            expect(config.autoHints).toBe(true);
            expect(config.autoAriaLabels).toBe(false);
        });
    });

    describe('Component Type Getters', () => {
        it('should return null for getInputComponent', () => {
            expect(adapter.getInputComponent()).toBeNull();
        });

        it('should return null for getSelectComponent', () => {
            expect(adapter.getSelectComponent()).toBeNull();
        });

        it('should return null for getCheckboxComponent', () => {
            expect(adapter.getCheckboxComponent()).toBeNull();
        });

        it('should return null for getTextareaComponent', () => {
            expect(adapter.getTextareaComponent()).toBeNull();
        });

        it('should return null for getRadioGroupComponent', () => {
            expect(adapter.getRadioGroupComponent()).toBeNull();
        });

        it('should have consistent return type across all getters', () => {
            const methods = [
                adapter.getInputComponent,
                adapter.getSelectComponent,
                adapter.getCheckboxComponent,
                adapter.getTextareaComponent,
                adapter.getRadioGroupComponent
            ];

            methods.forEach(method => {
                expect(method.call(adapter)).toBeNull();
            });
        });
    });

    describe('bindFieldToComponent - Material-specific bindings', () => {
        it('should apply configured appearance', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ defaultAppearance: 'fill' });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    appearance: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBe('fill');
            });
        });

        it('should apply configured floatLabel', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ defaultFloatLabel: 'always' });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    floatLabel: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.floatLabel).toBe('always');
            });
        });

        it('should apply configured color', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ defaultColor: 'warn' });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    color: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.color).toBe('warn');
            });
        });

        it('should auto-generate ARIA labels when enabled', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ autoAriaLabels: true });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    label: 'Username'
                } as any;

                const mockInstance = {
                    ariaLabel: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.ariaLabel).toBe('Username');
            });
        });

        it('should not override existing ARIA label', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ autoAriaLabels: true });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    label: 'Username'
                } as any;

                const mockInstance = {
                    ariaLabel: 'Custom ARIA Label'
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.ariaLabel).toBe('Custom ARIA Label');
            });
        });

        it('should auto-display hints when enabled', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ autoHints: true });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    hint: 'Enter your username'
                } as any;

                const mockInstance = {
                    hint: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.hint).toBe('Enter your username');
            });
        });

        it('should not auto-display hints when disabled', () => {
            TestBed.runInInjectionContext(() => {
                const configAdapter = new MaterialAdapter({ autoHints: false });
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    hint: 'Enter your username'
                } as any;

                const mockInstance = {
                    hint: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                configAdapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.hint).toBeNull();
            });
        });

        it('should set appearance to outline if undefined', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    appearance: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBe('outline');
            });
        });

        it('should set floatLabel to auto if undefined', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    floatLabel: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.floatLabel).toBe('auto');
            });
        });

        it('should not override existing appearance value', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    appearance: 'fill'
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBe('fill');
            });
        });

        it('should not override existing floatLabel value', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    floatLabel: 'always'
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.floatLabel).toBe('always');
            });
        });

        it('should handle appearance with null value', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    appearance: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBe('outline');
            });
        });

        it('should handle floatLabel with null value', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    floatLabel: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.floatLabel).toBe('auto');
            });
        });

        it('should set both appearance and floatLabel when both are undefined', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    appearance: null,
                    floatLabel: null
                };

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBe('outline');
                expect(mockInstance.floatLabel).toBe('auto');
            });
        });

        it('should not set appearance if property does not exist on instance', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.appearance).toBeUndefined();
            });
        });

        it('should not set floatLabel if property does not exist on instance', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.floatLabel).toBeUndefined();
            });
        });
    });

    describe('bindFieldToComponent - Base class behavior', () => {
        it('should bind field value to component instance', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal('initial value');
                const mockField = {
                    value: valueSignal,
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    value: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.value).toBe(valueSignal);
            });
        });

        it('should bind field error to component instance', () => {
            TestBed.runInInjectionContext(() => {
                const errorSignal = signal('Error message');
                const mockField = {
                    value: signal('test'),
                    error: errorSignal,
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    error: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.error).toBe(errorSignal);
            });
        });

        it('should bind field touched state to component instance', () => {
            TestBed.runInInjectionContext(() => {
                const touchedSignal = signal(true);
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    touched: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.touched).toBe(touchedSignal);
            });
        });

        it('should handle instance without standard field properties', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                expect(() => {
                    adapter.bindFieldToComponent(mockField, mockComponentRef);
                }).not.toThrow();
            });
        });

        it('should bind all properties when all are present on instance', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal('value');
                const errorSignal = signal('error');
                const touchedSignal = signal(true);

                const mockField = {
                    value: valueSignal,
                    error: errorSignal,
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    value: null,
                    error: null,
                    touched: null,
                    appearance: null,
                    floatLabel: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.value).toBe(valueSignal);
                expect(mockInstance.error).toBe(errorSignal);
                expect(mockInstance.touched).toBe(touchedSignal);
                expect(mockInstance.appearance).toBe('outline');
                expect(mockInstance.floatLabel).toBe('auto');
            });
        });
    });

    describe('Edge Cases and Integration', () => {
        it('should create new instance without errors', () => {
            expect(() => new MaterialAdapter()).not.toThrow();
        });

        it('should be reusable across multiple bindings', () => {
            TestBed.runInInjectionContext(() => {
                const field1 = {
                    value: signal('field1'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const field2 = {
                    value: signal('field2'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const instance1 = { value: null, appearance: null };
                const instance2 = { value: null, appearance: null };

                adapter.bindFieldToComponent(field1, { instance: instance1 } as any);
                adapter.bindFieldToComponent(field2, { instance: instance2 } as any);

                expect(instance1.value).toBe(field1.value);
                expect(instance2.value).toBe(field2.value);
                expect(instance1.appearance).toBe('outline');
                expect(instance2.appearance).toBe('outline');
            });
        });

        it('should handle component reference with minimal instance', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const minimalInstance = Object.create(null);
                const mockComponentRef = {
                    instance: minimalInstance
                } as ComponentRef<any>;

                expect(() => {
                    adapter.bindFieldToComponent(mockField, mockComponentRef);
                }).not.toThrow();
            });
        });
    });
});
