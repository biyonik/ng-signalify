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