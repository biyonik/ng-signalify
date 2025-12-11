import { ComponentRef, Injector } from '@angular/core';
import { UIAdapter, ComponentBindingConfig } from './ui-adapter.interface';
import { FieldValue } from '../../fields';

/**
 * Abstract base class for form adapters
 * Provides common functionality for binding fields to components
 */
export abstract class BaseFormAdapter implements UIAdapter {
  abstract readonly name: string;
  abstract readonly version: string;
  
  protected injector?: Injector;
  
  constructor(injector?: Injector) {
    this.injector = injector;
  }
  
  abstract getInputComponent(): any;
  abstract getSelectComponent(): any;
  abstract getCheckboxComponent(): any;
  abstract getTextareaComponent(): any;
  abstract getRadioGroupComponent(): any;
  
  /**
   * Default binding implementation
   * Subclasses can override for library-specific behavior
   */
  bindFieldToComponent<T>(
    field: FieldValue<T>,
    componentRef: ComponentRef<any>,
    config: ComponentBindingConfig = {}
  ): void {
    const instance = componentRef.instance;
    const valueProperty = config.valueProperty || 'value';
    const errorProperty = config.errorProperty || 'error';
    const disabledProperty = config.disabledProperty || 'disabled';
    
    // Bind value signal
    if (instance[valueProperty] !== undefined) {
      instance[valueProperty] = field.value;
    }
    
    // Bind error signal
    if (instance[errorProperty] !== undefined) {
      instance[errorProperty] = field.error;
    }
    
    // Bind disabled state if available
    // Note: FieldValue doesn't currently have an enabled signal in the codebase
    // This is future-proofing for when that feature is added
    if (instance[disabledProperty] !== undefined) {
      const fieldWithEnabled = field as any;
      if (typeof fieldWithEnabled.enabled === 'function') {
        instance[disabledProperty] = () => !fieldWithEnabled.enabled();
      }
    }
    
    // Bind touched state if available
    if (instance['touched'] !== undefined) {
      instance['touched'] = field.touched;
    }
    
    // Apply custom bindings
    if (config.customBindings) {
      Object.entries(config.customBindings).forEach(([key, value]) => {
        if (instance[key] !== undefined) {
          instance[key] = value;
        }
      });
    }
  }
  
  getFormFieldWrapperComponent(): any {
    return null;
  }
}
