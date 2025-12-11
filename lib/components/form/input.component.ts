import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  model,
  ViewEncapsulation,
  OnInit,
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
import {EnhancedFieldValue} from "../../schemas/form-state";

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';

@Component({
  selector: 'sig-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigInputComponent),
      multi: true,
    },
  ],
  template: `
        <div class="sig-input"
             [class.sig-input--with-icon]="icon()"
             [class.sig-input--error]="hasError()"
             [class.sig-input--disabled]="isDisabled()">

            @if (icon() && iconPosition() === 'left') {
                <span class="sig-input__icon sig-input__icon--left" aria-hidden="true">{{ icon() }}</span>
            }

            <input
                #inputElement
                [id]="inputId"
                [type]="actualType()"
                [placeholder]="placeholder()"
                [disabled]="isDisabled()"
                [readonly]="readonly()"
                [attr.maxlength]="maxLength()"
                [autocomplete]="autocomplete()"
                (input)="onInput($event)"
                (blur)="onBlur()"
                (focus)="onFocusEvent()"
                class="sig-input__field"
            />

            @if (type() === 'password') {
                <button
                    type="button"
                    class="sig-input__toggle"
                    (click)="togglePassword()"
                    tabindex="-1"
                    [attr.aria-label]="showPassword() ? 'Şifreyi gizle' : 'Şifreyi göster'"
                >
                    <span aria-hidden="true">{{ showPassword() ? '👁️' : '👁️‍🗨️' }}</span>
                </button>
            }

            @if (clearable() && (value() || fieldValue())) {
                <button
                    type="button"
                    class="sig-input__clear"
                    (click)="onClear()"
                    tabindex="-1"
                    aria-label="Temizle"
                >
                    <span aria-hidden="true">✕</span>
                </button>
            }

            @if (icon() && iconPosition() === 'right') {
                <span class="sig-input__icon sig-input__icon--right" aria-hidden="true">{{ icon() }}</span>
            }
        </div>
    `,
})
export class SigInputComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  private readonly injector = inject(Injector);
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  // --- Inputs ---
  readonly type = input<InputType>('text');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly icon = input<string>('');
  readonly iconPosition = input<'left' | 'right'>('left');
  readonly maxLength = input<number | null>(null);
  readonly autocomplete = input<string>('off');

  // --- SMART FIELD BINDING ---
  readonly field = input<FieldValue<any> | EnhancedFieldValue<any> | null>(null);

  // --- CLASSIC MODEL ---
  readonly value = model<string | number | null>(null);

  // --- Outputs ---
  readonly focus = output<void>();
  readonly blur = output<void>();

  // --- Internal State ---
  readonly showPassword = signal(false);
  inputId = generateId('sig-input');
  private _isUserInput = false;
  private _disabledByForm = signal(false);

  // --- Computed ---
  readonly actualType = computed(() => (this.type() === 'password' && this.showPassword()) ? 'text' : this.type());

  // Field varsa onun değerini, yoksa model değerini kullan
  readonly fieldValue = computed(() => {
    const f = this.field();
    return f ? f.value() : this.value();
  });

  readonly isDisabled = computed(() => {
    const f = this.field();
    // EnhancedFieldValue kontrolü (enabled sinyali var mı?)
    const fieldDisabled = (f && 'enabled' in f) ? !f.enabled() : false;
    return this.disabled() || this._disabledByForm() || fieldDisabled;
  });

  readonly hasError = computed(() => {
    const f = this.field();
    // Hata varsa ve kullanıcı dokunduysa göster
    return f ? (!!f.error() && f.touched()) : false;
  });

  // CVA Callbacks
  private _onChange: (value: any) => void = () => {};
  private _onTouched: () => void = () => {};

  ngOnInit() {}

  ngAfterViewInit(): void {
    // DOM'u başlangıç değeriyle senkronize et
    this.syncInputValue(this.fieldValue());

    // --- EFFECT: Signal -> DOM Senkronizasyonu ---
    effect(() => {
      const val = this.fieldValue(); // Field veya Model değeri
      if (!this._isUserInput) {
        this.syncInputValue(val);
      }
      this._isUserInput = false; // Flag'i resetle
    }, { injector: this.injector });
  }

  onInput(event: Event): void {
    this._isUserInput = true;
    const target = event.target as HTMLInputElement;
    let val: string | number | null = target.value;

    if (val === '') val = null;
    else if (this.type() === 'number') {
      val = Number(val);
      if (isNaN(val)) val = null;
    }

    // 1. Önce Field'ı güncelle (Varsa)
    const f = this.field();
    if (f) {
      f.value.set(val);
      if (!f.touched()) f.touched.set(true);
    }

    // 2. Sonra Model'i güncelle
    this.value.set(val);
    this._onChange(val);
  }

  onBlur(): void {
    this._onTouched();

    const f = this.field();
    if (f && !f.touched()) {
      f.touched.set(true);
    }

    this.blur.emit();
  }

  onFocusEvent(): void {
    this.focus.emit();
  }

  onClear(): void {
    const f = this.field();
    if (f) f.value.set(null);

    this.value.set(null);
    this._onChange(null);
    this.syncInputValue(null);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  private syncInputValue(value: any): void {
    if (this.inputElement?.nativeElement) {
      const display = value ?? '';
      // Gereksiz DOM yazmalarını önle (Cursor zıplamasını engeller)
      if (this.inputElement.nativeElement.value !== String(display)) {
        this.inputElement.nativeElement.value = String(display);
      }
    }
  }

  // CVA Interface Implementation
  writeValue(obj: any): void {
    // Form API'den gelen değeri hem modele hem field'a yazmaya çalışmayalım,
    // CVA genelde [formControl] ile kullanılır, bizim yapımızda [field] önceliklidir.
    // Ama hibrit kullanım için:
    this.value.set(obj);
  }
  registerOnChange(fn: any): void { this._onChange = fn; }
  registerOnTouched(fn: any): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this._disabledByForm.set(isDisabled); }
}
