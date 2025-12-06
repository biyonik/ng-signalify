import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigDateRangePickerComponent } from './date-range-picker.component';
import { By } from '@angular/platform-browser';

describe('SigDateRangePickerComponent', () => {
    let component: SigDateRangePickerComponent;
    let fixture: ComponentFixture<SigDateRangePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigDateRangePickerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigDateRangePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should select start and end dates', () => {
        component.toggle();
        fixture.detectChanges();

        const days = fixture.debugElement.queryAll(By.css('.sig-date-range__day:not(.sig-date-range__day--disabled)'));

        // 1. Start Date Seç
        days[5].nativeElement.click();
        fixture.detectChanges();

        // Temp değerleri kontrol et (Value henüz null olmalı)
        expect(component.tempStart()).toBeTruthy();
        expect(component.value()).toBeNull();

        // 2. End Date Seç
        days[10].nativeElement.click();
        fixture.detectChanges();

        expect(component.tempStart()).toBeTruthy();
        expect(component.tempEnd()).toBeTruthy();

        // 3. UYGULA Butonuna Bas (EKSİK OLAN KISIM BURASIYDI)
        const applyBtn = fixture.debugElement.query(By.css('.sig-date-range__apply'));
        applyBtn.nativeElement.click();
        fixture.detectChanges();

        // Şimdi Value dolu olmalı
        expect(component.value()?.start).toBeTruthy();
        expect(component.value()?.end).toBeTruthy();
        expect(component.isOpen()).toBe(false);
    });

    it('should select start and end dates', () => {
        component.toggle();
        fixture.detectChanges();

        // Sadece aktif günleri seç
        const days = fixture.debugElement.queryAll(By.css('.sig-date-range__day:not(.sig-date-range__day--disabled)'));

        // 1. Start Date Seç
        days[5].nativeElement.click();
        fixture.detectChanges();

        expect(component.tempStart()).toBeTruthy();

        // 2. End Date Seç
        days[10].nativeElement.click();
        fixture.detectChanges();

        // 3. UYGULA Butonuna Bas (Value ancak o zaman set edilir)
        const applyBtn = fixture.debugElement.query(By.css('.sig-date-range__apply'));
        applyBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()?.start).toBeTruthy();
        expect(component.value()?.end).toBeTruthy();
    });

    it('should SWAP dates if second date is before first date', () => {
        component.toggle();
        fixture.detectChanges();
        const days = fixture.debugElement.queryAll(By.css('.sig-date-range__day:not(.sig-date-range__day--disabled)'));

        const day10Text = days[10].nativeElement.textContent.trim();
        const day5Text = days[5].nativeElement.textContent.trim();

        // İlk tıklama: İleri bir tarih (10. gün)
        days[10].nativeElement.click();

        // İkinci tıklama: Geri bir tarih (5. gün)
        days[5].nativeElement.click();
        fixture.detectChanges();

        // Kod SWAP yapar: Start=5, End=10 olur. Null olmaz.
        expect(component.tempStart()?.getDate()).toBe(parseInt(day5Text));
        expect(component.tempEnd()?.getDate()).toBe(parseInt(day10Text));
    });

    it('should highlight range in UI', () => {
        // Mock value
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 5);

        component.writeValue({ start, end });
        component.toggle();
        fixture.detectChanges();

        // Check CSS classes
        const rangeEl = fixture.debugElement.query(By.css('.sig-date-range__day--in-range'));
        expect(rangeEl).toBeTruthy();
    });
});