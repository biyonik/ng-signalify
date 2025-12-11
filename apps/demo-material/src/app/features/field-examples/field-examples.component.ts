/**
 * TR: Field örnekleri showcase bileşeni.
 * Tüm ng-signalify field tiplerini gösterir.
 *
 * EN: Field examples showcase component.
 * Demonstrates all ng-signalify field types.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-field-examples',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="field-examples-container">
      <h1>Field Examples Showcase</h1>
      <p class="description">
        Explore all available field types in ng-signalify with Angular Material integration.
      </p>

      <mat-tab-group>
        <!-- Primitive Fields Tab -->
        <mat-tab label="Primitives">
          <div class="tab-content">
            <h2>Primitive Field Types</h2>
            <form [formGroup]="primitiveForm" class="example-form">
              
              <!-- String Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>StringField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>String Input</mat-label>
                    <input matInput formControlName="stringExample" placeholder="Enter text">
                    <mat-hint>Basic text input with validation</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new StringField('name', 'Label', &#123; required: true, min: 2, max: 50 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- Integer Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>IntegerField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Integer Input</mat-label>
                    <input matInput formControlName="integerExample" type="number" placeholder="Enter number">
                    <mat-hint>Integer number with min/max validation</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new IntegerField('age', 'Age', &#123; required: true, min: 0, max: 120 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- Decimal Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>DecimalField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Decimal Input</mat-label>
                    <input matInput formControlName="decimalExample" type="number" step="0.01" placeholder="Enter decimal">
                    <span matTextPrefix>$&nbsp;</span>
                    <mat-hint>Decimal number for prices, measurements</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new DecimalField('price', 'Price', &#123; required: true, min: 0 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- Boolean Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>BooleanField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-checkbox formControlName="booleanExample">
                    Enable Feature
                  </mat-checkbox>
                  <p class="example-code">
                    <code>new BooleanField('enabled', 'Enabled')</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- TextArea Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>TextAreaField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Text Area</mat-label>
                    <textarea 
                      matInput 
                      formControlName="textAreaExample" 
                      rows="4"
                      placeholder="Enter multi-line text"
                      maxlength="500"></textarea>
                    <mat-hint align="end">{{ primitiveForm.get('textAreaExample')?.value?.length || 0 }}/500</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new TextAreaField('description', 'Description', &#123; maxLength: 500 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-tab>

        <!-- Selection Fields Tab -->
        <mat-tab label="Selection">
          <div class="tab-content">
            <h2>Selection Field Types</h2>
            <form [formGroup]="selectionForm" class="example-form">
              
              <!-- Enum Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>EnumField (Single Select)</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Select Option</mat-label>
                    <mat-select formControlName="enumExample">
                      <mat-option value="option1">Option 1</mat-option>
                      <mat-option value="option2">Option 2</mat-option>
                      <mat-option value="option3">Option 3</mat-option>
                    </mat-select>
                    <mat-hint>Single selection from predefined options</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new EnumField('role', 'Role', [&#123; id: 'admin', label: 'Admin' &#125;, ...])</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- MultiEnum Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>MultiEnumField (Multiple Select)</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Select Multiple</mat-label>
                    <mat-select formControlName="multiEnumExample" multiple>
                      <mat-option value="tag1">Tag 1</mat-option>
                      <mat-option value="tag2">Tag 2</mat-option>
                      <mat-option value="tag3">Tag 3</mat-option>
                      <mat-option value="tag4">Tag 4</mat-option>
                    </mat-select>
                    <mat-hint>Multiple selections allowed</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new MultiEnumField('tags', 'Tags', [...])</code>
                  </p>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-tab>

        <!-- Date/Time Fields Tab -->
        <mat-tab label="Date & Time">
          <div class="tab-content">
            <h2>Date & Time Field Types</h2>
            <form [formGroup]="dateTimeForm" class="example-form">
              
              <!-- Date Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>DateField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Select Date</mat-label>
                    <input matInput [matDatepicker]="datePicker" formControlName="dateExample">
                    <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
                    <mat-datepicker #datePicker></mat-datepicker>
                    <mat-hint>Date selection with date picker</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new DateField('birthDate', 'Birth Date', &#123; maxDate: new Date() &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-tab>

        <!-- Special Fields Tab -->
        <mat-tab label="Special">
          <div class="tab-content">
            <h2>Special Field Types</h2>
            <form [formGroup]="specialForm" class="example-form">
              
              <!-- Slider Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>SliderField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="slider-container">
                    <label class="slider-label">Slider Value: {{ specialForm.get('sliderExample')?.value }}</label>
                    <mat-slider min="0" max="100" step="5" discrete showTickMarks>
                      <input matSliderThumb formControlName="sliderExample">
                    </mat-slider>
                    <p class="slider-hint">Range selection with slider</p>
                  </div>
                  <p class="example-code">
                    <code>new SliderField('volume', 'Volume', &#123; min: 0, max: 100, step: 5 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- Color Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>ColorField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Select Color</mat-label>
                    <input matInput formControlName="colorExample" type="color">
                    <mat-hint>Color picker input</mat-hint>
                  </mat-form-field>
                  <div class="color-preview" [style.background-color]="specialForm.get('colorExample')?.value">
                    Selected Color
                  </div>
                  <p class="example-code">
                    <code>new ColorField('themeColor', 'Theme Color')</code>
                  </p>
                </mat-card-content>
              </mat-card>

              <!-- Password Field -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>PasswordField</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline">
                    <mat-label>Password</mat-label>
                    <input matInput formControlName="passwordExample" [type]="hidePassword ? 'password' : 'text'">
                    <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                      <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-hint>Secure password input</mat-hint>
                  </mat-form-field>
                  <p class="example-code">
                    <code>new PasswordField('password', 'Password', &#123; min: 8 &#125;)</code>
                  </p>
                </mat-card-content>
              </mat-card>
            </form>
          </div>
        </mat-tab>

        <!-- Info Tab -->
        <mat-tab label="Info">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>About Field Types</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>
                  ng-signalify provides <strong>24+ field types</strong> for comprehensive form building:
                </p>
                
                <mat-accordion>
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Primitive Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>StringField</code> - Text input with validation</li>
                      <li><code>IntegerField</code> - Whole number input</li>
                      <li><code>DecimalField</code> - Decimal number input</li>
                      <li><code>BooleanField</code> - Checkbox/toggle</li>
                      <li><code>TextAreaField</code> - Multi-line text</li>
                    </ul>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Selection Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>EnumField</code> - Single select dropdown</li>
                      <li><code>MultiEnumField</code> - Multiple select dropdown</li>
                      <li><code>RelationField</code> - Entity relation picker</li>
                    </ul>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Date & Time Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>DateField</code> - Date picker</li>
                      <li><code>TimeField</code> - Time picker</li>
                      <li><code>DateTimeField</code> - Combined date & time</li>
                      <li><code>DateRangeField</code> - Date range selection</li>
                    </ul>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Media Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>ImageField</code> - Image upload</li>
                      <li><code>FileField</code> - File upload</li>
                    </ul>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Special Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>SliderField</code> - Range slider</li>
                      <li><code>ColorField</code> - Color picker</li>
                      <li><code>PasswordField</code> - Secure password</li>
                    </ul>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Complex Fields</mat-panel-title>
                    </mat-expansion-panel-header>
                    <ul>
                      <li><code>ArrayField</code> - Dynamic array of items</li>
                      <li><code>JSONField</code> - JSON editor</li>
                    </ul>
                  </mat-expansion-panel>
                </mat-accordion>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .field-examples-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 500;
    }

    .description {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 2rem;
    }

    .tab-content {
      padding: 2rem 0;
    }

    h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .example-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    mat-card {
      padding: 1rem;
    }

    mat-card-header {
      margin-bottom: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .example-code {
      margin: 1rem 0 0 0;
      padding: 0.75rem;
      background-color: #f5f5f5;
      border-radius: 4px;
      overflow-x: auto;
    }

    .example-code code {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #d32f2f;
    }

    .color-preview {
      margin-top: 1rem;
      padding: 2rem;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
      color: white;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .slider-container {
      margin-bottom: 1rem;
    }

    .slider-label,
    .slider-hint {
      color: rgba(0, 0, 0, 0.6);
    }

    .slider-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .slider-hint {
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }

    mat-accordion {
      margin-top: 1rem;
    }

    ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    li {
      margin: 0.5rem 0;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 1.5rem;
      }

      .tab-content {
        padding: 1rem 0;
      }
    }
  `]
})
export class FieldExamplesComponent {
  hidePassword = true;

  primitiveForm = new FormGroup({
    stringExample: new FormControl(''),
    integerExample: new FormControl<number | null>(null),
    decimalExample: new FormControl<number | null>(null),
    booleanExample: new FormControl(false),
    textAreaExample: new FormControl('')
  });

  selectionForm = new FormGroup({
    enumExample: new FormControl(''),
    multiEnumExample: new FormControl<string[]>([])
  });

  dateTimeForm = new FormGroup({
    dateExample: new FormControl<Date | null>(null)
  });

  specialForm = new FormGroup({
    sliderExample: new FormControl(50),
    colorExample: new FormControl('#3f51b5'),
    passwordExample: new FormControl('')
  });
}
