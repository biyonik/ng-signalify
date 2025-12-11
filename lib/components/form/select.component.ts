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
  Injector,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '../../utils/a11y.utils';
import { FieldValue } from '../../fields';
import {EnhancedFieldValue} from "../../schemas/form-state";

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'sig-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigSelectComponent),
      multi: true,
    },
  ],
  template: `
        <div class="sig-select" [class.sig-select--error]="hasError()" [class.sig-select--disabled]="isDisabled()">
            <select
                [id]="selectId"
                [disabled]="isDisabled()"
                (change)="onChange($event)"
                (blur)="onBlur()"
                class="sig-select__field"
            >
                @if (placeholder()) {
                    <option [value]="null" disabled [selected]="currentValue() === null">
                        {{ placeholder() }}
                    </option>
                }

                @for (opt of options(); track opt.value) {
                    <option
                        [value]="opt.value"
                        [disabled]="opt.disabled"
                        [selected]="opt.value == currentValue()"
                    >
                        {{ opt.label }}
                    </option>
                }
            </select>
            <div class="sig-select__arrow">▼</div>
        </div>
    `,
})
export class SigSelectComponent implements ControlValueAccessor {
  // --- Inputs ---
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string>('Seçiniz...');
  readonly disabled = input<boolean>(false);

  // --- SMART BINDING ---
  readonly field = input<FieldValue<any> | EnhancedFieldValue<any> | null>(null);
  readonly value = model<any>(null);

  readonly blur = output<void>();

  selectId = generateId('sig-select');
  private _disabledByForm = signal(false);

  // Computed: Field value or Model value
  readonly currentValue = computed(() => {
    const f = this.field();
    return f ? f.value() : this.value();
  });

  readonly isDisabled = computed(() => {
    const f = this.field();
    const fieldDisabled = (f && 'enabled' in f) ? !f.enabled() : false;
    return this.disabled() || this._disabledByForm() || fieldDisabled;
  });

  readonly hasError = computed(() => {
    const f = this.field();
    return f ? (!!f.error() && f.touched()) : false;
  });

  private _onChangeCva: (value: any) => void = () => {};
  private _onTouchedCva: () => void = () => {};

  onChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    // Basit string/number dönüşümü gerekebilir, şimdilik direkt value alıyoruz.
    // Gelişmiş senaryoda options listesinden orijinal objeyi bulmak gerekebilir.
    const val = select.value;

    // 1. Field Update
    const f = this.field();
    if (f) {
      f.value.set(val);
      if (!f.touched()) f.touched.set(true);
    }

    // 2. Model Update
    this.value.set(val);
    this._onChangeCva(val);
  }

  onBlur(): void {
    this._onTouchedCva();
    const f = this.field();
    if (f) f.touched.set(true);
    this.blur.emit();
  }

  writeValue(obj: any): void { this.value.set(obj); }
  registerOnChange(fn: any): void { this._onChangeCva = fn; }
  registerOnTouched(fn: any): void { this._onTouchedCva = fn; }
  setDisabledState(isDisabled: boolean): void { this._disabledByForm.set(isDisabled); }
}
