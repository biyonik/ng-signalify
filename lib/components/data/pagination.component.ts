import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigPagination - Pagination controls
 * 
 * Usage:
 * <sig-pagination
 *   [page]="currentPage"
 *   [pageSize]="pageSize"
 *   [total]="totalItems"
 *   [pageSizeOptions]="[10, 20, 50, 100]"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)"
 * />
 */
@Component({
  selector: 'sig-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-pagination" [class.sig-pagination--compact]="compact">
      <!-- Info -->
      @if (showInfo) {
        <div class="sig-pagination__info">
          {{ infoText() }}
        </div>
      }

      <!-- Page size selector -->
      @if (showPageSize && pageSizeOptions.length > 0) {
        <div class="sig-pagination__size">
          <label>
            <span class="sig-pagination__size-label">Sayfa başına:</span>
            <select
              [value]="pageSize"
              (change)="onPageSizeChange($event)"
              class="sig-pagination__size-select"
            >
              @for (size of pageSizeOptions; track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </label>
        </div>
      }

      <!-- Navigation -->
      <div class="sig-pagination__nav">
        <!-- First -->
        @if (showFirstLast) {
          <button
            type="button"
            class="sig-pagination__btn"
            [disabled]="!hasPrev()"
            (click)="goFirst()"
            [title]="'İlk sayfa'"
          >
            ««
          </button>
        }

        <!-- Previous -->
        <button
          type="button"
          class="sig-pagination__btn"
          [disabled]="!hasPrev()"
          (click)="goPrev()"
          [title]="'Önceki sayfa'"
        >
          ‹
        </button>

        <!-- Page buttons -->
        @if (!compact) {
          @for (p of visiblePages(); track p) {
            @if (p === -1) {
              <span class="sig-pagination__ellipsis">...</span>
            } @else {
              <button
                type="button"
                class="sig-pagination__btn sig-pagination__btn--page"
                [class.sig-pagination__btn--active]="p === page"
                (click)="goTo(p)"
              >
                {{ p }}
              </button>
            }
          }
        } @else {
          <span class="sig-pagination__current">
            {{ page }} / {{ totalPages() }}
          </span>
        }

        <!-- Next -->
        <button
          type="button"
          class="sig-pagination__btn"
          [disabled]="!hasNext()"
          (click)="goNext()"
          [title]="'Sonraki sayfa'"
        >
          ›
        </button>

        <!-- Last -->
        @if (showFirstLast) {
          <button
            type="button"
            class="sig-pagination__btn"
            [disabled]="!hasNext()"
            (click)="goLast()"
            [title]="'Son sayfa'"
          >
            »»
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .sig-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      flex-wrap: wrap;
    }

    .sig-pagination--compact {
      justify-content: center;
    }

    .sig-pagination__info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .sig-pagination__size {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sig-pagination__size-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .sig-pagination__size-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background: white;
    }

    .sig-pagination__nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .sig-pagination__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      padding: 0 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      background: white;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-pagination__btn:hover:not(:disabled) {
      background-color: #f3f4f6;
      border-color: #9ca3af;
    }

    .sig-pagination__btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-pagination__btn--active {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .sig-pagination__btn--active:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .sig-pagination__ellipsis {
      padding: 0 0.5rem;
      color: #9ca3af;
    }

    .sig-pagination__current {
      padding: 0 0.75rem;
      font-size: 0.875rem;
      color: #374151;
    }
  `],
})
export class SigPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() maxButtons = 5;
  @Input() showInfo = true;
  @Input() showPageSize = true;
  @Input() showFirstLast = true;
  @Input() compact = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChanged = new EventEmitter<number>();

  totalPages = computed(() => {
    return this.pageSize > 0 ? Math.ceil(this.total / this.pageSize) : 0;
  });

  startIndex = computed(() => {
    return (this.page - 1) * this.pageSize + 1;
  });

  endIndex = computed(() => {
    return Math.min(this.page * this.pageSize, this.total);
  });

  infoText = computed(() => {
    if (this.total === 0) return 'Kayıt bulunamadı';
    return `${this.startIndex()} - ${this.endIndex()} / ${this.total} kayıt`;
  });

  hasPrev = computed(() => this.page > 1);
  hasNext = computed(() => this.page < this.totalPages());

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page;
    const max = this.maxButtons;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const half = Math.floor(max / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);

    if (end - start + 1 < max) {
      start = Math.max(1, end - max + 1);
    }

    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // Ellipsis
      }
    }

    // Middle pages
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Always show last page
    if (end < total) {
      if (end < total - 1) {
        pages.push(-1); // Ellipsis
      }
      pages.push(total);
    }

    return pages;
  });

  goTo(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  goFirst() {
    this.goTo(1);
  }

  goLast() {
    this.goTo(this.totalPages());
  }

  goPrev() {
    this.goTo(this.page - 1);
  }

  goNext() {
    this.goTo(this.page + 1);
  }

  onPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChanged.emit(value);
  }
}