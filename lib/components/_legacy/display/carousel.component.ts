import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  OnDestroy,
  contentChildren,
  Directive,
  TemplateRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[sigCarouselSlide]',
  standalone: true,
})
export class SigCarouselSlideDirective {
  readonly template = inject(TemplateRef);
}

/**
 * SigCarousel - Signal-based carousel/slider component
 * 
 * Usage:
 * <sig-carousel [autoplay]="true" [interval]="5000">
 *   <ng-template sigCarouselSlide>
 *     <img src="slide1.jpg" />
 *   </ng-template>
 *   <ng-template sigCarouselSlide>
 *     <img src="slide2.jpg" />
 *   </ng-template>
 * </sig-carousel>
 */
@Component({
  selector: 'sig-carousel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div 
      class="sig-carousel"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Slides -->
      <div 
        class="sig-carousel__track"
        [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
        [style.transition]="isTransitioning() ? 'transform 0.3s ease-out' : 'none'"
      >
        @for (slide of slides(); track $index) {
          <div class="sig-carousel__slide">
            <ng-container [ngTemplateOutlet]="slide.template"></ng-container>
          </div>
        }
      </div>

      <!-- Navigation Arrows -->
      @if (showArrows() && slides().length > 1) {
        <button
          type="button"
          class="sig-carousel__arrow sig-carousel__arrow--prev"
          [disabled]="!loop() && currentIndex() === 0"
          (click)="prev()"
        >
          ◀
        </button>
        <button
          type="button"
          class="sig-carousel__arrow sig-carousel__arrow--next"
          [disabled]="!loop() && currentIndex() === slides().length - 1"
          (click)="next()"
        >
          ▶
        </button>
      }

      <!-- Dots -->
      @if (showDots() && slides().length > 1) {
        <div class="sig-carousel__dots">
          @for (slide of slides(); track $index; let i = $index) {
            <button
              type="button"
              class="sig-carousel__dot"
              [class.sig-carousel__dot--active]="currentIndex() === i"
              (click)="goTo(i)"
            ></button>
          }
        </div>
      }

      <!-- Progress Bar -->
      @if (showProgress() && autoplay()) {
        <div class="sig-carousel__progress">
          <div 
            class="sig-carousel__progress-bar"
            [style.width.%]="progress()"
          ></div>
        </div>
      }

      <!-- Counter -->
      @if (showCounter()) {
        <div class="sig-carousel__counter">
          {{ currentIndex() + 1 }} / {{ slides().length }}
        </div>
      }
    </div>
  `,
  })
export class SigCarouselComponent implements OnDestroy {
  readonly slides = contentChildren(SigCarouselSlideDirective);

  readonly autoplay = input<boolean>(false);
  readonly interval = input<number>(5000);
  readonly loop = input<boolean>(true);
  readonly pauseOnHover = input<boolean>(true);
  readonly showArrows = input<boolean>(true);
  readonly showDots = input<boolean>(true);
  readonly showProgress = input<boolean>(false);
  readonly showCounter = input<boolean>(false);

  readonly slideChange = output<number>();

  readonly currentIndex = signal(0);
  readonly isTransitioning = signal(true);
  readonly isPaused = signal(false);
  readonly progress = signal(0);

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.autoplay() && !this.isPaused()) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    
    const intervalMs = this.interval();
    const progressStep = 100 / (intervalMs / 100);

    this.progress.set(0);
    
    this.progressTimer = setInterval(() => {
      this.progress.update((p) => Math.min(p + progressStep, 100));
    }, 100);

    this.autoplayTimer = setInterval(() => {
      this.next();
      this.progress.set(0);
    }, intervalMs);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  onMouseEnter(): void {
    if (this.pauseOnHover()) {
      this.isPaused.set(true);
    }
  }

  onMouseLeave(): void {
    if (this.pauseOnHover()) {
      this.isPaused.set(false);
    }
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.slideChange.emit(index);
    this.progress.set(0);
  }

  prev(): void {
    const current = this.currentIndex();
    const total = this.slides().length;

    if (current > 0) {
      this.goTo(current - 1);
    } else if (this.loop()) {
      this.goTo(total - 1);
    }
  }

  next(): void {
    const current = this.currentIndex();
    const total = this.slides().length;

    if (current < total - 1) {
      this.goTo(current + 1);
    } else if (this.loop()) {
      this.goTo(0);
    }
  }

  // Public API
  pause(): void {
    this.isPaused.set(true);
  }

  resume(): void {
    this.isPaused.set(false);
  }
}