import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigCheckbox - Checkbox with label
 * 
 * Usage:
 * <sig-checkbox [(checked)]="rememberMe" label="Beni hatırla" />
 */
@Component({
  selector: 'sig-checkbox',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label 
      class="sig-checkbox"
      [class.sig-checkbox--disabled]="disabled"
      [class.sig-checkbox--checked]="checked"
    >
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        [indeterminate]="indeterminate"
        (change)="onChange($event)"
        class="sig-checkbox__input"
      />
      <span class="sig-checkbox__box">
        @if (checked) {
          <span class="sig-checkbox__check">✓</span>
        } @else if (indeterminate) {
          <span class="sig-checkbox__indeterminate">−</span>
        }
      </span>
      @if (label) {
        <span class="sig-checkbox__label">{{ label }}</span>
      }
    </label>
  `,
  styles: [`
    .sig-checkbox {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .sig-checkbox--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-checkbox__input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .sig-checkbox__box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #d1d5db;
      border-radius: 0.25rem;
      background: white;
      transition: all 0.15s;
    }

    .sig-checkbox--checked .sig-checkbox__box {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }

    .sig-checkbox__input:focus + .sig-checkbox__box {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .sig-checkbox__check,
    .sig-checkbox__indeterminate {
      color: white;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .sig-checkbox__label {
      font-size: 0.875rem;
      color: #374151;
    }
  `],
})
export class SigCheckboxComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() label = '';
  @Input() disabled = false;
  @Input() indeterminate = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  private onChangeFn: (value: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.indeterminate = false;
    this.checkedChange.emit(this.checked);
    this.onChangeFn(this.checked);
    this.onTouchedFn();
  }

  // ControlValueAccessor
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

/**
 * SigSwitch - Toggle switch
 * 
 * Usage:
 * <sig-switch [(checked)]="isActive" label="Aktif" />
 */
@Component({
  selector: 'sig-switch',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <label 
      class="sig-switch"
      [class.sig-switch--disabled]="disabled"
      [class.sig-switch--checked]="checked"
      [class.sig-switch--small]="size === 'small'"
      [class.sig-switch--large]="size === 'large'"
    >
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onChange($event)"
        class="sig-switch__input"
      />
      <span class="sig-switch__track">
        <span class="sig-switch__thumb"></span>
      </span>
      @if (label) {
        <span class="sig-switch__label">{{ label }}</span>
      }
    </label>
  `,
  styles: [`
    .sig-switch {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .sig-switch--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-switch__input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .sig-switch__track {
      position: relative;
      width: 2.5rem;
      height: 1.5rem;
      background-color: #d1d5db;
      border-radius: 9999px;
      transition: background-color 0.2s;
    }

    .sig-switch--checked .sig-switch__track {
      background-color: #3b82f6;
    }

    .sig-switch__thumb {
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      background-color: white;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .sig-switch--checked .sig-switch__thumb {
      transform: translateX(1rem);
    }

    .sig-switch__input:focus + .sig-switch__track {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .sig-switch__label {
      font-size: 0.875rem;
      color: #374151;
    }

    /* Sizes */
    .sig-switch--small .sig-switch__track {
      width: 2rem;
      height: 1.25rem;
    }

    .sig-switch--small .sig-switch__thumb {
      width: 1rem;
      height: 1rem;
    }

    .sig-switch--small.sig-switch--checked .sig-switch__thumb {
      transform: translateX(0.75rem);
    }

    .sig-switch--large .sig-switch__track {
      width: 3rem;
      height: 1.75rem;
    }

    .sig-switch--large .sig-switch__thumb {
      width: 1.5rem;
      height: 1.5rem;
    }

    .sig-switch--large.sig-switch--checked .sig-switch__thumb {
      transform: translateX(1.25rem);
    }
  `],
})
export class SigSwitchComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() label = '';
  @Input() disabled = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  @Output() checkedChange = new EventEmitter<boolean>();

  private onChangeFn: (value: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.checkedChange.emit(this.checked);
    this.onChangeFn(this.checked);
    this.onTouchedFn();
  }

  // ControlValueAccessor
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}