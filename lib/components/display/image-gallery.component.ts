import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  HostListener,
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
  styles: [`
    .sig-gallery__grid {
      display: grid;
    }

    .sig-gallery__item {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .sig-gallery__item:hover {
      transform: scale(1.02);
    }

    .sig-gallery__item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sig-gallery__item-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      padding: 0.5rem;
      background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .sig-gallery__item:hover .sig-gallery__item-overlay {
      opacity: 1;
    }

    .sig-gallery__item-title {
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Lightbox */
    .sig-gallery__lightbox {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.9);
      animation: lightbox-fade 0.2s ease-out;
    }

    @keyframes lightbox-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sig-gallery__lightbox-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 90vw;
      max-height: 90vh;
    }

    .sig-gallery__close {
      position: absolute;
      top: -3rem;
      right: 0;
      padding: 0.5rem;
      border: none;
      background: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 10;
    }

    .sig-gallery__nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      padding: 1rem;
      border: none;
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 10;
      border-radius: 50%;
      transition: background-color 0.15s;
    }

    .sig-gallery__nav:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .sig-gallery__nav:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .sig-gallery__nav--prev {
      left: -4rem;
    }

    .sig-gallery__nav--next {
      right: -4rem;
    }

    .sig-gallery__image-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sig-gallery__image {
      max-width: 80vw;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 0.5rem;
    }

    .sig-gallery__loader {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .sig-gallery__spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-gallery__info {
      margin-top: 1rem;
      text-align: center;
      color: white;
    }

    .sig-gallery__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .sig-gallery__description {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .sig-gallery__thumbnails {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      overflow-x: auto;
      max-width: 100%;
      padding: 0.5rem;
    }

    .sig-gallery__thumbnail {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      padding: 0;
      border: 2px solid transparent;
      border-radius: 0.25rem;
      overflow: hidden;
      cursor: pointer;
      opacity: 0.6;
      transition: all 0.15s;
    }

    .sig-gallery__thumbnail:hover {
      opacity: 1;
    }

    .sig-gallery__thumbnail--active {
      border-color: white;
      opacity: 1;
    }

    .sig-gallery__thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sig-gallery__counter {
      margin-top: 1rem;
      color: white;
      font-size: 0.875rem;
      opacity: 0.7;
    }
  `],
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