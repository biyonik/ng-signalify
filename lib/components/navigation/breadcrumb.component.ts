import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  contentChildren,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Breadcrumb Item Directive
 */
@Directive({
  selector: '[sigBreadcrumbItem]',
  standalone: true,
  host: {
    class: 'sig-breadcrumb__item',
    '[class.sig-breadcrumb__item--active]': 'active()',
    '[class.sig-breadcrumb__item--disabled]': 'disabled()',
  },
})
export class SigBreadcrumbItemDirective {
  readonly active = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly icon = input<string>('');
}

/**
 * SigBreadcrumb - Signal-based breadcrumb navigation
 * 
 * Usage:
 * <sig-breadcrumb>
 *   <a sigBreadcrumbItem href="/">🏠 Ana Sayfa</a>
 *   <a sigBreadcrumbItem href="/products">Ürünler</a>
 *   <span sigBreadcrumbItem [active]="true">Laptop</span>
 * </sig-breadcrumb>
 */
@Component({
  selector: 'sig-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav 
      class="sig-breadcrumb"
      [class.sig-breadcrumb--sm]="size() === 'sm'"
      [class.sig-breadcrumb--lg]="size() === 'lg'"
      aria-label="Breadcrumb"
    >
      <ol class="sig-breadcrumb__list">
        <ng-content></ng-content>
      </ol>
    </nav>
  `,
  })
export class SigBreadcrumbComponent {
  readonly items = contentChildren(SigBreadcrumbItemDirective);
  
  readonly separator = input<'slash' | 'arrow' | 'dot'>('slash');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}

/**
 * SigBreadcrumbAuto - Otomatik breadcrumb (router tabanlı)
 */
@Component({
  selector: 'sig-breadcrumb-auto',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sig-breadcrumb" aria-label="Breadcrumb">
      <ol class="sig-breadcrumb__list">
        @for (item of items(); track item.path; let last = $last) {
          <li>
            @if (last) {
              <span class="sig-breadcrumb__item sig-breadcrumb__item--active">
                @if (item.icon) {
                  <span class="sig-breadcrumb__icon">{{ item.icon }}</span>
                }
                {{ item.label }}
              </span>
            } @else {
              <a 
                class="sig-breadcrumb__item"
                [href]="item.path"
              >
                @if (item.icon) {
                  <span class="sig-breadcrumb__icon">{{ item.icon }}</span>
                }
                {{ item.label }}
              </a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  })
export class SigBreadcrumbAutoComponent {
  readonly items = input<Array<{ label: string; path: string; icon?: string }>>([]);
}