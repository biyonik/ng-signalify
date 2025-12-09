import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
    output,
    model,
    viewChild,
    ElementRef,
    AfterViewInit,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '../../utils/a11y.utils';

/**
 * SigTextarea - Signal-based accessible multiline text input
 */
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
    <div class="sig-textarea" [class.sig-textarea--disabled]="isDisabled()">
      <textarea
        #textareaRef
        [id]="textareaId"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readonly]="readonly()"
        [rows]="rows()"
        [maxLength]="maxLength()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="getDescribedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-required]="required()"
        [attr.aria-readonly]="readonly() || null"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocusEvent()"
        class="sig-textarea__field"
        [class.sig-textarea__field--resize-none]="!resize()"
        [class.sig-textarea__field--resize-vertical]="resize() === 'vertical'"
        [class.sig-textarea__field--resize-horizontal]="resize() === 'horizontal'"
      ></textarea>

      @if (showCounter() && maxLength()) {
        <div 
          [id]="counterId"
          class="sig-textarea__counter"
          [class.sig-textarea__counter--warning]="isNearLimit()"
          [class.sig-textarea__counter--error]="isAtLimit()"
          [attr.aria-live]="isNearLimit() ? 'polite' : 'off'"
          role="status"
        >
          <span class="sig-visually-hidden">
            {{ charCount() }} / {{ maxLength() }} karakter kullanıldı
          </span>
          <span aria-hidden="true">{{ charCount() }} / {{ maxLength() }}</span>
        </div>
      }
    </div>
  `,
    styles: [`
    .sig-visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class SigTextareaComponent implements ControlValueAccessor, AfterViewInit, OnInit {
    readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

    readonly value = model<string>('');
    readonly placeholder = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly readonly = input<boolean>(false);
    readonly rows = input<number>(3);
    readonly maxLength = input<number | null>(null);
    readonly resize = input<'none' | 'vertical' | 'horizontal' | 'both'>('vertical');
    readonly autoResize = input<boolean>(false);
    readonly showCounter = input<boolean>(true);

    // A11y inputs
    readonly ariaLabel = input<string>('');
    readonly ariaLabelledBy = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);
    readonly required = input<boolean>(false);

    readonly focus = output<void>();
    readonly blur = output<void>();

    readonly charCount = signal(0);

    // IDs
    textareaId = '';
    counterId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    readonly isNearLimit = computed(() => {
        const max = this.maxLength();
        if (!max) return false;
        return this.charCount() > max * 0.9;
    });

    readonly isAtLimit = computed(() => {
        const max = this.maxLength();
        if (!max) return false;
        return this.charCount() >= max;
    });

    private _onChange: (value: string) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.textareaId = generateId('sig-textarea');
        this.counterId = `${this.textareaId}-counter`;
    }

    ngAfterViewInit(): void {
        if (this.autoResize()) {
            this.adjustHeight();
        }
        this.charCount.set(this.value().length);
    }

    getDescribedBy(): string | null {
        const parts: string[] = [];
        if (this.ariaDescribedBy()) parts.push(this.ariaDescribedBy());
        if (this.showCounter() && this.maxLength()) parts.push(this.counterId);
        return parts.length > 0 ? parts.join(' ') : null;
    }

    onInput(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.value.set(target.value);
        this.charCount.set(target.value.length);
        this._onChange(target.value);

        if (this.autoResize()) {
            this.adjustHeight();
        }
    }

    onBlur(): void {
        this._onTouched();
        this.blur.emit();
    }

    onFocusEvent(): void {
        this.focus.emit();
    }

    private adjustHeight(): void {
        const textarea = this.textareaRef()?.nativeElement;
        if (!textarea) return;

        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    writeValue(value: string): void {
        this.value.set(value ?? '');
        this.charCount.set(this.value().length);

        if (this.autoResize() && this.textareaRef()) {
            setTimeout(() => this.adjustHeight());
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
