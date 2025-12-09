/**
 * Accessibility (A11y) Utilities
 *
 * TR: Erişilebilirlik yardımcı fonksiyonları ve sabitleri.
 * EN: Accessibility helper functions and constants.
 */

/**
 * TR: Benzersiz ID üretici.
 * EN: Unique ID generator.
 */
let idCounter = 0;
export function generateId(prefix: string = 'sig'): string {
    return `${prefix}-${++idCounter}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * TR: Klavye tuş kodları sabitleri.
 * EN: Keyboard key code constants.
 */
export const Keys = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    BACKSPACE: 'Backspace',
} as const;

/**
 * TR: ARIA live region announcement için yardımcı.
 * EN: Helper for ARIA live region announcements.
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = getOrCreateAnnouncer(priority);

    // Önceki mesajı temizle
    announcer.textContent = '';

    // Yeni mesajı bir sonraki frame'de ekle (screen reader'ın fark etmesi için)
    requestAnimationFrame(() => {
        announcer.textContent = message;
    });
}

function getOrCreateAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
    const id = `sig-announcer-${priority}`;
    let announcer = document.getElementById(id);

    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = id;
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.setAttribute('role', 'status');
        announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        document.body.appendChild(announcer);
    }

    return announcer;
}

/**
 * TR: Focus trap - Modal/Dialog için focus'u içeride tutar.
 * EN: Focus trap - Keeps focus inside for Modal/Dialog.
 */
export class FocusTrap {
    private previousActiveElement: HTMLElement | null = null;
    private focusableElements: HTMLElement[] = [];

    constructor(private container: HTMLElement) {}

    activate(): void {
        this.previousActiveElement = document.activeElement as HTMLElement;
        this.updateFocusableElements();

        // İlk focusable element'e focus ver
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }

        this.container.addEventListener('keydown', this.handleKeyDown);
    }

    deactivate(): void {
        this.container.removeEventListener('keydown', this.handleKeyDown);

        // Önceki element'e focus'u geri ver
        if (this.previousActiveElement && this.previousActiveElement.focus) {
            this.previousActiveElement.focus();
        }
    }

    private updateFocusableElements(): void {
        const selector = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        this.focusableElements = Array.from(
            this.container.querySelectorAll<HTMLElement>(selector)
        );
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== Keys.TAB) return;

        this.updateFocusableElements();

        const first = this.focusableElements[0];
        const last = this.focusableElements[this.focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    };
}

/**
 * TR: Roving tabindex yöneticisi (listeler, menüler için).
 * EN: Roving tabindex manager (for lists, menus).
 */
export class RovingTabIndex {
    private currentIndex = 0;

    constructor(
        private items: HTMLElement[],
        private options: {
            orientation?: 'horizontal' | 'vertical' | 'both';
            loop?: boolean;
        } = {}
    ) {
        this.options = { orientation: 'vertical', loop: true, ...options };
        this.updateTabIndices();
    }

    setItems(items: HTMLElement[]): void {
        this.items = items;
        this.currentIndex = Math.min(this.currentIndex, items.length - 1);
        this.updateTabIndices();
    }

    handleKeyDown(event: KeyboardEvent): boolean {
        const { orientation, loop } = this.options;
        let handled = false;

        const isVertical = orientation === 'vertical' || orientation === 'both';
        const isHorizontal = orientation === 'horizontal' || orientation === 'both';

        switch (event.key) {
            case Keys.ARROW_DOWN:
                if (isVertical) {
                    this.moveFocus(1, loop!);
                    handled = true;
                }
                break;
            case Keys.ARROW_UP:
                if (isVertical) {
                    this.moveFocus(-1, loop!);
                    handled = true;
                }
                break;
            case Keys.ARROW_RIGHT:
                if (isHorizontal) {
                    this.moveFocus(1, loop!);
                    handled = true;
                }
                break;
            case Keys.ARROW_LEFT:
                if (isHorizontal) {
                    this.moveFocus(-1, loop!);
                    handled = true;
                }
                break;
            case Keys.HOME:
                this.focusFirst();
                handled = true;
                break;
            case Keys.END:
                this.focusLast();
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
        }

        return handled;
    }

    private moveFocus(delta: number, loop: boolean): void {
        let newIndex = this.currentIndex + delta;

        if (loop) {
            if (newIndex < 0) newIndex = this.items.length - 1;
            if (newIndex >= this.items.length) newIndex = 0;
        } else {
            newIndex = Math.max(0, Math.min(newIndex, this.items.length - 1));
        }

        this.focusItem(newIndex);
    }

    focusFirst(): void {
        this.focusItem(0);
    }

    focusLast(): void {
        this.focusItem(this.items.length - 1);
    }

    focusItem(index: number): void {
        if (index >= 0 && index < this.items.length) {
            this.currentIndex = index;
            this.updateTabIndices();
            this.items[index]?.focus();
        }
    }

    private updateTabIndices(): void {
        this.items.forEach((item, index) => {
            item.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
        });
    }
}
