import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  disabled?: boolean;
  data?: any;
}

/**
 * SigTree - Signal-based tree component
 * 
 * Usage:
 * <sig-tree
 *   [nodes]="treeData"
 *   [selectable]="true"
 *   [checkable]="true"
 *   (nodeSelect)="onSelect($event)"
 *   (nodeExpand)="onExpand($event)"
 * />
 */
@Component({
  selector: 'sig-tree',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sig-tree">
      @if (searchable()) {
        <div class="sig-tree__search">
          <input
            type="text"
            class="sig-tree__search-input"
            placeholder="Ara..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>
      }

      <div class="sig-tree__content">
        <ng-container *ngTemplateOutlet="nodeTemplate; context: { nodes: filteredNodes(), level: 0 }"></ng-container>
      </div>

      <ng-template #nodeTemplate let-nodes="nodes" let-level="level">
        @for (node of nodes; track node.id) {
          <div 
            class="sig-tree__node"
            [style.padding-left.px]="level * indent()"
          >
            <div 
              class="sig-tree__node-content"
              [class.sig-tree__node-content--selected]="isSelected(node)"
              [class.sig-tree__node-content--disabled]="node.disabled"
              (click)="onNodeClick(node)"
            >
              <!-- Expand/Collapse -->
              @if (hasChildren(node)) {
                <button
                  type="button"
                  class="sig-tree__toggle"
                  (click)="toggleExpand(node, $event)"
                >
                  {{ isExpanded(node) ? '▼' : '▶' }}
                </button>
              } @else {
                <span class="sig-tree__toggle-placeholder"></span>
              }

              <!-- Checkbox -->
              @if (checkable()) {
                <input
                  type="checkbox"
                  class="sig-tree__checkbox"
                  [checked]="isChecked(node)"
                  [indeterminate]="isIndeterminate(node)"
                  [disabled]="node.disabled"
                  (change)="onCheckChange(node, $event)"
                  (click)="$event.stopPropagation()"
                />
              }

              <!-- Icon -->
              @if (node.icon) {
                <span class="sig-tree__icon">{{ node.icon }}</span>
              } @else if (hasChildren(node)) {
                <span class="sig-tree__icon">{{ isExpanded(node) ? '📂' : '📁' }}</span>
              } @else {
                <span class="sig-tree__icon">📄</span>
              }

              <!-- Label -->
              <span 
                class="sig-tree__label"
                [innerHTML]="highlightMatch(node.label)"
              ></span>

              <!-- Actions -->
              @if (showActions()) {
                <div class="sig-tree__actions">
                  <ng-content select="[tree-node-actions]"></ng-content>
                </div>
              }
            </div>

            <!-- Children -->
            @if (hasChildren(node) && isExpanded(node)) {
              <div class="sig-tree__children">
                <ng-container 
                  *ngTemplateOutlet="nodeTemplate; context: { nodes: node.children, level: level + 1 }"
                ></ng-container>
              </div>
            }
          </div>
        }
      </ng-template>
    </div>
  `,
  })
export class SigTreeComponent {
  readonly nodes = input.required<TreeNode[]>();
  readonly selectable = input<boolean>(true);
  readonly checkable = input<boolean>(false);
  readonly multiSelect = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly showActions = input<boolean>(false);
  readonly expandAll = input<boolean>(false);
  readonly indent = input<number>(20);

  readonly nodeSelect = output<TreeNode>();
  readonly nodeExpand = output<{ node: TreeNode; expanded: boolean }>();
  readonly nodeCheck = output<{ node: TreeNode; checked: boolean }>();
  readonly checkedNodesChange = output<TreeNode[]>();

  readonly searchQuery = signal('');
  readonly expandedNodes = signal(new Set<string>());
  readonly selectedNodes = signal(new Set<string>());
  readonly checkedNodes = signal(new Set<string>());

  readonly filteredNodes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.nodes();
    
    return this.filterNodes(this.nodes(), query);
  });

  private filterNodes(nodes: TreeNode[], query: string): TreeNode[] {
    const result: TreeNode[] = [];
    
    for (const node of nodes) {
      const matches = node.label.toLowerCase().includes(query);
      const children = node.children ? this.filterNodes(node.children, query) : [];
      
      if (matches || children.length > 0) {
        result.push({
          ...node,
          children: children.length > 0 ? children : node.children,
        });
        
        // Auto-expand matching nodes
        if (children.length > 0) {
          this.expandedNodes.update((set) => {
            const newSet = new Set(set);
            newSet.add(node.id);
            return newSet;
          });
        }
      }
    }
    
    return result;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  hasChildren(node: TreeNode): boolean {
    return !!node.children && node.children.length > 0;
  }

  isExpanded(node: TreeNode): boolean {
    return this.expandAll() || this.expandedNodes().has(node.id);
  }

  isSelected(node: TreeNode): boolean {
    return this.selectedNodes().has(node.id);
  }

  isChecked(node: TreeNode): boolean {
    if (this.checkedNodes().has(node.id)) return true;
    
    // Check if all children are checked
    if (node.children) {
      return node.children.every((child) => this.isChecked(child));
    }
    
    return false;
  }

  isIndeterminate(node: TreeNode): boolean {
    if (!node.children) return false;
    
    const checkedCount = node.children.filter((child) => this.isChecked(child)).length;
    return checkedCount > 0 && checkedCount < node.children.length;
  }

  toggleExpand(node: TreeNode, event: Event): void {
    event.stopPropagation();
    
    const expanded = !this.isExpanded(node);
    this.expandedNodes.update((set) => {
      const newSet = new Set(set);
      if (expanded) {
        newSet.add(node.id);
      } else {
        newSet.delete(node.id);
      }
      return newSet;
    });
    
    this.nodeExpand.emit({ node, expanded });
  }

  onNodeClick(node: TreeNode): void {
    if (node.disabled || !this.selectable()) return;
    
    this.selectedNodes.update((set) => {
      const newSet = this.multiSelect() ? new Set(set) : new Set<string>();
      
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      
      return newSet;
    });
    
    this.nodeSelect.emit(node);
  }

  onCheckChange(node: TreeNode, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const checked = checkbox.checked;
    
    this.updateCheckedState(node, checked);
    this.nodeCheck.emit({ node, checked });
    this.emitCheckedNodes();
  }

  private updateCheckedState(node: TreeNode, checked: boolean): void {
    this.checkedNodes.update((set) => {
      const newSet = new Set(set);
      
      // Update this node
      if (checked) {
        newSet.add(node.id);
      } else {
        newSet.delete(node.id);
      }
      
      // Update all children recursively
      if (node.children) {
        this.updateChildrenCheckedState(node.children, checked, newSet);
      }
      
      return newSet;
    });
  }

  private updateChildrenCheckedState(children: TreeNode[], checked: boolean, set: Set<string>): void {
    for (const child of children) {
      if (checked) {
        set.add(child.id);
      } else {
        set.delete(child.id);
      }
      
      if (child.children) {
        this.updateChildrenCheckedState(child.children, checked, set);
      }
    }
  }

  private emitCheckedNodes(): void {
    const checked = this.getCheckedNodes(this.nodes());
    this.checkedNodesChange.emit(checked);
  }

  private getCheckedNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    
    for (const node of nodes) {
      if (this.checkedNodes().has(node.id)) {
        result.push(node);
      }
      
      if (node.children) {
        result.push(...this.getCheckedNodes(node.children));
      }
    }
    
    return result;
  }

  highlightMatch(text: string): string {
    const query = this.searchQuery();
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Public API
  expandAllNodes(): void {
    const allIds = this.collectAllIds(this.nodes());
    this.expandedNodes.set(new Set(allIds));
  }

  collapseAllNodes(): void {
    this.expandedNodes.set(new Set());
  }

  selectNode(id: string): void {
    this.selectedNodes.update((set) => {
      const newSet = this.multiSelect() ? new Set(set) : new Set<string>();
      newSet.add(id);
      return newSet;
    });
  }

  clearSelection(): void {
    this.selectedNodes.set(new Set());
  }

  private collectAllIds(nodes: TreeNode[]): string[] {
    const ids: string[] = [];
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children) {
        ids.push(...this.collectAllIds(node.children));
      }
    }
    return ids;
  }
}