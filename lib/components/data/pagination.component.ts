import {
    Component,
    ChangeDetectionStrategy,
    input,
    output,
    computed,
    model,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId, announce } from '../../utils/a11y.utils';

/**
 * SigPagination - Signal-based accessible pagination
 *
 * ARIA: Uses nav landmark with aria-label
 */
@Component({
    selector: 'sig-pagination',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        <nav
                class="sig-pagination"
                [class.sig-pagination--sm]="size() === 'sm'"
                [class.sig-pagination--lg]="size() === 'lg'"
                [attr.aria-label]="ariaLabel()"
                role="navigation"
        >
            <!-- Previous button -->
            <button
                    type="button"
                    class="sig-pagination__btn sig-pagination__btn--prev"
                    [disabled]="isFirstPage()"
                    [attr.aria-label]="'Önceki sayfa'"
                    (click)="goToPrevious()"
            >
                <span aria-hidden="true">‹</span>
                @if (showLabels()) {
                    <span>Önceki</span>
                }
            </button>

            <!-- Page numbers -->
            <ul class="sig-pagination__pages" role="list">
                @for (page of visiblePages(); track page.value) {
                    @if (page.type === 'ellipsis') {
                        <li class="sig-pagination__ellipsis" aria-hidden="true">…</li>
                    } @else {
                        <li>
                            <button
                                    type="button"
                                    class="sig-pagination__page"
                                    [class.sig-pagination__page--active]="page.value === currentPage()"
                                    [attr.aria-label]="'Sayfa ' + page.value + ' / ' + totalPages()"
                                    [attr.aria-current]="page.value === currentPage() ? 'page' : null"
                                    (click)="goToPage(page.value!)"
                            >
                                {{ page.value }}
                            </button>
                        </li>
                    }
                }
            </ul>

            <!-- Next button -->
            <button
                    type="button"
                    class="sig-pagination__btn sig-pagination__btn--next"
                    [disabled]="isLastPage()"
                    [attr.aria-label]="'Sonraki sayfa'"
                    (click)="goToNext()"
            >
                @if (showLabels()) {
                    <span>Sonraki</span>
                }
                <span aria-hidden="true">›</span>
            </button>

            <!-- Page info (screen reader) -->
            <div class="sig-visually-hidden" aria-live="polite" aria-atomic="true">
                Sayfa {{ currentPage() }} / {{ totalPages() }}
            </div>

            <!-- Page size selector -->
            @if (showPageSize()) {
                <div class="sig-pagination__size">
                    <label [for]="pageSizeId" class="sig-pagination__size-label">
                        Sayfa başına:
                    </label>
                    <select
                            [id]="pageSizeId"
                            class="sig-pagination__size-select"
                            [value]="pageSize()"
                            (change)="onPageSizeChange($event)"
                    >
                        @for (size of pageSizeOptions(); track size) {
                            <option [value]="size">{{ size }}</option>
                        }
                    </select>
                </div>
            }

            <!-- Total info -->
            @if (showTotal()) {
                <div class="sig-pagination__total">
                    {{ getRangeLabel() }}
                </div>
            }
        </nav>
    `,
    styles: [`
    .sig-visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class SigPaginationComponent implements OnInit {
    readonly currentPage = model<number>(1);
    readonly totalItems = input<number>(0);
    readonly pageSize = model<number>(10);
    readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
    readonly siblingCount = input<number>(1);
    readonly showLabels = input<boolean>(false);
    readonly showPageSize = input<boolean>(false);
    readonly showTotal = input<boolean>(false);
    readonly size = input<'sm' | 'md' | 'lg'>('md');
    readonly ariaLabel = input<string>('Sayfalama');

    readonly pageChanged = output<number>();
    readonly pageSizeChanged = output<number>();

    pageSizeId = '';

    ngOnInit(): void {
        this.pageSizeId = generateId('sig-pagination-size');
    }

    readonly totalPages = computed(() => {
        return Math.ceil(this.totalItems() / this.pageSize()) || 1;
    });

    readonly isFirstPage = computed(() => this.currentPage() <= 1);
    readonly isLastPage = computed(() => this.currentPage() >= this.totalPages());

    readonly visiblePages = computed(() => {
        const current = this.currentPage();
        const total = this.totalPages();
        const siblings = this.siblingCount();

        const pages: Array<{ type: 'page' | 'ellipsis'; value?: number }> = [];

        // Always show first page
        pages.push({ type: 'page', value: 1 });

        // Calculate range around current page
        const rangeStart = Math.max(2, current - siblings);
        const rangeEnd = Math.min(total - 1, current + siblings);

        // Add ellipsis after first page if needed
        if (rangeStart > 2) {
            pages.push({ type: 'ellipsis' });
        }

        // Add pages in range
        for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.push({ type: 'page', value: i });
        }

        // Add ellipsis before last page if needed
        if (rangeEnd < total - 1) {
            pages.push({ type: 'ellipsis' });
        }

        // Always show last page if more than 1 page
        if (total > 1) {
            pages.push({ type: 'page', value: total });
        }

        return pages;
    });

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;

        this.currentPage.set(page);
        this.pageChanged.emit(page);
        announce(`Sayfa ${page} / ${this.totalPages()}`, 'polite');
    }

    goToPrevious(): void {
        this.goToPage(this.currentPage() - 1);
    }

    goToNext(): void {
        this.goToPage(this.currentPage() + 1);
    }

    onPageSizeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const newSize = parseInt(select.value, 10);
        this.pageSize.set(newSize);
        this.currentPage.set(1);
        this.pageSizeChanged.emit(newSize);
        announce(`Sayfa başına ${newSize} öğe gösteriliyor`, 'polite');
    }

    getRangeLabel(): string {
        const total = this.totalItems();
        if (total === 0) return 'Sonuç bulunamadı';

        const start = (this.currentPage() - 1) * this.pageSize() + 1;
        const end = Math.min(this.currentPage() * this.pageSize(), total);

        return `${start}-${end} / ${total}`;
    }
}
