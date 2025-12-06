import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {SigOtpInputComponent} from './otp-input.component';
import {By} from '@angular/platform-browser';

// --- JSDOM MOCKS ---
class MockDataTransfer {
    getData(format?: string): string {
        return '123456';
    } // Mock data for paste
    setData(format?: string, data?: string): void {
    }

    clearData(format?: string): void {
    }

    dropEffect: 'none' | 'copy' | 'link' | 'move' = 'none';
    effectAllowed: DataTransfer['effectAllowed'] = 'all';
    files: FileList = {} as FileList;
    items: DataTransferItemList = {} as DataTransferItemList;
    types: string[] = [];

    setDragImage(image?: Element, x?: number, y?: number): void {
    }
}

Object.defineProperty(global, 'DataTransfer', {value: MockDataTransfer});
Object.defineProperty(global, 'ClipboardEvent', {
    value: class extends Event {
        clipboardData = new MockDataTransfer();

        constructor(type: string, options?: any) {
            super(type, options);
            if (options?.clipboardData) this.clipboardData = options.clipboardData;
        }
    }
});
// -------------------

describe('SigOtpInputComponent (Focus Magic)', () => {
    let component: SigOtpInputComponent;
    let fixture: ComponentFixture<SigOtpInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigOtpInputComponent]
        }).compileComponents();
        // Component oluşturmayı burdan kaldırdık, testlerin içine taşıdık!
    });

    // Helper function to create component inside fakeAsync
    const createComponent = () => {
        fixture = TestBed.createComponent(SigOtpInputComponent);
        component = fixture.componentInstance;
    };

    it('should initialize inputs', fakeAsync(() => {
        createComponent();
        fixture.componentRef.setInput('length', 4);
        fixture.detectChanges(); // ngOnInit

        tick(); // Constructor içindeki setTimeout'u tüket
        fixture.detectChanges(); // ViewChildren güncellemesi

        const inputs = fixture.debugElement.queryAll(By.css('.sig-otp__input'));
        expect(inputs.length).toBe(4);
    }));

    it('should focus next input on entry', fakeAsync(() => {
        createComponent();
        fixture.componentRef.setInput('length', 4);
        fixture.detectChanges();
        tick(); // Init wait
        fixture.detectChanges();

        const inputs = fixture.debugElement.queryAll(By.css('.sig-otp__input'));
        const firstInput = inputs[0].nativeElement;
        const secondInput = inputs[1].nativeElement;

        jest.spyOn(secondInput, 'focus');

        firstInput.value = '5';
        firstInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        tick(); // focusInput içindeki setTimeout

        expect(component.digits()[0]).toBe('5');
        expect(secondInput.focus).toHaveBeenCalled();
    }));

    it('should handle Paste event', fakeAsync(() => {
        createComponent();
        fixture.componentRef.setInput('length', 6);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const inputs = fixture.debugElement.queryAll(By.css('.sig-otp__input'));
        const firstInput = inputs[0].nativeElement;

        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: new MockDataTransfer(),
            bubbles: true
        });

        firstInput.dispatchEvent(pasteEvent);
        fixture.detectChanges();
        tick();

        expect(component.value()).toBe('123456');
    }));

    it('should emit completed event', fakeAsync(() => {
        createComponent();
        fixture.componentRef.setInput('length', 3);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const spy = jest.spyOn(component.completed, 'emit');

        // İlk iki haneyi doldur
        component.digits.set(['1', '2', '']);
        fixture.detectChanges();

        const inputs = fixture.debugElement.queryAll(By.css('.sig-otp__input'));
        const lastInput = inputs[2].nativeElement;

        lastInput.value = '3';
        lastInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        tick();

        expect(spy).toHaveBeenCalledWith('123');
    }));
});