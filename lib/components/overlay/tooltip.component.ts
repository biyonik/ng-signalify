import {
  Directive,
  input,
  ElementRef,
  inject,
  OnDestroy,
  HostListener,
} from '@angular/core';

/**
 * SigTooltip - Signal-based tooltip directive
 * 
 * Usage:
 * <button [sigTooltip]="'Bu bir tooltip'" position="top">
 *   Hover me
 * </button>
 */
@Directive({
  selector: '[sigTooltip]',
  standalone: true,
})
export class SigTooltipDirective implements OnDestroy {
  readonly content = input.required<string>({ alias: 'sigTooltip' });
  readonly position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  readonly delay = input<number>(200);
  readonly disabled = input<boolean>(false);

  private readonly elementRef = inject(ElementRef);
  private tooltipElement: HTMLDivElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.disabled()) return;
    
    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.delay());
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.disabled()) return;
    this.show();
  }

  @HostListener('blur')
  onBlur(): void {
    this.hide();
  }

  private show(): void {
    if (this.tooltipElement) return;

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = `sig-tooltip sig-tooltip--${this.position()}`;
    this.tooltipElement.textContent = this.content();
    document.body.appendChild(this.tooltipElement);

    this.updatePosition();
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }

  private updatePosition(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const pos = this.position();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'top':
        top = hostRect.top - tooltipRect.height - gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + gap;
        break;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    this.tooltipElement.style.top = `${top + window.scrollY}px`;
    this.tooltipElement.style.left = `${left + window.scrollX}px`;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}

// Global styles for tooltip (add to styles.css)
const tooltipStyles = `
.sig-tooltip {
  position: absolute;
  z-index: 9999;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  max-width: 250px;
  word-wrap: break-word;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: tooltip-fade 0.15s ease-out;
  pointer-events: none;
}

.sig-tooltip::after {
  content: '';
  position: absolute;
  border: 6px solid transparent;
}

.sig-tooltip--top::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: #1f2937;
}

.sig-tooltip--bottom::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: #1f2937;
}

.sig-tooltip--left::after {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: #1f2937;
}

.sig-tooltip--right::after {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: #1f2937;
}

@keyframes tooltip-fade {
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
  const styleId = 'sig-tooltip-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = tooltipStyles;
    document.head.appendChild(style);
  }
}