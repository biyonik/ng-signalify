import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'range' | 'date' | 'daterange';
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterValue {
  [key: string]: any;
}

/**
 * SigFilterPanel - Signal-based filter panel component
 * 
 * Usage:
 * <sig-filter-panel
 *   [fields]="filterFields"
 *   [(value)]="filters"
 *   [collapsible]="true"
 *   (apply)="onApply($event)"
 *   (reset)="onReset()"
 * />
 */
@Component({
  selector: 'sig-filter-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-filter-panel"
      [class.sig-filter-panel--inline]="layout() === 'inline'"
      [class.sig-filter-panel--collapsed]="isCollapsed()"
    >
      <!-- Header -->
      @if (showHeader()) {
        <div class="sig-filter-panel__header">
          <div class="sig-filter-panel__title">
            <span class="sig-filter-panel__icon">🔍</span>
            {{ title() }}
            @if (activeFiltersCount() > 0) {
              <span class="sig-filter-panel__badge">{{ activeFiltersCount() }}</span>
            }
          </div>
          
          @if (collapsible()) {
            <button
              type="button"
              class="sig-filter-panel__toggle"
              (click)="toggleCollapse()"
            >
              {{ isCollapsed() ? '▼' : '▲' }}
            </button>
          }
        </div>
      }

      <!-- Content -->
      @if (!isCollapsed()) {
        <div class="sig-filter-panel__content">
          <!-- Search -->
          @if (searchable()) {
            <div class="sig-filter-panel__search">
              <input
                type="text"
                class="sig-filter-panel__search-input"
                placeholder="Filtre ara..."
                [value]="fieldSearch()"
                (input)="onFieldSearch($event)"
              />
            </div>
          }

          <!-- Fields -->
          <div class="sig-filter-panel__fields">
            @for (field of visibleFields(); track field.key) {
              <div class="sig-filter-panel__field">
                <label class="sig-filter-panel__label">{{ field.label }}</label>

                @switch (field.type) {
                  @case ('text') {
                    <input
                      type="text"
                      class="sig-filter-panel__input"
                      [placeholder]="field.placeholder || ''"
                      [value]="getFieldValue(field.key)"
                      (input)="onFieldChange(field.key, $event)"
                    />
                  }

                  @case ('select') {
                    <select
                      class="sig-filter-panel__select"
                      [value]="getFieldValue(field.key)"
                      (change)="onFieldChange(field.key, $event)"
                    >
                      <option value="">{{ field.placeholder || 'Seçiniz' }}</option>
                      @for (option of field.options; track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  }

                  @case ('multiselect') {
                    <div class="sig-filter-panel__multiselect">
                      @for (option of field.options; track option.value) {
                        <label class="sig-filter-panel__checkbox-label">
                          <input
                            type="checkbox"
                            [checked]="isMultiselectChecked(field.key, option.value)"
                            (change)="onMultiselectChange(field.key, option.value, $event)"
                          />
                          {{ option.label }}
                        </label>
                      }
                    </div>
                  }

                  @case ('checkbox') {
                    <div class="sig-filter-panel__checkboxes">
                      @for (option of field.options; track option.value) {
                        <label class="sig-filter-panel__checkbox-label">
                          <input
                            type="checkbox"
                            [checked]="isMultiselectChecked(field.key, option.value)"
                            (change)="onMultiselectChange(field.key, option.value, $event)"
                          />
                          {{ option.label }}
                        </label>
                      }
                    </div>
                  }

                  @case ('radio') {
                    <div class="sig-filter-panel__radios">
                      @for (option of field.options; track option.value) {
                        <label class="sig-filter-panel__radio-label">
                          <input
                            type="radio"
                            [name]="field.key"
                            [value]="option.value"
                            [checked]="getFieldValue(field.key) === option.value"
                            (change)="onFieldChange(field.key, $event)"
                          />
                          {{ option.label }}
                        </label>
                      }
                    </div>
                  }

                  @case ('range') {
                    <div class="sig-filter-panel__range">
                      <input
                        type="range"
                        class="sig-filter-panel__range-input"
                        [min]="field.min || 0"
                        [max]="field.max || 100"
                        [step]="field.step || 1"
                        [value]="getFieldValue(field.key) || field.min || 0"
                        (input)="onFieldChange(field.key, $event)"
                      />
                      <span class="sig-filter-panel__range-value">
                        {{ getFieldValue(field.key) || field.min || 0 }}
                      </span>
                    </div>
                  }

                  @case ('date') {
                    <input
                      type="date"
                      class="sig-filter-panel__input"
                      [value]="getFieldValue(field.key)"
                      (change)="onFieldChange(field.key, $event)"
                    />
                  }

                  @case ('daterange') {
                    <div class="sig-filter-panel__daterange">
                      <input
                        type="date"
                        class="sig-filter-panel__input"
                        [value]="getFieldValue(field.key + '_start')"
                        (change)="onFieldChange(field.key + '_start', $event)"
                      />
                      <span>-</span>
                      <input
                        type="date"
                        class="sig-filter-panel__input"
                        [value]="getFieldValue(field.key + '_end')"
                        (change)="onFieldChange(field.key + '_end', $event)"
                      />
                    </div>
                  }
                }

                @if (getFieldValue(field.key)) {
                  <button
                    type="button"
                    class="sig-filter-panel__field-clear"
                    (click)="clearField(field.key)"
                  >
                    ✕
                  </button>
                }
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="sig-filter-panel__actions">
            <button
              type="button"
              class="sig-filter-panel__btn sig-filter-panel__btn--reset"
              [disabled]="activeFiltersCount() === 0"
              (click)="resetFilters()"
            >
              Temizle
            </button>
            <button
              type="button"
              class="sig-filter-panel__btn sig-filter-panel__btn--apply"
              (click)="applyFilters()"
            >
              Uygula ({{ activeFiltersCount() }})
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-filter-panel {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .sig-filter-panel--inline {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      flex-wrap: wrap;
    }

    .sig-filter-panel--inline .sig-filter-panel__header {
      border-bottom: none;
      padding: 0;
    }

    .sig-filter-panel--inline .sig-filter-panel__content {
      display: contents;
    }

    .sig-filter-panel--inline .sig-filter-panel__fields {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .sig-filter-panel--inline .sig-filter-panel__field {
      margin-bottom: 0;
    }

    .sig-filter-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .sig-filter-panel__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .sig-filter-panel__icon {
      font-size: 1rem;
    }

    .sig-filter-panel__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      background-color: #3b82f6;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 9999px;
    }

    .sig-filter-panel__toggle {
      padding: 0.25rem 0.5rem;
      border: none;
      background: none;
      color: #6b7280;
      cursor: pointer;
    }

    .sig-filter-panel__content {
      padding: 1rem;
    }

    .sig-filter-panel__search {
      margin-bottom: 1rem;
    }

    .sig-filter-panel__search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .sig-filter-panel__fields {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sig-filter-panel__field {
      position: relative;
    }

    .sig-filter-panel__label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
    }

    .sig-filter-panel__input,
    .sig-filter-panel__select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .sig-filter-panel__input:focus,
    .sig-filter-panel__select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .sig-filter-panel__multiselect,
    .sig-filter-panel__checkboxes,
    .sig-filter-panel__radios {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sig-filter-panel__checkbox-label,
    .sig-filter-panel__radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
    }

    .sig-filter-panel__range {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sig-filter-panel__range-input {
      flex: 1;
    }

    .sig-filter-panel__range-value {
      min-width: 3rem;
      text-align: right;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .sig-filter-panel__daterange {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sig-filter-panel__daterange span {
      color: #9ca3af;
    }

    .sig-filter-panel__field-clear {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.125rem;
      border: none;
      background: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .sig-filter-panel__actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .sig-filter-panel__btn {
      flex: 1;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-filter-panel__btn--reset {
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
    }

    .sig-filter-panel__btn--reset:hover:not(:disabled) {
      background-color: #f9fafb;
    }

    .sig-filter-panel__btn--reset:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-filter-panel__btn--apply {
      border: none;
      background-color: #3b82f6;
      color: white;
    }

    .sig-filter-panel__btn--apply:hover {
      background-color: #2563eb;
    }
  `],
})
export class SigFilterPanelComponent {
  readonly fields = input.required<FilterField[]>();
  readonly value = model<FilterValue>({});
  readonly title = input<string>('Filtreler');
  readonly layout = input<'vertical' | 'inline'>('vertical');
  readonly collapsible = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly showHeader = input<boolean>(true);

  readonly apply = output<FilterValue>();
  readonly reset = output<void>();
  readonly change = output<FilterValue>();

  readonly isCollapsed = signal(false);
  readonly fieldSearch = signal('');

  readonly visibleFields = computed(() => {
    const search = this.fieldSearch().toLowerCase();
    if (!search) return this.fields();
    return this.fields().filter((f) => f.label.toLowerCase().includes(search));
  });

  readonly activeFiltersCount = computed(() => {
    const val = this.value();
    return Object.keys(val).filter((key) => {
      const v = val[key];
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && v !== '';
    }).length;
  });

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  onFieldSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fieldSearch.set(input.value);
  }

  getFieldValue(key: string): any {
    return this.value()[key] ?? '';
  }

  onFieldChange(key: string, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const newValue = { ...this.value(), [key]: input.value };
    this.value.set(newValue);
    this.change.emit(newValue);
  }

  isMultiselectChecked(key: string, value: any): boolean {
    const current = this.value()[key];
    if (!Array.isArray(current)) return false;
    return current.includes(value);
  }

  onMultiselectChange(key: string, optionValue: any, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const current = this.value()[key] || [];
    const arr = Array.isArray(current) ? [...current] : [];

    if (checkbox.checked) {
      arr.push(optionValue);
    } else {
      const index = arr.indexOf(optionValue);
      if (index > -1) arr.splice(index, 1);
    }

    const newValue = { ...this.value(), [key]: arr };
    this.value.set(newValue);
    this.change.emit(newValue);
  }

  clearField(key: string): void {
    const newValue = { ...this.value() };
    delete newValue[key];
    this.value.set(newValue);
    this.change.emit(newValue);
  }

  resetFilters(): void {
    this.value.set({});
    this.reset.emit();
    this.change.emit({});
  }

  applyFilters(): void {
    this.apply.emit(this.value());
  }
}