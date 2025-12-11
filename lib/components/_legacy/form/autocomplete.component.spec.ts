import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SigAutocompleteComponent, AutocompleteOption } from './autocomplete.component';
import { By } from '@angular/platform-browser';

describe('SigAutocompleteComponent', () => {
    let component: SigAutocompleteComponent;
    let fixture: ComponentFixture<SigAutocompleteComponent>;

    const mockOptions: AutocompleteOption[] = [
        { value: 1, label: 'Apple' },
        { value: 2, label: 'Banana' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigAutocompleteComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigAutocompleteComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('options', mockOptions);
        fixture.detectChanges();
    });

    it('should filter options based on input', fakeAsync(() => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        // Yazmaya başla
        inputEl.value = 'App';
        inputEl.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        tick(300); // Debounce

        expect(component.isOpen()).toBe(true);

        // filteredOptions computed signalini kontrol et
        const filtered = component.filteredOptions();
        expect(filtered.length).toBe(1);
        expect(filtered[0].label).toBe('Apple');
    }));

    it('should select option via click', () => {
        // Listeyi açmak için searchText set edelim veya focuslayalım
        component.onFocus();
        fixture.detectChanges();

        const options = fixture.debugElement.queryAll(By.css('.sig-autocomplete__option'));
        options[1].nativeElement.click(); // Banana
        fixture.detectChanges();

        expect(component.value()).toBe(2);
        expect(component.searchText()).toBe('Banana'); // Input text güncellenmeli
        expect(component.isOpen()).toBe(false);
    });

    it('should handle writeValue correctly', () => {
        // CVA implementasyonu var
        component.writeValue(1);
        fixture.detectChanges();

        expect(component.value()).toBe(1);
        expect(component.searchText()).toBe('Apple'); // ID'den Label'ı bulup inputa yazmalı
    });
});