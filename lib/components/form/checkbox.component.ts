import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigCheckbox - Signal-based checkbox
 */
@Component({
  selector: 'sig-checkbox',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
      [class.sig-checkbox--disabled]="disabled()"
      [class.sig-checkbox--checked]="checked()"
    >
      <input
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        [indeterminate]="indeterminate()"
        (change)="onChange($event)"
        class="sig-checkbox__input"
      />
      <span class="sig-checkbox__box">
        @if (checked()) {
          <span class="sig-checkbox__check">✓</span>
        } @else if (indeterminate()) {
          <span class="sig-checkbox__indeterminate">−</span>
        }
      </span>
      @if (label()) {
        <span class="sig-checkbox__label">{{ label() }}</span>
      }
    </label>
  `,
  })
export class SigCheckboxComponent implements ControlValueAccessor {
  readonly checked = model<boolean>(false);
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);

  private _onChangeFn: (value: boolean) => void = () => {};
  private _onTouchedFn: () => void = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this._onChangeFn(target.checked);
    this._onTouchedFn();
  }

  writeValue(value: boolean): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this._onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouchedFn = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // disabled is an input signal, parent controls it
  }
}

/**
 * SigSwitch - Signal-based toggle switch
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
      [class.sig-switch--disabled]="disabled()"
      [class.sig-switch--checked]="checked()"
      [class.sig-switch--small]="size() === 'small'"
      [class.sig-switch--large]="size() === 'large'"
    >
      <input
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onChange($event)"
        class="sig-switch__input"
      />
      <span class="sig-switch__track">
        <span class="sig-switch__thumb"></span>
      </span>
      @if (label()) {
        <span class="sig-switch__label">{{ label() }}</span>
      }
    </label>
  `,
  })
export class SigSwitchComponent implements ControlValueAccessor {
  readonly checked = model<boolean>(false);
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'small' | 'medium' | 'large'>('medium');

  private _onChangeFn: (value: boolean) => void = () => {};
  private _onTouchedFn: () => void = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this._onChangeFn(target.checked);
    this._onTouchedFn();
  }

  writeValue(value: boolean): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this._onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouchedFn = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}