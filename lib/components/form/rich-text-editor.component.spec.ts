import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigRichTextEditorComponent } from './rich-text-editor.component';
import { By } from '@angular/platform-browser';

describe('SigRichTextEditorComponent', () => {
    let component: SigRichTextEditorComponent;
    let fixture: ComponentFixture<SigRichTextEditorComponent>;

    document.queryCommandState = jest.fn(() => false);
    document.execCommand = jest.fn(() => true);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigRichTextEditorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigRichTextEditorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should initialize with writeValue', () => {
        const html = '<p>Hello</p>';
        component.writeValue(html);
        fixture.detectChanges();

        const editorDiv = fixture.debugElement.query(By.css('.sig-rte__editor')).nativeElement;
        expect(editorDiv.innerHTML).toBe(html);
        expect(component.value()).toBe(html);
    });

    it('should update model on input', () => {
        const editorDiv = fixture.debugElement.query(By.css('.sig-rte__editor')).nativeElement;
        editorDiv.innerHTML = '<b>Bold</b>';

        // Contenteditable input event tetikle
        editorDiv.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.value()).toBe('<b>Bold</b>');
    });

    it('should toggle source mode', () => {
        component.writeValue('<p>Text</p>');
        fixture.detectChanges();

        // Toolbar'daki </> butonunu bul (en sonda)
        // Kodda showSource default true.
        component.toggleSourceMode();
        fixture.detectChanges();

        expect(component.isSourceMode()).toBe(true);

        // Textarea görünmeli
        const textarea = fixture.debugElement.query(By.css('.sig-rte__source'));
        expect(textarea).toBeTruthy();
        expect(textarea.nativeElement.value).toBe('<p>Text</p>');
    });
});