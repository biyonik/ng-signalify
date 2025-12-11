import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  computed,
  input,
  output,
  model,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
  Injector,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '../../utils/a11y.utils';
import { FieldValue } from '../../fields';
import { signal } from '@angular/core';
import {EnhancedFieldValue} from "../../schemas/form-state";

@Component({
  selector: 'sig-textarea',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigTextareaComponent),
      multi: true,
    },
  ],
  template: `
        <div class="sig-textarea"
             [class.sig-textarea--error]="hasError()"
             [class.sig-textarea--disabled]="isDisabled()">

            <textarea
                #textareaElement
                [id]="inputId"
                [placeholder]="placeholder()"
                [disabled]="isDisabled()"
                [readonly]="readonly()"
                [rows]="rows()"
                [attr.maxlength]="maxLength()"
                (input)="onInput($event)"
                (blur)="onBlur()"
                (focus)="onFocusEvent()"
                class="sig-textarea__field"
            ></textarea>
        </div>
    `,
})
export class SigTextareaComponent implements ControlValueAccessor, AfterViewInit {
  private readonly injector = inject(Injector);
  @ViewChild('textareaElement') textareaElement!: ElementRef<HTMLTextAreaElement>;

  readonly placeholder = input<string>('');
  readonly rows = input<number>(3);
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly maxLength = input<number | null>(null);

  // --- SMART BINDING ---
  readonly field = input<FieldValue<any> | EnhancedFieldValue<any> | null>(null);
  readonly value = model<string | null>(null);

  readonly focus = output<void>();
  readonly blur = output<void>();

  inputId = generateId('sig-textarea');
  private _isUserInput = false;
  private _disabledByForm = signal(false); // signal import etmeyi unutma!

  readonly isDisabled = computed(() => {
    const f = this.field();
    const fieldDisabled = (f && 'enabled' in f) ? !f.enabled() : false;
    return this.disabled() || this._disabledByForm() || fieldDisabled;
  });

  readonly hasError = computed(() => {
    const f = this.field();
    return f ? (!!f.error() && f.touched()) : false;
  });

  readonly fieldValue = computed(() => {
    const f = this.field();
    return f ? f.value() : this.value();
  });

  private _onChange: (value: any) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.syncValue(this.fieldValue());

    effect(() => {
      const val = this.fieldValue();
      if (!this._isUserInput) {
        this.syncValue(val);
      }
      this._isUserInput = false;
    }, { injector: this.injector });
  }

  onInput(event: Event): void {
    this._isUserInput = true;
    const val = (event.target as HTMLTextAreaElement).value || null;

    const f = this.field();
    if (f) {
      f.value.set(val);
      if (!f.touched()) f.touched.set(true);
    }

    this.value.set(val);
    this._onChange(val);
  }

  onBlur(): void {
    this._onTouched();
    const f = this.field();
    if (f) f.touched.set(true);
    this.blur.emit();
  }

  onFocusEvent() { this.focus.emit(); }

  private syncValue(val: any) {
    if (this.textareaElement?.nativeElement) {
      const display = val ?? '';
      if (this.textareaElement.nativeElement.value !== display) {
        this.textareaElement.nativeElement.value = display;
      }
    }
  }

  writeValue(obj: any): void { this.value.set(obj); }
  registerOnChange(fn: any): void { this._onChange = fn; }
  registerOnTouched(fn: any): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this._disabledByForm.set(isDisabled); }
}


