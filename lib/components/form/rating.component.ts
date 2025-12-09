import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
    model,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

/**
 * SigRating - Signal-based accessible star rating
 *
 * ARIA Pattern: Slider
 */
@Component({
    selector: 'sig-rating',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigRatingComponent),
            multi: true,
        },
    ],
    template: `
    <div 
      class="sig-rating"
      [class.sig-rating--readonly]="readonly()"
      [class.sig-rating--disabled]="isDisabled()"
      [class.sig-rating--sm]="size() === 'sm'"
      [class.sig-rating--lg]="size() === 'lg'"
    >
      @if (label()) {
        <span [id]="labelId" class="sig-rating__label">{{ label() }}</span>
      }

      <div 
        class="sig-rating__stars"
        role="slider"
        [tabindex]="readonly() || isDisabled() ? -1 : 0"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="max()"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuetext]="getValueText()"
        [attr.aria-labelledby]="label() ? labelId : null"
        [attr.aria-label]="!label() ? ariaLabel() : null"
        [attr.aria-readonly]="readonly()"
        [attr.aria-disabled]="isDisabled()"
        (keydown)="onKeydown($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      >
        @for (star of stars(); track star.index) {
          <button
            type="button"
            class="sig-rating__star"
            [class.sig-rating__star--filled]="star.filled === 'full'"
            [class.sig-rating__star--half]="star.filled === 'half'"
            [class.sig-rating__star--focused]="isFocused() && star.index === Math.ceil(value() || 1)"
            [disabled]="readonly() || isDisabled()"
            [tabindex]="-1"
            [attr.aria-hidden]="true"
            (click)="onStarClick(star.index)"
            (mouseenter)="onStarHover(star.index)"
            (mouseleave)="onStarLeave()"
          >
            <span class="sig-rating__star-empty">{{ emptyIcon() }}</span>
            <span class="sig-rating__star-fill">{{ filledIcon() }}</span>
            @if (allowHalf()) {
              <span class="sig-rating__star-half">{{ halfIcon() }}</span>
            }
          </button>
        }
      </div>

      @if (showValue()) {
        <span class="sig-rating__value" aria-hidden="true">
          {{ displayValue() }}
        </span>
      }

      @if (showCount() && count() > 0) {
        <span class="sig-rating__count" aria-hidden="true">
          ({{ count() }})
        </span>
      }
    </div>
  `,
})
export class SigRatingComponent implements ControlValueAccessor, OnInit {
    readonly value = model<number>(0);
    readonly max = input<number>(5);
    readonly readonly = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly allowHalf = input<boolean>(false);
    readonly size = input<'sm' | 'md' | 'lg'>('md');
    readonly label = input<string>('');
    readonly ariaLabel = input<string>('Derecelendirme');
    readonly showValue = input<boolean>(false);
    readonly showCount = input<boolean>(false);
    readonly count = input<number>(0);
    readonly filledIcon = input<string>('★');
    readonly emptyIcon = input<string>('☆');
    readonly halfIcon = input<string>('★');

    readonly hoverValue = signal<number | null>(null);
    readonly isFocused = signal(false);

    protected readonly Math = Math;

    // IDs
    labelId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: number) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.labelId = generateId('sig-rating-label');
    }

    readonly stars = computed(() => {
        const max = this.max();
        const currentValue = this.hoverValue() ?? this.value();
        const result: Array<{ index: number; filled: 'none' | 'half' | 'full' }> = [];

        for (let i = 1; i <= max; i++) {
            let filled: 'none' | 'half' | 'full' = 'none';

            if (currentValue >= i) {
                filled = 'full';
            } else if (this.allowHalf() && currentValue >= i - 0.5) {
                filled = 'half';
            }

            result.push({ index: i, filled });
        }

        return result;
    });

    readonly displayValue = computed(() => {
        const val = this.value();
        return val % 1 === 0 ? val.toString() : val.toFixed(1);
    });

    getValueText(): string {
        const val = this.value();
        const max = this.max();
        if (val === 0) return 'Derecelendirilmemiş';
        return `${val} / ${max} yıldız`;
    }

    onFocus(): void {
        this.isFocused.set(true);
    }

    onBlur(): void {
        this.isFocused.set(false);
        this._onTouched();
    }

    onKeydown(event: KeyboardEvent): void {
        if (this.readonly() || this.isDisabled()) return;

        const step = this.allowHalf() ? 0.5 : 1;
        let newValue = this.value();

        switch (event.key) {
            case Keys.ARROW_RIGHT:
            case Keys.ARROW_UP:
                event.preventDefault();
                newValue = Math.min(this.max(), this.value() + step);
                break;
            case Keys.ARROW_LEFT:
            case Keys.ARROW_DOWN:
                event.preventDefault();
                newValue = Math.max(0, this.value() - step);
                break;
            case Keys.HOME:
                event.preventDefault();
                newValue = 0;
                break;
            case Keys.END:
                event.preventDefault();
                newValue = this.max();
                break;
        }

        if (newValue !== this.value()) {
            this.setValue(newValue);
            announce(`${this.getValueText()}`, 'polite');
        }
    }

    onStarClick(index: number): void {
        if (this.readonly() || this.isDisabled()) return;

        let newValue = index;

        if (this.allowHalf() && this.value() === index) {
            newValue = index - 0.5;
        } else if (this.allowHalf() && this.value() === index - 0.5) {
            newValue = 0;
        } else if (!this.allowHalf() && this.value() === index) {
            newValue = 0;
        }

        this.setValue(newValue);
    }

    onStarHover(index: number): void {
        if (this.readonly() || this.isDisabled()) return;
        this.hoverValue.set(index);
    }

    onStarLeave(): void {
        this.hoverValue.set(null);
    }

    private setValue(val: number): void {
        this.value.set(val);
        this._onChange(val);
        this._onTouched();
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

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
