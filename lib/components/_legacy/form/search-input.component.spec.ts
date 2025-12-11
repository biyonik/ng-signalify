import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SigSearchInputComponent } from './search-input.component';
import { By } from '@angular/platform-browser';

describe('SigSearchInputComponent', () => {
    let component: SigSearchInputComponent;
    let fixture: ComponentFixture<SigSearchInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigSearchInputComponent]
        }).compileComponents();
    });

    // Create component inside fakeAsync to sync zones
    const createComponent = () => {
        fixture = TestBed.createComponent(SigSearchInputComponent);
        component = fixture.componentInstance;
    };

    it('should emit value with debounce', fakeAsync(() => {
        createComponent();
        fixture.componentRef.setInput('debounce', 500);
        fixture.detectChanges();

        // Signal Output'u dinlemek için subscribe (outputToObservable veya direk subscribe)
        const searchSpy = jest.fn();
        component.search.subscribe(searchSpy);

        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        // Type "AB"
        inputEl.value = 'AB';
        inputEl.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        tick(200); // Wait less than debounce
        expect(searchSpy).not.toHaveBeenCalled();

        tick(500); // Wait debounce completion
        expect(searchSpy).toHaveBeenCalledWith('AB');
    }));

    it('should clear input', () => {
        // Sync test is fine here
        fixture = TestBed.createComponent(SigSearchInputComponent);
        component = fixture.componentInstance;
        component.value.set('Test');
        fixture.detectChanges();

        const clearBtn = fixture.debugElement.query(By.css('.sig-search__clear'));
        clearBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toBe('');
    });
});