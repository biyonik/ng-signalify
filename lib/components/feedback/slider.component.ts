import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigSlider - Signal-based range slider
 * 
 * Usage:
 * <sig-slider
 *   [(value)]="volume"
 *   [min]="0"
 *   [max]="100"
 *   [step]="1"
 *   [showValue]="true"
 * />
 */
@Component({
  selector: 'sig-slider',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigSliderComponent),
      multi: true,
    },
  ],
  template: `
    <div 
      class="sig-slider"
      [class.sig-slider--disabled]="disabled()"
    >
      @if (label()) {
        <div class="sig-slider__header">
          <span class="sig-slider__label">{{ label() }}</span>
          @if (showValue()) {
            <span class="sig-slider__value">{{ displayValue() }}</span>
          }
        </div>
      }

      <div class="sig-slider__track-container">
        @if (showMinMax()) {
          <span class="sig-slider__min">{{ min() }}</span>
        }

        <div 
          #trackRef
          class="sig-slider__track"
          (mousedown)="onTrackClick($event)"
        >
          <div 
            class="sig-slider__fill"
            [style.width.%]="percentage()"
          ></div>
          <div 
            class="sig-slider__thumb"
            [style.left.%]="percentage()"
            (mousedown)="onThumbMouseDown($event)"
            (touchstart)="onThumbTouchStart($event)"
            tabindex="0"
            (keydown)="onKeydown($event)"
            role="slider"
            [attr.aria-valuemin]="min()"
            [attr.aria-valuemax]="max()"
            [attr.aria-valuenow]="value()"
          >
            @if (showTooltip()) {
              <div class="sig-slider__tooltip">
                {{ displayValue() }}
              </div>
            }
          </div>
        </div>

        @if (showMinMax()) {
          <span class="sig-slider__max">{{ max() }}</span>
        }
      </div>

      @if (marks().length > 0) {
        <div class="sig-slider__marks">
          @for (mark of marks(); track mark.value) {
            <div 
              class="sig-slider__mark"
              [style.left.%]="getMarkPosition(mark.value)"
              (click)="setValue(mark.value)"
            >
              <span class="sig-slider__mark-dot"></span>
              @if (mark.label) {
                <span class="sig-slider__mark-label">{{ mark.label }}</span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-slider {
      width: 100%;
      padding: 0.5rem 0;
    }

    .sig-slider--disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .sig-slider__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .sig-slider__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .sig-slider__value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #3b82f6;
    }

    .sig-slider__track-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sig-slider__min,
    .sig-slider__max {
      font-size: 0.75rem;
      color: #9ca3af;
      min-width: 2rem;
    }

    .sig-slider__max {
      text-align: right;
    }

    .sig-slider__track {
      flex: 1;
      position: relative;
      height: 6px;
      background-color: #e5e7eb;
      border-radius: 3px;
      cursor: pointer;
    }

    .sig-slider__fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background-color: #3b82f6;
      border-radius: 3px;
      pointer-events: none;
    }

    .sig-slider__thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 1.25rem;
      height: 1.25rem;
      background-color: white;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      cursor: grab;
      transition: box-shadow 0.15s;
    }

    .sig-slider__thumb:hover {
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    }

    .sig-slider__thumb:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
    }

    .sig-slider__thumb:active {
      cursor: grabbing;
    }

    .sig-slider__tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 0.5rem;
      padding: 0.25rem 0.5rem;
      background-color: #1f2937;
      color: white;
      font-size: 0.75rem;
      border-radius: 0.25rem;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s;
    }

    .sig-slider__thumb:hover .sig-slider__tooltip,
    .sig-slider__thumb:focus .sig-slider__tooltip {
      opacity: 1;
    }

    .sig-slider__marks {
      position: relative;
      margin-top: 0.5rem;
      height: 1.5rem;
    }

    .sig-slider__mark {
      position: absolute;
      transform: translateX(-50%);
      cursor: pointer;
    }

    .sig-slider__mark-dot {
      display: block;
      width: 4px;
      height: 4px;
      background-color: #9ca3af;
      border-radius: 50%;
      margin: 0 auto;
    }

    .sig-slider__mark-label {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.625rem;
      color: #6b7280;
      text-align: center;
    }
  `],
})
export class SigSliderComponent implements ControlValueAccessor {
  readonly trackRef = viewChild<ElementRef<HTMLDivElement>>('trackRef');

  readonly value = model<number>(0);
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly showValue = input<boolean>(true);
  readonly showMinMax = input<boolean>(false);
  readonly showTooltip = input<boolean>(true);
  readonly suffix = input<string>('');
  readonly marks = input<Array<{ value: number; label?: string }>>([]);

  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};
  private _isDragging = false;

  readonly percentage = computed(() => {
    const val = this.value();
    const minVal = this.min();
    const maxVal = this.max();
    return ((val - minVal) / (maxVal - minVal)) * 100;
  });

  readonly displayValue = computed(() => {
    const suffix = this.suffix();
    return `${this.value()}${suffix ? ' ' + suffix : ''}`;
  });

  setValue(newValue: number): void {
    const min = this.min();
    const max = this.max();
    const step = this.step();

    // Clamp and snap to step
    let clamped = Math.min(Math.max(newValue, min), max);
    clamped = Math.round((clamped - min) / step) * step + min;
    
    if (clamped !== this.value()) {
      this.value.set(clamped);
      this._onChange(clamped);
    }
  }

  getMarkPosition(markValue: number): number {
    const min = this.min();
    const max = this.max();
    return ((markValue - min) / (max - min)) * 100;
  }

  onTrackClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.updateValueFromEvent(event);
    this._onTouched();
  }

  onThumbMouseDown(event: MouseEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this._isDragging = true;

    const onMouseMove = (e: MouseEvent) => {
      if (this._isDragging) {
        this.updateValueFromEvent(e);
      }
    };

    const onMouseUp = () => {
      this._isDragging = false;
      this._onTouched();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onThumbTouchStart(event: TouchEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this._isDragging = true;

    const onTouchMove = (e: TouchEvent) => {
      if (this._isDragging && e.touches[0]) {
        this.updateValueFromTouch(e.touches[0]);
      }
    };

    const onTouchEnd = () => {
      this._isDragging = false;
      this._onTouched();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const step = this.step();
    const bigStep = (this.max() - this.min()) / 10;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        this.setValue(this.value() + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        this.setValue(this.value() - step);
        break;
      case 'PageUp':
        event.preventDefault();
        this.setValue(this.value() + bigStep);
        break;
      case 'PageDown':
        event.preventDefault();
        this.setValue(this.value() - bigStep);
        break;
      case 'Home':
        event.preventDefault();
        this.setValue(this.min());
        break;
      case 'End':
        event.preventDefault();
        this.setValue(this.max());
        break;
    }
  }

  private updateValueFromEvent(event: MouseEvent): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const percentage = (event.clientX - rect.left) / rect.width;
    const newValue = this.min() + percentage * (this.max() - this.min());
    this.setValue(newValue);
  }

  private updateValueFromTouch(touch: Touch): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const percentage = (touch.clientX - rect.left) / rect.width;
    const newValue = this.min() + percentage * (this.max() - this.min());
    this.setValue(newValue);
  }

  writeValue(value: number): void {
    this.value.set(value ?? this.min());
  }

  registerOnChange(fn: (value: number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}