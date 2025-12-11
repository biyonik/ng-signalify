/**
 * TR: Ana uygulama bileşeni.
 * Layout wrapper ve router outlet içerir.
 *
 * EN: Main application component.
 * Contains layout wrapper and router outlet.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent],
  template: `<app-main-layout />`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AppComponent {
  title = 'ng-signalify Material Demo';
}
