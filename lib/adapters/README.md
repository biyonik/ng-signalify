# ng-signalify Adapters

Adapters bridge ng-signalify's logic layer with UI libraries.

## Available Adapters

### Material Adapter

For Angular Material projects:

```typescript
// app.config.ts
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

export const appConfig = {
  providers: [
    provideSigUI(new MaterialAdapter())
  ]
};
```

### Headless Adapter

For custom UI or other libraries:

```typescript
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';

export const appConfig = {
  providers: [
    provideSigUI(new HeadlessAdapter())
  ]
};
```

## Usage Example

```typescript
import { Component } from '@angular/core';
import { StringField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field>
      <mat-label>Name</mat-label>
      <input matInput 
        [value]="form.fields.name.value()" 
        (input)="form.fields.name.value.set($any($event.target).value)" />
      @if (form.fields.name.error() && form.fields.name.touched()) {
        <mat-error>{{ form.fields.name.error() }}</mat-error>
      }
    </mat-form-field>
  `
})
export class ExampleComponent {
  fields = [
    new StringField('name', 'Name', { required: true, min: 2 })
  ];
  
  form = createEnhancedForm(this.fields);
}
```

## Creating Custom Adapters

Extend `BaseFormAdapter`:

```typescript
import { BaseFormAdapter } from 'ng-signalify/adapters';

export class MyCustomAdapter extends BaseFormAdapter {
  readonly name = 'my-custom-ui';
  readonly version = '1.0.0';
  
  getInputComponent() { return MyInputComponent; }
  getSelectComponent() { return MySelectComponent; }
  // ... implement other methods
}
```
