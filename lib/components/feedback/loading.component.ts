import {
  Component,
  ChangeDetectionStrategy,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigSpinner - Signal-based loading spinner
 */
@Component({
  selector: 'sig-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div 
      class="sig-spinner"
      [class.sig-spinner--xs]="size() === 'xs'"
      [class.sig-spinner--sm]="size() === 'sm'"
      [class.sig-spinner--md]="size() === 'md'"
      [class.sig-spinner--lg]="size() === 'lg'"
      [class.sig-spinner--xl]="size() === 'xl'"
      [class.sig-spinner--primary]="color() === 'primary'"
      [class.sig-spinner--white]="color() === 'white'"
      [class.sig-spinner--gray]="color() === 'gray'"
      role="status"
      aria-label="Yükleniyor"
    >
      <span class="sig-spinner__circle"></span>
    </div>
  `,
  })
export class SigSpinnerComponent {
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly color = input<'primary' | 'white' | 'gray'>('primary');
}

/**
 * SigLoading - Signal-based loading overlay
 */
@Component({
  selector: 'sig-loading',
  standalone: true,
  imports: [CommonModule, SigSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div 
        class="sig-loading"
        [class.sig-loading--fullscreen]="fullscreen()"
        [class.sig-loading--transparent]="transparent()"
      >
        <div class="sig-loading__content">
          <sig-spinner [size]="spinnerSize()" color="primary" />
          @if (text()) {
            <p class="sig-loading__text">{{ text() }}</p>
          }
        </div>
      </div>
    }
  `,
  })
export class SigLoadingComponent {
  readonly show = input<boolean>(false);
  readonly text = input<string>('');
  readonly fullscreen = input<boolean>(false);
  readonly transparent = input<boolean>(false);
  readonly spinnerSize = input<'sm' | 'md' | 'lg' | 'xl'>('lg');
}

/**
 * SigSkeleton - Signal-based skeleton loader
 */
@Component({
  selector: 'sig-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-skeleton"
      [class.sig-skeleton--circle]="variant() === 'circle'"
      [class.sig-skeleton--text]="variant() === 'text'"
      [style.width]="variant() === 'circle' ? size() : width()"
      [style.height]="variant() === 'circle' ? size() : height()"
      [style.border-radius]="variant() === 'circle' ? '50%' : radius()"
    ></div>
  `,
  })
export class SigSkeletonComponent {
  readonly variant = input<'rect' | 'circle' | 'text'>('rect');
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly size = input<string>('2rem');
  readonly radius = input<string>('0.25rem');
}

/**
 * SigEmptyState - Signal-based empty state
 */
@Component({
  selector: 'sig-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-empty-state">
      @if (icon()) {
        <div class="sig-empty-state__icon">{{ icon() }}</div>
      }
      @if (title()) {
        <h3 class="sig-empty-state__title">{{ title() }}</h3>
      }
      @if (description()) {
        <p class="sig-empty-state__description">{{ description() }}</p>
      }
      <div class="sig-empty-state__action">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  })
export class SigEmptyStateComponent {
  readonly icon = input<string>('');
  readonly title = input<string>('');
  readonly description = input<string>('');
}