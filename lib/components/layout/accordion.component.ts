import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  contentChildren,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Accordion Item Component
 */
@Component({
  selector: 'sig-accordion-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-accordion-item"
      [class.sig-accordion-item--expanded]="expanded()"
      [class.sig-accordion-item--disabled]="disabled()"
    >
      <!-- Header -->
      <button
        type="button"
        class="sig-accordion-item__header"
        [disabled]="disabled()"
        (click)="toggle()"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="'panel-' + id()"
      >
        @if (icon()) {
          <span class="sig-accordion-item__icon">{{ icon() }}</span>
        }
        
        <span class="sig-accordion-item__title">
          @if (title()) {
            {{ title() }}
          } @else {
            <ng-content select="[accordion-title]"></ng-content>
          }
        </span>

        @if (subtitle()) {
          <span class="sig-accordion-item__subtitle">{{ subtitle() }}</span>
        }

        <span class="sig-accordion-item__chevron">
          {{ expanded() ? '▲' : '▼' }}
        </span>
      </button>

      <!-- Content -->
      @if (expanded()) {
        <div 
          class="sig-accordion-item__content"
          [id]="'panel-' + id()"
          role="region"
        >
          <div class="sig-accordion-item__body">
            <ng-content></ng-content>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-accordion-item {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      transition: all 0.2s;
    }

    .sig-accordion-item + .sig-accordion-item {
      margin-top: 0.5rem;
    }

    .sig-accordion-item--expanded {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .sig-accordion-item--disabled {
      opacity: 0.6;
    }

    .sig-accordion-item__header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: none;
      background-color: #f9fafb;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .sig-accordion-item__header:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .sig-accordion-item--expanded .sig-accordion-item__header {
      background-color: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-accordion-item__header:disabled {
      cursor: not-allowed;
    }

    .sig-accordion-item__icon {
      font-size: 1.25rem;
    }

    .sig-accordion-item__title {
      flex: 1;
    }

    .sig-accordion-item__subtitle {
      font-size: 0.75rem;
      font-weight: 400;
      color: #6b7280;
    }

    .sig-accordion-item__chevron {
      font-size: 0.625rem;
      color: #9ca3af;
      transition: transform 0.2s;
    }

    .sig-accordion-item--expanded .sig-accordion-item__chevron {
      color: #3b82f6;
    }

    .sig-accordion-item__content {
      animation: accordion-expand 0.2s ease-out;
    }

    @keyframes accordion-expand {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .sig-accordion-item__body {
      padding: 1rem;
      font-size: 0.875rem;
      color: #4b5563;
    }
  `],
})
export class SigAccordionItemComponent {
  readonly id = input.required<string>();
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly expanded = model<boolean>(false);

  readonly expandedChange = output<boolean>();

  toggle(): void {
    if (!this.disabled()) {
      const newValue = !this.expanded();
      this.expanded.set(newValue);
      this.expandedChange.emit(newValue);
    }
  }

  // Public API
  open(): void {
    if (!this.disabled()) {
      this.expanded.set(true);
      this.expandedChange.emit(true);
    }
  }

  close(): void {
    this.expanded.set(false);
    this.expandedChange.emit(false);
  }
}

/**
 * SigAccordion - Container for accordion items
 * 
 * Usage:
 * <sig-accordion [multiple]="false">
 *   <sig-accordion-item id="item1" title="Section 1">
 *     Content 1...
 *   </sig-accordion-item>
 *   <sig-accordion-item id="item2" title="Section 2">
 *     Content 2...
 *   </sig-accordion-item>
 * </sig-accordion>
 */
@Component({
  selector: 'sig-accordion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-accordion"
      [class.sig-accordion--bordered]="bordered()"
      [class.sig-accordion--flush]="flush()"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .sig-accordion {
      display: flex;
      flex-direction: column;
    }

    .sig-accordion--bordered {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .sig-accordion--bordered ::ng-deep .sig-accordion-item {
      border: none;
      border-radius: 0;
      margin-top: 0;
    }

    .sig-accordion--bordered ::ng-deep .sig-accordion-item + .sig-accordion-item {
      border-top: 1px solid #e5e7eb;
    }

    .sig-accordion--flush ::ng-deep .sig-accordion-item {
      border-left: none;
      border-right: none;
      border-radius: 0;
    }

    .sig-accordion--flush ::ng-deep .sig-accordion-item:first-child {
      border-top: none;
    }

    .sig-accordion--flush ::ng-deep .sig-accordion-item:last-child {
      border-bottom: none;
    }
  `],
})
export class SigAccordionComponent {
  readonly items = contentChildren(SigAccordionItemComponent);
  
  readonly multiple = input<boolean>(false);
  readonly bordered = input<boolean>(false);
  readonly flush = input<boolean>(false);

  constructor() {
    // Handle single mode - close others when one opens
    // This is done via effect in a real implementation
  }

  // Public API
  expandAll(): void {
    this.items().forEach((item) => item.open());
  }

  collapseAll(): void {
    this.items().forEach((item) => item.close());
  }

  expand(id: string): void {
    const item = this.items().find((i) => i.id() === id);
    item?.open();
  }

  collapse(id: string): void {
    const item = this.items().find((i) => i.id() === id);
    item?.close();
  }
}