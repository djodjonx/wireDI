# Type Checking Without Decorators

## Overview

`@djodjonx/wiredi` provides **compile-time type checking** that works **independently of decorators**. The type validation happens at the configuration level, not at the decorator level.

## How It Works

### 1. Configuration-Based Type Checking

Type checking occurs when you define your builder configuration, NOT when you use decorators:

```typescript
import { defineBuilderConfig } from '@djodjonx/wiredi'

// ❌ This will show a type error EVEN WITHOUT decorators
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        // Type mismatch detected by TypeScript
        { token: TOKENS.Logger, provider: UserService }, // ❌ Error!
    ],
    // listeners is optional
})
```

### 2. Works With All DI Containers

#### With Decorators (tsyringe, InversifyJS)

```typescript
import { injectable, inject } from 'tsyringe'

@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface
    ) {}
}

// Type checking still works
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ✅ Checked
        { token: UserService } // ✅ Checked
    ],
    // listeners is optional
})
```

#### Without Decorators (Awilix)

```typescript
// NO decorators needed
class UserService {
    constructor({ logger, userRepository }) {
        this.logger = logger
        this.userRepository = userRepository
    }
}

// Type checking STILL works at config level
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ✅ Checked
        { token: UserService } // ✅ Checked
    ],
    // listeners is optional
})
```

## Type Checking Levels

### Level 1: Configuration Type Safety (Always Active)

This works **without any decorators**:

```typescript
interface LoggerInterface {
    log(message: string): void
}

class ConsoleLogger implements LoggerInterface {
    log(message: string) {
        console.log(message)
    }
}

class FileLogger {
    write(data: string) { // Different method name
        // ...
    }
}

// ❌ TypeScript catches this mismatch
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        {
            token: TOKENS.Logger,
            provider: FileLogger // ❌ Type error: doesn't match LoggerInterface
        }
    ],
    // listeners is optional
})
```

### Level 2: Plugin Validation (IDE Integration)

The TypeScript Language Service Plugin provides additional validation:

```typescript
// Plugin checks:
// 1. Missing dependencies
// 2. Circular dependencies
// 3. Token consistency
// 4. Type compatibility

// ❌ Plugin detects missing Logger dependency
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: UserService } // UserService needs Logger, but it's not registered
    ],
    // listeners is optional
})
```

## Examples Without Decorators

### Example 1: Plain Classes (No Decorators)

```typescript
import { defineBuilderConfig, ProviderLifecycle } from '@djodjonx/wiredi'

// Define interfaces
interface LoggerInterface {
    log(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<User | null>
}

// Plain classes - NO decorators
class ConsoleLogger implements LoggerInterface {
    log(message: string): void {
        console.log(`[LOG] ${message}`)
    }
}

class InMemoryUserRepository implements UserRepositoryInterface {
    async findById(id: string): Promise<User | null> {
        // Implementation
        return null
    }
}

class UserService {
    constructor(
        private logger: LoggerInterface,
        private repository: UserRepositoryInterface
    ) {}
}

// Define tokens
const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepository: Symbol('UserRepository'),
}

// Configuration with type checking
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        // ✅ Type checked: ConsoleLogger implements LoggerInterface
        {
            token: TOKENS.Logger,
            provider: ConsoleLogger,
            lifecycle: ProviderLifecycle.Singleton
        },

        // ✅ Type checked: InMemoryUserRepository implements UserRepositoryInterface
        {
            token: TOKENS.UserRepository,
            provider: InMemoryUserRepository
        },

        // ✅ Type checked: UserService is a valid class
        { token: UserService }
    ],
    // listeners is optional
})
```

### Example 2: Factory Functions (No Decorators)

```typescript
// Using factories instead of classes
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        {
            token: TOKENS.Logger,
            factory: (provider) => {
                // ✅ Type checked: return type inferred
                return new ConsoleLogger()
            }
        },
        {
            token: TOKENS.UserService,
            factory: (provider) => {
                // ✅ Type checked: resolve returns correct types
                const logger = provider.resolve<LoggerInterface>(TOKENS.Logger)
                const repo = provider.resolve<UserRepositoryInterface>(TOKENS.UserRepository)
                return new UserService(logger, repo)
            }
        }
    ],
    // listeners is optional
})
```

### Example 3: Value Injection (No Decorators)

```typescript
// Configuration values
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        {
            token: TOKENS.ApiUrl,
            value: (context) => {
                // ✅ Type checked: return type inferred
                return context?.env === 'production'
                    ? 'https://api.prod.com'
                    : 'https://api.dev.com'
            }
        }
    ],
    // listeners is optional
})
```

## Type Checking Features

### 1. Interface Implementation Checking

