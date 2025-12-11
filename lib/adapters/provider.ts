import { InjectionToken, EnvironmentProviders, makeEnvironmentProviders, inject } from '@angular/core';
import { UIAdapter } from './base/ui-adapter.interface';

/**
 * Injection token for UI adapter
 */
export const UI_ADAPTER = new InjectionToken<UIAdapter>('NG_SIGNALIFY_UI_ADAPTER');

/**
 * Provide UI adapter for ng-signalify
 * 
 * @param adapter - The UI adapter instance (MaterialAdapter, HeadlessAdapter, etc.)
 * @returns Environment providers
 * 
 * @example
 * ```typescript
 * import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideSigUI(new MaterialAdapter())
 *   ]
 * };
 * ```
 */
export function provideSigUI(adapter: UIAdapter): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: UI_ADAPTER, useValue: adapter }
  ]);
}

/**
 * Helper function to inject the current UI adapter
 */
export function injectUIAdapter(): UIAdapter {
  return inject(UI_ADAPTER);
}
