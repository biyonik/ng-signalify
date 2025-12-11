import { ComponentRef, Type } from '@angular/core';
import { BaseFormAdapter } from '../base/base-form-adapter';
import { FieldValue } from '../../fields';

/**
 * Adapter for Angular Material
 * Integrates ng-signalify with @angular/material components
 * 
 * Usage:
 * ```typescript
 * import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';
 * 
 * export const appConfig = {
 *   providers: [
 *     provideSigUI(new MaterialAdapter())
 *   ]
 * };
 * ```
 */
export class MaterialAdapter extends BaseFormAdapter {
  readonly name = 'angular-material';
  readonly version = '17.0.0';
  
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
   * Material-specific binding logic
   * Adds appearance, floatLabel, and other Material properties
   */
  override bindFieldToComponent<T>(
    field: FieldValue<T>,
    componentRef: ComponentRef<any>
  ): void {
    super.bindFieldToComponent(field, componentRef);
    
    const instance = componentRef.instance;
    
    if (instance['appearance'] !== undefined && !instance['appearance']) {
      instance['appearance'] = 'outline';
    }
    
    if (instance['floatLabel'] !== undefined && !instance['floatLabel']) {
      instance['floatLabel'] = 'auto';
    }
  }
}
