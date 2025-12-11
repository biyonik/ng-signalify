import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  contentChildren,
  TemplateRef,
  inject,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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