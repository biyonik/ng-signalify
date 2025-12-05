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

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

/**
 * SigDatePicker - Signal-based date picker
 * 
 * Usage:
 * <sig-date-picker
 *   [(value)]="selectedDate"
 *   [minDate]="minDate"
 *   [maxDate]="maxDate"
 *   placeholder="Tarih seçin"
 * />
 */
@Component({
  selector: 'sig-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-date-picker" [class.sig-date-picker--open]="isOpen()">
      <!-- Input -->
      <button
        type="button"
        class="sig-date-picker__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="sig-date-picker__value">
          @if (value()) {
            {{ formatDate(value()!) }}
          } @else {
            <span class="sig-date-picker__placeholder">{{ placeholder() }}</span>
          }
        </span>
        <span class="sig-date-picker__icon">📅</span>
      </button>

      <!-- Calendar Dropdown -->
      @if (isOpen()) {
        <div class="sig-date-picker__dropdown">
          <!-- Header -->
          <div class="sig-date-picker__header">
            <button
              type="button"
              class="sig-date-picker__nav"
              (click)="prevMonth()"
            >
              ‹
            </button>
            <span class="sig-date-picker__month-year">
              {{ monthNames[viewMonth()] }} {{ viewYear() }}
            </span>
            <button
              type="button"
              class="sig-date-picker__nav"
              (click)="nextMonth()"
            >
              ›
            </button>
          </div>

          <!-- Weekdays -->
          <div class="sig-date-picker__weekdays">
            @for (day of weekDays; track day) {
              <span class="sig-date-picker__weekday">{{ day }}</span>
            }
          </div>

          <!-- Days -->
          <div class="sig-date-picker__days">
            @for (day of calendarDays(); track day.date.getTime()) {
              <button
                type="button"
                class="sig-date-picker__day"
                [class.sig-date-picker__day--other-month]="!day.isCurrentMonth"
                [class.sig-date-picker__day--today]="day.isToday"
                [class.sig-date-picker__day--selected]="day.isSelected"
                [class.sig-date-picker__day--disabled]="day.isDisabled"
                [disabled]="day.isDisabled"
                (click)="selectDate(day.date)"
              >
                {{ day.day }}
              </button>
            }
          </div>

          <!-- Footer -->
          <div class="sig-date-picker__footer">
            <button
              type="button"
              class="sig-date-picker__today"
              (click)="selectToday()"
            >
              Bugün
            </button>
            @if (clearable() && value()) {
              <button
                type="button"
                class="sig-date-picker__clear"
                (click)="clear()"
              >
                Temizle
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-date-picker {
      position: relative;
      width: 100%;
    }

    .sig-date-picker__trigger {
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

    .sig-date-picker__trigger:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-date-picker__trigger:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-date-picker__value {
      flex: 1;
      text-align: left;
    }

    .sig-date-picker__placeholder {
      color: #9ca3af;
    }

    .sig-date-picker__icon {
      font-size: 1rem;
    }

    .sig-date-picker__dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 50;
      width: 280px;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      padding: 0.75rem;
    }

    .sig-date-picker__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .sig-date-picker__nav {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 1.25rem;
      color: #6b7280;
    }

    .sig-date-picker__nav:hover {
      background-color: #f3f4f6;
    }

    .sig-date-picker__month-year {
      font-weight: 600;
      color: #374151;
    }

    .sig-date-picker__weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.125rem;
      margin-bottom: 0.25rem;
    }

    .sig-date-picker__weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: #9ca3af;
      padding: 0.25rem;
    }

    .sig-date-picker__days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.125rem;
    }

    .sig-date-picker__day {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-date-picker__day:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .sig-date-picker__day--other-month {
      color: #d1d5db;
    }

    .sig-date-picker__day--today {
      font-weight: 600;
      color: #3b82f6;
    }

    .sig-date-picker__day--selected {
      background-color: #3b82f6 !important;
      color: white !important;
      font-weight: 600;
    }

    .sig-date-picker__day--disabled {
      color: #d1d5db;
      cursor: not-allowed;
    }

    .sig-date-picker__footer {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    .sig-date-picker__today,
    .sig-date-picker__clear {
      padding: 0.25rem 0.5rem;
      border: none;
      background: none;
      font-size: 0.75rem;
      color: #3b82f6;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .sig-date-picker__today:hover,
    .sig-date-picker__clear:hover {
      background-color: #eff6ff;
    }
  `],
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigDatePickerComponent implements ControlValueAccessor {
  readonly value = model<Date | null>(null);
  readonly placeholder = input<string>('Tarih seçin');
  readonly disabled = input<boolean>(false);
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly clearable = input<boolean>(true);
  readonly format = input<string>('dd.MM.yyyy');

  readonly dateSelected = output<Date>();

  readonly isOpen = signal(false);
  readonly viewMonth = signal(new Date().getMonth());
  readonly viewYear = signal(new Date().getFullYear());

  readonly weekDays = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  readonly monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  private _onChange: (value: Date | null) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const today = new Date();
    const selected = this.value();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Start from Sunday of the first week
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: CalendarDay[] = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(current);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        isSelected: selected ? this.isSameDay(date, selected) : false,
        isDisabled: this.isDateDisabled(date),
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  });

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
      if (this.isOpen() && this.value()) {
        this.viewMonth.set(this.value()!.getMonth());
        this.viewYear.set(this.value()!.getFullYear());
      }
    }
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  selectDate(date: Date): void {
    this.value.set(date);
    this._onChange(date);
    this._onTouched();
    this.dateSelected.emit(date);
    this.isOpen.set(false);
  }

  selectToday(): void {
    this.selectDate(new Date());
  }

  clear(): void {
    this.value.set(null);
    this._onChange(null);
    this.isOpen.set(false);
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-date-picker')) {
      this.isOpen.set(false);
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  writeValue(value: Date | null): void {
    this.value.set(value);
    if (value) {
      this.viewMonth.set(value.getMonth());
      this.viewYear.set(value.getFullYear());
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}