import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SigTabsComponent, SigTabPanelDirective } from './tabs.component';

@Component({
    template: `
    <sig-tabs [(activeTab)]="activeTab">
      <ng-template sigTabPanel="home" label="Ana Sayfa" icon="🏠">
        Home content
      </ng-template>
      <ng-template sigTabPanel="profile" label="Profil" [badge]="5">
        Profile content
      </ng-template>
      <ng-template sigTabPanel="settings" label="Ayarlar" [disabled]="true">
        Settings content
      </ng-template>
    </sig-tabs>
  `,
    standalone: true,
    imports: [SigTabsComponent, SigTabPanelDirective],
})
class TestHostComponent {
    activeTab = 'home';
}

describe('SigTabsComponent', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;
    let tabsComponent: SigTabsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        hostComponent = fixture.componentInstance;
        fixture.detectChanges();

        tabsComponent = fixture.debugElement.query(By.directive(SigTabsComponent)).componentInstance;
    });

    it('oluşturulmalı', () => {
        expect(tabsComponent).toBeTruthy();
    });

    describe('tab rendering', () => {
        it('tüm tablar render edilmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const tabs = fixture.debugElement.queryAll(By.css('.sig-tabs__tab'));
            expect(tabs.length).toBe(3);
        }));

        it('tab etiketleri gösterilmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const labels = fixture.debugElement.queryAll(By.css('.sig-tabs__label'));
            expect(labels[0].nativeElement.textContent).toBe('Ana Sayfa');
            expect(labels[1].nativeElement.textContent).toBe('Profil');
        }));

        it('icon gösterilmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const icons = fixture.debugElement.queryAll(By.css('.sig-tabs__icon'));
            expect(icons[0].nativeElement.textContent).toBe('🏠');
        }));

        it('badge gösterilmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const badges = fixture.debugElement.queryAll(By.css('.sig-tabs__badge'));
            expect(badges[0].nativeElement.textContent).toBe('5');
        }));
    });

    describe('tab selection', () => {
        it('aktif tab işaretlenmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const activeTab = fixture.debugElement.query(By.css('.sig-tabs__tab--active'));
            expect(activeTab).toBeTruthy();
        }));

        it('tab tıklanınca aktif olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const profileTab = fixture.debugElement.queryAll(By.css('.sig-tabs__tab'))[1];
            profileTab.nativeElement.click();
            fixture.detectChanges();

            expect(hostComponent.activeTab).toBe('profile');
        }));

        it('disabled tab tıklanmamalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const settingsTab = fixture.debugElement.queryAll(By.css('.sig-tabs__tab'))[2];
            settingsTab.nativeElement.click();
            fixture.detectChanges();

            expect(hostComponent.activeTab).toBe('home');
        }));

        it('tabChanged eventi emit edilmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const changedSpy = jest.fn();
            tabsComponent.tabChanged.subscribe(changedSpy);

            tabsComponent.selectTab('profile');

            expect(changedSpy).toHaveBeenCalledWith('profile');
        }));
    });

    describe('tab panels', () => {
        it('aktif panel görünmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const activePanel = fixture.debugElement.query(By.css('.sig-tabs__panel--active'));
            expect(activePanel).toBeTruthy();
            expect(activePanel.nativeElement.textContent).toContain('Home content');
        }));

        it('inaktif paneller hidden olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const panels = fixture.debugElement.queryAll(By.css('.sig-tabs__panel'));
            const hiddenPanels = panels.filter(p => p.nativeElement.hidden);
            expect(hiddenPanels.length).toBe(2);
        }));
    });

    describe('navigation', () => {
        it('nextTab sonraki taba geçmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            tabsComponent.nextTab();
            fixture.detectChanges();

            expect(tabsComponent.activeTab()).toBe('profile');
        }));

        it('nextTab disabled tabı atlamalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            tabsComponent.selectTab('profile');
            tabsComponent.nextTab();
            fixture.detectChanges();

            // settings disabled, o yüzden profile da kalmalı
            expect(tabsComponent.activeTab()).toBe('profile');
        }));

        it('prevTab önceki taba geçmeli', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            tabsComponent.selectTab('profile');
            tabsComponent.prevTab();
            fixture.detectChanges();

            expect(tabsComponent.activeTab()).toBe('home');
        }));
    });

    describe('variants', () => {
        it('vertical orientation sınıfı eklenmeli', fakeAsync(() => {
            tick();
            fixture.componentRef.setInput('orientation', 'vertical');
            fixture.detectChanges();

            const tabs = fixture.debugElement.query(By.css('.sig-tabs'));
            expect(tabs.classes['sig-tabs--vertical']).toBeTruthy();
        }));

        it('pills variant sınıfı eklenmeli', fakeAsync(() => {
            tick();

            // Tabs component'e erişmek için
            const tabsDebug = fixture.debugElement.query(By.directive(SigTabsComponent));
            tabsDebug.componentInstance.variant = () => 'pills';
            fixture.detectChanges();

            const tabs = fixture.debugElement.query(By.css('.sig-tabs'));
            expect(tabs.classes['sig-tabs--pills']).toBeTruthy();
        }));

        it('fullWidth sınıfı eklenmeli', fakeAsync(() => {
            tick();

            const tabsDebug = fixture.debugElement.query(By.directive(SigTabsComponent));
            tabsDebug.componentInstance.fullWidth = () => true;
            fixture.detectChanges();

            const tabs = fixture.debugElement.query(By.css('.sig-tabs'));
            expect(tabs.classes['sig-tabs--full-width']).toBeTruthy();
        }));
    });

    describe('accessibility', () => {
        it('tablist role olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const tablist = fixture.debugElement.query(By.css('[role="tablist"]'));
            expect(tablist).toBeTruthy();
        }));

        it('tab role olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
            expect(tabs.length).toBe(3);
        }));

        it('tabpanel role olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const panels = fixture.debugElement.queryAll(By.css('[role="tabpanel"]'));
            expect(panels.length).toBe(3);
        }));

        it('aria-selected aktif tab için true olmalı', fakeAsync(() => {
            tick();
            fixture.detectChanges();

            const activeTab = fixture.debugElement.query(By.css('.sig-tabs__tab--active'));
            expect(activeTab.attributes['aria-selected']).toBe('true');
        }));
    });
});
