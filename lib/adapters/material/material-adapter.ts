import { ComponentRef, Type } from '@angular/core';
import { BaseFormAdapter } from '../base/base-form-adapter';
import { FieldValue } from '../../fields';

/**
 * TR: Angular Material adapter yapılandırma ayarları.
 * Tüm form alanları için varsayılan görünüm, etiket davranışı ve tema rengini yönetir.
 *
 * EN: Angular Material adapter configuration settings.
 * Manages default appearance, label behavior, and theme color for all form fields.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface MaterialAdapterConfig {
  /**
   * TR: Tüm form alanları için varsayılan görünüm stili.
   * EN: Default appearance style for all form fields.
   */
  defaultAppearance?: 'fill' | 'outline' | 'standard' | 'legacy';
  
  /**
   * TR: Etiket (label) görüntüleme davranışı.
   * EN: Label display behavior.
   */
  defaultFloatLabel?: 'always' | 'auto';
  
  /**
   * TR: Varsayılan tema rengi.
   * EN: Default theme color.
   */
  defaultColor?: 'primary' | 'accent' | 'warn';
  
  /**
   * TR: Field config'den otomatik ipucu (hint) gösterimi.
   * EN: Auto-display hints from field config.
   */
  autoHints?: boolean;
  
  /**
   * TR: Otomatik ARIA label oluşturma (erişilebilirlik).
   * EN: Automatic ARIA label generation (accessibility).
   */
  autoAriaLabels?: boolean;
}

/**
 * TR: Angular Material için adapter.
 * ng-signalify'ı @angular/material bileşenleri ile entegre eder.
 *
 * EN: Adapter for Angular Material.
 * Integrates ng-signalify with @angular/material components.
 * 
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 * 
 * Usage:
 * ```typescript
 * import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';
 * 
 * // Basic usage
 * export const appConfig = {
 *   providers: [
 *     provideSigUI(new MaterialAdapter())
 *   ]
 * };
 * 
 * // With configuration
 * export const appConfig = {
 *   providers: [
 *     provideSigUI(new MaterialAdapter({
 *       defaultAppearance: 'outline',
 *       defaultFloatLabel: 'auto',
 *       defaultColor: 'primary',
 *       autoHints: true,
 *       autoAriaLabels: true
 *     }))
 *   ]
 * };
 * ```
 */
export class MaterialAdapter extends BaseFormAdapter {
  readonly name = 'angular-material';
  readonly version = '2.0.0';  // Adapter version, not Material library version
  
  /**
   * TR: Adapter yapılandırması.
   * EN: Adapter configuration.
   */
  private config: MaterialAdapterConfig;
  
  /**
   * TR: MaterialAdapter constructor.
   * Yapılandırma parametresi ile adapter'ı başlatır.
   *
   * EN: MaterialAdapter constructor.
   * Initializes the adapter with configuration parameters.
   *
   * @param config - TR: Opsiyonel yapılandırma ayarları / EN: Optional configuration settings
   */
  constructor(config?: MaterialAdapterConfig) {
    super();
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * TR: Varsayılan yapılandırmayı döndürür ve kullanıcı yapılandırması ile birleştirir.
   * EN: Returns default configuration merged with user configuration.
   *
   * @param userConfig - TR: Kullanıcı tarafından sağlanan yapılandırma / EN: User-provided configuration
   * @returns TR: Birleştirilmiş yapılandırma / EN: Merged configuration
   */
  getDefaultConfig(userConfig?: MaterialAdapterConfig): MaterialAdapterConfig {
    const defaults: MaterialAdapterConfig = {
      defaultAppearance: 'outline',
      defaultFloatLabel: 'auto',
      defaultColor: 'primary',
      autoHints: false,
      autoAriaLabels: true
    };
    
    return { ...defaults, ...userConfig };
  }
  
  getInputComponent(): Type<any> | null {
    return null;
  }
  
  getSelectComponent(): Type<any> | null {
    return null;
  }
  
  getCheckboxComponent(): Type<any> | null {
    return null;
  }
  
  getTextareaComponent(): Type<any> | null {
    return null;
  }
  
  getRadioGroupComponent(): Type<any> | null {
    return null;
  }
  
  /**
   * TR: Material'a özgü bağlama mantığı.
   * Appearance, floatLabel, color ve diğer Material özelliklerini ekler.
   * ARIA etiketlerini ve ipuçlarını otomatik olarak yapılandırır.
   *
   * EN: Material-specific binding logic.
   * Adds appearance, floatLabel, color, and other Material properties.
   * Auto-configures ARIA labels and hints.
   *
   * @param field - TR: Bağlanacak alan / EN: Field to bind
   * @param componentRef - TR: Bileşen referansı / EN: Component reference
   */
  override bindFieldToComponent<T>(
    field: FieldValue<T>,
    componentRef: ComponentRef<any>
  ): void {
    super.bindFieldToComponent(field, componentRef);
    
    const instance = componentRef.instance;
    
    // String property accessors are used to avoid importing @angular/material types
    // since Material is an optional peer dependency
    
    // Apply appearance
    if (instance['appearance'] !== undefined && instance['appearance'] == null) {
      instance['appearance'] = this.config.defaultAppearance;
    }
    
    // Apply floatLabel
    if (instance['floatLabel'] !== undefined && instance['floatLabel'] == null) {
      instance['floatLabel'] = this.config.defaultFloatLabel;
    }
    
    // Apply color
    if (instance['color'] !== undefined && instance['color'] == null && this.config.defaultColor) {
      instance['color'] = this.config.defaultColor;
    }
    
    // Auto-generate ARIA labels for accessibility
    if (this.config.autoAriaLabels) {
      const fieldWithLabel = field as any;
      if (fieldWithLabel.label && instance['ariaLabel'] !== undefined && !instance['ariaLabel']) {
        instance['ariaLabel'] = fieldWithLabel.label;
      }
    }
    
    // Auto-display hints from field config
    if (this.config.autoHints) {
      const fieldWithHint = field as any;
      if (fieldWithHint.hint && instance['hint'] !== undefined && !instance['hint']) {
        instance['hint'] = fieldWithHint.hint;
      }
    }
  }
}
