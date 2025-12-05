import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigRating - Signal-based star rating
 * 
 * Usage:
 * <sig-rating
 *   [(value)]="rating"
 *   [max]="5"
 *   [readonly]="false"
 *   [allowHalf]="true"
 * />
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
      [class.sig-rating--disabled]="disabled()"
      [class.sig-rating--sm]="size() === 'sm'"
      [class.sig-rating--lg]="size() === 'lg'"
      role="slider"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
      [attr.aria-label]="label()"
    >
      @if (label()) {
        <span class="sig-rating__label">{{ label() }}</span>
      }

      <div class="sig-rating__stars">
        @for (star of stars(); track star.index) {
          <button
            type="button"
            class="sig-rating__star"
            [class.sig-rating__star--filled]="star.filled === 'full'"
            [class.sig-rating__star--half]="star.filled === 'half'"
            [disabled]="readonly() || disabled()"
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
        <span class="sig-rating__value">
          {{ displayValue() }}
        </span>
      }

      @if (showCount() && count() > 0) {
        <span class="sig-rating__count">
          ({{ count() }})
        </span>
      }
    </div>
  `,
  })
export class SigRatingComponent implements ControlValueAccessor {
  readonly value = model<number>(0);
  readonly max = input<number>(5);
  readonly readonly = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly allowHalf = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input<string>('');
  readonly showValue = input<boolean>(false);
  readonly showCount = input<boolean>(false);
  readonly count = input<number>(0);
  readonly filledIcon = input<string>('★');
  readonly emptyIcon = input<string>('☆');
  readonly halfIcon = input<string>('★');

  readonly hoverValue = signal<number | null>(null);

  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};

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

  onStarClick(index: number): void {
    if (this.readonly() || this.disabled()) return;

    let newValue = index;
    
    // Toggle half if clicking on same star
    if (this.allowHalf() && this.value() === index) {
      newValue = index - 0.5;
    } else if (this.allowHalf() && this.value() === index - 0.5) {
      newValue = 0;
    } else if (!this.allowHalf() && this.value() === index) {
      newValue = 0;
    }

    this.value.set(newValue);
    this._onChange(newValue);
    this._onTouched();
  }

  onStarHover(index: number): void {
    if (this.readonly() || this.disabled()) return;
    this.hoverValue.set(index);
  }

  onStarLeave(): void {
    this.hoverValue.set(null);
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