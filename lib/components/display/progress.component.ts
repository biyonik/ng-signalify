import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId } from '../../utils/a11y.utils';

/**
 * SigProgress - Signal-based accessible progress bar
 */
@Component({
    selector: 'sig-progress',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        <div
                class="sig-progress"
                [class.sig-progress--sm]="size() === 'sm'"
                [class.sig-progress--lg]="size() === 'lg'"
                [class.sig-progress--striped]="striped()"
                [class.sig-progress--animated]="animated()"
        >
            @if (label()) {
                <div class="sig-progress__header">
                    <span [id]="labelId" class="sig-progress__label">{{ label() }}</span>
                    @if (showValue()) {
                        <span class="sig-progress__value" aria-hidden="true">
              {{ displayValue() }}
            </span>
                    }
                </div>
            }

            <div
                    class="sig-progress__track"
                    role="progressbar"
                    [attr.aria-valuenow]="indeterminate() ? null : value()"
                    [attr.aria-valuemin]="0"
                    [attr.aria-valuemax]="max()"
                    [attr.aria-valuetext]="getValueText()"
                    [attr.aria-labelledby]="label() ? labelId : null"
                    [attr.aria-label]="!label() ? ariaLabel() : null"
                    [attr.aria-busy]="indeterminate()"
            >
                <div
                        class="sig-progress__bar"
                        [class.sig-progress__bar--indeterminate]="indeterminate()"
                        [class.sig-progress__bar--success]="variant() === 'success'"
                        [class.sig-progress__bar--warning]="variant() === 'warning'"
                        [class.sig-progress__bar--danger]="variant() === 'danger'"
                        [style.width.%]="indeterminate() ? 100 : percentage()"
                >
                    @if (showValue() && !label()) {
                        <span class="sig-visually-hidden">{{ displayValue() }}</span>
                    }
                </div>
            </div>

            @if (description()) {
                <div class="sig-progress__description">
                    {{ description() }}
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
export class SigProgressComponent implements OnInit {
    readonly value = input<number>(0);
    readonly max = input<number>(100);
    readonly label = input<string>('');
    readonly ariaLabel = input<string>('İlerleme');
    readonly description = input<string>('');
    readonly showValue = input<boolean>(false);
    readonly size = input<'sm' | 'md' | 'lg'>('md');
    readonly variant = input<'default' | 'success' | 'warning' | 'danger'>('default');
    readonly striped = input<boolean>(false);
    readonly animated = input<boolean>(false);
    readonly indeterminate = input<boolean>(false);
    readonly valueFormat = input<'percent' | 'value' | 'fraction'>('percent');

    labelId = '';

    ngOnInit(): void {
        this.labelId = generateId('sig-progress-label');
    }

    readonly percentage = computed(() => {
        const max = this.max();
        if (max === 0) return 0;
        return Math.min(100, Math.max(0, (this.value() / max) * 100));
    });

    readonly displayValue = computed(() => {
        const format = this.valueFormat();
        const val = this.value();
        const max = this.max();

        switch (format) {
            case 'percent':
                return `${Math.round(this.percentage())}%`;
            case 'value':
                return val.toString();
            case 'fraction':
                return `${val} / ${max}`;
            default:
                return `${Math.round(this.percentage())}%`;
        }
    });

    getValueText(): string {
        if (this.indeterminate()) {
            return 'Yükleniyor...';
        }
        return this.displayValue();
    }
}
