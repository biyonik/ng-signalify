import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

/**
 * SigTimePicker - Signal-based time picker
 * 
 * Usage:
 * <sig-time-picker
 *   [(value)]="selectedTime"
 *   [showSeconds]="false"
 *   [use24Hour]="true"
 *   placeholder="Saat seçin"
 * />
 */
@Component({
  selector: 'sig-time-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigTimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-time-picker" [class.sig-time-picker--open]="isOpen()">
      <!-- Input -->
      <button
        type="button"
        class="sig-time-picker__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="sig-time-picker__value">
          @if (value()) {
            {{ formattedTime() }}
          } @else {
            <span class="sig-time-picker__placeholder">{{ placeholder() }}</span>
          }
        </span>
        <span class="sig-time-picker__icon">🕐</span>
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="sig-time-picker__dropdown">
          <div class="sig-time-picker__columns">
            <!-- Hours -->
            <div class="sig-time-picker__column">
              <div class="sig-time-picker__column-header">Saat</div>
              <div class="sig-time-picker__scroll">
                @for (hour of hours(); track hour) {
                  <button
                    type="button"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="hour === selectedHour()"
                    (click)="selectHour(hour)"
                  >
                    {{ padZero(hour) }}
                  </button>
                }
              </div>
            </div>

            <!-- Minutes -->
            <div class="sig-time-picker__column">
              <div class="sig-time-picker__column-header">Dakika</div>
              <div class="sig-time-picker__scroll">
                @for (minute of minutes(); track minute) {
                  <button
                    type="button"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="minute === selectedMinute()"
                    (click)="selectMinute(minute)"
                  >
                    {{ padZero(minute) }}
                  </button>
                }
              </div>
            </div>

            <!-- Seconds -->
            @if (showSeconds()) {
              <div class="sig-time-picker__column">
                <div class="sig-time-picker__column-header">Saniye</div>
                <div class="sig-time-picker__scroll">
                  @for (second of secondsArray(); track second) {
                    <button
                      type="button"
                      class="sig-time-picker__option"
                      [class.sig-time-picker__option--selected]="second === selectedSecond()"
                      (click)="selectSecond(second)"
                    >
                      {{ padZero(second) }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- AM/PM -->
            @if (!use24Hour()) {
              <div class="sig-time-picker__column sig-time-picker__column--period">
                <div class="sig-time-picker__column-header">AM/PM</div>
                <div class="sig-time-picker__scroll">
                  <button
                    type="button"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="period() === 'AM'"
                    (click)="selectPeriod('AM')"
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="period() === 'PM'"
                    (click)="selectPeriod('PM')"
                  >
                    PM
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="sig-time-picker__footer">
            <button
              type="button"
              class="sig-time-picker__now"
              (click)="selectNow()"
            >
              Şimdi
            </button>
            @if (clearable() && value()) {
              <button
                type="button"
                class="sig-time-picker__clear"
                (click)="clear()"
              >
                Temizle
              </button>
            }
            <button
              type="button"
              class="sig-time-picker__confirm"
              (click)="confirm()"
            >
              Tamam
            </button>
          </div>
        </div>
      }
    </div>
  `,
    host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigTimePickerComponent implements ControlValueAccessor {
  readonly value = model<TimeValue | null>(null);
  readonly placeholder = input<string>('Saat seçin');
  readonly disabled = input<boolean>(false);
  readonly use24Hour = input<boolean>(true);
  readonly showSeconds = input<boolean>(false);
  readonly minuteStep = input<number>(1);
  readonly secondStep = input<number>(1);
  readonly clearable = input<boolean>(true);
  readonly minTime = input<TimeValue | null>(null);
  readonly maxTime = input<TimeValue | null>(null);

  readonly timeSelected = output<TimeValue>();

  readonly isOpen = signal(false);
  readonly selectedHour = signal(0);
  readonly selectedMinute = signal(0);
  readonly selectedSecond = signal(0);
  readonly period = signal<'AM' | 'PM'>('AM');

  private _onChange: (value: TimeValue | null) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly hours = computed(() => {
    const max = this.use24Hour() ? 24 : 12;
    const start = this.use24Hour() ? 0 : 1;
    return Array.from({ length: max }, (_, i) => i + start);
  });

  readonly minutes = computed(() => {
    const step = this.minuteStep();
    return Array.from({ length: Math.floor(60 / step) }, (_, i) => i * step);
  });

  readonly secondsArray = computed(() => {
    const step = this.secondStep();
    return Array.from({ length: Math.floor(60 / step) }, (_, i) => i * step);
  });

  readonly formattedTime = computed(() => {
    const val = this.value();
    if (!val) return '';

    let hours = val.hours;
    let suffix = '';

    if (!this.use24Hour()) {
      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const parts = [this.padZero(hours), this.padZero(val.minutes)];
    if (this.showSeconds() && val.seconds !== undefined) {
      parts.push(this.padZero(val.seconds));
    }

    return parts.join(':') + suffix;
  });

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
      if (this.isOpen()) {
        this.syncFromValue();
      }
    }
  }

  selectHour(hour: number): void {
    this.selectedHour.set(hour);
  }

  selectMinute(minute: number): void {
    this.selectedMinute.set(minute);
  }

  selectSecond(second: number): void {
    this.selectedSecond.set(second);
  }

  selectPeriod(p: 'AM' | 'PM'): void {
    this.period.set(p);
  }

  selectNow(): void {
    const now = new Date();
    this.selectedHour.set(this.use24Hour() ? now.getHours() : (now.getHours() % 12 || 12));
    this.selectedMinute.set(now.getMinutes());
    this.selectedSecond.set(now.getSeconds());
    this.period.set(now.getHours() >= 12 ? 'PM' : 'AM');
  }

  confirm(): void {
    let hours = this.selectedHour();
    
    if (!this.use24Hour()) {
      if (this.period() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (this.period() === 'AM' && hours === 12) {
        hours = 0;
      }
    }

    const timeValue: TimeValue = {
      hours,
      minutes: this.selectedMinute(),
    };

    if (this.showSeconds()) {
      timeValue.seconds = this.selectedSecond();
    }

    this.value.set(timeValue);
    this._onChange(timeValue);
    this.timeSelected.emit(timeValue);
    this.isOpen.set(false);
  }

  clear(): void {
    this.value.set(null);
    this._onChange(null);
    this.isOpen.set(false);
  }

  padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-time-picker')) {
      this.isOpen.set(false);
    }
  }

  private syncFromValue(): void {
    const val = this.value();
    if (val) {
      let hours = val.hours;
      if (!this.use24Hour()) {
        this.period.set(hours >= 12 ? 'PM' : 'AM');
        hours = hours % 12 || 12;
      }
      this.selectedHour.set(hours);
      this.selectedMinute.set(val.minutes);
      this.selectedSecond.set(val.seconds ?? 0);
    } else {
      const now = new Date();
      this.selectedHour.set(this.use24Hour() ? now.getHours() : (now.getHours() % 12 || 12));
      this.selectedMinute.set(0);
      this.selectedSecond.set(0);
      this.period.set(now.getHours() >= 12 ? 'PM' : 'AM');
    }
  }

  writeValue(value: TimeValue | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TimeValue | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}