import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  effect,
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
  styles: [`
    .sig-stat-card {
      position: relative;
      padding: 1.25rem;
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .sig-stat-card--bordered {
      box-shadow: none;
      border: 1px solid #e5e7eb;
    }

    .sig-stat-card--compact {
      padding: 1rem;
    }

    .sig-stat-card--clickable {
      cursor: pointer;
    }

    .sig-stat-card--clickable:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .sig-stat-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .sig-stat-card__title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sig-stat-card__icon {
      font-size: 1.25rem;
    }

    .sig-stat-card__title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
    }

    .sig-stat-card__trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .sig-stat-card__trend--up {
      background-color: #d1fae5;
      color: #047857;
    }

    .sig-stat-card__trend--down {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    .sig-stat-card__value-container {
      margin-bottom: 0.75rem;
    }

    .sig-stat-card__value {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .sig-stat-card__prefix {
      font-size: 1.25rem;
      font-weight: 500;
      color: #6b7280;
    }

    .sig-stat-card__number {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }

    .sig-stat-card__number--animate {
      transition: all 0.5s ease-out;
    }

    .sig-stat-card__suffix {
      font-size: 1rem;
      font-weight: 500;
      color: #6b7280;
    }

    .sig-stat-card__comparison {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .sig-stat-card__progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sig-stat-card__progress-bar {
      flex: 1;
      height: 6px;
      background-color: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .sig-stat-card__progress-fill {
      height: 100%;
      background-color: #3b82f6;
      border-radius: 3px;
      transition: width 0.5s ease-out;
    }

    .sig-stat-card__progress-fill--success {
      background-color: #10b981;
    }

    .sig-stat-card__progress-fill--warning {
      background-color: #f59e0b;
    }

    .sig-stat-card__progress-fill--danger {
      background-color: #ef4444;
    }

    .sig-stat-card__progress-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      min-width: 3rem;
      text-align: right;
    }

    .sig-stat-card__sparkline {
      height: 40px;
      margin-top: 0.75rem;
      color: #3b82f6;
    }

    .sig-stat-card__sparkline svg {
      width: 100%;
      height: 100%;
    }

    .sig-stat-card__footer {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-stat-card__loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: inherit;
    }

    .sig-stat-card__spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
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