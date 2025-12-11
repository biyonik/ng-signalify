import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigDatePickerComponent } from './date-picker.component';
import { By } from '@angular/platform-browser';

describe('SigDatePickerComponent (Calendar Logic)', () => {
    let component: SigDatePickerComponent;
    let fixture: ComponentFixture<SigDatePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigDatePickerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigDatePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle calendar on click', () => {
        const trigger = fixture.debugElement.query(By.css('.sig-date-picker__trigger'));

        // Open
        trigger.nativeElement.click();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(true);
        expect(fixture.debugElement.query(By.css('.sig-date-picker__dropdown'))).toBeTruthy();

        // Close
        trigger.nativeElement.click();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(false);
    });

    it('should generate correct calendar days for a given month', () => {
        // Sabit bir tarih ayarlayalım: 1 Mart 2024 (2024 Artık yıldır, Şubat 29 çeker)
        // Ancak test viewMonth üzerinden çalışıyor. Mart = 2 (0-indexed)
        component.viewYear.set(2024);
        component.viewMonth.set(2); // Mart
        component.toggle(); // Dropdown'ı aç ki hesaplamalar DOM'a düşsün
        fixture.detectChanges();

        const days = component.calendarDays();
        // Mart 1 Cuma gününe denk gelir. (Pazartesi başlangıçlı değilse Pazar'dan başlar)
        // Kodda: startDate = Sunday of first week logic.
        // 1 Mart 2024 Cuma. Pazar başlangıçlı haftada: 25 Şubat - 2 Mart ilk hafta olur.

        // İlk gün kontrolü (25 Şubat olmalı, önceki aydan)
        expect(days[0].date.getDate()).toBe(25);
        expect(days[0].isCurrentMonth).toBe(false);

        // Ayın ortası (15 Mart)
        const midMonth = days.find(d => d.day === 15 && d.isCurrentMonth);
        expect(midMonth).toBeTruthy();
    });

    it('should navigate months correctly', () => {
        component.toggle();
        fixture.detectChanges();

        // Başlangıç: Bugünün ayı (Örn: Ocak 2024 olsun diyelim mocklamadıkça current date alır)
        const currentMonth = new Date().getMonth();

        const nextBtn = fixture.debugElement.queryAll(By.css('.sig-date-picker__nav'))[1]; // [0]=Prev, [1]=Next
        nextBtn.nativeElement.click();
        fixture.detectChanges();

        // Ay değişti mi?
        const expectedMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        expect(component.viewMonth()).toBe(expectedMonth);
    });

    it('should select a date and update model', () => {
        const spy = jest.spyOn(component.dateSelected, 'emit');
        component.toggle();
        fixture.detectChanges();

        // Ayın 15. gününü bul ve tıkla (Mevcut aydan)
        const dayBtn = fixture.debugElement.queryAll(By.css('.sig-date-picker__day'))
            .find(el => el.nativeElement.textContent.trim() === '15' && !el.classes['sig-date-picker__day--other-month']);

        if (dayBtn) {
            dayBtn.nativeElement.click();
            fixture.detectChanges();

            const selectedDate = component.value();
            expect(selectedDate).toBeTruthy();
            expect(selectedDate?.getDate()).toBe(15);
            expect(spy).toHaveBeenCalledWith(selectedDate);
            expect(component.isOpen()).toBe(false); // Seçince kapanmalı
        }
    });

    it('should disable dates outside min/max range', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        fixture.componentRef.setInput('minDate', today); // Dünden öncekiler yasak
        component.toggle();
        fixture.detectChanges();

        // Dünün tarihini bul
        const yesterdayBtn = fixture.debugElement.queryAll(By.css('.sig-date-picker__day'))
            .find(el => {
                const txt = el.nativeElement.textContent.trim();
                return txt === yesterday.getDate().toString() && el.classes['sig-date-picker__day--other-month'] === undefined;
                // Not: Ay başı/sonu ise "other-month" olabilir, basit senaryoda ay ortasında test etmek güvenli.
            });

        // Basit mantık: CalendarDays içinden kontrol etmek daha güvenli (DOM bulmak zor olabilir)
        const days = component.calendarDays();
        const disabledDay = days.find(d => d.date.getTime() < today.setHours(0,0,0,0));

        if (disabledDay) {
            expect(disabledDay.isDisabled).toBe(true);
        }
    });

    it('should clear value', () => {
        component.writeValue(new Date());
        component.toggle();
        fixture.detectChanges();

        const clearBtn = fixture.debugElement.query(By.css('.sig-date-picker__clear'));
        clearBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toBeNull();
    });
});