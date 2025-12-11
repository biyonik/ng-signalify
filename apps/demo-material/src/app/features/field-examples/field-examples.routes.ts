/**
 * TR: Field örnekleri route yapılandırması.
 * EN: Field examples routing configuration.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Routes } from '@angular/router';
import { FieldExamplesComponent } from './field-examples.component';

export const FIELD_EXAMPLES_ROUTES: Routes = [
  {
    path: '',
    component: FieldExamplesComponent
  }
];
