import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  effect,
  TemplateRef,
  contentChild,
  Directive,
  ViewEncapsulation,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[sigVirtualItem]',
  standalone: true,
})
export class SigVirtualItemDirective {
  constructor(public readonly template: TemplateRef<any>) {}
}

/**
 * SigVirtualScroll - Signal-based virtual scrolling
 * 
 * Usage:
 * <sig-virtual-scroll
 *   [items]="largeList"
 *   [itemHeight]="48"
 *   [bufferSize]="5"
 * >
 *   <ng-template sigVirtualItem let-item let-index="index">
 *     <div class="item">{{ item.name }}</div>
 *   </ng-template>
 * </sig-virtual-scroll>
 */
@Component({
  selector: 'sig-virtual-scroll',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // CSS refactoring sonrası
  template: `
    <div 
      class="sig-virtual-scroll"
      #viewport
      [style.height.px]="height()"
      (scroll)="onScroll()"
    >
      <div 
        class="sig-virtual-scroll__spacer"
        [style.height.px]="totalHeight()"
      >
        <div 
          class="sig-virtual-scroll__content"
          [style.transform]="'translateY(' + offsetY() + 'px)'"
        >
          @for (item of visibleItems(); track trackByFn()(item.data, item.index)) {
            <div 
              class="sig-virtual-scroll__item"
              [style.height.px]="itemHeight()"
            >
              @if (itemTemplate()) {
                <ng-container
                  [ngTemplateOutlet]="itemTemplate()!.template"
                  [ngTemplateOutletContext]="{ $implicit: item.data, index: item.index }"
                ></ng-container>
              } @else {
                {{ item.data }}
              }
            </div>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="sig-virtual-scroll__loading">
          <div class="sig-virtual-scroll__spinner"></div>
          Yükleniyor...
        </div>
      }
    </div>
  `
})
export class SigVirtualScrollComponent<T = any> {
  readonly viewport = viewChild<ElementRef>('viewport');
  readonly itemTemplate = contentChild(SigVirtualItemDirective);
  readonly platformId = inject(PLATFORM_ID);

  readonly items = input.required<T[]>();
  readonly itemHeight = input<number>(48);
  readonly height = input<number>(400);
  readonly bufferSize = input<number>(5);
  readonly loading = input<boolean>(false);
  readonly trackByFn = input<(item: T, index: number) => any>((_, index) => index);

  readonly scrollEnd = output<void>();
  readonly visibleRangeChange = output<{ start: number; end: number }>();

  readonly scrollTop = signal(0);

  readonly totalHeight = computed(() => {
    return this.items().length * this.itemHeight();
  });

  readonly visibleCount = computed(() => {
    return Math.ceil(this.height() / this.itemHeight()) + this.bufferSize() * 2;
  });

  readonly startIndex = computed(() => {
    const index = Math.floor(this.scrollTop() / this.itemHeight()) - this.bufferSize();
    return Math.max(0, index);
  });

  readonly endIndex = computed(() => {
    return Math.min(this.items().length, this.startIndex() + this.visibleCount());
  });

  readonly offsetY = computed(() => {
    return this.startIndex() * this.itemHeight();
  });

  readonly visibleItems = computed(() => {
    const items = this.items();
    const start = this.startIndex();
    const end = this.endIndex();
    
    return items.slice(start, end).map((data, i) => ({
      data,
      index: start + i,
    }));
  });

  constructor() {
    effect(() => {
      this.visibleRangeChange.emit({
        start: this.startIndex(),
        end: this.endIndex(),
      });
    });
  }

  onScroll(): void {
    // SSR Koruması
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.viewport()?.nativeElement;
    if (!el) return;

    this.scrollTop.set(el.scrollTop);

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      this.scrollEnd.emit();
    }
  }

  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.viewport()?.nativeElement;
    if (!el) return;

    const top = index * this.itemHeight();
    el.scrollTo({ top, behavior });
  }

  scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    this.scrollToIndex(0, behavior);
  }

  scrollToBottom(behavior: ScrollBehavior = 'auto'): void {
    this.scrollToIndex(this.items().length - 1, behavior);
  }
}