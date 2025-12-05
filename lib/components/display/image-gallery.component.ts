import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  HostListener,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GalleryImage {
  src: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
}

/**
 * SigImageGallery - Signal-based image gallery with lightbox
 * 
 * Usage:
 * <sig-image-gallery
 *   [images]="images"
 *   [columns]="4"
 *   [gap]="8"
 *   [showThumbnails]="true"
 * />
 */
@Component({
  selector: 'sig-image-gallery',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Grid -->
    <div 
      class="sig-gallery__grid"
      [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'"
      [style.gap.px]="gap()"
    >
      @for (image of images(); track image.src; let i = $index) {
        <div 
          class="sig-gallery__item"
          [class.sig-gallery__item--selected]="selectedIndex() === i"
          (click)="openLightbox(i)"
        >
          <img 
            [src]="image.thumbnail || image.src" 
            [alt]="image.alt || ''"
            loading="lazy"
          />
          @if (image.title) {
            <div class="sig-gallery__item-overlay">
              <span class="sig-gallery__item-title">{{ image.title }}</span>
            </div>
          }
        </div>
      }
    </div>

    <!-- Lightbox -->
    @if (isLightboxOpen()) {
      <div class="sig-gallery__lightbox" (click)="closeLightbox()">
        <div class="sig-gallery__lightbox-content" (click)="$event.stopPropagation()">
          <!-- Close -->
          <button
            type="button"
            class="sig-gallery__close"
            (click)="closeLightbox()"
          >
            ✕
          </button>

          <!-- Navigation -->
          <button
            type="button"
            class="sig-gallery__nav sig-gallery__nav--prev"
            [disabled]="!canGoPrev()"
            (click)="prev()"
          >
            ◀
          </button>
          <button
            type="button"
            class="sig-gallery__nav sig-gallery__nav--next"
            [disabled]="!canGoNext()"
            (click)="next()"
          >
            ▶
          </button>

          <!-- Image -->
          <div class="sig-gallery__image-container">
            <img 
              [src]="currentImage()?.src" 
              [alt]="currentImage()?.alt || ''"
              class="sig-gallery__image"
            />

            @if (loading()) {
              <div class="sig-gallery__loader">
                <div class="sig-gallery__spinner"></div>
              </div>
            }
          </div>

          <!-- Info -->
          @if (currentImage()?.title || currentImage()?.description) {
            <div class="sig-gallery__info">
              @if (currentImage()?.title) {
                <h3 class="sig-gallery__title">{{ currentImage()?.title }}</h3>
              }
              @if (currentImage()?.description) {
                <p class="sig-gallery__description">{{ currentImage()?.description }}</p>
              }
            </div>
          }

          <!-- Thumbnails -->
          @if (showThumbnails() && images().length > 1) {
            <div class="sig-gallery__thumbnails">
              @for (image of images(); track image.src; let i = $index) {
                <button
                  type="button"
                  class="sig-gallery__thumbnail"
                  [class.sig-gallery__thumbnail--active]="selectedIndex() === i"
                  (click)="goTo(i)"
                >
                  <img [src]="image.thumbnail || image.src" [alt]="image.alt || ''" />
                </button>
              }
            </div>
          }

          <!-- Counter -->
          <div class="sig-gallery__counter">
            {{ selectedIndex() + 1 }} / {{ images().length }}
          </div>
        </div>
      </div>
    }
  `,
  })
export class SigImageGalleryComponent {
  readonly images = input.required<GalleryImage[]>();
  readonly columns = input<number>(4);
  readonly gap = input<number>(8);
  readonly showThumbnails = input<boolean>(true);
  readonly loop = input<boolean>(false);

  readonly imageClick = output<{ image: GalleryImage; index: number }>();
  readonly lightboxOpen = output<number>();
  readonly lightboxClose = output<void>();

  readonly selectedIndex = signal(-1);
  readonly isLightboxOpen = signal(false);
  readonly loading = signal(false);

  readonly currentImage = computed(() => {
    const index = this.selectedIndex();
    if (index < 0) return null;
    return this.images()[index];
  });

  readonly canGoPrev = computed(() => {
    return this.loop() || this.selectedIndex() > 0;
  });

  readonly canGoNext = computed(() => {
    return this.loop() || this.selectedIndex() < this.images().length - 1;
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isLightboxOpen()) {
      this.closeLightbox();
    }
  }

  @HostListener('document:keydown.arrowLeft')
  onArrowLeft(): void {
    if (this.isLightboxOpen() && this.canGoPrev()) {
      this.prev();
    }
  }

  @HostListener('document:keydown.arrowRight')
  onArrowRight(): void {
    if (this.isLightboxOpen() && this.canGoNext()) {
      this.next();
    }
  }

  openLightbox(index: number): void {
    this.selectedIndex.set(index);
    this.isLightboxOpen.set(true);
    this.lightboxOpen.emit(index);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
    this.lightboxClose.emit();
    document.body.style.overflow = '';
  }

  goTo(index: number): void {
    this.selectedIndex.set(index);
  }

  prev(): void {
    const current = this.selectedIndex();
    if (current > 0) {
      this.selectedIndex.set(current - 1);
    } else if (this.loop()) {
      this.selectedIndex.set(this.images().length - 1);
    }
  }

  next(): void {
    const current = this.selectedIndex();
    if (current < this.images().length - 1) {
      this.selectedIndex.set(current + 1);
    } else if (this.loop()) {
      this.selectedIndex.set(0);
    }
  }
}