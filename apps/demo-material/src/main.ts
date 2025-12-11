/**
 * TR: Demo uygulaması ana bootstrap dosyası.
 * Angular uygulamasını başlatır ve app.config'i yükler.
 *
 * EN: Main bootstrap file for demo application.
 * Bootstraps the Angular application with app.config.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
