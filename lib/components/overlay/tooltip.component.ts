import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
    Directive,
    input,
    ElementRef,
    inject,
    OnDestroy,
    OnInit,
    HostListener,
    PLATFORM_ID,
} from '@angular/core';
import { generateId } from '../../utils/a11y.utils';

/**
 * SigTooltip - Signal-based accessible tooltip directive
 *
 * ARIA Pattern: Tooltip
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */
@Directive({
    selector: '[sigTooltip]',
    standalone: true,
    host: {
        '[attr.aria-describedby]': 'tooltipId',
    }
})
export class SigTooltipDirective implements OnInit, OnDestroy {
    readonly content = input.required<string>({ alias: 'sigTooltip' });
    readonly position = input<'top' | 'bottom' | 'left' | 'right'>('top');
    readonly delay = input<number>(200);
    readonly disabled = input<boolean>(false);

    private readonly elementRef = inject(ElementRef);
    private tooltipElement: HTMLDivElement | null = null;
    private showTimeout: ReturnType<typeof setTimeout> | null = null;

    private document: Document = inject(DOCUMENT);
    private platformId: Object = inject(PLATFORM_ID);

    tooltipId = '';

    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
        this.tooltipId = generateId('sig-tooltip');
    }

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

    @HostListener('keydown.escape')
    onEscape(): void {
        this.hide();
    }

    private show(): void {
        if (!this.isBrowser || this.tooltipElement) return;

        this.tooltipElement = this.document.createElement('div');
        this.tooltipElement.id = this.tooltipId;
        this.tooltipElement.className = `sig-tooltip sig-tooltip--${this.position()}`;
        this.tooltipElement.textContent = this.content();
        this.tooltipElement.setAttribute('role', 'tooltip');
        this.tooltipElement.setAttribute('aria-hidden', 'false');

        this.document.body.appendChild(this.tooltipElement);
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

        const win = this.document.defaultView || window;
        top = Math.max(8, Math.min(top, win.innerHeight - tooltipRect.height - 8));
        left = Math.max(8, Math.min(left, win.innerWidth - tooltipRect.width - 8));

        this.tooltipElement.style.top = `${top + window.scrollY}px`;
        this.tooltipElement.style.left = `${left + window.scrollX}px`;
    }

    ngOnDestroy(): void {
        this.hide();
    }
}
