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
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId, Keys } from '../../utils/a11y.utils';

/**
 * Accordion Item Component
 *
 * ARIA Pattern: Accordion
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
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
                [class.sig-accordion-item--disabled]="isDisabled()"
        >
            <!-- Header -->
            <h3 class="sig-accordion-item__heading">
                <button
                        type="button"
                        class="sig-accordion-item__header"
                        [id]="headerId"
                        [disabled]="isDisabled()"
                        [attr.aria-expanded]="expanded()"
                        [attr.aria-controls]="panelId"
                        [attr.aria-disabled]="isDisabled()"
                        (click)="toggle()"
                        (keydown)="onKeydown($event)"
                >
                    @if (icon()) {
                        <span class="sig-accordion-item__icon" aria-hidden="true">{{ icon() }}</span>
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

                    <span class="sig-accordion-item__chevron" aria-hidden="true">
            {{ expanded() ? '▲' : '▼' }}
          </span>
                </button>
            </h3>

            <!-- Content -->
            <div
                    [id]="panelId"
                    class="sig-accordion-item__content"
                    role="region"
                    [attr.aria-labelledby]="headerId"
                    [hidden]="!expanded()"
            >
                <div class="sig-accordion-item__body">
                    <ng-content></ng-content>
                </div>
            </div>
        </div>
    `,
})
export class SigAccordionItemComponent implements OnInit {
    readonly id = input.required<string>();
    readonly title = input<string>('');
    readonly subtitle = input<string>('');
    readonly icon = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly expanded = model<boolean>(false);

    readonly expandedChange = output<boolean>();
    readonly keyboardEvent = output<{ event: KeyboardEvent; id: string }>();

    // IDs
    headerId = '';
    panelId = '';

    private _disabledByParent = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByParent());

    ngOnInit(): void {
        const baseId = generateId('sig-accordion-item');
        this.headerId = `${baseId}-header`;
        this.panelId = `${baseId}-panel`;
    }

    toggle(): void {
        if (!this.isDisabled()) {
            const newValue = !this.expanded();
            this.expanded.set(newValue);
            this.expandedChange.emit(newValue);
        }
    }

    onKeydown(event: KeyboardEvent): void {
        this.keyboardEvent.emit({ event, id: this.id() });
    }

    open(): void {
        if (!this.isDisabled()) {
            this.expanded.set(true);
            this.expandedChange.emit(true);
        }
    }

    close(): void {
        this.expanded.set(false);
        this.expandedChange.emit(false);
    }

    setDisabledByParent(disabled: boolean): void {
        this._disabledByParent.set(disabled);
    }
}

/**
 * SigAccordion - Container for accordion items
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
                role="presentation"
        >
            <ng-content></ng-content>
        </div>
    `,
})
export class SigAccordionComponent implements OnInit {
    readonly items = contentChildren(SigAccordionItemComponent);

    readonly multiple = input<boolean>(false);
    readonly bordered = input<boolean>(false);
    readonly flush = input<boolean>(false);

    ngOnInit(): void {
        // Set up keyboard navigation via effect or afterViewInit
        setTimeout(() => {
            this.setupKeyboardNavigation();
        });
    }

    private setupKeyboardNavigation(): void {
        this.items().forEach(item => {
            // Subscribe to keyboard events from items
            // In production, use effect() or proper subscription
        });
    }

    handleItemKeydown(event: KeyboardEvent, itemId: string): void {
        const itemList = this.items();
        const currentIndex = itemList.findIndex(i => i.id() === itemId);

        switch (event.key) {
            case Keys.ARROW_DOWN:
                event.preventDefault();
                this.focusItem(currentIndex + 1);
                break;
            case Keys.ARROW_UP:
                event.preventDefault();
                this.focusItem(currentIndex - 1);
                break;
            case Keys.HOME:
                event.preventDefault();
                this.focusItem(0);
                break;
            case Keys.END:
                event.preventDefault();
                this.focusItem(itemList.length - 1);
                break;
        }
    }

    private focusItem(index: number): void {
        const itemList = this.items();
        if (index < 0) index = itemList.length - 1;
        if (index >= itemList.length) index = 0;

        const item = itemList[index];
        const header = document.getElementById(item.headerId);
        header?.focus();
    }

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
