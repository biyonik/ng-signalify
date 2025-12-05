import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  contentChildren,
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
  styles: [`
    .sig-breadcrumb {
      font-size: 0.875rem;
    }

    .sig-breadcrumb--sm {
      font-size: 0.75rem;
    }

    .sig-breadcrumb--lg {
      font-size: 1rem;
    }

    .sig-breadcrumb__list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    :host ::ng-deep .sig-breadcrumb__item {
      display: inline-flex;
      align-items: center;
      color: #6b7280;
      text-decoration: none;
    }

    :host ::ng-deep .sig-breadcrumb__item:not(.sig-breadcrumb__item--active):not(.sig-breadcrumb__item--disabled):hover {
      color: #3b82f6;
      text-decoration: underline;
    }

    :host ::ng-deep .sig-breadcrumb__item--active {
      color: #374151;
      font-weight: 500;
      pointer-events: none;
    }

    :host ::ng-deep .sig-breadcrumb__item--disabled {
      color: #9ca3af;
      pointer-events: none;
    }

    :host ::ng-deep .sig-breadcrumb__item:not(:last-child)::after {
      content: '/';
      margin-left: 0.5rem;
      color: #d1d5db;
    }

    :host(.sig-breadcrumb--arrow) ::ng-deep .sig-breadcrumb__item:not(:last-child)::after {
      content: '›';
    }

    :host(.sig-breadcrumb--dot) ::ng-deep .sig-breadcrumb__item:not(:last-child)::after {
      content: '•';
    }
  `],
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
  styles: [`
    .sig-breadcrumb__list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.875rem;
    }

    .sig-breadcrumb__item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: #6b7280;
      text-decoration: none;
    }

    .sig-breadcrumb__item:hover:not(.sig-breadcrumb__item--active) {
      color: #3b82f6;
      text-decoration: underline;
    }

    .sig-breadcrumb__item--active {
      color: #374151;
      font-weight: 500;
    }

    .sig-breadcrumb__icon {
      font-size: 1em;
    }

    li:not(:last-child)::after {
      content: '/';
      margin-left: 0.5rem;
      color: #d1d5db;
    }
  `],
})
export class SigBreadcrumbAutoComponent {
  readonly items = input<Array<{ label: string; path: string; icon?: string }>>([]);
}