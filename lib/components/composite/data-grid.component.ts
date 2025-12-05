import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  contentChildren,
  Directive,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataGridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<any>;
}

export interface DataGridSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataGridFilter {
  key: string;
  value: string;
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith';
}

export interface DataGridPageEvent {
  page: number;
  pageSize: number;
}

/**
 * Column Template Directive
 */
@Directive({
  selector: '[sigDataGridColumn]',
  standalone: true,
})
export class SigDataGridColumnDirective {
  readonly key = input.required<string>({ alias: 'sigDataGridColumn' });
  readonly template = inject(TemplateRef);
}

/**
 * SigDataGrid - Signal-based data grid with sorting, filtering, pagination
 * 
 * Usage:
 * <sig-data-grid
 *   [data]="users"
 *   [columns]="columns"
 *   [pageSize]="10"
 *   [selectable]="true"
 *   (selectionChange)="onSelect($event)"
 *   (sortChange)="onSort($event)"
 *   (pageChange)="onPage($event)"
 * >
 *   <ng-template sigDataGridColumn="actions" let-row>
 *     <button (click)="edit(row)">Edit</button>
 *   </ng-template>
 * </sig-data-grid>
 */
@Component({
  selector: 'sig-data-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-data-grid">
      <!-- Toolbar -->
      <div class="sig-data-grid__toolbar">
        <!-- Search -->
        @if (searchable()) {
          <div class="sig-data-grid__search">
            <input
              type="text"
              class="sig-data-grid__search-input"
              [placeholder]="searchPlaceholder()"
              [value]="searchQuery()"
              (input)="onSearch($event)"
            />
            @if (searchQuery()) {
              <button 
                type="button" 
                class="sig-data-grid__search-clear"
                (click)="clearSearch()"
              >
                ✕
              </button>
            }
          </div>
        }

        <!-- Bulk Actions -->
        @if (selectedRows().size > 0) {
          <div class="sig-data-grid__bulk-actions">
            <span class="sig-data-grid__selected-count">
              {{ selectedRows().size }} seçildi
            </span>
            <ng-content select="[grid-bulk-actions]"></ng-content>
          </div>
        }

        <!-- Toolbar Actions -->
        <div class="sig-data-grid__toolbar-actions">
          <ng-content select="[grid-toolbar]"></ng-content>
          
          @if (exportable()) {
            <button 
              type="button" 
              class="sig-data-grid__export-btn"
              (click)="exportData()"
            >
              📥 Dışa Aktar
            </button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="sig-data-grid__table-container">
        <table class="sig-data-grid__table">
          <thead>
            <tr>
              @if (selectable()) {
                <th class="sig-data-grid__th sig-data-grid__th--checkbox">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    [indeterminate]="isIndeterminate()"
                    (change)="toggleSelectAll()"
                  />
                </th>
              }
              
              @for (column of columns(); track column.key) {
                <th 
                  class="sig-data-grid__th"
                  [class.sig-data-grid__th--sortable]="column.sortable"
                  [style.width]="column.width"
                  [style.text-align]="column.align || 'left'"
                  (click)="column.sortable && toggleSort(column.key)"
                >
                  {{ column.label }}
                  @if (column.sortable) {
                    <span class="sig-data-grid__sort-icon">
                      @if (currentSort()?.key === column.key) {
                        {{ currentSort()?.direction === 'asc' ? '↑' : '↓' }}
                      } @else {
                        ↕
                      }
                    </span>
                  }
                </th>
              }
            </tr>
          </thead>
          
          <tbody>
            @if (loading()) {
              <tr>
                <td 
                  [attr.colspan]="selectable() ? columns().length + 1 : columns().length"
                  class="sig-data-grid__loading"
                >
                  <div class="sig-data-grid__spinner"></div>
                  Yükleniyor...
                </td>
              </tr>
            } @else if (displayedData().length === 0) {
              <tr>
                <td 
                  [attr.colspan]="selectable() ? columns().length + 1 : columns().length"
                  class="sig-data-grid__empty"
                >
                  {{ emptyMessage() }}
                </td>
              </tr>
            } @else {
              @for (row of displayedData(); track trackBy()(row, $index)) {
                <tr 
                  class="sig-data-grid__row"
                  [class.sig-data-grid__row--selected]="isRowSelected(row)"
                  [class.sig-data-grid__row--clickable]="rowClickable()"
                  (click)="onRowClick(row)"
                >
                  @if (selectable()) {
                    <td class="sig-data-grid__td sig-data-grid__td--checkbox">
                      <input
                        type="checkbox"
                        [checked]="isRowSelected(row)"
                        (change)="toggleRowSelection(row)"
                        (click)="$event.stopPropagation()"
                      />
                    </td>
                  }
                  
                  @for (column of columns(); track column.key) {
                    <td 
                      class="sig-data-grid__td"
                      [style.text-align]="column.align || 'left'"
                    >
                      @if (getColumnTemplate(column.key); as template) {
                        <ng-container 
                          [ngTemplateOutlet]="template"
                          [ngTemplateOutletContext]="{ $implicit: row, row: row, column: column }"
                        ></ng-container>
                      } @else {
                        {{ getNestedValue(row, column.key) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (pageable()) {
        <div class="sig-data-grid__pagination">
          <div class="sig-data-grid__page-info">
            {{ paginationInfo() }}
          </div>

          <div class="sig-data-grid__page-size">
            <label>Sayfa başına:</label>
            <select 
              [value]="pageSize()"
              (change)="onPageSizeChange($event)"
            >
              @for (size of pageSizeOptions(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>

          <div class="sig-data-grid__page-controls">
            <button
              type="button"
              [disabled]="currentPage() === 1"
              (click)="goToPage(1)"
            >
              ⟪
            </button>
            <button
              type="button"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
            >
              ◀
            </button>
            
            @for (page of visiblePages(); track page) {
              @if (page === '...') {
                <span class="sig-data-grid__page-ellipsis">...</span>
              } @else {
                <button
                  type="button"
                  class="sig-data-grid__page-btn"
                  [class.sig-data-grid__page-btn--active]="page === currentPage()"
                  (click)="goToPage(+page)"
                >
                  {{ page }}
                </button>
              }
            }
            
            <button
              type="button"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
            >
              ▶
            </button>
            <button
              type="button"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(totalPages())"
            >
              ⟫
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-data-grid {
      display: flex;
      flex-direction: column;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .sig-data-grid__toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .sig-data-grid__search {
      position: relative;
      flex: 1;
      max-width: 300px;
    }

    .sig-data-grid__search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .sig-data-grid__search-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .sig-data-grid__search-clear {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.125rem;
      border: none;
      background: none;
      color: #9ca3af;
      cursor: pointer;
    }

    .sig-data-grid__bulk-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sig-data-grid__selected-count {
      font-size: 0.875rem;
      font-weight: 500;
      color: #3b82f6;
    }

    .sig-data-grid__toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }

    .sig-data-grid__export-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .sig-data-grid__table-container {
      overflow-x: auto;
    }

    .sig-data-grid__table {
      width: 100%;
      border-collapse: collapse;
    }

    .sig-data-grid__th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    .sig-data-grid__th--sortable {
      cursor: pointer;
      user-select: none;
    }

    .sig-data-grid__th--sortable:hover {
      background-color: #f3f4f6;
    }

    .sig-data-grid__th--checkbox {
      width: 40px;
    }

    .sig-data-grid__sort-icon {
      margin-left: 0.25rem;
      opacity: 0.5;
    }

    .sig-data-grid__row {
      transition: background-color 0.1s;
    }

    .sig-data-grid__row:hover {
      background-color: #f9fafb;
    }

    .sig-data-grid__row--selected {
      background-color: #eff6ff;
    }

    .sig-data-grid__row--clickable {
      cursor: pointer;
    }

    .sig-data-grid__td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-data-grid__td--checkbox {
      width: 40px;
    }

    .sig-data-grid__loading,
    .sig-data-grid__empty {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }

    .sig-data-grid__spinner {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-data-grid__pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
      font-size: 0.875rem;
    }

    .sig-data-grid__page-info {
      color: #6b7280;
    }

    .sig-data-grid__page-size {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
    }

    .sig-data-grid__page-size select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .sig-data-grid__page-controls {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .sig-data-grid__page-controls button {
      padding: 0.375rem 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      background: white;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .sig-data-grid__page-controls button:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .sig-data-grid__page-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-data-grid__page-btn--active {
      background-color: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: white;
    }

    .sig-data-grid__page-ellipsis {
      padding: 0 0.5rem;
      color: #9ca3af;
    }
  `],
})
export class SigDataGridComponent<T = any> {
  readonly columnTemplates = contentChildren(SigDataGridColumnDirective);

  readonly data = input.required<T[]>();
  readonly columns = input.required<DataGridColumn[]>();
  readonly trackBy = input<(item: T, index: number) => any>((item, index) => index);
  readonly rowKey = input<string>('id');

  readonly selectable = input<boolean>(false);
  readonly searchable = input<boolean>(true);
  readonly pageable = input<boolean>(true);
  readonly exportable = input<boolean>(false);
  readonly rowClickable = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly pageSize = input<number>(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50, 100]);
  readonly searchPlaceholder = input<string>('Ara...');
  readonly emptyMessage = input<string>('Kayıt bulunamadı');

  readonly sortChange = output<DataGridSort>();
  readonly filterChange = output<DataGridFilter[]>();
  readonly pageChange = output<DataGridPageEvent>();
  readonly selectionChange = output<T[]>();
  readonly rowClick = output<T>();
  readonly exportClick = output<void>();

  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly currentSort = signal<DataGridSort | null>(null);
  readonly selectedRows = signal(new Set<unknown>());

  readonly filteredData = computed(() => {
    let result = [...this.data()];
    const query = this.searchQuery().toLowerCase();

    if (query) {
      result = result.filter((row) => {
        return this.columns().some((col) => {
          const value = this.getNestedValue(row, col.key);
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    const sort = this.currentSort();
    if (sort) {
      result.sort((a, b) => {
        const aVal = this.getNestedValue(a, sort.key);
        const bVal = this.getNestedValue(b, sort.key);
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredData().length / this.pageSize()) || 1;
  });

  readonly displayedData = computed(() => {
    if (!this.pageable()) return this.filteredData();
    
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredData().slice(start, start + this.pageSize());
  });

  readonly paginationInfo = computed(() => {
    const total = this.filteredData().length;
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), total);
    return `${start}-${end} / ${total}`;
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  });

  readonly isAllSelected = computed(() => {
    const displayed = this.displayedData();
    return displayed.length > 0 && displayed.every((row) => 
      this.selectedRows().has(this.getRowKey(row))
    );
  });

  readonly isIndeterminate = computed(() => {
    const displayed = this.displayedData();
    const selectedCount = displayed.filter((row) => 
      this.selectedRows().has(this.getRowKey(row))
    ).length;
    return selectedCount > 0 && selectedCount < displayed.length;
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleSort(key: string): void {
    const current = this.currentSort();
    let newSort: DataGridSort;

    if (current?.key === key) {
      newSort = {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      newSort = { key, direction: 'asc' };
    }

    this.currentSort.set(newSort);
    this.sortChange.emit(newSort);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.pageChange.emit({ page, pageSize: this.pageSize() });
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.currentPage.set(1);
    this.pageChange.emit({ page: 1, pageSize: newSize });
  }

  toggleSelectAll(): void {
    const displayed = this.displayedData();
    const newSelected = new Set(this.selectedRows());

    if (this.isAllSelected()) {
      displayed.forEach((row) => newSelected.delete(this.getRowKey(row)));
    } else {
      displayed.forEach((row) => newSelected.add(this.getRowKey(row)));
    }

    this.selectedRows.set(newSelected);
    this.emitSelectionChange();
  }

  toggleRowSelection(row: T): void {
    const key = this.getRowKey(row);
    const newSelected = new Set(this.selectedRows());

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    this.selectedRows.set(newSelected);
    this.emitSelectionChange();
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows().has(this.getRowKey(row));
  }

  onRowClick(row: T): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }

  exportData(): void {
    this.exportClick.emit();
  }

  getColumnTemplate(key: string): TemplateRef<any> | null {
    const directive = this.columnTemplates().find((d) => d.key() === key);
    return directive?.template || null;
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  }

  private getRowKey(row: T): unknown {
    return this.getNestedValue(row, this.rowKey());
  }

  private emitSelectionChange(): void {
    const selectedKeys = this.selectedRows();
    const selectedItems = this.data().filter((row) => 
      selectedKeys.has(this.getRowKey(row))
    );
    this.selectionChange.emit(selectedItems);
  }

  // Public API
  clearSelection(): void {
    this.selectedRows.set(new Set());
    this.selectionChange.emit([]);
  }

  selectAll(): void {
    const allKeys = new Set(this.data().map((row) => this.getRowKey(row)));
    this.selectedRows.set(allKeys);
    this.emitSelectionChange();
  }

  refresh(): void {
    this.currentPage.set(1);
    this.searchQuery.set('');
    this.currentSort.set(null);
    this.clearSelection();
  }
}