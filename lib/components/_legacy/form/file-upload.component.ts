import {
    Component,
    ChangeDetectionStrategy,
    signal,
    computed,
    input,
    output,
    ElementRef,
    viewChild,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId, announce } from '../../utils/a11y.utils';

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
 * SigFileUpload - Signal-based accessible file upload
 */
@Component({
    selector: 'sig-file-upload',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        <div
                class="sig-file-upload"
                [attr.aria-describedby]="instructionsId"
        >
            <!-- Drop Zone -->
            <div
                    class="sig-file-upload__dropzone"
                    [class.sig-file-upload__dropzone--dragover]="isDragOver()"
                    [class.sig-file-upload__dropzone--disabled]="disabled()"
                    role="button"
                    [tabindex]="disabled() ? -1 : 0"
                    [attr.aria-label]="getDropzoneLabel()"
                    [attr.aria-disabled]="disabled()"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    (click)="openFileDialog()"
                    (keydown.enter)="openFileDialog()"
                    (keydown.space)="openFileDialog(); $event.preventDefault()"
            >
                <input
                        #fileInput
                        type="file"
                        [id]="inputId"
                        [accept]="accept()"
                        [multiple]="multiple()"
                        [disabled]="disabled()"
                        [attr.aria-describedby]="instructionsId"
                        (change)="onFileSelected($event)"
                        class="sig-file-upload__input"
                />

                <div class="sig-file-upload__content">
                    <span class="sig-file-upload__icon" aria-hidden="true">📁</span>
                    <p class="sig-file-upload__text">
                        <span class="sig-file-upload__link">Dosya seçin</span>
                        veya sürükleyip bırakın
                    </p>
                    <p [id]="instructionsId" class="sig-file-upload__hint">
                        @if (accept()) {
                            Kabul edilen formatlar: {{ accept() }} •
                        }
                        Maks. dosya boyutu: {{ formatSize(maxSize()) }}
                        @if (multiple()) {
                            • Maks. {{ maxFiles() }} dosya
                        }
                    </p>
                </div>
            </div>

            <!-- Error -->
            @if (error()) {
                <div
                        class="sig-file-upload__error"
                        role="alert"
                        aria-live="assertive"
                >
                    {{ error() }}
                </div>
            }

            <!-- File List -->
            @if (files().length > 0) {
                <div
                        class="sig-file-upload__list"
                        role="list"
                        [attr.aria-label]="'Yüklenen dosyalar: ' + files().length + ' dosya'"
                >
                    @for (file of files(); track file.id) {
                        <div
                                class="sig-file-upload__item"
                                [class.sig-file-upload__item--error]="file.status === 'error'"
                                [class.sig-file-upload__item--success]="file.status === 'success'"
                                role="listitem"
                        >
                            <!-- Preview -->
                            @if (file.preview) {
                                <img
                                        [src]="file.preview"
                                        [alt]="file.name + ' önizleme'"
                                        class="sig-file-upload__preview"
                                />
                            } @else {
                                <span class="sig-file-upload__file-icon" aria-hidden="true">📄</span>
                            }

                            <!-- Info -->
                            <div class="sig-file-upload__info">
                                <span class="sig-file-upload__name">{{ file.name }}</span>
                                <span class="sig-file-upload__size">{{ formatSize(file.size) }}</span>

                                @if (file.status === 'uploading') {
                                    <div
                                            class="sig-file-upload__progress"
                                            role="progressbar"
                                            [attr.aria-valuenow]="file.progress"
                                            [attr.aria-valuemin]="0"
                                            [attr.aria-valuemax]="100"
                                            [attr.aria-label]="file.name + ' yükleniyor'"
                                    >
                                        <div
                                                class="sig-file-upload__progress-bar"
                                                [style.width.%]="file.progress"
                                        ></div>
                                    </div>
                                    <span class="sig-visually-hidden">
                    {{ file.progress }}% yüklendi
                  </span>
                                }

                                @if (file.error) {
                                    <span class="sig-file-upload__item-error" role="alert">
                    {{ file.error }}
                  </span>
                                }
                            </div>

                            <!-- Status -->
                            <div class="sig-file-upload__status" aria-hidden="true">
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

                            <!-- Status for screen readers -->
                            <span class="sig-visually-hidden">
                @switch (file.status) {
                    @case ('pending') { Bekliyor }
                    @case ('uploading') { Yükleniyor }
                    @case ('success') { Yüklendi }
                    @case ('error') { Hata }
                }
              </span>

                            <!-- Remove -->
                            <button
                                    type="button"
                                    class="sig-file-upload__remove"
                                    (click)="removeFile(file.id)"
                                    [disabled]="file.status === 'uploading'"
                                    [attr.aria-label]="'Kaldır: ' + file.name"
                            >
                                <span aria-hidden="true">✕</span>
                            </button>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
    .sig-visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class SigFileUploadComponent implements OnInit {
    readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    readonly accept = input<string>('');
    readonly multiple = input<boolean>(false);
    readonly maxSize = input<number>(10 * 1024 * 1024);
    readonly maxFiles = input<number>(10);
    readonly disabled = input<boolean>(false);

    readonly filesSelected = output<UploadedFile[]>();
    readonly fileRemoved = output<string>();

    readonly files = signal<UploadedFile[]>([]);
    readonly isDragOver = signal(false);
    readonly error = signal<string | null>(null);

    // IDs
    inputId = '';
    instructionsId = '';

    ngOnInit(): void {
        this.inputId = generateId('sig-file-input');
        this.instructionsId = generateId('sig-file-instructions');
    }

    getDropzoneLabel(): string {
        if (this.disabled()) {
            return 'Dosya yükleme devre dışı';
        }
        return 'Dosya yüklemek için tıklayın veya dosyaları buraya sürükleyin';
    }

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
        const file = this.files().find(f => f.id === id);
        this.files.update((files) => files.filter((f) => f.id !== id));
        this.fileRemoved.emit(id);

        if (file) {
            announce(`${file.name} kaldırıldı`, 'polite');
        }
    }

    private processFiles(fileList: File[]): void {
        this.error.set(null);
        const currentCount = this.files().length;
        const maxFiles = this.maxFiles();

        if (currentCount + fileList.length > maxFiles) {
            const msg = `Maksimum ${maxFiles} dosya yüklenebilir.`;
            this.error.set(msg);
            announce(msg, 'assertive');
            return;
        }

        const newFiles: UploadedFile[] = [];

        for (const file of fileList) {
            if (file.size > this.maxSize()) {
                const msg = `"${file.name}" dosyası çok büyük. Maks: ${this.formatSize(this.maxSize())}`;
                this.error.set(msg);
                announce(msg, 'assertive');
                continue;
            }

            const accept = this.accept();
            if (accept && !this.isFileTypeAccepted(file, accept)) {
                const msg = `"${file.name}" desteklenmeyen dosya türü.`;
                this.error.set(msg);
                announce(msg, 'assertive');
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

            if (file.type.startsWith('image/')) {
                uploadedFile.preview = URL.createObjectURL(file);
            }

            newFiles.push(uploadedFile);
        }

        if (newFiles.length > 0) {
            this.files.update((files) => [...files, ...newFiles]);
            this.filesSelected.emit(newFiles);
            announce(`${newFiles.length} dosya eklendi`, 'polite');
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

        const file = this.files().find(f => f.id === id);
        if (file) {
            if (status === 'success') {
                announce(`${file.name} başarıyla yüklendi`, 'polite');
            } else {
                announce(`${file.name} yüklenirken hata oluştu`, 'assertive');
            }
        }
    }

    clearFiles(): void {
        this.files().forEach((f) => {
            if (f.preview) URL.revokeObjectURL(f.preview);
        });
        this.files.set([]);
        announce('Tüm dosyalar temizlendi', 'polite');
    }
}
