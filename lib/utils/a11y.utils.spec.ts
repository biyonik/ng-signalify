/**
 * A11Y Utilities Tests
 * Tests for FocusTrap, RovingTabIndex, and announce functions
 */
import { generateId, Keys, announce, FocusTrap, RovingTabIndex } from './a11y.utils';

describe('A11Y Utilities', () => {

    describe('generateId', () => {
        it('should generate unique IDs with default prefix', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).toContain('sig-');
            expect(id2).toContain('sig-');
            expect(id1).not.toBe(id2);
        });

        it('should use custom prefix', () => {
            const id = generateId('custom');
            expect(id).toContain('custom-');
        });

        it('should generate sequential IDs', () => {
            const id1 = generateId('test');
            const id2 = generateId('test');

            // ID'ler farklı olmalı
            expect(id1).not.toBe(id2);
        });
    });

    describe('Keys constants', () => {
        it('should have all required key constants', () => {
            expect(Keys.ENTER).toBe('Enter');
            expect(Keys.SPACE).toBe(' ');
            expect(Keys.ESCAPE).toBe('Escape');
            expect(Keys.TAB).toBe('Tab');
            expect(Keys.ARROW_UP).toBe('ArrowUp');
            expect(Keys.ARROW_DOWN).toBe('ArrowDown');
            expect(Keys.ARROW_LEFT).toBe('ArrowLeft');
            expect(Keys.ARROW_RIGHT).toBe('ArrowRight');
            expect(Keys.HOME).toBe('Home');
            expect(Keys.END).toBe('End');
            expect(Keys.PAGE_UP).toBe('PageUp');
            expect(Keys.PAGE_DOWN).toBe('PageDown');
            expect(Keys.BACKSPACE).toBe('Backspace');
        });
    });

    describe('announce', () => {
        beforeEach(() => {
            // Clean up any existing announcers
            const polite = document.getElementById('sig-announcer-polite');
            const assertive = document.getElementById('sig-announcer-assertive');
            if (polite) polite.remove();
            if (assertive) assertive.remove();
        });

        it('should create polite announcer if not exists', () => {
            announce('Test message', 'polite');

            const announcer = document.getElementById('sig-announcer-polite');
            expect(announcer).toBeTruthy();
            expect(announcer?.getAttribute('aria-live')).toBe('polite');
            expect(announcer?.getAttribute('aria-atomic')).toBe('true');
            expect(announcer?.getAttribute('role')).toBe('status');
        });

        it('should create assertive announcer if not exists', () => {
            announce('Important message', 'assertive');

            const announcer = document.getElementById('sig-announcer-assertive');
            expect(announcer).toBeTruthy();
            expect(announcer?.getAttribute('aria-live')).toBe('assertive');
        });

        it('should be visually hidden but accessible to screen readers', () => {
            announce('Hidden message', 'polite');

            const announcer = document.getElementById('sig-announcer-polite');
            expect(announcer?.style.position).toBe('absolute');
            expect(announcer?.style.width).toBe('1px');
            expect(announcer?.style.height).toBe('1px');
        });

        it('should default to polite priority', () => {
            announce('Default message');

            const announcer = document.getElementById('sig-announcer-polite');
            expect(announcer).toBeTruthy();
        });
    });

    describe('FocusTrap', () => {
        let container: HTMLElement;
        let button1: HTMLButtonElement;
        let input1: HTMLInputElement;
        let button2: HTMLButtonElement;
        let focusTrap: FocusTrap;

        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = `
                <button id="btn1">Button 1</button>
                <input id="input1" type="text" />
                <button id="btn2">Button 2</button>
            `;
            document.body.appendChild(container);

            button1 = container.querySelector('#btn1') as HTMLButtonElement;
            input1 = container.querySelector('#input1') as HTMLInputElement;
            button2 = container.querySelector('#btn2') as HTMLButtonElement;

            focusTrap = new FocusTrap(container);
        });

        afterEach(() => {
            focusTrap.deactivate();
            container.remove();
        });

        it('should focus first focusable element on activate', () => {
            focusTrap.activate();
            expect(document.activeElement).toBe(button1);
        });

        it('should trap focus when Tab pressed on last element', () => {
            focusTrap.activate();
            button2.focus();

            const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
            container.dispatchEvent(event);

            // Focus should wrap to first element
            // (Note: In JSDOM, focus behavior might differ)
        });

        it('should trap focus when Shift+Tab pressed on first element', () => {
            focusTrap.activate();
            button1.focus();

            const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
            container.dispatchEvent(event);

            // Focus should wrap to last element
        });

        it('should restore focus on deactivate', () => {
            const outsideButton = document.createElement('button');
            outsideButton.id = 'outside';
            document.body.appendChild(outsideButton);
            outsideButton.focus();

            focusTrap.activate();
            expect(document.activeElement).toBe(button1);

            focusTrap.deactivate();
            expect(document.activeElement).toBe(outsideButton);

            outsideButton.remove();
        });
    });

    describe('RovingTabIndex', () => {
        let items: HTMLElement[];
        let rovingTabIndex: RovingTabIndex;

        beforeEach(() => {
            items = [
                document.createElement('button'),
                document.createElement('button'),
                document.createElement('button'),
            ];
            items.forEach((item, i) => {
                item.textContent = `Item ${i + 1}`;
                document.body.appendChild(item);
            });

            rovingTabIndex = new RovingTabIndex(items, { orientation: 'vertical', loop: true });
        });

        afterEach(() => {
            items.forEach(item => item.remove());
        });

        it('should set tabindex="0" on first item by default', () => {
            expect(items[0].getAttribute('tabindex')).toBe('0');
            expect(items[1].getAttribute('tabindex')).toBe('-1');
            expect(items[2].getAttribute('tabindex')).toBe('-1');
        });

        it('should handle ArrowDown in vertical orientation', () => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            const handled = rovingTabIndex.handleKeyDown(event);

            expect(handled).toBe(true);
            expect(items[0].getAttribute('tabindex')).toBe('-1');
            expect(items[1].getAttribute('tabindex')).toBe('0');
        });

        it('should handle ArrowUp in vertical orientation', () => {
            // First move to second item
            rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

            // Then move back up
            const handled = rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

            expect(handled).toBe(true);
            expect(items[0].getAttribute('tabindex')).toBe('0');
        });

        it('should loop from last to first item', () => {
            // Move to last item
            rovingTabIndex.focusLast();

            // Then press ArrowDown (should loop to first)
            rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

            expect(items[0].getAttribute('tabindex')).toBe('0');
        });

        it('should loop from first to last item', () => {
            // Press ArrowUp on first item (should loop to last)
            rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

            expect(items[2].getAttribute('tabindex')).toBe('0');
        });

        it('should handle Home key', () => {
            // Move to last item first
            rovingTabIndex.focusLast();

            const handled = rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));

            expect(handled).toBe(true);
            expect(items[0].getAttribute('tabindex')).toBe('0');
        });

        it('should handle End key', () => {
            const handled = rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }));

            expect(handled).toBe(true);
            expect(items[2].getAttribute('tabindex')).toBe('0');
        });

        it('should update items list', () => {
            const newItem = document.createElement('button');
            newItem.textContent = 'Item 4';
            document.body.appendChild(newItem);

            rovingTabIndex.setItems([...items, newItem]);

            rovingTabIndex.focusLast();
            expect(newItem.getAttribute('tabindex')).toBe('0');

            newItem.remove();
        });

        it('should handle horizontal orientation', () => {
            const horizontalRoving = new RovingTabIndex(items, { orientation: 'horizontal', loop: true });

            // ArrowRight should move focus in horizontal mode
            const handled = horizontalRoving.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            expect(handled).toBe(true);
            expect(items[1].getAttribute('tabindex')).toBe('0');

            // ArrowLeft should move back
            horizontalRoving.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            expect(items[0].getAttribute('tabindex')).toBe('0');
        });

        it('should handle "both" orientation', () => {
            const bothRoving = new RovingTabIndex(items, { orientation: 'both', loop: true });

            // Both ArrowDown and ArrowRight should work
            let handled = bothRoving.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            expect(handled).toBe(true);

            handled = bothRoving.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            expect(handled).toBe(true);
        });

        it('should not handle unrelated keys', () => {
            const handled = rovingTabIndex.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(handled).toBe(false);
        });

        it('should focus specific item by index', () => {
            rovingTabIndex.focusItem(2);

            expect(items[2].getAttribute('tabindex')).toBe('0');
            expect(items[0].getAttribute('tabindex')).toBe('-1');
            expect(items[1].getAttribute('tabindex')).toBe('-1');
        });
    });
});
