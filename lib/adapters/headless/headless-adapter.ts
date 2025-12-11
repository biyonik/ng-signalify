import { ComponentRef } from '@angular/core';
import { BaseFormAdapter } from '../base/base-form-adapter';
import { FieldValue } from '../../fields';

/**
 * Headless adapter - UI agnostic
 * Users bring their own components and handle rendering
 * This adapter only provides signal binding logic
 * 
 * Usage:
 * ```typescript
 * import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';
 * 
 * export const appConfig = {
 *   providers: [
 *     provideSigUI(new HeadlessAdapter())
 *   ]
 * };
 * ```
 */
export class HeadlessAdapter extends BaseFormAdapter {
  readonly name = 'headless';
  readonly version = '1.0.0';
  
  getInputComponent(): null {
    return null;
  }
  
  getSelectComponent(): null {
    return null;
  }
  
  getCheckboxComponent(): null {
    return null;
  }
  
  getTextareaComponent(): null {
    return null;
  }
  
  getRadioGroupComponent(): null {
    return null;
  }
  
  override bindFieldToComponent<T>(
    field: FieldValue<T>,
    componentRef: ComponentRef<any>
  ): void {
    const instance = componentRef.instance;
    
    instance.fieldValue = field.value;
    instance.fieldError = field.error;
    instance.fieldTouched = field.touched;
    
    // Bind enabled state if available
    const fieldWithEnabled = field as any;
    if (typeof fieldWithEnabled.enabled === 'function') {
      instance.fieldEnabled = fieldWithEnabled.enabled;
    }
  }
}
