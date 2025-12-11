import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  contentChildren,
  ElementRef,
  inject,
  HostListener,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dropdown Item Directive
 */
@Directive({
  selector: '[sigDropdownItem]',
  standalone: true,
  host: {
    class: 'sig-dropdown__item',
    '[class.sig-dropdown__item--disabled]': 'disabled()',
    '(click)': 'onClick($event)',
  },
})
export class SigDropdownItemDirective {
  readonly disabled = input<boolean>(false);
  readonly closeOnClick = input<boolean>(true);

  onClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

/**
 * Dropdown Divider
 */
@Component({
  selector: 'sig-dropdown-divider',
  standalone: true,
  template: `<div class="sig-dropdown__divider"></div>`,
  })
export class SigDropdownDividerComponent {}

/**
 * Dropdown Header
 */
@Component({
  selector: 'sig-dropdown-header',
  standalone: true,
  template: `
    <div class="sig-dropdown__header">
      <ng-content></ng-content>
    </div>
  `,
  })
export class SigDropdownHeaderComponent {}

/**
 * SigDropdownMenu - Signal-based dropdown menu
 * 
 * Usage:
 * <sig-dropdown-menu>
 *   <button sigDropdownTrigger>
 *     Actions ▼
 *   </button>
 *   
 *   <ng-template sigDropdownContent>
 *     <sig-dropdown-header>Actions</sig-dropdown-header>
 *     <button sigDropdownItem (click)="onEdit()">✏️ Edit</button>
 *     <button sigDropdownItem (click)="onDuplicate()">📋 Duplicate</button>
 *     <sig-dropdown-divider />
 *     <button sigDropdownItem class="text-danger" (click)="onDelete()">🗑️ Delete</button>
 *   </ng-template>
 * </sig-dropdown-menu>
 */
@Component({
  selector: 'sig-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sig-dropdown" [class.sig-dropdown--open]="isOpen()">
      <!-- Trigger -->
      <div class="sig-dropdown__trigger" (click)="toggle()">
        <ng-content select="[sigDropdownTrigger]"></ng-content>
      </div>

      <!-- Menu -->
      @if (isOpen()) {
        <div 
          class="sig-dropdown__menu"
          [class.sig-dropdown__menu--top]="position() === 'top'"
          [class.sig-dropdown__menu--bottom]="position() === 'bottom'"
          [class.sig-dropdown__menu--left]="align() === 'left'"
          [class.sig-dropdown__menu--right]="align() === 'right'"
          [class.sig-dropdown__menu--center]="align() === 'center'"
          [style.min-width.px]="minWidth()"
          (click)="onMenuClick($event)"
        >
          <ng-content select="[sigDropdownContent]"></ng-content>
        </div>
      }
    </div>
  `,
    host: {
    '(document:click)': 'onClickOutside($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class SigDropdownMenuComponent {
  readonly position = input<'top' | 'bottom'>('bottom');
  readonly align = input<'left' | 'right' | 'center'>('left');
  readonly minWidth = input<number>(160);
  readonly closeOnSelect = input<boolean>(true);

  readonly opened = output<void>();
  readonly closed = output<void>();

  private readonly elementRef = inject(ElementRef);
  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    this.isOpen.set(true);
    this.opened.emit();
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  onMenuClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      this.closeOnSelect() &&
      target.closest('.sig-dropdown__item') &&
      !target.closest('.sig-dropdown__item--disabled')
    ) {
      this.close();
    }
  }

  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}

/**
 * Dropdown Trigger Directive
 */
@Directive({
  selector: '[sigDropdownTrigger]',
  standalone: true,
})
export class SigDropdownTriggerDirective {}

/**
 * Dropdown Content Directive
 */
@Directive({
  selector: '[sigDropdownContent]',
  standalone: true,
})
export class SigDropdownContentDirective {}