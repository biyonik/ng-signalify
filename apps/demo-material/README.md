# ng-signalify Material Demo Application

A comprehensive demo application showcasing **ng-signalify** integration with **Angular Material**.

## Overview

This demo application demonstrates the full capabilities of ng-signalify with Angular Material UI components, including:

- ✅ Full CRUD operations for Users and Products
- ✅ Material Table with pagination, sorting, and search
- ✅ Form validation using ng-signalify fields
- ✅ Loading states and error handling
- ✅ Responsive design
- ✅ Field examples showcase (24+ field types)
- ✅ Dashboard with statistics
- ✅ Mock data and state management with EntityStore

## Features

### 1. User Management
- **List View**: Material table with pagination, sorting, and search
- **Create/Edit Form**: Comprehensive form with all user fields
- **Validation**: Real-time validation with error messages
- **Fields**: StringField, IntegerField, EnumField, DateField, BooleanField, TextAreaField

### 2. Product Management
- **List View**: Product catalog with stock levels and pricing
- **Create/Edit Form**: Product form with advanced field types
- **Validation**: Price, stock, and SKU validation
- **Fields**: StringField, DecimalField, MultiEnumField, SliderField, ColorField

### 3. Dashboard
- **Stats Cards**: Total users, products, active users, stock levels
- **Quick Actions**: Navigate to different sections
- **Welcome Card**: Feature overview and navigation

### 4. Field Examples Showcase
Interactive demonstration of all ng-signalify field types:
- **Primitives**: String, Integer, Decimal, Boolean, TextArea
- **Selection**: Enum, MultiEnum, Relation
- **Date/Time**: Date, Time, DateTime, DateRange
- **Media**: Image, File
- **Special**: Slider, Color, Password
- **Complex**: Array, JSON

## Technology Stack

- **Angular**: 17+
- **Angular Material**: 17+
- **ng-signalify**: 2.0.0-beta.1
- **TypeScript**: 5.2+
- **RxJS**: 7.8+
- **Zod**: 3.22+ (validation)

## Project Structure

```
apps/demo-material/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── layout/           # Layout components
│   │   │   └── guards/           # Route guards
│   │   ├── features/
│   │   │   ├── users/            # User management
│   │   │   ├── products/         # Product management
│   │   │   ├── dashboard/        # Dashboard
│   │   │   └── field-examples/   # Field showcase
│   │   ├── shared/
│   │   │   ├── material.module.ts
│   │   │   └── components/       # Shared components
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── styles/                   # SCSS variables & mixins
│   ├── environments/             # Environment configs
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. **Install dependencies**:
```bash
cd apps/demo-material
npm install
```

2. **Start development server**:
```bash
npm start
```

3. **Open browser**:
```
http://localhost:4200
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm run lint` - Lint code

### Adding New Features

1. Create feature module in `src/app/features/`
2. Define models, fields, and store
3. Create list and form components
4. Add routes to feature routes file
5. Register in main `app.routes.ts`

### Using ng-signalify Fields

```typescript
import { StringField, IntegerField } from 'ng-signalify/fields';

export const myFields = [
  new StringField('name', 'Name', {
    required: true,
    min: 2,
    max: 50,
    hint: 'Enter your name'
  }),
  
  new IntegerField('age', 'Age', {
    required: true,
    min: 18,
    max: 120
  })
];
```

### Using EntityStore

```typescript
import { EntityStore } from 'ng-signalify/store';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MyEntityStore extends EntityStore<MyEntity> {
  constructor() {
    super({
      name: 'my-entities',
      selectId: (entity) => entity.id,
      defaultPageSize: 10,
      cacheTTL: 5 * 60 * 1000,
      optimistic: true
    });
  }

  protected async fetchAll(params: FetchParams) {
    // Implement API call
  }

  protected async fetchOne(id: EntityId) {
    // Implement API call
  }

  protected async createOne(data: Partial<MyEntity>) {
    // Implement API call
  }

  protected async updateOne(id: EntityId, data: Partial<MyEntity>) {
    // Implement API call
  }

  protected async deleteOne(id: EntityId) {
    // Implement API call
  }
}
```

## Key Concepts

### 1. Signal-First Architecture
ng-signalify uses Angular signals for reactive state management, providing:
- Better performance
- Simpler debugging
- Clearer data flow
- Type-safe reactivity

### 2. Material Adapter
The MaterialAdapter integrates ng-signalify with Angular Material:
```typescript
provideSigUI(new MaterialAdapter({
  defaultAppearance: 'outline',
  defaultFloatLabel: 'auto',
  defaultColor: 'primary',
  autoHints: true,
  autoAriaLabels: true
}))
```

### 3. EntityStore Pattern
Centralized state management for entities:
- Optimistic updates
- Caching with TTL
- Pagination support
- Filtering and sorting
- Error handling

## Documentation

All code includes bilingual documentation (TR/EN):

```typescript
/**
 * TR: Türkçe açıklama
 * EN: English explanation
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
```

## Best Practices

1. **Use standalone components** for better tree-shaking
2. **Leverage signals** for reactive state
3. **Implement proper error handling** with user feedback
4. **Add loading states** for better UX
5. **Follow Material Design** guidelines
6. **Write comprehensive validation** rules
7. **Use TypeScript strictly** for type safety

## Contributing

This is a reference implementation. Feel free to:
- Use it as a template for your projects
- Extend features
- Report issues
- Suggest improvements

## License

MIT License - Same as ng-signalify

## Author

**Ahmet ALTUN**
- GitHub: [@biyonik](https://github.com/biyonik)
- LinkedIn: [linkedin.com/in/biyonik](https://linkedin.com/in/biyonik)
- Email: ahmet.altun60@gmail.com

## Related Links

- [ng-signalify GitHub](https://github.com/biyonik/ng-signalify)
- [Angular Material](https://material.angular.io/)
- [Angular Documentation](https://angular.io/docs)

---

**Built with ❤️ using ng-signalify and Angular Material**
