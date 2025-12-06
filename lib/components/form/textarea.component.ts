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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigTextarea - Signal-based multiline text input
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
    <div class="sig-textarea" [class.sig-textarea--disabled]="disabled()">
      <textarea
        #textareaRef
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [rows]="rows()"
        [maxLength]="maxLength()"
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
          class="sig-textarea__counter"
          [class.sig-textarea__counter--warning]="isNearLimit()"
          [class.sig-textarea__counter--error]="isAtLimit()"
        >
          {{ charCount() }} / {{ maxLength() }}
        </div>
      }
    </div>
  `,
  })
export class SigTextareaComponent implements ControlValueAccessor, AfterViewInit {
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

  readonly focus = output<void>();
  readonly blur = output<void>();

  readonly charCount = signal(0);

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

  ngAfterViewInit(): void {
    if (this.autoResize()) {
      this.adjustHeight();
    }
    this.charCount.set(this.value().length);
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

  setDisabledState(_isDisabled: boolean): void {}
}