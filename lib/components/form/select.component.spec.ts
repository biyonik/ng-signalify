import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigSelectComponent, SelectOption } from './select.component';
import { By } from '@angular/platform-browser';

describe('SigSelectComponent (Dropdown Power)', () => {
    let component: SigSelectComponent;
    let fixture: ComponentFixture<SigSelectComponent>;

    // Test Verileri
    const options: SelectOption[] = [
        { id: '1', label: 'Option 1' },
        { id: '2', label: 'Option 2' },
        { id: '3', label: 'Disabled Option', disabled: true },
        { id: '4', label: 'Banana' },
        { id: '5', label: 'Apple' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigSelectComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigSelectComponent);
        component = fixture.componentInstance;

        // Input sinyallerini ayarla (Angular 17+ setInput)
        fixture.componentRef.setInput('options', options);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display placeholder when no value is selected', () => {
        fixture.componentRef.setInput('placeholder', 'Lütfen Seçiniz');
        fixture.detectChanges();

        const valueEl = fixture.debugElement.query(By.css('.sig-select__value')).nativeElement;
        expect(valueEl.textContent).toContain('Lütfen Seçiniz');
    });

    it('should toggle dropdown on trigger click', () => {
        const trigger = fixture.debugElement.query(By.css('.sig-select__trigger'));

        // 1. Aç
        trigger.nativeElement.click();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(true);
        expect(fixture.debugElement.query(By.css('.sig-select__dropdown'))).toBeTruthy();

        // 2. Kapat
        trigger.nativeElement.click();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(false);
        expect(fixture.debugElement.query(By.css('.sig-select__dropdown'))).toBeFalsy();
    });

    it('should select an option and close dropdown', () => {
        // Dropdown'ı aç
        component.toggle();
        fixture.detectChanges();

        const optionButtons = fixture.debugElement.queryAll(By.css('.sig-select__option'));
        const secondOption = optionButtons[1]; // Option 2

        // Tıkla
        secondOption.nativeElement.click();
        fixture.detectChanges();

        // Kontroller
        expect(component.value()).toBe('2'); // Model güncellendi mi?
        expect(component.isOpen()).toBe(false); // Kapandı mı?

        // UI'da seçili label görünüyor mu?
        const valueEl = fixture.debugElement.query(By.css('.sig-select__value')).nativeElement;
        expect(valueEl.textContent).toContain('Option 2');
    });

    it('should NOT select disabled options', () => {
        component.toggle();
        fixture.detectChanges();

        const disabledOption = fixture.debugElement.queryAll(By.css('.sig-select__option'))[2];

        disabledOption.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toBeNull();
        expect(component.isOpen()).toBe(true); // Kapanmamalı
    });

    it('should filter options when searchable is true', () => {
        fixture.componentRef.setInput('searchable', true);
        component.toggle();
        fixture.detectChanges();

        // Arama inputunu bul ve yaz
        const searchInput = fixture.debugElement.query(By.css('.sig-select__search-input'));
        searchInput.nativeElement.value = 'Ban';
        searchInput.nativeElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        // Filtrelenmiş sonuçları kontrol et
        const visibleOptions = fixture.debugElement.queryAll(By.css('.sig-select__option'));
        expect(visibleOptions.length).toBe(1);
        expect(visibleOptions[0].nativeElement.textContent).toContain('Banana');
    });

    it('should show "No Results" message when search yields nothing', () => {
        fixture.componentRef.setInput('searchable', true);
        fixture.componentRef.setInput('emptyText', 'Yok Böyle Bir Şey');
        component.toggle();
        fixture.detectChanges();

        const searchInput = fixture.debugElement.query(By.css('.sig-select__search-input'));
        searchInput.nativeElement.value = 'XYZ123';
        searchInput.nativeElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        const emptyMsg = fixture.debugElement.query(By.css('.sig-select__empty'));
        expect(emptyMsg.nativeElement.textContent).toContain('Yok Böyle Bir Şey');
    });

    it('should clear selection when clear button is clicked', () => {
        fixture.componentRef.setInput('clearable', true);
        component.writeValue('1'); // Başlangıç değeri ata
        component.toggle();
        fixture.detectChanges();

        const clearBtn = fixture.debugElement.query(By.css('.sig-select__option--clear'));
        expect(clearBtn).toBeTruthy();

        clearBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toBeNull();
    });

    it('should close when clicking outside (Document Click)', () => {
        component.toggle();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(true);

        // Dışarıya (Document body) tıkla
        document.body.click();
        fixture.detectChanges();

        expect(component.isOpen()).toBe(false);
    });

    it('should handle Keyboard navigation (Enter/Escape)', () => {
        const trigger = fixture.debugElement.query(By.css('.sig-select__trigger'));

        // Enter ile aç
        trigger.triggerEventHandler('keydown', { key: 'Enter', preventDefault: () => {} });
        fixture.detectChanges();
        expect(component.isOpen()).toBe(true);

        // Escape ile kapat
        trigger.triggerEventHandler('keydown', { key: 'Escape' });
        fixture.detectChanges();
        expect(component.isOpen()).toBe(false);
    });
});