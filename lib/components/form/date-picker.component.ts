import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    forwardRef,
    input,
    model,
    OnInit,
    output,
    signal,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {announce, generateId, Keys} from '../../utils/a11y.utils';

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
}

/**
 * SigDatePicker - Signal-based accessible date picker
 *
 * ARIA Pattern: Date Picker Dialog
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
 */
@Component({
    selector: 'sig-date-picker',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigDatePickerComponent),
            multi: true,
        },
    ],
    template: `
      <div class="sig-date-picker" [class.sig-date-picker--open]="isOpen()">
        <!-- Trigger Button -->
        <button
          #triggerBtn
          type="button"
          class="sig-date-picker__trigger"
          [id]="triggerId"
          [disabled]="isDisabled()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-controls]="dialogId"
          [attr.aria-label]="getButtonLabel()"
          [attr.aria-describedby]="ariaDescribedBy() || null"
          [attr.aria-invalid]="ariaInvalid()"
          (click)="toggle()"
          (keydown)="onTriggerKeydown($event)"
        >
        <span class="sig-date-picker__value">
          @if (value()) {
            {{ formatDate(value()!) }}
          } @else {
            <span class="sig-date-picker__placeholder">{{ placeholder() }}</span>
          }
        </span>
          <span class="sig-date-picker__icon" aria-hidden="true">📅</span>
        </button>

        <!-- Calendar Dialog -->
        @if (isOpen()) {
          <div
            #calendarDialog
            class="sig-date-picker__dropdown"
            [id]="dialogId"
            role="dialog"
            aria-modal="true"
            [attr.aria-label]="'Tarih seçin: ' + monthNames[viewMonth()] + ' ' + viewYear()"
            (keydown)="onCalendarKeydown($event)"
          >
            <!-- Header -->
            <div class="sig-date-picker__header">
              <button
                type="button"
                class="sig-date-picker__nav"
                (click)="prevMonth()"
                aria-label="Önceki ay"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <div
                class="sig-date-picker__month-year"
                aria-live="polite"
                aria-atomic="true"
              >
                {{ monthNames[viewMonth()] }} {{ viewYear() }}
              </div>
              <button
                type="button"
                class="sig-date-picker__nav"
                (click)="nextMonth()"
                aria-label="Sonraki ay"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>

            <!-- Weekdays -->
            <div class="sig-date-picker__weekdays" role="row">
              @for (day of weekDaysFull; track day; let i = $index) {
                <span
                  class="sig-date-picker__weekday"
                  role="columnheader"
                  [attr.aria-label]="day"
                >
                {{ weekDays[i] }}
              </span>
              }
            </div>

            <!-- Days Grid -->
            <div
              class="sig-date-picker__days"
              role="grid"
              [attr.aria-label]="monthNames[viewMonth()] + ' ' + viewYear()"
            >
              @for (week of calendarWeeks(); track week) {
                <div role="row" class="sig-date-picker__week">
                  @for (day of week; track day.date.getTime()) {
                    <button
                      type="button"
                      role="gridcell"
                      class="sig-date-picker__day"
                      [class.sig-date-picker__day--other-month]="!day.isCurrentMonth"
                      [class.sig-date-picker__day--today]="day.isToday"
                      [class.sig-date-picker__day--selected]="day.isSelected"
                      [class.sig-date-picker__day--disabled]="day.isDisabled"
                      [class.sig-date-picker__day--focused]="isFocusedDate(day.date)"
                      [disabled]="day.isDisabled"
                      [tabindex]="isFocusedDate(day.date) ? 0 : -1"
                      [attr.aria-selected]="day.isSelected"
                      [attr.aria-current]="day.isToday ? 'date' : null"
                      [attr.aria-label]="getDateLabel(day.date)"
                      (click)="selectDate(day.date)"
                    >
                      {{ day.day }}
                    </button>
                  }
                </div>
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
    host: {
        '(document:click)': 'onClickOutside($event)',
    },
})
export class SigDatePickerComponent implements ControlValueAccessor, OnInit {
    @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;
    @ViewChild('calendarDialog') calendarDialog?: ElementRef<HTMLDivElement>;

    readonly value = model<Date | null>(null);
    readonly placeholder = input<string>('Tarih seçin');
    readonly disabled = input<boolean>(false);
    readonly minDate = input<Date | null>(null);
    readonly maxDate = input<Date | null>(null);
    readonly clearable = input<boolean>(true);
    readonly format = input<string>('dd.MM.yyyy');

    // A11y inputs
    readonly ariaLabel = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);

    readonly dateSelected = output<Date>();

    readonly isOpen = signal(false);
    readonly viewMonth = signal(new Date().getMonth());
    readonly viewYear = signal(new Date().getFullYear());
    readonly focusedDate = signal<Date>(new Date());

    // IDs
    triggerId = '';
    dialogId = '';

    readonly weekDays = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    readonly weekDaysFull = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    readonly monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: Date | null) => void = () => {
    };
    private _onTouched: () => void = () => {
    };

    ngOnInit(): void {
        this.triggerId = generateId('sig-datepicker-trigger');
        this.dialogId = generateId('sig-datepicker-dialog');
    }

    readonly calendarDays = computed<CalendarDay[]>(() => {
        const year = this.viewYear();
        const month = this.viewMonth();
        const today = new Date();
        const selected = this.value();

        const firstDayOfMonth = new Date(year, month, 1);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const days: CalendarDay[] = [];
        const current = new Date(startDate);

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

    readonly calendarWeeks = computed(() => {
        const days = this.calendarDays();
        const weeks = [];

        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, 7 + i));
        }

        return weeks;
    });


    getButtonLabel(): string {
        const label = this.ariaLabel() || 'Tarih seçin';
        const val = this.value();
        if (val) {
            return `${label}, seçili tarih: ${this.getDateLabel(val)}`;
        }
        return label;
    }

    getDateLabel(date: Date): string {
        const dayName = this.weekDaysFull[date.getDay()];
        const day = date.getDate();
        const month = this.monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}, ${dayName}`;
    }

    isFocusedDate(date: Date): boolean {
        return this.isSameDay(date, this.focusedDate());
    }

    toggle(): void {
        if (!this.isDisabled()) {
            if (this.isOpen()) {
                this.closeCalendar();
            } else {
                this.openCalendar();
            }
        }
    }

    private openCalendar(): void {
        this.isOpen.set(true);

        const val = this.value();
        if (val) {
            this.viewMonth.set(val.getMonth());
            this.viewYear.set(val.getFullYear());
            this.focusedDate.set(val);
        } else {
            this.focusedDate.set(new Date());
        }

        announce(`Takvim açıldı. ${this.monthNames[this.viewMonth()]} ${this.viewYear()}`, 'polite');

        // Focus first focusable day after opening
        setTimeout(() => {
            this.focusCurrentDate();
        }, 50);
    }

    private closeCalendar(): void {
        this.isOpen.set(false);
        this.triggerBtn.nativeElement.focus();
    }

    private focusCurrentDate(): void {
        const focusedEl = this.calendarDialog?.nativeElement.querySelector(
            '.sig-date-picker__day--focused'
        ) as HTMLButtonElement;
        focusedEl?.focus();
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === Keys.ARROW_DOWN || event.key === Keys.ENTER || event.key === Keys.SPACE) {
            event.preventDefault();
            if (!this.isOpen()) {
                this.openCalendar();
            }
        }
    }

    onCalendarKeydown(event: KeyboardEvent): void {
        const focused = this.focusedDate();
        let newDate: Date | null = null;

        switch (event.key) {
            case Keys.ARROW_LEFT:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setDate(newDate.getDate() - 1);
                break;
            case Keys.ARROW_RIGHT:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setDate(newDate.getDate() + 1);
                break;
            case Keys.ARROW_UP:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setDate(newDate.getDate() - 7);
                break;
            case Keys.ARROW_DOWN:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setDate(newDate.getDate() + 7);
                break;
            case Keys.HOME:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setDate(1);
                break;
            case Keys.END:
                event.preventDefault();
                newDate = new Date(focused);
                newDate.setMonth(newDate.getMonth() + 1, 0);
                break;
            case 'PageUp':
                event.preventDefault();
                newDate = new Date(focused);
                if (event.shiftKey) {
                    newDate.setFullYear(newDate.getFullYear() - 1);
                } else {
                    newDate.setMonth(newDate.getMonth() - 1);
                }
                break;
            case 'PageDown':
                event.preventDefault();
                newDate = new Date(focused);
                if (event.shiftKey) {
                    newDate.setFullYear(newDate.getFullYear() + 1);
                } else {
                    newDate.setMonth(newDate.getMonth() + 1);
                }
                break;
            case Keys.ENTER:
            case Keys.SPACE:
                event.preventDefault();
                if (!this.isDateDisabled(focused)) {
                    this.selectDate(focused);
                }
                break;
            case Keys.ESCAPE:
                event.preventDefault();
                this.closeCalendar();
                break;
        }

        if (newDate && !this.isDateDisabled(newDate)) {
            this.focusedDate.set(newDate);

            // Update view if necessary
            if (newDate.getMonth() !== this.viewMonth() || newDate.getFullYear() !== this.viewYear()) {
                this.viewMonth.set(newDate.getMonth());
                this.viewYear.set(newDate.getFullYear());
            }

            setTimeout(() => this.focusCurrentDate(), 0);
        }
    }

    prevMonth(): void {
        if (this.viewMonth() === 0) {
            this.viewMonth.set(11);
            this.viewYear.update((y) => y - 1);
        } else {
            this.viewMonth.update((m) => m - 1);
        }
        announce(`${this.monthNames[this.viewMonth()]} ${this.viewYear()}`, 'polite');
    }

    nextMonth(): void {
        if (this.viewMonth() === 11) {
            this.viewMonth.set(0);
            this.viewYear.update((y) => y + 1);
        } else {
            this.viewMonth.update((m) => m + 1);
        }
        announce(`${this.monthNames[this.viewMonth()]} ${this.viewYear()}`, 'polite');
    }

    selectDate(date: Date): void {
        this.value.set(date);
        this._onChange(date);
        this._onTouched();
        this.dateSelected.emit(date);
        announce(`${this.getDateLabel(date)} seçildi`, 'polite');
        this.closeCalendar();
    }

    selectToday(): void {
        this.selectDate(new Date());
    }

    clear(): void {
        this.value.set(null);
        this._onChange(null);
        announce('Tarih temizlendi', 'polite');
        this.closeCalendar();
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
            if (this.isOpen()) {
                this.closeCalendar();
            }
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

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
