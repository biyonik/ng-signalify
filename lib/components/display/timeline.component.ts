import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  contentChildren,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Timeline Item Directive
 */
@Directive({
  selector: '[sigTimelineItem]',
  standalone: true,
})
export class SigTimelineItemDirective {
  readonly date = input<string>('');
  readonly title = input<string>('');
  readonly icon = input<string>('');
  readonly color = input<'default' | 'primary' | 'success' | 'warning' | 'danger'>('default');
  readonly dotted = input<boolean>(false);

  readonly template = inject(TemplateRef);
}

/**
 * SigTimeline - Signal-based timeline component
 * 
 * Usage:
 * <sig-timeline>
 *   <ng-template sigTimelineItem date="2024-01-15" title="Proje başladı" color="success">
 *     <p>Proje ekibi oluşturuldu ve ilk sprint planlandı.</p>
 *   </ng-template>
 *   
 *   <ng-template sigTimelineItem date="2024-02-01" title="MVP Tamamlandı" color="primary">
 *     <p>Minimum viable product başarıyla tamamlandı.</p>
 *   </ng-template>
 *   
 *   <ng-template sigTimelineItem date="2024-03-15" title="Lansman" [dotted]="true">
 *     <p>Ürün piyasaya sürüldü.</p>
 *   </ng-template>
 * </sig-timeline>
 */
@Component({
  selector: 'sig-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-timeline"
      [class.sig-timeline--horizontal]="orientation() === 'horizontal'"
      [class.sig-timeline--alternate]="mode() === 'alternate'"
      [class.sig-timeline--right]="mode() === 'right'"
    >
      @for (item of items(); track $index; let i = $index, last = $last) {
        <div 
          class="sig-timeline__item"
          [class.sig-timeline__item--left]="mode() === 'alternate' && i % 2 === 0"
          [class.sig-timeline__item--right]="mode() === 'alternate' && i % 2 === 1"
        >
          <!-- Dot -->
          <div 
            class="sig-timeline__dot"
            [class.sig-timeline__dot--primary]="item.color() === 'primary'"
            [class.sig-timeline__dot--success]="item.color() === 'success'"
            [class.sig-timeline__dot--warning]="item.color() === 'warning'"
            [class.sig-timeline__dot--danger]="item.color() === 'danger'"
          >
            @if (item.icon()) {
              <span class="sig-timeline__icon">{{ item.icon() }}</span>
            }
          </div>

          <!-- Line -->
          @if (!last) {
            <div 
              class="sig-timeline__line"
              [class.sig-timeline__line--dotted]="item.dotted()"
            ></div>
          }

          <!-- Content -->
          <div class="sig-timeline__content">
            @if (item.date()) {
              <div class="sig-timeline__date">{{ formatDate(item.date()) }}</div>
            }
            @if (item.title()) {
              <div class="sig-timeline__title">{{ item.title() }}</div>
            }
            <div class="sig-timeline__body">
              <ng-container [ngTemplateOutlet]="item.template"></ng-container>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-timeline {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .sig-timeline--horizontal {
      flex-direction: row;
      overflow-x: auto;
    }

    .sig-timeline__item {
      position: relative;
      display: flex;
      gap: 1rem;
      padding-bottom: 1.5rem;
    }

    .sig-timeline--horizontal .sig-timeline__item {
      flex-direction: column;
      padding-bottom: 0;
      padding-right: 2rem;
    }

    .sig-timeline--alternate .sig-timeline__item {
      width: 50%;
      margin-left: 50%;
    }

    .sig-timeline--alternate .sig-timeline__item--left {
      margin-left: 0;
      margin-right: 50%;
      flex-direction: row-reverse;
      text-align: right;
    }

    .sig-timeline--right .sig-timeline__item {
      flex-direction: row-reverse;
      text-align: right;
    }

    /* Dot */
    .sig-timeline__dot {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background-color: #e5e7eb;
      color: #6b7280;
      flex-shrink: 0;
      z-index: 1;
    }

    .sig-timeline__dot--primary {
      background-color: #dbeafe;
      color: #3b82f6;
    }

    .sig-timeline__dot--success {
      background-color: #d1fae5;
      color: #10b981;
    }

    .sig-timeline__dot--warning {
      background-color: #fef3c7;
      color: #f59e0b;
    }

    .sig-timeline__dot--danger {
      background-color: #fee2e2;
      color: #ef4444;
    }

    .sig-timeline__icon {
      font-size: 0.875rem;
    }

    /* Line */
    .sig-timeline__line {
      position: absolute;
      left: calc(1rem - 1px);
      top: 2rem;
      bottom: 0;
      width: 2px;
      background-color: #e5e7eb;
    }

    .sig-timeline--alternate .sig-timeline__line {
      left: auto;
      right: calc(-50% + 1rem - 1px);
    }

    .sig-timeline--alternate .sig-timeline__item--left .sig-timeline__line {
      left: auto;
      right: calc(1rem - 1px);
    }

    .sig-timeline--right .sig-timeline__line {
      left: auto;
      right: calc(1rem - 1px);
    }

    .sig-timeline--horizontal .sig-timeline__line {
      top: calc(1rem - 1px);
      left: 2rem;
      right: 0;
      bottom: auto;
      width: auto;
      height: 2px;
    }

    .sig-timeline__line--dotted {
      background: repeating-linear-gradient(
        to bottom,
        #e5e7eb,
        #e5e7eb 4px,
        transparent 4px,
        transparent 8px
      );
    }

    .sig-timeline--horizontal .sig-timeline__line--dotted {
      background: repeating-linear-gradient(
        to right,
        #e5e7eb,
        #e5e7eb 4px,
        transparent 4px,
        transparent 8px
      );
    }

    /* Content */
    .sig-timeline__content {
      flex: 1;
      padding-bottom: 0.5rem;
    }

    .sig-timeline__date {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .sig-timeline__title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .sig-timeline__body {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .sig-timeline__body p {
      margin: 0;
    }
  `],
})
export class SigTimelineComponent {
  readonly items = contentChildren(SigTimelineItemDirective);
  
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly mode = input<'left' | 'right' | 'alternate'>('left');

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }
}