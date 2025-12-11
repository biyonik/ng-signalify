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

export interface DateRangeInterface {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePreset {
  label: string;
  range: DateRangeInterface;
}

/**
 * SigDateRangePicker - Signal-based date range picker
 * 
 * Usage:
 * <sig-date-range-picker
 *   [(value)]="dateRange"
 *   [presets]="presets"
 *   placeholder="Tarih aralığı seçin"
 * />
 */
@Component({
  selector: 'sig-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigDateRangePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-date-range" [class.sig-date-range--open]="isOpen()">
      <!-- Trigger -->
      <button
        type="button"
        class="sig-date-range__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="sig-date-range__icon">📅</span>
        <span class="sig-date-range__value">
          @if (value()?.start && value()?.end) {
            {{ formatDate(value()!.start!) }} - {{ formatDate(value()!.end!) }}
          } @else {
            <span class="sig-date-range__placeholder">{{ placeholder() }}</span>
          }
        </span>
        @if (clearable() && value()?.start) {
          <button
            type="button"
            class="sig-date-range__clear"
            (click)="clear($event)"
          >
            ✕
          </button>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="sig-date-range__dropdown">
          <!-- Presets -->
          @if (presets().length > 0) {
            <div class="sig-date-range__presets">
              @for (preset of presets(); track preset.label) {
                <button
                  type="button"
                  class="sig-date-range__preset"
                  (click)="selectPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              }
            </div>
          }

          <!-- Calendars -->
          <div class="sig-date-range__calendars">
            <!-- Start Calendar -->
            <div class="sig-date-range__calendar">
              <div class="sig-date-range__calendar-header">
                <button type="button" (click)="prevMonth('start')">◀</button>
                <span>{{ monthNames[startViewMonth()] }} {{ startViewYear() }}</span>
                <button type="button" (click)="nextMonth('start')">▶</button>
              </div>
              <div class="sig-date-range__weekdays">
                @for (day of weekDays; track day) {
                  <div class="sig-date-range__weekday">{{ day }}</div>
                }
              </div>
              <div class="sig-date-range__days">
                @for (day of startCalendarDays(); track $index) {
                  <button
                    type="button"
                    class="sig-date-range__day"
                    [class.sig-date-range__day--other]="!day.isCurrentMonth"
                    [class.sig-date-range__day--today]="day.isToday"
                    [class.sig-date-range__day--selected]="day.isSelected"
                    [class.sig-date-range__day--in-range]="day.isInRange"
                    [class.sig-date-range__day--range-start]="day.isRangeStart"
                    [class.sig-date-range__day--range-end]="day.isRangeEnd"
                    [class.sig-date-range__day--disabled]="day.isDisabled"
                    [disabled]="day.isDisabled"
                    (click)="selectDate(day.date)"
                    (mouseenter)="onDateHover(day.date)"
                  >
                    {{ day.day }}
                  </button>
                }
              </div>
            </div>

            <!-- End Calendar -->
            <div class="sig-date-range__calendar">
              <div class="sig-date-range__calendar-header">
                <button type="button" (click)="prevMonth('end')">◀</button>
                <span>{{ monthNames[endViewMonth()] }} {{ endViewYear() }}</span>
                <button type="button" (click)="nextMonth('end')">▶</button>
              </div>
              <div class="sig-date-range__weekdays">
                @for (day of weekDays; track day) {
                  <div class="sig-date-range__weekday">{{ day }}</div>
                }
              </div>
              <div class="sig-date-range__days">
                @for (day of endCalendarDays(); track $index) {
                  <button
                    type="button"
                    class="sig-date-range__day"
                    [class.sig-date-range__day--other]="!day.isCurrentMonth"
                    [class.sig-date-range__day--today]="day.isToday"
                    [class.sig-date-range__day--selected]="day.isSelected"
                    [class.sig-date-range__day--in-range]="day.isInRange"
                    [class.sig-date-range__day--range-start]="day.isRangeStart"
                    [class.sig-date-range__day--range-end]="day.isRangeEnd"
                    [class.sig-date-range__day--disabled]="day.isDisabled"
                    [disabled]="day.isDisabled"
                    (click)="selectDate(day.date)"
                    (mouseenter)="onDateHover(day.date)"
                  >
                    {{ day.day }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="sig-date-range__footer">
            <span class="sig-date-range__selection">
              @if (tempStart() && !tempEnd()) {
                {{ formatDate(tempStart()!) }} - ...
              } @else if (tempStart() && tempEnd()) {
                {{ formatDate(tempStart()!) }} - {{ formatDate(tempEnd()!) }}
              }
            </span>
            <div class="sig-date-range__actions">
              <button type="button" (click)="cancel()">İptal</button>
              <button 
                type="button" 
                class="sig-date-range__apply"
                [disabled]="!tempStart() || !tempEnd()"
                (click)="apply()"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigDateRangePickerComponent implements ControlValueAccessor {
  readonly value = model<DateRangeInterface | null>(null);
  readonly placeholder = input<string>('Tarih aralığı seçin');
  readonly disabled = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly presets = input<DateRangePreset[]>([]);

  readonly rangeSelected = output<DateRangeInterface>();

  readonly isOpen = signal(false);
  readonly tempStart = signal<Date | null>(null);
  readonly tempEnd = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);

  readonly startViewMonth = signal(new Date().getMonth());
  readonly startViewYear = signal(new Date().getFullYear());
  readonly endViewMonth = signal(new Date().getMonth() + 1);
  readonly endViewYear = signal(new Date().getFullYear());

  readonly weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  readonly monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  private _onChange: (value: DateRangeInterface | null) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly startCalendarDays = computed(() => {
    return this.generateCalendarDays(this.startViewYear(), this.startViewMonth());
  });

  readonly endCalendarDays = computed(() => {
    return this.generateCalendarDays(this.endViewYear(), this.endViewMonth());
  });

  private generateCalendarDays(year: number, month: number) {
    const days: any[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from Monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    // Previous month days
    for (let i = startOffset; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push(this.createDayObject(date, false, today));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(this.createDayObject(date, true, today));
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(this.createDayObject(date, false, today));
    }

    return days;
  }

  private createDayObject(date: Date, isCurrentMonth: boolean, today: Date) {
    const start = this.tempStart();
    const end = this.tempEnd() || this.hoverDate();
    
    const isStart = start && this.isSameDay(date, start);
    const isEnd = end && this.isSameDay(date, end);
    const isInRange = start && end && date > start && date < end;

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      isSelected: isStart || isEnd,
      isRangeStart: isStart,
      isRangeEnd: isEnd,
      isInRange,
      isDisabled: this.isDateDisabled(date),
    };
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
      if (this.isOpen()) {
        const val = this.value();
        this.tempStart.set(val?.start || null);
        this.tempEnd.set(val?.end || null);
      }
    }
  }

  selectDate(date: Date): void {
    const start = this.tempStart();

    if (!start || (start && this.tempEnd())) {
      this.tempStart.set(date);
      this.tempEnd.set(null);
    } else {
      if (date < start) {
        this.tempEnd.set(start);
        this.tempStart.set(date);
      } else {
        this.tempEnd.set(date);
      }
    }
  }

  onDateHover(date: Date): void {
    if (this.tempStart() && !this.tempEnd()) {
      this.hoverDate.set(date);
    }
  }

  selectPreset(preset: DateRangePreset): void {
    this.tempStart.set(preset.range.start);
    this.tempEnd.set(preset.range.end);
  }

  prevMonth(calendar: 'start' | 'end'): void {
    if (calendar === 'start') {
      if (this.startViewMonth() === 0) {
        this.startViewMonth.set(11);
        this.startViewYear.update((y) => y - 1);
      } else {
        this.startViewMonth.update((m) => m - 1);
      }
    } else {
      if (this.endViewMonth() === 0) {
        this.endViewMonth.set(11);
        this.endViewYear.update((y) => y - 1);
      } else {
        this.endViewMonth.update((m) => m - 1);
      }
    }
  }

  nextMonth(calendar: 'start' | 'end'): void {
    if (calendar === 'start') {
      if (this.startViewMonth() === 11) {
        this.startViewMonth.set(0);
        this.startViewYear.update((y) => y + 1);
      } else {
        this.startViewMonth.update((m) => m + 1);
      }
    } else {
      if (this.endViewMonth() === 11) {
        this.endViewMonth.set(0);
        this.endViewYear.update((y) => y + 1);
      } else {
        this.endViewMonth.update((m) => m + 1);
      }
    }
  }

  apply(): void {
    const range: DateRangeInterface = {
      start: this.tempStart(),
      end: this.tempEnd(),
    };
    this.value.set(range);
    this._onChange(range);
    this.rangeSelected.emit(range);
    this.isOpen.set(false);
  }

  cancel(): void {
    this.tempStart.set(null);
    this.tempEnd.set(null);
    this.isOpen.set(false);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this._onChange(null);
    this.tempStart.set(null);
    this.tempEnd.set(null);
  }

  formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-date-range')) {
      this.isOpen.set(false);
    }
  }

  writeValue(value: DateRangeInterface | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: DateRangeInterface | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}