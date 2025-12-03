import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigSpinner - Loading spinner
 * 
 * Usage:
 * <sig-spinner size="md" color="primary" />
 */
@Component({
  selector: 'sig-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-spinner"
      [class.sig-spinner--xs]="size === 'xs'"
      [class.sig-spinner--sm]="size === 'sm'"
      [class.sig-spinner--md]="size === 'md'"
      [class.sig-spinner--lg]="size === 'lg'"
      [class.sig-spinner--xl]="size === 'xl'"
      [class.sig-spinner--primary]="color === 'primary'"
      [class.sig-spinner--white]="color === 'white'"
      [class.sig-spinner--gray]="color === 'gray'"
      role="status"
      aria-label="Yükleniyor"
    >
      <span class="sig-spinner__circle"></span>
    </div>
  `,
  styles: [`
    .sig-spinner {
      display: inline-block;
    }

    .sig-spinner__circle {
      display: block;
      border-radius: 50%;
      border-style: solid;
      border-color: currentColor;
      border-top-color: transparent;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Sizes */
    .sig-spinner--xs .sig-spinner__circle {
      width: 0.75rem;
      height: 0.75rem;
      border-width: 2px;
    }

    .sig-spinner--sm .sig-spinner__circle {
      width: 1rem;
      height: 1rem;
      border-width: 2px;
    }

    .sig-spinner--md .sig-spinner__circle {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 2px;
    }

    .sig-spinner--lg .sig-spinner__circle {
      width: 2rem;
      height: 2rem;
      border-width: 3px;
    }

    .sig-spinner--xl .sig-spinner__circle {
      width: 3rem;
      height: 3rem;
      border-width: 4px;
    }

    /* Colors */
    .sig-spinner--primary { color: #3b82f6; }
    .sig-spinner--white { color: white; }
    .sig-spinner--gray { color: #9ca3af; }
  `],
})
export class SigSpinnerComponent {
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'primary' | 'white' | 'gray' = 'primary';
}

/**
 * SigLoading - Full page or container loading overlay
 * 
 * Usage:
 * <sig-loading [show]="isLoading" text="Veriler yükleniyor..." />
 */
@Component({
  selector: 'sig-loading',
  standalone: true,
  imports: [CommonModule, SigSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show) {
      <div 
        class="sig-loading"
        [class.sig-loading--fullscreen]="fullscreen"
        [class.sig-loading--transparent]="transparent"
      >
        <div class="sig-loading__content">
          <sig-spinner [size]="spinnerSize" color="primary" />
          @if (text) {
            <p class="sig-loading__text">{{ text }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .sig-loading {
      position: absolute;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.9);
    }

    .sig-loading--fullscreen {
      position: fixed;
      z-index: 9998;
    }

    .sig-loading--transparent {
      background-color: rgba(255, 255, 255, 0.7);
    }

    .sig-loading__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .sig-loading__text {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
    }
  `],
})
export class SigLoadingComponent {
  @Input() show = false;
  @Input() text = '';
  @Input() fullscreen = false;
  @Input() transparent = false;
  @Input() spinnerSize: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
}

/**
 * SigSkeleton - Skeleton loading placeholder
 * 
 * Usage:
 * <sig-skeleton width="200px" height="20px" />
 * <sig-skeleton variant="circle" size="48px" />
 */
@Component({
  selector: 'sig-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-skeleton"
      [class.sig-skeleton--circle]="variant === 'circle'"
      [class.sig-skeleton--text]="variant === 'text'"
      [style.width]="variant === 'circle' ? size : width"
      [style.height]="variant === 'circle' ? size : height"
      [style.border-radius]="variant === 'circle' ? '50%' : radius"
    ></div>
  `,
  styles: [`
    .sig-skeleton {
      background: linear-gradient(
        90deg,
        #e5e7eb 0%,
        #f3f4f6 50%,
        #e5e7eb 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .sig-skeleton--text {
      height: 1rem;
      border-radius: 0.25rem;
    }

    .sig-skeleton--circle {
      border-radius: 50%;
    }
  `],
})
export class SigSkeletonComponent {
  @Input() variant: 'rect' | 'circle' | 'text' = 'rect';
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() size = '2rem';
  @Input() radius = '0.25rem';
}

/**
 * SigEmptyState - Empty state placeholder
 * 
 * Usage:
 * <sig-empty-state
 *   icon="📭"
 *   title="Veri bulunamadı"
 *   description="Henüz kayıt eklenmemiş"
 * >
 *   <button>İlk kaydı ekle</button>
 * </sig-empty-state>
 */
@Component({
  selector: 'sig-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-empty-state">
      @if (icon) {
        <div class="sig-empty-state__icon">{{ icon }}</div>
      }
      @if (title) {
        <h3 class="sig-empty-state__title">{{ title }}</h3>
      }
      @if (description) {
        <p class="sig-empty-state__description">{{ description }}</p>
      }
      <div class="sig-empty-state__action">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .sig-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .sig-empty-state__icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .sig-empty-state__title {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }

    .sig-empty-state__description {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      max-width: 24rem;
    }

    .sig-empty-state__action {
      display: flex;
      gap: 0.75rem;
    }
  `],
})
export class SigEmptyStateComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
}