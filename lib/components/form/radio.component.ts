import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  model,
  computed,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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