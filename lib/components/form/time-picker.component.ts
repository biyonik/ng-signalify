import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
  output,
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
  styles: [`
    .sig-time-picker {
      position: relative;
      width: 100%;
    }

    .sig-time-picker__trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .sig-time-picker__trigger:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-time-picker__trigger:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-time-picker__value {
      flex: 1;
      text-align: left;
    }

    .sig-time-picker__placeholder {
      color: #9ca3af;
    }

    .sig-time-picker__icon {
      font-size: 1rem;
    }

    .sig-time-picker__dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 50;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .sig-time-picker__columns {
      display: flex;
    }

    .sig-time-picker__column {
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e5e7eb;
    }

    .sig-time-picker__column:last-child {
      border-right: none;
    }

    .sig-time-picker__column--period {
      min-width: 50px;
    }

    .sig-time-picker__column-header {
      padding: 0.5rem;
      font-size: 0.625rem;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      text-align: center;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-time-picker__scroll {
      max-height: 200px;
      overflow-y: auto;
      padding: 0.25rem;
    }

    .sig-time-picker__option {
      width: 100%;
      padding: 0.375rem 0.75rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: #374151;
      text-align: center;
      cursor: pointer;
      border-radius: 0.25rem;
      transition: background-color 0.1s;
    }

    .sig-time-picker__option:hover {
      background-color: #f3f4f6;
    }

    .sig-time-picker__option--selected {
      background-color: #3b82f6;
      color: white;
    }

    .sig-time-picker__option--selected:hover {
      background-color: #2563eb;
    }

    .sig-time-picker__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .sig-time-picker__now,
    .sig-time-picker__clear,
    .sig-time-picker__confirm {
      padding: 0.25rem 0.5rem;
      border: none;
      background: none;
      font-size: 0.75rem;
      color: #3b82f6;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .sig-time-picker__now:hover,
    .sig-time-picker__clear:hover,
    .sig-time-picker__confirm:hover {
      background-color: #eff6ff;
    }

    .sig-time-picker__confirm {
      background-color: #3b82f6;
      color: white;
    }

    .sig-time-picker__confirm:hover {
      background-color: #2563eb;
    }
  `],
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