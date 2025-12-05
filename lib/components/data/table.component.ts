import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  contentChildren,
  TemplateRef,
  Directive,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** Column definition */
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  headerClass?: string;
  cellClass?: string;
  format?: (value: unknown, row: T) => string;
}

/** Sort event */
export interface TableSortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

/** Row selection event */
export interface TableSelectionEvent<T> {
  selected: T[];
  row?: T;
  type: 'select' | 'deselect' | 'selectAll' | 'deselectAll';
}

/**
 * Column template directive
 */
@Directive({
  selector: '[sigColumn]',
  standalone: true,
})
export class SigColumnDirective {
  readonly name = input.required<string>({ alias: 'sigColumn' });
  readonly header = input<TemplateRef<unknown>>();
  readonly cell = input<TemplateRef<unknown>>();
}

/**
 * SigTable - Signal-based data table
 */
@Component({
  selector: 'sig-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-table-wrapper" [class.sig-table-wrapper--loading]="loading()">
      @if (loading()) {
        <div class="sig-table__loading">
          <div class="sig-table__spinner"></div>
        </div>
      }

      <table class="sig-table" [class.sig-table--striped]="striped()" [class.sig-table--bordered]="bordered()">
        <thead class="sig-table__head">
          <tr>
            @if (selectable()) {
              <th class="sig-table__th sig-table__th--checkbox" style="width: 40px">
                <input
                  type="checkbox"
                  [checked]="isAllSelected()"
                  [indeterminate]="isIndeterminate()"
                  (change)="onSelectAll($event)"
                />
              </th>
            }

            @for (col of columns(); track col.key) {
              <th 
                class="sig-table__th"
                [class.sig-table__th--sortable]="col.sortable"
                [class]="col.headerClass"
                [style.width]="col.width"
                [style.text-align]="col.align || 'left'"
                (click)="col.sortable && onSortColumn(col.key)"
              >
                <div class="sig-table__th-content">
                  <span>{{ col.label }}</span>
                  @if (col.sortable) {
                    <span class="sig-table__sort-icon">
                      @if (sortColumn() === col.key) {
                        {{ sortDirection() === 'asc' ? '↑' : '↓' }}
                      } @else {
                        ↕
                      }
                    </span>
                  }
                </div>
              </th>
            }
          </tr>
        </thead>

        <tbody class="sig-table__body">
          @for (row of data(); track trackByFn(row); let i = $index) {
            <tr 
              class="sig-table__row"
              [class.sig-table__row--selected]="isSelected(row)"
              [class.sig-table__row--clickable]="rowClickable()"
              (click)="onRowClicked(row, $event)"
            >
              @if (selectable()) {
                <td class="sig-table__td sig-table__td--checkbox">
                  <input
                    type="checkbox"
                    [checked]="isSelected(row)"
                    (change)="onSelectRow(row, $event)"
                    (click)="$event.stopPropagation()"
                  />
                </td>
              }

              @for (col of columns(); track col.key) {
                <td 
                  class="sig-table__td"
                  [class]="col.cellClass"
                  [style.text-align]="col.align || 'left'"
                >
                  @if (getColumnTemplate(col.key); as template) {
                    <ng-container 
                      *ngTemplateOutlet="template; context: { $implicit: row, index: i, column: col }"
                    ></ng-container>
                  } @else {
                    {{ formatCell(row, col) }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr class="sig-table__row--empty">
              <td [attr.colspan]="columns().length + (selectable() ? 1 : 0)" class="sig-table__td">
                <div class="sig-table__empty">
                  {{ emptyText() }}
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .sig-table-wrapper {
      position: relative;
      overflow-x: auto;
    }

    .sig-table-wrapper--loading {
      pointer-events: none;
    }

    .sig-table__loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
      z-index: 10;
    }

    .sig-table__spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .sig-table--bordered {
      border: 1px solid #e5e7eb;
    }

    .sig-table__head {
      background-color: #f9fafb;
    }

    .sig-table__th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    .sig-table__th--sortable {
      cursor: pointer;
      user-select: none;
    }

    .sig-table__th--sortable:hover {
      background-color: #f3f4f6;
    }

    .sig-table__th-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sig-table__sort-icon {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .sig-table__th--checkbox,
    .sig-table__td--checkbox {
      width: 40px;
      text-align: center;
    }

    .sig-table__row {
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-table--striped .sig-table__row:nth-child(even) {
      background-color: #f9fafb;
    }

    .sig-table__row:hover {
      background-color: #f3f4f6;
    }

    .sig-table__row--selected {
      background-color: #eff6ff !important;
    }

    .sig-table__row--clickable {
      cursor: pointer;
    }

    .sig-table__td {
      padding: 0.75rem 1rem;
      color: #4b5563;
    }

    .sig-table__row--empty .sig-table__td {
      padding: 2rem;
    }

    .sig-table__empty {
      text-align: center;
      color: #9ca3af;
    }
  `],
})
export class SigTableComponent<T extends Record<string, unknown>> {
  // Content queries
  readonly columnTemplates = contentChildren(SigColumnDirective);

  // Inputs
  readonly data = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  readonly selectable = input<boolean>(false);
  readonly sortColumn = input<string | null>(null);
  readonly sortDirection = input<'asc' | 'desc' | null>(null);
  readonly loading = input<boolean>(false);
  readonly striped = input<boolean>(false);
  readonly bordered = input<boolean>(false);
  readonly rowClickable = input<boolean>(false);
  readonly emptyText = input<string>('Veri bulunamadı');
  readonly trackBy = input<keyof T | ((row: T) => unknown)>('id' as keyof T);

  // Outputs
  readonly sortChange = output<TableSortEvent>();
  readonly selectionChange = output<TableSelectionEvent<T>>();
  readonly rowClicked = output<T>();

  // Internal state
  private readonly _selectedKeys = signal(new Set<unknown>());

  // Computed
  readonly isAllSelected = computed(() => {
    const data = this.data();
    return data.length > 0 && this._selectedKeys().size === data.length;
  });

  readonly isIndeterminate = computed(() => {
    const size = this._selectedKeys().size;
    return size > 0 && size < this.data().length;
  });

  trackByFn = (row: T): unknown => {
    const trackBy = this.trackBy();
    if (typeof trackBy === 'function') {
      return trackBy(row);
    }
    return row[trackBy];
  };

  isSelected(row: T): boolean {
    return this._selectedKeys().has(this.trackByFn(row));
  }

  onSortColumn(column: string): void {
    let direction: 'asc' | 'desc' | null = 'asc';

    if (this.sortColumn() === column) {
      if (this.sortDirection() === 'asc') {
        direction = 'desc';
      } else if (this.sortDirection() === 'desc') {
        direction = null;
      }
    }

    this.sortChange.emit({ column, direction });
  }

  onSelectRow(row: T, event: Event): void {
    event.stopPropagation();
    const key = this.trackByFn(row);
    const newSet = new Set(this._selectedKeys());

    if (newSet.has(key)) {
      newSet.delete(key);
      this._selectedKeys.set(newSet);
      this.emitSelection('deselect', row);
    } else {
      newSet.add(key);
      this._selectedKeys.set(newSet);
      this.emitSelection('select', row);
    }
  }

  onSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      const allKeys = new Set(this.data().map((row) => this.trackByFn(row)));
      this._selectedKeys.set(allKeys);
      this.emitSelection('selectAll');
    } else {
      this._selectedKeys.set(new Set());
      this.emitSelection('deselectAll');
    }
  }

  onRowClicked(row: T, event: Event): void {
    if (this.rowClickable()) {
      this.rowClicked.emit(row);
    }
  }

  formatCell(row: T, col: TableColumn<T>): string {
    const value = row[col.key];
    if (col.format) {
      return col.format(value, row);
    }
    return String(value ?? '');
  }

  getColumnTemplate(key: string): TemplateRef<unknown> | null {
    const directive = this.columnTemplates().find((d) => d.name() === key);
    return directive?.cell() ?? null;
  }

  getSelectedRows(): T[] {
    const selectedKeys = this._selectedKeys();
    return this.data().filter((row) => selectedKeys.has(this.trackByFn(row)));
  }

  private emitSelection(type: TableSelectionEvent<T>['type'], row?: T): void {
    this.selectionChange.emit({
      selected: this.getSelectedRows(),
      row,
      type,
    });
  }

  // Public API
  clearSelection(): void {
    this._selectedKeys.set(new Set());
  }

  selectRows(rows: T[]): void {
    const keys = new Set(rows.map((row) => this.trackByFn(row)));
    this._selectedKeys.set(keys);
  }
}