import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    input,
    model,
    computed,
    signal,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys } from '../../utils/a11y.utils';

export interface RadioOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    description?: string;
}

/**
 * SigRadioGroup - Signal-based accessible radio button group
 *
 * ARIA Pattern: Radio Group
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
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
      [attr.aria-labelledby]="labelId"
      [attr.aria-describedby]="error() ? errorId : null"
      [attr.aria-invalid]="!!error()"
      [attr.aria-required]="required()"
      (keydown)="onKeydown($event)"
    >
      @if (label()) {
        <div [id]="labelId" class="sig-radio-group__label">
          {{ label() }}
          @if (required()) {
            <span class="sig-radio-group__required" aria-hidden="true">*</span>
          }
        </div>
      }

      <div class="sig-radio-group__options" role="presentation">
        @for (option of options(); track option.value; let i = $index) {
          <label 
            class="sig-radio"
            [class.sig-radio--checked]="option.value === value()"
            [class.sig-radio--disabled]="option.disabled || isDisabled()"
            [class.sig-radio--focused]="focusedIndex() === i"
            [class.sig-radio--card]="variant() === 'card'"
            [for]="getOptionId(i)"
          >
            <input
              type="radio"
              [id]="getOptionId(i)"
              [name]="name()"
              [value]="option.value"
              [checked]="option.value === value()"
              [disabled]="option.disabled || isDisabled()"
              [attr.aria-describedby]="option.description ? getDescriptionId(i) : null"
              [tabindex]="getTabIndex(i)"
              (change)="onSelect(option.value)"
              (focus)="focusedIndex.set(i)"
              (blur)="focusedIndex.set(-1)"
              class="sig-radio__input"
            />
            <span class="sig-radio__control" aria-hidden="true">
              <span class="sig-radio__dot"></span>
            </span>
            <span class="sig-radio__content">
              <span class="sig-radio__text">{{ option.label }}</span>
              @if (option.description) {
                <span 
                  [id]="getDescriptionId(i)" 
                  class="sig-radio__description"
                >
                  {{ option.description }}
                </span>
              }
            </span>
          </label>
        }
      </div>

      @if (error()) {
        <div 
          [id]="errorId" 
          class="sig-radio-group__error" 
          role="alert"
          aria-live="polite"
        >
          {{ error() }}
        </div>
      }
    </div>
  `,
})
export class SigRadioGroupComponent implements ControlValueAccessor, OnInit {
    readonly options = input<RadioOption[]>([]);
    readonly value = model<string | number | null>(null);
    readonly name = input.required<string>();
    readonly label = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly direction = input<'horizontal' | 'vertical'>('vertical');
    readonly variant = input<'default' | 'card'>('default');
    readonly error = input<string | null>(null);
    readonly required = input<boolean>(false);

    // Internal state
    readonly focusedIndex = signal(-1);
    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    // IDs
    groupId = '';
    labelId = '';
    errorId = '';

    private _onChange: (value: string | number | null) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.groupId = generateId('sig-radio-group');
        this.labelId = `${this.groupId}-label`;
        this.errorId = `${this.groupId}-error`;
    }

    getOptionId(index: number): string {
        return `${this.groupId}-option-${index}`;
    }

    getDescriptionId(index: number): string {
        return `${this.groupId}-desc-${index}`;
    }

    // Roving tabindex pattern
    getTabIndex(index: number): number {
        const currentValue = this.value();
        const opts = this.options();

        // If there's a selected value, only that option is tabbable
        if (currentValue !== null) {
            const selectedIndex = opts.findIndex(o => o.value === currentValue);
            return index === selectedIndex ? 0 : -1;
        }

        // If no selection, first non-disabled option is tabbable
        const firstEnabledIndex = opts.findIndex(o => !o.disabled);
        return index === firstEnabledIndex ? 0 : -1;
    }

    onKeydown(event: KeyboardEvent): void {
        const opts = this.options();
        if (opts.length === 0) return;

        let newIndex = -1;
        const currentIndex = this.focusedIndex();

        switch (event.key) {
            case Keys.ARROW_DOWN:
            case Keys.ARROW_RIGHT:
                event.preventDefault();
                newIndex = this.findNextEnabled(currentIndex, 1);
                break;
            case Keys.ARROW_UP:
            case Keys.ARROW_LEFT:
                event.preventDefault();
                newIndex = this.findNextEnabled(currentIndex, -1);
                break;
            case Keys.HOME:
                event.preventDefault();
                newIndex = this.findNextEnabled(-1, 1);
                break;
            case Keys.END:
                event.preventDefault();
                newIndex = this.findNextEnabled(opts.length, -1);
                break;
            case Keys.SPACE:
                // Space selects the focused option
                if (currentIndex >= 0 && !opts[currentIndex].disabled) {
                    event.preventDefault();
                    this.onSelect(opts[currentIndex].value);
                }
                break;
        }

        if (newIndex >= 0 && newIndex !== currentIndex) {
            this.focusOption(newIndex);
            // Also select on arrow navigation (standard radio behavior)
            if (!opts[newIndex].disabled) {
                this.onSelect(opts[newIndex].value);
            }
        }
    }

    private findNextEnabled(fromIndex: number, direction: number): number {
        const opts = this.options();
        let index = fromIndex + direction;

        while (index >= 0 && index < opts.length) {
            if (!opts[index].disabled) {
                return index;
            }
            index += direction;
        }

        return fromIndex;
    }

    private focusOption(index: number): void {
        const optionId = this.getOptionId(index);
        const element = document.getElementById(optionId);
        if (element) {
            element.focus();
        }
    }

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

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
