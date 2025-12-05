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
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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