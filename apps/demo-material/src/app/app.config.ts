/**
 * TR: Demo uygulaması ana yapılandırması.
 * Material adapter, routing ve diğer provider'ları içerir.
 *
 * EN: Main application configuration for demo app.
 * Includes Material adapter, routing, and other providers.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideSigUI(new MaterialAdapter({
      defaultAppearance: 'outline',
      defaultFloatLabel: 'auto',
      defaultColor: 'primary',
      autoHints: true,
      autoAriaLabels: true
    }))
  ]
};
