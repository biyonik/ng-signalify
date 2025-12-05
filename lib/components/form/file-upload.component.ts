import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  preview?: string;
  error?: string;
}

/**
 * SigFileUpload - Signal-based file upload
 * 
 * Usage:
 * <sig-file-upload
 *   [accept]="'image/*'"
 *   [multiple]="true"
 *   [maxSize]="5 * 1024 * 1024"
 *   (filesSelected)="onFilesSelected($event)"
 * />
 */
@Component({
  selector: 'sig-file-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-file-upload">
      <!-- Drop Zone -->
      <div 
        class="sig-file-upload__dropzone"
        [class.sig-file-upload__dropzone--dragover]="isDragOver()"
        [class.sig-file-upload__dropzone--disabled]="disabled()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="openFileDialog()"
      >
        <input
          #fileInput
          type="file"
          [accept]="accept()"
          [multiple]="multiple()"
          [disabled]="disabled()"
          (change)="onFileSelected($event)"
          class="sig-file-upload__input"
        />

        <div class="sig-file-upload__content">
          <span class="sig-file-upload__icon">📁</span>
          <p class="sig-file-upload__text">
            <span class="sig-file-upload__link">Dosya seçin</span>
            veya sürükleyip bırakın
          </p>
          <p class="sig-file-upload__hint">
            @if (accept()) {
              {{ accept() }} •
            }
            Maks. {{ formatSize(maxSize()) }}
          </p>
        </div>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="sig-file-upload__error">
          {{ error() }}
        </div>
      }

      <!-- File List -->
      @if (files().length > 0) {
        <div class="sig-file-upload__list">
          @for (file of files(); track file.id) {
            <div 
              class="sig-file-upload__item"
              [class.sig-file-upload__item--error]="file.status === 'error'"
              [class.sig-file-upload__item--success]="file.status === 'success'"
            >
              <!-- Preview -->
              @if (file.preview) {
                <img [src]="file.preview" alt="" class="sig-file-upload__preview" />
              } @else {
                <span class="sig-file-upload__file-icon">📄</span>
              }

              <!-- Info -->
              <div class="sig-file-upload__info">
                <span class="sig-file-upload__name">{{ file.name }}</span>
                <span class="sig-file-upload__size">{{ formatSize(file.size) }}</span>
                
                @if (file.status === 'uploading') {
                  <div class="sig-file-upload__progress">
                    <div 
                      class="sig-file-upload__progress-bar"
                      [style.width.%]="file.progress"
                    ></div>
                  </div>
                }

                @if (file.error) {
                  <span class="sig-file-upload__item-error">{{ file.error }}</span>
                }
              </div>

              <!-- Status -->
              <div class="sig-file-upload__status">
                @switch (file.status) {
                  @case ('uploading') {
                    <span class="sig-file-upload__spinner"></span>
                  }
                  @case ('success') {
                    <span class="sig-file-upload__success">✓</span>
                  }
                  @case ('error') {
                    <span class="sig-file-upload__error-icon">✕</span>
                  }
                }
              </div>

              <!-- Remove -->
              <button
                type="button"
                class="sig-file-upload__remove"
                (click)="removeFile(file.id)"
                [disabled]="file.status === 'uploading'"
              >
                ✕
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-file-upload {
      width: 100%;
    }

    .sig-file-upload__dropzone {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border: 2px dashed #d1d5db;
      border-radius: 0.5rem;
      background-color: #f9fafb;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-file-upload__dropzone:hover {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .sig-file-upload__dropzone--dragover {
      border-color: #3b82f6;
      background-color: #dbeafe;
    }

    .sig-file-upload__dropzone--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-file-upload__input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
    }

    .sig-file-upload__content {
      text-align: center;
    }

    .sig-file-upload__icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .sig-file-upload__text {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .sig-file-upload__link {
      color: #3b82f6;
      font-weight: 500;
    }

    .sig-file-upload__hint {
      margin: 0.5rem 0 0;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .sig-file-upload__error {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background-color: #fef2f2;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: #ef4444;
    }

    .sig-file-upload__list {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sig-file-upload__item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background-color: #f9fafb;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    }

    .sig-file-upload__item--error {
      background-color: #fef2f2;
      border-color: #fecaca;
    }

    .sig-file-upload__item--success {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }

    .sig-file-upload__preview {
      width: 2.5rem;
      height: 2.5rem;
      object-fit: cover;
      border-radius: 0.25rem;
    }

    .sig-file-upload__file-icon {
      font-size: 1.5rem;
    }

    .sig-file-upload__info {
      flex: 1;
      min-width: 0;
    }

    .sig-file-upload__name {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sig-file-upload__size {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .sig-file-upload__progress {
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      margin-top: 0.25rem;
      overflow: hidden;
    }

    .sig-file-upload__progress-bar {
      height: 100%;
      background-color: #3b82f6;
      transition: width 0.3s;
    }

    .sig-file-upload__item-error {
      display: block;
      font-size: 0.75rem;
      color: #ef4444;
    }

    .sig-file-upload__status {
      flex-shrink: 0;
    }

    .sig-file-upload__spinner {
      display: block;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-file-upload__success {
      color: #10b981;
      font-weight: bold;
    }

    .sig-file-upload__error-icon {
      color: #ef4444;
      font-weight: bold;
    }

    .sig-file-upload__remove {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .sig-file-upload__remove:hover:not(:disabled) {
      background-color: #fee2e2;
      color: #ef4444;
    }

    .sig-file-upload__remove:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class SigFileUploadComponent {
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly accept = input<string>('');
  readonly multiple = input<boolean>(false);
  readonly maxSize = input<number>(10 * 1024 * 1024); // 10MB
  readonly maxFiles = input<number>(10);
  readonly disabled = input<boolean>(false);

  readonly filesSelected = output<UploadedFile[]>();
  readonly fileRemoved = output<string>();

  readonly files = signal<UploadedFile[]>([]);
  readonly isDragOver = signal(false);
  readonly error = signal<string | null>(null);

  openFileDialog(): void {
    if (!this.disabled()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (!this.disabled() && event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  removeFile(id: string): void {
    this.files.update((files) => files.filter((f) => f.id !== id));
    this.fileRemoved.emit(id);
  }

  private processFiles(fileList: File[]): void {
    this.error.set(null);
    const currentCount = this.files().length;
    const maxFiles = this.maxFiles();

    if (currentCount + fileList.length > maxFiles) {
      this.error.set(`Maksimum ${maxFiles} dosya yüklenebilir.`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of fileList) {
      // Size check
      if (file.size > this.maxSize()) {
        this.error.set(`"${file.name}" dosyası çok büyük. Maks: ${this.formatSize(this.maxSize())}`);
        continue;
      }

      // Type check
      const accept = this.accept();
      if (accept && !this.isFileTypeAccepted(file, accept)) {
        this.error.set(`"${file.name}" desteklenmeyen dosya türü.`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        file,
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'pending',
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      this.files.update((files) => [...files, ...newFiles]);
      this.filesSelected.emit(newFiles);
    }
  }

  private isFileTypeAccepted(file: File, accept: string): boolean {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    
    return acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Public API
  updateFileProgress(id: string, progress: number): void {
    this.files.update((files) =>
      files.map((f) =>
        f.id === id ? { ...f, progress, status: 'uploading' as const } : f
      )
    );
  }

  setFileStatus(id: string, status: 'success' | 'error', error?: string): void {
    this.files.update((files) =>
      files.map((f) =>
        f.id === id ? { ...f, status, error, progress: status === 'success' ? 100 : f.progress } : f
      )
    );
  }

  clearFiles(): void {
    this.files().forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    this.files.set([]);
  }
}