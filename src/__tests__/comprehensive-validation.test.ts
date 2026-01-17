/**
 * Comprehensive Type Checking Test Suite for WireDI
 *
 * This file tests ALL type validation scenarios:
 * 1. Token duplication detection
 * 2. Listener duplication detection
 * 3. Type compatibility validation (LSP)
 * 4. Partial inheritance validation
 * 5. Factory/Value type safety
 * 6. Class token validation
 *
 * Tests are organized in two categories:
 * - VALID: Configurations that should compile without errors
 * - ERROR: Configurations that should fail with specific TypeScript errors
 *          (commented out with documentation of expected errors)
 */

import { defineBuilderConfig, definePartialConfig, type ContainerProvider } from '../index'

// ============================================================
// Test Types & Classes
// ============================================================

// Interfaces for type checking
interface LoggerInterface {
    log(message: string): void
    debug(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<{ id: string; name: string } | null>
    save(user: { id: string; name: string }): Promise<void>
}

interface ProductRepositoryInterface {
    findById(id: string): Promise<{ id: string; title: string } | null>
    findAll(): Promise<Array<{ id: string; title: string }>>
}

interface ConfigInterface {
    apiUrl: string
    timeout: number
    retries: number
}

// Correct implementations
class ConsoleLogger implements LoggerInterface {
    readonly __brand = 'ConsoleLogger' as const
    log(message: string): void {
        console.log(message)
    }
    debug(message: string): void {
        console.debug(message)
    }
}

class __FileLogger implements LoggerInterface {
    readonly __brand = '_FileLogger' as const
    log(message: string): void {
        console.log(`[FILE] ${message}`)
    }
    debug(message: string): void {
        console.debug(`[FILE] ${message}`)
    }
}

class UserRepository implements UserRepositoryInterface {
    readonly __brand = 'UserRepository' as const
    async findById(id: string) {
        return { id, name: 'Test User' }
    }
    async save(_user: { id: string; name: string }) {
        // Implementation
    }
}

class ProductRepository implements ProductRepositoryInterface {
    readonly __brand = 'ProductRepository' as const
    async findById(id: string) {
        return { id, title: 'Test Product' }
    }
    async findAll() {
        return []
    }
}

// Incorrect implementation for type mismatch tests
class __WrongLogger {
    readonly __brand = '_WrongLogger' as const
    // Missing log() and debug() methods - doesn't implement LoggerInterface
    write(message: string): void {
        console.log(message)
    }
}

// Events & Listeners
class UserCreatedEvent {
    readonly __brand = 'UserCreatedEvent' as const
    constructor(public readonly userId: string) {}
}

class UserUpdatedEvent {
    readonly __brand = 'UserUpdatedEvent' as const
    constructor(public readonly userId: string) {}
}

class ProductCreatedEvent {
    readonly __brand = 'ProductCreatedEvent' as const
    constructor(public readonly productId: string) {}
}

class EmailNotificationListener {
    readonly __brand = 'EmailNotificationListener' as const
    onEvent(_event: UserCreatedEvent): void {
        // Send email
    }
}

class SmsNotificationListener {
    readonly __brand = 'SmsNotificationListener' as const
    onEvent(_event: UserCreatedEvent): void {
        // Send SMS
    }
}

class AuditLogListener {
    readonly __brand = 'AuditLogListener' as const
    onEvent(_event: UserCreatedEvent | UserUpdatedEvent): void {
        // Log to audit
    }
}

// Services
class UserService {
    readonly __brand = 'UserService' as const
}

class ProductService {
    readonly __brand = 'ProductService' as const
}

class OrderService {
    readonly __brand = 'OrderService' as const
}

// Branded tokens for proper type checking
const TOKENS = {
    Logger: Symbol('Logger') as symbol & { __type: LoggerInterface },
    UserRepository: Symbol('UserRepository') as symbol & { __type: UserRepositoryInterface },
    ProductRepository: Symbol('ProductRepository') as symbol & { __type: ProductRepositoryInterface },
    Config: Symbol('Config') as symbol & { __type: ConfigInterface },
} as const

// ============================================================
// VALID TESTS - These should compile without errors
// ============================================================

export const validTests = {
    // ✅ Basic injection with provider
    basicProvider: defineBuilderConfig({
        builderId: 'valid.basic.provider',
        injections: [
            { token: TOKENS.Logger, provider: ConsoleLogger },
        ],
    }),

    // ✅ Multiple different providers
    multipleDifferentProviders: defineBuilderConfig({
        builderId: 'valid.multiple.providers',
        injections: [
            { token: TOKENS.Logger, provider: ConsoleLogger },
            { token: TOKENS.UserRepository, provider: UserRepository },
            { token: TOKENS.ProductRepository, provider: ProductRepository },
        ],
    }),

    // ✅ Factory with correct type
    factoryCorrectType: defineBuilderConfig({
        builderId: 'valid.factory.correct',
        injections: [
            {
                token: TOKENS.Logger,
                factory: (_provider: ContainerProvider): LoggerInterface => new ConsoleLogger(),
            },
        ],
    }),

    // ✅ Value with correct type
    valueCorrectType: defineBuilderConfig({
        builderId: 'valid.value.correct',
        injections: [
            {
                token: TOKENS.Config,
                value: (): ConfigInterface => ({
                    apiUrl: 'https://api.example.com',
                    timeout: 5000,
                    retries: 3,
                }),
            },
        ],
    }),

    // ✅ Class tokens
    classTokens: defineBuilderConfig({
        builderId: 'valid.class.tokens',
        injections: [
            { token: UserService },
            { token: ProductService },
            { token: OrderService },
        ],
    }),

    // ✅ Mixed injection types
    mixedTypes: defineBuilderConfig({
        builderId: 'valid.mixed.types',
        injections: [
            { token: TOKENS.Logger, provider: ConsoleLogger },
            { token: TOKENS.UserRepository, factory: () => new UserRepository() },
            { token: TOKENS.Config, value: () => ({ apiUrl: 'http://api.com', timeout: 5000, retries: 3 }) },
            { token: UserService },
        ],
    }),

    // ✅ Listeners - different listeners for same event
    listenersDifferentForSameEvent: defineBuilderConfig({
        builderId: 'valid.listeners.different',
        injections: [],
        listeners: [
            { event: UserCreatedEvent, listener: EmailNotificationListener },
            { event: UserCreatedEvent, listener: SmsNotificationListener },
        ],
    }),

    // ✅ Listeners - same listener for different events
    listenersSameForDifferentEvents: defineBuilderConfig({
        builderId: 'valid.listeners.same',
        injections: [],
        listeners: [
            { event: UserCreatedEvent, listener: AuditLogListener },
            { event: UserUpdatedEvent, listener: AuditLogListener },
        ],
    }),

    // ✅ Optional listeners
    optionalListeners: defineBuilderConfig({
        builderId: 'valid.no.listeners',
        injections: [
            { token: UserService },
        ],
        // listeners property omitted - OK
    }),

    // ✅ Partial with provider
    partialBasic: definePartialConfig({
        injections: [
            { token: TOKENS.Logger, provider: ConsoleLogger },
        ],
    }),

    // ✅ Config extending partial with different tokens
    configExtendsPartialDifferent: defineBuilderConfig({
        builderId: 'valid.partial.different',
        extends: [
            definePartialConfig({
                injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
            }),
        ],
        injections: [
            { token: TOKENS.UserRepository, provider: UserRepository },
        ],
    }),

    // ✅ Config extending partial with listeners
    configExtendsPartialListeners: defineBuilderConfig({
        builderId: 'valid.partial.listeners',
        extends: [
            definePartialConfig({
                listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
            }),
        ],
        injections: [],
        listeners: [
            { event: ProductCreatedEvent, listener: SmsNotificationListener },
        ],
    }),

    // ✅ Multiple partials
    multiplePartials: defineBuilderConfig({
        builderId: 'valid.multiple.partials',
        extends: [
            definePartialConfig({
                injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
            }),
            definePartialConfig({
                injections: [{ token: TOKENS.UserRepository, provider: UserRepository }],
            }),
        ],
        injections: [
            { token: UserService },
        ],
    }),
}

// ============================================================
// ERROR TESTS - These should produce TypeScript errors
// Uncomment to verify error detection
// ============================================================

/*
// ❌ ERROR: Duplicate token in same array
const errorDuplicateToken = defineBuilderConfig({
    builderId: 'error.duplicate.token',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, provider: _FileLogger }, // ❌ Duplicate!
        // Expected error: 'provider' does not exist in type { error: "..."; token: ...; hint: "..." }
    ],
})

// ❌ ERROR: Duplicate class token
const errorDuplicateClassToken = defineBuilderConfig({
    builderId: 'error.duplicate.class',
    injections: [
        { token: UserService },
        { token: UserService }, // ❌ Duplicate!
        // Expected error: Type error on second entry
    ],
})

// ❌ ERROR: Token already in partial
const errorTokenInPartial = defineBuilderConfig({
    builderId: 'error.token.partial',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
        }),
    ],
    injections: [
        { token: TOKENS.Logger, provider: _FileLogger }, // ❌ Already in partial!
        // Expected error: 'provider' does not exist in type { error: "..."; token: ...; hint: "..." }
    ],
})

// ❌ ERROR: Duplicate listener (same event + same listener)
const errorDuplicateListener = defineBuilderConfig({
    builderId: 'error.duplicate.listener',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener },
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Duplicate!
        // Expected error: Type missing properties 'error', 'hint'
    ],
})

// ❌ ERROR: Listener already in partial
const errorListenerInPartial = defineBuilderConfig({
    builderId: 'error.listener.partial',
    extends: [
        definePartialConfig({
            listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
        }),
    ],
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Already in partial!
        // Expected error: Type missing properties 'error', 'hint'
    ],
})

// ❌ ERROR: Type mismatch - provider doesn't implement interface
// Note: This is detected by the LSP plugin, not by TypeScript alone
const errorTypeMismatch = defineBuilderConfig({
    builderId: 'error.type.mismatch',
    injections: [
        { token: TOKENS.Logger, provider: _WrongLogger }, // ❌ _WrongLogger doesn't implement LoggerInterface
        // Expected LSP error: Type incompatible
    ],
})

// ❌ ERROR: Factory returns wrong type
const errorFactoryWrongType = defineBuilderConfig({
    builderId: 'error.factory.wrong',
    injections: [
        {
            token: TOKENS.Logger,
            factory: () => new UserRepository(), // ❌ Returns UserRepository instead of LoggerInterface
            // Expected: Type error (but may not be caught without proper typing)
        },
    ],
})

// ❌ ERROR: Value returns wrong type
const errorValueWrongType = defineBuilderConfig({
    builderId: 'error.value.wrong',
    injections: [
        {
            token: TOKENS.Config,
            value: () => ({ wrongProperty: 'test' }), // ❌ Doesn't match ConfigInterface
            // Expected: Type error (but may not be caught without proper typing)
        },
    ],
})

// ❌ ERROR: Multiple duplicates (complex case)
const errorMultipleDuplicates = defineBuilderConfig({
    builderId: 'error.multiple',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, factory: () => new _FileLogger() }, // ❌ Duplicate
        { token: UserService },
        { token: UserService }, // ❌ Duplicate
    ],
})

// ❌ ERROR: Cross-partial duplication
const errorCrossPartialDuplication = defineBuilderConfig({
    builderId: 'error.cross.partial',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
            listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
        }),
    ],
    injections: [
        { token: TOKENS.Logger, provider: _FileLogger }, // ❌ Already in partial
    ],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Already in partial
    ],
})
*/

// ============================================================
// Export for test reporting
// ============================================================

console.log('✅ All valid configurations compiled successfully')
console.log('📝 To test error cases, uncomment the ERROR TESTS section')

