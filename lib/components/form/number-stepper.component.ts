import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigNumberStepper - Signal-based number stepper
 * 
 * Usage:
 * <sig-number-stepper
 *   [(value)]="quantity"
 *   [min]="1"
 *   [max]="99"
 *   [step]="1"
 * />
 */
@Component({
  selector: 'sig-number-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigNumberStepperComponent),
      multi: true,
    },
  ],
  template: `
    <div 
      class="sig-stepper"
      [class.sig-stepper--disabled]="disabled()"
      [class.sig-stepper--vertical]="orientation() === 'vertical'"
      [class.sig-stepper--sm]="size() === 'sm'"
      [class.sig-stepper--lg]="size() === 'lg'"
    >
      <button
        type="button"
        class="sig-stepper__btn sig-stepper__btn--minus"
        [disabled]="disabled() || isAtMin()"
        (click)="decrement()"
        (mousedown)="startHold('decrement')"
        (mouseup)="stopHold()"
        (mouseleave)="stopHold()"
        (touchstart)="startHold('decrement')"
        (touchend)="stopHold()"
        aria-label="Azalt"
      >
        −
      </button>

      <div class="sig-stepper__value-container">
        @if (editable()) {
          <input
            type="number"
            [value]="value()"
            [min]="min()"
            [max]="max()"
            [step]="step()"
            [disabled]="disabled()"
            (input)="onInput($event)"
            (blur)="onBlur()"
            class="sig-stepper__input"
          />
        } @else {
          <span class="sig-stepper__value">
            {{ formattedValue() }}
          </span>
        }
        @if (suffix()) {
          <span class="sig-stepper__suffix">{{ suffix() }}</span>
        }
      </div>

      <button
        type="button"
        class="sig-stepper__btn sig-stepper__btn--plus"
        [disabled]="disabled() || isAtMax()"
        (click)="increment()"
        (mousedown)="startHold('increment')"
        (mouseup)="stopHold()"
        (mouseleave)="stopHold()"
        (touchstart)="startHold('increment')"
        (touchend)="stopHold()"
        aria-label="Artır"
      >
        +
      </button>
    </div>
  `,
  styles: [`
    .sig-stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      overflow: hidden;
    }

    .sig-stepper--disabled {
      opacity: 0.5;
    }

    .sig-stepper--vertical {
      flex-direction: column-reverse;
    }

    .sig-stepper__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      border: none;
      background-color: #f3f4f6;
      color: #374151;
      font-size: 1.25rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s;
      user-select: none;
    }

    .sig-stepper--sm .sig-stepper__btn {
      width: 2rem;
      height: 2rem;
      font-size: 1rem;
    }

    .sig-stepper--lg .sig-stepper__btn {
      width: 3rem;
      height: 3rem;
      font-size: 1.5rem;
    }

    .sig-stepper__btn:hover:not(:disabled) {
      background-color: #e5e7eb;
    }

    .sig-stepper__btn:active:not(:disabled) {
      background-color: #d1d5db;
    }

    .sig-stepper__btn:disabled {
      color: #9ca3af;
      cursor: not-allowed;
    }

    .sig-stepper--vertical .sig-stepper__btn {
      width: 100%;
      height: 1.5rem;
    }

    .sig-stepper__value-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 3rem;
      padding: 0 0.5rem;
      gap: 0.25rem;
    }

    .sig-stepper--sm .sig-stepper__value-container {
      min-width: 2.5rem;
      padding: 0 0.25rem;
    }

    .sig-stepper--lg .sig-stepper__value-container {
      min-width: 4rem;
      padding: 0 0.75rem;
    }

    .sig-stepper__value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }

    .sig-stepper--sm .sig-stepper__value {
      font-size: 0.75rem;
    }

    .sig-stepper--lg .sig-stepper__value {
      font-size: 1rem;
    }

    .sig-stepper__input {
      width: 3rem;
      padding: 0;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      text-align: center;
      -moz-appearance: textfield;
    }

    .sig-stepper__input::-webkit-outer-spin-button,
    .sig-stepper__input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .sig-stepper__input:focus {
      outline: none;
    }

    .sig-stepper__suffix {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-stepper--vertical .sig-stepper__value-container {
      width: 100%;
      padding: 0.5rem;
    }
  `],
})
export class SigNumberStepperComponent implements ControlValueAccessor {
  readonly value = model<number>(0);
  readonly min = input<number>(-Infinity);
  readonly max = input<number>(Infinity);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  readonly editable = input<boolean>(true);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly suffix = input<string>('');
  readonly decimals = input<number>(0);
  readonly holdDelay = input<number>(500);
  readonly holdInterval = input<number>(100);

  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};
  private _holdTimer: ReturnType<typeof setTimeout> | null = null;
  private _holdInterval: ReturnType<typeof setInterval> | null = null;

  readonly isAtMin = computed(() => this.value() <= this.min());
  readonly isAtMax = computed(() => this.value() >= this.max());

  readonly formattedValue = computed(() => {
    const dec = this.decimals();
    return dec > 0 ? this.value().toFixed(dec) : this.value().toString();
  });

  increment(): void {
    if (this.disabled() || this.isAtMax()) return;
    
    const newValue = Math.min(this.value() + this.step(), this.max());
    this.setValue(newValue);
  }

  decrement(): void {
    if (this.disabled() || this.isAtMin()) return;
    
    const newValue = Math.max(this.value() - this.step(), this.min());
    this.setValue(newValue);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    
    if (!isNaN(newValue)) {
      this.setValue(newValue);
    }
  }

  onBlur(): void {
    // Clamp value on blur
    const clamped = Math.min(Math.max(this.value(), this.min()), this.max());
    if (clamped !== this.value()) {
      this.setValue(clamped);
    }
    this._onTouched();
  }

  startHold(action: 'increment' | 'decrement'): void {
    this._holdTimer = setTimeout(() => {
      this._holdInterval = setInterval(() => {
        if (action === 'increment') {
          this.increment();
        } else {
          this.decrement();
        }
      }, this.holdInterval());
    }, this.holdDelay());
  }

  stopHold(): void {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    if (this._holdInterval) {
      clearInterval(this._holdInterval);
      this._holdInterval = null;
    }
  }

  private setValue(newValue: number): void {
    const dec = this.decimals();
    const rounded = dec > 0 
      ? parseFloat(newValue.toFixed(dec))
      : Math.round(newValue);
    
    this.value.set(rounded);
    this._onChange(rounded);
  }

  writeValue(value: number): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}