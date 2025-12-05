import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  model,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

/**
 * SigRadioGroup - Signal-based radio button group
 * 
 * Usage:
 * <sig-radio-group
 *   [(value)]="selectedGender"
 *   [options]="genderOptions"
 *   name="gender"
 *   direction="horizontal"
 * />
 */
@Component({
  selector: 'sig-radio-group',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigRadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <div 
      class="sig-radio-group"
      [class.sig-radio-group--horizontal]="direction() === 'horizontal'"
      [class.sig-radio-group--vertical]="direction() === 'vertical'"
      [class.sig-radio-group--card]="variant() === 'card'"
      role="radiogroup"
      [attr.aria-label]="label()"
    >
      @if (label()) {
        <div class="sig-radio-group__label">{{ label() }}</div>
      }

      <div class="sig-radio-group__options">
        @for (option of options(); track option.value) {
          <label 
            class="sig-radio"
            [class.sig-radio--checked]="option.value === value()"
            [class.sig-radio--disabled]="option.disabled || disabled()"
            [class.sig-radio--card]="variant() === 'card'"
          >
            <input
              type="radio"
              [name]="name()"
              [value]="option.value"
              [checked]="option.value === value()"
              [disabled]="option.disabled || disabled()"
              (change)="onSelect(option.value)"
              class="sig-radio__input"
            />
            <span class="sig-radio__control">
              <span class="sig-radio__dot"></span>
            </span>
            <span class="sig-radio__content">
              <span class="sig-radio__text">{{ option.label }}</span>
              @if (option.description) {
                <span class="sig-radio__description">{{ option.description }}</span>
              }
            </span>
          </label>
        }
      </div>

      @if (error()) {
        <div class="sig-radio-group__error">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .sig-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sig-radio-group__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .sig-radio-group__options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sig-radio-group--horizontal .sig-radio-group__options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .sig-radio {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .sig-radio--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-radio--card {
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.15s;
    }

    .sig-radio--card:hover:not(.sig-radio--disabled) {
      border-color: #3b82f6;
    }

    .sig-radio--card.sig-radio--checked {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .sig-radio__input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .sig-radio__control {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #d1d5db;
      border-radius: 50%;
      background: white;
      transition: all 0.15s;
      margin-top: 0.125rem;
    }

    .sig-radio--checked .sig-radio__control {
      border-color: #3b82f6;
    }

    .sig-radio__input:focus + .sig-radio__control {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .sig-radio__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: #3b82f6;
      transform: scale(0);
      transition: transform 0.15s;
    }

    .sig-radio--checked .sig-radio__dot {
      transform: scale(1);
    }

    .sig-radio__content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sig-radio__text {
      font-size: 0.875rem;
      color: #374151;
    }

    .sig-radio__description {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-radio-group__error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }
  `],
})
export class SigRadioGroupComponent implements ControlValueAccessor {
  readonly options = input<RadioOption[]>([]);
  readonly value = model<string | number | null>(null);
  readonly name = input.required<string>();
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly direction = input<'horizontal' | 'vertical'>('vertical');
  readonly variant = input<'default' | 'card'>('default');
  readonly error = input<string | null>(null);

  private _onChange: (value: string | number | null) => void = () => {};
  private _onTouched: () => void = () => {};

  onSelect(val: string | number): void {
    this.value.set(val);
    this._onChange(val);
    this._onTouched();
  }

  writeValue(value: string | number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}