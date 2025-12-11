import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HeadlessAdapter } from './headless-adapter';
import { signal } from '@angular/core';

describe('HeadlessAdapter', () => {
    let adapter: HeadlessAdapter;

    beforeEach(() => {
        adapter = new HeadlessAdapter();
    });

    describe('Basic Properties', () => {
        it('should have correct name and version', () => {
            expect(adapter.name).toBe('headless');
            expect(adapter.version).toBe('1.0.0');
        });

        it('should be UI-agnostic', () => {
            // Headless adapter should not provide any UI components
            expect(adapter.getInputComponent()).toBeNull();
            expect(adapter.getSelectComponent()).toBeNull();
            expect(adapter.getCheckboxComponent()).toBeNull();
            expect(adapter.getTextareaComponent()).toBeNull();
            expect(adapter.getRadioGroupComponent()).toBeNull();
        });
    });

    describe('Component Type Getters', () => {
        it('should return null for all component getters', () => {
            expect(adapter.getInputComponent()).toBeNull();
            expect(adapter.getSelectComponent()).toBeNull();
            expect(adapter.getCheckboxComponent()).toBeNull();
            expect(adapter.getTextareaComponent()).toBeNull();
            expect(adapter.getRadioGroupComponent()).toBeNull();
        });

        it('should have consistent null return types', () => {
            const results = [
                adapter.getInputComponent(),
                adapter.getSelectComponent(),
                adapter.getCheckboxComponent(),
                adapter.getTextareaComponent(),
                adapter.getRadioGroupComponent()
            ];

            results.forEach(result => {
                expect(result).toBeNull();
            });
        });
    });

    describe('bindFieldToComponent - Property Binding', () => {
        it('should bind fieldValue if property exists on instance', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal('test value');
                const mockField = {
                    value: valueSignal,
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    fieldValue: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(valueSignal);
            });
        });

        it('should bind fieldError if property exists on instance', () => {
            TestBed.runInInjectionContext(() => {
                const errorSignal = signal('Error message');
                const mockField = {
                    value: signal('test'),
                    error: errorSignal,
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    fieldError: null // Use null instead of undefined
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldError).toBe(errorSignal);
            });
        });

        it('should bind fieldTouched if property exists on instance', () => {
            TestBed.runInInjectionContext(() => {
                const touchedSignal = signal(true);
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    fieldTouched: null // Use null instead of undefined
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldTouched).toBe(touchedSignal);
            });
        });

        it('should not bind fieldValue if property does not exist', () => {
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

                expect(mockInstance.fieldValue).toBeUndefined();
            });
        });

        it('should not bind fieldError if property does not exist', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal('error'),
                    touched: signal(false)
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldError).toBeUndefined();
            });
        });

        it('should not bind fieldTouched if property does not exist', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(true)
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldTouched).toBeUndefined();
            });
        });

        it('should bind all field properties when all exist on instance', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal('my value');
                const errorSignal = signal('my error');
                const touchedSignal = signal(false);

                const mockField = {
                    value: valueSignal,
                    error: errorSignal,
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    fieldValue: null,
                    fieldError: null,
                    fieldTouched: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(valueSignal);
                expect(mockInstance.fieldError).toBe(errorSignal);
                expect(mockInstance.fieldTouched).toBe(touchedSignal);
            });
        });
    });

    describe('bindFieldToComponent - Enabled State', () => {
        it('should bind fieldEnabled if both field.enabled and instance.fieldEnabled exist', () => {
            TestBed.runInInjectionContext(() => {
                const enabledSignal = signal(true);
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    enabled: enabledSignal
                } as any;

                const mockInstance = {
                    fieldEnabled: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldEnabled).toBe(enabledSignal);
            });
        });

        it('should not bind fieldEnabled if field.enabled does not exist', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockInstance = {
                    fieldEnabled: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                // Should stay null since field.enabled doesn't exist
                expect(mockInstance.fieldEnabled).toBeNull();
            });
        });

        it('should not bind fieldEnabled if instance.fieldEnabled does not exist', () => {
            TestBed.runInInjectionContext(() => {
                const enabledSignal = signal(true);
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    enabled: enabledSignal
                } as any;

                const mockInstance = {} as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldEnabled).toBeUndefined();
            });
        });

        it('should not bind fieldEnabled if field.enabled is not a function', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    enabled: true // Not a signal/function
                } as any;

                const mockInstance = {
                    fieldEnabled: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                // Should stay null since field.enabled is not a function
                expect(mockInstance.fieldEnabled).toBeNull();
            });
        });

        it('should handle enabled state with different boolean values', () => {
            TestBed.runInInjectionContext(() => {
                const enabledSignal = signal(false);
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false),
                    enabled: enabledSignal
                } as any;

                const mockInstance = {
                    fieldEnabled: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldEnabled).toBe(enabledSignal);
            });
        });
    });

    describe('Signal Binding', () => {
        it('should bind signal objects, not signal values', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal('signal value');
                const errorSignal = signal('signal error');
                const touchedSignal = signal(true);

                const mockField = {
                    value: valueSignal,
                    error: errorSignal,
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    fieldValue: null,
                    fieldError: null,
                    fieldTouched: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                // Should be signal objects, not unwrapped values
                expect(mockInstance.fieldValue).toBe(valueSignal);
                expect(mockInstance.fieldError).toBe(errorSignal);
                expect(mockInstance.fieldTouched).toBe(touchedSignal);
                
                // Verify they are functions (signals)
                expect(typeof mockInstance.fieldValue).toBe('function');
                expect(typeof mockInstance.fieldError).toBe('function');
                expect(typeof mockInstance.fieldTouched).toBe('function');
                
                // Can be called to get values
                expect(mockInstance.fieldValue()).toBe('signal value');
                expect(mockInstance.fieldError()).toBe('signal error');
                expect(mockInstance.fieldTouched()).toBe(true);
            });
        });

        it('should handle null and undefined in signals', () => {
            TestBed.runInInjectionContext(() => {
                const valueSignal = signal(null);
                const errorSignal = signal(undefined);
                const touchedSignal = signal(false);
                
                const mockField = {
                    value: valueSignal,
                    error: errorSignal,
                    touched: touchedSignal
                } as any;

                const mockInstance = {
                    fieldValue: null,
                    fieldError: null,
                    fieldTouched: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(valueSignal);
                expect(mockInstance.fieldError).toBe(errorSignal);
                expect(mockInstance.fieldTouched).toBe(touchedSignal);
                
                // Verify calling them returns the right values
                expect(mockInstance.fieldValue()).toBeNull();
                expect(mockInstance.fieldError()).toBeUndefined();
                expect(mockInstance.fieldTouched()).toBe(false);
            });
        });
    });

    describe('Edge Cases and Integration', () => {
        it('should create new instance without errors', () => {
            expect(() => new HeadlessAdapter()).not.toThrow();
        });

        it('should handle instance with no properties', () => {
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

        it('should be reusable across multiple bindings', () => {
            TestBed.runInInjectionContext(() => {
                const field1 = {
                    value: signal('value1'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const field2 = {
                    value: signal('value2'),
                    error: signal('error2'),
                    touched: signal(true)
                } as any;

                const instance1 = { fieldValue: null };
                const instance2 = { fieldValue: null, fieldError: null };

                adapter.bindFieldToComponent(field1, { instance: instance1 } as any);
                adapter.bindFieldToComponent(field2, { instance: instance2 } as any);

                expect(instance1.fieldValue).toBe(field1.value);
                expect(instance2.fieldValue).toBe(field2.value);
                expect(instance2.fieldError).toBe(field2.error);
            });
        });

        it('should handle partial property availability gracefully', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal('error'),
                    touched: signal(true)
                } as any;

                // Only some properties available
                const mockInstance = {
                    fieldValue: null,
                    // fieldError missing
                    fieldTouched: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(mockField.value);
                expect(mockInstance.fieldError).toBeUndefined();
                expect(mockInstance.fieldTouched).toBe(mockField.touched);
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

        it('should maintain adapter instance properties across bindings', () => {
            const initialName = adapter.name;
            const initialVersion = adapter.version;

            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('test'),
                    error: signal(null),
                    touched: signal(false)
                } as any;

                const mockComponentRef = {
                    instance: { fieldValue: null }
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                // Adapter properties should not change
                expect(adapter.name).toBe(initialName);
                expect(adapter.version).toBe(initialVersion);
            });
        });
    });

    describe('User-Defined Component Support', () => {
        it('should support custom component with custom property names', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('custom value'),
                    error: signal('custom error'),
                    touched: signal(true)
                } as any;

                // User's custom component with custom property names
                const mockInstance = {
                    fieldValue: null,
                    fieldError: null,
                    fieldTouched: null,
                    customProp: 'should not be touched'
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(mockField.value);
                expect(mockInstance.fieldError).toBe(mockField.error);
                expect(mockInstance.fieldTouched).toBe(mockField.touched);
                expect(mockInstance.customProp).toBe('should not be touched');
            });
        });

        it('should allow component to define only subset of properties', () => {
            TestBed.runInInjectionContext(() => {
                const mockField = {
                    value: signal('value'),
                    error: signal('error'),
                    touched: signal(false)
                } as any;

                // Component only wants value, not error or touched
                const mockInstance = {
                    fieldValue: null
                } as any;

                const mockComponentRef = {
                    instance: mockInstance
                } as ComponentRef<any>;

                adapter.bindFieldToComponent(mockField, mockComponentRef);

                expect(mockInstance.fieldValue).toBe(mockField.value);
                expect(mockInstance.fieldError).toBeUndefined();
                expect(mockInstance.fieldTouched).toBeUndefined();
            });
        });
    });
});
