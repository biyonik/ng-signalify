import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldValue } from '../../fields';
import {EnhancedFieldValue} from "../../schemas/form-state";


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
    <div class="sig-checkbox" [class.sig-checkbox--disabled]="isDisabled()">
      <input
        type="checkbox"
        [id]="inputId"
        [checked]="currentValue()"
        [disabled]="isDisabled()"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="sig-checkbox__input"
      />
      <label [for]="inputId" class="sig-checkbox__label">
                <span class="sig-checkbox__box">
                    @if (currentValue()) { ✓ }
                </span>
        <ng-content></ng-content>
      </label>
    </div>
  `,
})
export class SigCheckboxComponent implements ControlValueAccessor {
  readonly disabled = input<boolean>(false);

  // SMART BINDING
  readonly field = input<FieldValue<boolean> | EnhancedFieldValue<boolean> | null>(null);
  readonly value = model<boolean>(false);

  readonly change = output<boolean>();
  readonly blur = output<void>();

  inputId = 'sig-checkbox-' + Math.random().toString(36).substr(2, 9);
  private _disabledByForm = signal(false);

  readonly currentValue = computed(() => {
    const f = this.field();
    return f ? !!f.value() : !!this.value();
  });

  readonly isDisabled = computed(() => {
    const f = this.field();
    const fieldDisabled = (f && 'enabled' in f) ? !f.enabled() : false;
    return this.disabled() || this._disabledByForm() || fieldDisabled;
  });

  private _onChangeCva: (value: boolean) => void = () => {};
  private _onTouchedCva: () => void = () => {};

  onChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    const f = this.field();
    if (f) {
      f.value.set(checked);
      if (!f.touched()) f.touched.set(true);
    }

    this.value.set(checked);
    this._onChangeCva(checked);
    this.change.emit(checked);
  }

  onBlur(): void {
    this._onTouchedCva();
    const f = this.field();
    if (f) f.touched.set(true);
    this.blur.emit();
  }

  writeValue(obj: any): void { this.value.set(!!obj); }
  registerOnChange(fn: any): void { this._onChangeCva = fn; }
  registerOnTouched(fn: any): void { this._onTouchedCva = fn; }
  setDisabledState(isDisabled: boolean): void { this._disabledByForm.set(isDisabled); }
}
