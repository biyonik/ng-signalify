import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  model,
  output,
  ElementRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigColorPicker - Signal-based color picker
 * 
 * Usage:
 * <sig-color-picker
 *   [(value)]="selectedColor"
 *   [presetColors]="['#ff0000', '#00ff00', '#0000ff']"
 *   [showInput]="true"
 * />
 */
@Component({
  selector: 'sig-color-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigColorPickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-color-picker" [class.sig-color-picker--open]="isOpen()">
      <!-- Trigger -->
      <button
        type="button"
        class="sig-color-picker__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span 
          class="sig-color-picker__preview"
          [style.background-color]="value() || '#ffffff'"
        ></span>
        @if (showValue()) {
          <span class="sig-color-picker__value">{{ value() || 'Seçiniz' }}</span>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="sig-color-picker__dropdown">
          <!-- Saturation/Brightness Picker -->
          <div 
            class="sig-color-picker__saturation"
            #saturationRef
            [style.background-color]="hueColor()"
            (mousedown)="onSaturationMouseDown($event)"
          >
            <div class="sig-color-picker__saturation-white"></div>
            <div class="sig-color-picker__saturation-black"></div>
            <div 
              class="sig-color-picker__saturation-cursor"
              [style.left.%]="saturation()"
              [style.top.%]="100 - brightness()"
            ></div>
          </div>

          <!-- Hue Slider -->
          <div 
            class="sig-color-picker__hue"
            #hueRef
            (mousedown)="onHueMouseDown($event)"
          >
            <div 
              class="sig-color-picker__hue-cursor"
              [style.left.%]="(hue() / 360) * 100"
            ></div>
          </div>

          <!-- Alpha Slider -->
          @if (showAlpha()) {
            <div 
              class="sig-color-picker__alpha"
              [style.--alpha-color]="rgbString()"
              (mousedown)="onAlphaMouseDown($event)"
            >
              <div 
                class="sig-color-picker__alpha-cursor"
                [style.left.%]="alpha() * 100"
              ></div>
            </div>
          }

          <!-- Preset Colors -->
          @if (presetColors().length > 0) {
            <div class="sig-color-picker__presets">
              @for (color of presetColors(); track color) {
                <button
                  type="button"
                  class="sig-color-picker__preset"
                  [style.background-color]="color"
                  [class.sig-color-picker__preset--selected]="value() === color"
                  (click)="selectPreset(color)"
                  [title]="color"
                ></button>
              }
            </div>
          }

          <!-- Input -->
          @if (showInput()) {
            <div class="sig-color-picker__input-container">
              <input
                type="text"
                class="sig-color-picker__input"
                [value]="value()"
                (input)="onInputChange($event)"
                (blur)="onInputBlur($event)"
                placeholder="#000000"
              />
              @if (showEyeDropper() && hasEyeDropper) {
                <button
                  type="button"
                  class="sig-color-picker__eyedropper"
                  (click)="pickFromScreen()"
                  title="Ekrandan seç"
                >
                  💉
                </button>
              }
            </div>
          }

          <!-- Footer -->
          <div class="sig-color-picker__footer">
            <button type="button" (click)="cancel()">İptal</button>
            <button type="button" class="sig-color-picker__apply" (click)="apply()">
              Uygula
            </button>
          </div>
        </div>
      }
    </div>
  `,
    host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigColorPickerComponent implements ControlValueAccessor {
  readonly saturationRef = viewChild<ElementRef>('saturationRef');
  readonly hueRef = viewChild<ElementRef>('hueRef');

  readonly value = model<string>('#000000');
  readonly disabled = input<boolean>(false);
  readonly showValue = input<boolean>(true);
  readonly showInput = input<boolean>(true);
  readonly showAlpha = input<boolean>(false);
  readonly showEyeDropper = input<boolean>(true);
  readonly presetColors = input<string[]>([
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#f59e0b', '#10b981',
  ]);

  readonly colorSelected = output<string>();

  readonly isOpen = signal(false);
  readonly hue = signal(0);
  readonly saturation = signal(100);
  readonly brightness = signal(100);
  readonly alpha = signal(1);

  readonly hasEyeDropper = 'EyeDropper' in window;

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly hueColor = computed(() => {
    return `hsl(${this.hue()}, 100%, 50%)`;
  });

  readonly rgbString = computed(() => {
    const rgb = this.hsvToRgb(this.hue(), this.saturation(), this.brightness());
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  });

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
      if (this.isOpen()) {
        this.parseColor(this.value());
      }
    }
  }

  onSaturationMouseDown(event: MouseEvent): void {
    this.updateSaturation(event);
    
    const onMove = (e: MouseEvent) => this.updateSaturation(e);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private updateSaturation(event: MouseEvent): void {
    const el = this.saturationRef()?.nativeElement;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    
    this.saturation.set((x / rect.width) * 100);
    this.brightness.set(100 - (y / rect.height) * 100);
    this.updateColor();
  }

  onHueMouseDown(event: MouseEvent): void {
    this.updateHue(event);
    
    const onMove = (e: MouseEvent) => this.updateHue(e);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private updateHue(event: MouseEvent): void {
    const el = this.hueRef()?.nativeElement;
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    
    this.hue.set((x / rect.width) * 360);
    this.updateColor();
  }

  onAlphaMouseDown(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    this.alpha.set(x / rect.width);
    this.updateColor();
  }

  private updateColor(): void {
    const rgb = this.hsvToRgb(this.hue(), this.saturation(), this.brightness());
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    this.value.set(hex);
  }

  selectPreset(color: string): void {
    this.value.set(color);
    this.parseColor(color);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      this.value.set(value);
      this.parseColor(value);
    }
  }

  onInputBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!/^#[0-9A-Fa-f]{6}$/.test(input.value)) {
      input.value = this.value();
    }
  }

  async pickFromScreen(): Promise<void> {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        this.value.set(result.sRGBHex);
        this.parseColor(result.sRGBHex);
      } catch (e) {
        // User cancelled
      }
    }
  }

  apply(): void {
    this._onChange(this.value());
    this.colorSelected.emit(this.value());
    this.isOpen.set(false);
  }

  cancel(): void {
    this.isOpen.set(false);
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-color-picker')) {
      this.isOpen.set(false);
    }
  }

  private parseColor(hex: string): void {
    const rgb = this.hexToRgb(hex);
    if (rgb) {
      const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
      this.hue.set(hsv.h);
      this.saturation.set(hsv.s);
      this.brightness.set(hsv.v);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255,
    };
  }

  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255; g /= 255; b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
      }
    }
    
    return { h, s, v };
  }

  writeValue(value: string): void {
    this.value.set(value || '#000000');
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}