import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigFileUploadComponent } from './file-upload.component';
import { By } from '@angular/platform-browser';

class MockDataTransfer {
    files: File[] = [];
    setData() {}
    getData() { return ''; }
}

global.DragEvent = class extends Event {
    dataTransfer = new MockDataTransfer();
    constructor(type: string, eventInitDict?: DragEventInit) {
        super(type, eventInitDict);
        if (eventInitDict?.dataTransfer) {
            // @ts-ignore
            this.dataTransfer = eventInitDict.dataTransfer;
        }
    }
} as any;

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();


describe('SigFileUploadComponent (Drag & Drop)', () => {
    let component: SigFileUploadComponent;
    let fixture: ComponentFixture<SigFileUploadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigFileUploadComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigFileUploadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should highlight dropzone on dragover', () => {
        const dropzone = fixture.debugElement.query(By.css('.sig-file-upload__dropzone'));

        // Mock DragEvent
        const dragEvent = new DragEvent('dragover', { cancelable: true });
        jest.spyOn(dragEvent, 'preventDefault'); // PreventDefault çağrılıyor mu?

        dropzone.triggerEventHandler('dragover', dragEvent);
        fixture.detectChanges();

        expect(component.isDragOver()).toBe(true);
        expect(dropzone.classes['sig-file-upload__dropzone--dragover']).toBe(true);
    });

    it('should handle file drop correctly', () => {
        const dropzone = fixture.debugElement.query(By.css('.sig-file-upload__dropzone'));

        // Mock File
        const file = new File(['content'], 'test.png', { type: 'image/png' });

        // Mock DataTransfer
        const mockDataTransfer = {
            files: [file]
        };

        const dropEvent = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            dataTransfer: mockDataTransfer
        };

        dropzone.triggerEventHandler('drop', dropEvent);
        fixture.detectChanges();

        expect(component.isDragOver()).toBe(false);
        expect(component.files().length).toBe(1);
        expect(component.files()[0].name).toBe('test.png');
    });

    it('should validate file size', () => {
        fixture.componentRef.setInput('maxSize', 100); // 100 Bytes limit

        // 200 Byte dosya oluştur
        const largeFile = new File([new Array(200).fill('a').join('')], 'large.txt');

        // processFiles metodu private ama drop handler üzerinden tetiklenir
        // Biz direkt processFiles'a erişemeyiz ama onFileSelected input üzerinden deneyebiliriz

        // Mock Input Change
        const inputEl = fixture.debugElement.query(By.css('input[type="file"]'));
        // Object.defineProperty ile files property'sini mockla
        const mockEvent = { target: { files: [largeFile], value: '' } };

        component.onFileSelected(mockEvent as any);
        fixture.detectChanges();

        expect(component.files().length).toBe(0); // Yüklenmemeli
        expect(component.error()).toContain('çok büyük');
    });

    it('should validate file type', () => {
        fixture.componentRef.setInput('accept', '.png, .jpg');

        const invalidFile = new File([''], 'doc.pdf', { type: 'application/pdf' });
        const mockEvent = { target: { files: [invalidFile], value: '' } };

        component.onFileSelected(mockEvent as any);
        fixture.detectChanges();

        expect(component.files().length).toBe(0);
        expect(component.error()).toContain('desteklenmeyen');
    });

    it('should remove file', () => {
        // Önce bir dosya ekle (Manuel state manipülasyonu ile test setup'ı hızlandıralım)
        const mockFile = {
            id: '1', name: 'del.txt', size: 10, type: 'text/plain',
            progress: 0, status: 'pending' as const, file: new File([], 'del.txt')
        };

        // Sinyali güncelle (Modern Angular testing trick)
        // Ancak component'in signal'i readonly değil, class içinde tanımlı.
        // Dışarıdan update edemeyebiliriz ama onDrop ile ekleyebiliriz.

        const dropEvent = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            dataTransfer: { files: [mockFile.file] }
        };
        component.onDrop(dropEvent as any);
        fixture.detectChanges();

        expect(component.files().length).toBe(1);

        // Silme butonuna tıkla
        const removeBtn = fixture.debugElement.query(By.css('.sig-file-upload__remove'));
        removeBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.files().length).toBe(0);
    });
});