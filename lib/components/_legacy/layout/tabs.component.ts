import {
    Component,
    ChangeDetectionStrategy,
    signal,
    computed,
    input,
    output,
    model,
    contentChildren,
    Directive,
    TemplateRef,
    inject,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId, Keys } from '../../utils/a11y.utils';

/**
 * Tab panel directive
 */
@Directive({
    selector: '[sigTabPanel]',
    standalone: true,
})
export class SigTabPanelDirective {
    readonly id = input.required<string>({ alias: 'sigTabPanel' });
    readonly label = input.required<string>();
    readonly icon = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly badge = input<string | number | null>(null);

    readonly template = inject(TemplateRef);
}

/**
 * SigTabs - Signal-based accessible tabs component
 *
 * ARIA Pattern: Tabs
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
@Component({
    selector: 'sig-tabs',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        <div
                class="sig-tabs"
                [class.sig-tabs--vertical]="orientation() === 'vertical'"
                [class.sig-tabs--pills]="variant() === 'pills'"
                [class.sig-tabs--bordered]="variant() === 'bordered'"
                [class.sig-tabs--full-width]="fullWidth()"
        >
            <!-- Tab List -->
            <div
                    class="sig-tabs__list"
                    role="tablist"
                    [attr.aria-orientation]="orientation()"
                    [attr.aria-label]="ariaLabel()"
                    (keydown)="onTabListKeydown($event)"
            >
                @for (tab of tabs(); track tab.id(); let i = $index) {
                    <button
                            type="button"
                            role="tab"
                            class="sig-tabs__tab"
                            [id]="getTabId(tab.id())"
                            [class.sig-tabs__tab--active]="tab.id() === activeTab()"
                            [class.sig-tabs__tab--disabled]="tab.disabled()"
                            [disabled]="tab.disabled()"
                            [attr.aria-selected]="tab.id() === activeTab()"
                            [attr.aria-controls]="getPanelId(tab.id())"
                            [attr.tabindex]="getTabIndex(tab.id())"
                            (click)="selectTab(tab.id())"
                            (focus)="onTabFocus(tab.id())"
                    >
                        @if (tab.icon()) {
                            <span class="sig-tabs__icon" aria-hidden="true">{{ tab.icon() }}</span>
                        }
                        <span class="sig-tabs__label">{{ tab.label() }}</span>
                        @if (tab.badge() !== null) {
                            <span class="sig-tabs__badge" [attr.aria-label]="tab.badge() + ' bildirim'">
                {{ tab.badge() }}
              </span>
                        }
                    </button>
                }

                @if (variant() === 'underline') {
                    <div
                            class="sig-tabs__indicator"
                            [style.left.px]="indicatorStyle().left"
                            [style.width.px]="indicatorStyle().width"
                            aria-hidden="true"
                    ></div>
                }
            </div>

            <!-- Tab Panels -->
            <div class="sig-tabs__panels">
                @for (tab of tabs(); track tab.id()) {
                    <div
                            role="tabpanel"
                            class="sig-tabs__panel"
                            [id]="getPanelId(tab.id())"
                            [class.sig-tabs__panel--active]="tab.id() === activeTab()"
                            [attr.aria-labelledby]="getTabId(tab.id())"
                            [attr.tabindex]="tab.id() === activeTab() ? 0 : -1"
                            [hidden]="tab.id() !== activeTab()"
                    >
                        @if (tab.id() === activeTab() || !lazy()) {
                            <ng-container [ngTemplateOutlet]="tab.template"></ng-container>
                        }
                    </div>
                }
            </div>
        </div>
    `,
})
export class SigTabsComponent implements OnInit {
    readonly tabs = contentChildren(SigTabPanelDirective);

    readonly activeTab = model<string>('');
    readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
    readonly variant = input<'underline' | 'pills' | 'bordered'>('underline');
    readonly fullWidth = input<boolean>(false);
    readonly lazy = input<boolean>(true);
    readonly ariaLabel = input<string>('');

    readonly tabChanged = output<string>();

    readonly indicatorStyle = signal({ left: 0, width: 0 });
    readonly focusedTabId = signal<string | null>(null);

    private baseId = '';

    ngOnInit(): void {
        this.baseId = generateId('sig-tabs');

        setTimeout(() => {
            if (!this.activeTab() && this.tabs().length > 0) {
                const firstEnabled = this.tabs().find(t => !t.disabled());
                if (firstEnabled) {
                    this.activeTab.set(firstEnabled.id());
                }
            }
        });
    }

    getTabId(tabId: string): string {
        return `${this.baseId}-tab-${tabId}`;
    }

    getPanelId(tabId: string): string {
        return `${this.baseId}-panel-${tabId}`;
    }

    getTabIndex(tabId: string): number {
        return tabId === this.activeTab() ? 0 : -1;
    }

    onTabFocus(tabId: string): void {
        this.focusedTabId.set(tabId);
    }

    onTabListKeydown(event: KeyboardEvent): void {
        const tabList = this.tabs();
        const currentIndex = tabList.findIndex(t => t.id() === this.activeTab());
        let newIndex = currentIndex;

        const isHorizontal = this.orientation() === 'horizontal';

        switch (event.key) {
            case Keys.ARROW_RIGHT:
                if (isHorizontal) {
                    event.preventDefault();
                    newIndex = this.findNextTab(currentIndex, 1);
                }
                break;
            case Keys.ARROW_LEFT:
                if (isHorizontal) {
                    event.preventDefault();
                    newIndex = this.findNextTab(currentIndex, -1);
                }
                break;
            case Keys.ARROW_DOWN:
                if (!isHorizontal) {
                    event.preventDefault();
                    newIndex = this.findNextTab(currentIndex, 1);
                }
                break;
            case Keys.ARROW_UP:
                if (!isHorizontal) {
                    event.preventDefault();
                    newIndex = this.findNextTab(currentIndex, -1);
                }
                break;
            case Keys.HOME:
                event.preventDefault();
                newIndex = this.findNextTab(-1, 1);
                break;
            case Keys.END:
                event.preventDefault();
                newIndex = this.findNextTab(tabList.length, -1);
                break;
        }

        if (newIndex !== currentIndex && newIndex >= 0) {
            const newTab = tabList[newIndex];
            this.selectTab(newTab.id());
            this.focusTab(newTab.id());
        }
    }

    private findNextTab(fromIndex: number, direction: number): number {
        const tabList = this.tabs();
        let index = fromIndex + direction;

        while (index >= 0 && index < tabList.length) {
            if (!tabList[index].disabled()) {
                return index;
            }
            index += direction;
        }

        return fromIndex;
    }

    private focusTab(tabId: string): void {
        const tabElement = document.getElementById(this.getTabId(tabId));
        tabElement?.focus();
    }

    selectTab(id: string): void {
        const tab = this.tabs().find(t => t.id() === id);
        if (tab && !tab.disabled()) {
            this.activeTab.set(id);
            this.tabChanged.emit(id);
        }
    }

    nextTab(): void {
        const tabList = this.tabs();
        const currentIndex = tabList.findIndex(t => t.id() === this.activeTab());
        const nextIndex = this.findNextTab(currentIndex, 1);
        if (nextIndex !== currentIndex) {
            this.selectTab(tabList[nextIndex].id());
        }
    }

    prevTab(): void {
        const tabList = this.tabs();
        const currentIndex = tabList.findIndex(t => t.id() === this.activeTab());
        const prevIndex = this.findNextTab(currentIndex, -1);
        if (prevIndex !== currentIndex) {
            this.selectTab(tabList[prevIndex].id());
        }
    }
}
