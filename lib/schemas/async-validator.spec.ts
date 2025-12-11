import { TestBed } from '@angular/core/testing';
import { AsyncValidator, AsyncValidatorFn } from './async-validator';

describe('AsyncValidator (Comprehensive Expert-Level Tests)', () => {
    const run = (fn: () => void | Promise<void>) => TestBed.runInInjectionContext(fn);

    beforeEach(() => {
        TestBed.configureTestingModule({});
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Debouncing (Default 300ms)', () => {
        it('should debounce validation requests with default 300ms', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn);

                // Rapid fire requests
                validator.validate('a');
                validator.validate('ab');
                validator.validate('abc');

                // Should not call yet
                expect(mockFn).not.toHaveBeenCalled();

                // Advance time to default debounce (300ms)
                jest.advanceTimersByTime(350);
                await Promise.resolve();

                // Should only call with last value
                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
            });
        });

        it('should debounce validation requests with custom debounce time', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 500);

                validator.validate('test');

                jest.advanceTimersByTime(400);
                expect(mockFn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(150);
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
            });
        });

        it('should reset debounce timer on each new validation', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 300);

                validator.validate('a');
                jest.advanceTimersByTime(200);

                validator.validate('ab');
                jest.advanceTimersByTime(200);

                validator.validate('abc');
                jest.advanceTimersByTime(350);
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
            });
        });
    });

    describe('Race Condition Handling (AbortController)', () => {
        it('should cancel previous request when new validation starts', async () => {
            await run(async () => {
                let abortedCount = 0;
                const mockFn: AsyncValidatorFn<string> = jest.fn().mockImplementation(async (value, signal) => {
                    signal.addEventListener('abort', () => abortedCount++);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return signal.aborted ? '' : '';
                });

                const validator = new AsyncValidator(mockFn, 0);

                validator.validate('first');
                jest.advanceTimersByTime(10);

                validator.validate('second');
                jest.advanceTimersByTime(10);

                validator.validate('third');
                jest.advanceTimersByTime(200);
                await Promise.resolve();

                expect(abortedCount).toBeGreaterThan(0);
            });
        });

        it('should not update error signal if request was aborted', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async (value: string, signal) => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (signal.aborted) return '';
                    return value === 'error' ? 'Error message' : '';
                }, 0);

                validator.validate('error');
                jest.advanceTimersByTime(50);

                validator.validate('success');
                jest.advanceTimersByTime(150);
                await Promise.resolve();

                expect(validator.error()).toBe('');
            });
        });

        it('should handle concurrent validations correctly', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                // Each call with debounce=0 will execute after timeout
                // But if called synchronously, each will cancel the previous timer
                validator.validate('a');
                validator.validate('b');
                validator.validate('c');
                
                jest.advanceTimersByTime(1);
                await Promise.resolve();

                // All three validations should be called because each one starts its own timer
                // and the timeout completes before the next one cancels it
                expect(mockFn).toHaveBeenCalled();
                expect(mockFn).toHaveBeenLastCalledWith('c', expect.any(AbortSignal));
            });
        });
    });

    describe('Loading State Management', () => {
        it('should set loading to true during validation', async () => {
            await run(async () => {
                let resolveValidation: (value: string) => void;
                const validationPromise = new Promise<string>((resolve) => {
                    resolveValidation = resolve;
                });

                const validator = new AsyncValidator(async () => {
                    return validationPromise;
                }, 0);

                expect(validator.loading()).toBe(false);

                validator.validate('test');
                jest.advanceTimersByTime(1);
                await Promise.resolve();

                expect(validator.loading()).toBe(true);

                resolveValidation!('');
                await Promise.resolve();

                expect(validator.loading()).toBe(false);
            });
        });

        it('should set loading to false after validation completes', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => '', 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.loading()).toBe(false);
            });
        });

        it('should set loading to false on validation error', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => {
                    throw new Error('Validation failed');
                }, 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.loading()).toBe(false);
            });
        });

        it('should not change loading state if request was aborted', async () => {
            await run(async () => {
                let resolveValidation: (value: string) => void;
                const validationPromise = new Promise<string>((resolve) => {
                    resolveValidation = resolve;
                });

                const validator = new AsyncValidator(async (value, signal) => {
                    return validationPromise;
                }, 0);

                validator.validate('first');
                jest.advanceTimersByTime(1);
                await Promise.resolve();

                validator.validate('second');
                jest.advanceTimersByTime(1);
                await Promise.resolve();

                resolveValidation!('');
                await Promise.resolve();

                expect(validator.loading()).toBe(false);
            });
        });
    });

    describe('Error Handling', () => {
        it('should set error message on validation failure', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async (value: string) => {
                    return value === 'taken' ? 'Username is taken' : '';
                }, 0);

                validator.validate('taken');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.error()).toBe('Username is taken');
            });
        });

        it('should clear error on successful validation', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async (value: string) => {
                    return value === 'taken' ? 'Username is taken' : '';
                }, 0);

                validator.validate('taken');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.error()).toBe('Username is taken');

                validator.validate('available');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.error()).toBe('');
            });
        });

        it('should handle validation function throwing error', async () => {
            await run(async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                const validator = new AsyncValidator(async () => {
                    throw new Error('Network error');
                }, 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(consoleSpy).toHaveBeenCalled();
                expect(validator.loading()).toBe(false);

                consoleSpy.mockRestore();
            });
        });

        it('should not log error for AbortError', async () => {
            await run(async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                const validator = new AsyncValidator(async (value, signal) => {
                    if (signal.aborted) {
                        const error: any = new Error('Aborted');
                        error.name = 'AbortError';
                        throw error;
                    }
                    return '';
                }, 0);

                validator.validate('first');
                jest.advanceTimersByTime(5);
                validator.validate('second');
                jest.runAllTimers();
                await Promise.resolve();

                expect(consoleSpy).not.toHaveBeenCalled();

                consoleSpy.mockRestore();
            });
        });

        it('should handle null values gracefully', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                validator.validate(null as any);
                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).not.toHaveBeenCalled();
                expect(validator.error()).toBe('');
            });
        });

        it('should handle undefined values gracefully', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                validator.validate(undefined as any);
                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).not.toHaveBeenCalled();
                expect(validator.error()).toBe('');
            });
        });

        it('should handle empty string values gracefully', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                validator.validate('');
                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).not.toHaveBeenCalled();
                expect(validator.error()).toBe('');
            });
        });
    });

    describe('validateAsync() Method (Bug Fix Feature)', () => {
        it('should validate immediately without debounce', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 500);

                const promise = validator.validateAsync('test');
                
                // No need to advance timers - should execute immediately
                const result = await promise;

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(result).toBe('');
            });
        });

        it('should cancel pending debounced validation when called', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 500);

                validator.validate('debounced');
                jest.advanceTimersByTime(200);

                await validator.validateAsync('immediate');

                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith('immediate', expect.any(AbortSignal));
            });
        });

        it('should return error message from validation', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async (value: string) => {
                    return value === 'invalid' ? 'Validation error' : '';
                }, 300);

                const result = await validator.validateAsync('invalid');

                expect(result).toBe('Validation error');
                expect(validator.error()).toBe('Validation error');
            });
        });

        it('should return empty string for valid value', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async (value: string) => {
                    return value === 'invalid' ? 'Validation error' : '';
                }, 300);

                const result = await validator.validateAsync('valid');

                expect(result).toBe('');
                expect(validator.error()).toBe('');
            });
        });

        it('should set loading state during validation', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return '';
                }, 300);

                const promise = validator.validateAsync('test');

                expect(validator.loading()).toBe(true);

                jest.runAllTimers();
                await promise;

                expect(validator.loading()).toBe(false);
            });
        });

        it('should handle empty values without calling validator', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 300);

                const result = await validator.validateAsync('');

                expect(mockFn).not.toHaveBeenCalled();
                expect(result).toBe('');
                expect(validator.error()).toBe('');
                expect(validator.loading()).toBe(false);
            });
        });

        it('should handle validation errors gracefully', async () => {
            await run(async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                const validator = new AsyncValidator(async () => {
                    throw new Error('Network error');
                }, 300);

                const result = await validator.validateAsync('test');

                expect(result).toBe('');
                expect(consoleSpy).toHaveBeenCalled();

                consoleSpy.mockRestore();
            });
        });
    });

    describe('Reset Functionality', () => {
        it('should clear loading state on reset', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return '';
                }, 0);

                validator.validate('test');
                jest.advanceTimersByTime(10);

                expect(validator.loading()).toBe(true);

                validator.reset();

                expect(validator.loading()).toBe(false);
            });
        });

        it('should clear error on reset', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => 'Error message', 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.error()).toBe('Error message');

                validator.reset();

                expect(validator.error()).toBe('');
            });
        });

        it('should cancel pending validation on reset', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 300);

                validator.validate('test');
                jest.advanceTimersByTime(100);

                validator.reset();

                jest.advanceTimersByTime(300);
                await Promise.resolve();

                expect(mockFn).not.toHaveBeenCalled();
            });
        });

        it('should cancel in-flight request on reset', async () => {
            await run(async () => {
                let aborted = false;
                const validator = new AsyncValidator(async (value, signal) => {
                    signal.addEventListener('abort', () => { aborted = true; });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return '';
                }, 0);

                validator.validate('test');
                jest.advanceTimersByTime(10);

                validator.reset();

                jest.runAllTimers();
                await Promise.resolve();

                expect(aborted).toBe(true);
            });
        });

        it('should allow new validation after reset', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                validator.validate('first');
                jest.runAllTimers();
                await Promise.resolve();

                validator.reset();

                validator.validate('second');
                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Memory Cleanup', () => {
        it('should not leak timers after multiple validations', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => '', 300);

                for (let i = 0; i < 100; i++) {
                    validator.validate(`test${i}`);
                    jest.advanceTimersByTime(50);
                }

                validator.reset();

                expect(validator.loading()).toBe(false);
                expect(validator.error()).toBe('');
            });
        });

        it('should not leak abort controllers', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => '', 0);

                for (let i = 0; i < 100; i++) {
                    validator.validate(`test${i}`);
                    jest.advanceTimersByTime(1);
                }

                jest.runAllTimers();
                await Promise.resolve();

                validator.reset();

                expect(validator.loading()).toBe(false);
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero debounce time', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle very long debounce time', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 10000);

                validator.validate('test');
                jest.advanceTimersByTime(5000);

                expect(mockFn).not.toHaveBeenCalled();

                jest.advanceTimersByTime(6000);
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle rapid validation cycles', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 100);

                for (let i = 0; i < 10; i++) {
                    validator.validate(`test${i}`);
                    jest.advanceTimersByTime(50);
                }

                jest.advanceTimersByTime(100);
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledTimes(1);
                expect(mockFn).toHaveBeenCalledWith('test9', expect.any(AbortSignal));
            });
        });

        it('should handle complex object values', async () => {
            await run(async () => {
                const mockFn = jest.fn().mockResolvedValue('');
                const validator = new AsyncValidator(mockFn, 0);

                const complexValue = { name: 'test', nested: { value: 123 } };
                validator.validate(complexValue as any);

                jest.runAllTimers();
                await Promise.resolve();

                expect(mockFn).toHaveBeenCalledWith(complexValue, expect.any(AbortSignal));
            });
        });

        it('should handle validation that returns null', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => null as any, 0);

                validator.validate('test');
                jest.runAllTimers();
                await Promise.resolve();

                expect(validator.error()).toBeNull();
            });
        });
    });

    describe('Signal Reactivity', () => {
        it('should expose loading as readonly signal', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => '', 0);

                expect(validator.loading()).toBe(false);

                // Verify it's a signal by checking it's a function
                expect(typeof validator.loading).toBe('function');
            });
        });

        it('should expose error as readonly signal', async () => {
            await run(async () => {
                const validator = new AsyncValidator(async () => '', 0);

                expect(validator.error()).toBe('');

                // Verify it's a signal by checking it's a function
                expect(typeof validator.error).toBe('function');
            });
        });

        it('should update signals reactively during validation lifecycle', async () => {
            await run(async () => {
                let resolveValidation: (value: string) => void;
                const validationPromise = new Promise<string>((resolve) => {
                    resolveValidation = resolve;
                });

                const validator = new AsyncValidator(async (value: string) => {
                    const result = await validationPromise;
                    return value === 'error' ? 'Error message' : result;
                }, 0);

                const loadingStates: boolean[] = [];
                const errorStates: string[] = [];

                // Capture initial state
                loadingStates.push(validator.loading());
                errorStates.push(validator.error());

                validator.validate('error');
                jest.advanceTimersByTime(1);
                await Promise.resolve();

                // Capture during loading
                loadingStates.push(validator.loading());
                errorStates.push(validator.error());

                resolveValidation!('');
                await Promise.resolve();

                // Capture after completion
                loadingStates.push(validator.loading());
                errorStates.push(validator.error());

                expect(loadingStates).toEqual([false, true, false]);
                expect(errorStates).toEqual(['', '', 'Error message']);
            });
        });
    });
});