import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigTagsInputComponent } from './tags-input.component';
import { By } from '@angular/platform-browser';

describe('SigTagsInputComponent', () => {
    let component: SigTagsInputComponent;
    let fixture: ComponentFixture<SigTagsInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigTagsInputComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigTagsInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should add tag on Enter', () => {
        const inputEl = fixture.debugElement.query(By.css('input'));
        const inputNative = inputEl.nativeElement;

        // Input değerini yaz ve sinyale işlet (onInput)
        inputNative.value = 'Angular';
        inputNative.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        // Enter tuşuna bas
        inputEl.triggerEventHandler('keydown', { key: 'Enter', target: inputNative, preventDefault: () => {} });
        fixture.detectChanges();

        // Düzeltme: component.tags() yerine component.value()
        expect(component.value().length).toBe(1);
        expect(component.value()[0]).toBe('Angular');
        expect(component.inputValue()).toBe(''); // Input temizlenmeli
    });

    it('should NOT add duplicate tags if not allowed', () => {
        // Başlangıç değeri
        component.value.set(['Angular']);
        fixture.componentRef.setInput('allowDuplicates', false);
        fixture.detectChanges();

        const inputEl = fixture.debugElement.query(By.css('input'));
        const inputNative = inputEl.nativeElement;

        inputNative.value = 'Angular';
        inputNative.dispatchEvent(new Event('input'));

        inputEl.triggerEventHandler('keydown', { key: 'Enter', target: inputNative, preventDefault: () => {} });
        fixture.detectChanges();

        expect(component.value().length).toBe(1); // Hala 1, eklenmedi
        expect(component.error()).toBe('Bu etiket zaten ekli');
    });

    it('should remove tag on click remove button', () => {
        component.value.set(['A', 'B']);
        fixture.detectChanges();

        const tags = fixture.debugElement.queryAll(By.css('.sig-tags-input__tag')); // CSS class güncellendi
        const removeBtn = tags[0].query(By.css('.sig-tags-input__tag-remove'));

        removeBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toEqual(['B']);
    });

    it('should support ControlValueAccessor (writeValue)', () => {
        // Bu bileşen CVA implemente ettiği için writeValue var.
        component.writeValue(['Test', 'Data']);
        fixture.detectChanges();

        expect(component.value()).toEqual(['Test', 'Data']);

        // UI Kontrolü
        const tagElements = fixture.debugElement.queryAll(By.css('.sig-tags-input__tag-text'));
        expect(tagElements.length).toBe(2);
        expect(tagElements[0].nativeElement.textContent).toContain('Test');
    });
});