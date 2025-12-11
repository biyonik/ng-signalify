import {
    Component,
    ChangeDetectionStrategy,
    computed,
    input,
    ViewEncapsulation,
    OnInit,
    ContentChild,
    AfterContentInit,
    ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId } from '../../utils/a11y.utils';

/**
 * FormField - Signal-based accessible form field wrapper
 *
 * TR: Form alanlarını sarmalayan, label, hata ve ipucu gösterimi sağlayan erişilebilir component.
 * EN: Accessible component wrapping form fields, providing label, error and hint display.
 */
@Component({
    selector: 'sig-form-field',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        <div 
            class="sig-form-field"
            [class.sig-form-field--error]="showError()"
            [class.sig-form-field--disabled]="disabled()"
            [class.sig-form-field--required]="required()"
        >
            @if (label()) {
                <label 
                    class="sig-form-field__label"
                    [id]="labelId"
                    [for]="inputId()"
                >
                    {{ label() }}
                    @if (required()) {
                        <span class="sig-form-field__required" aria-hidden="true">*</span>
                        <span class="sig-visually-hidden">(zorunlu alan)</span>
                    }
                </label>
            }

            <div class="sig-form-field__control">
                <ng-content></ng-content>
                
                @if (loading()) {
                    <span class="sig-form-field__loading" aria-hidden="true">
                        <span class="sig-form-field__spinner"></span>
                    </span>
                    <span class="sig-visually-hidden">Yükleniyor...</span>
                }
            </div>

            <!-- Açıklama metni - her zaman mevcut ama görünürlük CSS ile kontrol edilir -->
            <div 
                [id]="descriptionId"
                class="sig-form-field__description"
                [class.sig-form-field__description--hidden]="!showError() && !hint()"
            >
                @if (showError() && error()) {
                    <div 
                        class="sig-form-field__error"
                        role="alert"
                        aria-live="polite"
                    >
                        <span aria-hidden="true">⚠️</span>
                        {{ error() }}
                    </div>
                } @else if (hint()) {
                    <div class="sig-form-field__hint">
                        {{ hint() }}
                    </div>
                }
            </div>

            @if (charCount() !== null && maxLength()) {
                <div 
                    class="sig-form-field__counter"
                    [class.sig-form-field__counter--warning]="isNearLimit()"
                    [class.sig-form-field__counter--error]="isOverLimit()"
                    [attr.aria-live]="isNearLimit() ? 'polite' : 'off'"
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
        
        .sig-form-field__description--hidden {
            display: none;
        }
    `]
})
export class FormFieldComponent implements OnInit {
    readonly label = input<string>('');
    readonly error = input<string | null>(null);
    readonly touched = input<boolean>(false);
    readonly required = input<boolean>(false);
    readonly disabled = input<boolean>(false);
    readonly loading = input<boolean>(false);
    readonly hint = input<string>('');
    readonly charCount = input<number | null>(null);
    readonly maxLength = input<number | null>(null);

    // YENİ: Input element'inin ID'si (dışarıdan verilebilir)
    readonly inputId = input<string>('');

    // YENİ: Generated ID'ler
    labelId = '';
    descriptionId = '';

    readonly showError = computed(() => this.touched() && this.error() !== null);

    // YENİ: Karakter limiti kontrolü
    readonly isNearLimit = computed(() => {
        const count = this.charCount();
        const max = this.maxLength();
        if (count === null || max === null) return false;
        return count >= max * 0.9; // %90'a ulaştığında uyar
    });

    readonly isOverLimit = computed(() => {
        const count = this.charCount();
        const max = this.maxLength();
        if (count === null || max === null) return false;
        return count > max;
    });

    ngOnInit(): void {
        const baseId = generateId('sig-form-field');
        this.labelId = `${baseId}-label`;
        this.descriptionId = `${baseId}-desc`;
    }

    /**
     * TR: İç input element'ine ARIA attribute'ları eklemek için kullanılır.
     * EN: Used to get ARIA attributes for inner input element.
     */
    getAriaAttributes(): Record<string, string | null> {
        return {
            'aria-labelledby': this.label() ? this.labelId : null,
            'aria-describedby': (this.hint() || this.error()) ? this.descriptionId : null,
            'aria-invalid': this.showError() ? 'true' : null,
            'aria-required': this.required() ? 'true' : null,
        };
    }
}
