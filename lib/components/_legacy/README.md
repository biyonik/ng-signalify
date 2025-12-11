# ⚠️ Legacy Components (Deprecated)

These components are **deprecated** as of v2.0.0.

## Why Deprecated?

ng-signalify is now a **UI-agnostic logic framework**. Use adapters with your preferred UI library instead.

## Migration

**Before (v1.x):**
```typescript
import { SigInput } from 'ng-signalify/components';
```

**After (v2.x):**
```typescript
import { MatInput } from '@angular/material/input';
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';
```

Or use core wrapper:
```typescript
import { SigFormField } from 'ng-signalify/components/core';
```

## Timeline

- **v2.0** - Moved to _legacy
- **v3.0** - Removed from package

See [Migration Guide](../../../MIGRATION.md) for details.
