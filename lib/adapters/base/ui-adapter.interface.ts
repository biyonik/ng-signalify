import { Type, ComponentRef } from '@angular/core';
import { FieldValue } from '../../fields';

/**
 * Base interface for UI adapters
 * Adapters bridge ng-signalify logic with UI libraries
 */
export interface UIAdapter {
  /** Adapter name (e.g., 'angular-material', 'spartan-ui') */
  readonly name: string;
  
  /** Adapter version */
  readonly version: string;
  
  /** Get input component type from the UI library */
  getInputComponent(): Type<any> | null;
  
  /** Get select component type from the UI library */
  getSelectComponent(): Type<any> | null;
  
  /** Get checkbox component type from the UI library */
  getCheckboxComponent(): Type<any> | null;
  
  /** Get textarea component type from the UI library */
  getTextareaComponent(): Type<any> | null;
  
  /** Get radio group component type from the UI library */
  getRadioGroupComponent(): Type<any> | null;
  
  /**
   * Bind a FieldValue to a component instance
   * This method connects ng-signalify's reactive field state to the UI component
   */
  bindFieldToComponent<T>(
    field: FieldValue<T>,
    componentRef: ComponentRef<any>
  ): void;
  
  /**
   * Optional: Get wrapper component for form fields
   * This is used for error display, labels, hints, etc.
   */
  getFormFieldWrapperComponent?(): Type<any> | null;
}

/**
 * Configuration for component binding
 */
export interface ComponentBindingConfig {
  /** Two-way binding property name (default: 'value') */
  valueProperty?: string;
  
  /** Error property name (default: 'error') */
  errorProperty?: string;
  
  /** Disabled property name (default: 'disabled') */
  disabledProperty?: string;
  
  /** Additional custom bindings */
  customBindings?: Record<string, any>;
}
