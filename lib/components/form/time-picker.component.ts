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
    OnInit,
    ElementRef,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

export interface TimeValue {
    hours: number;
    minutes: number;
    seconds?: number;
}

/**
 * SigTimePicker - Signal-based accessible time picker
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
      <!-- Trigger -->
      <button
        #triggerBtn
        type="button"
        class="sig-time-picker__trigger"
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
        <span class="sig-time-picker__value">
          @if (value()) {
            {{ formattedTime() }}
          } @else {
            <span class="sig-time-picker__placeholder">{{ placeholder() }}</span>
          }
        </span>
        <span class="sig-time-picker__icon" aria-hidden="true">🕐</span>
      </button>

      <!-- Dialog -->
      @if (isOpen()) {
        <div 
          #dialogEl
          class="sig-time-picker__dropdown"
          [id]="dialogId"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'Saat seçin'"
          (keydown)="onDialogKeydown($event)"
        >
          <div class="sig-time-picker__columns">
            <!-- Hours -->
            <div class="sig-time-picker__column" role="listbox" [attr.aria-label]="'Saat'">
              <div class="sig-time-picker__column-header" id="hour-label">Saat</div>
              <div class="sig-time-picker__scroll" aria-labelledby="hour-label">
                @for (hour of hours(); track hour) {
                  <button
                    type="button"
                    role="option"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="hour === selectedHour()"
                    [attr.aria-selected]="hour === selectedHour()"
                    [tabindex]="hour === selectedHour() ? 0 : -1"
                    (click)="selectHour(hour)"
                    (keydown)="onOptionKeydown($event, 'hour', hour)"
                  >
                    {{ padZero(hour) }}
                  </button>
                }
              </div>
            </div>

            <!-- Minutes -->
            <div class="sig-time-picker__column" role="listbox" [attr.aria-label]="'Dakika'">
              <div class="sig-time-picker__column-header" id="minute-label">Dakika</div>
              <div class="sig-time-picker__scroll" aria-labelledby="minute-label">
                @for (minute of minutes(); track minute) {
                  <button
                    type="button"
                    role="option"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="minute === selectedMinute()"
                    [attr.aria-selected]="minute === selectedMinute()"
                    [tabindex]="minute === selectedMinute() ? 0 : -1"
                    (click)="selectMinute(minute)"
                    (keydown)="onOptionKeydown($event, 'minute', minute)"
                  >
                    {{ padZero(minute) }}
                  </button>
                }
              </div>
            </div>

            <!-- Seconds -->
            @if (showSeconds()) {
              <div class="sig-time-picker__column" role="listbox" [attr.aria-label]="'Saniye'">
                <div class="sig-time-picker__column-header" id="second-label">Saniye</div>
                <div class="sig-time-picker__scroll" aria-labelledby="second-label">
                  @for (second of secondsArray(); track second) {
                    <button
                      type="button"
                      role="option"
                      class="sig-time-picker__option"
                      [class.sig-time-picker__option--selected]="second === selectedSecond()"
                      [attr.aria-selected]="second === selectedSecond()"
                      [tabindex]="second === selectedSecond() ? 0 : -1"
                      (click)="selectSecond(second)"
                      (keydown)="onOptionKeydown($event, 'second', second)"
                    >
                      {{ padZero(second) }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- AM/PM -->
            @if (!use24Hour()) {
              <div class="sig-time-picker__column sig-time-picker__column--period" role="listbox" [attr.aria-label]="'AM/PM'">
                <div class="sig-time-picker__column-header">AM/PM</div>
                <div class="sig-time-picker__scroll">
                  <button
                    type="button"
                    role="option"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="period() === 'AM'"
                    [attr.aria-selected]="period() === 'AM'"
                    [tabindex]="period() === 'AM' ? 0 : -1"
                    (click)="selectPeriod('AM')"
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    role="option"
                    class="sig-time-picker__option"
                    [class.sig-time-picker__option--selected]="period() === 'PM'"
                    [attr.aria-selected]="period() === 'PM'"
                    [tabindex]="period() === 'PM' ? 0 : -1"
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
export class SigTimePickerComponent implements ControlValueAccessor, OnInit {
    @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;
    @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLDivElement>;

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

    // A11y inputs
    readonly ariaLabel = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);

    readonly timeSelected = output<TimeValue>();

    readonly isOpen = signal(false);
    readonly selectedHour = signal(0);
    readonly selectedMinute = signal(0);
    readonly selectedSecond = signal(0);
    readonly period = signal<'AM' | 'PM'>('AM');

    // IDs
    triggerId = '';
    dialogId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: TimeValue | null) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.triggerId = generateId('sig-timepicker-trigger');
        this.dialogId = generateId('sig-timepicker-dialog');
    }

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

    getButtonLabel(): string {
        const label = this.ariaLabel() || 'Saat seçin';
        const val = this.value();
        if (val) {
            return `${label}, seçili saat: ${this.formattedTime()}`;
        }
        return label;
    }

    toggle(): void {
        if (!this.isDisabled()) {
            if (this.isOpen()) {
                this.closeDialog();
            } else {
                this.openDialog();
            }
        }
    }

    private openDialog(): void {
        this.isOpen.set(true);
        this.syncFromValue();
        announce('Saat seçici açıldı', 'polite');
    }

    private closeDialog(): void {
        this.isOpen.set(false);
        this.triggerBtn.nativeElement.focus();
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === Keys.ARROW_DOWN || event.key === Keys.ENTER || event.key === Keys.SPACE) {
            event.preventDefault();
            if (!this.isOpen()) {
                this.openDialog();
            }
        }
    }

    onDialogKeydown(event: KeyboardEvent): void {
        if (event.key === Keys.ESCAPE) {
            event.preventDefault();
            this.closeDialog();
        }
    }

    onOptionKeydown(event: KeyboardEvent, type: 'hour' | 'minute' | 'second', current: number): void {
        let list: number[];
        let setter: (val: number) => void;

        switch (type) {
            case 'hour':
                list = this.hours();
                setter = (v) => this.selectedHour.set(v);
                break;
            case 'minute':
                list = this.minutes();
                setter = (v) => this.selectedMinute.set(v);
                break;
            case 'second':
                list = this.secondsArray();
                setter = (v) => this.selectedSecond.set(v);
                break;
        }

        const currentIndex = list.indexOf(current);
        let newIndex = currentIndex;

        switch (event.key) {
            case Keys.ARROW_UP:
                event.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : list.length - 1;
                break;
            case Keys.ARROW_DOWN:
                event.preventDefault();
                newIndex = currentIndex < list.length - 1 ? currentIndex + 1 : 0;
                break;
            case Keys.HOME:
                event.preventDefault();
                newIndex = 0;
                break;
            case Keys.END:
                event.preventDefault();
                newIndex = list.length - 1;
                break;
        }

        if (newIndex !== currentIndex) {
            setter(list[newIndex]);
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
        announce(`${this.formattedTime()} seçildi`, 'polite');
        this.closeDialog();
    }

    clear(): void {
        this.value.set(null);
        this._onChange(null);
        announce('Saat temizlendi', 'polite');
        this.closeDialog();
    }

    padZero(num: number): string {
        return num.toString().padStart(2, '0');
    }

    onClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.sig-time-picker')) {
            if (this.isOpen()) {
                this.closeDialog();
            }
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

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
