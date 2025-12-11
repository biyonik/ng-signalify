/**
 * @deprecated Legacy UI components - Use adapters instead
 */
if (typeof window !== 'undefined' && !(window as any).__NG_SIGNALIFY_LEGACY_WARNING__) {
  (window as any).__NG_SIGNALIFY_LEGACY_WARNING__ = true;
  console.warn(
    '[ng-signalify] Legacy components are deprecated. ' +
    'Migrate to adapters: https://github.com/biyonik/ng-signalify'
  );
}

export * from './form';
export * from './data';
export * from './feedback';
export * from './layout';
export * from './display';
export * from './navigation';
export * from './composite';
export * from './overlay';
export * from './utility';
