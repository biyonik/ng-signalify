import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigProgress - Signal-based progress bar
 * 
 * Usage:
 * <sig-progress [value]="75" [max]="100" [showValue]="true" />
 * <sig-progress [value]="50" variant="success" [striped]="true" [animated]="true" />
 */
@Component({
  selector: 'sig-progress',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sig-progress">
      @if (label()) {
        <div class="sig-progress__header">
          <span class="sig-progress__label">{{ label() }}</span>
          @if (showValue()) {
            <span class="sig-progress__value">{{ displayValue() }}</span>
          }
        </div>
      }

      <div 
        class="sig-progress__track"
        [class.sig-progress__track--sm]="size() === 'sm'"
        [class.sig-progress__track--lg]="size() === 'lg'"
        [class.sig-progress__track--rounded]="rounded()"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="max()"
      >
        <div 
          class="sig-progress__bar"
          [class.sig-progress__bar--primary]="variant() === 'primary'"
          [class.sig-progress__bar--success]="variant() === 'success'"
          [class.sig-progress__bar--warning]="variant() === 'warning'"
          [class.sig-progress__bar--danger]="variant() === 'danger'"
          [class.sig-progress__bar--info]="variant() === 'info'"
          [class.sig-progress__bar--striped]="striped()"
          [class.sig-progress__bar--animated]="animated()"
          [class.sig-progress__bar--indeterminate]="indeterminate()"
          [style.width.%]="indeterminate() ? 100 : percentage()"
        >
          @if (showValue() && !label() && size() !== 'sm') {
            <span class="sig-progress__bar-text">{{ displayValue() }}</span>
          }
        </div>
      </div>

      @if (description()) {
        <div class="sig-progress__description">{{ description() }}</div>
      }
    </div>
  `,
  })
export class SigProgressComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly showValue = input<boolean>(false);
  readonly variant = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly striped = input<boolean>(false);
  readonly animated = input<boolean>(false);
  readonly rounded = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly valueFormat = input<'percent' | 'value' | 'fraction'>('percent');

  readonly percentage = computed(() => {
    const val = this.value();
    const max = this.max();
    return Math.min(Math.max((val / max) * 100, 0), 100);
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
        return `${val}/${max}`;
      default:
        return `${Math.round(this.percentage())}%`;
    }
  });
}

/**
 * SigProgressCircle - Circular progress indicator
 */
@Component({
  selector: 'sig-progress-circle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-progress-circle"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      <svg 
        class="sig-progress-circle__svg"
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
      >
        <!-- Background circle -->
        <circle
          class="sig-progress-circle__track"
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
          fill="none"
        />
        
        <!-- Progress circle -->
        <circle
          class="sig-progress-circle__progress"
          [class.sig-progress-circle__progress--primary]="variant() === 'primary'"
          [class.sig-progress-circle__progress--success]="variant() === 'success'"
          [class.sig-progress-circle__progress--warning]="variant() === 'warning'"
          [class.sig-progress-circle__progress--danger]="variant() === 'danger'"
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          fill="none"
          stroke-linecap="round"
        />
      </svg>

      <div class="sig-progress-circle__content">
        @if (showValue()) {
          <span class="sig-progress-circle__value">{{ displayValue() }}</span>
        }
        <ng-content></ng-content>
      </div>
    </div>
  `,
  })
export class SigProgressCircleComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly size = input<number>(120);
  readonly strokeWidth = input<number>(8);
  readonly showValue = input<boolean>(true);
  readonly variant = input<'primary' | 'success' | 'warning' | 'danger'>('primary');

  readonly center = computed(() => this.size() / 2);
  readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly percentage = computed(() => {
    return Math.min(Math.max((this.value() / this.max()) * 100, 0), 100);
  });

  readonly dashOffset = computed(() => {
    return this.circumference() * (1 - this.percentage() / 100);
  });

  readonly displayValue = computed(() => {
    return `${Math.round(this.percentage())}%`;
  });
}