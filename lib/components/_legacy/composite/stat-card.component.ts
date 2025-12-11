import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  effect,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * SigStatCard - Signal-based statistics card
 * 
 * Usage:
 * <sig-stat-card
 *   title="Toplam Satış"
 *   [value]="124500"
 *   prefix="₺"
 *   [change]="12.5"
 *   trend="up"
 *   [progress]="78"
 *   icon="💰"
 * />
 */
@Component({
  selector: 'sig-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div 
      class="sig-stat-card"
      [class.sig-stat-card--compact]="compact()"
      [class.sig-stat-card--bordered]="bordered()"
      [class.sig-stat-card--clickable]="clickable()"
    >
      <!-- Header -->
      <div class="sig-stat-card__header">
        <div class="sig-stat-card__title-row">
          @if (icon()) {
            <span class="sig-stat-card__icon">{{ icon() }}</span>
          }
          <span class="sig-stat-card__title">{{ title() }}</span>
        </div>
        
        @if (showTrend() && change() !== null) {
          <div 
            class="sig-stat-card__trend"
            [class.sig-stat-card__trend--up]="trendDirection() === 'up'"
            [class.sig-stat-card__trend--down]="trendDirection() === 'down'"
          >
            <span class="sig-stat-card__trend-icon">
              {{ trendDirection() === 'up' ? '↑' : trendDirection() === 'down' ? '↓' : '→' }}
            </span>
            <span class="sig-stat-card__trend-value">
              {{ Math.abs(change()!) }}%
            </span>
          </div>
        }
      </div>

      <!-- Value -->
      <div class="sig-stat-card__value-container">
        <span class="sig-stat-card__value">
          @if (prefix()) {
            <span class="sig-stat-card__prefix">{{ prefix() }}</span>
          }
          <span class="sig-stat-card__number" [class.sig-stat-card__number--animate]="animate()">
            {{ animatedValue() | number:numberFormat() }}
          </span>
          @if (suffix()) {
            <span class="sig-stat-card__suffix">{{ suffix() }}</span>
          }
        </span>
        
        @if (comparison()) {
          <span class="sig-stat-card__comparison">{{ comparison() }}</span>
        }
      </div>

      <!-- Progress -->
      @if (showProgress() && progress() !== null) {
        <div class="sig-stat-card__progress">
          <div class="sig-stat-card__progress-bar">
            <div 
              class="sig-stat-card__progress-fill"
              [class.sig-stat-card__progress-fill--success]="progressVariant() === 'success'"
              [class.sig-stat-card__progress-fill--warning]="progressVariant() === 'warning'"
              [class.sig-stat-card__progress-fill--danger]="progressVariant() === 'danger'"
              [style.width.%]="progress()"
            ></div>
          </div>
          @if (progressLabel()) {
            <span class="sig-stat-card__progress-label">{{ progressLabel() }}</span>
          }
        </div>
      }

      <!-- Sparkline -->
      @if (sparklineData().length > 0) {
        <div class="sig-stat-card__sparkline">
          <svg [attr.viewBox]="'0 0 ' + sparklineWidth + ' ' + sparklineHeight" preserveAspectRatio="none">
            <polyline
              [attr.points]="sparklinePoints()"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      }

      <!-- Footer -->
      @if (footer()) {
        <div class="sig-stat-card__footer">
          {{ footer() }}
        </div>
      }

      <!-- Loading overlay -->
      @if (loading()) {
        <div class="sig-stat-card__loading">
          <div class="sig-stat-card__spinner"></div>
        </div>
      }
    </div>
  `,
  })
export class SigStatCardComponent {
  readonly Math = Math;
  readonly sparklineWidth = 200;
  readonly sparklineHeight = 40;

  readonly title = input.required<string>();
  readonly value = input.required<number>();
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');
  readonly change = input<number | null>(null);
  readonly trend = input<TrendDirection | null>(null);
  readonly progress = input<number | null>(null);
  readonly progressLabel = input<string>('');
  readonly progressVariant = input<'primary' | 'success' | 'warning' | 'danger'>('primary');
  readonly icon = input<string>('');
  readonly comparison = input<string>('');
  readonly footer = input<string>('');
  readonly sparklineData = input<number[]>([]);
  readonly compact = input<boolean>(false);
  readonly bordered = input<boolean>(false);
  readonly clickable = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly animate = input<boolean>(true);
  readonly showTrend = input<boolean>(true);
  readonly showProgress = input<boolean>(true);
  readonly numberFormat = input<string>('1.0-0');

  readonly animatedValue = signal(0);

  readonly trendDirection = computed<TrendDirection>(() => {
    const t = this.trend();
    if (t) return t;
    
    const c = this.change();
    if (c === null) return 'neutral';
    if (c > 0) return 'up';
    if (c < 0) return 'down';
    return 'neutral';
  });

  readonly sparklinePoints = computed(() => {
    const data = this.sparklineData();
    if (data.length === 0) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * this.sparklineWidth;
      const y = this.sparklineHeight - padding - ((val - min) / range) * (this.sparklineHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  });

  constructor() {
    effect(() => {
      const targetValue = this.value();
      if (!this.animate()) {
        this.animatedValue.set(targetValue);
        return;
      }

      const start = this.animatedValue();
      const duration = 500;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        this.animatedValue.set(start + (targetValue - start) * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }
}