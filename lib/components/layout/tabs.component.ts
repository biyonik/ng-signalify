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
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
 * SigTabs - Signal-based tabs component
 * 
 * Usage:
 * <sig-tabs [(activeTab)]="currentTab">
 *   <ng-template sigTabPanel="home" label="Ana Sayfa" icon="🏠">
 *     Home content...
 *   </ng-template>
 *   <ng-template sigTabPanel="profile" label="Profil" icon="👤" [badge]="5">
 *     Profile content...
 *   </ng-template>
 * </sig-tabs>
 */
@Component({
  selector: 'sig-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-tabs"
      [class.sig-tabs--vertical]="orientation() === 'vertical'"
      [class.sig-tabs--pills]="variant() === 'pills'"
      [class.sig-tabs--bordered]="variant() === 'bordered'"
      [class.sig-tabs--full-width]="fullWidth()"
    >
      <!-- Tab List -->
      <div class="sig-tabs__list" role="tablist" [attr.aria-orientation]="orientation()">
        @for (tab of tabs(); track tab.id()) {
          <button
            type="button"
            role="tab"
            class="sig-tabs__tab"
            [class.sig-tabs__tab--active]="tab.id() === activeTab()"
            [class.sig-tabs__tab--disabled]="tab.disabled()"
            [disabled]="tab.disabled()"
            [attr.aria-selected]="tab.id() === activeTab()"
            [attr.aria-controls]="'panel-' + tab.id()"
            [id]="'tab-' + tab.id()"
            (click)="selectTab(tab.id())"
          >
            @if (tab.icon()) {
              <span class="sig-tabs__icon">{{ tab.icon() }}</span>
            }
            <span class="sig-tabs__label">{{ tab.label() }}</span>
            @if (tab.badge() !== null) {
              <span class="sig-tabs__badge">{{ tab.badge() }}</span>
            }
          </button>
        }
        
        <!-- Active indicator (for underline variant) -->
        @if (variant() === 'underline') {
          <div 
            class="sig-tabs__indicator"
            [style.left.px]="indicatorStyle().left"
            [style.width.px]="indicatorStyle().width"
          ></div>
        }
      </div>

      <!-- Tab Panels -->
      <div class="sig-tabs__panels">
        @for (tab of tabs(); track tab.id()) {
          <div
            role="tabpanel"
            class="sig-tabs__panel"
            [class.sig-tabs__panel--active]="tab.id() === activeTab()"
            [attr.aria-labelledby]="'tab-' + tab.id()"
            [id]="'panel-' + tab.id()"
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
  styles: [`
    .sig-tabs {
      display: flex;
      flex-direction: column;
    }

    .sig-tabs--vertical {
      flex-direction: row;
    }

    .sig-tabs__list {
      position: relative;
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-tabs--vertical .sig-tabs__list {
      flex-direction: column;
      border-bottom: none;
      border-right: 1px solid #e5e7eb;
      padding-right: 0.5rem;
      min-width: 150px;
    }

    .sig-tabs--pills .sig-tabs__list {
      border-bottom: none;
      background-color: #f3f4f6;
      padding: 0.25rem;
      border-radius: 0.5rem;
      gap: 0.25rem;
    }

    .sig-tabs--bordered .sig-tabs__list {
      border: 1px solid #e5e7eb;
      border-bottom: none;
      border-radius: 0.5rem 0.5rem 0 0;
      background-color: #f9fafb;
      padding: 0.25rem 0.25rem 0;
    }

    .sig-tabs--full-width .sig-tabs__list {
      width: 100%;
    }

    .sig-tabs--full-width .sig-tabs__tab {
      flex: 1;
    }

    .sig-tabs__tab {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      position: relative;
    }

    .sig-tabs__tab:hover:not(:disabled) {
      color: #374151;
    }

    .sig-tabs__tab--active {
      color: #3b82f6;
    }

    .sig-tabs__tab--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Underline variant */
    .sig-tabs__tab--active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #3b82f6;
    }

    .sig-tabs--vertical .sig-tabs__tab--active::after {
      bottom: auto;
      top: 0;
      left: auto;
      right: -1px;
      width: 2px;
      height: 100%;
    }

    /* Pills variant */
    .sig-tabs--pills .sig-tabs__tab {
      border-radius: 0.375rem;
      padding: 0.5rem 1rem;
    }

    .sig-tabs--pills .sig-tabs__tab--active {
      background-color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      color: #374151;
    }

    .sig-tabs--pills .sig-tabs__tab--active::after {
      display: none;
    }

    /* Bordered variant */
    .sig-tabs--bordered .sig-tabs__tab {
      border: 1px solid transparent;
      border-bottom: none;
      margin-bottom: -1px;
      border-radius: 0.375rem 0.375rem 0 0;
    }

    .sig-tabs--bordered .sig-tabs__tab--active {
      background-color: white;
      border-color: #e5e7eb;
      color: #374151;
    }

    .sig-tabs--bordered .sig-tabs__tab--active::after {
      display: none;
    }

    .sig-tabs__icon {
      font-size: 1rem;
    }

    .sig-tabs__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      font-size: 0.625rem;
      font-weight: 600;
      background-color: #ef4444;
      color: white;
      border-radius: 9999px;
    }

    .sig-tabs__indicator {
      position: absolute;
      bottom: 0;
      height: 2px;
      background-color: #3b82f6;
      transition: left 0.2s, width 0.2s;
    }

    .sig-tabs__panels {
      flex: 1;
    }

    .sig-tabs--bordered .sig-tabs__panels {
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 0.5rem 0.5rem;
    }

    .sig-tabs__panel {
      padding: 1rem;
    }

    .sig-tabs__panel[hidden] {
      display: none;
    }

    .sig-tabs--vertical .sig-tabs__panels {
      padding-left: 1rem;
    }
  `],
})
export class SigTabsComponent {
  readonly tabs = contentChildren(SigTabPanelDirective);

  readonly activeTab = model<string>('');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly variant = input<'underline' | 'pills' | 'bordered'>('underline');
  readonly fullWidth = input<boolean>(false);
  readonly lazy = input<boolean>(true);

  readonly tabChanged = output<string>();

  readonly indicatorStyle = signal({ left: 0, width: 0 });

  constructor() {
    // Set default active tab
    setTimeout(() => {
      if (!this.activeTab() && this.tabs().length > 0) {
        const firstEnabled = this.tabs().find(t => !t.disabled());
        if (firstEnabled) {
          this.activeTab.set(firstEnabled.id());
        }
      }
    });
  }

  selectTab(id: string): void {
    const tab = this.tabs().find(t => t.id() === id);
    if (tab && !tab.disabled()) {
      this.activeTab.set(id);
      this.tabChanged.emit(id);
    }
  }

  // Public API
  nextTab(): void {
    const tabList = this.tabs();
    const currentIndex = tabList.findIndex(t => t.id() === this.activeTab());
    for (let i = currentIndex + 1; i < tabList.length; i++) {
      if (!tabList[i].disabled()) {
        this.selectTab(tabList[i].id());
        return;
      }
    }
  }

  prevTab(): void {
    const tabList = this.tabs();
    const currentIndex = tabList.findIndex(t => t.id() === this.activeTab());
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!tabList[i].disabled()) {
        this.selectTab(tabList[i].id());
        return;
      }
    }
  }
}