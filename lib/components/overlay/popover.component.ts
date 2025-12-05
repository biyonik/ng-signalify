import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  TemplateRef,
  inject,
  ElementRef,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigPopover - Signal-based popover component
 * 
 * Usage:
 * <button [sigPopover]="popoverContent" position="bottom">
 *   Click me
 * </button>
 * 
 * <ng-template #popoverContent>
 *   <h4>Popover Title</h4>
 *   <p>Popover content goes here...</p>
 * </ng-template>
 */
@Directive({
  selector: '[sigPopover]',
  standalone: true,
})
export class SigPopoverDirective implements OnDestroy {
  readonly content = input.required<TemplateRef<any> | string>({ alias: 'sigPopover' });
  readonly position = input<'top' | 'bottom' | 'left' | 'right'>('bottom');
  readonly trigger = input<'click' | 'hover'>('click');
  readonly closeOnOutsideClick = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly offset = input<number>(8);

  readonly opened = output<void>();
  readonly closed = output<void>();

  private readonly elementRef = inject(ElementRef);
  private popoverElement: HTMLDivElement | null = null;
  private isOpen = false;

  @HostListener('click')
  onClick(): void {
    if (this.trigger() === 'click' && !this.disabled()) {
      this.toggle();
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.trigger() === 'hover' && !this.disabled()) {
      this.show();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.trigger() === 'hover') {
      this.hide();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.isOpen &&
      this.closeOnOutsideClick() &&
      !this.elementRef.nativeElement.contains(event.target) &&
      !this.popoverElement?.contains(event.target as Node)
    ) {
      this.hide();
    }
  }

  toggle(): void {
    this.isOpen ? this.hide() : this.show();
  }

  show(): void {
    if (this.isOpen) return;

    this.popoverElement = document.createElement('div');
    this.popoverElement.className = `sig-popover sig-popover--${this.position()}`;

    const content = this.content();
    if (typeof content === 'string') {
      this.popoverElement.textContent = content;
    } else {
      // Template rendering would require ViewContainerRef in real implementation
      this.popoverElement.innerHTML = '<div class="sig-popover__content">[Template Content]</div>';
    }

    document.body.appendChild(this.popoverElement);
    this.updatePosition();
    this.isOpen = true;
    this.opened.emit();
  }

  hide(): void {
    if (!this.isOpen) return;

    if (this.popoverElement) {
      this.popoverElement.remove();
      this.popoverElement = null;
    }
    this.isOpen = false;
    this.closed.emit();
  }

  private updatePosition(): void {
    if (!this.popoverElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const popoverRect = this.popoverElement.getBoundingClientRect();
    const pos = this.position();
    const offset = this.offset();

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'top':
        top = hostRect.top - popoverRect.height - offset;
        left = hostRect.left + (hostRect.width - popoverRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + offset;
        left = hostRect.left + (hostRect.width - popoverRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - popoverRect.height) / 2;
        left = hostRect.left - popoverRect.width - offset;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - popoverRect.height) / 2;
        left = hostRect.right + offset;
        break;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - popoverRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - popoverRect.width - 8));

    this.popoverElement.style.top = `${top + window.scrollY}px`;
    this.popoverElement.style.left = `${left + window.scrollX}px`;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}

// Global styles for popover
const popoverStyles = `
.sig-popover {
  position: absolute;
  z-index: 9999;
  padding: 0.75rem 1rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  animation: popover-fade 0.15s ease-out;
}

.sig-popover::before {
  content: '';
  position: absolute;
  border: 8px solid transparent;
}

.sig-popover--top::before {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: white;
}

.sig-popover--bottom::before {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: white;
}

.sig-popover--left::before {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: white;
}

.sig-popover--right::before {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: white;
}

@keyframes popover-fade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'sig-popover-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = popoverStyles;
    document.head.appendChild(style);
  }
}