```typescript
interface ServiceInterface {
    execute(): void
}

class ServiceA implements ServiceInterface {
    execute() { /* ... */ }
}

class ServiceB {
    run() { /* ... */ } // Different method
}

// ✅ Works - ServiceA implements ServiceInterface
{ token: TOKENS.Service, provider: ServiceA }

// ❌ Error - ServiceB doesn't implement ServiceInterface
{ token: TOKENS.Service, provider: ServiceB }
```

### 2. Token Collision Detection

```typescript
const partial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }
    ],
    // listeners is optional
})

const config = defineBuilderConfig({
    builderId: 'app',
    extends: [partial],
    injections: [
        // ❌ Error: Token collision without override
        { token: TOKENS.Logger, provider: FileLogger }

        // ✅ OK: With override flag
        { token: TOKENS.Logger, provider: FileLogger, override: true }
    ],
    // listeners is optional
})
```

### 3. Dependency Resolution Checking

The plugin checks dependencies even without decorators:

```typescript
// Plugin validates this configuration
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: UserService } // ❌ Plugin: Missing Logger dependency
    ],
    // listeners is optional
})
```

## Comparison: With vs Without Decorators

| Feature | With Decorators | Without Decorators | wireDI       |
|---------|-----------------|-------------------|--------------|
| Type Safety | ✅ | ⚠️ Manual | ✅ Automatic  |
| Config Validation | ❌ | ❌ | ✅            |
| Dependency Detection | Runtime | Runtime | Compile-time |
| IDE Support | Limited | Limited | ✅ Full       |
| Framework Agnostic | ❌ | ✅ | ✅            |

## Real-World Example: Mixed Approach

You can mix decorated and non-decorated classes:

```typescript
import { injectable } from 'tsyringe'

// With decorator (for tsyringe auto-wiring)
@injectable()
class DatabaseService {
    constructor(private config: Config) {}
}

// Without decorator (manually registered)
class Config {
    constructor(public apiUrl: string) {}
}

// Both are type-checked by wiredi
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        // ✅ Type checked - no decorator needed
        {
            token: Config,
            factory: () => new Config('https://api.example.com')
        },

        // ✅ Type checked - decorator is for tsyringe, not for type checking
        { token: DatabaseService }
    ],
    // listeners is optional
})
```

## Benefits of Decorator-Independent Type Checking

### 1. Framework Flexibility

```typescript
// Works with ANY framework or no framework at all
class MyService {
    // No decorators required
}

const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: MyService } // ✅ Type checked
    ],
    // listeners is optional
})
```

### 2. Gradual Migration

```typescript
// Mix old and new code
class LegacyService {
    // No decorators
}

@injectable()
class ModernService {
    // With decorators
}

// Both work and are type-checked
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: LegacyService }, // ✅
        { token: ModernService }  // ✅
    ],
    // listeners is optional
})
```

### 3. Testing Flexibility

```typescript
// Easy to mock without decorator metadata
class MockLogger implements LoggerInterface {
    log() { /* test stub */ }
}

const testConfig = defineBuilderConfig({
    builderId: 'test',
    injections: [
        { token: TOKENS.Logger, provider: MockLogger } // ✅ Type checked
    ],
    // listeners is optional
})
```

## Limitations

### What Decorators DO Provide

Decorators are used by the **DI container** (not by wireDI) for:

1. **Automatic dependency injection** - Container knows what to inject
2. **Metadata reflection** - Container reads constructor parameters
3. **Auto-wiring** - Container resolves dependencies automatically

### What wireDI Provides

wiredi provides **configuration-level type checking**:

1. ✅ Type compatibility validation
2. ✅ Token collision detection
3. ✅ Missing dependency detection (plugin)
4. ✅ Interface implementation checking

## Best Practices

### 1. Use Interfaces for Type Checking

```typescript
// Define clear interfaces
interface LoggerInterface {
    log(message: string): void
}

// Implement interfaces (with or without decorators)
class ConsoleLogger implements LoggerInterface {
    log(message: string) { /* ... */ }
}

// Type checking works on interface compliance
{ token: TOKENS.Logger, provider: ConsoleLogger } // ✅
```

### 2. Leverage Symbol Tokens

```typescript
// Use symbols for interface-based injection
const TOKENS = {
    Logger: Symbol('Logger'),
    Database: Symbol('Database'),
}

// Type checking works on symbol tokens
{ token: TOKENS.Logger, provider: ConsoleLogger }
```

### 3. Enable Plugin for Full Validation

```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "@djodjonx/wiredi/plugin" }
    ]
  }
}
```

## Conclusion

**wiredi's type checking is decorator-independent**:

- ✅ Works with plain classes
- ✅ Works with or without decorators
- ✅ Validates at configuration time
- ✅ Framework agnostic
- ✅ Full TypeScript type safety

The decorators are only needed **by the DI container** for runtime injection, not for compile-time type checking.

---

**Type checking happens at the configuration level, making it work with any code style!** ✅

